export default class PageInfo {
    static pageInfoTitle = 'page-info-title';
    static pageInfoContent = 'page-info-content';
    static pageInfoExtraContent = 'page-info-tooltip';
    static pageInfoIcon = 'page-info-icon';

    static setInfo({ title, extraContent }) {
        PageInfo.#setTitle(title);
        PageInfo.#setExtraContent(extraContent);
    }

    static #setTitle(title) {
        const pageTitleElement = document.querySelector(`#${PageInfo.pageInfoTitle}`);
        pageTitleElement.textContent = title;
    }

    static #setExtraContent(content) {
        if (content.includes('Not Logged In')) {
            document.querySelector(`.${this.pageInfoIcon}`).classList.add('page-info-logged-out');
            document.querySelector(`.${this.pageInfoIcon}`).classList.remove('page-info-logged-in');
        }
        else {
            document.querySelector(`.${this.pageInfoIcon}`).classList.remove('page-info-logged-out');
            document.querySelector(`.${this.pageInfoIcon}`).classList.add('page-info-logged-in');
        }

        const pageExtraContentElement = document.querySelector(`.${PageInfo.pageInfoExtraContent}`);
        pageExtraContentElement.textContent = content;
    }
}
