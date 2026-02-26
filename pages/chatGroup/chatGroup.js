
import GlobalConfig from "../../config.js";
import Logger from "../../helpers/logger.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import toastService from "../../helpers/toastService.js";
import EventHandler from "../../helpers/eventHandler.js";
import CreateModal from "../../helpers/create-modal/create-modal.js";
import state from "../../helpers/state.js";

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
            Logger.log(`Failed to get chat groups. Error: ${chatGroups.message}`, GlobalConfig.LOG_LEVEL.ERROR);
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
                    Error: ${chatGroups.message}.
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
            if (chatGroup.Dom && chatGroupElement.contains(chatGroup.Dom))
                continue;

            const li = document.createElement('li');
            const button = document.createElement('button');

            const users = chatGroup['Users'];
            const name = chatGroup['Name'];
            const guid = chatGroup['Guid'];
            state.set(`Chat:${guid}:Users`, users);
            state.set(`Chat:${guid}:Name`,);

            button.textContent = name;
            button.title = `Users: ${users.map(u => u.Username).join(', ')}`;
            // Add chat link for each chat group
            button.dataset.router = true;
            button.setAttribute('href', `/chat?guid=${guid}`)

            li.appendChild(button);
            chatGroupElement.appendChild(li);

            chatGroup.Dom = li;
        }
    }

    async #GetChatGroups() {
        Logger.log(LoginHelper.usernameId);
        const url = `${GlobalConfig.apis.chatGroup}/GetChatGroupsById/${LoginHelper.usernameId}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }

    async #GetUsernameId(username) {
        const url = `${GlobalConfig.apis.auth}/IsUsername?username=${username}`;
        const userId = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return userId;
    }

    async #createGroup(usernameIds, name) {
        const url = `${GlobalConfig.apis.chatGroup}/AddChatGroup`;
        const guid = await RequestHelper.PostJsonWithAuth(url, { UsernameIds: usernameIds, Name: name }, this.signal);
        return guid;
    }

    showCreateGroupModal() {
        this.selectedUsers = [LoginHelper.username];
        this.selectedUserIds = [LoginHelper.usernameId];

        const content = document.createElement('div');
        content.innerHTML = `
            <label for="groupName">Group Name</label>
            <input name="groupName" id="groupName" type="text" required>
            
            <label for="usernameInput">Add User</label>
            <div class="input-row">
                <input id="usernameInput" type="text">
                <button id="addUserBtn">Add</button>
            </div>

            
            <ul id="selectedUsers"></ul>
        `;

        const modal = new CreateModal({
            title: "Create New Group",
            content: content,
            submitText: "Create",
            cancelText: "Cancel",
            onSubmit: async () => {
                let name = content.querySelector('#groupName').value;
                if ([null, undefined, ''].includes(name))
                    name = this.selectedUsers.join(', ');

                const guid = await this.#createGroup(this.selectedUserIds, name);
                if (guid?.error) {
                    toastService.addToast('Failed to get chat groups.', GlobalConfig.LOG_LEVEL.ERROR);
                    Logger.log(`Failed to get chat groups. Error: ${guid.message}`, GlobalConfig.LOG_LEVEL.ERROR);
                    return;
                }

                const users = [];
                for (const username of this.selectedUsers) {
                    users.push({ Username: username });
                }

                this.chatGroups.push({
                    Guid: guid,
                    Name: name,
                    Users: users
                });
                this.renderChatGroups();
            }
        });

        // Set up add user event logic
        const addUserBtn = content.querySelector('#addUserBtn');
        addUserBtn.addEventListener('click', async () => {
            const username = content.querySelector('#usernameInput').value;

            if(username === LoginHelper.username){
                alert('You can not add yourself!');
                return;
            }

            const result = await this.#GetUsernameId(username);
            if(result?.error){
                alert(`Username not found. Error: ${result.message}`);
                return;
            }

            this.selectedUserIds.push(result.Id);
            this.selectedUsers.push(username);

            content.querySelector('#selectedUsers').insertAdjacentHTML("beforeend", `<li>${username}</li>`);
            content.querySelector('#usernameInput').value = '';
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
