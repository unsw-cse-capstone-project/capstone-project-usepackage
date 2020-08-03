export default class ActionStack {
    constructor(stack = []) {
        console.log("ACTIONSTACK: ", stack) // DEBUG
        this._stack = stack;
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