export default class ActionStack {
    constructor() {
        this._stack = [];
    }

    push(action) {
        this._stack.push(action);
    }

    applyPop(cuts) {

    }
}