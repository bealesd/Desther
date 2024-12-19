
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";

class Chat {
    constructor() {
        //Get url params
        const url = new URL(window.location);
        const guid = url.searchParams.get('guid');

        // TODO use guid to get chats via request helper
    }
   
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Chat(); } }