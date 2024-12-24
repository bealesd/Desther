export default class GeneralHelper {
    static async timeout(ms) {
        const promise = new Promise((res, rej) => {
            setTimeout(() => { res() }, ms)
        });
        return promise;
    }
}
