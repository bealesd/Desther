export default class GlobalConfig {
    static get apis() {
        const urls = {
            // TODO add node js build step for locally and pipeline changing of config values 
            // files would have to put in dist folder for github to pick up
            'chatCoreUrl': 'https://corechatapivwindows.azurewebsites.net',
        };
        urls.auth = `${urls.chatCoreUrl}/auth`;
        urls.chatGroup = `${urls.chatCoreUrl}/chatGroups`;
        return urls;
    }

    static domIds = Object.freeze({
        contentArea: 'content-area',
        menuArea: 'menu-area',
        chatGroupArea: 'chat-group-area',
    });

    static domTags = Object.freeze({
        menuPage: 'menu-page',
    });

    static domClasses = Object.freeze({
        backButton: 'back-button',
        chatGroupBox: 'chat-group-box'
    });
}
