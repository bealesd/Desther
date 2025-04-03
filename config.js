export default class GlobalConfig {
    // TODO, make false in build step
    static DEBUG = true;

    static get apis() {
        const url = {
            // TODO add node js build step for locally and pipeline changing of config values 
            // files would have to put in dist folder for github to pick up
            chatCoreUrl: 'https://corechatapivwindows.azurewebsites.net',
        };
        url.auth = `${url.chatCoreUrl}/auth`;
        url.chatGroup = `${url.chatCoreUrl}/chatGroups`;
        url.chat = `${url.chatCoreUrl}/chat`;
        return url;
    }

    static domIds = Object.freeze({
        contentArea: 'content-area',
        menuArea: 'menu-area',
    });

    static domTags = Object.freeze({
        menuPage: 'menu-page',
    });

    static domClasses = Object.freeze({
        backButton: 'back-button',
    });

    static LOG_LEVEL = Object.freeze({
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    });

    static LOG_TYPE = Object.freeze({
        TOAST: 'toast',
        CONSOLE: 'console'
    });
}
