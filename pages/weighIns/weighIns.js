
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";

class WeighIns {

    constructor() {
        toastService.addToast('On Weigh Ins Page.', GlobalConfig.LOG_LEVEL.INFO, true);
    }

}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new WeighIns(); } }
