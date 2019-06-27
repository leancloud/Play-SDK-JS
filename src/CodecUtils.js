import PlayObject from './PlayObject';
import PlayArray from './PlayArray';

const genericCollection = require('./proto/generic_collection_pb');

const { GenericCollectionValue } = genericCollection;

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
  } else if (val instanceof PlayObject) {
    genericVal.setType(GenericCollectionValue.Type.MAP);
  } else if (val instanceof PlayArray) {
    genericVal.setType(GenericCollectionValue.Type.ARRAY);
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
      val = genericCollection.getBoolValue();
      break;
    case GenericCollectionValue.Type.DOUBLE:
      val = genericCollection.getDoubleValue();
      break;
    case GenericCollectionValue.Type.STRING:
      val = genericCollection.getStringValue();
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
  serialize,
  deserialize,
};
