
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import GeneralHelper from "./generalHelpers.js";
import MessageHelper from "./messageHelper.js";

export default class RequestHelper {

    static async #interceptedFetch(url, options = {}) {
        // try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            // TODO try refreshing the token
            // const newToken = await refreshToken();
            // if (newToken) {
            //     return customFetchWithToken(url, options, newToken); // Retry the request with the new token

            if (GlobalConfig.DEBUG)
                await GeneralHelper.timeout(5000);

            // TODO use mesage service, becuase this will be lost on redirect
            const message = `${response.url}: ${response.status} ${response.statusText}. Redirect to login.`;
            MessageHelper.addMessage(message);
            console.error(message);

            window.location.href = '/login';
            return;
        }
        return response;
    }

    static async #fetchWithToken(url, options = {}) {
        options.headers = Object.hasOwn(options, 'headers') ? options.headers : new Headers();

        if (options.headers instanceof Headers)
            options.headers.set('Authorization', `Bearer ${LoginHelper.jwtToken}`);
        else if (options.headers.constructor == Object)
            options.headers['Authorization'] = `Bearer ${LoginHelper.jwtToken}`;
        else
            throw new Error('options.headers is an invalid type');

        return this.#interceptedFetch(url, options);
    }

    static async #fetch(url, options = {}) {
        return this.#interceptedFetch(url, options);
    }

    async refreshToken() {
        // Implement your token refresh logic here
        console.log('Refreshing token...');
        return 'new-token-here'; // Replace with actual refreshed token
    }

    static async GetText(url) {
        try {
            const response = await this.#fetch(url, {
                method: 'Get'
            });

            this.handleNotOkResponse(response);
            const text = await response.text();
            return text;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async GetJson(url) {
        try {
            const response = await this.#fetch(url, {
                method: 'Get'
            });

            this.handleNotOkResponse(response);
            const json = await response.json();
            return json;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async GetJsonWithAuth(url) {
        try {
            const response = await this.#fetchWithToken(url, {
                method: 'Get'
            });

            this.handleNotOkResponse(response);
            const json = await response.json();
            return json;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async PostJson(url, object, withAuth=false) {
        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        const fetchMethod = withAuth ? this.#fetchWithToken : this.#fetch;

        try { 
            const response = await fetchMethod.call(this, url, {
                method: 'POST',
                headers: myHeaders,
                body: JSON.stringify(object),
            });
            this.handleNotOkResponse(response);
            const json = await response.json();
            return json;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async PostJsonWithAuth(url, object) {
        return this.PostJson(url, object, true);
    }

    static handleNotOkResponse(response) {
        if (!response.ok)
            throw new Error(`${response.status} ${response.statusText}`);
    }

    static handleFetchError(error) {
        return { error: `Fetch failed.\t${error.message}` };
    }

}
