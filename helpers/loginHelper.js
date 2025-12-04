import GlobalConfig from "../config.js";
import RequestHelper from "./requestHelper.js";

export default new class LoginHelper {
    loggedIn = false;
    jwtToken = '';
    username = '';
    usernameId = null;

    constructor() { }

    async login(user, signal) {
        const jwtToken = await this.#GetToken(user, signal);
        if (!jwtToken) {
            this.loggedIn = false;
            return;
        }
        this.jwtToken = jwtToken;

        this.username = user.username;
        this.loggedIn = true;
    }

    logout() {
        this.username = '';
        this.jwtToken = '';
        this.loggedIn = false;
    }

    async #GetToken(user, signal = null) {
        const url = `${GlobalConfig.apis.auth}/Login`;
        const token = await RequestHelper.PostJson(url, user, {signal: signal});
        if (token?.error)
            return null;
        return token;
    }
}
