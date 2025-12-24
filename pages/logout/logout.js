import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import Router from "../../helpers/router.js";
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
        Router.navigate('index');
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Logout(); } }
