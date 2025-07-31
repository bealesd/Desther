const routes = {
    '/index': {
        link: 'index.html',
        auth: false,
        title: 'Home',
        content: 'Navigate'
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
    '/chatGroup': {
        link: 'pages/chatGroup/chatGroup.html',
        css: 'pages/chatGroup/chatGroup.css',
        js: 'pages/chatGroup/chatGroup.js',
        auth: true,
        title: 'My Chats',
        content: 'Pick a chat group'
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
};
export default routes;
