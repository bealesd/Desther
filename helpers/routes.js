const routes = {
    '/index': {
        link: 'pages/menu/menu.html',
        js: 'pages/menu/menu.js',
        auth: false,
        title: 'Home',
    },
    '/login': {
        link: 'pages/login/login.html',
        css: 'pages/login/login.css',
        js: 'pages/login/login.js',
        auth: false,
        title: 'Login',
    },
    '/logout': {
        js: 'pages/logout/logout.js',
        auth: true
    },
    '/calendar': {
        link: 'https://calendar.google.com/calendar/embed?src=esthersullywedding%40gmail.com&ctz=Europe%2FLondon target=',
        title: 'Calendar',
    },
    '/chatGroup': {
        link: 'pages/chatGroup/chatGroup.html',
        css: 'pages/chatGroup/chatGroup.css',
        js: 'pages/chatGroup/chatGroup.js',
        auth: true,
        title: 'My Chats',
    },
    '/chat': {
        link: 'pages/chat/chat.html',
        css: 'pages/chat/chat.css',
        js: 'pages/chat/chat.js',
        auth: false,
        title: 'Chatting',
    },
    '/recipes': {
        link: 'pages/recipes/recipes.html',
        css: 'pages/recipes/recipes.css',
        js: 'pages/recipes/recipes.js',
        auth: false,
        title: 'Recipes',
    },
    '/recipesUpload': {
        // no html, reliant on js to load component
        js: 'pages/recipesUpload/recipesUpload.js',
        auth: true,
        title: 'Upload a Recipe',
    },
    '/recipesView': {
        link: 'pages/recipesView/recipesView.html',
        css: 'pages/recipesView/recipesView.css',
        js: 'pages/recipesView/recipesView.js',
        auth: true,
        title: 'Recipes',
    },
    '/weighIns': {
        link: 'pages/weighIns/weighIns.html',
        css: 'pages/weighIns/weighIns.css',
        js: 'pages/weighIns/weighIns.js',
        auth: false,
        title: 'Weigh Ins',
    },
    '/weighInsGraph': {
        link: 'pages/weighInsGraph/weighInsGraph.html',
        css: 'pages/weighInsGraph/weighInsGraph.css',
        js: 'pages/weighInsGraph/weighInsGraph.js',
        auth: true,
        title: 'Weigh Ins Graph',
    },
    '/weighInsEntry': {
        link: 'pages/weighInsEntry/weighInsEntry.html',
        css: 'pages/weighInsEntry/weighInsEntry.css',
        js: 'pages/weighInsEntry/weighInsEntry.js',
        auth: false,
        title: 'Weigh Ins Entry',
    },
     '/alpha-added-pension': {
        link: 'pages/alpha-added-pension/alpha-added-pension.html',
        css: 'pages/alpha-added-pension/alpha-added-pension.css',
        js: 'pages/alpha-added-pension/alpha-added-pension.js',
        auth: true,
        title: 'Alpha Added Pension',
    },
};
export default routes;
