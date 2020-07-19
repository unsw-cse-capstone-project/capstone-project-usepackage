export default class PromiseQueue {
    constructor() {
        this.queue = [];
        this.add = this.add.bind(this);
        this.resolve = this.resolve.bind(this);
    }

    add(item) {
        this.queue.push(item);
    }

    resolve(initial) {
        return this.queue.reduce((prev, curr) => {
            return prev.then(curr);
        }, Promise.resolve(initial))
    }
} 