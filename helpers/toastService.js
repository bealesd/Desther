//TODO - enable toast to be auto stacking, i..e hit stack limit, then store toasts to show later

class ToastService {
    MAX_TOASTS = 4;

    TOAST_TYPE = Object.freeze({
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
    });

    // toastMessage = [];

    showToast(message, type = this.TOAST_TYPE.INFO) {
        // this.toastMessage.push({
        //     message: message,
        //     type: type
        // });

        const container = document.getElementById("toast-container");

        // // Remove oldest toast if stack limit is reached
        // if (container.children.length >= MAX_TOASTS) {
        //     container.removeChild(container.firstChild);
        // }

        // Create toast element
        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        toast.innerHTML = `
                <span>${message}</span>
                <button class="close-btn">×</button>
        `;
        toast.querySelector('.close-btn').addEventListener('click', this.removeToast.bind(this));
        
        container.appendChild(toast);

        // // Auto-remove after 5 seconds
        // setTimeout(() => {
        //     if (toast.parentNode) {
        //         toast.remove();
        //     }
        // }, 5000);
    }

    removeToast(event) {
        event.srcElement.closest('button').parentElement.remove();
    }
}

export default new ToastService;
