import GlobalConfig from "../../config.js";
import EventHandler from "../../helpers/eventHandler.js";
import LoginHelper from "../../helpers/loginHelper.js";
import menuHelper from "../../helpers/menuHelper.js";
import MessageHelper from "../../helpers/messageHelper.js";

class Login {
    contentAreaId = GlobalConfig.domIds.contentArea;
    contentAreaElem;

    constructor() {
        this.contentAreaElem = document.querySelector(`#${this.contentAreaId}`);
        this.registerCallbacks();

        MessageHelper.printMessages();
    }

    registerCallbacks() {
        // When login button is clicked, login
        const loginButton = this.contentAreaElem.querySelector(`.login-btn`);
        EventHandler.addEvent({
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

        menuHelper.loadHomePage();
    }

    getCredentials() {
        const username = this.contentAreaElem.querySelector('#username')?.value ?? null;
        const password = this.contentAreaElem.querySelector('#password')?.value ?? null;
        return {
            username: username,
            password: password
        };
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Login(); } }
