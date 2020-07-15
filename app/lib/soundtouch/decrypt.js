// This variable initialises the buffer I think
var m = function() {
    function t() { e(this, t), this._vector = new Float32Array, this._position = 0, this._frameCount = 0 }
    return i(t, [
    { 
        key: "clear", value: function() {
            this.receive(this._frameCount), this.rewind() 
        } 
    }, { 
    key: "put", value: function(t) { this._frameCount += t } }, {
        key: "putSamples",
        value: function(t, e) {
            var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0,
                i = 2 * (e = e || 0);
            r >= 0 || (r = (t.length - i) / 2);
            var n = 2 * r;
            this.ensureCapacity(r + this._frameCount);
            var o = this.endIndex;
            this.vector.set(t.subarray(i, i + n), o), this._frameCount += r
        }
    }, {
        key: "putBuffer",
        value: function(t, e) {
            var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
            e = e || 0, r >= 0 || (r = t.frameCount - e), this.putSamples(t.vector, t.position + e, r)
        }
    }, { key: "receive", value: function(t) { t >= 0 && !(t > this._frameCount) || (t = this.frameCount), this._frameCount -= t, this._position += t } }, {
        key: "receiveSamples",
        value: function(t) {
            var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                r = 2 * e,
                i = this.startIndex;
            t.set(this._vector.subarray(i, i + r)), this.receive(e)
        }
    }, {
        key: "extract",
        value: function(t) {
            var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0,
                i = this.startIndex + 2 * e,
                n = 2 * r;
            t.set(this._vector.subarray(i, i + n))
        }
    }, {
        key: "ensureCapacity",
        value: function() {
            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                e = parseInt(2 * t);
            if (this._vector.length < e) {
                var r = new Float32Array(e);
                r.set(this._vector.subarray(this.startIndex, this.endIndex)), this._vector = r, this._position = 0
            } else this.rewind()
        }
    }, {
        key: "ensureAdditionalCapacity",
        value: function() {
            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
            this.ensureCapacity(this._frameCount + t)
        }
    }, { key: "rewind", value: function() 
        { 
            this._position > 0 && (this._vector.set(this._vector.subarray(this.startIndex, this.endIndex)), 
            this._position = 0) 
        } 
    }, { 
        key: "vector", 
        get: function() { 
            return this._vector 
        } 
    }, { 
        key: "position", 
        get: function() { 
            return this._position 
        } 
    }, { 
        key: "startIndex", 
        get: function() { 
            return 2 * this._position 
        } 
    }, { 
        key: "frameCount", 
        get: function() { 
            return this._frameCount 
        } 
    }, { 
        key: "endIndex", 
        get: function() { 
            return 2 * (this._position + this._frameCount) } 
        }]), t
}

//What does this do?

g = function() {
    function t(r) { 
        e(this, t), r ? (this._inputBuffer = new m, this._outputBuffer = new m) : this._inputBuffer = this._outputBuffer = null 
    }
    return i(t, [
        { 
            key: "clear", 
            value: function() { 
                this._inputBuffer.clear(), 
                this._outputBuffer.clear() 
            } 
        }, { 
            key: "inputBuffer", 
            get: function() { 
                return this._inputBuffer 
            }, 
            set: function(t) { 
                this._inputBuffer = t 
            } 
        }, { 
            key: "outputBuffer", 
            get: function() { 
                return this._outputBuffer 
            }, 
            set: function(t) { 
                this._outputBuffer = t 
            } 
        }]), t
}(),

// What does this do?

