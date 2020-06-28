const Type = require('./type');
const Buffer = require('buffer');
const os = require('os');

const size = {
    byte: 1,
    int: 4,
    long: 8,
}
class Packet {
    _cursor = 0;
    constructor(data = []) {
        this._data = data;
    }
    putByte(value) {

    }
    putBool(value) {
        this.putByte(value);
    }
    putInt(value) {
        this._cursor = this._data.writeInt32LE(value, this._cursor);
    }
    putDouble(value) {
        this._cursor = this._data.writeDoubleLE(value, this._cursor);
    }
    putString(value) {
        throw Error('Not implemented');
    }
    pack() {

    }
}
module.exports = exports = Packet;