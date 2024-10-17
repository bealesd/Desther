# Intoduction
This is a vanilla JS/HTML/CSS SPA. 

It uses no frameworks and requires no building.

The entry point is index.html.

# Adding a Menu Page

Index.html contains a menu-page component. 
The component takes a link attribute which is an array of objects.
Each object should have properties:
- text
    - the text that is displayed
- link
    - the html link the file to load
- css
    - the css link for styling

## Example
`
  <menu-page links='[{"text": "Chat", "link": "chat.html", "css": "chat.css"}'
  </menu-page> 
`