import GlobalConfig from "../config.js";
import RequestHelper from "./requestHelper.js";

export default new class LoginHelper {
    loggedIn = false;
    jwtToken = '';
    username = '';
    usernameId = null;

    constructor() { }

    async login(user) {
        const jwtToken = await this.#GetToken(user);
        if (!jwtToken) {
            this.loggedIn = false;
            return;
        }
        this.jwtToken = jwtToken;

        this.usernameId = await this.#GetUsernameId(user.username);
        if (!this.usernameId) {
            this.loggedIn = false;
            return;
        }
        this.username = user.username;
        this.loggedIn = true;
    }

    logout() {
        this.username = '';
        this.usernameId = null;
        this.jwtToken = '';
        this.loggedIn = false;
    }

    async #GetToken(user) {
        const url = `${GlobalConfig.apis.auth}/Login`;
        const token = await RequestHelper.PostJson(url, user);
        if (token?.error)
            return null;
        return token;
    }

    async #GetUsernameId(username) {
        const url = `${GlobalConfig.apis.auth}/GetUsernameId?username=${username}`;
        const id = await await RequestHelper.GetJson(url);
        if (id?.error)
            return null;
        return id;
    }
}
