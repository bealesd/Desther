
import GlobalConfig from "../../config.js";
import LoginHelper from "../../helpers/loginHelper.js";
import RequestHelper from "../../helpers/requestHelper.js";
import EventHandler from "../../helpers/eventHandler.js";
import Logger from "../../helpers/logger.js";
import LoadingScreen from "../../helpers/loadingScreen.js";
import toastService from "../../helpers/toastService.js";
import DeleteModal from "../../helpers/delete-modal/delete-modal.js";
import Router from "../../helpers/router.js";
import state from "../../helpers/state.js";

class Chat {
    _cancelled = false;
    _activeController = null;
    signal = null;

    domClasses = Object.freeze({
        chatContainer: 'chat-container',
        chatTitle: 'chat-title',

        chatMenuBtn: 'chat-menu-btn',
        chatMenuDropdown: 'chat-menu-dropdown',
        chatMenuItem: 'chat-menu-item',

        chatHeader: 'chat-header',
        chatMessage: 'chat-message',
        incoming: 'incoming',
        outgoing: 'outgoing',
        intersecting: 'intersecting',
        messageHeader: 'message-header',
        username: 'username',
        datetime: 'datetime',
        status: 'status',
        messageContent: 'message-content',

        chatInput: 'chat-input',
        scrollToBottomBtn: 'chat-extra-btn',
        chatSendBtn: 'chat-send-btn',
    });

