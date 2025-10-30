
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";

class ChatGroup {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        chatGroupContainer: 'chat-group-container'
    });

    domIds = Object.freeze({
        chatGroupArea: 'chat-group-area',
    });

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        const chatGroups = await this.#GetChatGroups();
        this.renderChatGroups(chatGroups);
        toastService.addToast('On Chat Group Page.', GlobalConfig.LOG_LEVEL.WARNING, true);
    }

    renderChatGroups(chatGroups) {
        const chatGroupElement = document.querySelector(`#${this.domIds.chatGroupArea} .${this.domClasses.chatGroupContainer} ul`);

        if (chatGroups?.error) {
            chatGroupElement.innerHTML =
                `<details>
                    <summary>Failed to get chat groups</summary>
                    Error: ${chatGroups.error}.
                </details>`;
            return;
        }

        else if (chatGroups.length === 0) {
            chatGroupElement.innerHTML =
                `<details>
                    <summary>No chat groups</summary>
                    Contact your admin to be added to chat groups.
                </details>`;
            return;
        }

        for (const chatGroup of chatGroups) {
            const li = document.createElement('li');
            const button = document.createElement('button');
            // Show users in chat group
            const chatGroupText = chatGroup['Usernames'].join(' and ');
            button.textContent = chatGroupText;
            // Add chat link for each chat group
            button.dataset.router = true;
            button.setAttribute('href', `/chat?guid=${chatGroup['Guid']}`)
            
            li.appendChild(button);
            chatGroupElement.appendChild(li);
        }
    }

    async #GetChatGroups() {
        Logger.log(LoginHelper.usernameId);
        const url = `${GlobalConfig.apis.chatGroup}/GetChatGroupsById/${LoginHelper.usernameId}`;

        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = {
    app: null,

    init: function () {
        this.app = new ChatGroup();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
    }
}
