
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";

class ChatGroup {
    constructor() {
        this.init();
    }

    async init() {
        const chatGroups = await this.#GetChatGroups();
        this.renderChatGroups(chatGroups);
    }

    renderChatGroups(chatGroups) {
        const chatGroupElement = document.querySelector(`#${GlobalConfig.domIds.chatGroupArea} .${GlobalConfig.domClasses.chatGroupBox} ul`);

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
        console.log(LoginHelper.usernameId);
        const url = `${GlobalConfig.apis.chatGroup}/GetChatGroupsById/${LoginHelper.usernameId}`;

        const records = await RequestHelper.GetJsonWithAuth(url);
        return records;
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new ChatGroup(); } }