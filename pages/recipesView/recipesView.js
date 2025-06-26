import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";
import EventHandler from "../../helpers/eventHandler.js";
import RequestHelper from "../../helpers/requestHelper.js";

class RecipeApp {
    constructor() {
        toastService.addToast('On Recipes View Page.', GlobalConfig.LOG_LEVEL.INFO, true);
    }

    // Initialization method
    async init() {
        this.recipes = await this.getRecipes(); // Fetch recipes from the server

        this.expandedRecipes = new Set(); // Set to store titles of expanded recipes to maintain state

        // Get references to HTML elements
        this.recipesContainer = document.getElementById('recipesContainer');
        this.noRecipesMessage = document.getElementById('noRecipesMessage');
        this.searchInput = document.getElementById('searchInput');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');

        // Bind event listeners
        this.addEventListeners();

        this.renderRecipes();
    }

    async getRecipes() {
        // const url = `${GlobalConfig.apis.recipes}/GetNotepad?id=${id}`;
        const recipes = [];
        const url = `${GlobalConfig.apis.recipes}/GetNotepadDirectChildren?path=home/Recipes/Json`

        const recipeResults = await RequestHelper.GetJsonWithAuth(url);
        if (recipeResults?.error)
            return [];

        for (const recipeResult of recipeResults) {
            const recipe = await this.getRecipe(recipeResult.Id);
            recipe.Id = recipeResult.Id; // Store the ID for deletion purposes
            recipes.push(recipe);
        }

        return recipes;
    }

    async getRecipe(id) {
        const url = `${GlobalConfig.apis.recipes}/GetNotepad?id=${id}`

        const recipe = await RequestHelper.GetJsonWithAuth(url);
        if (recipe?.error)
            return {};

        return recipe.Text ? JSON.parse(recipe.Text) : {};
    }

    addEventListeners() {
        EventHandler.overwriteEvent({
            'id': 'renderRecipes',
            'eventType': 'click',
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
        this.recipesContainer.innerHTML = ''; // Clear previous recipes
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

        const filteredRecipes = this.recipes.filter(recipe => {
            if (lowerCaseSearchTerm === '') return true; // Show all if no search term

            // Check title
            if (recipe.title.toLowerCase().includes(lowerCaseSearchTerm)) return true;
            // Check ingredients
            if (recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseSearchTerm))) return true;
            // Check instructions
            if (recipe.instructions.toLowerCase().includes(lowerCaseSearchTerm)) return true;

            return false;
        });

        if (filteredRecipes.length === 0) {
            this.noRecipesMessage.style.display = 'block'; // Show "No recipes found" message
            this.recipesContainer.appendChild(this.noRecipesMessage);
            return;
        } else {
            this.noRecipesMessage.style.display = 'none'; // Hide the message
        }

        filteredRecipes.forEach((recipe, index) => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';

            // Check if this recipe was previously expanded
            if (this.expandedRecipes.has(recipe.id)) {
                recipeCard.classList.add('expanded');
            }

            recipeCard.innerHTML = `
                        <div class="recipe-card-header">
                            <h3 data-id=${recipe.id}>${recipe.title}</h3>
                            <span class="toggle-icon">${this.expandedRecipes.has(recipe.id) ? '&#9660;' : '&#9658;'}</span>
                        </div>
                        <div class="recipe-card-content">
                            ${recipe.prepTime || recipe.cookTime ? `<p class="text-sm"><strong>Prep:</strong> ${recipe.prepTime || 'N/A'} | <strong>Cook:</strong> ${recipe.cookTime || 'N/A'}</p>` : ''}
                            <div>
                                <strong>Ingredients:</strong>
                                <ul>
                                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                                </ul>
                            </div>
                            <div>
                                <strong>Instructions:</strong>
                                <p class="whitespace-pre-wrap">${recipe.instructions}</p>
                            </div>
                            <div class="flex-justify-end">
                                <button class="delete-btn">Delete</button>
                            </div>
                        </div>
                    `;
            recipeCard.querySelector('button').addEventListener('click', (event) => { this.deleteRecipe(recipe.Id) });

            this.recipesContainer.appendChild(recipeCard);

            // Use arrow functions for event listeners to maintain 'this' context
            recipeCard.querySelector('.recipe-card-header').addEventListener('click', () => this.toggleExpand(recipe.title, recipeCard));
            recipeCard.addEventListener('click', (event) => {
                if (!event.target.classList.contains('delete-btn')) {
                    this.toggleExpand(recipe.title, recipeCard);
                }
            });
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
     * Deletes a recipe from the array based on its title.
     * @param {string} recipeId - The id of the recipe to delete.
     */
    async deleteRecipe(id) {
        this.showCustomConfirm('Are you sure you want to delete this recipe?', async () => {
            const url = `${GlobalConfig.apis.recipes}/DeleteNotepad?id=${id}`;
            const response = await RequestHelper.DeleteWithAuth(url);
            if (response?.error)
                return toastService.addToast('Failed to delete recipe.', GlobalConfig.LOG_LEVEL.ERROR);

            this.recipes = this.recipes.filter(recipe => recipe.Id !== id);
            this.expandedRecipes.delete(id); // Also remove from expanded state
            this.renderRecipes(this.searchInput.value); // Re-render with current search filter
        });
    }

    /**
     * Expands all currently displayed recipe cards.
     */
    expandAllRecipes() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const id = card.querySelector('h3').dataset.id;;
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

    /**
     * Displays a custom confirmation dialog.
     * This method is part of the class, but the modal elements are appended to the body.
     * @param {string} message - The message to display in the confirmation dialog.
     * @param {function} onConfirm - Callback function to execute if user confirms.
     */
    showCustomConfirm(message, onConfirm) {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background-color: rgba(0, 0, 0, 0.6); display: flex;
                    justify-content: center; align-items: center; z-index: 1000;
                `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
                    background-color: #282828;
                    color: rgb(227, 227, 227);
                    padding: 30px; border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); text-align: center;
                    max-width: 400px; width: 90%;
                    display: flex; flex-direction: column; gap: 20px;
                    font-family: 'Inter', sans-serif;
                `;

        const messagePara = document.createElement('p');
        messagePara.textContent = message;
        messagePara.style.cssText = `
                    font-size: 1.1rem; color: rgb(227, 227, 227); margin-bottom: 15px;
                `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
                    display: flex; justify-content: center; gap: 15px;
                `;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Yes, Delete';
        confirmButton.style.cssText = `
                    background-color: #dc2626; color: white; padding: 10px 20px;
                    border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;
                    transition: background-color 0.2s ease;
                `;
        confirmButton.onmouseover = () => confirmButton.style.backgroundColor = '#b91c1c';
        confirmButton.onmouseout = () => confirmButton.style.backgroundColor = '#dc2626';
        confirmButton.onclick = () => {
            onConfirm();
            document.body.removeChild(modalOverlay);
        };

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.cssText = `
                    background-color: #4a5568;
                    color: white; padding: 10px 20px;
                    border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;
                    transition: background-color 0.2s ease;
                `;
        cancelButton.onmouseover = () => cancelButton.style.backgroundColor = '#2d3748';
        cancelButton.onmouseout = () => cancelButton.style.backgroundColor = '#4a5568';
        cancelButton.onclick = () => {
            document.body.removeChild(modalOverlay);
        };

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        modalContent.appendChild(messagePara);
        modalContent.appendChild(buttonContainer);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { const app = new RecipeApp(); app.init(); } }