    domIds = Object.freeze({
        loadMoreSentinel: 'load-more-sentinel',
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

        this.users = state.get(`Chat:${this.guid}:Users`);
        this.name = state.get(`Chat:${this.guid}:Name`);

        this.container = document.querySelector(`.${this.domClasses.chatContainer}`);

        this.readIdsForMessageToMe = new Set();

        this.setChatName();

        this.createObserver();
        this.createLoadMoreSentinel();

        LoadingScreen.showFullScreenLoader();

        const chats = await this.#GetLast100Chats();
        if (chats === null)
            chat = [];

        if (chats?.error) {
            toastService.addToast(`Failed to get chats. Error: ${chats.message}.`, GlobalConfig.LOG_LEVEL.ERROR)
            chats = [];
        }
        this.parseDatetimeInChats(chats);

        this.chats = chats;
        await this.getChatReadStatusForMyMessages(this.chats);
        await this.getChatReadStatusForMessageToMe(this.chats);

        LoadingScreen.hideFullScreenLoader();

        if (this._cancelled) return;

        this.renderChats();
        this.scrollToBottom();

        this.registerCallbacks();
        await this.getChatsSubscription();
    }

    setChatName() {
        const chatTitleDom = document.querySelector(`.${this.domClasses.chatTitle}`)
        chatTitleDom.innerText = this.name;
        chatTitleDom.title = `Users: ${this.users.map(u => u.Username).join(', ')}`;
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
                if (!target.classList.contains(this.domClasses.chatMessage))
                    return;

                if (target.classList.contains(this.domClasses.incoming))
                    target.classList.toggle(this.domClasses.intersecting, isIntersecting);

                if (isIntersecting) {
                    const chatId = target.dataset.chatId;
                    // don't say it has been read again
                    if (this.readIdsForMessageToMe.has(Number(chatId)))
                        return;
                    const chat = this.getChatById(chatId);
                    if (this.shouldMessageBeMarkedAsRead(target))
                        this.markMessageSentToMeAsRead(chat);
                }
            }
            // 👇 Threshold is 100%
        }, { threshold: 1 });

        this.loadMoreObserver = new IntersectionObserver(entries => {
            entries.forEach(({ isIntersecting, target }) => {
                if (target.id !== this.domIds.loadMoreSentinel)
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
        this.sentinel.id = this.domIds.loadMoreSentinel;
        this.sentinel.style.height = '20px'; // Small visible area
        this.sentinel.style.width = '100%';
        this.sentinel.textContent = 'SENTINEL';

        this.container.insertBefore(this.sentinel, this.container.firstChild);
        this.observeSentry(this.sentinel);
    }

    shouldMessageBeMarkedAsRead(chatMessageElement) {
        // check message is incoming
        if (!chatMessageElement.classList.contains(this.domClasses.incoming))
            return false;

        // additional check to confirm message is incoming
        const chat = this.chats.find(chat => chat.Id == parseInt(chatMessageElement.dataset.chatId) && !this.isOutgoingUser(chat.Name));
        return !chat?.Read;
    }

    async markMessageAsRead(chat) {
        await this.#AddChatRead(chat.Id, chat.UsernameId);
    }

    async markMessageSentToMeAsRead(chat) {
        await this.#AddChatRead(chat.Id, LoginHelper.usernameId);

        chat.Read = true;
    }

    async getOlderChats() {
        if (this.chats === null || this.chats.length === 0) {
            this.areOlderChats = false;
            return;
        }

        if (this.areOlderChats === false)
            return;

        const getOldestChatId = this.getOldestChatId();
        const oldChats = await this.#GetChatsBeforeId(getOldestChatId);
        if (oldChats?.error) {
            toastService.addToast(`Failed to get chats. Error: ${oldChats.message}.`, GlobalConfig.LOG_LEVEL.ERROR)
            return;
        }
        if (oldChats.length === 0) {
            this.areOlderChats = false;
            return;
        }

        this.parseDatetimeInChats(oldChats);

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
        const menuBtn = document.querySelector(`.${this.domClasses.chatMenuBtn}`);
        const menu = document.querySelector(`.${this.domClasses.chatMenuDropdown}`);

        menuBtn.addEventListener("click", e => {
            e.stopPropagation();
            menu.style.display = menu.style.display === "flex" ? "none" : "flex";
        });

        document.addEventListener("click", () => {
            menu.style.display = "none";
        });

        document.querySelector(`.${this.domClasses.chatMenuDropdown}`).addEventListener("click", e => {
            e.stopPropagation();
            const item = e.target.closest(`.${this.domClasses.chatMenuItem}`);
            if (item.classList.contains('danger'))
                this.deleteGroup();
        });

        const chatScrollToBottomButton = document.querySelector(`.${this.domClasses.scrollToBottomBtn}`);
        EventHandler.overwriteEvent({
            'id': 'chatScrollToBottomEvent',
            'eventType': 'click',
            'element': chatScrollToBottomButton,
            'callback': () => {
                this.scrollToBottom();
            }
        });

        const chatSendButton = document.querySelector(`.${this.domClasses.chatSendBtn}`);
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

    async deleteGroup() {
        DeleteModal.open('Are you sure you want to delete this group?', async () => {
            const response = await this.#DeleteChatGroup();
            if (response?.error)
                return toastService.addToast('Failed to delete chat group.', GlobalConfig.LOG_LEVEL.ERROR);
            else
                toastService.addToast('Chat group deleted.', GlobalConfig.LOG_LEVEL.INFO);

            Router.navigate('chatGroup');
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
            toastService.addToast(`Failed to send chat. Error: ${chatRecord.message}.`, GlobalConfig.LOG_LEVEL.ERROR);
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

    // On reading a message sent to me, check if it has been marked as read by me.
    // This avoids sending read receipts when a message has already been read.
    async getChatReadStatusForMessageToMe(chats) {
        // chats is all chats, i.e. on getting older or newer the total chats always goes up
        if (chats === null || chats.length === 0)
            return;
        const messageToMeChatIds = chats
            .filter(chat => chat.UsernameId !== LoginHelper.usernameId)
            .map(chat => chat.Id);

        const readChats = await this.#GetChatsThatAreRead(messageToMeChatIds, LoginHelper.usernameId);

        if (readChats?.error) {
            toastService.addToast('Failed to get read chats.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to get read chats. Error: ${readChats.message}`, GlobalConfig.LOG_LEVEL.ERROR);
            return;
        }

        const readChatsIds = readChats.map(c => c.ChatId);
        const readIdsSet = new Set(readChatsIds);

        this.readIdsForMessageToMe = readIdsSet
    }

    // Check if my messages have been read by all users.
    async getChatReadStatusForMyMessages(chats) {
        if (chats === null || chats.length === 0)
            return;
        const outgoingChatIds = chats
            .filter(chat => chat.UsernameId === LoginHelper.usernameId)
            .map(chat => chat.Id);

        const userIds = this.users.filter(x => x.UserId !== LoginHelper.usernameId).map(x => x.UserId);

        const readChats = await this.#GetChatsThatAreReadByAllUserIds(outgoingChatIds, userIds);
        if (readChats?.error) {
            toastService.addToast('Failed to get read chats.', GlobalConfig.LOG_LEVEL.ERROR);
            Logger.log(`Failed to get read chats. Error: ${readChats.message}`, GlobalConfig.LOG_LEVEL.ERROR);
            return;
        }
        const readIdsSet = new Set(readChats);

        for (const chat of chats) {
            if (chat.UsernameId === LoginHelper.usernameId)
                chat.Read = readIdsSet.has(chat.Id);
        }
    }

    async getChatsSubscription() {
        EventHandler.overwriteIntervals('getNewChats', async () => {
            const id = this.getNewestChatId();
            if (id === null)
                return;

            const newChats = await this.#GetChatsAfterId(id);
            if (newChats?.error) {
                toastService.addToast(`Error: ${newChats.message}.`, GlobalConfig.LOG_LEVEL.ERROR)
                return;
            }
            if (newChats.length === 0)
                return;

            this.parseDatetimeInChats(newChats);

            if (this._cancelled) return;

            await this.getChatReadStatusForMyMessages(newChats);
            await this.getChatReadStatusForMessageToMe(newChats);

            if (this._cancelled) return;

            this.chats = [...this.chats, ...newChats];
            this.chats = this.deduplicateChats(this.chats);
            this.renderChats();

        }, this.updateIntervalInSeconds * 1000)

        EventHandler.overwriteIntervals('getChatReadStatus', async () => {
            const unreadChats = this.chats
                .filter(chat => chat.UsernameId === LoginHelper.usernameId)
                .filter(chat => !chat.Read);
            await this.getChatReadStatusForMyMessages(unreadChats);
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
        messageElement.className = this.domClasses.chatMessage;
        messageElement.dataset.chatId = message.Id;
        const isOutgoingUser = this.isOutgoingUser(message.UsernameId);
        messageElement.classList.add(isOutgoingUser ? this.domClasses.outgoing : this.domClasses.incoming);

        const messageHtml = `<div class="${this.domClasses.messageHeader}">
                                <span class="${this.domClasses.username}">${isOutgoingUser ? '' : message.Username}</span>
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

    isOutgoingUser(usernameId) {
        return usernameId === LoginHelper.usernameId;
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
        const url = `${GlobalConfig.apis.chat}/GetChats?chatGroupGuid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }

    async #GetChatsBeforeId(id) {
        const url = `${GlobalConfig.apis.chat}/GetChatsBeforeId?id=${id}&chatGroupGuid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }

    async #GetChatsAfterId(id) {
        const url = `${GlobalConfig.apis.chat}/GetChatsAfterId?id=${id}&chatGroupGuid=${this.guid}`;
        const records = await RequestHelper.GetJsonWithAuth(url, this.signal);
        return records;
    }

    async #GetChatsThatAreRead(chatsIds, usernameId) {
        const url = `${GlobalConfig.apis.chatsRead}/GetChatsThatAreRead?usernameId=${usernameId}`;
        const records = await RequestHelper.PostJsonWithAuth(url, chatsIds, { signal: this.signal });
        return records;
    }

    async #GetChatsThatAreReadByAllUserIds(chatsIds, usernameIds) {
        const url = `${GlobalConfig.apis.chatsRead}/GetChatsThatAreReadByAllUserIds`;
        const records = await RequestHelper.PostJsonWithAuth(url, { chatIds: chatsIds, userIds: usernameIds }, { signal: this.signal });
        return records;
    }

    async #AddChatRead(chatId, usernameId) {
        const url = `${GlobalConfig.apis.chatsRead}/AddChatRead?usernameId=${usernameId}&chatId=${chatId}`;
        const result = await RequestHelper.PostJsonWithAuth(url, { signal: this.signal });
        return result;
    }

    async #DeleteChatGroup() {
        const url = `${GlobalConfig.apis.chatGroup}/DeleteChatGroup?guid=${this.guid}`;
        const result = await RequestHelper.DeleteWithAuth(url, { signal: this.signal });
        return result;
    }

    async #SendChat(message) {
        const payload = {
            usernameId: LoginHelper.usernameId,
            message: message,
            chatGroupGuid: this.guid
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