_ = function(t) {
    n(o, g);
    var r = l(o);

    function o(t) { 
        var i; 
        return e(this, o), 
        (i = r.call(this, t)).reset(), 
        i._rate = 1, i 
    }
    return i(o, 
        [{ 
            key: "reset", 
            value: function() { 
                this.slopeCount = 0, 
                this.prevSampleL = 0, 
                this.prevSampleR = 0 
            } 
        }, { 
            key: "clone", 
            value: function() { 
                var t = new o; 
                return t.rate = this._rate, t 
            } 
        }, {
        key: "process",
        value: function() {
            var t = this._inputBuffer.frameCount;
            this._outputBuffer.ensureAdditionalCapacity(t / this._rate + 1);
            var e = this.transpose(t);
            this._inputBuffer.receive(), this._outputBuffer.put(e)
        }
    }, {
        key: "transpose",
        value: function() {
            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
            if (0 === t) return 0;
            for (var e = this._inputBuffer.vector, r = this._inputBuffer.startIndex, i = this._outputBuffer.vector, n = this._outputBuffer.endIndex, o = 0, s = 0; this.slopeCount < 1;) i[n + 2 * s] = (1 - this.slopeCount) * this.prevSampleL + this.slopeCount * e[r], i[n + 2 * s + 1] = (1 - this.slopeCount) * this.prevSampleR + this.slopeCount * e[r + 1], s += 1, this.slopeCount += this._rate;
            if (this.slopeCount -= 1, 1 !== t) t: for (;;) {
                for (; this.slopeCount > 1;)
                    if (this.slopeCount -= 1, (o += 1) >= t - 1) break t;
                var u = r + 2 * o;
                i[n + 2 * s] = (1 - this.slopeCount) * e[u] + this.slopeCount * e[u + 2], i[n + 2 * s + 1] = (1 - this.slopeCount) * e[u + 1] + this.slopeCount * e[u + 3], s += 1, this.slopeCount += this._rate
            }
            return this.prevSampleL = e[r + 2 * t - 2], this.prevSampleR = e[r + 2 * t - 1], s
        }
    }, { 
        key: "rate", 
        set: function(t) { 
            this._rate = t 
        } 
    }]), o
}

//What does this do?

k = function() {
    function t(r) { 
        e(this, t), 
        this._pipe = r 
    }
    return i(t, [{ 
        key: "fillInputBuffer", 
        value: function() { 
            throw new Error("fillInputBuffer() not overridden") 
        } 
    }, {
        key: "fillOutputBuffer",
        value: function() {
            for (var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0; this.outputBuffer.frameCount < t;) {
                var e = 16384 - this.inputBuffer.frameCount;
                if (this.fillInputBuffer(e), this.inputBuffer.frameCount < 16384) break;
                this._pipe.process()
            }
        }
    }, { 
        key: "clear", 
        value: function() { 
            this._pipe.clear() 
        } 
    }, { 
        key: "pipe", 
        get: function() { 
            return this._pipe 
        } 
    }, { 
        key: "inputBuffer", 
        get: function() { 
            return this._pipe.inputBuffer 
        } 
    }, { 
        key: "outputBuffer", 
        get: function() { 
            return this._pipe.outputBuffer 
        } 
    }]), t
}(),

// What does this do?

