
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import EventHandler from "../../helpers/eventHandler.js";
import Logger from "../../helpers/logger.js";
import LoadingScreen from "../../helpers/loadingScreen.js";
import toastService from "../../helpers/toastService.js";

class Chat {
    _cancelled = false;
    _activeController = null;
    signal = null;

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

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        //Get url params - guid
        const url = new URL(window.location);
        this.guid = url.searchParams.get('guid');

        // only get last 100 messages
        // then on scroll-up get next 100 messages
        LoadingScreen.showFullScreenLoader();

        this.chats = await this.#GetLast100Chats();
        await this.getChatReadStatus(this.chats);

        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        this.orderChats();
        this.renderChats();
        this.scrollToBottom();

        this.registerCallbacks();
        await this.getChatsSubscription();

        this.createObserver();
        document.querySelectorAll('.chat-message').forEach(msg => this.observer.observe(msg));
    }

    getChatById(chatId) {
        return this.chats.find(chat => chat.Id == parseInt(chatId));
    }

    /**
     * Called for every chat message element
     * If message is visible it changes its color for an incoming message
     * Visible incoming messages are marked as read in the database
     */
    createObserver() {
        this.observer = new IntersectionObserver(entries => {
            for (const { isIntersecting, target } of entries) {
                if (target.classList.contains('incoming'))
                    target.classList.toggle('intersecting', isIntersecting);

                if (isIntersecting) {
                    const chat = this.getChatById(target.dataset.chatId);
                    
                    if (this.shouldMessageBeMarkedAsRead(target))
                        this.markMessageAsRead(chat);

                    this.getMoreChats(chat);
                }
            }
            // 👇 Threshold is 100%
        }, { threshold: 1 });
    }

    observeMessage(element) {
        if (this.observer) this.observer.observe(element);
    }

    shouldMessageBeMarkedAsRead(chatMessageElement) {
        // check message is incoming
        if (!chatMessageElement.classList.contains('incoming'))
            return false;

        // additional check to confirm message is incoming
        const chat = this.chats.find(chat => chat.Id == parseInt(chatMessageElement.dataset.chatId) && !this.isOutgoingUser(chat.Name));
        return !chat?.Read;
    }

    async markMessageAsRead(chat) {
        const usernameId = await LoginHelper.GetUsernameId(chat.Name);
        await this.#AddChatRead(chat.Id, usernameId);
    }

    async getMoreChats(chat) {
        // is first chat
        if (this.chats.indexOf(chat) !== 0) return;

        toastService.addToast(`Unable to get more messages, function coming soon!`, GlobalConfig.LOG_LEVEL.WARNING);
    }

    registerCallbacks() {
        const chatScrollToBottomButton = document.querySelector(`.chat-extra-btn`);
        EventHandler.overwriteEvent({
            'id': 'chatScrollToBottomEvent',
            'eventType': 'click',
            'element': chatScrollToBottomButton,
            'callback': () => {
                this.scrollToBottom();
            }
        });

        const chatSendButton = document.querySelector(`.chat-send-btn`);
        EventHandler.overwriteEvent({
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
            toastService.addToast(`Error: no chat message`, GlobalConfig.LOG_LEVEL.ERROR);
            return;
        }

        const chatRecord = await this.#SendChat(chatMessage);
        if (chatRecord?.error) {
            toastService.addToast(`Error: ${chatGroups.error}.`, GlobalConfig.LOG_LEVEL.ERROR);
            return;
        }

        this.updatePageChats([chatRecord]);

        this.chats = [...this.chats, chatRecord];

        // clear chat input
        document.querySelector(`.${this.domClasses.chatInput}`).textContent = '';
    }

    updatePageChats(newChats) {
        const chatContainerElement = document.querySelector(`.${this.domClasses.chatContainer}`);
        if (chatContainerElement === null) {
            Logger.log('Chat container not found. Unable to update page chats.')
            return;
        }

        for (const newChat of newChats) {
            const isChatConflict = this.chats.find((chat) => {
                return chat.Id === newChat.Id;
            });

            if (isChatConflict) {
                // Edge case: chats may have been gotten by getChatsSubscription at the same time as push
                Logger.log('Chat record already added.')
                continue;
            }
            this.chats.push(newChat);

            this.renderChatDateHeader(newChat, chatContainerElement);

            const chatEl = this.addChatToScreen(chatContainerElement, newChat, newChat.Datetime);
            this.observeMessage(chatEl);
        }
    }

    async getChatReadStatus(chats) {
        const outgoingChatIds = chats
            .filter(chat => chat.Name === LoginHelper.username)
            .map(chat => chat.Id);

        const usernameId = await LoginHelper.GetUsernameId(LoginHelper.username, this.signal);

        const readChats = await this.#GetChatsThatAreRead(outgoingChatIds, usernameId);
        const readChatsIds = readChats.map(c => c.ChatId);
        const readIdsSet = new Set(readChatsIds);

        for (const chat of chats) {
            if (chat.Name === LoginHelper.username)
                chat.Read = readIdsSet.has(chat.Id);
        }
    }

    async getChatsSubscription() {
        EventHandler.overwriteIntervals('getNewChats', async () => {
            const id = this.getLastChatId();
            const newChats = await this.#GetChatsAfterId(id);

            if (newChats?.error) {
                toastService.addToast(`Error: ${newChats.error}.`, GlobalConfig.LOG_LEVEL.ERROR)
                return;
            }
            await this.getChatReadStatus(newChats);
            this.updatePageChats(newChats);

            this.chats = [...this.chats, ...newChats];
        }, this.updateIntervalInSeconds * 1000)

        EventHandler.overwriteIntervals('getChatReadStatus', async () => {
            const unreadChats = this.chats
                .filter(chat => chat.Name === LoginHelper.username)
                .filter(chat => !chat.Read);
            await this.getChatReadStatus(unreadChats);
            const readChats = unreadChats.filter(chat => chat.Read);

            for (const chat of readChats) {
                const chatEl = document.querySelector(`[data-chat-id="${chat.Id}"] .status`);
                chatEl.innerHTML = '✓';
            }

        }, this.updateIntervalInSeconds * 1000)
    }

    getLastChatId() {
        if (this.chats.length > 0)
            return this.chats[this.chats.length - 1].Id;
        else
            return null;
    }

    scrollToBottom() {
        const messagesContainer = document.querySelector(`.${this.domClasses.chatContainer}`);
        if (messagesContainer === null) {
            Logger.log('Chat container not found. Unable to scroll to bottom of chats.')
            return;
        }

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
            this.renderChatDateHeader(chat, chatContainerElement);
            this.addChatToScreen(chatContainerElement, chat, chat.Datetime);
        }
    }

    renderChatDateHeader(chat, chatContainerElement) {
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

    isOutgoingUser(name) {
        return LoginHelper.username === name;
    }

    addChatToScreen(chatContainerElement, chat, datetime) {
        const chatMessageDiv = document.createElement('div');
        chatMessageDiv.classList.add('chat-message');
        chatMessageDiv.dataset.chatId = chat.Id;
        const isOutgoingUser = this.isOutgoingUser(chat.Name);
        chatMessageDiv.classList.add(isOutgoingUser ? 'outgoing' : 'incoming');
        const chatHtml = `<div class="message-header">
                                <span class="username">${isOutgoingUser ? '' : chat.Name}</span>
                                <span class="datetime">${datetime.toLocaleTimeString()}</span>
                                <span class="status">${isOutgoingUser ? chat.Read ? '✓' : '✗' : ''}</span>
                            </div>
                            <div class="message-content">
                                ${chat.Message}
                        </div>`;
        chatMessageDiv.innerHTML = chatHtml;
        chatContainerElement.appendChild(chatMessageDiv);
        return chatMessageDiv;
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
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        this.parseDatetimeInChats(records);
        return records;
    }

    async #GetChatsAfterId(id) {
        const url = `${GlobalConfig.apis.chat}/GetChatsAfterId?id=${id}&guid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        this.parseDatetimeInChats(records);
        return records;
    }

    async #GetChatsThatAreRead(chatsIds, usernameId) {
        const url = `${GlobalConfig.apis.chatsRead}/GetChatsThatAreRead?usernameId=${usernameId}`;
        const records = await RequestHelper.PostJsonWithAuth(url, chatsIds, { signal: this.signal });
        return records;
    }

    async #AddChatRead(chatId, usernameId) {
        const url = `${GlobalConfig.apis.chatsRead}/AddChatRead?usernameId=${usernameId}&chatId=${chatId}`;
        const result = await RequestHelper.PostJsonWithAuth(url, { signal: this.signal });
        return result;
    }

    async #SendChat(message) {
        const payload = {
            name: LoginHelper.username,
            message: message,
            guid: this.guid
        }

        const url = `${GlobalConfig.apis.chat}/AddChat`;
        const chatRecord = await RequestHelper.PostJsonWithAuth(url, payload, { signal: this.signal });
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
window.scripts = {
    app: null,

    init: function () {
        this.app = new Chat();
        this.app.init();
    },

    destroy: function () {
        this.app?._activeController?.abort();
        this.app._cancelled = true;
    }
}
