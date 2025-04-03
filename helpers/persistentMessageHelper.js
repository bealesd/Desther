import GeneralHelper from "./generalHelpers.js";
import toastService from "./toastService.js";
import GlobalConfig from "../config.js";
/**
 * For persistent messages.
 * Aim - print messages to screen and console on receiving a message
 *     - on a redirect don't print until redirect done
 *         - a flag to say do not print instantly
 *     - add metadata
 *        - date and time
 *        - line of code
 *        - file name
 * Using session storage means messages persist on redirects, but not across tabs or page closes.
 */
class PersistentMessageHelper {
    KEY = 'messages'


    #getCallerFile() {
        var originalFunc = Error.prepareStackTrace;

        var callerfile;
        try {
            var err = new Error();
            var currentfile;

            Error.prepareStackTrace = function (err, stack) { return stack; };

            currentfile = err.stack.shift().getFileName();

            while (err.stack.length) {
                callerfile = err.stack.shift().getFileName();

                if (currentfile !== callerfile) break;
            }
        } catch (e) { }

        Error.prepareStackTrace = originalFunc;

        return callerfile;
    }

    addMessage(message, logLevel = GlobalConfig.LOG_LEVEL.INFO, logType = GlobalConfig.LOG_TYPE.CONSOLE, lineNumber = 0) {
        // TODO, this is for logging helper
        // this class should only persist messages across redirects
        const messages = this.getMessages();
        const augmentedMessage = {
            message: message,
            logLevel: Object.values(GlobalConfig.LOG_LEVEL).includes(logLevel) ? logLevel : GlobalConfig.LOG_LEVEL.INFO,
            logType: Object.values(GlobalConfig.LOG_TYPE).includes(logType) ? logType : GlobalConfig.LOG_TYPE.CONSOLE,
            filename: this.#getCallerFile(),
            lineNumber: isNaN(parseInt(lineNumber)) ? 0 : parseInt(lineNumber),
            timestamp: GeneralHelper.getTime()
        }
        messages.push(augmentedMessage);

        // Save messages to session
        sessionStorage.setItem(this.KEY, JSON.stringify(messages));
    }

    getMessages() {
        // Get messages from session
        let messages = JSON.parse(sessionStorage.getItem(this.KEY));
        messages = Array.isArray(messages) ? messages : [];
        return messages;
    }

    setMessages(messages) {
        if (!Array.isArray(messages))
            messages = [];

        sessionStorage.setItem(this.KEY, JSON.stringify(messages));
    }

    clearMessages() {
        sessionStorage.removeItem(this.KEY);
    }

    printMessages() {
        for (const message of this.getMessages()) {
            
            if (message.logType === GlobalConfig.LOG_TYPE.CONSOLE)
                console.log(message);
            else if (message.logType === GlobalConfig.LOG_TYPE.TOAST)
                toastService.showToast(`Persistent message: ${message.message}`);
        }
        this.clearMessages();
    }
}

export default new PersistentMessageHelper;
