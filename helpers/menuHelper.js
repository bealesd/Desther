import GlobalConfig from "../config.js";

export default new class MenuHelper {
    async loadHomePage() {
        const contentArea = document.querySelector(`#${GlobalConfig.domIds.contentArea}`);
        contentArea.innerHTML = '';
        contentArea.style.display = 'none';
        // display the home menu
        document.querySelector(`#${GlobalConfig.domIds.menuArea}`).style.display = 'block';
    }

}
