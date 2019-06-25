/**
 * @fileoverview
 * @enhanceable
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!

var jspb = require('google-protobuf');
var goog = jspb;
var global = Function('return this')();

goog.exportSymbol(
  'proto.cn.leancloud.play.proto.GenericCollection',
  null,
  global
);
goog.exportSymbol(
  'proto.cn.leancloud.play.proto.GenericCollection.MapEntry',
  null,
  global
);
goog.exportSymbol(
  'proto.cn.leancloud.play.proto.GenericCollectionValue',
  null,
  global
);
goog.exportSymbol(
  'proto.cn.leancloud.play.proto.GenericCollectionValue.Type',
  null,
  global
);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cn.leancloud.play.proto.GenericCollectionValue = function(opt_data) {
  jspb.Message.initialize(
    this,
    opt_data,
    0,
    -1,
    null,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_
  );
};
goog.inherits(
  proto.cn.leancloud.play.proto.GenericCollectionValue,
  jspb.Message
);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cn.leancloud.play.proto.GenericCollectionValue.displayName =
    'proto.cn.leancloud.play.proto.GenericCollectionValue';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cn.leancloud.play.proto.GenericCollection = function(opt_data) {
  jspb.Message.initialize(
    this,
    opt_data,
    0,
    -1,
    proto.cn.leancloud.play.proto.GenericCollection.repeatedFields_,
    null
  );
};
goog.inherits(proto.cn.leancloud.play.proto.GenericCollection, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cn.leancloud.play.proto.GenericCollection.displayName =
    'proto.cn.leancloud.play.proto.GenericCollection';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(
  proto.cn.leancloud.play.proto.GenericCollection.MapEntry,
  jspb.Message
);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cn.leancloud.play.proto.GenericCollection.MapEntry.displayName =
    'proto.cn.leancloud.play.proto.GenericCollection.MapEntry';
}

/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_ = [
  [2, 3, 4, 5, 6, 7, 8],
];

/**
 * @enum {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.ValueCase = {
  VALUE_NOT_SET: 0,
  INTVALUE: 2,
  LONGINTVALUE: 3,
  BOOLVALUE: 4,
  STRINGVALUE: 5,
  BYTESVALUE: 6,
  FLOATVALUE: 7,
  DOUBLEVALUE: 8,
};

/**
 * @return {proto.cn.leancloud.play.proto.GenericCollectionValue.ValueCase}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getValueCase = function() {
  return /** @type {proto.cn.leancloud.play.proto.GenericCollectionValue.ValueCase} */ (jspb.Message.computeOneofCase(
    this,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0]
  ));
};

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto suitable for use in Soy templates.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
   * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
   *     for transitional soy proto support: http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.toObject = function(
    opt_includeInstance
  ) {
    return proto.cn.leancloud.play.proto.GenericCollectionValue.toObject(
      opt_includeInstance,
      this
    );
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Whether to include the JSPB
   *     instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.cn.leancloud.play.proto.GenericCollectionValue} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.cn.leancloud.play.proto.GenericCollectionValue.toObject = function(
    includeInstance,
    msg
  ) {
    var f,
      obj = {
        type: jspb.Message.getFieldWithDefault(msg, 1, 0),
        intvalue: jspb.Message.getFieldWithDefault(msg, 2, 0),
        longintvalue: jspb.Message.getFieldWithDefault(msg, 3, 0),
        boolvalue: jspb.Message.getFieldWithDefault(msg, 4, false),
        stringvalue: jspb.Message.getFieldWithDefault(msg, 5, ''),
        bytesvalue: msg.getBytesvalue_asB64(),
        floatvalue: +jspb.Message.getFieldWithDefault(msg, 7, 0.0),
        doublevalue: +jspb.Message.getFieldWithDefault(msg, 8, 0.0),
        objecttypeid: jspb.Message.getFieldWithDefault(msg, 9, 0),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cn.leancloud.play.proto.GenericCollectionValue}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.deserializeBinary = function(
  bytes
) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cn.leancloud.play.proto.GenericCollectionValue();
  return proto.cn.leancloud.play.proto.GenericCollectionValue.deserializeBinaryFromReader(
    msg,
    reader
  );
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cn.leancloud.play.proto.GenericCollectionValue} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cn.leancloud.play.proto.GenericCollectionValue}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.deserializeBinaryFromReader = function(
  msg,
  reader
) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {!proto.cn.leancloud.play.proto.GenericCollectionValue.Type} */ (reader.readEnum());
        msg.setType(value);
        break;
      case 2:
        var value = /** @type {number} */ (reader.readInt32());
        msg.setIntvalue(value);
        break;
      case 3:
        var value = /** @type {number} */ (reader.readInt64());
        msg.setLongintvalue(value);
        break;
      case 4:
        var value = /** @type {boolean} */ (reader.readBool());
        msg.setBoolvalue(value);
        break;
      case 5:
        var value = /** @type {string} */ (reader.readString());
        msg.setStringvalue(value);
        break;
      case 6:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setBytesvalue(value);
        break;
      case 7:
        var value = /** @type {number} */ (reader.readFloat());
        msg.setFloatvalue(value);
        break;
      case 8:
        var value = /** @type {number} */ (reader.readDouble());
        msg.setDoublevalue(value);
        break;
      case 9:
        var value = /** @type {number} */ (reader.readInt32());
        msg.setObjecttypeid(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cn.leancloud.play.proto.GenericCollectionValue.serializeBinaryToWriter(
    this,
    writer
  );
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cn.leancloud.play.proto.GenericCollectionValue} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.serializeBinaryToWriter = function(
  message,
  writer
) {
  var f = undefined;
  f = message.getType();
  if (f !== 0.0) {
    writer.writeEnum(1, f);
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 2));
  if (f != null) {
    writer.writeInt32(2, f);
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 3));
  if (f != null) {
    writer.writeInt64(3, f);
  }
  f = /** @type {boolean} */ (jspb.Message.getField(message, 4));
  if (f != null) {
    writer.writeBool(4, f);
  }
  f = /** @type {string} */ (jspb.Message.getField(message, 5));
  if (f != null) {
    writer.writeString(5, f);
  }
  f = /** @type {!(string|Uint8Array)} */ (jspb.Message.getField(message, 6));
  if (f != null) {
    writer.writeBytes(6, f);
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 7));
  if (f != null) {
    writer.writeFloat(7, f);
  }
  f = /** @type {number} */ (jspb.Message.getField(message, 8));
  if (f != null) {
    writer.writeDouble(8, f);
  }
  f = message.getObjecttypeid();
  if (f !== 0) {
    writer.writeInt32(9, f);
  }
};

