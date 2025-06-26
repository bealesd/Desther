
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";

class Recipes {

    constructor() {
        toastService.addToast('On Recipes Page.', GlobalConfig.LOG_LEVEL.INFO, true);
    }

}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Recipes(); } }
