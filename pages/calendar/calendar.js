
import GlobalConfig from "../../config.js";
import toastService from "../../helpers/toastService.js";

class Calendar {

    constructor() {
        toastService.addToast('On Calender Page.', GlobalConfig.LOG_LEVEL.INFO, true);
    }

}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Calendar(); } }
