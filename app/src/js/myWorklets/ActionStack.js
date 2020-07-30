export default class ActionStack {
    constructor() {
        this._stack = [];
    }

    stack() {
        return this._stack
    }

    push(action) {
        this._stack.push(action);
    }

    pop() {
        return this._stack.pop();
    }

    dump() {
        this._stack = [];
    }
}