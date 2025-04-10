import GlobalConfig from "../../config.js";
import EventHandler from "../../helpers/eventHandler.js";
import LoginHelper from "../../helpers/loginHelper.js";
import menuHelper from "../../helpers/menuHelper.js";
import toastService from "../../helpers/toastService.js";

class Login {
    contentAreaId = GlobalConfig.domIds.contentArea;
    contentAreaElement;

    constructor() {
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
        const user = this.getCredentials();
        // move to general validate user
        if (!user.username | !user.password) {
            console.log('Could not get user details from login form.')
            return;
        }

        await LoginHelper.login(user);

        if (LoginHelper.loggedIn){
            menuHelper.loadHomePage();
            toastService.addToast('Logged in.', GlobalConfig.LOG_LEVEL.INFO);
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
window.scripts = { init: () => { new Login(); } }
