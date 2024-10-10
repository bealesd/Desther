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

        links.forEach(link => {
            const li = document.createElement('li');
            const button = document.createElement('button');
            button.textContent = link.text;
            button.dataset['href'] = link?.link ?? console.log('No menu link');
            button.dataset['css'] = link?.css ?? console.log('No menu css');

            // Add click event to navigate to the specified link
            // button.addEventListener('click', () => {
            //     window.location.href = link.link;
            // });
            // Attach click event listener
            
            li.appendChild(button);
            ul.appendChild(li);
        });

        this.shadowRoot.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (button) {
                // event.stopPropagation(); // Prevent bubbling
                const link = button.textContent.toLowerCase() + '.html';
                // Fetch and load content here
                console.log('Loading:', link); // For debugging
            }
        });


        // Create the <link> element to load the external CSS
        const linkElem = document.createElement('link');
        linkElem.setAttribute('rel', 'stylesheet');
        linkElem.setAttribute('href', 'menuPageComponent.css');

        // Append the <link> and content to the shadow root
        this.shadowRoot.innerHTML = '';  // Clear previous content
        this.shadowRoot.appendChild(linkElem);
        this.shadowRoot.appendChild(ul);
    }
}

customElements.define('menu-page', MenuPageComponent);
