export default class Listeners {
    static async registerEvents() {
        document.addEventListener('click', async (event) => {
            if (event.target.classList.contains('back-button')) {
                const contentArea = document.querySelector('menu-page').shadowRoot.querySelector('#content-area') 
                contentArea.innerHTML = '';
                contentArea.style.display = 'none';
        
                document.querySelector('menu-page').shadowRoot.querySelector('#menu-area').style.display = 'block';
            }
        });
    }

}



//const button = event.composedPath().find(el => el.nodeName === 'BUTTON');
