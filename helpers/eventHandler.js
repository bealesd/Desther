import GlobalConfig from "../config.js";
import Logger from './Logger.js';

export default new class EventHandler {
    LIFETIME = {
        SHORT_LIVED: 'SHORT_LIVED',
        LONG_LIVED: 'LONG_LIVED'
    }

    constructor() {     
        this.initializeEventsStore();
        this.initializeIntervalsStore();        
    }

    initializeEventsStore(){
        //TODO - move to another store that is protected?
        window.events = window.events || {};
        if (!window.events.hasOwnProperty(this.LIFETIME.SHORT_LIVED))
            window.events[this.LIFETIME.SHORT_LIVED] = {};
        
        if (!window.events.hasOwnProperty(this.LIFETIME.LONG_LIVED))
            window.events[this.LIFETIME.LONG_LIVED] = {};  
    }

    initializeIntervalsStore(){
        window.intervals = window.intervals || {};
        if (!window.intervals.hasOwnProperty(this.LIFETIME.SHORT_LIVED))
            window.intervals[this.LIFETIME.SHORT_LIVED] = {};
        
        if (!window.intervals.hasOwnProperty(this.LIFETIME.LONG_LIVED))
            window.intervals[this.LIFETIME.LONG_LIVED] = {};  
    }

    overwriteEvent({ id, eventType, element, callback, callbackArgs, lifetime = this.LIFETIME.SHORT_LIVED }) {
        if (window.events[lifetime][id])
            this.removeEvent(id, lifetime);
        this.addEvent({ id, eventType, element, callback, callbackArgs, lifetime });
    }

    addEvent({ id, eventType, element, callback, callbackArgs, lifetime = this.LIFETIME.SHORT_LIVED}) {
        // TODO there should be event categories, like login or chat etc, to avoid naming conflicts.
        // Not an issue yet.
        const eventInfo = { 'eventType': eventType, 'element': element, 'callback': callback, 'callbackArgs': callbackArgs }

        if (window.events[lifetime][id] !== undefined)
            return Logger.log(`Event already added with id: ${id} to window.events.${lifetime}.`, GlobalConfig.LOG_LEVEL.WARNING)

        window.events[lifetime][id] = eventInfo;
        element.addEventListener(eventType, callback, callbackArgs);
        Logger.log(`Added id: ${id} to window.events.${lifetime}.`)
    }

    removeEvent(id, lifetime = this.LIFETIME.SHORT_LIVED) {
        const event = window.events[lifetime][id];
        if (event === undefined) {
            Logger.log(`Could not remove id: ${id} from window.events.${lifetime}.`, GlobalConfig.LOG_LEVEL.WARNING)
            return;
        }

        event['element'].removeEventListener(event['eventType'], event['cb']);
        delete window.events[lifetime][id];
        Logger.log(`Removed id: ${id} from window.events.${lifetime}.`)
    }

    removeEvents(lifetime = this.LIFETIME.SHORT_LIVED) {
        for (const eventId of Object.keys(window.events[lifetime])) {
            this.removeEvent(eventId);
        }
    }

    overwriteIntervals(id, callback, ms, lifetime = this.LIFETIME.SHORT_LIVED) {
        this.removeInterval(id, lifetime)
        this.addInterval(id, callback, ms, lifetime);
    }

    addInterval(id, callback, ms, lifetime = this.LIFETIME.SHORT_LIVED) {
        if (window.intervals[lifetime].hasOwnProperty(id))
            return;

        const intervalId = setInterval(callback, ms);
        window.intervals[lifetime][id] = { 'intervalId': intervalId };
        Logger.log(`Added id: ${id} to window.intervals.${lifetime}.`)
    }

    removeInterval(id, lifetime = this.LIFETIME.SHORT_LIVED) {
        if (!window.intervals[lifetime].hasOwnProperty(id)) {
            Logger.log(`Could not remove id: ${id} from window.intervals.${lifetime}.`, GlobalConfig.LOG_LEVEL.INFO)
            return;
        }

        const intervalId = window.intervals[lifetime][id].intervalId;
        clearInterval(intervalId);
        delete window.intervals[lifetime][id];
        Logger.log(`Removed id: ${id} from window.intervals.${lifetime}.`)
    }

    removeIntervals(lifetime = this.LIFETIME.SHORT_LIVED) {
        for (const intervalId of Object.keys(window.intervals[lifetime])) {
            this.removeInterval(intervalId);
        }
    }
}