w = function(t) {
    n(s, k);
    var r = l(s);

    function s(t, i) { 
        var n, o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : B; 
        return e(this, s), 
        (n = r.call(this, i)).callback = o, 
        n.sourceSound = t, 
        n.historyBufferSize = 22050, 
        n._sourcePosition = 0, 
        n.outputBufferPosition = 0, 
        n._position = 0, n 
    }
    return i(s, [{ 
        key: "onEnd", 
        value: function() { 
            this.callback() 
        } 
    }, {
        key: "fillInputBuffer",
        value: function() {
            var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
            e = new Float32Array(2 * t),
            r = this.sourceSound.extract(e, t, this._sourcePosition);
            this._sourcePosition += r, this.inputBuffer.putSamples(e, 0, r)
        }
    }, {
        key: "extract",
        value: function(t) {
            var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
            this.fillOutputBuffer(this.outputBufferPosition + e);
            var r = Math.min(e, this.outputBuffer.frameCount - this.outputBufferPosition);
            this.outputBuffer.extract(t, this.outputBufferPosition, r);
            var i = this.outputBufferPosition + r;
            return this.outputBufferPosition = Math.min(this.historyBufferSize, i), this.outputBuffer.receive(Math.max(i - this.historyBufferSize, 0)), this._position += r, r
        }
    }, { 
        key: "handleSampleData", 
        value: function(t) { 
            this.extract(t.data, 4096) 
        } 
    }, { 
        key: "clear", value: function() { 
            p(o(s.prototype), "clear", this).call(this), 
            this.outputBufferPosition = 0 
        } 
    }, {
        key: "position",
        get: function() { return this._position },
        set: function(t) {
            if (t > this._position) throw new RangeError("New position may not be greater than current position");
            var e = this.outputBufferPosition - (this._position - t);
            if (e < 0) throw new RangeError("New position falls outside of history buffer");
            this.outputBufferPosition = e, this._position = t
        }
    }, { key: "sourcePosition", get: function() { return this._sourcePosition }, set: function(t) { this.clear(), this._sourcePosition = t } }]), s
}(),
S = [
    [124, 186, 248, 310, 372, 434, 496, 558, 620, 682, 744, 806, 868, 930, 992, 1054, 1116, 1178, 1240, 1302, 1364, 1426, 1488, 0],
    [-100, -75, -50, -25, 25, 50, 75, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-20, -15, -10, -5, 5, 10, 15, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [-4, -3, -2, -1, 1, 2, 3, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
],

// What does this do?

P = function(t) {
        n(s, g);
        var r = l(s);

        function s(t) { 
            var i; 
            return e(this, s), 
            (i = r.call(this, t))._quickSeek = !0, 
            i.midBufferDirty = !1, 
            i.midBuffer = null, 
            i.overlapLength = 0, 
            i.autoSeqSetting = !0, 
            i.autoSeekSetting = !0, 
            i._tempo = 1, 
            i.setParameters(44100, 0, 0, 8), i 
        }
        return i(s, [{ 
            key: "clear", 
            value: function() { 
                p(o(s.prototype), "clear", this).call(this), 
                this.clearMidBuffer() 
            } 
        }, { 
            key: "clearMidBuffer", 
            value: function() { 
                this.midBufferDirty && (this.midBufferDirty = !1, this.midBuffer = null) 
            } 
        }, { 
            key: "setParameters", 
            value: function(t, e, r, i) { 
                t > 0 && (this.sampleRate = t), 
                i > 0 && (this.overlapMs = i), 
                e > 0 ? (this.sequenceMs = e, this.autoSeqSetting = !1) : this.autoSeqSetting = !0, r > 0 ? (this.seekWindowMs = r, this.autoSeekSetting = !1) : this.autoSeekSetting = !0, 
                this.calculateSequenceParameters(), 
                this.calculateOverlapLength(this.overlapMs), 
                this.tempo = this._tempo 
            } 
        }, {
            key: "calculateOverlapLength",
            value: function() {
                var t, e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
                t = (t = this.sampleRate * e / 1e3) < 16 ? 16 : t, 
                t -= t % 8, 
                this.overlapLength = t, 
                this.refMidBuffer = new Float32Array(2 * this.overlapLength), 
                this.midBuffer = new Float32Array(2 * this.overlapLength)
            }
        }, { 
            key: "checkLimits", 
            value: function(t, e, r) { 
                return t < e ? e : t > r ? r : t 
            } 
        }, {
            key: "calculateSequenceParameters",
            value: function() {
                var t, e;
                this.autoSeqSetting && (t = 150 + -50 * this._tempo, t = this.checkLimits(t, 50, 125), 
                this.sequenceMs = Math.floor(t + .5)), 
                this.autoSeekSetting && (e = 25 - -10 / 1.5 * .5 + -10 / 1.5 * this._tempo, 
                e = this.checkLimits(e, 15, 25), 
                this.seekWindowMs = Math.floor(e + .5)), 
                this.seekWindowLength = Math.floor(this.sampleRate * this.sequenceMs / 1e3), 
                this.seekLength = Math.floor(this.sampleRate * this.seekWindowMs / 1e3)
            }
        }, { 
            key: "clone", 
            value: function() { 
                var t = new s; 
                return t.tempo = this._tempo, 
                t.setParameters(this.sampleRate, this.sequenceMs, this.seekWindowMs, this.overlapMs), 
                t 
            } 
        }, { 
            key: "seekBestOverlapPosition", 
            value: function() { 
                return this._quickSeek ? this.seekBestOverlapPositionStereoQuick() : this.seekBestOverlapPositionStereo() 
            } 
        }, { 
            key: "seekBestOverlapPositionStereo", 
            value: function() { 
                var t, e, r, i = 0; 
                for (this.preCalculateCorrelationReferenceStereo(), t = 0, e = Number.MIN_VALUE; i < this.seekLength; i += 1)
                (r = this.calculateCrossCorrelationStereo(2 * i, this.refMidBuffer)) > e && (e = r, t = i); 
                return t 
            } 
        }, {
            key: "seekBestOverlapPositionStereoQuick",
            value: function() {
                var t, e, r, i, n, o = 0;
                for (this.preCalculateCorrelationReferenceStereo(), e = Number.MIN_VALUE, t = 0, i = 0, n = 0; o < 4; o += 1) {
                    for (var s = 0; S[o][s] && !((n = i + S[o][s]) >= this.seekLength);)
                    (r = this.calculateCrossCorrelationStereo(2 * n, this.refMidBuffer)) > e && (e = r, t = n), s += 1;
                    i = t
                }
                return t
            }
        }, { 
            key: "preCalculateCorrelationReferenceStereo", 
            value: function() { 
                for (var t, e, r = 0; r < this.overlapLength; r += 1) 
                e = r * (this.overlapLength - r), 
                t = 2 * r, 
                this.refMidBuffer[t] = this.midBuffer[t] * e, 
                this.refMidBuffer[t + 1] = this.midBuffer[t + 1] * e 
            } 
        }, {
            key: "calculateCrossCorrelationStereo",
            value: function(t, e) {
                var r = this._inputBuffer.vector;
                t += this._inputBuffer.startIndex;
                for (var i, n = 0, o = 2, s = 2 * this.overlapLength; o < s; o += 2) n += r[i = o + t] * e[o] + r[i + 1] * e[o + 1];
                return n
            }
        }, { key: "overlap", value: function(t) { this.overlapStereo(2 * t) } }, {
            key: "overlapStereo",
            value: function(t) {
                var e = this._inputBuffer.vector;
                t += this._inputBuffer.startIndex;
                for (var r, i, n, o, s, u = this._outputBuffer.vector, a = this._outputBuffer.endIndex, h = 0, f = 1 / this.overlapLength; 
                    h < this.overlapLength; h += 1) 
                    i = (this.overlapLength - h) * f, 
                    n = h * f, 
                    o = (r = 2 * h) + t, 
                    u[(s = r + a) + 0] = e[o + 0] * n + this.midBuffer[r + 0] * i, 
                    u[s + 1] = e[o + 1] * n + this.midBuffer[r + 1] * i
            }
        }, {
            key: "process",
            value: function() {
                var t, e, r;
                if (null === this.midBuffer) {
                    if (this._inputBuffer.frameCount < this.overlapLength) return;
                    this.midBuffer = new Float32Array(2 * this.overlapLength), this._inputBuffer.receiveSamples(this.midBuffer, this.overlapLength)
                }
                for (; this._inputBuffer.frameCount >= this.sampleReq;) {
                    t = this.seekBestOverlapPosition(), 
                    this._outputBuffer.ensureAdditionalCapacity(this.overlapLength), 
                    this.overlap(Math.floor(t)), 
                    this._outputBuffer.put(this.overlapLength), 
                    (e = this.seekWindowLength - 2 * this.overlapLength) > 0 && this._outputBuffer.putBuffer(this._inputBuffer, t + this.overlapLength, e);
                    var i = this._inputBuffer.startIndex + 2 * (t + this.seekWindowLength - this.overlapLength);
                    this.midBuffer.set(this._inputBuffer.vector.subarray(i, i + 2 * this.overlapLength)), 
                    this.skipFract += this.nominalSkip, 
                    r = Math.floor(this.skipFract), 
                    this.skipFract -= r, 
                    this._inputBuffer.receive(r)
                }
            }
        }, {
            key: "tempo",
            set: function(t) {
                var e;
                this._tempo = t, 
                this.calculateSequenceParameters(), 
                this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength), 
                this.skipFract = 0, 
                e = Math.floor(this.nominalSkip + .5), 
                this.sampleReq = Math.max(e + this.overlapLength, this.seekWindowLength) + this.seekLength
            },
            get: function() { 
                return this._tempo 
            }
        }, { 
            key: "inputChunkSize", 
            get: function() { 
                return this.sampleReq 
            } 
        }, { 
            key: "outputChunkSize", 
            get: function() { 
                return this.overlapLength + Math.max(0, this.seekWindowLength - 2 * this.overlapLength) 
            } 
        }, { 
            key: "quickSeek", 
            set: function(t) { 
                this._quickSeek = t 
            } 
        }]), s
    }(),

    b = function(t, e) { 
        return (t > e ? t - e : e - t) > 1e-10 
    },
    C = function() {
        function t() { 
            e(this, t), 
            this.transposer = new _(!1), 
            this.stretch = new P(!1), 
            this._inputBuffer = new m, 
            this._intermediateBuffer = new m, 
            this._outputBuffer = new m, 
            this._rate = 0, 
            this._tempo = 0, 
            this.virtualPitch = 1, 
            this.virtualRate = 1, 
            this.virtualTempo = 1, 
            this.calculateEffectiveRateAndTempo() 
        }
        return i(t, 
            [{ 
                key: "clear", 
                value: function() { 
                    this.transposer.clear(), 
                    this.stretch.clear() 
                } 
            }, { 
                key: "clone", 
                value: function() { 
                    var e = new t; 
                    return e.rate = this.rate, 
                    e.tempo = this.tempo, e 
                } 
            }, {
                key: "calculateEffectiveRateAndTempo",
                value: function() {
                var t = this._tempo,
                    e = this._rate;
                this._tempo = this.virtualTempo / this.virtualPitch, 
                this._rate = this.virtualRate * this.virtualPitch, 
                b(this._tempo, t) && (this.stretch.tempo = this._tempo), 
                b(this._rate, e) && (this.transposer.rate = this._rate), 
                this._rate > 1 ? this._outputBuffer != this.transposer.outputBuffer && 
                (this.stretch.inputBuffer = this._inputBuffer, 
                this.stretch.outputBuffer = this._intermediateBuffer, 
                this.transposer.inputBuffer = this._intermediateBuffer, 
                this.transposer.outputBuffer = this._outputBuffer) 
                : 
                this._outputBuffer != this.stretch.outputBuffer && 
                (this.transposer.inputBuffer = this._inputBuffer, 
                this.transposer.outputBuffer = this._intermediateBuffer, 
                this.stretch.inputBuffer = this._intermediateBuffer, 
                this.stretch.outputBuffer = this._outputBuffer)
            }
        }, { 
            key: "process", 
            value: function() { 
                this._rate > 1 ? 
                (this.stretch.process(), 
                this.transposer.process()) : 
                (this.transposer.process(), this.stretch.process()) 
            } 
        }, { 
            key: "rate", 
            get: function() { 
                return this._rate 
            }, 
            set: function(t) { 
                this.virtualRate = t, 
                this.calculateEffectiveRateAndTempo() 
            } 
        }, { 
            key: "rateChange", 
            set: function(t) { 
                this._rate = 1 + .01 * t 
            } 
        }, { 
            key: "tempo", 
            get: function() { 
                return this._tempo 
            }, 
            set: function(t) { 
                this.virtualTempo = t, 
                this.calculateEffectiveRateAndTempo() 
            } 
        }, { 
            key: "tempoChange", 
            set: function(t) { 
                this.tempo = 1 + .01 * t 
            } 
        }, { 
            key: "pitch", 
            set: function(t) { 
                this.virtualPitch = t, 
                this.calculateEffectiveRateAndTempo() 
            } 
        }, { 
            key: "pitchOctaves", 
            set: function(t) { 
                this.pitch = Math.exp(.69314718056 * t), 
                this.calculateEffectiveRateAndTempo() 
            } 
        }, { 
            key: "pitchSemitones", 
            set: function(t) { 
                this.pitchOctaves = t / 12 
            } 
        }, { 
            key: "inputBuffer", 
            get: function() { 
                return this._inputBuffer 
            } 
        }, { 
            key: "outputBuffer", 
            get: function() { 
                return this._outputBuffer 
            } 
        }]), t
    }(),
    L = function() {
        function t(r) { 
            e(this, t), 
            this.buffer = r, 
            this._position = 0 
        }
        return i(t, [{
            key: "extract",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                    r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
                this.position = r;
                for (var i = this.buffer.getChannelData(0), 
                n = this.dualChannel ? this.buffer.getChannelData(1) : this.buffer.getChannelData(0), o = 0; o < e; o++) 
                t[2 * o] = i[o + r], t[2 * o + 1] = n[o + r];
                return Math.min(e, i.length - r)
            }
        }, { 
            key: "dualChannel", 
            get: function() { 
                return this.buffer.numberOfChannels > 1 
            } 
        }, { 
            key: "position", 
            get: function() { 
                return this._position 
            }, 
            set: function(t) { 
                this._position = t 
            } 
        }]), t
    }(),
    E = function(t, e) {
        var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : B,
            i = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : 4096,
            n = t.createScriptProcessor(i, 2, 2),
            o = new Float32Array(2 * i);
        return n.onaudioprocess = function(t) {
            var n = t.outputBuffer.getChannelData(0),
                s = t.outputBuffer.getChannelData(1),
                u = e.extract(o, i);
            r(e.sourcePosition), 0 === u && e.onEnd();
            for (var a = 0; a < u; a++) n[a] = o[2 * a], s[a] = o[2 * a + 1]
        }, n
    },
    O = function(t) {
        var e, r, i, n = Math.floor(t / 60),
            o = t - 60 * n;
        return "".concat(n, ":").concat((e = parseInt(o), i = i || "0", 
        (e += "").length >= (r = 2) ? e : new Array(r - e.length + 1).join(i) + e))
    },
    R = function(t) {
        var e = this.timePlayed,
            r = this.sampleRate;
        if (this.sourcePosition = t, this.timePlayed = t / r, e !== this.timePlayed) {
            var i = new CustomEvent("play", 
                { detail: 
                    { 
                        timePlayed: this.timePlayed, 
                        formattedTimePlayed: this.formattedTimePlayed, 
                        percentagePlayed: this.percentagePlayed 
                    } 
                });
            this._node.dispatchEvent(i)
        }
    },
    x = (function() {
        function t(r, i, n) {
            var o = this,
            s = arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : B;
            e(this, t), this._soundtouch = new C;
            var u = new L(i);
            this.timePlayed = 0, 
            this.sourcePosition = 0, 
            this._filter = new w(u, this._soundtouch, s), 
            this._node = E(r, 
                this._filter, 
                (function(t) { 
                    return R.call(o, t) 
                }), n), 
                this.tempo = 1, 
                this.rate = 1, 
                this.duration = i.duration, 
                this.sampleRate = r.sampleRate, 
                this.listeners = []
            }
        i(t, [{ 
            key: "connect", 
            value: function(t) { 
                this._node.connect(t) 
            } 
        }, { 
            key: "disconnect", 
            value: function() { 
                this._node.disconnect() 
            } 
        }, { 
            key: "on", 
            value: function(t, e) { 
                this.listeners.push({ name: t, cb: e }), 
                this._node.addEventListener(t, (function(t) {
                     return e(t.detail) 
                })) 
            } 
        }, {
            key: "off",
            value: function() {
                var t = this,
                    e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : null,
                    r = this.listeners;
                e && (r = r.filter((function(t) { 
                    return t.name === e 
                }))), 
                r.forEach((function(e) { 
                    t._node.removeEventListener(e.name, (function(t) { 
                        return e.cb(t.detail) 
                    })) 
                }))
            }
        }, { 
            key: "formattedDuration", 
            get: function() { 
                return O(this.duration) 
            } 
        }, { 
            key: "formattedTimePlayed", 
            get: function() { 
                return O(this.timePlayed) 
            } 
        }, { 
            key: "percentagePlayed", 
            get: function() { 
                return 100 * this._filter.sourcePosition / (this.duration * this.sampleRate) 
            }, 
            set: function(t) { 
                this._filter.sourcePosition = parseInt(t * this.duration * this.sampleRate), 
                this.sourcePosition = this._filter.sourcePosition, 
                this.timePlayed = this.sourcePosition / this.sampleRate 
            } 
        }, { 
            key: "node", 
            get: function() { 
                return this._node 
            } 
        }, { 
            key: "pitch", 
            set: function(t) { 
                this._soundtouch.pitch = t 
            } 
        }, { 
            key: "pitchSemitones", 
            set: function(t) { 
                this._soundtouch.pitchSemitones = t 
            } 
        }, { 
            key: "rate", 
            set: function(t) { 
                this._soundtouch.rate = t 
            } 
        }, { 
            key: "tempo", 
            set: function(t) { 
                this._soundtouch.tempo = t 
            } 
        }])
    }(), function() {
        function t(r, i, n) { e(this, t), Object.assign(this, r), this.leftChannel = i, this.rightChannel = n, this._position = 0 }
        return i(t, [{
            key: "extract",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                    r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 0;
                this.position = r;
                for (var i = 0; i < e; i++) t[2 * i] = this.leftChannel[i + r], t[2 * i + 1] = this.rightChannel[i + r];
                return Math.min(e, this.leftChannel.length - r)
            }
        }, { 
            key: "position", 
            get: function() { 
                return this._position 
            }, 
            set: function(t) { 
                this._position = t 
            } 
        }]), t
    }()),
    M = function(r) {
        n(s, h(AudioWorkletProcessor));
        var o = l(s);

        function s(t) { 
            var r; 
            return e(this, s), 
            (r = o.call(this))._initialized = !1, 
            r.bufferSize = 128, 
            r.port.onmessage = r._messageProcessor.bind(f(r)), 
            r.port.postMessage({ message: "PROCESSOR_CONSTRUCTOR", detail: t }), 
            r 
        }
        return i(s, [{
            key: "_messageProcessor",
            value: function(e) {
                var r = e.data,
                    i = r.message,
                    n = r.detail;
                if ("INITIALIZE_PROCESSOR" === i) {
                    var o = v(n, 3),
                        s = o[0],
                        u = o[1],
                        a = o[2];
                    return this.bufferSource = new x(s, u, a), 
                    this._samples = new Float32Array(2 * this.bufferSize), 
                    this._pipe = new C, 
                    this._filter = new w(this.bufferSource, this._pipe), 
                    this.port.postMessage({ message: "PROCESSOR_READY" }), 
                    this._initialized = !0, !0
                }
                if ("SET_PIPE_PROP" === i && n) {
                    var h = n.name,
                        f = n.value;
                    return this._pipe[h] = f, 
                    void this.port.postMessage({ message: "PIPE_PROP_CHANGED", 
                    detail: "Updated ".concat(h, " to ").concat(this._pipe[h], 
                        "\ntypeof ").concat(t(f)) 
                    })
                }
                if ("SET_FILTER_PROP" === i && n) {
                    var c = n.name,
                        l = n.value;
                    return (
                        this._filter[c] = l, 
                        void this.port.postMessage({ 
                            message: "FILTER_PROP_CHANGED", 
                            detail: "Updated ".concat(c, " to ").concat(this._filter[c], "\ntypeof ").concat(t(l)) 
                        }));
                }
                console.log("[PitchShifterWorkletProcessor] Unknown message: ", e)
            }
        }, {
            key: "_sendMessage",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null;
                t && this.port.postMessage({ message: t, detail: e })
            }
        }, {
            key: "process",
            value: function(t, e) {
                this._sendMessage("LOG", t);
                if (!this._initialized || !t[0].length) return !0;
                var r = e[0][0],
                    i = e[0][1],
                    n = this._samples;
                if (!r || r && !r.length) return !1;
                var o = this._filter.extract(n, t[0][0].length);
                if (!o) return this._sendMessage("PROCESSOR_END"), !1;
                this._sendMessage("SOURCEPOSITION", this._filter.sourcePosition);
                for (var s = 0; s < o; s += 1) r[s] = n[2 * s], i[s] = n[2 * s + 1];
                this._sendMessage("LOG", e);
                return !0
            }
        }]), s
    }();