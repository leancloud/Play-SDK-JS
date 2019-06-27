import PlayObject from './PlayObject';
import PlayArray from './PlayArray';
import { object } from 'google-protobuf';

const genericCollection = require('./proto/generic_collection_pb');

const { GenericCollectionValue, GenericCollection } = genericCollection;

const _typeNameMap = {};
const _typeIdMap = {};

function registerType(type, typeId, serializeMethod, deserializeMethod) {
  if (type === undefined || typeof type !== 'object') {
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

function serialize(val) {
  const genericVal = new GenericCollectionValue();
  if (val === null) {
    genericVal.setType(GenericCollectionValue.Type.NULL);
  } else if (typeof val === 'boolean') {
    genericVal.setType(GenericCollectionValue.Type.BOOL);
    genericVal.setBoolValue(val);
  } else if (typeof val === 'number') {
    genericVal.setType(GenericCollectionValue.Type.DOUBLE);
    genericVal.setDoubleValue(val);
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
    list.setListValue(vList);
    genericVal.setBytesValue(list.serializeBinary());
  } else if (val instanceof object) {
    const typeName = val.constructor.name;
    const customType = _typeNameMap[typeName];
    if (customType) {
      // 自定义类型
      genericVal.setType(GenericCollectionValue.Type.OBJECT);
      const { serializeMethod } = customType;
      genericVal.setBytesValue(serializeMethod(val));
    } else {
      // Map
      genericVal.setType(GenericCollectionValue.Type.MAP);
      const entryList = [];
      Object.keys(val).forEach(k => {
        const entry = new GenericCollection.MapEntry();
        entry.setKey(k);
        entry.setVal(serialize(val[k]));
        entryList.push(entry);
      });
      const map = new GenericCollection();
      map.setMapEntryValueList(entryList);
      genericVal.setBytesValue(map.serializeBinary());
    }
  } else if (val instanceof PlayObject) {
    genericVal.setType(GenericCollectionValue.Type.MAP);
  } else {
    // TODO 自定义类型
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
      break;
    case GenericCollectionValue.Type.ARRAY:
      break;
    default:
      break;
  }
  return val;
}

export default {
  registerType,
  serialize,
  deserialize,
};
