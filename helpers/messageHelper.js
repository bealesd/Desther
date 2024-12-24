export default new class MessageHelper {
    KEY = 'messages'

    addMessage(message) {
        // Get messages from session
        const messages = this.getMessages();

        messages.push(message);

        // Save messages to session
        sessionStorage.setItem(this.KEY, JSON.stringify(messages));
    }

    getMessages() {
        // Get messages from session
        let messages = JSON.parse(sessionStorage.getItem(this.KEY));
        messages = Array.isArray(messages) ? messages : [];
        return messages;
    }

    setMessages(messages) {
        if (!Array.isArray(messages))
            messages = [];

        sessionStorage.setItem(this.KEY, JSON.stringify(messages));
    }

    clearMessages() {
        sessionStorage.removeItem(this.KEY);
    }

    // TODO move this to a toast
    printMessages() {
        for (const message of this.getMessages()) {
            console.log(message);
        }
        this.clearMessages();
    }
}
