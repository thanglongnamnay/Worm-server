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
    constructor(data = Buffer.alloc()) {
        this._data = data;
    }
    getByte() {
        const value = this._data.readInt8(this._cursor);
        this._cursor += 1;
        return value;
    }
    getBool() {
        return this.getByte() !== 0;
    }
    getInt() {
        const value = this._data.readInt32LE(this._cursor);
        this._cursor += 4;
        return value;
    }
    getDouble() {
        const value = this._data.readDoubleLE(this._cursor);
        this._cursor += 8;
        return value;
    }
    getString() {
        throw Error('Not implemented');
    }
    putByte(value) {
        this._cursor = this._data.writeInt8(value, this._cursor);
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
}
module.exports = exports = Packet;