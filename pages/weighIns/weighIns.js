
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/Logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";

class WeighIns {

    constructor() {
        toastService.addToast('On Weigh Ins Page.', GlobalConfig.LOG_LEVEL.INFO);
    }

}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new WeighIns(); } }
