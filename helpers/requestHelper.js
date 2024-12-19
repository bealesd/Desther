
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";

export default class RequestHelper {

    static async GetJsonWithAuth(url) {
        const myHeaders = new Headers();
        // TODO delete once used somewhere else
        // myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${LoginHelper.jwtToken}`);
        try {
            const response = await fetch(url, {
                method: 'Get',
                headers: myHeaders,
            });

            // TODO change alert to a custom non invasive alert, message service
            // if (response.status === 401)
            //     alert('Please login');

            if (!response.ok)
                throw new Error(`${response.status} ${response.statusText}`);

            const json = await response.json();
            return json;
        } catch (error) {
            return { error: error.message };
        }
    }

}
