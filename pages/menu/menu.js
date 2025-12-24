import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";

class Menu {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
    });

    domIds = Object.freeze({
    });

    contentAreaId = GlobalConfig.domIds.contentArea;
    contentAreaElement;
    homeButtonId = GlobalConfig.domIds.homeButton;

    init() {
        this.contentAreaElement = document.querySelector(`#${this.contentAreaId}`);
        if (LoginHelper.loggedIn)
            this.showLogoutMenuButton();
        else
            this.showLoginMenuButton();

            this.turnOffHomeButton();
    }

    showLoginMenuButton() {
        document.querySelector(".menu-button[href='/logout']").style.display = 'none';
        document.querySelector(".menu-button[href='/login']").style.display = 'block';
    }

    showLogoutMenuButton() {
        document.querySelector(".menu-button[href='/logout']").style.display = 'block';
        document.querySelector(".menu-button[href='/login']").style.display = 'none';
    }

    turnOnHomeButton() {
        const homeButton = document.querySelector(`#${this.homeButtonId}`);
        homeButton.style.display = 'block';
    }

    turnOffHomeButton() {
        const homeButton = document.querySelector(`#${this.homeButtonId}`);
        homeButton.style.display = 'none';
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = {
    app: null,

    init: function () {
        this.app = new Menu();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
        this.app.turnOnHomeButton();
    }
}
