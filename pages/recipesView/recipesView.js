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
        this.recipes= await this.getRecipes(); // Fetch recipes from the server

//         this.recipes = [
//             {
//                 title: "Classic Spaghetti Bolognese",
//                 ingredients: [
//                     "1 tbsp olive oil",
//                     "1 onion, chopped",
//                     "2 cloves garlic, minced",
//                     "500g minced beef",
//                     "400g chopped tomatoes",
//                     "150ml red wine (optional)",
//                     "1 tbsp tomato puree",
//                     "1 beef stock cube",
//                     "Fresh basil to serve",
//                     "Spaghetti to serve"
//                 ],
//                 instructions: `1. Heat oil in a large pan and add the onion. Cook until softened.
// 2. Add garlic and minced beef, cooking until browned. Drain excess fat.
// 3. Pour in red wine (if using) and simmer until reduced.
// 4. Stir in chopped tomatoes, tomato puree, and stock cube. Bring to a simmer.
// 5. Cover and cook on low heat for at least 30 minutes (longer for more flavor).
// 6. Serve hot with cooked spaghetti and fresh basil.`,
//                 prepTime: "15 mins",
//                 cookTime: "30-60 mins"
//             },
//             {
//                 title: "Quick Chicken Stir-Fry",
//                 ingredients: [
//                     "2 chicken breasts, sliced",
//                     "1 tbsp soy sauce",
//                     "1 tbsp sesame oil",
//                     "1 bell pepper, sliced",
//                     "1 carrot, julienned",
//                     "1 cup broccoli florets",
//                     "2 tbsp stir-fry sauce",
//                     "Cooked rice or noodles to serve"
//                 ],
//                 instructions: `1. Marinate chicken in soy sauce and sesame oil for 10 minutes.
// 2. Heat a large wok or pan over high heat. Add chicken and stir-fry until cooked through. Remove chicken and set aside.
// 3. Add bell pepper, carrot, and broccoli to the wok. Stir-fry for 3-5 minutes until crisp-tender.
// 4. Return chicken to the wok. Pour in stir-fry sauce and toss to coat.
// 5. Serve immediately with rice or noodles.`,
//                 prepTime: "10 mins",
//                 cookTime: "15 mins"
//             },
//             {
//                 title: "Vegetarian Lentil Soup",
//                 ingredients: [
//                     "1 tbsp olive oil",
//                     "1 onion, diced",
//                     "2 carrots, diced",
//                     "2 celery stalks, diced",
//                     "2 cloves garlic, minced",
//                     "1 cup brown or green lentils, rinsed",
//                     "6 cups vegetable broth",
//                     "1 (14.5 oz) can diced tomatoes, undrained",
//                     "1 tsp dried thyme",
//                     "Salt and pepper to taste",
//                     "Fresh parsley for garnish"
//                 ],
//                 instructions: `1. Heat olive oil in a large pot over medium heat. Add onion, carrots, and celery. Cook until softened, about 8-10 minutes.
// 2. Stir in garlic and cook for 1 minute until fragrant.
// 3. Add rinsed lentils, vegetable broth, diced tomatoes, and dried thyme. Bring to a boil.
// 4. Reduce heat to low, cover, and simmer for 25-30 minutes, or until lentils are tender.
// 5. Season with salt and pepper. Garnish with fresh parsley before serving.`,
//                 prepTime: "15 mins",
//                 cookTime: "30 mins"
//             },
//             {
//                 title: "Decadent Chocolate Cake",
//                 ingredients: [
//                     "2 cups all-purpose flour",
//                     "3/4 cup unsweetened cocoa powder",
//                     "2 cups granulated sugar",
//                     "1 tsp baking soda",
//                     "1 tsp salt",
//                     "1 cup buttermilk",
//                     "1/2 cup vegetable oil",
//                     "2 large eggs",
//                     "1 tsp vanilla extract",
//                     "1 cup boiling water"
//                 ],
//                 instructions: `1. Preheat oven to 350°F (175°C). Grease and flour two 9-inch round baking pans.
// 2. In a large bowl, whisk together flour, cocoa powder, sugar, baking soda, and salt.
// 3. In a separate bowl, whisk together buttermilk, oil, eggs, and vanilla extract.
// 4. Add the wet ingredients to the dry ingredients and mix until just combined.
// 5. Slowly pour in the boiling water, mixing until the batter is smooth. The batter will be thin.
// 6. Pour evenly into prepared pans.
// 7. Bake for 30-35 minutes, or until a wooden skewer inserted into the center comes out clean.
// 8. Cool in pans for 10 minutes before inverting onto a wire rack to cool completely.`,
//                 prepTime: "20 mins",
//                 cookTime: "30-35 mins"
//             },
//             {
//                 title: "Healthy Quinoa Salad",
//                 ingredients: [
//                     "1 cup quinoa, rinsed",
//                     "2 cups vegetable broth",
//                     "1 cucumber, diced",
//                     "1 cup cherry tomatoes, halved",
//                     "1/2 red onion, finely diced",
//                     "1/4 cup fresh parsley, chopped",
//                     "Juice of 1 lemon",
//                     "2 tbsp olive oil",
//                     "Salt and pepper to taste"
//                 ],
//                 instructions: `1. Combine quinoa and vegetable broth in a saucepan. Bring to a boil, then reduce heat to low, cover, and simmer for 15 minutes, or until all liquid is absorbed. Fluff with a fork and let cool.
// 2. In a large bowl, combine cooled quinoa, cucumber, cherry tomatoes, red onion, and parsley.
// 3. In a small bowl, whisk together lemon juice, olive oil, salt, and pepper.
// 4. Pour dressing over the quinoa mixture and toss to combine.
// 5. Serve chilled.`,
//                 prepTime: "15 mins",
//                 cookTime: "15 mins"
//             }
//         ];

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
            if (this.expandedRecipes.has(recipe.title)) {
                recipeCard.classList.add('expanded');
            }

            recipeCard.innerHTML = `
                        <div class="recipe-card-header">
                            <h3>${recipe.title}</h3>
                            <span class="toggle-icon">${this.expandedRecipes.has(recipe.title) ? '&#9660;' : '&#9658;'}</span>
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
            recipeCard.querySelector('button').addEventListener('click', (event) => { this.deleteRecipe(recipe.title) });

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
    toggleExpand(recipeTitle, cardElement) {
        const isExpanded = cardElement.classList.contains('expanded');
        if (isExpanded) {
            cardElement.classList.remove('expanded');
            this.expandedRecipes.delete(recipeTitle);
            cardElement.querySelector('.toggle-icon').innerHTML = '&#9658;'; // Right arrow
        } else {
            cardElement.classList.add('expanded');
            this.expandedRecipes.add(recipeTitle);
            cardElement.querySelector('.toggle-icon').innerHTML = '&#9660;'; // Down arrow
        }
    }

    /**
     * Deletes a recipe from the array based on its title.
     * @param {string} recipeTitle - The title of the recipe to delete.
     */
    deleteRecipe(recipeTitle) {
        this.showCustomConfirm('Are you sure you want to delete this recipe?', () => {
            this.recipes = this.recipes.filter(recipe => recipe.title !== recipeTitle);
            this.expandedRecipes.delete(recipeTitle); // Also remove from expanded state
            this.renderRecipes(this.searchInput.value); // Re-render with current search filter
        });
    }

    /**
     * Expands all currently displayed recipe cards.
     */
    expandAllRecipes() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const title = card.querySelector('h3').textContent;
            if (!card.classList.contains('expanded')) {
                card.classList.add('expanded');
                this.expandedRecipes.add(title);
                card.querySelector('.toggle-icon').innerHTML = '&#9660;'; // Down arrow
            }
        });
    }

    /**
     * Collapses all currently displayed recipe cards.
     */
    collapseAllRecipes() {
        document.querySelectorAll('.recipe-card').forEach(card => {
            const title = card.querySelector('h3').textContent;
            if (card.classList.contains('expanded')) {
                card.classList.remove('expanded');
                this.expandedRecipes.delete(title);
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
