export default class GeneralHelper {
    static async timeout(ms) {
        const promise = new Promise((res, rej) => {
            setTimeout(() => { res() }, ms)
        });
        return promise;
    }

    static getTime(){
        return (new Date()).toLocaleTimeString();
    }

    static getCallerFile() {
        var originalFunc = Error.prepareStackTrace;

        var callerFile;
        try {
            var err = new Error();
            var currentFile;

            Error.prepareStackTrace = function (err, stack) { return stack; };

            currentFile = err.stack.shift().getFileName();

            while (err.stack.length) {
                callerFile = err.stack.shift().getFileName();

                if (currentFile !== callerFile) break;
            }
        } catch (e) { }

        Error.prepareStackTrace = originalFunc;

        return callerFile;
    }
}
