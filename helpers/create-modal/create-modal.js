import ContentLoader from "../contentLoader.js"

class CreateModal {
    constructor({
        title = '',
        content = '',
        onSubmit = null,
        onCancel = null,
        submitText = 'Save',
        cancelText = 'Cancel',
        closeOnBackground = true
    } = {}) {

        this.title = title;
        this.content = content;
        this.onSubmit = onSubmit;
        this.onCancel = onCancel;
        this.submitText = submitText;
        this.cancelText = cancelText;
        this.closeOnBackground = closeOnBackground;

        this.#createModal();
    }

    open() {
        document.body.appendChild(this.modalOverlay);
        document.body.style.overflow = "hidden";
    }

    destroy() {
        if (this.modalOverlay && this.modalOverlay.parentNode) {
            this.modalOverlay.remove();
        }
        document.body.style.overflow = "";
    }

    async #createModal() {
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'modal-overlay';

        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal-container';

        const header = `
            <div class="modal-header">
                <h2>${this.title}</h2>
            </div>
        `;

        const footer = `
            <div class="modal-footer">
                <button class="modal-cancel">${this.cancelText}</button>
                <button class="modal-submit">${this.submitText}</button>
            </div>
        `;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'modal-content';

        if (typeof this.content === 'string') 
            contentWrapper.innerHTML = this.content;
        else 
            contentWrapper.appendChild(this.content);

        this.modalElement.innerHTML = header;
        this.modalElement.appendChild(contentWrapper);
        this.modalElement.insertAdjacentHTML('beforeend', footer);

        this.modalOverlay.appendChild(this.modalElement);

        await ContentLoader.loadCss(this.modalOverlay, 'helpers/create-modal/create-modal.css');

        // Event listeners
        this.modalElement.querySelector('.modal-cancel')
            .addEventListener('click', () => {
                this.onCancel?.();
                this.destroy();
            });

        this.modalElement.querySelector('.modal-submit')
            .addEventListener('click', () => {
                this.onSubmit?.();
                this.destroy();
            });
    }
}

export default CreateModal;
