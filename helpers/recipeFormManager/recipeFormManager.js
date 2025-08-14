import EventHandler from "../eventHandler.js";
import RequestHelper from "../requestHelper.js";
import GlobalConfig from "../../config.js";
import toastService from "../toastService.js";
import ContentLoader from "../contentLoader.js"
import eventEmitter from "../../helpers/eventEmitter.js";

export default class RecipeFormManager {
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
        const htmlLoaded = await ContentLoader.loadHtml(containerElement, this.htmlPath);
        if (!htmlLoaded)
            Logger.log(`No HTML loaded for : ${path}`, GlobalConfig.LOG_LEVEL.WARNING);

        await ContentLoader.loadCss(containerElement, this.cssPath);
    }

    async renderAddForm() {
        const contentArea = document.querySelector(`#${GlobalConfig.domIds.contentArea}`);
        await this.renderForm(contentArea);
        document.querySelector(`#${this.domIds.recipeEditButton}`).classList.add('hidden-btn');
        document.querySelector(`#${this.domIds.recipeCloseButton}`).classList.add('hidden-btn');

        EventHandler.overwriteEvent({
            'id': 'recipeAdd',
            'eventType': 'submit',
            'element': document.querySelector(`#${this.domIds.recipeForm}`),
            'callback': (event) => this.handleNewRecipeSubmit(event)
        });
    }

    async renderEditForm({ oldRecipe, containerElement }) {
        // Store recipe card
        this.recipeCard = containerElement.cloneNode(true);

        await this.renderForm(containerElement);
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
            title: formData.get('title'),
            ingredients: formData.get('ingredients').split('\n').map(item => item.trim()).filter(item => item !== ''),
            instructions: formData.get('instructions'),
            prepTime: formData.get('prepTime'),
            cookTime: formData.get('cookTime')
        };

        await this.postRecipe(newRecipe); // Post the new recipe to the server
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
            title: formData.get('title'),
            ingredients: formData.get('ingredients').split('\n').map(item => item.trim()).filter(item => item !== ''),
            instructions: formData.get('instructions'),
            prepTime: formData.get('prepTime'),
            cookTime: formData.get('cookTime'),
        };

        const recipeUpdated = await this.patchRecipe(updatedRecipe); // Post the new recipe to the server
        if (recipeUpdated) {
            console.log('Recipe updated:', updatedRecipe);
            eventEmitter.emit('recipe:edit', updatedRecipe);
        }
    }

    async postRecipe(newRecipe) {
        const content = {
            Path: this.recipesNotepadPath,
            Type: 'json',
            Name: newRecipe.title,
            Text: JSON.stringify(newRecipe)
        };

        const response = await RequestHelper.PostJsonWithAuth(this.addNotepadUrl, content);

        if (response?.error) {
            toastService.addToast('Failed to add recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
        console.log('Recipe added:', newRecipe);
        toastService.addToast(`Recipe added: ${newRecipe.title}.`, GlobalConfig.LOG_LEVEL.INFO);
    }

    async patchRecipe(updatedRecipe) {
        const content = {
            Path: this.recipesNotepadPath,
            Type: 'json',
            Name: updatedRecipe.title,
            Text: JSON.stringify(updatedRecipe),
            Id: this.editRecipeId // Include the recipe ID for updating
        };

        const response = await RequestHelper.PutJsonWithAuth(this.updateNotepadUrl, content);

        if (response?.error) {
            toastService.addToast('Failed to update recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
        toastService.addToast('Recipe updated.', GlobalConfig.LOG_LEVEL.INFO);
        return true;
    }
}