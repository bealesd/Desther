import RequestHelper from "./requestHelper.js";

export default new class ContentLoader {
    scriptCallbacks = {};

    async loadHtml(div, html) {
        const rawHtml = await RequestHelper.GetText(html);
        if (rawHtml?.error)
            return false;
        div.innerHTML = rawHtml;
        return true;
    }

    async loadCss(div, css) {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = css;
        div.appendChild(styleLink);
    }

    async loadJs(div, js) {
        await new Promise((res, rej) => {
            const script = document.createElement('script');
            script.setAttribute('type', 'module');
            // We could use cachebusting i.e. + '?cachebuster='+ new Date().getTime());
            // But this would stop breakpoints working.
            script.setAttribute('src', js);

            script.addEventListener('load', res);
            script.addEventListener('error', rej);

            div.appendChild(script);
        });

        // Each script that is loaded assigns it start up logic to window.scripts.init.
        const scriptInitilizer = window.scripts.init;
        const scriptCallback = () => { scriptInitilizer(); }
        // A script is loaded once (caching), so we use callbacks to call its' start up logic.
        this.scriptCallbacks[`${js}`] = this.scriptCallbacks[`${js}`] ?? scriptCallback;
        this.scriptCallbacks[`${js}`]();
    }
}
