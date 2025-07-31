import RecipeFormManager from "../../helpers/recipeFormManager/recipeFormManager.js";

window.scripts = {
    init: () => {
        const recipeFormManager = new RecipeFormManager();
        recipeFormManager.renderAddForm();
    }
}
