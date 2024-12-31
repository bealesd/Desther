
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import EventHandler from "../../helpers/eventHandler.js";

class Chat {
    domClasses = Object.freeze({
        chatContainer: 'chat-container',
        chatInput: 'chat-input'
    });

    domIds = Object.freeze({
    });

    guid = null;
    currentDate = null;
    chats = [];
    updateIntervalInSeconds = 10;

    constructor() {
        //Get url params - guid
        const url = new URL(window.location);
        this.guid = url.searchParams.get('guid');

        this.init();
    }

    async init() {
        // TODO make chat fetching this easy
        // only get last 100 messages
        // then on scrollup get next 100 messages
        // dont worry about if a message has been read
        // dont bother storing on device
        this.chats = await this.#GetLast100Chats();
        this.orderChats();
        this.renderChats();
        this.scrollToBottom();

        this.registerCallbacks();
        this.getChatsSubscription();
    }

    registerCallbacks() {
        // TODO this is called each time chat.js is navigated to!
        // Need to kill old callbacks if required. Abort controller? Or overwriteEvents in eventhandler
        // When login button is clicked, login
        const chatScrollToBottomButton = document.querySelector(`.chat-extra-btn`);
        EventHandler.overwriteEvents({
            'id': 'chatScrollToBottomEvent',
            'eventType': 'click',
            'element': chatScrollToBottomButton,
            'callback': () => {
                this.scrollToBottom();
            }
        });

        const chatSendButton = document.querySelector(`.chat-send-btn`);
        EventHandler.overwriteEvents({
            'id': 'chatSendEvent',
            'eventType': 'click',
            'element': chatSendButton,
            'callback': () => {
                this.sendChat();
            }
        });
    }

    async sendChat() {
        const chatMessage = document.querySelector(`.${this.domClasses.chatInput}`).textContent;
        if (chatMessage?.length === 0 && chatMessage.trim().length === 0) {
            alert('Error: no chat message');
            return;
        }

        const chatRecord = await this.#SendChat(chatMessage);
        if (chatRecord?.error) {
            alert(`Error: ${chatGroups.error}.`);
            return;
        }

        this.updatePageChats([chatRecord]);
    
        // clear chat input
        document.querySelector(`.${this.domClasses.chatInput}`).textContent = '';
    }

    updatePageChats(newChats) {
        const chatContainerElement = document.querySelector(`.${this.domClasses.chatContainer}`);

        for (const newChat of newChats) {
            const isChatConflict = this.chats.find((chat) => {
                return chat.Id === newChat.Id;
            });

            if (isChatConflict) {
                // Edge case: chats may have been gotten by getChatsSubscription at the same time as push
                console.log('Chat record already added.')
                continue;
            }
            this.chats.push(newChat);
            
            this.renderChatDateHeader(newChat,chatContainerElement);
            this.addChatToScreen(chatContainerElement, newChat, newChat.Datetime);
        }

        this.scrollToBottom();
    }

    getChatsSubscription() {
        // TODO kill this on leaving page?
        // Could check current page?
        // or register like events, bit different, events are so the callbacks are remembered, and not added twice
        setInterval(async () => {
            const id = this.getLastChatId();
            const newChats = await this.#GetChatsAfterId(id);
            if (newChats?.error) {
                alert(`Error: ${newChats.error}.`);
                return;
            }

            this.updatePageChats(newChats);
        }, this.updateIntervalInSeconds * 1000);
    }

    getLastChatId() {
        if (this.chats.length > 0)
            return this.chats[this.chats.length - 1].Id;
        else
            return null;
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector(`.${this.domClasses.chatContainer}`);

        const messageHeightOutOfView = messagesContainer.scrollHeight - messagesContainer.clientHeight;
        const messageContainerScrolledToBottom = messagesContainer.scrollTop === messageHeightOutOfView;

        if (messageHeightOutOfView > 0 && !messageContainerScrolledToBottom)
            messagesContainer.scrollTop = messageHeightOutOfView;
    }

    renderChats() {
        const chatContainerElement = document.querySelector(`.${this.domClasses.chatContainer}`);

        if (this.chats?.error) {
            chatContainerElement.innerHTML =
                `<details>
                    <summary>Failed to get chats</summary>
                    Error: ${this.chats.error}.
                </details>`;
            return;
        }

        for (const chat of this.chats) {
            this.renderChatDateHeader(chat,chatContainerElement);
            this.addChatToScreen(chatContainerElement, chat, chat.Datetime);
        }
    }

    renderChatDateHeader(chat, chatContainerElement){
        // Check if the chat day has changed, and add a date title.
        // Assumption, the chats are ordered by date.
        if (chat.Datetime.toDateString() !== this.currentDate?.toDateString()) {
            this.currentDate = chat.Datetime;
            this.addChatDateToScreen(chatContainerElement, chat.Datetime);
        }
    }

    addChatDateToScreen(chatContainerElement, datetime) {
        const chatHeaderDiv = document.createElement('div');
        chatHeaderDiv.classList.add('chat-header');
        const chatHeaderHtml = datetime.toLocaleDateString();
        chatHeaderDiv.innerHTML = chatHeaderHtml;
        chatContainerElement.appendChild(chatHeaderDiv);
    }

    addChatToScreen(chatContainerElement, chat, datetime) {
        const chatMessageDiv = document.createElement('div');
        chatMessageDiv.classList.add('chat-message');
        const isOutgoingUser = LoginHelper.username === chat.Name;
        chatMessageDiv.classList.add(isOutgoingUser ? 'outgoing' : 'incoming');
        const chatHtml = `<div class="message-header">
                                <span class="username">${isOutgoingUser ? '' : chat.Name}</span>
                                <span class="datetime">${datetime.toLocaleTimeString()}</span>
                            </div>
                            <div class="message-content">
                                ${chat.Message}
                        </div>`;
        chatMessageDiv.innerHTML = chatHtml;
        chatContainerElement.appendChild(chatMessageDiv);
    }

    orderChats() {
        this.chats.sort((a, b) => { return parseInt(a.Id) - parseInt(b.Id) });
    }

    parseDatetimeInChats(chats) {
        for (const chat of chats) {
            chat.Datetime = new Date(chat.Datetime);
        }
    }

    async #GetLast100Chats() {
        const url = `${GlobalConfig.apis.chat}/GetChats?guid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url);
        this.parseDatetimeInChats(records);
        return records;
    }

    async #GetChatsAfterId(id) {
        const url = `${GlobalConfig.apis.chat}/GetChatsAfterId?id=${id}&guid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url);
        this.parseDatetimeInChats(records);
        return records;
    }

    async #SendChat(message) {
        const payload = {
            name: LoginHelper.username,
            message: message,
            guid: this.guid
        }

        const url = `${GlobalConfig.apis.chat}/AddChat`;
        const chatRecord = await RequestHelper.PostJsonWithAuth(url, payload);
        this.parseDatetimeInChats([chatRecord]);
        return chatRecord;


    }
}

// Example chat record
// {
//     "Id": 1234,
//     "Name": "joe",
//     "Message": "cat jumped on sofa",
//     "Datetime": "2084-01-11T12:01:39.47",
//     "Guid": "guid"
// }

// Called by contentLoader, when loading the correspond page.
window.scripts = { init: () => { new Chat(); } }