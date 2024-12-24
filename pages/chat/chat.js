
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";

class Chat {
    guid = null;

    constructor() {
        //Get url params
        const url = new URL(window.location);
        this.guid = url.searchParams.get('guid');
        console.log(this.guid);

        this.init();
    }

    async init() {
        // TODO make chat fetching this easy
        // only get last 100 messages
        // then on scrollup get next 100 messages
        // dont worry about if a message has been read
        // dont bother storing on device
        const chats = await this.#GetLast100Chats();
        this.renderChats(chats);
    }

    renderChats(chats) {
        const chatContainerElement = document.querySelector(`.chat-container`);

        if (chats?.error) {
            chatContainerElement.innerHTML =
                `<details>
                    <summary>Failed to get chats</summary>
                    Error: ${chats.error}.
                </details>`;
            return;
        }

        for (const chat of chats) {
            const chatMessageDiv = document.createElement('div');
            chatMessageDiv.classList.add('chat-message');
            const chatHtml = `  <div class="message-header">
                                    <span class="username">${chat.Name}</span>
                                    <span class="datetime">${chat.DateTime}</span>
                                </div>
                                <div class="message-content">
                                    ${chat.Message}
                                </div>`;
            chatMessageDiv.innerHTML = chatHtml;
            chatContainerElement.appendChild(chatMessageDiv);
        }
    }

    async #GetLast100Chats() {
        const url = `${GlobalConfig.apis.chat}/GetChats?guid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url);
        return records;
    }
   
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Chat(); } }