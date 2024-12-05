import GlobalConfig from "../config.js";

export default new class LoginHelper {
    loggedIn = false;
    jwtToken = '';
    username = '';
    usernameId = null;

    constructor(
    ) { }

    async validateToken() {
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${this.jwtToken}`);
    }

    async login(user) {
        const jwtToken = await this.#GetToken(user);
        if (jwtToken === null) {
            this.loggedIn = false;
            return;
        }
        this.jwtToken = jwtToken;

        this.usernameId = await this.GetUsernameId(user.username);
        if (this.usernameId === null) {
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

        window.localStorage.removeItem(`loginService:loginDetails`);
        this.loggedIn = false;
    }

    async #GetToken(user) {
        const url = `${GlobalConfig.apis.auth}/Login`;
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(user)
            });
            const records = await response.json();
            return records;
        } catch (error) {
            this.loggedIn = false;
            return null;
        }
    }

    async GetUsernameId(username) {
        const url = `${GlobalConfig.apis.auth}/GetUsernameId?username=${username}`;

        try {
            const myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/json');

            const response = await fetch(url, {
                method: 'GET',
            });
            const id = await response.json();
            return id;
        } catch (error) {
            this.loggedIn = false;
            return null;
        }
    }
}
