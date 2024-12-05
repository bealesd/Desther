
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";

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

        for (const chatGroup of chatGroups) {
            const li = document.createElement('li');
            li.dataset.guid = chatGroup['Guid'];
            const chatGroupText = chatGroup['Usernames'].join(' and ');
            li.textContent = chatGroupText;
            chatGroupElement.appendChild(li);
        }
    }

    async #GetChatGroups() {
        console.log(LoginHelper.usernameId);
        const url = `${GlobalConfig.apis.chatGroup}/GetChatGroupsById/${LoginHelper.usernameId}`;

        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', `Bearer ${LoginHelper.jwtToken}`);
        try {
            const response = await fetch(url, {
                method: 'Get',
                headers: myHeaders,
            });
            const records = await response.json();
            return records;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new ChatGroup(); } }