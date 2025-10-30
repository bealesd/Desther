import routes from './routes.js';
import GlobalConfig from "../config.js";
import ContentLoader from "./contentLoader.js"
import LoginHelper from "../helpers/loginHelper.js";
import menuHelper from "./menuHelper.js";
import eventHandler from './eventHandler.js';
import persistentToastService from './persistentToastService.js';
import Logger from './logger.js';
import PageInfo from './pageInfo.js';

export default new class Router {
    constructor() {
        this.basePath = window.location.pathname.startsWith('/Desther') ? '/Desther' : '';
        this.menuAreaId = GlobalConfig.domIds.menuArea;
        this.homeButtonId = GlobalConfig.domIds.homeButton;
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
        const fullPath = this.basePath + path;
        history.pushState({}, '', fullPath);

        // Load the content for the new path
        this.loadContent();
    }

    setPageInfo(route) {
        let title = '';

        // Set the title based on the route
        if (route?.title) {
            title = route.title;
        } else if (route?.link) {
            title = `${route.link.split('/').pop().replace('.html', '')} page`;
        } else {
            title = window.location.pathname.replace('.html', '');
        }

        PageInfo.setInfo({
            title: title,
            extraContent: `${LoginHelper.loggedIn ? 'Hello ' + LoginHelper.username : 'Not Logged In'}`
        });
    }

    async loadContent() {
        // cancel code running on previous page.
        for (const script of Object.keys(ContentLoader.startupScripts)) {
            ContentLoader.startupScripts[script]?.destroy?.();
        }
        eventHandler.removeEvents();
        eventHandler.removeIntervals();

        let path = window.location.pathname;

        // Strip base path and .html
        if (path.startsWith(this.basePath)) {
            path = path.slice(this.basePath.length);
        }
        path = path.replace(/\.html$/, '') || '/index';

        const route = routes[path];

        if (path === '/index' || !route) {
            // If no route is found, or if the path is index, load the home page
            return this.loadHomePage();
        }

        // Check you are logged in, if not return
        if (route.auth && !LoginHelper.loggedIn) {
            alert('Not logged in');
            return;
        }

        this.setPageInfo(route);

        // Turn off home menu
        document.querySelector(`#${this.menuAreaId}`).style.display = 'none';

        // Turn on home button
        const homeButton = document.querySelector(`#${this.homeButtonId}`);
        homeButton.style.display = 'block';

        // Turn on content area
        const contentArea = document.querySelector(`#${this.contentAreaId}`);
        contentArea.style.display = 'block';

        //remove old css and js file on contentArea
        while (contentArea.firstChild) {
            contentArea.removeChild(contentArea.firstChild);
        }

        let htmlLoaded = false;
        if (route.link)
            htmlLoaded = await ContentLoader.loadHtml(contentArea, route.link);

        if (!route.link || !htmlLoaded)
            Logger.log(`No HTML loaded for : ${path}`, GlobalConfig.LOG_LEVEL.WARNING);

        if (route.css)
            await ContentLoader.loadCss(contentArea, route.css);
        if (route.js)
            await ContentLoader.loadJs(contentArea, route.js);
    }

    loadHomePage() {
        menuHelper.loadHomePage();
    }
}