/**
 * @enum {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.Type = {
  NULL: 0,
  BYTES: 1,
  BYTE: 2,
  SHORT: 3,
  INT: 4,
  LONG: 5,
  BOOL: 6,
  FLOAT: 7,
  DOUBLE: 8,
  OBJECT: 9,
  STRING: 10,
  MAP: 11,
  ARRAY: 12,
};

/**
 * optional Type type = 1;
 * @return {!proto.cn.leancloud.play.proto.GenericCollectionValue.Type}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getType = function() {
  return /** @type {!proto.cn.leancloud.play.proto.GenericCollectionValue.Type} */ (jspb.Message.getFieldWithDefault(
    this,
    1,
    0
  ));
};

/** @param {!proto.cn.leancloud.play.proto.GenericCollectionValue.Type} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setType = function(
  value
) {
  jspb.Message.setProto3EnumField(this, 1, value);
};

/**
 * optional int32 intValue = 2;
 * @return {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getIntvalue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};

/** @param {number} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setIntvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    2,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearIntvalue = function() {
  jspb.Message.setOneofField(
    this,
    2,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasIntvalue = function() {
  return jspb.Message.getField(this, 2) != null;
};

/**
 * optional int64 longIntValue = 3;
 * @return {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getLongintvalue = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};

/** @param {number} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setLongintvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    3,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearLongintvalue = function() {
  jspb.Message.setOneofField(
    this,
    3,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasLongintvalue = function() {
  return jspb.Message.getField(this, 3) != null;
};

/**
 * optional bool boolValue = 4;
 * Note that Boolean fields may be set to 0/1 when serialized from a Java server.
 * You should avoid comparisons like {@code val === true/false} in those cases.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getBoolvalue = function() {
  return /** @type {boolean} */ (jspb.Message.getFieldWithDefault(
    this,
    4,
    false
  ));
};

