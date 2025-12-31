class GlobalConfig {
    // TODO, make false in build step
    static DEBUG = false;

    static get apis() {
        const url = {
            // TODO add node js build step for locally and pipeline changing of config values 
            // files would have to put in dist folder for github to pick up
            // chatCoreUrl: 'https://localhost:7103',
            chatCoreUrl: 'https://corechatapivwindows.azurewebsites.net',
        };
        url.auth = `${url.chatCoreUrl}/auth`;
        url.chatGroup = `${url.chatCoreUrl}/chatGroups`;
        url.chat = `${url.chatCoreUrl}/chat`;
        url.chatsRead = `${url.chatCoreUrl}/chatsRead`;
        url.weighIns = `${url.chatCoreUrl}/weighIns`;
        url.recipes = `${url.chatCoreUrl}/recipes`;
        return url;
    }

    static domIds = Object.freeze({
        contentArea: 'content-area',
        menuArea: 'menu-area',
        homeButton: 'home-button',
    });

    static domTags = Object.freeze({
        menuPage: 'menu-page',
    });

    static domClasses = Object.freeze({
    });

    static LOG_LEVEL = Object.freeze({
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    });

    static TOAST_TYPE = Object.freeze({
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    });
}

// ✅ Safely expose a debug hook via namespaced global
if (!window.GlobalConfig) {
    window.GlobalConfig = {};
}

// ✅ Only define debug if not already there
if (!Object.getOwnPropertyDescriptor(window.GlobalConfig, 'DEBUG')) {
    Object.defineProperty(window.GlobalConfig, 'DEBUG', {
        get: () => GlobalConfig.DEBUG,
        // !! to coerce any value into a strict boolean (true or false)
        set: (val) => { GlobalConfig.DEBUG = !!val; },
        configurable: true
    });
}

export default GlobalConfig;
