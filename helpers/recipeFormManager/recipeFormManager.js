import EventHandler from "../eventHandler.js";
import RequestHelper from "../requestHelper.js";
import GlobalConfig from "../../config.js";
import toastService from "../toastService.js";
import ContentLoader from "../contentLoader.js"
import eventEmitter from "../../helpers/eventEmitter.js";
import LoadingScreen from '../../helpers/loadingScreen.js'

export default class RecipeFormManager {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        addButton: 'add-btn',
        editButton: 'edit-btn',
        closeButton: 'close-btn',
    });

    domIds = Object.freeze({
        recipeAddButton: 'recipeAddButton',
        recipeEditButton: 'recipeEditButton',
        recipeCloseButton: 'recipeCloseButton',
        recipeForm: 'recipeForm',
    });

    htmlPath = 'helpers/recipeFormManager/recipeFormManager.html';
    cssPath = 'helpers/recipeFormManager/recipeFormManager.css';

    recipesNotepadPath = 'home/Recipes/Json';

    addNotepadUrl = `${GlobalConfig.apis.recipes}/AddNotepad`;
    updateNotepadUrl = `${GlobalConfig.apis.recipes}/UpdateNotepad`;

    editRecipeId = -1;

    async renderForm(containerElement) {
        const htmlLoaded = await ContentLoader.loadHtml(containerElement, this.htmlPath, this.signal);
        if (!htmlLoaded)
            Logger.log(`No HTML loaded for : ${path}`, GlobalConfig.LOG_LEVEL.WARNING);

        ContentLoader.loadCss(containerElement, this.cssPath);
    }

    async renderAddForm({signal}) {
        this.signal = signal

        const contentArea = document.querySelector(`#${GlobalConfig.domIds.contentArea}`);

        LoadingScreen.showFullScreenLoader();
        await this.renderForm(contentArea);
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        document.querySelector(`#${this.domIds.recipeEditButton}`).classList.add('hidden-btn');
        document.querySelector(`#${this.domIds.recipeCloseButton}`).classList.add('hidden-btn');

        EventHandler.overwriteEvent({
            'id': 'recipeAdd',
            'eventType': 'submit',
            'element': document.querySelector(`#${this.domIds.recipeForm}`),
            'callback': (event) => this.handleNewRecipeSubmit(event)
        });
    }

    async renderEditForm({ oldRecipe, containerElement, signal }) {
        this.signal = signal;

        // Store recipe card
        this.recipeCard = containerElement.cloneNode(true);

        LoadingScreen.showFullScreenLoader();
        await this.renderForm(containerElement);
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        containerElement.querySelector(`#${this.domIds.recipeAddButton}`).classList.add('hidden-btn');

        this.editRecipeId = oldRecipe.id;

        // Populate the form with existing recipe data 
        containerElement.querySelector(`#${this.domIds.recipeForm}`).ingredients.value = oldRecipe.ingredients.join('\n');
        containerElement.querySelector(`#${this.domIds.recipeForm}`).title.value = oldRecipe.title;
        containerElement.querySelector(`#${this.domIds.recipeForm}`).instructions.value = oldRecipe.instructions;
        containerElement.querySelector(`#${this.domIds.recipeForm}`).prepTime.value = oldRecipe.prepTime || '';
        containerElement.querySelector(`#${this.domIds.recipeForm}`).cookTime.value = oldRecipe.cookTime || '';

        EventHandler.overwriteEvent({
            'id': 'recipeEdit',
            'eventType': 'submit',
            'element': document.querySelector(`#${this.domIds.recipeForm}`),
            'callback': (event) => this.handleEditRecipeSubmit(event)
        });

        EventHandler.overwriteEvent({
            'id': 'recipeEditClose',
            'eventType': 'click',
            'element': document.querySelector(`#${this.domIds.recipeCloseButton}`),
            'callback': (event) => {
                event.preventDefault(); // Prevent default action
                containerElement.replaceWith(this.recipeCard.cloneNode(true)); // Clear the container element
                toastService.addToast('Edit cancelled.', GlobalConfig.LOG_LEVEL.INFO); // Optional: Show a toast message
            }
        });
    }

    generateFormHtml(mode) {
        // add html to page
        const recipeFormHolder = document.createElement('div');
        recipeFormHolder.innerHTML = this.getPageHtml(mode);

        // add css to page
        const style = document.createElement('style');
        style.textContent = this.getPageCss();
        recipeFormHolder.appendChild(style);

        return recipeFormHolder;
    }

    /**
     * Handles the recipe form submission.
     * @param {Event} event - The form submission event.
     */
    async handleNewRecipeSubmit(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        const formData = new FormData(recipeForm);
        const newRecipe = {
            Title: formData.get('title'),
            Ingredients: formData.get('ingredients').split('\n').map(item => item.trim()).filter(item => item !== ''),
            Instructions: formData.get('instructions'),
            PrepTime: formData.get('prepTime'),
            CookTime: formData.get('cookTime')
        };

        LoadingScreen.showFullScreenLoader();
        const recipePosted = await this.postRecipe(newRecipe); // Post the new recipe to the server
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        if (recipePosted)
            recipeForm.reset(); // Clear the form fields
    }

    /**
     * Handles the recipe form update submission.
     * @param {Event} event - The form update event.
     */
    async handleEditRecipeSubmit(event) {
        event.preventDefault(); // Prevent default form submission and page reload

        const formData = new FormData(recipeForm);
        const updatedRecipe = {
            Title: formData.get('title'),
            Ingredients: formData.get('ingredients').split('\n').map(item => item.trim()).filter(item => item !== ''),
            Instructions: formData.get('instructions'),
            PrepTime: formData.get('prepTime'),
            CookTime: formData.get('cookTime'),
        };

        LoadingScreen.showFullScreenLoader();
        const recipeUpdated = await this.putRecipe(updatedRecipe); // Post the new recipe to the server
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        if (recipeUpdated) {
            toastService.addToast('Recipe updated', GlobalConfig.LOG_LEVEL.INFO);
            eventEmitter.emit('recipe:edit', updatedRecipe);
        }
    }

    async postRecipe(newRecipe) {
        const url = `${GlobalConfig.apis.recipes}/PostRecipe`;
        const response = await RequestHelper.PostJsonWithAuth(url, newRecipe, { signal: this.signal });
        if (response?.error) {
            toastService.addToast('Failed to add recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
        console.log('Recipe added:', newRecipe);
        toastService.addToast(`Recipe added: ${newRecipe.Title}.`, GlobalConfig.LOG_LEVEL.INFO);
        return true;
    }

    async putRecipe(updatedRecipe) {
        const url = `${GlobalConfig.apis.recipes}/PutRecipe/${this.editRecipeId}`;
        const response = await RequestHelper.PutJsonWithAuth(url, updatedRecipe, this.signal);

        if (response?.error) {
            toastService.addToast('Failed to update recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
        return true;
    }
}
