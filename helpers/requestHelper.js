
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import Logger from "./logger.js";
import GeneralHelper from "./generalHelpers.js";
import toastService from "./toastService.js";

export default class RequestHelper {

    // called on every request
    static async #interceptedFetch(url, options = {}) {
        const response = await fetch(url, options);

        let responseStatus = response.status;
        const unauthorisedResponseCode = 401;
        if (responseStatus === unauthorisedResponseCode) {
            const message = `Login failed. ${response.url}: ${response.status} ${response.statusText}. Redirect to login.`;
            toastService.addToast(message, GlobalConfig.LOG_LEVEL.ERROR);

            // Wait for code to stop executing before opening login page.
            setTimeout(() => {
                const loginButton = document.querySelector('button[href="/login"][data-router="true"]');
                loginButton.click();
            }, 100);

            // Stop any other code from executing.
            // throw new Error("Unauthorized - Login required");
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
            throw new Error('options.headers is an invalid type, cannot set Authorization header');

        return this.#interceptedFetch(url, options);
    }

    static async #fetch(url, options = {}) {
        return this.#interceptedFetch(url, options);
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

            Logger.log(GeneralHelper.getTime());

            return json;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static async PostJson(url, object, withAuth = false) {
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

    static async DeleteWithAuth(url) {
        return this.Delete(url, true);
    }

    static async Delete(url, withAuth = false) {
        const fetchMethod = withAuth ? this.#fetchWithToken : this.#fetch;
        try {
            const response = await fetchMethod.call(this, url, {
                method: 'DELETE'
            });
            this.handleNotOkResponse(response);
            return true;
        } catch (error) {
            return this.handleFetchError(error);
        }
    }

    static handleNotOkResponse(response) {
        if (!response.ok)
            throw new Error(`${response.status} ${response.statusText}`);
    }

    static handleFetchError(error) {
        return { error: `Fetch failed.\t${error.message}` };
    }

}
