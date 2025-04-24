const routes = {
    '/index': {
        link: 'index.html',
        auth: false
    },
    '/login': {
        link: 'pages/Login/Login.html',
        css: 'pages/login/login.css',
        js: 'pages/login/login.js',
        auth: false
    },
    '/logout': {
        js: 'pages/logout/logout.js',
        auth: false
    },
    '/chatGroup': {
        link: 'pages/chatGroup/chatGroup.html',
        css: 'pages/chatGroup/chatGroup.css',
        js: 'pages/chatGroup/chatGroup.js',
        auth: true
    },
    '/chat': {
        link: 'pages/chat/chat.html',
        css: 'pages/chat/chat.css',
        js: 'pages/chat/chat.js',
        auth: false
    },
    '/weighIns': {
        link: 'pages/weighIns/weighIns.html',
        css: 'pages/weighIns/weighIns.css',
        js: 'pages/weighIns/weighIns.js',
        auth: false
    },
    '/weighInsGraph': {
        link: 'pages/weighInsGraph/weighInsGraph.html',
        css: 'pages/weighInsGraph/weighInsGraph.css',
        js: 'pages/weighInsGraph/weighInsGraph.js',
        auth: true
    },
    '/weighInsEntry': {
        link: 'pages/weighInsEntry/weighInsEntry.html',
        css: 'pages/weighInsEntry/weighInsEntry.css',
        js: 'pages/weighInsEntry/weighInsEntry.js',
        auth: false
    },
};
export default routes;
