const factory = Object.create(null);
const bool = 'bool', byte = 'byte', int = 'int', double = 'double', string = 'string';
factory[int] = that => that.getInt();
factory[bool] = that => that.getBool();
factory[string] = that => that.getString();
factory[byte] = that => that.getByte();
factory[double] = that => that.getDouble();

function _Array(type) {
    this._name = 'array';
    this.type = type;
}

function _Map(key, value) {
    this._name = 'map';
    this.key = key;
    this.value = value;
}

function array(type) {
    return new _Array(type)
}

function map(key, val) {
    if (!factory[key]) {
        console.warn('Map with non-primitive type key', key);
    }
    return new _Map(key, val);
}

function _read(that, type) {
    if (factory[type]) {
        return factory[type](that);
    }
    if (typeof type !== 'object') return type;
    let result, length, arrayType, valueType, keyType;
    if (type instanceof _Array) {
        length = that.getInt();
        arrayType = type.type;
        result = [];
        for (let i = 0; i < length; ++i) {
            result.push(_read(that, arrayType));
        }
    } else if (type instanceof _Map) {
        length = that.getInt();
        keyType = type.key;
        valueType = type.value;
        result = {};
        for (let i = 0; i < length; ++i) {
            result[_read(that, keyType)] = _read(that, valueType);
        }
    } else {
        result = {};
        for (let prop in type) {
            result[prop] = _read(that, type[prop]);
        }
    }
    return result;
}

module.exports = exports = {
    bool: bool,
    byte: byte,
    int: int,
    long: long,
    double: double,
    string: string,
    array: array,
    map: map,
    readPacket: _read,
};