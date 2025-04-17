import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import menuHelper from "../../helpers/menuHelper.js";
import toastService from "../../helpers/toastService.js";

class Logout {
    contentAreaId = GlobalConfig.domIds.contentArea;
    contentAreaElement;

    constructor() {
        this.logout();
    }

    logout() {
        LoginHelper.logout();
        toastService.addToast('Logged out.', GlobalConfig.LOG_LEVEL.INFO);
        menuHelper.loadHomePage();
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Logout(); } }
