import RequestHelper from "./requestHelper.js";

export default new class ContentLoader {
    startupScripts = {};
    script = null;
    currentScript = null;

    async loadHtml(div, html, signal = null) {
        const rawHtml = await RequestHelper.GetText(html, signal);
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

        // A script is loaded once due to browser caching!
        // The windows.script function must be stored to be loaded again.
        this.startupScripts[`${js}`] = this.startupScripts[`${js}`] ?? window.scripts;
        this.startupScripts[`${js}`].init();
    }
}
