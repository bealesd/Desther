export default class ContentLoader {
    static async loadHtml(div, html) {
        const response = await fetch(html);
        if (!response.ok) return console.log('Network response was not ok');

        const rawHtml = await response.text();
        div.innerHTML = rawHtml;
    }

    static async loadCss(div, css) {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = css; // Your content-specific styles
        div.appendChild(styleLink);
    }

}

//const button = event.composedPath().find(el => el.nodeName === 'BUTTON');
