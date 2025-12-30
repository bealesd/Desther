import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import EventHandler from "../../helpers/eventHandler.js";
import RequestHelper from "../../helpers/requestHelper.js";
import RecipeFormManager from "../../helpers/recipeFormManager/recipeFormManager.js";
import eventEmitter from "../../helpers/eventEmitter.js";
import LoadingScreen from "../../helpers/loadingScreen.js";
import DeleteModal from "../../helpers/delete-modal/delete-modal.js";

class RecipeApp {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        recipeCard: 'recipe-card',
    });

    domIds = Object.freeze({
        recipesContainer: 'recipesContainer',
        searchInput: 'searchInput',
        expandAllBtn: 'expandAllBtn',
        collapseAllBtn: 'collapseAllBtn',
        noRecipesMessage: 'noRecipesMessage',
    });

    getRecipesUrl = `${GlobalConfig.apis.recipes}/GetNotepadDirectChildren?path=home/Recipes/Json`;

    constructor() {
        toastService.addToast('On Recipes View Page.', GlobalConfig.LOG_LEVEL.INFO, true);

        // Listen for recipe edit events to re-render recipes
        eventEmitter.on('recipe:edit', () => {
            this.init();
        });
    }

    // Initialization method
    async init() {
        LoadingScreen.showFullScreenLoader();

        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        this.recipes = await this.getRecipes();
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        this.expandedRecipes = new Set(); // Set to store titles of expanded recipes to maintain state

        // Get references to HTML elements
        this.recipesContainer = document.getElementById(this.domIds.recipesContainer);
        this.searchInput = document.getElementById(this.domIds.searchInput);
        this.expandAllBtn = document.getElementById(this.domIds.expandAllBtn);
        this.collapseAllBtn = document.getElementById(this.domIds.collapseAllBtn);
        this.noRecipesMessage = document.getElementById(this.domIds.noRecipesMessage);

        // Bind event listeners
        this.addEventListeners();

        this.renderRecipes();

        this.handleRecipeCardClick(); // Handle clicks on recipe cards
    }

    async getRecipe(id) {
        const url = `${GlobalConfig.apis.recipes}/GetNotepad?id=${id}`

        const recipe = await RequestHelper.GetJsonWithAuth(url, this.signal);
        if (recipe?.error)
            return {};

        return recipe.Text ? JSON.parse(recipe.Text) : {};
    }

    addEventListeners() {
        EventHandler.overwriteEvent({
            'id': 'renderRecipes',
            'eventType': 'keydown',
            'element': this.searchInput,
            'callback': (event) => this.renderRecipes(event.target.value)
        });

        EventHandler.overwriteEvent({
            'id': 'expandAllRecipes',
            'eventType': 'click',
            'element': this.expandAllBtn,
            'callback': () => this.expandAllRecipes()
        });

        EventHandler.overwriteEvent({
            'id': 'collapseAllRecipes',
            'eventType': 'click',
            'element': this.collapseAllBtn,
            'callback': () => this.collapseAllRecipes()
        });
    }

    /**
     * Renders recipes into the recipesContainer, filtered by search term.
     * @param {string} searchTerm - Optional search term to filter recipes.
     */
    renderRecipes(searchTerm = '') {
        // Clear previous recipes, but keep the no recipes message
        Array.from(this.recipesContainer.children).forEach(child => {
            if (child.id !== this.domIds.noRecipesMessage) {
                child.remove();
            }
        });

        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        this.filteredRecipes = this.recipes.filter(recipe => {
            if (lowerCaseSearchTerm === '') return true; // Show all if no search term

            // Check title
            if (recipe.title.toLowerCase().includes(lowerCaseSearchTerm)) return true;
            // Check ingredients
            if (recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseSearchTerm))) return true;
            // Check instructions
            if (recipe.instructions.toLowerCase().includes(lowerCaseSearchTerm)) return true;

            return false;
        });

        if (this.filteredRecipes.length === 0) {
            this.noRecipesMessage.style.display = 'block'; // Show "No recipes found" message
            return;
        } else {
            this.noRecipesMessage.style.display = 'none'; // Hide the message
        }

        this.filteredRecipes.forEach((recipe, index) => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            recipeCard.dataset.editing = false;

            // Check if this recipe was previously expanded
            if (this.expandedRecipes.has(recipe.id)) {
                recipeCard.classList.add('expanded');
            }

            recipeCard.innerHTML = `
                        <div data-recipe-id=${recipe.id} class="recipe-card-header">
                            <h3>${recipe.title}</h3>
                            <span class="toggle-icon">${this.expandedRecipes.has(recipe.id) ? '&#9660;' : '&#9658;'}</span>
                        </div>
                        <div class="recipe-card-content">
                            ${recipe.prepTime || recipe.cookTime ? `<p class="text-sm"><strong>Prep:</strong> ${recipe.prepTime || 'N/A'} | <strong>Cook:</strong> ${recipe.cookTime || 'N/A'}</p>` : ''}
                            <div>
                                <strong>Ingredients:</strong>
                                <ul>
                                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <strong>Instructions:</strong>
                                <p class="whitespace-pre-wrap">${recipe.instructions}</p>
                            </div>
                            <div class="flex-justify-end">
                                <button class="edit-btn">Edit</button>
                                <button class="delete-btn">Delete</button>
                            </div>
                        </div>
                    `;

            this.recipesContainer.appendChild(recipeCard);
        });
    }

    /**
     * Handles click events on recipe cards for edit, delete, and expand/collapse actions.
     * This method is bound to the recipesContainer element.
     * It uses event delegation to handle clicks on recipe cards.
     */
    handleRecipeCardClick() {
        this.recipesContainer.addEventListener('click', (event) => {
            if (document.querySelector('#noRecipesMessage')?.checkVisibility())
                return; // Ignore clicks if no recipes are displayed

            const recipeCard = event.target.closest('.recipe-card');
            if (!recipeCard) return; // Ignore clicks outside recipe cards

            const notEditing = recipeCard.dataset.editing !== 'true';
            if (!notEditing)
                return; // Ignore clicks if the card is in edit mode

            const stringRecipeId = recipeCard.querySelector('.recipe-card-header')?.dataset?.recipeId;
            const recipeId = Number(stringRecipeId, 10);
            if (isNaN(recipeId)) {
                toastService.addToast(`Invalid recipe ID: ${stringRecipeId}.`, GlobalConfig.LOG_LEVEL.ERROR);
                return; // Ignore clicks if recipeId is not a valid number
            }
            const recipe = this.filteredRecipes.find(recipe => recipe.id === recipeId);

            const isDeleteBtnClick = event.target.classList.contains('delete-btn');
            const isEditBtnClick = event.target.classList.contains('edit-btn');

            if (isDeleteBtnClick) {
                this.deleteRecipe(recipe.id)
            }
            else if (isEditBtnClick) {
                this.recipeFormManager = new RecipeFormManager();
                this.recipeFormManager.renderEditForm({ oldRecipe: recipe, containerElement: recipeCard, signal: this.signal });
                recipeCard.dataset.editing = true;
            }
            else {
                if (notEditing)
                    this.toggleExpand(recipe.title, recipeCard);
            }
        });
    }

    /**
     * Toggles the expanded state of a recipe card.
     * @param {string} recipeTitle - The title of the recipe (used as a unique ID for state).
     * @param {HTMLElement} cardElement - The recipe card DOM element.
     */
    toggleExpand(recipeId, cardElement) {
        const isExpanded = cardElement.classList.contains('expanded');
        if (isExpanded) {
            cardElement.classList.remove('expanded');
            this.expandedRecipes.delete(recipeId);
            cardElement.querySelector('.toggle-icon').innerHTML = '&#9658;'; // Right arrow
        } else {
            cardElement.classList.add('expanded');
            this.expandedRecipes.add(recipeId);
            cardElement.querySelector('.toggle-icon').innerHTML = '&#9660;'; // Down arrow
        }
    }

    /**
     * Expands all currently displayed recipe cards.
     */
    expandAllRecipes() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const id = card.querySelector('h3').dataset.id;
            if (!card.classList.contains('expanded')) {
                card.classList.add('expanded');
                this.expandedRecipes.add(id);
                card.querySelector('.toggle-icon').innerHTML = '&#9660;'; // Down arrow
            }
        });
    }

    /**
     * Collapses all currently displayed recipe cards.
     */
    collapseAllRecipes() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const id = card.querySelector('h3').dataset.id;
            if (card.classList.contains('expanded')) {
                card.classList.remove('expanded');
                this.expandedRecipes.delete(id);
                card.querySelector('.toggle-icon').innerHTML = '&#9658;'; // Right arrow
            }
        });
    }

    async getRecipes() {
        const recipes = [];
        const getRecipesUrl = `${GlobalConfig.apis.recipes}/GetRecipes`;
        const recipeResults = await RequestHelper.GetJsonWithAuth(getRecipesUrl, this.signal);
        if (recipeResults?.error)
            return [];

        for (const recipe of recipeResults) {
            recipes.push({
                title: recipe.Title,
                ingredients: recipe.Ingredients,
                instructions: recipe.Instructions,
                id: recipe.Id,
                prepTime: recipe.PrepTime,
                cookTime: recipe.CookTime
            });
        }
        return recipes;
    }

    /**
     * Deletes a recipe from the array based on its title.
     * @param {string} recipeId - The id of the recipe to delete.
     */
    async deleteRecipe(id) {
        DeleteModal.open('Are you sure you want to delete this recipe?', async () => {
            const url = `${GlobalConfig.apis.recipes}/DeleteRecipe?id=${id}`;
            const response = await RequestHelper.DeleteWithAuth(url);
            if (response?.error)
                return toastService.addToast('Failed to delete recipe.', GlobalConfig.LOG_LEVEL.ERROR);
            else
                toastService.addToast('Recipe deleted.', GlobalConfig.LOG_LEVEL.INFO);

            this.recipes = this.recipes.filter(recipe => recipe.id !== id);
            this.expandedRecipes.delete(id); // Also remove from expanded state
            this.renderRecipes(this.searchInput.value); // Re-render with current search filter
        });
    }

}

// Called by contentLoader, when loading the correspond page.
window.scripts = {
    app: null,

    init: function () {
        this.app = new RecipeApp();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;

        if (this.app?.recipeFormManager) {
            this.app.recipeFormManager._activeController?.abort();
            this.app.recipeFormManager._cancelled = true;
        }
    }
}
