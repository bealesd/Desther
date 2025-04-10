import routes from './routes.js';
import GlobalConfig from "../config.js";
import ContentLoader from "./contentLoader.js"
import LoginHelper from "../helpers/loginHelper.js";
import menuHelper from "./menuHelper.js";
import eventHandler from './eventHandler.js';
import persistentToastService from './persistentToastService.js';

export default new class Router {
    constructor() {
        this.menuAreaId = GlobalConfig.domIds.menuArea;
        this.contentAreaId = GlobalConfig.domIds.contentArea;
        this.rootElement = document.getElementById('content');

        // Initialize routing
        window.addEventListener('popstate', () => this.handleNavigation());
        // Listen to any click events on website
        document.addEventListener('click', (event) => this.handleLinkClick(event));

        // show any stored toasts after a page redirect
        persistentToastService.showToasts();
    }

    handleLinkClick(event) {
        const target = event.target.closest('button');

        if (target && target.hasAttribute('data-router')) {
            event.preventDefault(); // Prevent default link behavior
            const path = target.getAttribute('href');
            this.navigate(path);
        }
    }

    handleNavigation() {
        this.loadContent();
    }

    navigate(path) {
        // Push the path to the browser's history
        history.pushState({}, '', path);

        // Load the content for the new path
        this.loadContent();
    }

    async loadContent() {
        // clear events from window.events
        // do i need to keep any events - not in eventHandler.js, these are currently temp events
        // i should move all events to event handler if possible?

        eventHandler.removeEvents();
        eventHandler.removeIntervals();

        const path = window.location.pathname;

        if (['/', '/index', '/index.html'].includes(path))
            return this.loadHomePage();

        const route = routes[path];

        if (!route) {
            // No matching route, go to home page
            alert(`Invalid page: ${route}`);
            return this.loadHomePage();
        }

        // Check you are logged in, if not return
        if (route.auth && !LoginHelper.loggedIn) {
            alert('Not logged in');
            return;
        }

        // Turn off home menu
        document.querySelector(`#${this.menuAreaId}`).style.display = 'none';

        // Turn on content area
        const contentArea = document.querySelector(`#${this.contentAreaId}`);
        contentArea.style.display = 'block';

        //remove old css and js file on contentArea
        while (contentArea.firstChild) {
            contentArea.removeChild(contentArea.firstChild);
        }

        // Load assets
        const link = route.link;
        if (!link) return;
        const htmlLoaded = await ContentLoader.loadHtml(contentArea, link);
        if (!htmlLoaded) return;

        const css = route.css;
        const js = route.js;

        if (css)
            await ContentLoader.loadCss(contentArea, css);
        if (js) {
            await ContentLoader.loadJs(contentArea, js);
        }

    }

    loadHomePage() {
        // Update url
        history.replaceState({}, '', 'index.html');

        menuHelper.loadHomePage();
    }
}
