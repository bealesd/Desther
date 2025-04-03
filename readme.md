# Intoduction
This is a vanilla JS/HTML/CSS SPA. 

It uses no frameworks and requires no building.

The entry point is index.html.

# Dependencies
1. Node 10 +
2. npm

# Build
1. node build.mjs
2. install npm i http-server
3. http-server

# Adding a Menu Page

Routes.js contains a routes. 

Each object can have properties:
- link (string, required)
    - html
- css (string, optional)
    - styling
- js (string, optional)
    - code to be run
- auth (bool, optional)
    - is auth required

## Example
`
  '/login': {
        link: 'pages/Login/Login.html',
        css: 'pages/login/login.css',
        js: 'pages/login/login.js',
        auth: false
    }
`

# TODO
- Remove back button from index screen, when no page history
- Back takes user to home screen
- chat->scrollTobBttom called outside of chat screen