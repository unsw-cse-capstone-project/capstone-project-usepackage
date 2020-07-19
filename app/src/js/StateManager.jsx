export default class StateManager {
    constructor() {
        this.state = {};
    }

    setState(obj) {
        for (let key in obj)
            this.state[key] = obj[key];
    }
} 