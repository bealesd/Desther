import toastService from "./toastService.js";
import GlobalConfig from "../config.js";
/**
 * For persistent toasts that survive a page redirect.
 */
class PersistentToastService {
    KEY = `messages-${Date.now.toString()}`;

    addToast(message, logLevel = GlobalConfig.LOG_LEVEL.INFO) {
        const toasts = this.#getToasts();
        
        const toast = {
            message: message,
            logLevel: Object.values(GlobalConfig.LOG_LEVEL).includes(logLevel) ? logLevel : GlobalConfig.LOG_LEVEL.INFO,
        }
        toasts.push(toast);

        this.#setToasts(toasts);
    }

    showToasts() {
        for (const toasts of this.#getToasts()) {
            toastService.addToast(toasts.message, toasts.logLevel);
        }
        this.#clearToasts();
    }

    #getToasts() {
        // Get toasts from session
        let toasts = JSON.parse(sessionStorage.getItem(this.KEY));
        toasts = Array.isArray(toasts) ? toasts : [];
        return toasts;
    }

    #setToasts(toasts) {
        if (!Array.isArray(toasts))
            toasts = [];

        sessionStorage.setItem(this.KEY, JSON.stringify(toasts));
    }

    #clearToasts() {
        sessionStorage.removeItem(this.KEY);
    }
}

export default new PersistentToastService;
