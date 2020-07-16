//Tempo map

/*

t(e) -> 3
e(t,e) -> 13
r(t,e) -> 16
i(t, e, i) -> 23
n(t, e) -> 29
o(t) -> 34
s(t, e) -> 42
u() -> 48
a(t, e, r) -> 62
h(t) -> 71
f(t) -> 87
c(t, e) -> 89
l(t) -> 91
p(t, e, r) -> 103
v(t, e) -> 117
y(t, e) -> 155
d(e) -> 160
    h(t, e, r) -> 194
    c (empty) -> 198
    l (empty) -> 200
    p (empty) -> 202
    g(t) -> 210
    _(e, r) -> 214 
    k(t, e) -> 240
    B(t) -> 259
    w(t) -> 264
    S(t) -> 269
    P(t) -> 271
    b() -> 289
m()= -> 431 
g()= -> 533
_(t)= -> 565
k()= -> 627
w(t)= -> 671
S (array)= -> 731
P(t)= -> 740
b(t, e)= -> 926
C()= -> 929
L()= -> 1047
E(t, e)= -> 1079
O(t)= -> 1092
R(t)= -> 1098
x= -> 1113
M(r)= -> 1233


P entry function

l1079 var E -> Uses script processor

l929 var C -> is the soundtouch javascript file - line 929
l1047 var L -> Buffer cleaning

l1115 var u = new L(i);
l671 w -> new w(u, this._soundtouch, s) This 


List of operations for tempo
'P' contains all of the modifications that are done on the buffer, this function
houses the tempo operation and its operations
-> tempo -> calculateSequenceParameters -> sets parameters sequenceMS, autoSeekSetting, seekWindowMs, seekWindowLength, seekLength
         -> nominalSkip
            -> seekWindowLength
            -> overlapLength
         -> skipFract
         -> sampleReq
            -> overlapLength
            -> seekWindowLength
            -> seekLength          
*/

/*
    Things to do
    - establish communication between workletNode and workletProcessor
    - Track the time the audio script is up to

    Figure out how the 'm' class works ( buffers are all defined by m)
    How are buffers filled?
    How does framing work?

    Worklet flow
    In 'M':
        First Initialized by worklet message
        Declares class 'x'
            Class 'x' declarations -> Parameters r, i, n
            - C (soundTouch)
            - u = L(i) (Data extractor)
            - _filter = w(u, C, s) (Fills buffers)
            - E (Returns a scriptProcessorNode)
            - 

    The w extract function takes in the array to fill and the 
        length of the input buffer from the processor that is parsed


*/

key: "checkLimits", 
value: function(t, e, r) { 
    return t < e ? e : t > r ? r : t 
} 

key: "setParameters", 
value: function(t, e, r, i) { 
    t > 0 && (this.sampleRate = t), 
    i > 0 && (this.overlapMs = i), 
    e > 0 ? (this.sequenceMs = e, this.autoSeqSetting = !1) : this.autoSeqSetting = !0, r > 0 ? (this.seekWindowMs = r, this.autoSeekSetting = !1) : this.autoSeekSetting = !0, 
    this.calculateSequenceParameters(), 
    this.calculateOverlapLength(this.overlapMs), 
    this.tempo = this._tempo 

key: "calculateOverlapLength",
value: function() {
    var t, e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
    t = (t = this.sampleRate * e / 1e3) < 16 ? 16 : t, 
    t -= t % 8, 
    this.overlapLength = t, 
    this.refMidBuffer = new Float32Array(2 * this.overlapLength), 
    this.midBuffer = new Float32Array(2 * this.overlapLength)

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

key: "tempo",
set: function(t) {
    var e;
    this._tempo = t, 
    this.calculateSequenceParameters(), 
    this.nominalSkip = this._tempo * (this.seekWindowLength - this.overlapLength), 
    this.skipFract = 0, 
    e = Math.floor(this.nominalSkip + .5), 
    this.sampleReq = Math.max(e + this.overlapLength, this.seekWindowLength) + this.seekLength
}

// Process
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