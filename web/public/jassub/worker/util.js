export const read_ = (url, ab = false) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.responseType = ab ? 'arraybuffer' : 'text';
    xhr.send(null);
    return xhr.response;
};
export const readAsync = (url, load, err) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
        if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
            return load(xhr.response);
        }
    };
    xhr.onerror = err;
    xhr.send(null);
};
const a = 'BT601';
const b = 'BT709';
const c = 'SMPTE240M';
const d = 'FCC';
export const libassYCbCrMap = [null, a, null, a, a, b, b, c, c, d, d];
export function _applyKeys(input, output) {
    for (const v of Object.keys(input)) {
        output[v] = input[v];
    }
}
//# sourceMappingURL=util.js.map