/** @param {boolean} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setBoolvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    4,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearBoolvalue = function() {
  jspb.Message.setOneofField(
    this,
    4,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasBoolvalue = function() {
  return jspb.Message.getField(this, 4) != null;
};

/**
 * optional string stringValue = 5;
 * @return {string}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getStringvalue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ''));
};

/** @param {string} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setStringvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    5,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearStringvalue = function() {
  jspb.Message.setOneofField(
    this,
    5,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasStringvalue = function() {
  return jspb.Message.getField(this, 5) != null;
};

/**
 * optional bytes bytesValue = 6;
 * @return {!(string|Uint8Array)}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getBytesvalue = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(
    this,
    6,
    ''
  ));
};

/**
 * optional bytes bytesValue = 6;
 * This is a type-conversion wrapper around `getBytesvalue()`
 * @return {string}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getBytesvalue_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getBytesvalue()));
};

/**
 * optional bytes bytesValue = 6;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getBytesvalue()`
 * @return {!Uint8Array}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getBytesvalue_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
    this.getBytesvalue()
  ));
};

/** @param {!(string|Uint8Array)} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setBytesvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    6,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearBytesvalue = function() {
  jspb.Message.setOneofField(
    this,
    6,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasBytesvalue = function() {
  return jspb.Message.getField(this, 6) != null;
};

/**
 * optional float floatValue = 7;
 * @return {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getFloatvalue = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(
    this,
    7,
    0.0
  ));
};

/** @param {number} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setFloatvalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    7,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearFloatvalue = function() {
  jspb.Message.setOneofField(
    this,
    7,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasFloatvalue = function() {
  return jspb.Message.getField(this, 7) != null;
};

/**
 * optional double doubleValue = 8;
 * @return {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getDoublevalue = function() {
  return /** @type {number} */ (+jspb.Message.getFieldWithDefault(
    this,
    8,
    0.0
  ));
};

/** @param {number} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setDoublevalue = function(
  value
) {
  jspb.Message.setOneofField(
    this,
    8,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    value
  );
};

/**
 * Clears the field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.clearDoublevalue = function() {
  jspb.Message.setOneofField(
    this,
    8,
    proto.cn.leancloud.play.proto.GenericCollectionValue.oneofGroups_[0],
    undefined
  );
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.hasDoublevalue = function() {
  return jspb.Message.getField(this, 8) != null;
};

/**
 * optional int32 objectTypeId = 9;
 * @return {number}
 */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.getObjecttypeid = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 9, 0));
};

/** @param {number} value */
proto.cn.leancloud.play.proto.GenericCollectionValue.prototype.setObjecttypeid = function(
  value
) {
  jspb.Message.setProto3IntField(this, 9, value);
};

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.cn.leancloud.play.proto.GenericCollection.repeatedFields_ = [1, 2];

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto suitable for use in Soy templates.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
   * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
   *     for transitional soy proto support: http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.cn.leancloud.play.proto.GenericCollection.prototype.toObject = function(
    opt_includeInstance
  ) {
    return proto.cn.leancloud.play.proto.GenericCollection.toObject(
      opt_includeInstance,
      this
    );
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Whether to include the JSPB
   *     instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.cn.leancloud.play.proto.GenericCollection} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.cn.leancloud.play.proto.GenericCollection.toObject = function(
    includeInstance,
    msg
  ) {
    var f,
      obj = {
        listvalueList: jspb.Message.toObjectList(
          msg.getListvalueList(),
          proto.cn.leancloud.play.proto.GenericCollectionValue.toObject,
          includeInstance
        ),
        mapentryvalueList: jspb.Message.toObjectList(
          msg.getMapentryvalueList(),
          proto.cn.leancloud.play.proto.GenericCollection.MapEntry.toObject,
          includeInstance
        ),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cn.leancloud.play.proto.GenericCollection}
 */
proto.cn.leancloud.play.proto.GenericCollection.deserializeBinary = function(
  bytes
) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cn.leancloud.play.proto.GenericCollection();
  return proto.cn.leancloud.play.proto.GenericCollection.deserializeBinaryFromReader(
    msg,
    reader
  );
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cn.leancloud.play.proto.GenericCollection} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cn.leancloud.play.proto.GenericCollection}
 */
