import GlobalConfig from "../config.js";
import GeneralHelper from "./generalHelpers.js";

/**
 * Logs messages.
 * Adds additional metadata information to the log.
 */
class Logger {
    log(message, logLevel = GlobalConfig.LOG_LEVEL.INFO, lineNumber = 0) {
        const augmentedMessage = {
            message: message,
            logLevel: Object.values(GlobalConfig.LOG_LEVEL).includes(logLevel) ? logLevel : GlobalConfig.LOG_LEVEL.INFO,
            filename: GeneralHelper.getCallerFile(),
            lineNumber: isNaN(parseInt(lineNumber)) ? 0 : parseInt(lineNumber),
            timestamp: GeneralHelper.getTime()
        }
        this.#printMessage(augmentedMessage);
    }

    #printMessage(message) {
        if (message?.message === "Could not find toast container. Unable to remove toast."){
            console.warn(message);
        }
        if (message.logLevel === GlobalConfig.LOG_LEVEL.WARNING) {
            console.warn(message);
        }
        else {
            console.log(message);
        }
    }
}

export default new Logger;
