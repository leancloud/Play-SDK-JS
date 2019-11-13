import genericCollection from './proto/generic_collection_pb';

const { GenericCollectionValue, GenericCollection } = genericCollection;

// import {
//   GenericCollectionValue,
//   GenericCollection,
// } from './proto/generic_collection_pb';

// import './proto/generic_collection_pb';

const _typeNameMap = {};
const _typeIdMap = {};

/**
 * 注册自定义类型的序列化
 * @param {*} type 类型
 * @param {number} typeId 类型 Id
 * @param {function} serializeMethod 序列化方法
 * @param {function} deserializeMethod 反序列化方法
 */
function registerType(type, typeId, serializeMethod, deserializeMethod) {
  if (type === undefined || typeof type !== 'function') {
    throw new TypeError('type must be a class');
  }
  if (serializeMethod === undefined || typeof serializeMethod !== 'function') {
    throw new TypeError('serializeMethod must be a function');
  }
  if (
    deserializeMethod === undefined ||
    typeof deserializeMethod !== 'function'
  ) {
    throw new TypeError('deserializeMethod must be a function');
  }
  const customType = {
    type,
    typeId,
    serializeMethod,
    deserializeMethod,
  };
  const { name: typeName } = type;
  _typeNameMap[typeName] = customType;
  _typeIdMap[typeId] = customType;
}

/* eslint no-use-before-define: ["error", { "functions": false }] */
function serialize(val) {
  const genericVal = new GenericCollectionValue();
  if (val === null) {
    genericVal.setType(GenericCollectionValue.Type.NULL);
  } else if (typeof val === 'boolean') {
    genericVal.setType(GenericCollectionValue.Type.BOOL);
    genericVal.setBoolValue(val);
  } else if (typeof val === 'number') {
    if (parseInt(val, 10) === val) {
      genericVal.setType(GenericCollectionValue.Type.INT);
      genericVal.setIntValue(val);
    } else {
      genericVal.setType(GenericCollectionValue.Type.DOUBLE);
      genericVal.setDoubleValue(val);
    }
  } else if (typeof val === 'string') {
    genericVal.setType(GenericCollectionValue.Type.STRING);
    genericVal.setStringValue(val);
  } else if (val instanceof Array) {
    // 数组
    genericVal.setType(GenericCollectionValue.Type.ARRAY);
    const vList = [];
    val.forEach(v => {
      vList.push(serialize(v));
    });
    const list = new GenericCollection();
    list.setListValueList(vList);
    genericVal.setBytesValue(list.serializeBinary());
  } else if (val instanceof Object) {
    const typeName = val.constructor.name;
    const customType = _typeNameMap[typeName];
    if (customType) {
      // 自定义类型
      genericVal.setType(GenericCollectionValue.Type.OBJECT);
      const { typeId, serializeMethod } = customType;
      genericVal.setObjectTypeId(typeId);
      genericVal.setBytesValue(serializeMethod(val));
    } else {
      // Map
      genericVal.setType(GenericCollectionValue.Type.MAP);
      genericVal.setBytesValue(serializeObject(val));
    }
  } else {
    // 其他类型
    throw new TypeError(`${typeof val} is not supported`);
  }
  return genericVal;
}

function deserialize(genericVal) {
  let val = null;
  switch (genericVal.getType()) {
    case GenericCollectionValue.Type.NULL:
      // Nothing
      break;
    case GenericCollectionValue.Type.BOOL:
      val = genericVal.getBoolValue();
      break;
    case GenericCollectionValue.Type.BYTE:
      val = genericVal.getByteValue();
      break;
    case GenericCollectionValue.Type.SHORT:
      val = genericVal.getShortValue();
      break;
    case GenericCollectionValue.Type.INT:
      val = genericVal.getIntValue();
      break;
    case GenericCollectionValue.Type.LONG:
      val = genericVal.getLongValue();
      break;
    case GenericCollectionValue.Type.FLOAT:
      val = genericVal.getFloatValue();
      break;
    case GenericCollectionValue.Type.DOUBLE:
      val = genericVal.getDoubleValue();
      break;
    case GenericCollectionValue.Type.STRING:
      val = genericVal.getStringValue();
      break;
    case GenericCollectionValue.Type.MAP:
      {
        const bytes = genericVal.getBytesValue();
        val = deserializeObject(bytes);
      }
      break;
    case GenericCollectionValue.Type.ARRAY:
      {
        const bytes = genericVal.getBytesValue();
        val = [];
        const list = GenericCollection.deserializeBinary(bytes);
        list.getListValueList().forEach(v => {
          val.push(deserialize(v));
        });
      }
      break;
    case GenericCollectionValue.Type.OBJECT:
      {
        const typeId = genericVal.getObjectTypeId();
        const customType = _typeIdMap[typeId];
        if (customType) {
          const bytes = genericVal.getBytesValue();
          const { deserializeMethod } = customType;
          val = deserializeMethod(bytes);
        } else {
          throw new TypeError(`type id: ${typeId} is not supported`);
        }
      }
      break;
    default:
      break;
  }
  return val;
}

/**
 * 序列化 object
 * @param {*} obj 要序列化的 object
 */
function serializeObject(obj) {
  if (obj === undefined) {
    return null;
  }
  const entryList = [];
  Object.keys(obj).forEach(k => {
    const entry = new GenericCollection.MapEntry();
    entry.setKey(k);
    entry.setVal(serialize(obj[k]));
    entryList.push(entry);
  });
  const map = new GenericCollection();
  map.setMapEntryValueList(entryList);
  return map.serializeBinary();
}

/**
 * 反序列化 object
 * @param {*} bytes 字节数组
 */
function deserializeObject(bytes) {
  if (bytes === undefined) {
    return null;
  }
  const map = GenericCollection.deserializeBinary(bytes);
  const obj = {};
  map.getMapEntryValueList().forEach(entry => {
    obj[entry.getKey()] = deserialize(entry.getVal());
  });
  return obj;
}

export {
  registerType,
  serialize,
  deserialize,
  serializeObject,
  deserializeObject,
};
