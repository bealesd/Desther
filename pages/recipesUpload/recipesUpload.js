import RecipeFormManager from "../../helpers/recipeFormManager/recipeFormManager.js";

window.scripts = {
    app: null,

    init: function() {
        this.app = new RecipeFormManager();
        this.app.renderAddForm();
    },

    destroy: function() {
        this.app._activeController?.abort();
        this.app._cancelled = true;
    }
}
