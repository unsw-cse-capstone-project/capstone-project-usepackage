const pad = function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
};

const minsSecs = function(secs) {
    const mins = Math.floor(secs / 60);
    const seconds = secs - mins * 60;
    return `${mins}:${pad(parseInt(seconds), 2)}`;
};

export const diffSecs = function(ms1, ms2) {
    return (ms2 - ms1) / 1000;
};

export default minsSecs;