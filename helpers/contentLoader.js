export default class ContentLoader {
    static async loadHtml(div, html) {
        const response = await fetch(html);
        if (!response.ok) {
            console.log('Network response was not ok');
            return false;
        }

        const rawHtml = await response.text();
        div.innerHTML = rawHtml;
        return true
    }

    static async loadCss(div, css) {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = css; // Your content-specific styles
        div.appendChild(styleLink);
    }

    static async loadJs(div, js) {
        await new Promise((res, rej) => {
            const script = document.createElement('script');
            script.setAttribute('type', 'module');
            script.setAttribute('src', js);

            script.addEventListener('load', res);
            script.addEventListener('error', rej);

            div.appendChild(script);
        })
        window.scripts.init();
    }

}
