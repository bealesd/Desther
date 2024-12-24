export default new class EventHandler {
    constructor() {
        //TODO - move to another store?
        window.events = window.events || {};
    }

    overwriteEvents(id, eventType, element, callback, callbackArgs) {
        this.removeEvents(id, eventType, element);
        this.addEvent(eventType, element, callback, callbackArgs);
    }

    addEvent({id, eventType, element, callback, callbackArgs}) {
        const eventInfo = { 'id': id, 'eventType': eventType, 'element': element, 'callback': callback, 'callbackArgs': callbackArgs }

        window.events[id] = window.events[id] === undefined ?
            [eventInfo] :
            [...window.events[id], eventInfo];

        element.addEventListener(eventType, callback, callbackArgs);
    }

    removeEvents(id, eventType, element) {
        if (window.events[id] !== undefined && window.events[id][eventType] !== undefined) {
            for (let i = 0; i < window.events[id][eventType].length; i++) {
                element.removeEventListener(eventType, window.events[id][i]['cb']);
                window.events[id][eventType].pop(window.events[id][i]);
            }
        }
    }
}