proto.cn.leancloud.play.proto.GenericCollection.deserializeBinaryFromReader = function(
  msg,
  reader
) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = new proto.cn.leancloud.play.proto.GenericCollectionValue();
        reader.readMessage(
          value,
          proto.cn.leancloud.play.proto.GenericCollectionValue
            .deserializeBinaryFromReader
        );
        msg.addListvalue(value);
        break;
      case 2:
        var value = new proto.cn.leancloud.play.proto.GenericCollection.MapEntry();
        reader.readMessage(
          value,
          proto.cn.leancloud.play.proto.GenericCollection.MapEntry
            .deserializeBinaryFromReader
        );
        msg.addMapentryvalue(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cn.leancloud.play.proto.GenericCollection.serializeBinaryToWriter(
    this,
    writer
  );
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cn.leancloud.play.proto.GenericCollection} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cn.leancloud.play.proto.GenericCollection.serializeBinaryToWriter = function(
  message,
  writer
) {
  var f = undefined;
  f = message.getListvalueList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.cn.leancloud.play.proto.GenericCollectionValue
        .serializeBinaryToWriter
    );
  }
  f = message.getMapentryvalueList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.cn.leancloud.play.proto.GenericCollection.MapEntry
        .serializeBinaryToWriter
    );
  }
};

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto suitable for use in Soy templates.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     com.google.apps.jspb.JsClassTemplate.JS_RESERVED_WORDS.
   * @param {boolean=} opt_includeInstance Whether to include the JSPB instance
   *     for transitional soy proto support: http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.toObject = function(
    opt_includeInstance
  ) {
    return proto.cn.leancloud.play.proto.GenericCollection.MapEntry.toObject(
      opt_includeInstance,
      this
    );
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Whether to include the JSPB
   *     instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.cn.leancloud.play.proto.GenericCollection.MapEntry.toObject = function(
    includeInstance,
    msg
  ) {
    var f,
      obj = {
        key: jspb.Message.getFieldWithDefault(msg, 1, ''),
        val:
          (f = msg.getVal()) &&
          proto.cn.leancloud.play.proto.GenericCollectionValue.toObject(
            includeInstance,
            f
          ),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.deserializeBinary = function(
  bytes
) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cn.leancloud.play.proto.GenericCollection.MapEntry();
  return proto.cn.leancloud.play.proto.GenericCollection.MapEntry.deserializeBinaryFromReader(
    msg,
    reader
  );
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.deserializeBinaryFromReader = function(
  msg,
  reader
) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {string} */ (reader.readString());
        msg.setKey(value);
        break;
      case 2:
        var value = new proto.cn.leancloud.play.proto.GenericCollectionValue();
        reader.readMessage(
          value,
          proto.cn.leancloud.play.proto.GenericCollectionValue
            .deserializeBinaryFromReader
        );
        msg.setVal(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cn.leancloud.play.proto.GenericCollection.MapEntry.serializeBinaryToWriter(
    this,
    writer
  );
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.serializeBinaryToWriter = function(
  message,
  writer
) {
  var f = undefined;
  f = message.getKey();
  if (f.length > 0) {
    writer.writeString(1, f);
  }
  f = message.getVal();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.cn.leancloud.play.proto.GenericCollectionValue
        .serializeBinaryToWriter
    );
  }
};

/**
 * optional string key = 1;
 * @return {string}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.getKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ''));
};

/** @param {string} value */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.setKey = function(
  value
) {
  jspb.Message.setProto3StringField(this, 1, value);
};

/**
 * optional GenericCollectionValue val = 2;
 * @return {?proto.cn.leancloud.play.proto.GenericCollectionValue}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.getVal = function() {
  return /** @type{?proto.cn.leancloud.play.proto.GenericCollectionValue} */ (jspb.Message.getWrapperField(
    this,
    proto.cn.leancloud.play.proto.GenericCollectionValue,
    2
  ));
};

/** @param {?proto.cn.leancloud.play.proto.GenericCollectionValue|undefined} value */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.setVal = function(
  value
) {
  jspb.Message.setWrapperField(this, 2, value);
};

/**
 * Clears the message field making it undefined.
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.clearVal = function() {
  this.setVal(undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cn.leancloud.play.proto.GenericCollection.MapEntry.prototype.hasVal = function() {
  return jspb.Message.getField(this, 2) != null;
};

/**
 * repeated GenericCollectionValue listValue = 1;
 * @return {!Array<!proto.cn.leancloud.play.proto.GenericCollectionValue>}
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.getListvalueList = function() {
  return /** @type{!Array<!proto.cn.leancloud.play.proto.GenericCollectionValue>} */ (jspb.Message.getRepeatedWrapperField(
    this,
    proto.cn.leancloud.play.proto.GenericCollectionValue,
    1
  ));
};

