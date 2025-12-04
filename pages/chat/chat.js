
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
        chatInput: 'chat-input',
        chatHeader: 'chat-header',
        messageHeader: 'message-header',
        messageContent: 'message-content',
        username: 'username',
        datetime: 'datetime',
        status: 'status'
    });

    domIds = Object.freeze({
    });

    guid = null;
    dateHeaders = [];
    chats = [];
    updateIntervalInSeconds = 10;

    async init() {
        this._activeController = new AbortController();
        this.signal = this._activeController?.signal;

        const url = new URL(window.location);
        this.guid = url.searchParams.get('guid');

        this.container = document.querySelector(`.${this.domClasses.chatContainer}`);

        LoadingScreen.showFullScreenLoader();

        const chats = await this.#GetLast100Chats();
        if (chats?.error) {
            toastService.addToast(`Error: ${this.chats?.error}.`, GlobalConfig.LOG_LEVEL.ERROR)
            return;
        }

        this.chats = chats;
        await this.getChatReadStatus(this.chats);

        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        this.renderChats();
        this.scrollToBottom();

        this.registerCallbacks();
        await this.getChatsSubscription();

        this.createObserver();
        this.createLoadMoreSentinel();
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
                if (!target.classList.contains('chat-message'))
                    return;

                if (target.classList.contains('incoming'))
                    target.classList.toggle('intersecting', isIntersecting);

                if (isIntersecting) {
                    const chat = this.getChatById(target.dataset.chatId);
                    if (this.shouldMessageBeMarkedAsRead(target))
                        this.markMessageAsRead(chat);
                }
            }
            // 👇 Threshold is 100%
        }, { threshold: 1 });

        this.loadMoreObserver = new IntersectionObserver(entries => {
            entries.forEach(({ isIntersecting, target }) => {
                if (target.id !== 'load-more-sentinel')
                    return;

                if (isIntersecting) {
                    this.getOlderChats();
                }
            });
        }, { threshold: 0.1 });
    }

    observeMessage(element) {
        if (this.observer) this.observer.observe(element);
    }

    observeSentry(element) {
        if (this.loadMoreObserver) this.loadMoreObserver.observe(element);
    }

    createLoadMoreSentinel() {
        this.sentinel = document.createElement('div');
        this.sentinel.id = 'load-more-sentinel';
        this.sentinel.style.height = '20px'; // Small visible area
        this.sentinel.style.width = '100%';
        this.sentinel.textContent = 'SENTINEL';

        this.container.insertBefore(this.sentinel, this.container.firstChild);
        this.observeSentry(this.sentinel);
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
        await this.#AddChatRead(chat.Id, chat.Name);
    }

    async getOlderChats() {
        if (this.areOlderChats === false)
            return;

        const getOldestChatId = this.getOldestChatId();
        const oldChats = await this.#GetChatsBeforeId(getOldestChatId);
        if (oldChats?.error) {
            toastService.addToast(`Error: ${oldChats.error}.`, GlobalConfig.LOG_LEVEL.ERROR)
            return;
        }
        if (oldChats.length === 0) {
            this.areOlderChats = false;
            return;
        }

        if (this._cancelled) return;

        // Save scroll position
        const scrollHeight = this.container.scrollHeight;

        this.chats = [...this.chats, ...oldChats];
        this.chats = this.deduplicateChats(this.chats);
        this.renderChats();

        // Restore scroll position (prevent jump)
        const newScrollHeight = this.container.scrollHeight;
        this.container.scrollTop += (newScrollHeight - scrollHeight);
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
            'callback': async () => {
                await this.sendChat();
                this.scrollToBottom();
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

        this.chats = [...this.chats, chatRecord];
        this.renderChats();

        // clear chat input
        document.querySelector(`.${this.domClasses.chatInput}`).textContent = '';
    }

    deduplicateChats(chatMessages) {
        const seen = new Set();
        return chatMessages.filter(msg => {
            if (seen.has(msg.Id))
                return false; // Duplicate     
            seen.add(msg.id);
            return true;
        });
    }

    async getChatReadStatus(chats) {
        const outgoingChatIds = chats
            .filter(chat => chat.Name === LoginHelper.username)
            .map(chat => chat.Id);

        const readChats = await this.#GetChatsThatAreRead(outgoingChatIds, LoginHelper.username);
        const readChatsIds = readChats.map(c => c.ChatId);
        const readIdsSet = new Set(readChatsIds);

        for (const chat of chats) {
            if (chat.Name === LoginHelper.username)
                chat.Read = readIdsSet.has(chat.Id);
        }
    }

    async getChatsSubscription() {
        EventHandler.overwriteIntervals('getNewChats', async () => {
            const id = this.getNewestChatId();
            const newChats = await this.#GetChatsAfterId(id);
            if (newChats?.error) {
                toastService.addToast(`Error: ${newChats.error}.`, GlobalConfig.LOG_LEVEL.ERROR)
                return;
            }
            if (newChats.length === 0)
                return;

            if (this._cancelled) return;

            await this.getChatReadStatus(newChats);

            if (this._cancelled) return;

            this.chats = [...this.chats, ...newChats];
            this.chats = this.deduplicateChats(this.chats);
            this.renderChats();

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

    getNewestChatId() {
        if (this.chats.length > 0)
            return Math.max(...this.chats.map(x => x.Id));
        else
            return null;
    }

    getOldestChatId() {
        if (this.chats.length > 0)
            return Math.min(...this.chats.map(x => x.Id));
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
        this.updateDateHeaders();

        this.orderChatsAsc();
        this.orderDateHeadersAsc();

        this.syncToDOM();
    }

    syncToDOM() {
        for (const dateHeader of this.dateHeaders) {
            // Check if this date header is rendered
            if (!dateHeader.Dom || !this.container.contains(dateHeader.Dom))
                this.renderDateHeader(dateHeader);

            // Render messages for this date
            const messagesForDate = this.chats.filter(
                msg => msg.Datetime.toLocaleDateString() === dateHeader.LocalDate
            );
            for (const msg of messagesForDate) {
                if (!msg.Dom || !this.container.contains(msg.Dom))
                    this.renderChatMessage(msg, dateHeader);
            }
        }
    }

    /**
     * Render a date header in the correct position.
     * Assumption - this.dateHeaders are ordered by datetime ascending.
     * @param {*} dateHeader  - an unrendered in the DOM custom object
     * {LocalDate - yyyy/mm/dd, Dom - reference to render date, Date - Date object}
     */
    renderDateHeader(dateHeader) {
        if (dateHeader.Dom) return; // Already in DOM

        const headerElement = document.createElement('div');
        headerElement.className = this.domClasses.chatHeader;
        headerElement.textContent = dateHeader.LocalDate;

        const renderedDateHeaders = this.dateHeaders.filter(h => h.Dom !== null);
        const insertBefore = renderedDateHeaders.find(h => h.Datetime > dateHeader.Datetime)?.Dom;

        if (insertBefore)
            this.container.insertBefore(headerElement, insertBefore);
        else
            this.container.appendChild(headerElement);

        dateHeader.Dom = headerElement;
    }

    // Render a chat message after its date header
    renderChatMessage(message, dateHeader) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message`;
        messageElement.dataset.chatId = message.Id;
        const isOutgoingUser = this.isOutgoingUser(message.Name);
        messageElement.classList.add(isOutgoingUser ? 'outgoing' : 'incoming');

        const messageHtml = `<div class="${this.domClasses.messageHeader}">
                                <span class="${this.domClasses.username}">${isOutgoingUser ? '' : message.Name}</span>
                                <span class="${this.domClasses.datetime}">${message.Datetime.toLocaleTimeString()}</span>
                                <span class="${this.domClasses.status}">${isOutgoingUser ? message.Read ? '✓' : '✗' : ''}</span>
                            </div>
                            <div class="${this.domClasses.messageContent}">
                                ${message.Message}
                        </div>`;
        messageElement.innerHTML = messageHtml;

        const renderedDateHeaders = this.dateHeaders.filter(h => h.Dom !== null);
        const insertBefore = renderedDateHeaders.find(h => h.Datetime > dateHeader.Datetime)?.Dom;

        if (insertBefore)
            this.container.insertBefore(messageElement, insertBefore);
        else
            this.container.appendChild(messageElement);

        message.Dom = messageElement;
        this.observeMessage(messageElement);
    }

    updateDateHeaders() {
        for (const chat of this.chats) {
            const index = this.dateHeaders.findIndex(obj => obj.LocalDate === chat.LocalDate);

            if (index === -1)
                this.dateHeaders.push({ LocalDate: chat.LocalDate, Dom: null, Datetime: chat.Datetime });
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isOutgoingUser(name) {
        return LoginHelper.username === name;
    }

    orderChatsAsc() {
        this.chats.sort((a, b) => a.Datetime - b.Datetime);
    }

    orderDateHeadersAsc() {
        this.dateHeaders.sort((a, b) => a.Datetime - b.Datetime);
    }

    parseDatetimeInChats(chats) {
        for (const chat of chats) {
            chat.Datetime = new Date(chat.Datetime);
            chat.LocalDate = chat.Datetime.toLocaleDateString();
        }
    }

    async #GetLast100Chats() {
        const url = `${GlobalConfig.apis.chat}/GetChats?guid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        this.parseDatetimeInChats(records);
        return records;
    }

    async #GetChatsBeforeId(id) {
        const url = `${GlobalConfig.apis.chat}/GetChatsBeforeId?id=${id}&chatGroupGuid=${this.guid}`;
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

    async #GetChatsThatAreRead(chatsIds, username) {
        const url = `${GlobalConfig.apis.chatsRead}/GetChatsThatAreRead?username=${username}`;
        const records = await RequestHelper.PostJsonWithAuth(url, chatsIds, { signal: this.signal });
        return records;
    }

    async #AddChatRead(chatId, username) {
        const url = `${GlobalConfig.apis.chatsRead}/AddChatRead?username=${username}&chatId=${chatId}`;
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
