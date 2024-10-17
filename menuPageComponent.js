import ContentLoader from "./contentLoader.js"


class MenuPageComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); // Attach shadow DOM for encapsulation
    }

    connectedCallback() {
        const links = this.getAttribute('links');
        this.render(JSON.parse(links)); // Parse the JSON and pass it to the render method
    }

    render(links) {
        const ul = document.createElement('ul');

        for (const link of links) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = link.text;
            button.dataset['href'] = link?.link ?? console.log('No menu link');
            button.dataset['css'] = link?.css ?? console.log('No menu css');

            // Add click event to navigate to the specified link
            button.addEventListener('click', async () => {
                // TODO: add window.location.href = link.link;
                
                // turn off menu
                this.shadowRoot.querySelector('#menu-area').style.display = 'none';

                // turn on content area
                const contentArea = this.shadowRoot.querySelector('#content-area');
                contentArea.style.display = 'block';

                const link = button.dataset['href'];
                if (!link) return;
                await ContentLoader.loadHtml(contentArea, link);

                const css = button.dataset['css'];
                if (!css) return;
                await ContentLoader.loadCss(contentArea, css);

            });

            li.appendChild(button);
            ul.appendChild(li);
        }

        // Create the <link> element to load the external CSS
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'menuPageComponent.css');

        // Append the <link> and content to the shadow root
        this.shadowRoot.innerHTML = '';  // Clear previous content

        const menuDiv = document.createElement('div');
        menuDiv.id = 'menu-area'
        this.shadowRoot.appendChild(menuDiv);
        menuDiv.appendChild(linkElem);
        menuDiv.appendChild(ul);

        const cotentDiv = document.createElement('div');
        cotentDiv.id = 'content-area'
        this.shadowRoot.appendChild(cotentDiv);

    }
}

customElements.define('menu-page', MenuPageComponent);
