export default class PageInfo {
    static pageInfoTitle = 'page-info-title';
    static pageInfoContent = 'page-info-content';
    static pageInfoExtraContent = 'page-info-tooltip';

    static setInfo({title, extraContent}) {
        PageInfo.#setTitle(title);
        PageInfo.#setExtraContent(extraContent);
    }

    static #setTitle(title) {
        const pageTitleElement = document.querySelector(`#${PageInfo.pageInfoTitle}`);
        pageTitleElement.textContent = title;
    }

    static #setExtraContent(content) {
        const pageExtraContentElement = document.querySelector(`.${PageInfo.pageInfoExtraContent}`);
        pageExtraContentElement.textContent = content;
    }
}
