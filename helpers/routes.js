const routes = {
    '/index': {
        link: 'index.html',
        // css: 'pages/login/chat.css',
        auth: false
    },
    '/login': {
        link: 'pages/Login/Login.html',
        css: 'pages/login/login.css',
        js: 'pages/login/login.js',
        auth: false
    },
    '/chat': {
        link: 'pages/chat/chat.html',
        css: 'pages/chat/chat.css',
        js: 'pages/chat/chat.js',
        auth: true
    },
};
export default routes;