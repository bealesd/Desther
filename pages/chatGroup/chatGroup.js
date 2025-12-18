
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import EventHandler from "../../helpers/eventHandler.js";
import CreateModal from "../../helpers/create-modal/create-modal.js";

class ChatGroup {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        chatGroupContainer: 'chat-group-container'
    });

    domIds = Object.freeze({
        chatGroupArea: 'chat-group-area',
        createGroupBtnId: 'create-group-btn-id',
    });

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        const chatGroups = await this.#GetChatGroups();
        if (chatGroups?.error) {
            toastService.addToast('Failed to get chat groups.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to get chat groups. Error: ${JSON.stringify(chatGroups.error)}`, GlobalConfig.LOG_LEVEL.ERROR);
            this.chatGroups = [];
        }

        this.chatGroups = chatGroups;

        this.renderChatGroups();
        toastService.addToast('On Chat Group Page.', GlobalConfig.LOG_LEVEL.WARNING, true);

        this.registerCallbacks();
    }

    registerCallbacks() {
        const chatGroupCreateButton = document.querySelector(`#${this.domIds.createGroupBtnId}`);
        EventHandler.overwriteEvent({
            'id': 'chat-group-create-event',
            'eventType': 'click',
            'element': chatGroupCreateButton,
            'callback': () => {
                this.modal = this.showCreateGroupModal();
            }
        });
    }

    renderChatGroups() {
        const chatGroupElement = document.querySelector(`#${this.domIds.chatGroupArea} .${this.domClasses.chatGroupContainer} ul`);

        if (this.chatGroups?.error) {
            chatGroupElement.innerHTML =
                `<details>
                    <summary>Failed to get chat groups</summary>
                    Error: ${chatGroups.error}.
                </details>`;
            return;
        }

        else if (this.chatGroups.length === 0) {
            chatGroupElement.innerHTML =
                `<details>
                    <summary>No chat groups</summary>
                    Contact your admin to be added to chat groups.
                </details>`;
            return;
        }

        for (const chatGroup of this.chatGroups) {
            if (chatGroup.Dom && !chatGroupElement.contains(chatGroup.Dom))
                continue;

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

            chatGroup.Dom = li;
        }
    }

    async #IsValidUsername(username) {
        if (username === LoginHelper.username) {
            toastService.addToast('Cannot add self.', GlobalConfig.LOG_LEVEL.WARNING);
            return false;
        }
        const isUsername = await this.#IsUsername(username);
        if (isUsername !== true) {
            toastService.addToast(`User not found.`, GlobalConfig.LOG_LEVEL.WARNING);
            return false;
        };
        return true;
    }

    async #GetChatGroups() {
        Logger.log(LoginHelper.username);
        const url = `${GlobalConfig.apis.chatGroup}/GetChatGroupsById/${LoginHelper.username}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }

    async #IsUsername(username) {
        const url = `${GlobalConfig.apis.auth}/IsUsername?username=${username}`;
        const isUsername = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return isUsername;
    }

    async #createGroup(usernames) {
        const url = `${GlobalConfig.apis.chatGroup}/AddChatGroup`;
        const guid = await RequestHelper.PostJsonWithAuth(url, usernames, this.signal);
        return guid;
    }

    showCreateGroupModal() {
        this.selectedUsers = [];

        const content = document.createElement('div');
        content.innerHTML = `
        <label>Add User</label>
        <input id="usernameInput" type="text">
        <button id="addUserBtn">Add</button>
        <ul id="selectedUsers"></ul>`;

        const modal = new CreateModal({
            title: "Create New Group",
            content: content,
            submitText: "Create",
            cancelText: "Cancel",
            onSubmit: async () => {
                const usernames = [LoginHelper.username, ...this.selectedUsers];
                const guid = this.#createGroup(usernames);
                if (guid?.error) {
                    toastService.addToast('Failed to get chat groups.', GlobalConfig.LOG_LEVEL.ERROR);
                    Logger.log(`Failed to get chat groups. Error: ${JSON.stringify(guid.error)}`, GlobalConfig.LOG_LEVEL.ERROR);
                    return;
                }
                this.chatGroups.push({
                    Guid: guid,
                    Usernames: usernames
                });
                this.renderChatGroups();
            }
        });

        // Set up add user event logic
        const addUserBtn = content.querySelector('#addUserBtn');
        addUserBtn.addEventListener('click', async () => {
            const username = content.querySelector('#usernameInput').value;

            if (await this.#IsValidUsername(username)) {
                this.selectedUsers.push(username);
                content.querySelector('#selectedUsers')
                    .insertAdjacentHTML("beforeend", `<li>${username}</li>`);
                content.querySelector('#usernameInput').value = '';
            }
        });

        modal.open();
        return modal;
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
        this.app?.modal?.destroy();
    }
}
