export default new class State {
    constructor() {
        this._state = {};
        this._listeners = new Set();
    }

    get(key) {
        return this._state[key];
    }

    set(key, value) {
        this._state[key] = value;
        this._notify();
    }

    remove(key) {
        delete this._state[key];
        this._notify();
    }

    subscribe(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    _notify() {
        for (const fn of this._listeners) {
            fn(this._state);
        }
    }
}
