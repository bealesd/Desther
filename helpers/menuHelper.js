import GlobalConfig from "../config.js";
import loginHelper from "./loginHelper.js";
import PageInfo from "./pageInfo.js";

export default new class MenuHelper {
    constructor() {
        this.menuAreaId = GlobalConfig.domIds.menuArea;
        this.contentAreaId = GlobalConfig.domIds.contentArea;
        this.homeButtonId = GlobalConfig.domIds.homeButton;
    }

    /**
     * Load the home page content and set the page info.
     * This function is called when the user; logs in, clicks on the home button, or logouts.
     * It clears the content area and displays the home menu.
     * It also sets the page info with the title and content.
     */
    async loadHomePage() {
        if (loginHelper.loggedIn)
            this.showLogoutMenuButton();
        else
            this.showLoginMenuButton();

        history.replaceState({}, '', 'index.html');

        this.clearPageContent();

        // Turn on home menu
        document.querySelector(`#${this.menuAreaId}`).style.display = 'block';

        // Turn off home button
        document.querySelector(`#${this.homeButtonId}`).style.display = 'none';

        this.setPageInfo();
    }

    /**
     * Set the page info with the title and content.
     */
    setPageInfo() {
        const content = 'Welcome to the home page!';
        const title = 'Home';
        PageInfo.setInfo({
            title: title,
            content: content,
            extraContent: `${loginHelper.loggedIn ? 'Hello ' + loginHelper.username : 'Not Logged In'}`
        });
    }

    clearPageContent() {
        const contentArea = document.querySelector(`#${this.contentAreaId}`);
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
