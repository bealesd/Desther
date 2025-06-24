import GlobalConfig from "../config.js";
import Logger from "./Logger.js";

class ToastService {
    MAX_TOASTS = 4;
    TOAST_TIMEOUT_SECONDS = 20;
    toastQueue = [];

    addToast(message, type = GlobalConfig.TOAST_TYPE.INFO, debug = false) {
        // Only show toast if not debug, or if debug is true and global debug is enabled
        if (debug && !GlobalConfig.DEBUG) {
            return;
        }
        const container = document.getElementById("toast-container");

        // Add toast to stack if limit is reached
        if (container.children.length >= this.MAX_TOASTS) {
            this.toastQueue.push({
                message: message,
                type: type
            });
            return;
        }

        // Create toast element
        const toastElement = document.createElement("div");
        toastElement.classList.add("toast", type);
        toastElement.innerHTML = `
                <span>${message}</span>
                <button class="close-btn">×</button>
        `;

        toastElement.querySelector('.close-btn').addEventListener('click', (event) => {
            const toastElement = event.target.closest('button').parentElement;
            this.#removeToast(toastElement);
        });

        container.appendChild(toastElement);

        if (type === GlobalConfig.TOAST_TYPE.INFO)
            this.#autoRemoveToast(toastElement);
    }

    #autoRemoveToast(toastElement) {
        const timeoutId = setTimeout(() => {
            this.#removeToast(toastElement);
        }, this.TOAST_TIMEOUT_SECONDS * 1000);
        
        toastElement.dataset['timeoutId'] = timeoutId;
    }

    #removeToast(toastElement) {
        if (!toastElement.parentNode) {
            Logger.log('Could not find toast container. Unable to remove toast.', GlobalConfig.LOG_LEVEL.ERROR)
            return;
        }

        // stop toast auto removing once it is gone
        const timeoutId = toastElement.dataset.timeoutId;
        if (timeoutId)
            clearTimeout(timeoutId)
        toastElement.remove();

        // Add the oldest message to the screen if there is a toast queue, FIFO
        if (this.toastQueue.length > 0) {
            const toast = this.toastQueue.shift();
            this.addToast(toast.message, toast.type);
        }
    }
}

export default new ToastService;
