import RecipeFormManager from "../../helpers/recipeFormManager/recipeFormManager.js";

window.scripts = {
    app: null,

    init: function () {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        this.app = new RecipeFormManager();
        this.app.renderAddForm({ signal: this.signal });
    },

    destroy: function () {
        this.app._activeController?.abort();
        this.app._cancelled = true;
    }
}
