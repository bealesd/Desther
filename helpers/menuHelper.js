import GlobalConfig from "../config.js";
import loginHelper from "./loginHelper.js";

export default new class MenuHelper {
    async loadHomePage() {
        if (loginHelper.loggedIn) {
            this.showLogoutMenuButton();
        }

        else {
            this.showLoginMenuButton();
        }

        history.replaceState({}, '', 'index.html');

        this.clearPageContent();

        // display the home menu
        document.querySelector(`#${GlobalConfig.domIds.menuArea}`).style.display = 'block';
    }

    clearPageContent() {
        const contentArea = document.querySelector(`#${GlobalConfig.domIds.contentArea}`);
        contentArea.innerHTML = '';
        contentArea.style.display = 'none';
    }

    showLoginMenuButton() {
        document.querySelector(".menu-button[href='/logout']").style.display = 'none';
        document.querySelector(".menu-button[href='/login']").style.display = 'block';
    }

    showLogoutMenuButton() {
        document.querySelector(".menu-button[href='/logout']").style.display = 'block';
        document.querySelector(".menu-button[href='/login']").style.display = 'none';
    }
}