/** @param {!Array<!proto.cn.leancloud.play.proto.GenericCollectionValue>} value */
proto.cn.leancloud.play.proto.GenericCollection.prototype.setListvalueList = function(
  value
) {
  jspb.Message.setRepeatedWrapperField(this, 1, value);
};

/**
 * @param {!proto.cn.leancloud.play.proto.GenericCollectionValue=} opt_value
 * @param {number=} opt_index
 * @return {!proto.cn.leancloud.play.proto.GenericCollectionValue}
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.addListvalue = function(
  opt_value,
  opt_index
) {
  return jspb.Message.addToRepeatedWrapperField(
    this,
    1,
    opt_value,
    proto.cn.leancloud.play.proto.GenericCollectionValue,
    opt_index
  );
};

/**
 * Clears the list making it empty but non-null.
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.clearListvalueList = function() {
  this.setListvalueList([]);
};

/**
 * repeated MapEntry mapEntryValue = 2;
 * @return {!Array<!proto.cn.leancloud.play.proto.GenericCollection.MapEntry>}
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.getMapentryvalueList = function() {
  return /** @type{!Array<!proto.cn.leancloud.play.proto.GenericCollection.MapEntry>} */ (jspb.Message.getRepeatedWrapperField(
    this,
    proto.cn.leancloud.play.proto.GenericCollection.MapEntry,
    2
  ));
};

/** @param {!Array<!proto.cn.leancloud.play.proto.GenericCollection.MapEntry>} value */
proto.cn.leancloud.play.proto.GenericCollection.prototype.setMapentryvalueList = function(
  value
) {
  jspb.Message.setRepeatedWrapperField(this, 2, value);
};

/**
 * @param {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry=} opt_value
 * @param {number=} opt_index
 * @return {!proto.cn.leancloud.play.proto.GenericCollection.MapEntry}
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.addMapentryvalue = function(
  opt_value,
  opt_index
) {
  return jspb.Message.addToRepeatedWrapperField(
    this,
    2,
    opt_value,
    proto.cn.leancloud.play.proto.GenericCollection.MapEntry,
    opt_index
  );
};

/**
 * Clears the list making it empty but non-null.
 */
proto.cn.leancloud.play.proto.GenericCollection.prototype.clearMapentryvalueList = function() {
  this.setMapentryvalueList([]);
};

goog.object.extend(exports, proto.cn.leancloud.play.proto);
