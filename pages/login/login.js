import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import EventHandler from "../../helpers/eventHandler.js";
import LoginHelper from "../../helpers/loginHelper.js";
import menuHelper from "../../helpers/menuHelper.js";
import toastService from "../../helpers/toastService.js";
import LoadingScreen from "../../helpers/loadingScreen.js";

class Login {
    _cancelled = false;
    _activeController = null;
    signal = null;

    contentAreaId = GlobalConfig.domIds.contentArea;
    contentAreaElement;

    init() {
        // Should be called every time login button is clicked
        this.contentAreaElement = document.querySelector(`#${this.contentAreaId}`);
        this.registerCallbacks();
    }

    registerCallbacks() {
        // When login button is clicked, login
        const loginButton = this.contentAreaElement.querySelector(`.login-btn`);
        EventHandler.overwriteEvent({
            'id': 'loginEvent',
            'eventType': 'click',
            'element': loginButton,
            'callback': () => {
                this.login();
            }
        });
    }

    async login() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        const user = this.getCredentials();
        // move to general validate user
        if (!user.username | !user.password) {
            Logger.log('Could not get user details from login form.', GlobalConfig.LOG_LEVEL.WARNING);
            return;
        }

        LoadingScreen.showFullScreenLoader();
        await LoginHelper.login(user, this.signal);
        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        if (LoginHelper.loggedIn) {
            toastService.addToast('Logged in.', GlobalConfig.LOG_LEVEL.INFO);
            menuHelper.loadHomePage();
        }
        else {
            toastService.addToast('Failed to log in.', GlobalConfig.LOG_LEVEL.ERROR);
        }    
    }

    getCredentials() {
        const username = this.contentAreaElement.querySelector('#username')?.value ?? null;
        const password = this.contentAreaElement.querySelector('#password')?.value ?? null;
        return {
            username: username,
            password: password
        };
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = {
    app: null,

    init: function () {
        this.app = new Login();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
    }
}
