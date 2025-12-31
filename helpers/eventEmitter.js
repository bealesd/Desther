class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(eventName, listener) {
    (this.events[eventName] ||= []).push(listener);
  }

  off(eventName, listener) {
    if (!this.events[eventName]) return;
    this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    console.log(`Subscribed event count for ${eventName}: ${this.events[eventName].length}`);
  }

  emit(eventName, data) {
    (this.events[eventName] || []).forEach(listener => listener(data));
  }
}

export default new EventEmitter();