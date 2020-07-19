export default class WSOLA {
    constructor(stretch = 1) {
        this._windowSize = 256;
        this._bufferLength = 2048;
        this._numWindows = Math.floor(this._bufferLength / this._windowSize);
        this._windowOffset = Math.floor(this._windowSize / 2);
        this._window = new Float32Array(this._windowSize);
        this._stretch = stretch;
        for (let i = 0; i < this._window.length; i++) {
            this._window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / this._windowSize));
        }
        this._outputPositions = [];
        this._inputPositions = [];
        for (let i = 0, pos = 0; i < this._numWindows; i++, pos += this._windowOffset) {
            this._outputPositions.push(pos);
            this._inputPositions.push(Math.floor(pos / stretch));
        }
    }

    updateStretch(stretch) {
        this._stretch = stretch;
        for (let i = 0; i < this._numWindows; i++) {
            this._inputPositions[i] = Math.floor(this._outputPositions[i] / this._stretch);
        }
    }

    process(input) {
        const output = new Float32Array(Math.floor(this._stretch * this._bufferLength));

        for (let i = 0; i < this._numWindows; i++) {
            const index = this._inputPositions[i];
            const outdex = this._outputPositions[i];
            for (let j = 0; j < this._windowSize; j++) {
                output[outdex + j] += input[index + j] * this._window[j];
            }
        }

        return output;
    }
}