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
            filename: this.#getCallerFile(),
            lineNumber: isNaN(parseInt(lineNumber)) ? 0 : parseInt(lineNumber),
            timestamp: GeneralHelper.getTime()
        }
        this.#printMessage(augmentedMessage);
    }

    #printMessage(message) {
        if (message?.message === "Could not find toast container. Unable to remove toast."){
            let a = 1;
        }
        if (message.logLevel === GlobalConfig.LOG_LEVEL.WARNING) {
            console.warn(message);
        }
        else {
            console.log(message);
        }
    }

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
}

export default new Logger;
