import routes from './routes.js';
import GlobalConfig from "../config.js";
import ContentLoader from "./contentLoader.js"
import LoginHelper from "../helpers/loginHelper.js";
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
        this.contentArea = document.querySelector(`#${this.contentAreaId}`);

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
            const path = target.getAttribute('href');
           
            const link = routes?.[path]?.link;
            if (link?.includes('calendar.google.com')) {
                window.open(link, '_blank');
                return;
            }

            event.preventDefault(); // Prevent default link behavior

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
        this.destroyActiveContentAreaScripts();

        let path = window.location.pathname;
        path = (path.startsWith(this.basePath)
            ? path.slice(this.basePath.length)
            : path
        ).replace(/\.html$/, '') || '/index';

        const route = routes[path] ?? routes['/index'];

        // Check you are logged in, if not return
        if (route.auth && !LoginHelper.loggedIn) {
            alert('Not logged in');
            return;
        }

        this.setPageInfo(route);

        this.removeContentAreaAssets();
        await this.loadHtml(route, path);
        await this.loadCss(route);
        await this.loadJs(route);
    }

    destroyActiveContentAreaScripts() {
        // Cancel code running on previous page.
        // All pages have to be cancelled because we do not know previous page.
        // This could be gotten from history, but is easier to destroy all.
        for (const script of Object.keys(ContentLoader.startupScripts)) {
            ContentLoader.startupScripts[script]?.destroy?.();
        }
        eventHandler.removeEvents();
        eventHandler.removeIntervals();
    }

    removeContentAreaAssets() {
        //remove old css and js file on contentArea
        while (this.contentArea.firstChild)
            this.contentArea.removeChild(this.contentArea.firstChild);
    }

    async loadHtml(route, path) {
        let htmlLoaded = false;

        if (route.link)
            htmlLoaded = await ContentLoader.loadHtml(this.contentArea, route.link);

        if (!htmlLoaded)
            Logger.log(`No HTML loaded for : ${path}`, GlobalConfig.LOG_LEVEL.WARNING);
    }

    async loadCss(route) {
        if (route.css)
            await ContentLoader.loadCss(this.contentArea, route.css);
    }

    async loadJs(route) {
        if (route.js)
            await ContentLoader.loadJs(this.contentArea, route.js);
    }
}
