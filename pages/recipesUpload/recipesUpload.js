
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import EventHandler from "../../helpers/eventHandler.js";
import RequestHelper from "../../helpers/requestHelper.js";

class RecipesUpload {
    recipeForm = document.getElementById('recipeForm');
    recipeForm = document.getElementById('recipeForm');

    constructor() {
        toastService.addToast('On Recipes Upload Page.', GlobalConfig.LOG_LEVEL.INFO, true);
    }

    init() {
        // recipeForm.addEventListener('submit', handleFormSubmit);
        EventHandler.overwriteEvent({
            'id': 'recipeUpload',
            'eventType': 'submit',
            'element': this.recipeForm,
            'callback': (event) => this.handleFormSubmit(event)
        });
    }

    /**
     * Handles the recipe form submission.
     * @param {Event} event - The form submission event.
     */
    async handleFormSubmit(event) {
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

        console.log('New recipe added:', newRecipe);
    }

    async postRecipe(recipe) {
        const content = {
            Path: 'home/Recipes/Json',
            Type: 'json',
            Name: recipe.title,
            Text: JSON.stringify(recipe)
        };

        const url = `${GlobalConfig.apis.recipes}/AddNotepad`;
        const response = await RequestHelper.PostJsonWithAuth(url, content);

        if (response?.error) {
            toastService.addToast('Failed to add recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            return false;
        }
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { const recipeUpload = new RecipesUpload(); recipeUpload.init(); } }
