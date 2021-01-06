function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

function _classStaticPrivateFieldSpecSet(receiver, classConstructor, descriptor, value) { if (receiver !== classConstructor) { throw new TypeError("Private static access of wrong provenance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

function _classStaticPrivateFieldSpecGet(receiver, classConstructor, descriptor) { if (receiver !== classConstructor) { throw new TypeError("Private static access of wrong provenance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldGet(receiver, privateMap) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to get private field on non-instance"); } if (descriptor.get) { return descriptor.get.call(receiver); } return descriptor.value; }

function _classPrivateFieldSet(receiver, privateMap, value) { var descriptor = privateMap.get(receiver); if (!descriptor) { throw new TypeError("attempted to set private field on non-instance"); } if (descriptor.set) { descriptor.set.call(receiver, value); } else { if (!descriptor.writable) { throw new TypeError("attempted to set read only private field"); } descriptor.value = value; } return value; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// jsox.js
// JSOX JavaScript Object eXchange. Inherits human features of comments
// and extended formatting from JSON6; adds macros, big number and date
// support.  See README.md for details.
//
// This file is based off of https://github.com/JSON6/  ./lib/json6.js
// which is based off of https://github.com/d3x0r/sack  ./src/netlib/html5.websocket/json6_parser.c
//
var exports = exports || {}; ////const util = require('util'); // debug inspect.
//import util from 'util'; 

const _JSON = JSON; // in case someone does something like JSON=JSOX; we still need a primitive _JSON for internal stringification

const JSOX$1 = exports;
JSOX$1.version = "1.2.105"; //function privateizeEverything() {
//const _DEBUG_LL = false;
//const _DEBUG_PARSING = false;
//const _DEBUG_STRINGIFY = false;
//const _DEBUG_PARSING_STACK = false;
//const _DEBUG_PARSING_NUMBERS = false;
//const _DEBUG_PARSING_DETAILS = false;
//const _DEBUG_PARSING_CONTEXT = false;
//const _DEBUG_REFERENCES = false; // this tracks folling context stack when the components have not been completed.
//const _DEBUG_WHITESPACE = false; 

const hasBigInt = typeof BigInt === "function";
const VALUE_UNDEFINED = -1;
const VALUE_UNSET = 0;
const VALUE_NULL = 1;
const VALUE_TRUE = 2;
const VALUE_FALSE = 3;
const VALUE_STRING = 4;
const VALUE_NUMBER = 5;
const VALUE_OBJECT = 6;
const VALUE_NEG_NAN = 7;
const VALUE_NAN = 8;
const VALUE_NEG_INFINITY = 9;
const VALUE_INFINITY = 10; //const VALUE_DATE = 11  // unused yet; this is actuall a subType of VALUE_NUMBER

const VALUE_EMPTY = 12; // [,] makes an array with 'empty item'

const VALUE_ARRAY = 13; //
// internally arrayType = -1 is a normal array
// arrayType = -2 is a reference array, which, which closed is resolved to
//     the specified object.
// arrayType = -3 is a normal array, that has already had this element pushed.

const knownArrayTypeNames = ["ab", "u8", "cu8", "s8", "u16", "s16", "u32", "s32", "u64", "s64", "f32", "f64"];
var arrayToJSOX = null;
var mapToJSOX = null;
const knownArrayTypes = [ArrayBuffer, Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, null, null //,Uint64Array,Int64Array
, Float32Array, Float64Array]; // somehow max isn't used... it would be the NEXT available VALUE_XXX value...
//const VALUE_ARRAY_MAX = VALUE_ARRAY + knownArrayTypes.length + 1; // 1 type is not typed; just an array.

const WORD_POS_RESET = 0;
const WORD_POS_TRUE_1 = 1;
const WORD_POS_TRUE_2 = 2;
const WORD_POS_TRUE_3 = 3;
const WORD_POS_FALSE_1 = 5;
const WORD_POS_FALSE_2 = 6;
const WORD_POS_FALSE_3 = 7;
const WORD_POS_FALSE_4 = 8;
const WORD_POS_NULL_1 = 9;
const WORD_POS_NULL_2 = 10;
const WORD_POS_NULL_3 = 11;
const WORD_POS_UNDEFINED_1 = 12;
const WORD_POS_UNDEFINED_2 = 13;
const WORD_POS_UNDEFINED_3 = 14;
const WORD_POS_UNDEFINED_4 = 15;
const WORD_POS_UNDEFINED_5 = 16;
const WORD_POS_UNDEFINED_6 = 17;
const WORD_POS_UNDEFINED_7 = 18;
const WORD_POS_UNDEFINED_8 = 19;
const WORD_POS_NAN_1 = 20;
const WORD_POS_NAN_2 = 21;
const WORD_POS_INFINITY_1 = 22;
const WORD_POS_INFINITY_2 = 23;
const WORD_POS_INFINITY_3 = 24;
const WORD_POS_INFINITY_4 = 25;
const WORD_POS_INFINITY_5 = 26;
const WORD_POS_INFINITY_6 = 27;
const WORD_POS_INFINITY_7 = 28;
const WORD_POS_FIELD = 29;
const WORD_POS_AFTER_FIELD = 30;
const WORD_POS_END = 31;
const WORD_POS_AFTER_FIELD_VALUE = 32; //const WORD_POS_BINARY = 32;

const CONTEXT_UNKNOWN = 0;
const CONTEXT_IN_ARRAY = 1;
const CONTEXT_OBJECT_FIELD = 2;
const CONTEXT_OBJECT_FIELD_VALUE = 3;
const CONTEXT_CLASS_FIELD = 4;
const CONTEXT_CLASS_VALUE = 5;
const CONTEXT_CLASS_FIELD_VALUE = 6;
const keywords = {
  ["true"]: true,
  ["false"]: false,
  ["null"]: null,
  ["NaN"]: NaN,
  ["Infinity"]: Infinity,
  ["undefined"]: undefined
};
const contexts = [];

function getContext() {
  var ctx = contexts.pop();
  if (!ctx) ctx = {
    context: CONTEXT_UNKNOWN,
    current_proto: null,
    current_class: null,
    current_class_field: 0,
    arrayType: -1,
    valueType: VALUE_UNSET,
    elements: null
  };
  return ctx;
}

function dropContext(ctx) {
  /*
  	console.log( "Dropping context:", ctx );
  	ctx.elements = null;
  	ctx.name = null;
  	ctx.valueType = VALUE_UNSET;
  	ctx.arrayType = -1;
  */
  contexts.push(ctx);
}

const buffers = [];

function getBuffer() {
  var buf = buffers.pop();
  if (!buf) buf = {
    buf: null,
    n: 0
  };else buf.n = 0;
  return buf;
}

function dropBuffer(buf) {
  buffers.push(buf);
}

JSOX$1.escape = function (string) {
  var n;
  var output = '';
  if (!string) return string;

  for (n = 0; n < string.length; n++) {
    if (string[n] == '"' || string[n] == '\\' || string[n] == '`' || string[n] == '\'') {
      output += '\\';
    }

    output += string[n];
  }

  return output;
};

const toProtoTypes = new WeakMap();
const toObjectTypes = new Map();
const fromProtoTypes = new Map();
const commonClasses = [];

JSOX$1.begin = function (cb, reviver) {
  const val = {
    name: null,
    // name of this value (if it's contained in an object)
    value_type: VALUE_UNSET,
    // value from above indiciating the type of this value
    string: '',
    // the string value of this value (strings and number types only)
    contains: null,
    className: null
  };
  const pos = {
    line: 1,
    col: 1
  };
  let n = 0;
  let str;
  var localFromProtoTypes = new Map();
  var word = WORD_POS_RESET,
      status = true,
      redefineClass = false,
      negative = false,
      result = null,
      rootObject = null,
      elements = undefined,
      context_stack = {
    first: null,
    last: null,
    saved: null,

    push(node) {
      //_DEBUG_PARSING_CONTEXT && console.log( "pushing context:", node );
      var recover = this.saved;

      if (recover) {
        this.saved = recover.next;
        recover.node = node;
        recover.next = null;
        recover.prior = this.last;
      } else {
        recover = {
          node: node,
          next: null,
          prior: this.last
        };
      }

      if (!this.last) this.first = recover;else this.last.next = recover;
      this.last = recover;
      this.length++;
    },

    pop() {
      var result = this.last; // through normal usage this line can never be used.
      //if( !result ) return null;

      if (!(this.last = result.prior)) this.first = null;
      result.next = this.saved;
      if (this.last) this.last.next = null;
      if (!result.next) result.first = null;
      this.saved = result;
      this.length--; //_DEBUG_PARSING_CONTEXT && console.log( "popping context:", result.node );

      return result.node;
    },

    length: 0
    /*dump() {  // //_DEBUG_CONTEXT_STACK
    	console.log( "STACK LENGTH:", this.length );
    	let cur= this.first;
    	let level = 0;
    	while( cur ) {
    		console.log( "Context:", level, cur.node );
    		level++;
    		cur = cur.next;
    	}
    }*/

  },
      classes = [],
      // class templates that have been defined.
  protoTypes = {},
      current_proto = null,
      // the current class being defined or being referenced.
  current_class = null,
      // the current class being defined or being referenced.
  current_class_field = 0,
      arrayType = -1,
      // the current class being defined or being referenced.
  parse_context = CONTEXT_UNKNOWN,
      comment = 0,
      fromHex = false,
      decimal = false,
      exponent = false,
      exponent_sign = false,
      exponent_digit = false,
      inQueue = {
    first: null,
    last: null,
    saved: null,

    push(node) {
      var recover = this.saved;

      if (recover) {
        this.saved = recover.next;
        recover.node = node;
        recover.next = null;
        recover.prior = this.last;
      } else {
        recover = {
          node: node,
          next: null,
          prior: this.last
        };
      }

      if (!this.last) this.first = recover;else this.last.next = recover;
      this.last = recover;
    },

    shift() {
      var result = this.first;
      if (!result) return null;
      if (!(this.first = result.next)) this.last = null;
      result.next = this.saved;
      this.saved = result;
      return result.node;
    },

    unshift(node) {
      var recover = this.saved; // this is always true in this usage.
      //if( recover ) { 

      this.saved = recover.next;
      recover.node = node;
      recover.next = this.first;
      recover.prior = null; //}
      //else { recover = { node : node, next : this.first, prior : null }; }

      if (!this.first) this.last = recover;
      this.first = recover;
    }

  },
      gatheringStringFirstChar = null,
      gatheringString = false,
      gatheringNumber = false,
      stringEscape = false,
      cr_escaped = false,
      unicodeWide = false,
      stringUnicode = false,
      stringHex = false,
      hex_char = 0,
      hex_char_len = 0,
      completed = false,
      date_format = false,
      isBigInt = false;

  function throwEndError(leader) {
    throw new Error(`${leader} at ${n} [${pos.line}:${pos.col}]`);
  }

  return {
    fromJSOX(prototypeName, o, f) {
      if (localFromProtoTypes.get(prototypeName)) throw new Error("Existing fromJSOX has been registered for prototype");

      function privateProto() {}

      if (!o) o = privateProto;

      if (o && !("constructor" in o)) {
        throw new Error("Please pass a prototype like thing...");
      }

      localFromProtoTypes.set(prototypeName, {
        protoCon: o.prototype.constructor,
        cb: f
      });
    },

    registerFromJSOX(prototypeName, o
    /*, f*/
    ) {
      throw new Error("registerFromJSOX is deprecated, please update to use fromJSOX instead:" + prototypeName + o.toString());
    },

    finalError() {
      if (comment !== 0) {
        // most of the time everything's good.
        if (comment === 1) throwEndError("Comment began at end of document");
        if (comment === 3) throwEndError("Open comment '/*' is missing close at end of document");
        if (comment === 4) throwEndError("Incomplete '/* *' close at end of document");
      }

      if (gatheringString) throwEndError("Incomplete string");
    },

    value() {
      this.finalError();
      var r = result;
      result = undefined;
      return r;
    },

    reset() {
      word = WORD_POS_RESET;
      status = true;
      if (inQueue.last) inQueue.last.next = inQueue.save;
      inQueue.save = inQueue.first;
      inQueue.first = inQueue.last = null;
      if (context_stack.last) context_stack.last.next = context_stack.save;
      context_stack.length = 0;
      context_stack.save = inQueue.first;
      context_stack.first = context_stack.last = null; //= [];

      elements = undefined;
      parse_context = CONTEXT_UNKNOWN;
      classes = [];
      protoTypes = {};
      current_proto = null;
      current_class = null;
      current_class_field = 0;
      val.value_type = VALUE_UNSET;
      val.name = null;
      val.string = '';
      val.className = null;
      pos.line = 1;
      pos.col = 1;
      negative = false;
      comment = 0;
      completed = false;
      gatheringString = false;
      stringEscape = false; // string stringEscape intro

      cr_escaped = false; // carraige return escaped

      date_format = false; //stringUnicode = false;  // reading \u
      //unicodeWide = false;  // reading \u{} in string
      //stringHex = false;  // reading \x in string
    },

    usePrototype(className, protoType) {
      protoTypes[className] = protoType;
    },

    write(msg) {
      var retcode;
      if (typeof msg !== "string" && typeof msg !== "undefined") msg = String(msg);
      if (!status) throw new Error("Parser is still in an error state, please reset before resuming");

      for (retcode = this._write(msg, false); retcode > 0; retcode = this._write()) {
        if (typeof reviver === 'function') (function walk(holder, key) {
          var k,
              v,
              value = holder[key];

          if (value && typeof value === 'object') {
            for (k in value) {
              if (Object.prototype.hasOwnProperty.call(value, k)) {
                v = walk(value, k);

                if (v !== undefined) {
                  value[k] = v;
                } else {
                  delete value[k];
                }
              }
            }
          }

          return reviver.call(holder, key, value);
        })({
          '': result
        }, '');
        result = cb(result);
        if (retcode < 2) break;
      }
    },

    _write(msg, complete_at_end) {
      var cInt;
      var input;
      var buf;
      var retval = 0;

      function throwError(leader, c) {
        throw new Error(`${leader} '${String.fromCodePoint(c)}' unexpected at ${n} (near '${buf.substr(n > 4 ? n - 4 : 0, n > 4 ? 3 : n - 1)}[${String.fromCodePoint(c)}]${buf.substr(n, 10)}') [${pos.line}:${pos.col}]`);
      }

      function RESET_VAL() {
        val.value_type = VALUE_UNSET;
        val.string = '';
        val.contains = null; //val.className = null;
      }

      function convertValue() {
        var fp = null; //_DEBUG_PARSING && console.log( "CONVERT VAL:", val );

        switch (val.value_type) {
          case VALUE_NUMBER:
            //1502678337047

            /*
            if( ( ( val.string.length > 13 ) || ( val.string.length == 13 && val[0]>'2' ) )
                && !date_format && !exponent_digit && !exponent_sign && !decimal ) {
            	isBigInt = true;
            }
            */
            if (isBigInt) {
              if (hasBigInt) return BigInt(val.string);else throw new Error("no builtin BigInt()", 0);
            }

            if (date_format) {
              const r = new Date(val.string);
              if (isNaN(r.getTime())) throwError("Bad number format", cInt);
              return r;
            }

            return (negative ? -1 : 1) * Number(val.string);

          case VALUE_STRING:
            if (val.className) {
              fp = localFromProtoTypes.get(val.className);
              if (!fp) fp = fromProtoTypes.get(val.className);

              if (fp && fp.cb) {
                val.className = null;
                return fp.cb.call(val.string);
              } else {
                // '[object Object]' throws this error.
                throw new Error("Double string error, no constructor for: new " + val.className + "(" + val.string + ")");
              }
            }

            return val.string;

          case VALUE_TRUE:
            return true;

          case VALUE_FALSE:
            return false;

          case VALUE_NEG_NAN:
            return -NaN;

          case VALUE_NAN:
            return NaN;

          case VALUE_NEG_INFINITY:
            return -Infinity;

          case VALUE_INFINITY:
            return Infinity;

          case VALUE_NULL:
            return null;

          case VALUE_UNDEFINED:
            return undefined;

          case VALUE_EMPTY:
            return undefined;

          case VALUE_OBJECT:
            if (val.className) {
              //_DEBUG_PARSING_DETAILS && console.log( "class reviver" );
              fp = localFromProtoTypes.get(val.className);
              if (!fp) fp = fromProtoTypes.get(val.className);
              val.className = null;
              if (fp && fp.cb) return val.contains = fp.cb.call(val.contains);
            }

            return val.contains;

          case VALUE_ARRAY:
            //_DEBUG_PARSING_DETAILS && console.log( "Array conversion:", arrayType, val.contains );
            if (arrayType >= 0) {
              let ab;
              if (val.contains.length) ab = DecodeBase64(val.contains[0]);else ab = DecodeBase64(val.string);
              if (arrayType === 0) return ab;else return new knownArrayTypes[arrayType](ab);
            } else if (arrayType === -2) {
              var obj = rootObject; //let ctx = context_stack.first;

              let lvl; //console.log( "Resolving Reference...", context_stack.length );
              //console.log( "--elements and array", elements );

              const pathlen = val.contains.length;

              for (lvl = 0; lvl < pathlen; lvl++) {
                const idx = val.contains[lvl]; //_DEBUG_REFERENCES && console.log( "Looking up idx:", idx, "of", val.contains, "in", obj );

                let nextObj = obj[idx]; //_DEBUG_REFERENCES  && console.log( "Resolve path:", lvl, idx,"in", obj, context_stack.length, val.contains.toString() );
                //_DEBUG_REFERENCES && console.log( "NEXT OBJECT:", nextObj );

                if (!nextObj) {
                  {
                    let ctx = context_stack.first;
                    let p = 0; //_DEBUG_PARSING_CONTEXT && context_stack.dump();

                    while (ctx && p < pathlen && p < context_stack.length) {
                      const thisKey = val.contains[p];

                      if (thisKey in obj) {
                        //console.log( "don't need to be in the context stack anymore------------------------------")
                        break;
                      } //_DEBUG_REFERENCES && console.log( "Checking context:", obj, "p=",p, "key=",thisKey, "ctx=",util.inspect(ctx), "ctxNext=",ctx.next);
                      //console.dir(ctx, { depth: null })


                      if (ctx.next) {
                        if ("number" === typeof thisKey) {
                          const asdf = ctx.next.node.elements;
                          const actualObject = ctx.next.node.elements; //_DEBUG_REFERENCES && console.log( "Number in index... tracing stack...", obj, actualObject, ctx && ctx.next && ctx.next.next && ctx.next.next.node );

                          if (asdf && thisKey >= asdf.length) {
                            //_DEBUG_REFERENCES && console.log( "AT ", p, actualObject.length, val.contains.length );
                            if (p === actualObject.length - 1) {
                              ////_DEBUG_REFERENCES && 
                              console.log("This is actually at the current object so use that");
                              nextObj = elements;
                              break;
                            } else {
                              if (ctx.next.next && thisKey === asdf.length) {
                                //_DEBUG_REFERENCES && console.log( "is next... ")
                                nextObj = ctx.next.next.node.elements;
                                ctx = ctx.next;
                                p++;
                                obj = nextObj;
                                continue;
                              } //_DEBUG_REFERENCES && console.log( "FAILING HERE", ctx.next, ctx.next.next, elements );


                              nextObj = elements;
                              p++; // make sure to exit.

                              break; //obj = next
                            }
                          }
                        } else {
                          //_DEBUG_REFERENCES && console.log( "field AT index", p,"of", val.contains.length );
                          if (thisKey !== ctx.next.node.name) {
                            //_DEBUG_REFERENCES && console.log( "Expect:", thisKey, ctx.next.node.name, ctx.next.node.elements );
                            nextObj = ctx.next.node.elements[thisKey]; //throw new Error( "Unexpected path-context relationship" );													

                            lvl = p;
                            break;
                          } else {
                            //_DEBUG_REFERENCES && console.log( "Updating next object(NEW) to", ctx.next.node, elements, thisKey)
                            if (ctx.next.node.valueType === VALUE_ARRAY) {
                              //_DEBUG_REFERENCES && console.log( "Using the array element of that")
                              nextObj = ctx.next.node.elements_array;
                            } else {
                              nextObj = ctx.next.node.elements[thisKey]; //_DEBUG_REFERENCES && console.log( "using named element from", ctx.next.node.elements, "=", nextObj )
                            }
                          }
                        } //if( //_DEBUG_REFERENCES )  {
                        //	const a = ctx.next.node.elements;
                        //	console.log( "Stack Dump:"
                        //		, a?a.length:a
                        //		, ctx.next.node.name
                        //		, thisKey
                        //		);
                        //}

                      } else {
                        nextObj = nextObj[thisKey];
                      } //_DEBUG_REFERENCES && console.log( "Doing next context??", p, context_stack.length, val.contains.length );


                      ctx = ctx.next;
                      p++;
                    } //_DEBUG_REFERENCES && console.log( "Done with context stack...level", lvl, "p", p );


                    if (p < pathlen) lvl = p - 1;else lvl = p;
                  } //_DEBUG_REFERENCES && console.log( "End of processing level:", lvl );
                }

                if (!nextObj) {
                  throw new Error("Path did not resolve properly:" + val.contains + " at " + idx + '(' + lvl + ')');
                }

                obj = nextObj;
              } //_DEBUG_PARSING && console.log( "Resulting resolved object:", obj );
              //_DEBUG_PARSING_DETAILS && console.log( "SETTING MODE TO -3 (resolved -2)" );


              arrayType = -3;
              return obj;
            }

            if (val.className) {
              fp = localFromProtoTypes.get(val.className);
              if (!fp) fp = fromProtoTypes.get(val.className);
              val.className = null;
              if (fp && fp.cb) return fp.cb.call(val.contains);
            }

            return val.contains;

          default:
            console.log("Unhandled value conversion.", val);
            break;
        }
      }

      function arrayPush() {
        //_DEBUG_PARSING && console.log( "PUSH TO ARRAY:", val );
        if (arrayType == -3) {
          //_DEBUG_PARSING && console.log(" Array type -3?", val.value_type, elements );
          if (val.value_type === VALUE_OBJECT) {
            elements.push(val.contains);
          }

          arrayType = -1; // next one should be allowed?

          return;
        } //else
        //	console.log( "Finally a push that's not already pushed!", );


        switch (val.value_type) {
          case VALUE_EMPTY:
            elements.push(undefined);
            delete elements[elements.length - 1];
            break;

          default:
            elements.push(convertValue());
            break;
        }

        RESET_VAL();
      }

      function objectPush() {
        if (arrayType === -3 && val.value_type === VALUE_ARRAY) {
          //console.log( "Array has already been set in object." );
          //elements[val.name] = val.contains;
          RESET_VAL();
          arrayType = -1;
          return;
        }

        if (val.value_type === VALUE_EMPTY) return;

        if (!val.name && current_class) {
          //_DEBUG_PARSING_DETAILS && console.log( "A Stepping current class field:", current_class_field, val.name );
          val.name = current_class.fields[current_class_field++];
        }

        let value = convertValue();

        if (current_proto && current_proto.protoDef && current_proto.protoDef.cb) {
          //_DEBUG_PARSING_DETAILS && console.log( "SOMETHING SHOULD AHVE BEEN REPLACED HERE??", current_proto );
          //_DEBUG_PARSING_DETAILS && console.log( "(need to do fromprototoypes here) object:", val, value );
          value = current_proto.protoDef.cb.call(elements, val.name, value);
          if (value) elements[val.name] = value; //elements = new current_proto.protoCon( elements );
        } else {
          //_DEBUG_PARSING_DETAILS && console.log( "Default no special class reviver", val.name, value );
          elements[val.name] = value;
        } //_DEBUG_PARSING_DETAILS && console.log( "Updated value:", current_class_field, val.name, elements[val.name] );
        //_DEBUG_PARSING && console.log( "+++ Added object field:", val.name, elements, elements[val.name], rootObject );


        RESET_VAL();
      }

      function recoverIdent(cInt) {
        //_DEBUG_PARSING&&console.log( "Recover Ident char:", cInt, val, String.fromCodePoint(cInt), "word:", word );
        if (word !== WORD_POS_RESET) {
          if (negative) {
            //val.string += "-"; negative = false; 
            throwError("Negative outside of quotes, being converted to a string (would lose count of leading '-' characters)", cInt);
          }

          switch (word) {
            case WORD_POS_END:
              switch (val.value_type) {
                case VALUE_TRUE:
                  val.string += "true";
                  break;

                case VALUE_FALSE:
                  val.string += "false";
                  break;

                case VALUE_NULL:
                  val.string += "null";
                  break;

                case VALUE_INFINITY:
                  val.string += "Infinity";
                  break;

                case VALUE_NEG_INFINITY:
                  val.string += "-Infinity";
                  throwError("Negative outside of quotes, being converted to a string", cInt);
                  break;

                case VALUE_NAN:
                  val.string += "NaN";
                  break;

                case VALUE_NEG_NAN:
                  val.string += "-NaN";
                  throwError("Negative outside of quotes, being converted to a string", cInt);
                  break;

                case VALUE_UNDEFINED:
                  val.string += "undefined";
                  break;

                case VALUE_STRING:
                  break;

                case VALUE_UNSET:
                  break;

                default:
                  console.log("Value of type " + val.value_type + " is not restored...");
              }

              break;

            case WORD_POS_TRUE_1:
              val.string += "t";
              break;

            case WORD_POS_TRUE_2:
              val.string += "tr";
              break;

            case WORD_POS_TRUE_3:
              val.string += "tru";
              break;

            case WORD_POS_FALSE_1:
              val.string += "f";
              break;

            case WORD_POS_FALSE_2:
              val.string += "fa";
              break;

            case WORD_POS_FALSE_3:
              val.string += "fal";
              break;

            case WORD_POS_FALSE_4:
              val.string += "fals";
              break;

            case WORD_POS_NULL_1:
              val.string += "n";
              break;

            case WORD_POS_NULL_2:
              val.string += "nu";
              break;

            case WORD_POS_NULL_3:
              val.string += "nul";
              break;

            case WORD_POS_UNDEFINED_1:
              val.string += "u";
              break;

            case WORD_POS_UNDEFINED_2:
              val.string += "un";
              break;

            case WORD_POS_UNDEFINED_3:
              val.string += "und";
              break;

            case WORD_POS_UNDEFINED_4:
              val.string += "unde";
              break;

            case WORD_POS_UNDEFINED_5:
              val.string += "undef";
              break;

            case WORD_POS_UNDEFINED_6:
              val.string += "undefi";
              break;

            case WORD_POS_UNDEFINED_7:
              val.string += "undefin";
              break;

            case WORD_POS_UNDEFINED_8:
              val.string += "undefine";
              break;

            case WORD_POS_NAN_1:
              val.string += "M";
              break;

            case WORD_POS_NAN_2:
              val.string += "Na";
              break;

            case WORD_POS_INFINITY_1:
              val.string += "I";
              break;

            case WORD_POS_INFINITY_2:
              val.string += "In";
              break;

            case WORD_POS_INFINITY_3:
              val.string += "Inf";
              break;

            case WORD_POS_INFINITY_4:
              val.string += "Infi";
              break;

            case WORD_POS_INFINITY_5:
              val.string += "Infin";
              break;

            case WORD_POS_INFINITY_6:
              val.string += "Infini";
              break;

            case WORD_POS_INFINITY_7:
              val.string += "Infinit";
              break;

            case WORD_POS_RESET:
              break;

            case WORD_POS_FIELD:
              break;

            case WORD_POS_AFTER_FIELD:
              //throwError( "String-keyword recovery fail (after whitespace)", cInt);
              break;

            case WORD_POS_AFTER_FIELD_VALUE:
              throwError("String-keyword recovery fail (after whitespace)", cInt);
              break;
            //console.log( "Word context: " + word + " unhandled" );
          }

          val.value_type = VALUE_STRING;
          if (word < WORD_POS_FIELD) word = WORD_POS_END;
        } else {
          word = WORD_POS_END; //if( val.value_type === VALUE_UNSET && val.string.length )

          val.value_type = VALUE_STRING;
        }

        if (cInt == 123
        /*'{'*/
        ) openObject();else if (cInt == 91
        /*'['*/
        ) openArray();else if (cInt == 44
        /*','*/
        ) ;else {
          // ignore white space.
          if (cInt == 32
          /*' '*/
          || cInt == 13 || cInt == 10 || cInt == 9 || cInt == 0xFEFF || cInt == 0x2028 || cInt == 0x2029) {
            //_DEBUG_WHITESPACE && console.log( "IGNORE WHITESPACE" );
            return;
          }

          if (cInt == 44
          /*','*/
          || cInt == 125
          /*'}'*/
          || cInt == 93
          /*']'*/
          || cInt == 58
          /*':'*/
          ) throwError("Invalid character near identifier", cInt);else //if( typeof cInt === "number")
            val.string += str;
        } //console.log( "VAL STRING IS:", val.string, str );
      }

      function gatherString(start_c) {
        let retval = 0;

        while (retval == 0 && n < buf.length) {
          str = buf.charAt(n);
          let cInt = buf.codePointAt(n++);

          if (cInt >= 0x10000) {
            str += buf.charAt(n);
            n++;
          } //console.log( "gathering....", stringEscape, str, cInt, unicodeWide, stringHex, stringUnicode, hex_char_len );


          pos.col++;

          if (cInt == start_c) {
            //( cInt == 34/*'"'*/ ) || ( cInt == 39/*'\''*/ ) || ( cInt == 96/*'`'*/ ) )
            if (stringEscape) {
              if (stringHex) throwError("Incomplete hexidecimal sequence", cInt);else if (stringUnicode) throwError("Incomplete long unicode sequence", cInt);else if (unicodeWide) throwError("Incomplete unicode sequence", cInt);

              if (cr_escaped) {
                cr_escaped = false;
                retval = 1; // complete string, escaped \r
              } else val.string += str;

              stringEscape = false;
            } else {
              // quote matches, and is not processing an escape sequence.
              retval = 1;
            }
          } else if (stringEscape) {
            if (unicodeWide) {
              if (cInt == 125
              /*'}'*/
              ) {
                  val.string += String.fromCodePoint(hex_char);
                  unicodeWide = false;
                  stringUnicode = false;
                  stringEscape = false;
                  continue;
                }

              hex_char *= 16;
              if (cInt >= 48
              /*'0'*/
              && cInt <= 57
              /*'9'*/
              ) hex_char += cInt - 0x30;else if (cInt >= 65
              /*'A'*/
              && cInt <= 70
              /*'F'*/
              ) hex_char += cInt - 65 + 10;else if (cInt >= 97
              /*'a'*/
              && cInt <= 102
              /*'f'*/
              ) hex_char += cInt - 97 + 10;else {
                throwError("(escaped character, parsing hex of \\u)", cInt);
                retval = -1;
                unicodeWide = false;
                stringEscape = false;
                continue;
              }
              continue;
            } else if (stringHex || stringUnicode) {
              if (hex_char_len === 0 && cInt === 123
              /*'{'*/
              ) {
                  unicodeWide = true;
                  continue;
                }

              if (hex_char_len < 2 || stringUnicode && hex_char_len < 4) {
                hex_char *= 16;
                if (cInt >= 48
                /*'0'*/
                && cInt <= 57
                /*'9'*/
                ) hex_char += cInt - 0x30;else if (cInt >= 65
                /*'A'*/
                && cInt <= 70
                /*'F'*/
                ) hex_char += cInt - 65 + 10;else if (cInt >= 97
                /*'a'*/
                && cInt <= 102
                /*'f'*/
                ) hex_char += cInt - 97 + 10;else {
                  throwError(stringUnicode ? "(escaped character, parsing hex of \\u)" : "(escaped character, parsing hex of \\x)", cInt);
                  retval = -1;
                  stringHex = false;
                  stringEscape = false;
                  continue;
                }
                hex_char_len++;

                if (stringUnicode) {
                  if (hex_char_len == 4) {
                    val.string += String.fromCodePoint(hex_char);
                    stringUnicode = false;
                    stringEscape = false;
                  }
                } else if (hex_char_len == 2) {
                  val.string += String.fromCodePoint(hex_char);
                  stringHex = false;
                  stringEscape = false;
                }

                continue;
              }
            }

            switch (cInt) {
              case 13
              /*'\r'*/
              :
                cr_escaped = true;
                pos.col = 1;
                continue;

              case 0x2028: // LS (Line separator)

              case 0x2029:
                // PS (paragraph separate)
                pos.col = 1;
              // falls through

              case 10
              /*'\n'*/
              :
                if (!cr_escaped) {
                  // \\ \n
                  pos.col = 1;
                } else {
                  // \\ \r \n
                  cr_escaped = false;
                }

                pos.line++;
                break;

              case 116
              /*'t'*/
              :
                val.string += '\t';
                break;

              case 98
              /*'b'*/
              :
                val.string += '\b';
                break;

              case 110
              /*'n'*/
              :
                val.string += '\n';
                break;

              case 114
              /*'r'*/
              :
                val.string += '\r';
                break;

              case 102
              /*'f'*/
              :
                val.string += '\f';
                break;

              case 48
              /*'0'*/
              :
                val.string += '\0';
                break;

              case 120
              /*'x'*/
              :
                stringHex = true;
                hex_char_len = 0;
                hex_char = 0;
                continue;

              case 117
              /*'u'*/
              :
                stringUnicode = true;
                hex_char_len = 0;
                hex_char = 0;
                continue;
              //case 47/*'/'*/:
              //case 92/*'\\'*/:
              //case 34/*'"'*/:
              //case 39/*"'"*/:
              //case 96/*'`'*/:

              default:
                val.string += str;
                break;
            } //console.log( "other..." );


            stringEscape = false;
          } else if (cInt === 92
          /*'\\'*/
          ) {
              if (stringEscape) {
                val.string += '\\';
                stringEscape = false;
              } else {
                stringEscape = true;
                hex_char = 0;
                hex_char_len = 0;
              }
            } else {
            /* any other character */
            if (cr_escaped) {
              // \\ \r <any char>
              cr_escaped = false;
              pos.line++;
              pos.col = 2; // this character is pos 1; and increment to be after it.
            }

            val.string += str;
          }
        }

        return retval;
      }

      function collectNumber() {
        let _n;

        while ((_n = n) < buf.length) {
          str = buf.charAt(_n);
          let cInt = buf.codePointAt(n++);

          if (cInt >= 256) {
            n = _n; // put character back in queue to process.

            break;
          } else {
            //_DEBUG_PARSING_NUMBERS  && console.log( "in getting number:", n, cInt, String.fromCodePoint(cInt) );
            if (cInt == 95
            /*_*/
            ) continue;
            pos.col++; // leading zeros should be forbidden.

            if (cInt >= 48
            /*'0'*/
            && cInt <= 57
            /*'9'*/
            ) {
                if (exponent) {
                  exponent_digit = true;
                }

                val.string += str;
              } else if (cInt == 45
            /*'-'*/
            || cInt == 43
            /*'+'*/
            ) {
                if (val.string.length == 0 || exponent && !exponent_sign && !exponent_digit) {
                  if (cInt == 45
                  /*'-'*/
                  && !exponent) negative = !negative;
                  val.string += str;
                  exponent_sign = true;
                } else {
                  val.string += str;
                  date_format = true;
                }
              } else if (cInt == 78
            /*'N'*/
            ) {
                if (word == WORD_POS_RESET) {
                  gatheringNumber = false;
                  word = WORD_POS_NAN_1;
                  return;
                }

                throwError("fault while parsing number;", cInt);
                break;
              } else if (cInt == 73
            /*'I'*/
            ) {
                if (word == WORD_POS_RESET) {
                  gatheringNumber = false;
                  word = WORD_POS_INFINITY_1;
                  return;
                }

                throwError("fault while parsing number;", cInt);
                break;
              } else if (cInt == 58
            /*':'*/
            && date_format) {
              val.string += str;
              date_format = true;
            } else if (cInt == 84
            /*'T'*/
            && date_format) {
              val.string += str;
              date_format = true;
            } else if (cInt == 90
            /*'Z'*/
            && date_format) {
              val.string += str;
              date_format = true;
            } else if (cInt == 46
            /*'.'*/
            ) {
                if (!decimal && !fromHex && !exponent) {
                  val.string += str;
                  decimal = true;
                } else {
                  status = false;
                  throwError("fault while parsing number;", cInt);
                  break;
                }
              } else if (cInt == 110
            /*'n'*/
            ) {
                isBigInt = true;
                break;
              } else if (cInt == 120
            /*'x'*/
            || cInt == 98
            /*'b'*/
            || cInt == 111
            /*'o'*/
            || cInt == 88
            /*'X'*/
            || cInt == 66
            /*'B'*/
            || cInt == 79
            /*'O'*/
            ) {
                // hex conversion.
                if (!fromHex && val.string == '0') {
                  fromHex = true;
                  val.string += str;
                } else {
                  status = false;
                  throwError("fault while parsing number;", cInt);
                  break;
                }
              } else if (cInt == 101
            /*'e'*/
            || cInt == 69
            /*'E'*/
            ) {
              if (!exponent) {
                val.string += str;
                exponent = true;
              } else {
                status = false;
                throwError("fault while parsing number;", cInt);
                break;
              }
            } else {
              if (cInt == 32
              /*' '*/
              || cInt == 13 || cInt == 10 || cInt == 9 || cInt == 47
              /*'/'*/
              || cInt == 35
              /*'#'*/
              || cInt == 44
              /*','*/
              || cInt == 125
              /*'}'*/
              || cInt == 93
              /*']'*/
              || cInt == 123
              /*'{'*/
              || cInt == 91
              /*'['*/
              || cInt == 34
              /*'"'*/
              || cInt == 39
              /*'''*/
              || cInt == 96
              /*'`'*/
              || cInt == 58
              /*':'*/
              ) {
                  n = _n; // put character back in queue to process.

                  break;
                } else {
                if (complete_at_end) {
                  status = false;
                  throwError("fault while parsing number;", cInt);
                }

                break;
              }
            }
          }
        }

        if (!complete_at_end && n == buf.length) {
          gatheringNumber = true;
        } else {
          gatheringNumber = false;
          val.value_type = VALUE_NUMBER;

          if (parse_context == CONTEXT_UNKNOWN) {
            completed = true;
          }
        }
      }

      function openObject() {
        let nextMode = CONTEXT_OBJECT_FIELD;
        let cls = null;
        let tmpobj = {}; //_DEBUG_PARSING && console.log( "opening object:", val.string, val.value_type, word, parse_context );

        if (word > WORD_POS_RESET && word < WORD_POS_FIELD) recoverIdent(123
        /* '{' */
        );
        let protoDef;
        protoDef = getProto(); // lookup classname using val.string and get protodef(if any)

        if (parse_context == CONTEXT_UNKNOWN) {
          if (word == WORD_POS_FIELD
          /*|| word == WORD_POS_AFTER_FIELD*/
          || word == WORD_POS_END && (protoDef || val.string.length)) {
            if (protoDef && protoDef.protoDef && protoDef.protoDef.protoCon) {
              tmpobj = new protoDef.protoDef.protoCon();
            }

            if (!protoDef || !protoDef.protoDef && val.string) // class creation is redundant...
              {
                cls = classes.find(cls => cls.name === val.string);
                console.log("Probably creating the Macro-Tag here?", cls);

                if (!cls) {
                  /* eslint-disable no-inner-declarations */
                  function privateProto() {} // this just uses the tmpobj {} container to store the values collected for this class...
                  // this does not generate the instance of the class.
                  // if this tag type is also a prototype, use that prototype, else create a unique proto
                  // for this tagged class type.


                  classes.push(cls = {
                    name: val.string,
                    protoCon: protoDef && protoDef.protoDef && protoDef.protoDef.protoCon || privateProto.constructor,
                    fields: []
                  });
                  nextMode = CONTEXT_CLASS_FIELD;
                } else if (redefineClass) {
                  //_DEBUG_PARSING && console.log( "redefine class..." );
                  // redefine this class
                  cls.fields.length = 0;
                  nextMode = CONTEXT_CLASS_FIELD;
                } else {
                  //_DEBUG_PARSING && console.log( "found existing class, using it....");
                  tmpobj = new cls.protoCon(); //tmpobj = Object.assign( tmpobj, cls.protoObject );
                  //Object.setPrototypeOf( tmpobj, Object.getPrototypeOf( cls.protoObject ) );

                  nextMode = CONTEXT_CLASS_VALUE;
                }

                redefineClass = false;
              }

            current_class = cls;
            word = WORD_POS_RESET;
          } else {
            word = WORD_POS_FIELD;
          }
        } else if (word == WORD_POS_FIELD
        /*|| word == WORD_POS_AFTER_FIELD*/
        || parse_context === CONTEXT_IN_ARRAY || parse_context === CONTEXT_OBJECT_FIELD_VALUE || parse_context == CONTEXT_CLASS_VALUE) {
          if (word != WORD_POS_RESET || val.value_type == VALUE_STRING) {
            if (protoDef && protoDef.protoDef) {
              // need to collect the object,
              tmpobj = new protoDef.protoDef.protoCon();
            } else {
              // look for a class type (shorthand) to recover.
              cls = classes.find(cls => cls.name === val.string);

              if (!cls) {
                /* eslint-disable no-inner-declarations */
                function privateProto() {} //sconsole.log( "privateProto has no proto?", privateProto.prototype.constructor.name );


                localFromProtoTypes.set(val.string, {
                  protoCon: privateProto.prototype.constructor,
                  cb: null
                });
                tmpobj = new privateProto();
              } else {
                nextMode = CONTEXT_CLASS_VALUE;
                tmpobj = {};
              }
            } //nextMode = CONTEXT_CLASS_VALUE;


            word = WORD_POS_RESET;
          } else {
            word = WORD_POS_RESET;
          }
        } else if (parse_context == CONTEXT_OBJECT_FIELD && word == WORD_POS_RESET) {
          throwError("fault while parsing; getting field name unexpected ", cInt);
          status = false;
          return false;
        } // common code to push into next context


        let old_context = getContext(); //_DEBUG_PARSING && console.log( "Begin a new object; previously pushed into elements; but wait until trailing comma or close previously ", val.value_type, val.className );

        val.value_type = VALUE_OBJECT;

        if (parse_context === CONTEXT_UNKNOWN) {
          elements = tmpobj;
        } else if (parse_context == CONTEXT_IN_ARRAY) ;else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE || parse_context == CONTEXT_CLASS_VALUE) {
          if (!val.name && current_class) {
            val.name = current_class.fields[current_class_field++]; //_DEBUG_PARSING_DETAILS && console.log( "B Stepping current class field:", val, current_class_field, val.name );
          } //_DEBUG_PARSING_DETAILS && console.log( "Setting element:", val.name, tmpobj );


          elements[val.name] = tmpobj;
        }

        old_context.context = parse_context;
        old_context.elements = elements; //old_context.element_array = element_array;

        old_context.name = val.name; //_DEBUG_PARSING_DETAILS && console.log( "pushing val.name:", val.name, arrayType );

        old_context.current_proto = current_proto;
        old_context.current_class = current_class;
        old_context.current_class_field = current_class_field;
        old_context.valueType = val.value_type;
        old_context.arrayType = arrayType; // pop that we don't want to have this value re-pushed.

        old_context.className = val.className; //arrayType = -3; // this doesn't matter, it's an object state, and a new array will reset to -1

        val.className = null;
        val.name = null;
        current_proto = protoDef;
        current_class = cls; //console.log( "Setting current class:", current_class.name );

        current_class_field = 0;
        elements = tmpobj;
        if (!rootObject) rootObject = elements; //_DEBUG_PARSING_STACK && console.log( "push context (open object): ", context_stack.length, " new mode:", nextMode );

        context_stack.push(old_context); //_DEBUG_PARSING_DETAILS && console.log( "RESET OBJECT FIELD", old_context, context_stack );

        RESET_VAL();
        parse_context = nextMode;
        return true;
      }

      function openArray() {
        //_DEBUG_PARSING_DETAILS && console.log( "openArray()..." );
        if (word > WORD_POS_RESET && word < WORD_POS_FIELD) recoverIdent(91);

        if (word == WORD_POS_END && val.string.length) {
          //_DEBUG_PARSING && console.log( "recover arrayType:", arrayType, val.string );
          var typeIndex = knownArrayTypeNames.findIndex(type => type === val.string);

          if (typeIndex >= 0) {
            word = WORD_POS_RESET;
            arrayType = typeIndex;
            val.className = val.string;
            val.string = null;
          } else {
            if (val.string === "ref") {
              val.className = null; //_DEBUG_PARSING_DETAILS && console.log( "This will be a reference recovery for key:", val );

              arrayType = -2;
            } else {
              if (localFromProtoTypes.get(val.string)) {
                val.className = val.string;
              } else if (fromProtoTypes.get(val.string)) {
                val.className = val.string;
              } else throwError(`Unknown type '${val.string}' specified for array`, cInt); //_DEBUG_PARSING_DETAILS && console.log( " !!!!!A Set Classname:", val.className );

            }
          }
        } else if (parse_context == CONTEXT_OBJECT_FIELD || word == WORD_POS_FIELD || word == WORD_POS_AFTER_FIELD) {
          throwError("Fault while parsing; while getting field name unexpected", cInt);
          status = false;
          return false;
        }

        {
          let old_context = getContext(); //_DEBUG_PARSING && console.log( "Begin a new array; previously pushed into elements; but wait until trailing comma or close previously ", val.value_type );
          //_DEBUG_PARSING_DETAILS && console.log( "Opening array:", val, parse_context );

          val.value_type = VALUE_ARRAY;
          let tmparr = [];
          if (parse_context == CONTEXT_UNKNOWN) elements = tmparr;else if (parse_context == CONTEXT_IN_ARRAY) {
            if (arrayType == -1) {
              //console.log( "Pushing new opening array into existing array already RE-SET" );
              elements.push(tmparr);
            } //else if( //_DEBUG_PARSING && arrayType !== -3 )
            //	console.log( "This is an invalid parsing state, typed array with sub-array elements" );

          } else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
            if (!val.name) {
              console.log("This says it's resolved.......");
              arrayType = -3;
            }

            if (current_proto && current_proto.protoDef) {
              //_DEBUG_PARSING_DETAILS && console.log( "SOMETHING SHOULD HAVE BEEN REPLACED HERE??", current_proto );
              //_DEBUG_PARSING_DETAILS && console.log( "(need to do fromprototoypes here) object:", val, value );
              if (current_proto.protoDef.cb) {
                const newarr = current_proto.protoDef.cb.call(elements, val.name, tmparr);
                if (newarr !== undefined) tmparr = elements[val.name] = newarr;else if (val.value_type !== 13) console.log("Warning: Received undefined for an array; keeping original array, not setting field");
              } else elements[val.name] = tmparr;
            } else elements[val.name] = tmparr;
          }
          old_context.context = parse_context;
          old_context.elements = elements; //old_context.element_array = element_array;

          old_context.name = val.name;
          old_context.current_proto = current_proto;
          old_context.current_class = current_class;
          old_context.current_class_field = current_class_field; // already pushed?

          old_context.valueType = val.value_type;
          old_context.arrayType = arrayType == -1 ? -3 : arrayType; // pop that we don't want to have this value re-pushed.

          old_context.className = val.className;
          arrayType = -1;
          val.className = null; //_DEBUG_PARSING_DETAILS && console.log( " !!!!!B Clear Classname:", old_context, val.className, old_context.className, old_context.name );

          val.name = null;
          current_proto = null;
          current_class = null;
          current_class_field = 0; //element_array = tmparr;

          elements = tmparr;
          if (!rootObject) rootObject = tmparr; //_DEBUG_PARSING_STACK && console.log( "push context (open array): ", context_stack.length );

          context_stack.push(old_context); //_DEBUG_PARSING_DETAILS && console.log( "RESET ARRAY FIELD", old_context, context_stack );

          RESET_VAL();
          parse_context = CONTEXT_IN_ARRAY;
        }
        return true;
      }

      function getProto() {
        const result = {
          protoDef: null,
          cls: null
        };

        if (result.protoDef = localFromProtoTypes.get(val.string)) {
          if (!val.className) {
            val.className = val.string;
            val.string = null;
          } // need to collect the object, 

        } else if (result.protoDef = fromProtoTypes.get(val.string)) {
          if (!val.className) {
            val.className = val.string;
            val.string = null;
          }
        }

        if (val.string) {
          result.cls = classes.find(cls => cls.name === val.string);
        }

        return result.protoDef || result.cls ? result : null;
      }

      if (!status) return -1;

      if (msg && msg.length) {
        input = getBuffer();
        input.buf = msg;
        inQueue.push(input);
      } else {
        if (gatheringNumber) {
          //console.log( "Force completed.")
          gatheringNumber = false;
          val.value_type = VALUE_NUMBER;

          if (parse_context == CONTEXT_UNKNOWN) {
            completed = true;
          }

          retval = 1; // if returning buffers, then obviously there's more in this one.
        }

        if (parse_context !== CONTEXT_UNKNOWN) throwError("Unclosed object at end of stream.", cInt);
      }

      while (status && (input = inQueue.shift())) {
        n = input.n;
        buf = input.buf;

        if (gatheringString) {
          let string_status = gatherString(gatheringStringFirstChar);
          if (string_status < 0) status = false;else if (string_status > 0) {
            gatheringString = false;
            if (status) val.value_type = VALUE_STRING;
          }
        }

        if (gatheringNumber) {
          collectNumber();
        }

        while (!completed && status && n < buf.length) {
          str = buf.charAt(n);
          cInt = buf.codePointAt(n++);

          if (cInt >= 0x10000) {
            str += buf.charAt(n);
            n++;
          } //_DEBUG_PARSING && console.log( "parsing at ", cInt, str );
          //_DEBUG_LL && console.log( "processing: ", cInt, n, str, pos, comment, parse_context, word );


          pos.col++;

          if (comment) {
            if (comment == 1) {
              if (cInt == 42
              /*'*'*/
              ) comment = 3;else if (cInt != 47
              /*'/'*/
              ) return throwError("fault while parsing;", cInt);else comment = 2;
            } else if (comment == 2) {
              if (cInt == 10
              /*'\n'*/
              || cInt == 13
              /*'\r'*/
              ) comment = 0;
            } else if (comment == 3) {
              if (cInt == 42
              /*'*'*/
              ) comment = 4;
            } else {
              if (cInt == 47
              /*'/'*/
              ) comment = 0;else comment = 3;
            }

            continue;
          }

          switch (cInt) {
            case 47
            /*'/'*/
            :
              comment = 1;
              break;

            case 123
            /*'{'*/
            :
              openObject();
              break;

            case 91
            /*'['*/
            :
              openArray();
              break;

            case 58
            /*':'*/
            :
              //_DEBUG_PARSING && console.log( "colon received...")
              if (parse_context == CONTEXT_CLASS_VALUE) {
                word = WORD_POS_RESET;
                val.name = val.string;
                val.string = '';
                val.value_type = VALUE_UNSET;
              } else if (parse_context == CONTEXT_OBJECT_FIELD || parse_context == CONTEXT_CLASS_FIELD) {
                if (parse_context == CONTEXT_CLASS_FIELD) {
                  if (!Object.keys(elements).length) {
                    console.log("This is a full object, not a class def...", val.className);

                    const privateProto = () => {};

                    localFromProtoTypes.set(context_stack.last.node.current_class.name, {
                      protoCon: privateProto.prototype.constructor,
                      cb: null
                    });
                    elements = new privateProto();
                    parse_context = CONTEXT_OBJECT_FIELD_VALUE;
                    val.name = val.string;
                    word = WORD_POS_RESET;
                    val.string = '';
                    val.value_type = VALUE_UNSET;
                    console.log("don't do default;s do a revive...");
                  }
                } else {
                  if (word != WORD_POS_RESET && word != WORD_POS_END && word != WORD_POS_FIELD && word != WORD_POS_AFTER_FIELD) {
                    recoverIdent(32); // allow starting a new word
                    //status = false;
                    //throwError( `fault while parsing; unquoted keyword used as object field name (state:${word})`, cInt );
                    //break;
                  }

                  word = WORD_POS_RESET;
                  val.name = val.string;
                  val.string = '';
                  parse_context = parse_context === CONTEXT_OBJECT_FIELD ? CONTEXT_OBJECT_FIELD_VALUE : CONTEXT_CLASS_FIELD_VALUE;
                  val.value_type = VALUE_UNSET;
                }
              } else if (parse_context == CONTEXT_UNKNOWN) {
                console.log("Override colon found, allow class redefinition", parse_context);
                redefineClass = true;
                break;
              } else {
                if (parse_context == CONTEXT_IN_ARRAY) throwError("(in array, got colon out of string):parsing fault;", cInt);else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
                  throwError("String unexpected", cInt);
                } else throwError("(outside any object, got colon out of string):parsing fault;", cInt);
                status = false;
              }

              break;

            case 125
            /*'}'*/
            :
              //_DEBUG_PARSING && console.log( "close bracket context:", word, parse_context, val.value_type, val.string );
              if (word == WORD_POS_END) {
                // allow starting a new word
                word = WORD_POS_RESET;
              } // coming back after pushing an array or sub-object will reset the contxt to FIELD, so an end with a field should still push value.


              if (parse_context == CONTEXT_CLASS_FIELD) {
                if (current_class) {
                  // allow blank comma at end to not be a field
                  if (val.string) {
                    current_class.fields.push(val.string);
                  }

                  RESET_VAL();
                  let old_context = context_stack.pop(); //_DEBUG_PARSING_DETAILS && console.log( "close object:", old_context, context_stack );
                  //_DEBUG_PARSING_STACK && console.log( "object pop stack (close obj)", context_stack.length, old_context );

                  parse_context = CONTEXT_UNKNOWN; // this will restore as IN_ARRAY or OBJECT_FIELD

                  word = WORD_POS_RESET;
                  val.name = old_context.name;
                  elements = old_context.elements; //element_array = old_context.element_array;

                  current_class = old_context.current_class;
                  current_class_field = old_context.current_class_field; //_DEBUG_PARSING_DETAILS && console.log( "A Pop old class field counter:", current_class_field, val.name );

                  arrayType = old_context.arrayType;
                  val.value_type = old_context.valueType;
                  val.className = old_context.className; //_DEBUG_PARSING_DETAILS && console.log( " !!!!!C Pop Classname:", val.className );

                  rootObject = null;
                  dropContext(old_context);
                } else {
                  throwError("State error; gathering class fields, and lost the class", cInt);
                }
              } else if (parse_context == CONTEXT_OBJECT_FIELD || parse_context == CONTEXT_CLASS_VALUE) {
                if (val.value_type != VALUE_UNSET) {
                  if (current_class) {
                    //_DEBUG_PARSING_DETAILS && console.log( "C Stepping current class field:", current_class_field, val.name, arrayType );
                    val.name = current_class.fields[current_class_field++];
                  } //_DEBUG_PARSING && console.log( "Closing object; set value name, and push...", current_class_field, val );


                  objectPush();
                } //_DEBUG_PARSING && console.log( "close object; empty object", val, elements );


                val.value_type = VALUE_OBJECT;

                if (current_proto && current_proto.protoDef && current_proto.protoDef.cb) {
                  console.log("SOMETHING SHOULD AHVE BEEN REPLACED HERE??", current_proto);
                  console.log("The other version only revives on init");
                  elements = new current_proto.protoDef.cb(elements, undefined, undefined); //elements = new current_proto.protoCon( elements );
                }

                val.contains = elements;
                val.string = "";
                let old_context = context_stack.pop(); //_DEBUG_PARSING_STACK && console.log( "object pop stack (close obj)", context_stack.length, old_context );

                parse_context = old_context.context; // this will restore as IN_ARRAY or OBJECT_FIELD

                val.name = old_context.name;
                elements = old_context.elements; //element_array = old_context.element_array;

                current_class = old_context.current_class;
                current_proto = old_context.current_proto;
                current_class_field = old_context.current_class_field; //_DEBUG_PARSING_DETAILS && console.log( "B Pop old class field counter:", context_stack, current_class_field, val.name );

                arrayType = old_context.arrayType;
                val.value_type = old_context.valueType;
                val.className = old_context.className; //_DEBUG_PARSING_DETAILS && console.log( " !!!!!D Pop Classname:", val.className );

                dropContext(old_context);

                if (parse_context == CONTEXT_UNKNOWN) {
                  completed = true;
                }
              } else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
                // first, add the last value
                //_DEBUG_PARSING && console.log( "close object; push item '%s' %d", val.name, val.value_type );
                if (val.value_type === VALUE_UNSET) {
                  throwError("Fault while parsing; unexpected", cInt);
                }

                objectPush();
                val.value_type = VALUE_OBJECT;
                val.contains = elements;
                word = WORD_POS_RESET; //let old_context = context_stack.pop();

                var old_context = context_stack.pop(); //_DEBUG_PARSING_STACK  && console.log( "object pop stack (close object)", context_stack.length, old_context );

                parse_context = old_context.context; // this will restore as IN_ARRAY or OBJECT_FIELD

                val.name = old_context.name;
                elements = old_context.elements;
                current_proto = old_context.current_proto;
                current_class = old_context.current_class;
                current_class_field = old_context.current_class_field; //_DEBUG_PARSING_DETAILS && console.log( "C Pop old class field counter:", context_stack, current_class_field, val.name );

                arrayType = old_context.arrayType;
                val.value_type = old_context.valueType;
                val.className = old_context.className; //_DEBUG_PARSING_DETAILS && console.log( " !!!!!E Pop Classname:", val.className );
                //element_array = old_context.element_array;

                dropContext(old_context);

                if (parse_context == CONTEXT_UNKNOWN) {
                  completed = true;
                }
              } else {
                throwError("Fault while parsing; unexpected", cInt);
                status = false;
              }

              negative = false;
              break;

            case 93
            /*']'*/
            :
              if (word >= WORD_POS_AFTER_FIELD) {
                word = WORD_POS_RESET;
              }

              if (parse_context == CONTEXT_IN_ARRAY) {
                //_DEBUG_PARSING  && console.log( "close array, push last element: %d", val.value_type );
                if (val.value_type != VALUE_UNSET) {
                  if (val.name) console.log("Ya this should blow up");
                  arrayPush();
                }

                val.contains = elements;
                {
                  let old_context = context_stack.pop(); //_DEBUG_PARSING_STACK  && console.log( "object pop stack (close array)", context_stack.length );

                  val.name = old_context.name;
                  val.className = old_context.className;
                  parse_context = old_context.context;
                  elements = old_context.elements; //element_array = old_context.element_array;

                  current_proto = old_context.current_proto;
                  current_class = old_context.current_class;
                  current_class_field = old_context.current_class_field;
                  arrayType = old_context.arrayType;
                  val.value_type = old_context.valueType; //_DEBUG_PARSING_DETAILS && console.log( "close array:", old_context );
                  //_DEBUG_PARSING_DETAILS && console.log( "D Pop old class field counter:", context_stack, current_class_field, val );

                  dropContext(old_context);
                }
                val.value_type = VALUE_ARRAY;

                if (parse_context == CONTEXT_UNKNOWN) {
                  completed = true;
                }
              } else {
                throwError(`bad context ${parse_context}; fault while parsing`, cInt); // fault

                status = false;
              }

              negative = false;
              break;

            case 44
            /*','*/
            :
              if (word < WORD_POS_AFTER_FIELD && word != WORD_POS_RESET) {
                recoverIdent(cInt);
              }

              if (word == WORD_POS_END || word == WORD_POS_FIELD) word = WORD_POS_RESET; // allow collect new keyword
              //if(//_DEBUG_PARSING) 
              //_DEBUG_PARSING_DETAILS && console.log( "comma context:", parse_context, val );

              if (parse_context == CONTEXT_CLASS_FIELD) {
                if (current_class) {
                  console.log("Saving field name(set word to IS A FIELD):", val.string);
                  current_class.fields.push(val.string);
                  val.string = '';
                  word = WORD_POS_FIELD;
                } else {
                  throwError("State error; gathering class fields, and lost the class", cInt);
                }
              } else if (parse_context == CONTEXT_OBJECT_FIELD) {
                if (current_class) {
                  //_DEBUG_PARSING_DETAILS && console.log( "D Stepping current class field:", current_class_field, val.name );
                  val.name = current_class.fields[current_class_field++]; //_DEBUG_PARSING && console.log( "should have a completed value at a comma.:", current_class_field, val );

                  if (val.value_type != VALUE_UNSET) {
                    //_DEBUG_PARSING  && console.log( "pushing object field:", val );
                    objectPush();
                    RESET_VAL();
                  }
                } else {
                  // this is an empty comma...
                  if (val.string || val.value_type) throwError("State error; comma in field name and/or lost the class", cInt);
                }
              } else if (parse_context == CONTEXT_CLASS_VALUE) {
                if (current_class) {
                  //_DEBUG_PARSING_DETAILS && console.log( "reviving values in class...", arrayType, current_class.fields[current_class_field ], val );
                  if (arrayType != -3 && !val.name) {
                    // this should have still had a name....
                    //_DEBUG_PARSING_DETAILS && console.log( "E Stepping current class field:", current_class_field, val, arrayType );
                    val.name = current_class.fields[current_class_field++]; //else val.name = current_class.fields[current_class_field++];
                  } //_DEBUG_PARSING && console.log( "should have a completed value at a comma.:", current_class_field, val );


                  if (val.value_type != VALUE_UNSET) {
                    if (arrayType != -3) objectPush();
                    RESET_VAL();
                  }
                } else {
                  if (val.value_type != VALUE_UNSET) {
                    objectPush();
                    RESET_VAL();
                  } //throwError( "State error; gathering class values, and lost the class", cInt );

                }

                val.name = null;
              } else if (parse_context == CONTEXT_IN_ARRAY) {
                if (val.value_type == VALUE_UNSET) val.value_type = VALUE_EMPTY; // in an array, elements after a comma should init as undefined...
                //_DEBUG_PARSING  && console.log( "back in array; push item %d", val.value_type );

                arrayPush();
                RESET_VAL();
                word = WORD_POS_RESET; // undefined allows [,,,] to be 4 values and [1,2,3,] to be 4 values with an undefined at end.
              } else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE && val.value_type != VALUE_UNSET) {
                // after an array value, it will have returned to OBJECT_FIELD anyway
                //_DEBUG_PARSING  && console.log( "comma after field value, push field to object: %s", val.name, val.value_type );
                parse_context = CONTEXT_OBJECT_FIELD;

                if (val.value_type != VALUE_UNSET) {
                  objectPush();
                  RESET_VAL();
                }

                word = WORD_POS_RESET;
              } else {
                status = false;
                throwError("bad context; excessive commas while parsing;", cInt); // fault
              }

              negative = false;
              break;

            default:
              switch (cInt) {
                default:
                  if (parse_context == CONTEXT_UNKNOWN || parse_context == CONTEXT_OBJECT_FIELD_VALUE && word == WORD_POS_FIELD || parse_context == CONTEXT_OBJECT_FIELD || word == WORD_POS_FIELD || parse_context == CONTEXT_CLASS_FIELD) {
                    switch (cInt) {
                      case 96: //'`':

                      case 34: //'"':

                      case 39:
                        //'\'':
                        if (word == WORD_POS_RESET || word == WORD_POS_FIELD) {
                          if (val.string.length) {
                            console.log("IN ARRAY AND FIXING?");
                            val.className = val.string;
                            val.string = '';
                          }

                          let string_status = gatherString(cInt); //_DEBUG_PARSING && console.log( "string gather for object field name :", val.string, string_status );

                          if (string_status) {
                            val.value_type = VALUE_STRING;
                          } else {
                            gatheringStringFirstChar = cInt;
                            gatheringString = true;
                          }
                        } else {
                          throwError("fault while parsing; quote not at start of field name", cInt);
                        }

                        break;

                      case 10:
                        //'\n':
                        pos.line++;
                        pos.col = 1;
                      // fall through to normal space handling - just updated line/col position

                      case 13: //'\r':

                      case 32: //' ':

                      case 0x2028: //' ':

                      case 0x2029: //' ':

                      case 9: //'\t':

                      case 0xFEFF:
                        // ZWNBS is WS though
                        //_DEBUG_WHITESPACE  && console.log( "THIS SPACE", word, parse_context, val );
                        if (parse_context === CONTEXT_UNKNOWN && word === WORD_POS_END) {
                          // allow collect new keyword
                          word = WORD_POS_RESET;

                          if (parse_context === CONTEXT_UNKNOWN) {
                            completed = true;
                          }

                          break;
                        }

                        if (word === WORD_POS_RESET || word === WORD_POS_AFTER_FIELD) {
                          // ignore leading and trailing whitepsace
                          if (parse_context == CONTEXT_UNKNOWN && val.value_type) {
                            completed = true;
                          }

                          break;
                        } else if (word === WORD_POS_FIELD) {
                          if (parse_context === CONTEXT_UNKNOWN) {
                            word = WORD_POS_RESET;
                            completed = true;
                            break;
                          }

                          if (val.string.length) console.log("STEP TO NEXT TOKEN.");
                          word = WORD_POS_AFTER_FIELD; //val.className = val.string; val.string = '';
                        } else {
                          status = false;
                          throwError("fault while parsing; whitepsace unexpected", cInt);
                        } // skip whitespace


                        break;

                      default:
                        //console.log( "TICK" );
                        if (word == WORD_POS_RESET && (cInt >= 48
                        /*'0'*/
                        && cInt <= 57
                        /*'9'*/
                        || cInt == 43
                        /*'+'*/
                        || cInt == 46
                        /*'.'*/
                        || cInt == 45
                        /*'-'*/
                        )) {
                          fromHex = false;
                          exponent = false;
                          date_format = false;
                          isBigInt = false;
                          exponent_sign = false;
                          exponent_digit = false;
                          decimal = false;
                          val.string = str;
                          input.n = n;
                          collectNumber();
                          break;
                        }

                        if (word === WORD_POS_AFTER_FIELD) {
                          status = false;
                          throwError("fault while parsing; character unexpected", cInt);
                        }

                        if (word === WORD_POS_RESET) {
                          word = WORD_POS_FIELD;
                          val.value_type = VALUE_STRING;
                          val.string += str; //_DEBUG_PARSING  && console.log( "START/CONTINUE IDENTIFER" );

                          break;
                        }

                        if (val.value_type == VALUE_UNSET) {
                          if (word !== WORD_POS_RESET && word !== WORD_POS_END) recoverIdent(cInt);
                        } else {
                          if (word === WORD_POS_END || word === WORD_POS_FIELD) {
                            // final word of the line... 
                            // whispace changes the 'word' state to not 'end'
                            // until the next character, which may restore it to
                            // 'end' and this will resume collecting the same string.
                            val.string += str;
                            break;
                          }

                          if (parse_context == CONTEXT_OBJECT_FIELD) {
                            if (word == WORD_POS_FIELD) {
                              val.string += str;
                              break;
                            }

                            throwError("Multiple values found in field name", cInt);
                          }

                          if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
                            throwError("String unexpected", cInt);
                          }
                        }

                        break;
                      // default
                    }
                  } else {
                    if (word == WORD_POS_RESET && (cInt >= 48
                    /*'0'*/
                    && cInt <= 57
                    /*'9'*/
                    || cInt == 43
                    /*'+'*/
                    || cInt == 46
                    /*'.'*/
                    || cInt == 45
                    /*'-'*/
                    )) {
                      fromHex = false;
                      exponent = false;
                      date_format = false;
                      isBigInt = false;
                      exponent_sign = false;
                      exponent_digit = false;
                      decimal = false;
                      val.string = str;
                      input.n = n;
                      collectNumber();
                    } else {
                      //console.log( "TICK")
                      if (val.value_type == VALUE_UNSET) {
                        if (word != WORD_POS_RESET) {
                          recoverIdent(cInt);
                        } else {
                          word = WORD_POS_END;
                          val.string += str;
                          val.value_type = VALUE_STRING;
                        }
                      } else {
                        if (parse_context == CONTEXT_OBJECT_FIELD) {
                          throwError("Multiple values found in field name", cInt);
                        } else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
                          if (val.value_type != VALUE_STRING) {
                            if (val.value_type == VALUE_OBJECT || val.value_type == VALUE_ARRAY) {
                              throwError("String unexpected", cInt);
                            }

                            recoverIdent(cInt);
                          }

                          if (word == WORD_POS_AFTER_FIELD) {
                            const protoDef = getProto();

                            if (protoDef) {
                              val.string = str;
                            } else throwError("String unexpected", cInt);
                          } else {
                            if (word == WORD_POS_END) {
                              val.string += str;
                            } else throwError("String unexpected", cInt);
                          }
                        } else if (parse_context == CONTEXT_IN_ARRAY) {
                          if (word == WORD_POS_AFTER_FIELD) {
                            if (!val.className) {
                              //	getProto()
                              val.className = val.string;
                              val.string = '';
                            }

                            val.string += str;
                            break;
                          } else {
                            if (word == WORD_POS_END) val.string += str;
                          }
                        }
                      } //recoverIdent(cInt);

                    }

                    break; // default
                  }

                  break;

                case 96: //'`':

                case 34: //'"':

                case 39:
                  //'\'':
                  {
                    let string_status = gatherString(cInt); //_DEBUG_PARSING && console.log( "string gather for object field value :", val.string, string_status, completed, input.n, buf.length );

                    if (string_status) {
                      val.value_type = VALUE_STRING;
                      word = WORD_POS_END;
                    } else {
                      gatheringStringFirstChar = cInt;
                      gatheringString = true;
                    }

                    break;
                  }

                case 10:
                  //'\n':
                  pos.line++;
                  pos.col = 1;
                //falls through

                case 32: //' ':

                case 9: //'\t':

                case 13: //'\r':

                case 0x2028: // LS (Line separator)

                case 0x2029: // PS (paragraph separate)

                case 0xFEFF:
                  //'\uFEFF':
                  //_DEBUG_WHITESPACE && console.log( "Whitespace...", word, parse_context );
                  if (word == WORD_POS_END) {
                    if (parse_context == CONTEXT_UNKNOWN) {
                      word = WORD_POS_RESET;
                      completed = true;
                      break;
                    } else if (parse_context == CONTEXT_OBJECT_FIELD_VALUE) {
                      word = WORD_POS_AFTER_FIELD_VALUE;
                      break;
                    } else if (parse_context == CONTEXT_OBJECT_FIELD) {
                      word = WORD_POS_AFTER_FIELD;
                      break;
                    } else if (parse_context == CONTEXT_IN_ARRAY) {
                      word = WORD_POS_AFTER_FIELD;
                      break;
                    }
                  }

                  if (word == WORD_POS_RESET || word == WORD_POS_AFTER_FIELD) break;else if (word == WORD_POS_FIELD) {
                    if (val.string.length) word = WORD_POS_AFTER_FIELD;
                  } else {
                    if (word < WORD_POS_END) recoverIdent(cInt);
                  }
                  break;
                //----------------------------------------------------------
                //  catch characters for true/false/null/undefined which are values outside of quotes

                case 116:
                  //'t':
                  if (word == WORD_POS_RESET) word = WORD_POS_TRUE_1;else if (word == WORD_POS_INFINITY_6) word = WORD_POS_INFINITY_7;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 114:
                  //'r':
                  if (word == WORD_POS_TRUE_1) word = WORD_POS_TRUE_2;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 117:
                  //'u':
                  if (word == WORD_POS_TRUE_2) word = WORD_POS_TRUE_3;else if (word == WORD_POS_NULL_1) word = WORD_POS_NULL_2;else if (word == WORD_POS_RESET) word = WORD_POS_UNDEFINED_1;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 101:
                  //'e':
                  if (word == WORD_POS_TRUE_3) {
                    val.value_type = VALUE_TRUE;
                    word = WORD_POS_END;
                  } else if (word == WORD_POS_FALSE_4) {
                    val.value_type = VALUE_FALSE;
                    word = WORD_POS_END;
                  } else if (word == WORD_POS_UNDEFINED_3) word = WORD_POS_UNDEFINED_4;else if (word == WORD_POS_UNDEFINED_7) word = WORD_POS_UNDEFINED_8;else {
                    recoverIdent(cInt);
                  } // fault


                  break;

                case 110:
                  //'n':
                  if (word == WORD_POS_RESET) word = WORD_POS_NULL_1;else if (word == WORD_POS_UNDEFINED_1) word = WORD_POS_UNDEFINED_2;else if (word == WORD_POS_UNDEFINED_6) word = WORD_POS_UNDEFINED_7;else if (word == WORD_POS_INFINITY_1) word = WORD_POS_INFINITY_2;else if (word == WORD_POS_INFINITY_4) word = WORD_POS_INFINITY_5;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 100:
                  //'d':
                  if (word == WORD_POS_UNDEFINED_2) word = WORD_POS_UNDEFINED_3;else if (word == WORD_POS_UNDEFINED_8) {
                    val.value_type = VALUE_UNDEFINED;
                    word = WORD_POS_END;
                  } else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 105:
                  //'i':
                  if (word == WORD_POS_UNDEFINED_5) word = WORD_POS_UNDEFINED_6;else if (word == WORD_POS_INFINITY_3) word = WORD_POS_INFINITY_4;else if (word == WORD_POS_INFINITY_5) word = WORD_POS_INFINITY_6;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 108:
                  //'l':
                  if (word == WORD_POS_NULL_2) word = WORD_POS_NULL_3;else if (word == WORD_POS_NULL_3) {
                    val.value_type = VALUE_NULL;
                    word = WORD_POS_END;
                  } else if (word == WORD_POS_FALSE_2) word = WORD_POS_FALSE_3;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 102:
                  //'f':
                  if (word == WORD_POS_RESET) word = WORD_POS_FALSE_1;else if (word == WORD_POS_UNDEFINED_4) word = WORD_POS_UNDEFINED_5;else if (word == WORD_POS_INFINITY_2) word = WORD_POS_INFINITY_3;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 97:
                  //'a':
                  if (word == WORD_POS_FALSE_1) word = WORD_POS_FALSE_2;else if (word == WORD_POS_NAN_1) word = WORD_POS_NAN_2;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 115:
                  //'s':
                  if (word == WORD_POS_FALSE_3) word = WORD_POS_FALSE_4;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 73:
                  //'I':
                  if (word == WORD_POS_RESET) word = WORD_POS_INFINITY_1;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 78:
                  //'N':
                  if (word == WORD_POS_RESET) word = WORD_POS_NAN_1;else if (word == WORD_POS_NAN_2) {
                    val.value_type = negative ? VALUE_NEG_NAN : VALUE_NAN;
                    negative = false;
                    word = WORD_POS_END;
                  } else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 121:
                  //'y':
                  if (word == WORD_POS_INFINITY_7) {
                    val.value_type = negative ? VALUE_NEG_INFINITY : VALUE_INFINITY;
                    negative = false;
                    word = WORD_POS_END;
                  } else {
                    recoverIdent(cInt);
                  } // fault


                  break;

                case 45:
                  //'-':
                  if (word == WORD_POS_RESET) negative = !negative;else {
                    recoverIdent(cInt);
                  } // fault

                  break;

                case 43:
                  //'+':
                  if (word !== WORD_POS_RESET) {
                    recoverIdent(cInt);
                  }

                  break;
              }

              break;
            // default of high level switch
            //
            //----------------------------------------------------------
          }

          if (completed) {
            if (word == WORD_POS_END) {
              word = WORD_POS_RESET;
            }

            break;
          }
        }

        if (n == buf.length) {
          dropBuffer(input);

          if (gatheringString || gatheringNumber || parse_context == CONTEXT_OBJECT_FIELD) {
            retval = 0;
          } else {
            if (parse_context == CONTEXT_UNKNOWN && (val.value_type != VALUE_UNSET || result)) {
              completed = true;
              retval = 1;
            }
          }
        } else {
          // put these back into the stack.
          input.n = n;
          inQueue.unshift(input);
          retval = 2; // if returning buffers, then obviously there's more in this one.
        }

        if (completed) {
          rootObject = null;
          break;
        }
      }

      if (!status) return -1;

      if (completed && val.value_type != VALUE_UNSET) {
        word = WORD_POS_RESET;
        result = convertValue(); //_DEBUG_PARSING && console.log( "Result(3):", result );

        negative = false;
        val.string = '';
        val.value_type = VALUE_UNSET;
      }

      completed = false;
      return retval;
    }

  };
};

const _parser = [Object.freeze(JSOX$1.begin())];
var _parse_level = 0;

JSOX$1.parse = function (msg, reviver) {
  var parse_level = _parse_level++;
  var parser;
  if (_parser.length <= parse_level) _parser.push(Object.freeze(JSOX$1.begin()));
  parser = _parser[parse_level];
  if (typeof msg !== "string") msg = String(msg);
  parser.reset();

  const writeResult = parser._write(msg, true);

  if (writeResult > 0) {
    var result = parser.value();

    if ("undefined" === typeof result && writeResult > 1) {
      throw new Error("Pending value could not complete");
    }

    result = typeof reviver === 'function' ? function walk(holder, key) {
      var k,
          v,
          value = holder[key];

      if (value && typeof value === 'object') {
        for (k in value) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            v = walk(value, k);

            if (v !== undefined) {
              value[k] = v;
            } else {
              delete value[k];
            }
          }
        }
      }

      return reviver.call(holder, key, value);
    }({
      '': result
    }, '') : result;
    _parse_level--;
    return result;
  }

  parser.finalError();
  return undefined;
};
/* init prototypes */


{
  toProtoTypes.set(Object.prototype, {
    external: false,
    name: Object.prototype.constructor.name,
    cb: null
  }); // function https://stackoverflow.com/a/17415677/4619267

  toProtoTypes.set(Date.prototype, {
    external: false,
    name: "Date",
    cb: function () {
      var tzo = -this.getTimezoneOffset(),
          dif = tzo >= 0 ? '+' : '-',
          pad = function (num) {
        var norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
      },
          pad3 = function (num) {
        var norm = Math.floor(Math.abs(num));
        return (norm < 100 ? '0' : '') + (norm < 10 ? '0' : '') + norm;
      };

      return [this.getFullYear(), '-', pad(this.getMonth() + 1), '-', pad(this.getDate()), 'T', pad(this.getHours()), ':', pad(this.getMinutes()), ':', pad(this.getSeconds()), '.' + pad3(this.getMilliseconds()) + dif, pad(tzo / 60), ':', pad(tzo % 60)].join("");
    }
  });
  toProtoTypes.set(Boolean.prototype, {
    external: false,
    name: "Boolean",
    cb: this_value
  });
  toProtoTypes.set(Number.prototype, {
    external: false,
    name: "Number",
    cb: function () {
      if (isNaN(this)) return "NaN";
      return isFinite(this) ? String(this) : this < 0 ? "-Infinity" : "Infinity";
    }
  });
  toProtoTypes.set(String.prototype, {
    external: false,
    name: "String",
    cb: function () {
      return '"' + JSOX$1.escape(this_value.apply(this)) + '"';
    }
  });
  if (typeof BigInt === "function") toProtoTypes.set(BigInt.prototype, {
    external: false,
    name: "BigInt",
    cb: function () {
      return this + 'n';
    }
  });
  toProtoTypes.set(ArrayBuffer.prototype, {
    external: true,
    name: "ab",
    cb: function () {
      return "[" + base64ArrayBuffer(this) + "]";
    }
  });
  toProtoTypes.set(Uint8Array.prototype, {
    external: true,
    name: "u8",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Uint8ClampedArray.prototype, {
    external: true,
    name: "uc8",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Int8Array.prototype, {
    external: true,
    name: "s8",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Uint16Array.prototype, {
    external: true,
    name: "u16",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Int16Array.prototype, {
    external: true,
    name: "s16",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Uint32Array.prototype, {
    external: true,
    name: "u32",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Int32Array.prototype, {
    external: true,
    name: "s32",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  /*
  if( typeof Uint64Array != "undefined" )
  	toProtoTypes.set( Uint64Array.prototype, { external:true, name:"u64"
  	    , cb:function() { return "["+base64ArrayBuffer(this.buffer)+"]" }
  	} );
  if( typeof Int64Array != "undefined" )
  	toProtoTypes.set( Int64Array.prototype, { external:true, name:"s64"
  	    , cb:function() { return "["+base64ArrayBuffer(this.buffer)+"]" }
  	} );
  */

  toProtoTypes.set(Float32Array.prototype, {
    external: true,
    name: "f32",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Float64Array.prototype, {
    external: true,
    name: "f64",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Float64Array.prototype, {
    external: true,
    name: "f64",
    cb: function () {
      return "[" + base64ArrayBuffer(this.buffer) + "]";
    }
  });
  toProtoTypes.set(Map.prototype, mapToJSOX = {
    external: true,
    name: "map",
    cb: null
  });
  fromProtoTypes.set("map", {
    protoCon: Map,
    cb: function (field, val) {
      if (field) {
        this.set(field, val);
        return undefined;
      }

      return this;
    }
  });
  toProtoTypes.set(Array.prototype, arrayToJSOX = {
    external: false,
    name: Array.prototype.constructor.name,
    cb: null
  });
}

function this_value() {
  /*//_DEBUG_STRINGIFY&&console.log( "this:", this, "valueof:", this&&this.valueOf() );*/
  return this && this.valueOf();
}

JSOX$1.defineClass = function (name, obj) {
  var cls;
  var denormKeys = Object.keys(obj);

  for (var i = 1; i < denormKeys.length; i++) {
    var a, b;

    if ((a = denormKeys[i - 1]) > (b = denormKeys[i])) {
      denormKeys[i - 1] = b;
      denormKeys[i] = a;
      if (i) i -= 2; // go back 2, this might need to go further pack.
      else i--; // only 1 to check.
    }
  } //console.log( "normalized:", denormKeys );


  commonClasses.push(cls = {
    name: name,
    tag: denormKeys.toString(),
    proto: Object.getPrototypeOf(obj),
    fields: Object.keys(obj)
  });

  for (var n = 1; n < cls.fields.length; n++) {
    if (cls.fields[n] < cls.fields[n - 1]) {
      let tmp = cls.fields[n - 1];
      cls.fields[n - 1] = cls.fields[n];
      cls.fields[n] = tmp;
      if (n > 1) n -= 2;
    }
  }

  if (cls.proto === Object.getPrototypeOf({})) cls.proto = null;
};

JSOX$1.toJSOX = JSOX$1.registerToJSOX = function (name, ptype, f) {
  //console.log( "SET OBJECT TYPE:", ptype, ptype.prototype, Object.prototype, ptype.constructor );
  if (!ptype.prototype || ptype.prototype !== Object.prototype) {
    if (toProtoTypes.get(ptype.prototype)) throw new Error("Existing toJSOX has been registered for prototype"); //_DEBUG_PARSING && console.log( "PUSH PROTOTYPE" );

    toProtoTypes.set(ptype.prototype, {
      external: true,
      name: name || f.constructor.name,
      cb: f
    });
  } else {
    var key = Object.keys(ptype).toString();
    if (toObjectTypes.get(key)) throw new Error("Existing toJSOX has been registered for object type"); //console.log( "TEST SET OBJECT TYPE:", key );

    toObjectTypes.set(key, {
      external: true,
      name: name,
      cb: f
    });
  }
};

JSOX$1.fromJSOX = function (prototypeName, o, f) {
  function privateProto() {}

  if (!o) o = privateProto.prototype;
  if (fromProtoTypes.get(prototypeName)) throw new Error("Existing fromJSOX has been registered for prototype");

  if (o && !("constructor" in o)) {
    throw new Error("Please pass a prototype like thing...");
  }

  fromProtoTypes.set(prototypeName, {
    protoCon: o.prototype.constructor,
    cb: f
  });
};

JSOX$1.registerFromJSOX = function (prototypeName, o
/*, f*/
) {
  throw new Error("deprecated; please adjust code to use fromJSOX:" + prototypeName + o.toString());
  /*
  if( fromProtoTypes.get(prototypeName) ) throw new Error( "Existing fromJSOX has been registered for prototype" );
  if( "function" === typeof o ) {
  	console.trace( "Please update usage of registration... proto and function")
  	f = o
  	o = Object.getPrototypeOf( {} );
  } 
  if( !f ) {
  	console.trace( "(missing f) Please update usage of registration... proto and function")
  }
  fromProtoTypes.set( prototypeName, {protoCon:o, cb:f } );
  */
};

JSOX$1.addType = function (prototypeName, prototype, to, from) {
  JSOX$1.toJSOX(prototypeName, prototype, to);
  JSOX$1.fromJSOX(prototypeName, prototype, from);
};

JSOX$1.registerToFrom = function (prototypeName, prototype
/*, to, from*/
) {
  throw new Error("registerToFrom deprecated; please use addType:" + prototypeName + prototype.toString());
};

JSOX$1.stringifier = function () {
  var classes = [];
  var useQuote = '"';
  let fieldMap = new WeakMap();
  const path = [];
  var encoding = [];
  const localToProtoTypes = new WeakMap();
  const localToObjectTypes = new Map();
  let objectToJSOX = null;
  const stringifying = []; // things that have been stringified through external toJSOX; allows second pass to skip this toJSOX pass and encode 'normally'

  let ignoreNonEnumerable = false;
  const stringifier = {
    defineClass(name, obj) {
      var cls;
      var denormKeys = Object.keys(obj);

      for (var i = 1; i < denormKeys.length; i++) {
        // normalize class key order
        var a, b;

        if ((a = denormKeys[i - 1]) > (b = denormKeys[i])) {
          denormKeys[i - 1] = b;
          denormKeys[i] = a;
          if (i) i -= 2; // go back 2, this might need to go further pack.
          else i--; // only 1 to check.
        }
      }

      classes.push(cls = {
        name: name,
        tag: denormKeys.toString(),
        proto: Object.getPrototypeOf(obj),
        fields: Object.keys(obj)
      });

      for (var n = 1; n < cls.fields.length; n++) {
        if (cls.fields[n] < cls.fields[n - 1]) {
          let tmp = cls.fields[n - 1];
          cls.fields[n - 1] = cls.fields[n];
          cls.fields[n] = tmp;
          if (n > 1) n -= 2;
        }
      }

      if (cls.proto === Object.getPrototypeOf({})) cls.proto = null;
    },

    setDefaultObjectToJSOX(cb) {
      objectToJSOX = cb;
    },

    isEncoding(o) {
      //console.log( "is object encoding?", encoding.length, o, encoding );
      return !!encoding.find((eo, i) => eo === o && i < encoding.length - 1);
    },

    encodeObject(o) {
      if (objectToJSOX) return objectToJSOX.apply(o, [this]);
      return o;
    },

    stringify(o, r, s) {
      return stringify(o, r, s);
    },

    setQuote(q) {
      useQuote = q;
    },

    registerToJSOX(n, p, f) {
      return this.toJSOX(n, p, f);
    },

    toJSOX(name, ptype, f) {
      if (ptype.prototype && ptype.prototype !== Object.prototype) {
        if (localToProtoTypes.get(ptype.prototype)) throw new Error("Existing toJSOX has been registered for prototype");
        localToProtoTypes.set(ptype.prototype, {
          external: true,
          name: name || f.constructor.name,
          cb: f
        });
      } else {
        var key = Object.keys(ptype).toString();
        if (localToObjectTypes.get(key)) throw new Error("Existing toJSOX has been registered for object type");
        localToObjectTypes.set(key, {
          external: true,
          name: name,
          cb: f
        });
      }
    },

    get ignoreNonEnumerable() {
      return ignoreNonEnumerable;
    },

    set ignoreNonEnumerable(val) {
      ignoreNonEnumerable = val;
    }

  };
  return stringifier;

  function getReference(here) {
    if (here === null) return undefined;
    var field = fieldMap.get(here); //_DEBUG_STRINGIFY && console.log( "path:", _JSON.stringify(path), field );

    if (!field) {
      fieldMap.set(here, _JSON.stringify(path));
      return undefined;
    }

    return field;
  }

  function matchObject(o, useK) {
    var k;
    var cls;
    var prt = Object.getPrototypeOf(o);
    cls = classes.find(cls => {
      if (cls.proto && cls.proto === prt) return true;
    });
    if (cls) return cls;

    if (classes.length || commonClasses.length) {
      if (useK) {
        useK = useK.map(v => {
          if (typeof v === "string") return v;else return undefined;
        });
        k = useK.toString();
      } else {
        var denormKeys = Object.keys(o);

        for (var i = 1; i < denormKeys.length; i++) {
          var a, b;

          if ((a = denormKeys[i - 1]) > (b = denormKeys[i])) {
            denormKeys[i - 1] = b;
            denormKeys[i] = a;
            if (i) i -= 2; // go back 2, this might need to go further pack.
            else i--; // only 1 to check.
          }
        }

        k = denormKeys.toString();
      }

      cls = classes.find(cls => {
        if (cls.tag === k) return true;
      });
      if (!cls) cls = commonClasses.find(cls => {
        if (cls.tag === k) return true;
      });
    }

    return cls;
  }

  function stringify(object, replacer, space) {
    if (object === undefined) return "undefined";
    if (object === null) return;
    var firstRun = true;
    var gap;
    var indent;
    var rep;
    var i;
    const spaceType = typeof space;
    const repType = typeof replacer;
    gap = "";
    indent = ""; // If the space parameter is a number, make an indent string containing that
    // many spaces.

    if (spaceType === "number") {
      for (i = 0; i < space; i += 1) {
        indent += " ";
      } // If the space parameter is a string, it will be used as the indent string.

    } else if (spaceType === "string") {
      indent = space;
    } // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.


    rep = replacer;

    if (replacer && repType !== "function" && (repType !== "object" || typeof replacer.length !== "number")) {
      throw new Error("JSOX.stringify");
    }

    path.length = 0;
    fieldMap = new WeakMap();
    const finalResult = str("", {
      "": object
    });
    commonClasses.length = 0;
    return finalResult;

    function getIdentifier(s) {
      if (!isNaN(s)) {
        return ["'", s.toString(), "'"].join('');
      } //var n = s.length;

      /*
      for( n = 0; n < s.length; n++ ) {
      	let cInt = s.codePointAt(n);
      	if( cInt >= 0x10000 ) { n++; }
      	if( nonIdent[(cInt/(24*16))|0] && nonIdent[(cInt/(24*16))|0][(( cInt % (24*16) )/24)|0] & ( 1 << (cInt%24)) ) 
      		break;
      }
      */
      // should check also for if any non ident in string...


      return s in keywords
      /* [ "true","false","null","NaN","Infinity","undefined"].find( keyword=>keyword===s )*/
      || /([0-9-])/.test(s[0]) || /((\n|\r|\t)|[ {}()<>!+*/.:,-])/.test(s) ? useQuote + JSOX$1.escape(s) + useQuote : s; //return s;
    } // from https://github.com/douglascrockford/JSON-js/blob/master/json2.js#L181


    function str(key, holder) {
      function doArrayToJSOX() {
        var v;
        var partial = [];
        let thisNodeNameIndex = path.length; // The value is an array. Stringify every element. Use null as a placeholder
        // for non-JSOX values.

        for (let i = 0; i < this.length; i += 1) {
          path[thisNodeNameIndex] = i;
          partial[i] = str(i, this) || "null";
        }

        path.length = thisNodeNameIndex; //console.log( "remove encoding item", thisNodeNameIndex, encoding.length);

        encoding.length = thisNodeNameIndex; // Join all of the elements together, separated with commas, and wrap them in
        // brackets.

        v = partial.length === 0 ? "[]" : gap ? ["[\n", gap, partial.join(",\n" + gap), "\n", mind, "]"].join("") : "[" + partial.join(",") + "]";
        return v;
      }

      function mapToObject() {
        //_DEBUG_PARSING_DETAILS && console.log( "---------- NEW MAP -------------" );
        var tmp = {
          tmp: null
        };
        var out = '{';
        var first = true; //console.log( "CONVERT:", map);

        for (var [key, value] of this) {
          //console.log( "er...", key, value )
          tmp.tmp = value;
          var thisNodeNameIndex = path.length;
          path[thisNodeNameIndex] = key;
          out += (first ? "" : ",") + getIdentifier(key) + ':' + str("tmp", tmp);
          path.length = thisNodeNameIndex;
          first = false;
        }

        out += '}'; //console.log( "out is:", out );

        return out;
      }

      if (firstRun) {
        arrayToJSOX.cb = doArrayToJSOX;
        mapToJSOX.cb = mapToObject;
        firstRun = false;
      } // Produce a string from holder[key].


      var i; // The loop counter.

      var k; // The member key.

      var v; // The member value.

      var length;
      var mind = gap;
      var partialClass;
      var partial;
      let thisNodeNameIndex = path.length;
      let value = holder[key];
      let isObject = typeof value === "object";
      let c;

      if (isObject && value !== null) {
        if (objectToJSOX) {
          if (!stringifying.find(val => val === value)) {
            stringifying.push(value);
            encoding[thisNodeNameIndex] = value;
            value = objectToJSOX.apply(value, [stringifier]); //console.log( "Converted by object lookup -it's now a different type"
            //	, protoConverter, objectConverter );

            isObject = typeof value === "object";
            stringifying.pop();
            encoding.length = thisNodeNameIndex;
            isObject = typeof value === "object";
          } //console.log( "Value convereted to:", key, value );

        }
      }

      const objType = value !== undefined && value !== null && Object.getPrototypeOf(value);
      var protoConverter = objType && (localToProtoTypes.get(objType) || toProtoTypes.get(objType) || null);
      var objectConverter = !protoConverter && value !== undefined && value !== null && (localToObjectTypes.get(Object.keys(value).toString()) || toObjectTypes.get(Object.keys(value).toString()) || null); //console.log( "PROTOTYPE:", Object.getPrototypeOf( value ) )
      //console.log( "PROTOTYPE:", toProtoTypes.get(Object.getPrototypeOf( value )) )

      if (protoConverter) //_DEBUG_STRINGIFY && console.log( "TEST()", value, protoConverter, objectConverter );
        var toJSOX = protoConverter && protoConverter.cb || objectConverter && objectConverter.cb; // If the value has a toJSOX method, call it to obtain a replacement value.
      //_DEBUG_STRINGIFY && console.log( "type:", typeof value, protoConverter, !!toJSOX, path );

      if (value !== undefined && value !== null && typeof toJSOX === "function") {
        gap += indent;

        if (typeof value === "object") {
          v = getReference(value); //_DEBUG_STRINGIFY && console.log( "This object is not yet an tracked object path:", v, value  );

          if (v) return "ref" + v;
        }

        let newValue = toJSOX.call(value, stringifier); //_DEBUG_STRINGIFY && console.log( "translated ", newValue, value );

        value = newValue;
        gap = mind;
      } else if (typeof value === "object") {
        v = getReference(value);
        if (v) return "ref" + v;
      } // If we were called with a replacer function, then call the replacer to
      // obtain a replacement value.


      if (typeof rep === "function") {
        value = rep.call(holder, key, value);
      } // What happens next depends on the value's type.


      switch (typeof value) {
        case "bigint":
          return value + 'n';

        case "string":
        case "number":
          {
            let c = '';
            if (key === "") c = classes.map(cls => cls.name + "{" + cls.fields.join(",") + "}").join(gap ? "\n" : "") + commonClasses.map(cls => cls.name + "{" + cls.fields.join(",") + "}").join(gap ? "\n" : "") + (gap ? "\n" : "");
            if (protoConverter && protoConverter.external) return c + protoConverter.name + value;
            if (objectConverter && objectConverter.external) return c + objectConverter.name + value;
            return c + value; //useQuote+JSOX.escape( value )+useQuote;
          }

        case "boolean":
        case "null":
          // If the value is a boolean or null, convert it to a string. Note:
          // typeof null does not produce "null". The case is included here in
          // the remote chance that this gets fixed someday.
          return String(value);
        // If the type is "object", we might be dealing with an object or an array or
        // null.

        case "object":
          //_DEBUG_STRINGIFY && console.log( "ENTERINT OBJECT EMISSION WITH:", v );
          if (v) return "ref" + v; // Due to a specification blunder in ECMAScript, typeof null is "object",
          // so watch out for that case.

          if (!value) {
            return "null";
          } // Make an array to hold the partial results of stringifying this object value.


          gap += indent;
          partialClass = null;
          partial = []; // If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === "object") {
            length = rep.length;
            partialClass = matchObject(value, rep);

            for (i = 0; i < length; i += 1) {
              if (typeof rep[i] === "string") {
                k = rep[i];
                path[thisNodeNameIndex] = k;
                v = str(k, value);

                if (v) {
                  if (partialClass) {
                    partial.push(v);
                  } else partial.push(getIdentifier(k) + (gap ? ": " : ":") + v);
                }
              }
            }

            path.splice(thisNodeNameIndex, 1);
          } else {
            // Otherwise, iterate through all of the keys in the object.
            partialClass = matchObject(value);
            var keys = [];

            for (k in value) {
              if (ignoreNonEnumerable) if (!Object.prototype.propertyIsEnumerable.call(value, k)) {
                //_DEBUG_STRINGIFY && console.log( "skipping non-enuerable?", k );
                continue;
              }

              if (Object.prototype.hasOwnProperty.call(value, k)) {
                var n;

                for (n = 0; n < keys.length; n++) if (keys[n] > k) {
                  keys.splice(n, 0, k);
                  break;
                }

                if (n == keys.length) keys.push(k);
              }
            }

            for (n = 0; n < keys.length; n++) {
              k = keys[n];

              if (Object.prototype.hasOwnProperty.call(value, k)) {
                path[thisNodeNameIndex] = k;
                v = str(k, value);

                if (v) {
                  if (partialClass) {
                    partial.push(v);
                  } else partial.push(getIdentifier(k) + (gap ? ": " : ":") + v);
                }
              }
            }

            path.splice(thisNodeNameIndex, 1);
          } // Join all of the member texts together, separated with commas,
          // and wrap them in braces.
          //_DEBUG_STRINGIFY && console.log( "partial:", partial )
          //let c;


          if (key === "") c = (classes.map(cls => cls.name + "{" + cls.fields.join(",") + "}").join(gap ? "\n" : "") || commonClasses.map(cls => cls.name + "{" + cls.fields.join(",") + "}").join(gap ? "\n" : "")) + (gap ? "\n" : "");else c = '';
          if (protoConverter && protoConverter.external) c = c + getIdentifier(protoConverter.name); //_DEBUG_STRINGIFY && console.log( "PREFIX FOR THIS FIELD:", c );

          var ident = null;
          if (partialClass) ident = getIdentifier(partialClass.name);
          v = c + (partial.length === 0 ? "{}" : gap ? (partialClass ? ident : "") + "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : (partialClass ? ident : "") + "{" + partial.join(",") + "}");
          gap = mind;
          return v;
      }
    }
  }
}; // Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
// use window.btoa' step. According to my tests, this appears to be a faster approach:
// http://jsperf.com/encoding-xhr-image-data/5
// doesn't have to be reversable....


const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_';
const decodings = {
  '~': -1,
  '=': -1,
  '$': 62,
  '_': 63,
  '+': 62,
  '-': 62,
  '.': 62,
  '/': 63,
  ',': 63
};

for (var x = 0; x < 256; x++) {
  if (x < 64) {
    decodings[encodings[x]] = x;
  }
}

Object.freeze(decodings);

function base64ArrayBuffer(arrayBuffer) {
  var base64 = '';
  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;
  var a, b, c, d;
  var chunk; //throw "who's using this?"
  //console.log( "buffer..", arrayBuffer )
  // Main loop deals with bytes in chunks of 3

  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2]; // Use bitmasks to extract 6-bit segments from the triplet

    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18

    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12

    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6

    d = chunk & 63; // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding

    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  } // Deal with the remaining bytes and padding


  if (byteRemainder == 1) {
    chunk = bytes[mainLength];
    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero

    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += encodings[a] + encodings[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = bytes[mainLength] << 8 | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10

    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero

    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += encodings[a] + encodings[b] + encodings[c] + '=';
  } //console.log( "dup?", base64)


  return base64;
}

function DecodeBase64(buf) {
  var outsize;
  if (buf.length % 4 == 1) outsize = ((buf.length + 3) / 4 | 0) * 3 - 3;else if (buf.length % 4 == 2) outsize = ((buf.length + 3) / 4 | 0) * 3 - 2;else if (buf.length % 4 == 3) outsize = ((buf.length + 3) / 4 | 0) * 3 - 1;else if (decodings[buf[buf.length - 3]] == -1) outsize = ((buf.length + 3) / 4 | 0) * 3 - 3;else if (decodings[buf[buf.length - 2]] == -1) outsize = ((buf.length + 3) / 4 | 0) * 3 - 2;else if (decodings[buf[buf.length - 1]] == -1) outsize = ((buf.length + 3) / 4 | 0) * 3 - 1;else outsize = ((buf.length + 3) / 4 | 0) * 3;
  var ab = new ArrayBuffer(outsize);
  var out = new Uint8Array(ab);
  var n;
  var l = buf.length + 3 >> 2;

  for (n = 0; n < l; n++) {
    var index0 = decodings[buf[n * 4]];
    var index1 = n * 4 + 1 < buf.length ? decodings[buf[n * 4 + 1]] : -1;
    var index2 = index1 >= 0 && n * 4 + 2 < buf.length ? decodings[buf[n * 4 + 2]] : -1;
    var index3 = index2 >= 0 && n * 4 + 3 < buf.length ? decodings[buf[n * 4 + 3]] : -1;
    if (index1 >= 0) out[n * 3 + 0] = index0 << 2 | index1 >> 4;
    if (index2 >= 0) out[n * 3 + 1] = index1 << 4 | index2 >> 2 & 0x0f;
    if (index3 >= 0) out[n * 3 + 2] = index2 << 6 | index3 & 0x3F;
  }

  return ab;
}

JSOX$1.stringify = function (object, replacer, space) {
  var stringifier = JSOX$1.stringifier();
  return stringifier.stringify(object, replacer, space);
};

const nonIdent = [[0, 256, [0xffd9ff, 0xff6aff, 0x1fc00, 0x380000, 0x0, 0xfffff8, 0xffffff, 0x7fffff]]].map(row => {
  return {
    firstChar: row[0],
    lastChar: row[1],
    bits: row[2]
  };
});
/*

style classes
    frameContainer - the outer frame
    frameCaption - the top caption of the frame
    frameContent - the container of the frame's future content.
    frameClose - style of the upper close Item.
    captionButton - this is a button appearin in the caption (close)
    

var popup = popups.create( "caption" );
popup.show();
popup.hide();
popup.caption = "New Caption";
popup.divContent  // insert frame content here

*/
//import {JSOX} from "jsox";
//import {JSOX} from "../../jsox/lib/jsox.mjs";

const utils = globalThis.utils || {
  to$(s) {
    return "$" + s;
  }

};
const localStorage = globalThis.localStorage;
const popups = {
  defaultDrag: true,
  autoRaise: true,
  create: createPopup,
  simpleForm: createSimpleForm,
  simpleNotice: createSimpleNotice,
  makeList: createList,
  makeCheckbox: makeCheckbox,
  makeNameInput: makeNameInput,
  // form, object, field, text; popup to rename
  makeTextInput: makeTextInput,
  // form, object, field, text
  makeTextField: makeTextField,
  makeButton: makeButton,
  makeChoiceInput: makeChoiceInput,
  // form, object, field, choiceArray, text
  makeDateInput: makeDateInput,
  // form, object, field, text
  strings: {
    get(s) {
      return s;
    }

  },
  setClass: setClass,
  toggleClass: toggleClass,
  clearClass: clearClass,
  createMenu: createPopupMenu
};
const globalMouseState = {
  activeFrame: null
};
var popupTracker;

function addCaptionHandler(c, popup_) {
  var popup = popup_;
  if (!popup) popup = createPopup(null);
  var mouseState = {
    frame: popup.divFrame,
    x: 0,
    y: 0,
    dragging: false
  };
  if (popups.autoRaise) popup_.divFrame.addEventListener("mousedown", evt => {
    popupTracker.raise(popup);
  });

  function mouseHandler(c, state) {
    var added = false;

    function mm(evt) {
      const state = globalMouseState.activeFrame;

      if (state) {
        if (state.dragging) {
          evt.preventDefault();
          var pRect = state.frame.getBoundingClientRect(); //var x = evt.clientX - pRect.left;
          //var y = evt.clientY - pRect.top;

          var x = evt.x - pRect.left;
          var y = evt.y - pRect.top;
          state.frame.style.left = parseInt(state.frame.style.left) + (x - state.x);
          state.frame.style.top = parseInt(state.frame.style.top) + (y - state.y);

          if (state.frame.id) {
            localStorage.setItem(state.frame.id + "/x", popup.divFrame.style.left);
            localStorage.setItem(state.frame.id + "/y", popup.divFrame.style.top);
          }
        }
      }
    }

    function md(evt) {
      //evt.preventDefault();
      if (globalMouseState.activeFrame) {
        return;
      }

      var pRect = state.frame.getBoundingClientRect();
      popupTracker.raise(popup); //state.x = evt.clientX-pRect.left;
      //state.y = evt.clientY-pRect.top;

      state.x = evt.x - pRect.left;
      state.y = evt.y - pRect.top;
      globalMouseState.activeFrame = state;
      state.dragging = true;

      if (!added) {
        added = true;
        document.body.addEventListener("mousemove", mm);
        document.body.addEventListener("mouseup", mu);
      }
    }

    function mu(evt) {
      evt.preventDefault();
      globalMouseState.activeFrame = null;
      state.dragging = false;
      added = false;
      document.body.removeEventListener("mousemove", mm);
      document.body.removeEventListener("mouseup", mu);
    }

    c.addEventListener("mousedown", md);
    c.addEventListener("mouseup", mu);
    c.addEventListener("mousemove", mm);
    c.addEventListener("touchstart", evt => {
      evt.preventDefault();
      var pRect = state.frame.getBoundingClientRect();
      popupTracker.raise(popup); //state.x = evt.clientX-pRect.left;
      //state.y = evt.clientY-pRect.top;

      state.x = evt.touches[0].clientX - pRect.left;
      state.y = evt.touches[0].clientY - pRect.top;
      state.dragging = true;
    });
    c.addEventListener("touchmove", evt => {
      evt.preventDefault();

      if (state.dragging) {
        const points = evt.touches;
        var pRect = state.frame.getBoundingClientRect();
        var x = points[0].clientX - pRect.left;
        var y = points[0].clientY - pRect.top;
        state.frame.style.left = parseInt(state.frame.style.left) + (x - state.x);
        state.frame.style.top = parseInt(state.frame.style.top) + (y - state.y);

        if (state.frame.id) {
          localStorage.setItem(state.frame.id + "/x", popup.divFrame.style.left);
          localStorage.setItem(state.frame.id + "/y", popup.divFrame.style.top);
        }
      }
    });
    c.addEventListener("touchend", evt => {
      evt.preventDefault();
      popupTracker.raise(popup);
      state.dragging = false;
    });
  }

  if (popups.defaultDrag) {
    mouseHandler(c, mouseState);
    mouseHandler(popup_.divFrame, mouseState);
  }
}

function initPopupTracker() {
  var tracker = {
    popups: [],

    raise(popup) {
      var top = tracker.popups.length;
      var n;
      var from = Number(popup.divFrame.style.zIndex);
      if (from === top) return;

      for (n = 0; n < tracker.popups.length; n++) {
        if (n == popup.index) popup.divFrame.style.zIndex = top;else {
          var thisZ = Number(tracker.popups[n].divFrame.style.zIndex);
          if (thisZ > from) tracker.popups[n].divFrame.style.zIndex = Number(tracker.popups[n].divFrame.style.zIndex) - 1;
        }
      }
    },

    find(id) {
      return this.popups.find(popup => popup.divFrame.id === id);
    },

    addPopup(popup) {
      popup.index = tracker.popups.length;
      popup.divFrame.style.zIndex = popup.index + 1;
      tracker.popups.push(popup);

      popup.raise = function () {
        tracker.raise(popup);
      };
    }

  };
  return tracker;
}

popupTracker = initPopupTracker();

class Popup {
  constructor(caption_, parent) {
    _defineProperty(this, "popupEvents", {
      close: [],
      show: []
    });

    _defineProperty(this, "divFrame", document.createElement("div"));

    _defineProperty(this, "divCaption", document.createElement("div"));

    _defineProperty(this, "divContent", document.createElement("div"));

    _defineProperty(this, "divClose", document.createElement("div"));

    _defineProperty(this, "popup", this);

    this.divFrame.style.left = 0;
    this.divFrame.style.top = 0;
    this.divFrame.className = parent ? "formContainer" : "frameContainer";
    if (caption_ != "") this.divFrame.appendChild(this.divCaption);
    this.divFrame.appendChild(this.divContent);
    this.divCaption.appendChild(this.divClose);
    this.divCaption.className = "frameCaption";
    this.divContent.className = "frameContent";
    this.divClose.className = "captionButton";
    popupTracker.addPopup(this);
    this.caption = caption_;
    parent = parent && parent.divContent || document.body;
    parent.appendChild(this.divFrame);
    addCaptionHandler(this.divCaption, this);
  }

  set caption(val) {
    this.divCaption.innerText = val;
  }

  center() {
    var myRect = this.divFrame.getBoundingClientRect();
    var pageRect = this.divFrame.parentElement.getBoundingClientRect();
    this.divFrame.style.left = (pageRect.width - myRect.width) / 2;
    this.divFrame.style.top = (pageRect.height - myRect.height) / 2;
  }

  over(e) {
    var target = e.getBoundingClientRect();
    this.divFrame.style.left = target.left;
    this.divFrame.style.top = target.top;
  }

  on(event, cb) {
    if (cb && "function" === typeof cb) {
      if (this.popupEvents[event]) this.popupEvents[event].push(cb);else this.popupEvents[event] = [cb];
    } else {
      var cbList;

      if (cbList = this.popupEvents[event]) {
        cbList.forEach(cbEvent => cbEvent(cb));
      }
    }
  }

  hide() {
    this.divFrame.style.display = "none";
  }

  show() {
    this.divFrame.style.display = ""; //popupTracker.raise( this );

    this.on("show", true);
  }

  move(x, y) {
    this.divFrame.style.left = x + "%";
    this.divFrame.style.top = y + "%";
  }

  appendChild(e) {
    return this.divContent.appendChild(e);
  }

  remove() {
    this.divFrame.remove();
  }

}

function createPopup(caption) {
  return new Popup(caption);
}

function createSimpleForm(title, question, defaultValue, ok, cancelCb) {
  const popup = popups.create(title);
  popup.on("show", () => {
    if ("function" === typeof defaultValue) {
      input.value = defaultValue();
    } else input.value = defaultValue;

    input.focus();
    input.select();
  });
  popup.on("close", () => {
    // aborted...
    cancel && cancel();
  });
  var form = document.createElement("form");
  form.className = "frameForm";
  form.setAttribute("action", "none");
  form.addEventListener("submit", evt => {
    evt.preventDefault();
    popup.hide();
    ok && ok(input.value);
  });
  form.addEventListener("reset", evt => {
    evt.preventDefault();
    popup.hide();
  });
  var textOutput = document.createElement("SPAN");
  textOutput.textContent = question;
  var input = document.createElement("INPUT");
  input.className = "popupInputField";
  input.setAttribute("size", 45);
  input.value = defaultValue;
  var okay = document.createElement("BUTTON");
  okay.className = "popupOkay";
  okay.textContent = "Okay";
  okay.setAttribute("name", "submit");
  okay.addEventListener("click", evt => {
    evt.preventDefault();
    popup.hide();
    ok && ok(input.value);
  });
  var cancel = document.createElement("BUTTON");
  cancel.className = "popupCancel";
  cancel.textContent = "Cancel";
  cancel.setAttribute("type", "reset");
  cancel.addEventListener("click", evt => {
    evt.preventDefault();
    popup.hide();
    cancelCb && cancelCb();
  });
  popup.divFrame.addEventListener("keydown", e => {
    if (e.keyCode == 27) {
      e.preventDefault();
      popup.hide();
      cancelCb && cancelCb();
    }
  });
  popup.divContent.appendChild(form);
  form.appendChild(textOutput);
  form.appendChild(document.createElement("br"));
  form.appendChild(input);
  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));
  form.appendChild(cancel);
  form.appendChild(okay);
  popup.center();
  popup.hide();
  return popup;
}

function makeButton(form, caption, onClick) {
  var button = document.createElement("div");
  button.className = "button";
  button.style.width = "max-content";
  var buttonInner = document.createElement("div");
  buttonInner.className = "buttonInner";
  buttonInner.style.width = "max-content";
  buttonInner.innerText = caption;
  button.appendChild(buttonInner);
  button.addEventListener("keydown", evt => {
    if (evt.key === "Enter" || evt.key === " ") {
      evt.preventDefault();
      evt.stopPropagation();
      onClick();
    }
  }); //var okay = document.createElement( "BUTTON" );
  //okay.className = "popupOkay";
  //okay.textContent = caption;

  button.addEventListener("click", evt => {
    evt.preventDefault();
    onClick();
  });
  button.addEventListener("touchstart", evt => {
    evt.preventDefault();
    setClass(button, "pressed");
  });
  button.addEventListener("touchend", evt => {
    evt.preventDefault();
    clearClass(button, "pressed");
    onClick();
  });
  button.addEventListener("mousedown", evt => {
    evt.preventDefault();
    setClass(button, "pressed");
  });
  button.addEventListener("mouseup", evt => {
    evt.preventDefault();
    clearClass(button, "pressed");
  });
  form.appendChild(button);
  return button;
}

function createSimpleNotice(title, question, ok, cancel) {
  return new SimpleNotice(title, question, ok, cancel);
}

class SimpleNotice extends Popup {
  //const popup = popups.create( title );
  constructor(title, question, ok, cancel) {
    super(title, null);
    const form = document.createElement("form");
    const okay = makeButton(form, "Okay", () => {
      this.hide();
      ok && ok();
    });
    {
      const show_ = this.show.bind(this);

      this.show = function (caption, content) {
        if (caption && content) {
          this.divCaption.textContent = caption;
          textOutput.textContent = content;
        } else if (caption) this.textContent = caption;

        show_();
      };

      this.on("show", () => {
        this.okay.focus();
      });
      this.on("close", () => {
        // aborted...
        cancel && cancel();
      });
      form.className = "frameForm";
      form.setAttribute("action", "none");
      form.addEventListener("submit", evt => {
        evt.preventDefault();
        this.hide(); //console.log( "SUBMIT?", input.value );
      });
      form.addEventListener("reset", evt => {
        evt.preventDefault();
        this.hide();
      });
      var textOutput = document.createElement("SPAN");
      textOutput.className = "noticeText";
      textOutput.textContent = question;
      this.okay.className += " notice";
      this.okay.children[0].className += " notice";
      this.divFrame.addEventListener("keydown", e => {
        if (e.keyCode == 27) {
          e.preventDefault();
          this.hide();
          ok && ok();
        }
      });
      this.divContent.appendChild(form);
      form.appendChild(textOutput);
      form.appendChild(document.createElement("br"));
      form.appendChild(document.createElement("br"));
      form.appendChild(this.okay);

      if (cancel) {
        let cbut = makeButton(form, "Cancel", () => {
          this.hide();
          cancel && cancel();
        });
        cbut.className += " notice";
        cbut.children[0].className += " notice";
      }

      this.center();
      this.hide(); //return this;
    }
  }

  appendChild(e) {
    this.form.insertChild(e, this.okay);
  }

}

class List {
  constructor(parentDiv, parentList, toString) {
    _defineProperty(this, "selected", null);

    _defineProperty(this, "groups", []);

    _defineProperty(this, "itemOpens", false);

    this.toString = toString;
    this.divTable = parentDiv;
    this.parentList = parentList;
  }

  push(group, toString_, opens) {
    var itemList = this.divTable.childNodes;
    var nextItem = null;

    for (nextItem of itemList) {
      if (nextItem.textContent > this.toString(group)) break;
      nextItem = null;
    }

    var newLi = document.createElement("LI");
    newLi.className = "listItem";
    this.divTable.insertBefore(newLi, nextItem); //) appendChild( newLi );

    newLi.addEventListener("click", e => {
      e.preventDefault();
      if (this.selected) this.selected.classList.remove("selected");
      newLi.classList.add("selected");
      this.selected = newLi;
    });
    var newSubList = document.createElement("UL");
    newSubList.className = "listSubList";
    if (this.parentList && this.parentList.parentItem) this.parentList.parentItem.enableOpen(this.parentList.thisItem);
    var treeLabel = document.createElement("span");
    treeLabel.textContent = this.toString(group);
    treeLabel.className = "listItemLabel";
    newLi.appendChild(treeLabel); //var newSubDiv = document.createElement( "DIV");

    newLi.appendChild(newSubList); //newSubList.appendChild( newSubDiv);

    var newRow;
    var subItems = createList(this, newSubList, toString_, true);
    this.groups.push(newRow = {
      opens: false,
      group: group,
      item: newLi,
      subItems: subItems,
      parent: this.parentList,

      set text(s) {
        treeLabel.textContent = s;
      },

      hide() {
        this.item.style.display = "none";
      },

      show() {
        this.item.style.display = "";
      }

    });
    return newRow;
  }

  enableOpen(item) {
    if (item.opens) return;
    item.opens = true;
    var treeKnob = document.createElement("span");
    treeKnob.textContent = "-";
    treeKnob.className = "knobOpen";
    item.item.insertBefore(treeKnob, item.item.childNodes[0]);
    treeKnob.addEventListener("click", e => {
      e.preventDefault();

      if (treeKnob.className === "knobClosed") {
        treeKnob.className = "knobOpen";
        treeKnob.textContent = "-";
        item.subItems.items.forEach(sub => {
          sub.item.style.display = "";
        });
      } else {
        treeKnob.className = "knobClosed";
        treeKnob.textContent = "+";
        item.subItems.items.forEach(sub => {
          sub.item.style.display = "none";
        });
      }
    });
  }

  enableDrag(type, item, key1, item2, key2) {
    item.item.setAttribute("draggable", true);
    item.item.addEventListener("dragstart", evt => {
      //if( evt.dataTransfer.getData("text/plain" ) )
      //	evt.preventDefault();
      if (item2) evt.dataTransfer.setData("text/" + type, item.group[key1] + "," + item2.group[key2]);else evt.dataTransfer.setData("text/" + type, item.group[key1]);
      evt.dataTransfer.setData("text/plain", evt.dataTransfer.getData("text/plain") + JSON.stringify({
        type: type,
        val1: item.group[key1],
        val2: item2 && item2.group[key2]
      }));
      console.log("dragstart:", type);
      if (item) evt.dataTransfer.setData("text/item", item.group[key1]);
      if (item2) evt.dataTransfer.setData("text/item2", item2.group[key2]);
    });
  }

  enableDrop(type, item, cbDrop) {
    item.item.addEventListener("dragover", evt => {
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "move"; //console.log( "Dragover:", evt.dataTransfer.getData( "text/plain" ), evt );
    });
    item.item.addEventListener("drop", evt => {
      evt.preventDefault();
      var objType = evt.dataTransfer.getData("text/plain");

      if ("undefined" !== typeof JSOX) {
        JSOX.begin(event => {
          if (type === event.type) {
            console.log("drop of:", evt.dataTransfer.getData("text/plain")); //cbDrop( accruals.all.get( event.val1 ) );
          }
        }).write(objType);
      }
    });
  }

  update(group) {
    var item = this.groups.find(group_ => group_.group === group);
    item.textContent = this.toString(group);
  }

  get items() {
    return this.groups;
  }

  reset() {
    while (this.divTable.childNodes.length) this.divTable.childNodes[0].remove();
  }

}

function createList(parent, parentList, toString, opens) {
  return new List(parent, parentList, toString, opens);
}

function makeCheckbox(form, o, field, text) {
  let initialValue = o[field];
  var textCountIncrement = document.createElement("SPAN");
  textCountIncrement.textContent = text;
  var inputCountIncrement = document.createElement("INPUT");
  inputCountIncrement.setAttribute("type", "checkbox");
  inputCountIncrement.className = "checkOption rightJustify";
  inputCountIncrement.checked = o[field]; //textDefault.

  var onChange = [];
  var binder = document.createElement("div");
  binder.className = "fieldUnit";
  binder.addEventListener("click", e => {
    if (e.target === inputCountIncrement) return;
    e.preventDefault();
    inputCountIncrement.checked = !inputCountIncrement.checked;
  });
  inputCountIncrement.addEventListener("change", e => {
    o[field] = inputCountIncrement.checked;
  });
  form.appendChild(binder);
  binder.appendChild(textCountIncrement);
  binder.appendChild(inputCountIncrement); //form.appendChild( document.createElement( "br" ) );

  return {
    on(event, cb) {
      if (event === "change") onChange.push(cb);
      inputCountIncrement.addEventListener(event, cb);
    },

    get checked() {
      return inputCountIncrement.checked;
    },

    set checked(val) {
      inputCountIncrement.checked = val;
    },

    get value() {
      return inputCountIncrement.checked;
    },

    set value(val) {
      o[field] = val;
      inputCountIncrement.checked = val;
      onChange.forEach(cb => cb());
    },

    reset() {
      o[field] = initialValue;
      inputCountIncrement.checked = initialValue;
    },

    changes() {
      if (o[field] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + o[field];
      }

      return '';
    },

    get style() {
      return binder.style;
    }

  };
}

function makeTextInput(form, input, value, text, money, percent) {
  const initialValue = input[value];
  var textMinmum = document.createElement("SPAN");
  textMinmum.textContent = text;
  var inputControl = document.createElement("INPUT");
  inputControl.className = "textInputOption rightJustify";
  inputControl.addEventListener("mousedown", evt => evt.stopPropagation()); //textDefault.

  function setValue() {
    if (money) {
      inputControl.value = utils.to$(input[value]);
      inputControl.addEventListener("change", e => {
        var val = utils.toD(inputControl.value);
        input[value] = inputControl.value = utils.to$(val);
      });
    } else if (percent) {
      inputControl.value = utils.toP(input[value]);
      inputControl.addEventListener("change", e => {
        var val = utils.fromP(inputControl.value);
        input[value] = inputControl.value = utils.toP(val);
      });
    } else {
      inputControl.value = input[value];
      inputControl.addEventListener("input", e => {
        var val = inputControl.value;
        input[value] = val;
      });
    }
  }

  setValue();
  var binder = document.createElement("div");
  binder.className = "fieldUnit";
  form.appendChild(binder);
  binder.appendChild(textMinmum);
  binder.appendChild(inputControl);
  return {
    addEventListener(a, b) {
      return inputControl.addEventListener(a, b);
    },

    get value() {
      if (money) return utils.toD(inputControl.value);
      if (percent) return utils.fromP(inputControl.value);
      return inputControl.value;
    },

    set value(val) {
      if (money) inputControl.value = utils.to$(val);else if (percent) inputControl.value = utils.toP(val);else inputControl.value = val;
    },

    reset() {
      input[value] = initialValue;
      setValue();
    },

    changes() {
      if (input[value] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + input[value];
      }

      return '';
    }

  };
}

function makeTextField(form, input, value, text, money, percent) {
  const initialValue = input[value];
  var textMinmum = document.createElement("SPAN");
  textMinmum.textContent = text;
  var inputControl = document.createElement("SPAN");
  inputControl.className = "textInputOption rightJustify";
  inputControl.addEventListener("mousedown", evt => evt.stopPropagation()); //textDefault.

  function setValue() {
    if (money) {
      inputControl.value = utils.to$(input[value]);
      inputControl.addEventListener("change", e => {
        var val = utils.toD(inputControl.value);
        input[value] = inputControl.value = utils.to$(val);
      });
    } else if (percent) {
      inputControl.value = utils.toP(input[value]);
      inputControl.addEventListener("change", e => {
        var val = utils.fromP(inputControl.value);
        input[value] = inputControl.value = utils.toP(val);
      });
    } else {
      inputControl.value = input[value];
      inputControl.addEventListener("input", e => {
        var val = inputControl.value;
        input[value] = val;
      });
    }
  }

  setValue();
  var binder = document.createElement("div");
  binder.className = "fieldUnit";
  form.appendChild(binder);
  binder.appendChild(textMinmum);
  binder.appendChild(inputControl);
  return {
    addEventListener(a, b) {
      return inputControl.addEventListener(a, b);
    },

    get value() {
      if (money) return utils.toD(inputControl.value);
      if (percent) return utils.fromP(inputControl.value);
      return inputControl.value;
    },

    set value(val) {
      if (money) inputControl.value = utils.to$(val);else if (percent) inputControl.value = utils.toP(val);else inputControl.value = val;
    },

    reset() {
      input[value] = initialValue;
      setValue();
    },

    changes() {
      if (input[value] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + input[value];
      }

      return '';
    }

  };
}

function makeNameInput(form, input, value, text) {
  const initialValue = input[value];
  var binder;
  const textLabel = document.createElement("SPAN");
  textLabel.textContent = text;
  const textOutput = document.createElement("SPAN");
  textOutput.textContent = input[value];
  const buttonRename = document.createElement("Button");
  buttonRename.textContent = popups.strings.get("(rename)");
  buttonRename.className = "buttonOption rightJustify";
  buttonRename.addEventListener("click", evt => {
    evt.preventDefault(); //title, question, defaultValue, ok, cancelCb

    const newName = createSimpleForm(popups.strings.get("Change Name"), popups.strings.get("Enter new name"), input[value], v => {
      input[value] = v;
      textOutput.textContent = v;
    });
    newName.show();
  });
  binder = document.createElement("div");
  binder.className = "fieldUnit";
  form.appendChild(binder);
  binder.appendChild(textLabel);
  binder.appendChild(text);
  binder.appendChild(buttonRename); //binder.appendChild( document.createElement( "br" ) );

  return {
    get value() {
      return textOutput.textContent;
    },

    set value(val) {
      textOutput.textContent = val;
    },

    reset() {
      input[value] = initialValue;
      textLabel.textContent = initialValue;
    },

    changes() {
      if (input[value] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + input[value];
      }

      return '';
    }

  };
}

function toggleClass(el, cn) {
  if (el.className.includes(cn)) {
    el.className = el.className.split(" ").reduce((a, el) => el !== cn ? (a.push(el), a) : a, []).join(' ');
  } else {
    el.className += " " + cn;
  }
}

function clearClass(el, cn) {
  if (el.className.includes(cn)) {
    el.className = el.className.split(" ").reduce((a, el) => el !== cn ? (a.push(el), a) : a, []).join(' ');
  }
}

function setClass(el, cn) {
  if (el.className.includes(cn)) ;else {
    el.className += " " + cn;
  }
}

function makeDateInput(form, input, value, text) {
  const initialValue = input[value];
  var textMinmum = document.createElement("SPAN");
  textMinmum.textContent = text;
  var inputControl = document.createElement("INPUT");
  inputControl.className = "textInputOption rightJustify";
  inputControl.type = "date"; // returns date at midnight UTC not local.

  inputControl.addEventListener("mousedown", evt => {
    evt.stopPropagation(); // halt on this control
  }); //textDefault.

  if (input[value] instanceof Date) {
    inputControl.valueAsDate = input[value];
  } else inputControl.value = input[value];

  inputControl.addEventListener("change", evt => {
    console.log("Date type:", inputControl.value, new Date(inputControl.value));
    input[value] = new Date(inputControl.value); // convert to wall clock?  What if browser isn't in birth locale?
    //input[value].setMinutes( input[value].getTimezoneOffset());
  });
  var binder = document.createElement("div");
  binder.className = "fieldUnit";
  form.appendChild(binder);
  binder.appendChild(textMinmum);
  binder.appendChild(inputControl);
  return {
    addEventListener(a, b) {
      return inputControl.addEventListener(a, b);
    },

    get value() {
      return inputControl.value;
    },

    set value(val) {
      //input[value] = val;
      inputControl.value = val;
    },

    hide() {
      this.item.style.display = "none";
    },

    show() {
      this.item.style.display = "";
    },

    reset() {
      input[value] = initialValue;
      inputControl.valueAsDate = initialValue;
    },

    changes() {
      if (input[value] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + input[value];
      }

      return '';
    }

  };
} // --------------- Dropdown choice list ---------------------------


function makeChoiceInput(form, input, value, choices, text) {
  const initialValue = input[value];
  var textMinmum = document.createElement("SPAN");
  textMinmum.textContent = text;
  var inputControl = document.createElement("SELECT");
  inputControl.className = "selectInput rightJustify";
  inputControl.addEventListener("mousedown", evt => evt.stopPropagation());

  for (let choice of choices) {
    const option = document.createElement("option");
    option.text = choice;

    if (choice === input[value]) {
      inputControl.selectedIndex = inputControl.options.length - 1;
    }

    inputControl.add(option);
  } //textDefault.


  inputControl.value = input[value];
  inputControl.addEventListener("change", evt => {
    const idx = inputControl.selectedIndex;

    if (idx >= 0) {
      console.log("Value in select is :", inputControl.options[idx].text);
      input[value] = inputControl.options[idx].text;
    }
  });
  var binder = document.createElement("div");
  binder.className = "fieldUnit";
  form.appendChild(binder);
  binder.appendChild(textMinmum);
  binder.appendChild(inputControl);
  return {
    get value() {
      return inputControl.value;
    },

    set value(val) {
      inputControl.value = val;
    },

    reset() {
      input[value] = initialValue;
      inputControl.value = initialValue;
    },

    changes() {
      if (input[value] !== initialValue) {
        return text + popups.strings.get(" changed from ") + initialValue + popups.strings.get(" to ") + input[value];
      }

      return '';
    }

  };
} //--------------------------- Quick Popup Menu System ------------------------------


const mouseCatcher = document.createElement("div");
document.body.appendChild(mouseCatcher);
mouseCatcher.addEventListener("contextmenu", evt => {
  evt.preventDefault();
  evt.stopPropagation();
  return false;
});
mouseCatcher.className = "mouseCatcher";
mouseCatcher.addEventListener("click", evt => {
  mouseCatcher.style.visibility = "hidden";
});

function createPopupMenu() {
  let keepShow = false;

  function menuCloser() {
    if (menu.lastShow) {
      if (keepShow) {
        menu.lastShow = 0;
        keepShow = false;
        return;
      }

      const now = Date.now();

      if (now - menu.lastShow > 500) {
        menu.lastShow = 0; // reset this, otherwise hide will just schedule this timer

        if (menu.subOpen) menu.subOpen.hide();
        menu.hide();
      }

      if (menu.lastShow) setTimeout(menuCloser, 500 - (now - menu.lastShow));
    }
  }

  const menu = {
    items: [],
    lastShow: 0,
    parent: null,
    subOpen: null,
    container: document.createElement("div"),
    board: null,

    separate() {
      var newItem = document.createElement("HR");
      menu.container.appendChild(newItem);
    },

    addItem(text, cb) {
      var newItem = document.createElement("A");
      var newItemBR = document.createElement("BR");
      newItem.textContent = text;
      menu.container.appendChild(newItem);
      menu.container.appendChild(newItemBR);
      newItem.className = "popupItem";
      newItem.addEventListener("click", evt => {
        cb(); //console.log( "Item is clicked.", evt.target.value );

        this.hide(true);
      });
      newItem.addEventListener("mouseover", evt => {
        if (menu.subOpen) {
          menu.subOpen.hide();
          menu.subOpen = null;
        }

        keepShow = true;
      });
    },

    addMenu(text) {
      var newItem = document.createElement("A");
      var newItemBR = document.createElement("BR");
      newItem.textContent = text;
      this.container.appendChild(newItem);
      this.container.appendChild(newItemBR);
      const value = createPopupMenu();
      {
        value.parent = this;
        newItem.addEventListener("mouseover", evt => {
          var r = newItem.getBoundingClientRect();
          keepShow = true;
          console.log("Item is clicked show that.", evt.clientX, evt.clientY);
          value.show(evt.clientX, r.top - 10, menu.cb);
          menu.subOpen = value;
        });
        newItem.addEventListener("mouseout", evt => {
          var r = newItem.getBoundingClientRect();
          console.log("Item is clicked show that.", evt.clientX, r.top);
          if (evt.toElement !== newItem.container) value.hide();
        });
        newItem.addEventListener("mousemove", evt => {
          if (this.subOpen) this.subOpen.lastShow = Date.now();
        });
      }
      return value;
    },

    hide(all) {
      if (menu.lastShow) return menuCloser();
      this.container.style.visibility = "hidden";

      if (this.parent) {
        this.parent.subOpen = null; // should be the same as Me... 

        if (all) this.parent.hide(all);
      } else {
        mouseCatcher.style.visibility = "hide";
      }
    },

    show(board, x, y, cb) {
      menu.lastShow = Date.now();
      this.board = board;
      menu.cb = cb;
      mouseCatcher.style.visibility = "visible";
      this.container.style.visibility = "inherit";
      this.container.style.left = x;
      this.container.style.top = y;
    },

    reset() {
      this.hide(true); //console.log( "hide everything?" );	
    }

  };
  mouseCatcher.appendChild(menu.container);
  menu.container.className = "popup";
  menu.container.style.zIndex = 50;
  menu.hide(); //document.body.appendChild( menu.container );

  return menu;
}

let drawLine = null; //if( "undefined" === typeof window )
//	import('util').then( u=>util = u );

const _debug_revive = false;
const localParseState = {
  world: null
};

var _events = new WeakMap();

var _free = new WeakMap();

var _used = new WeakMap();

var _class = new WeakMap();

class Pool {
  constructor(parentEventHandler, type) {
    _events.set(this, {
      writable: true,
      value: {}
    });

    _free.set(this, {
      writable: true,
      value: []
    });

    _used.set(this, {
      writable: true,
      value: []
    });

    _class.set(this, {
      writable: true,
      value: null
    });

    _defineProperty(this, "parent", null);

    _classPrivateFieldSet(this, _class, type);

    this.parent = parentEventHandler;
  }

  get(id, opts) {
    if (id === undefined) ;else if ("object" === typeof id) {
      opts = id;
      id = null;
    } else {
      let r = _classPrivateFieldGet(this, _used)[id];

      if (!r) {
        const fr = _classPrivateFieldGet(this, _free).findIndex(member => member.id === id);

        if (fr >= 0) {
          r = _classPrivateFieldGet(this, _free)[fr];

          _classPrivateFieldGet(this, _free).splice(fr, 1);

          _classPrivateFieldGet(this, _used)[id] = r;
        }

        if (opts) {
          r.set(opts);
        } else throw new Error("Existing object does not exist in pool.");
      } else {
        if (opts) r.set(opts);
      }

      return r;
    }

    if (_classPrivateFieldGet(this, _free).length) {
      const r = _classPrivateFieldGet(this, _free).pop();

      opts && r.set(opts);
      _classPrivateFieldGet(this, _used)[r.id] = r;
      this.parent.on("create", r);
      return r;
    } else {
      const r = new (_classPrivateFieldGet(this, _class))(this, opts);
      r.id = _classPrivateFieldGet(this, _used).length;

      _classPrivateFieldGet(this, _used).push(r);

      this.parent.on("create", r);
      return r;
    }
  } // for each empty spot, move a used entry.


  pack() {
    let lastUsed;
    let cache = [];

    while (_classPrivateFieldGet(this, _free).length) {
      let n;

      for (n = _classPrivateFieldGet(this, _used).length - 1; n > 0; n--) if (lastUsed = _classPrivateFieldGet(this, _used)[n]) break;

      const free = _classPrivateFieldGet(this, _free).pop();

      if (free.id < lastUsed) {
        _classPrivateFieldGet(this, _used)[free.id] = lastUsed;
        _classPrivateFieldGet(this, _used)[n] = null;
        lastUsed.id = free.id;
        cache.push(free);
        free.id = n; // drops this node anyway...
      }
    }

    _classPrivateFieldSet(this, _free, cache);
  }

  move(member, to) {
    if (_classPrivateFieldGet(this, _used)[to]) throw new Error("ID is already in use.");
    _classPrivateFieldGet(this, _used)[member.id] = null;
    _classPrivateFieldGet(this, _used)[to] = member;
  }

  get array() {
    return _classPrivateFieldGet(this, _used);
  }

  toObject() {
    return _classPrivateFieldGet(this, _used);
  }

  drop(w) {
    _classPrivateFieldGet(this, _free).push(w);

    _classPrivateFieldGet(this, _used)[w.id] = null;
    this.parent.on("destroy", w);
  }

  on(event, data, data2) {
    if ("function" === typeof data) {
      //console.log( "REGSITERING EVENT IN", event );
      const newEvent = {
        cb: data,
        param: data2
      };
      if (event in _classPrivateFieldGet(this, _events)) _classPrivateFieldGet(this, _events)[event].push(newEvent);else _classPrivateFieldGet(this, _events)[event] = [newEvent];
    } else {
      //console.log( "USING EVENT", event );
      if (event in _classPrivateFieldGet(this, _events)) {
        let result = null;

        _classPrivateFieldGet(this, _events)[event].forEach(cb => {
          const zz = cb.cb.call(cb.param, data, data2);
          if (result) result = [result].push(zz);else result = zz;
        }); //console.log( "on event result:", result );


        return result;
      }
    }
  }

}

var _id = new WeakMap();

var _pool = new WeakMap();

var _set = new WeakMap();

class PoolMember {
  get id() {
    return _classPrivateFieldGet(this, _id);
  }

  set id(val) {
    if (_classPrivateFieldGet(this, _id) < 0) _classPrivateFieldSet(this, _id, val);else {
      if (_classPrivateFieldGet(this, _id) !== val) {
        console.log("moving pool member manually");

        _classPrivateFieldGet(this, _set).move(this, val);

        _classPrivateFieldSet(this, _id, val); // successfully moved to the new spot...

      }
    }
  }

  on(name, val) {
    return _classPrivateFieldGet(this, _set).on(name, this, val);
  }

  get parent() {
    return _classPrivateFieldGet(this, _set).parent;
  }

  constructor(set) {
    _id.set(this, {
      writable: true,
      value: -1
    });

    _pool.set(this, {
      writable: true,
      value: null
    });

    _set.set(this, {
      writable: true,
      value: null
    });

    _classPrivateFieldSet(this, _set, set);
  }

}

class NameSet extends Pool {
  constructor(parent) {
    super(parent, Name);
  }

}

class NameMsg {
  constructor() {
    _defineProperty(this, "name", localParseState.world.getName());
  }

}

function buildNamefromJSOX(field, val) {
  if (!field) return this.name;

  switch (field) {
    case "flags":
      return this.name.flags;

    case "id":
      this.name.id = val;
      return undefined;

    case "name":
      this.name.name = val;
      return undefined;
  }
}

var _set2 = new WeakMap();

class Name extends PoolMember {
  // craete/allocate
  constructor(set, opts) {
    var _Name$autoid;

    super(set);

    _defineProperty(this, "flags", {
      vertical: false
    });

    _defineProperty(this, "name", '');

    _set2.set(this, {
      writable: true,
      value: null
    });

    this.name = opts.name || "Name " + (_classStaticPrivateFieldSpecSet(Name, Name, _autoid, (_Name$autoid = +_classStaticPrivateFieldSpecGet(Name, Name, _autoid)) + 1), _Name$autoid);
  }

  set(opts) {
    this.name = opts.name;
  }

} //--------------------------------------------


var _autoid = {
  writable: true,
  value: 1
};

class TextureSet extends Pool {
  constructor(parent) {
    super(parent, Texture);
  }

}

class TextureMsg {
  constructor() {
    _defineProperty(this, "texture", localParseState.world.getTexture());

    _defineProperty(this, "name", null);

    _defineProperty(this, "flags", null);
  }

}

function buildTexturefromJSOX(field, val) {
  if (!field) return this.texture.set(this);

  switch (field) {
    case "flags":
      return this.texture.flags;

    case "name":
      this.texture.name = val;
      return val;

    default:
      return undefined;
  }
}

class Texture extends PoolMember {
  constructor(set) {
    super(set, Texture);

    _defineProperty(this, "flags", {
      color: true
    });

    _defineProperty(this, "color", null);

    _defineProperty(this, "name", null);
  }

  set(v) {
    this.color = v.color;
    this.name = v.name;
    return this;
  }

  SetSolidColor(c) {
    this.color = c;
  }

}

function AColor(r, g, b, a) {} //--------------------------------------------


class Vector {
  constructor(a, b, c) {
    _defineProperty(this, "x", 0);

    _defineProperty(this, "y", 0);

    _defineProperty(this, "z", 0);

    if ("number" === typeof a) {
      this.x = a;
      this.y = b;
    }

    if ("number" === typeof c) {
      this.z = c;
    }
  }

  set(v) {
    if (isNaN(v.x)) {
      console.trace("found Nan setting vector", this, v);
    }

    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  sum(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  add(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  scale(t) {
    this.x *= t;
    this.y *= t;
    this.z *= t;
    return this;
  }

  addScaled(a, b, t) {
    this.x = a.x + b.x * t;
    this.y = a.y + b.y * t;
    this.z = a.z + b.z * t;
    return this;
  }

  crossproduct(a, b) {
    this.x = a.y * b.z - a.z * b.y;
    this.y = a.z * b.x - a.x * b.z;
    this.z = a.x * b.y - a.y * b.x;
  }

} //--------------------------------------------


class Ray {
  constructor(o, n) {
    _defineProperty(this, "o", new Vector());

    _defineProperty(this, "n", new Vector());

    if (o) {
      this.o = o;
      this.n = n;
    }
  }

  set(opts) {
    this.o.set(opts.o);
    this.n.set(opts.n);
    if (!opts.n.x && !opts.n.y && !opts.n.z) debugger;
    return this;
  }

} //--------------------------------------------


function NearValue(n, m) {
  return Math.abs(n - m) < 0.00001;
}

function Near(n, m) {
  return NearValue(n.x, m.x) && NearValue(n.y, m.y) && NearValue(n.z, m.z);
}

const intersectionResult = {
  t1: 0,
  t2: 0
};

function FindIntersectionTime(s1, o1, s2, o2) {
  const na = s1.x;
  const nb = s1.y;
  const nc = s1.z;
  const nd = s2.x;
  const ne = s2.y;
  const nf = s2.z;
  if (!na && !nb && !nc || !nd && !ne && !nf) return null;
  let denoms = new Vector();
  let t1, t2, denom;
  const a = o1.x;
  const b = o1.y;
  const c = o1.z;
  const d = o2.x;
  const e = o2.y;
  const f = o2.z;
  denoms.crossproduct(s1, s2); // - (negative) result..

  denom = denoms.z;

  if (NearValue(denom, 0)) {
    denom = denoms.y;

    if (NearValue(denom, 0)) {
      denom = denoms.x;

      if (NearValue(denom, 0)) {
        //console.log( "Bad!-------------------------------------------\n" );
        return null;
      } else {
        t1 = (ne * (c - f) + nf * (e - b)) / denom;
        t2 = (nb * (c - f) + nc * (e - b)) / denom;
      }
    } else {
      t1 = (nd * (f - c) + nf * (a - d)) / denom;
      t2 = (na * (f - c) + nc * (a - d)) / denom;
    }
  } else {
    t1 = (nd * (b - e) + ne * (d - a)) / denom;
    t2 = (na * (b - e) + nb * (d - a)) / denom;
  }

  intersectionResult.t2 = t2;
  intersectionResult.t1 = t1;
  return intersectionResult;
}

class LineSet extends Pool {
  constructor(parent) {
    super(parent, Line);
  }

}

class LineMsg {
  constructor() {
    _defineProperty(this, "line", localParseState.world.getLine());

    _defineProperty(this, "r", null);

    _defineProperty(this, "f", 0);

    _defineProperty(this, "t", 0);
  }

}

function buildLinefromJSOX(field, val) {
  try {
    if (!field) return this.line;
    _debug_revive && console.log("revive line f ield:", field);

    switch (field) {
      case "from":
        this.line.from = val;
        break;

      case "id":
        this.line.id = val;
        break;

      case "r":
        return this.line.r = val;
        break;

      case "to":
        this.line.to = val;
        break;
    }
  } catch (err) {
    console.log("Line failure:", err);
  }
}

var _pFrom = new WeakMap();

var _pTo = new WeakMap();

var _flags = new WeakMap();

class Line extends PoolMember {
  constructor(set, opts) {
    super(set);

    _defineProperty(this, "r", new Ray());

    _defineProperty(this, "from", -Infinity);

    _pFrom.set(this, {
      writable: true,
      value: new Vector()
    });

    _defineProperty(this, "to", Infinity);

    _pTo.set(this, {
      writable: true,
      value: new Vector()
    });

    _flags.set(this, {
      writable: true,
      value: {
        updated: false
      }
    });

    opts && this.set(opts);
  }

  toJSOX() {
    if (!this.r.n.x && !this.r.n.y && !this.r.n.z) debugger;
    return JSOX$1.stringify({
      id: this.id,
      r: this.r,
      t: this.to,
      f: this.from
    });
  }

  set(opts) {
    if (opts instanceof Line) {
      if (isNaN(opts.r.n.x)) {
        console.trace("Found NaN");
      }

      this.r.set(opts.r);
      this.from = opts.from;
      this.to = opts.to;
    } else if (opts.line && opts.line instanceof Line) {
      this.r.set(opts.ray.r);
      this.from = opts.f;
      this.to = opts.t;
      return this;
    } else if ("id" in opts) {
      if (opts.id !== this.id) throw new Error("Mismatch ID");
      this.r.set(opts.r);
      this.from = opts.f;
      this.to = opts.t;
    } else {
      this.r = opts.ray;

      if ("number" === typeof opts.from) {
        this.from = opts.from;
        this.to = opts.to;
      }

      _classPrivateFieldGet(this, _flags).updated = true;
      this.on("update", this);
    }

    return this;
  }

  get ptFrom() {
    return _classPrivateFieldGet(this, _pFrom).addScaled(this.r.o, this.r.n, this.from);
  }

  get ptTo() {
    return _classPrivateFieldGet(this, _pTo).addScaled(this.r.o, this.r.n, this.to);
  }

  intersect(bEnd1, pLine2, bEnd2) {
    const pLine1 = this; // intersects line1 with line2
    // if bEnd1 then update pLine1.to else pLine1.from
    // if bEnd2 then update pLine2.to else pLine2.from

    let r = FindIntersectionTime(pLine1.r.n, pLine1.r.o, pLine2.r.n, pLine2.r.o);
    console.log("Result ", r);

    if (!r) {
      console.log("Intersect N<%g,%g,%g> O<%g,%g,%g> with N<%g,%g,%g> O<%g,%g,%g>", pLine1.r.n.x, pLine1.r.n.y, pLine1.r.n.z, pLine1.r.o.x, pLine1.r.o.y, pLine1.r.o.z, pLine2.r.n.x, pLine2.r.n.y, pLine2.r.n.z, pLine2.r.o.x, pLine2.r.o.y, pLine2.r.o.z);
      console.log("End Flags: %d %d", bEnd1, bEnd2);
    }

    if (r) {
      console.log("SETtting", bEnd1, bEnd2);

      if (bEnd1) {
        console.log("set line1 to:", r.t1);
        pLine1.to = r.t1;
      } else {
        console.log("set line1 from:", r.t1);
        pLine1.from = r.t1;
      }

      if (bEnd2) {
        console.log("set line2 to:", r.t2);
        pLine2.to = r.t2;
      } else {
        console.log("set line2 from:", r.t2);
        pLine2.from = r.t2;
      }

      return true;
    } else {
      // what to do if specified lines do not intersect?
      return false;
    }
  }

}

Line.makeOpenLine = function (r) {
  return new Line({
    ray: r,
    from: -Infinity,
    to: Infinity
  });
}; //--------------------------------------------


function ASSERT(e) {
  if (!e) throw new Error("Condition is false..");
}

class WallSet extends Pool {
  constructor(parent) {
    super(parent, Wall);
  }

}

class WallMsg {
  constructor() {
    _defineProperty(this, "end", null);

    _defineProperty(this, "end_at_end", false);

    _defineProperty(this, "wall", localParseState.world.getWall());

    _defineProperty(this, "start", null);

    _defineProperty(this, "start_at_end", false);
  }

}

function buildWallfromJSOX(field, val) {
  if (!field) return this.wall;

  switch (field) {
    case "end":
      if ("undefined" === typeof val) {
        console.log("end wall is passed undefined. ");
        debugger;
      }

      this.end = val;
      if (val instanceof WallMsg) this.wall.end = val.wall;else this.wall.end = val;
      break;

    case "end_at_end":
      this.end_at_end = val;
      break;

    case "id":
      this.wall.id = val;
      break;

    case "line":
      this.line = val;
      if (val instanceof LineMsg) this.wall.line = val.line;else this.wall.line = val;
      break;

    case "into":
      this.into = val;
      this.wall.into = val && val;
      break;

    case "start":
      this.start = val;
      if (val instanceof WallMsg) this.wall.start = val.wall;else this.wall.start = val;
      break;

    case "start_at_end":
      this.wall.start_at_end = val;
      break;
  }

  return undefined;
}

function wallToJSOX(stringifier) {
  const keys = Object.keys(this);
  keys.push("id");
  const mirror = {};

  for (let key of keys) mirror[key] = this[key]; //console.log( "Stringify wall mirror:", mirror );


  return stringifier.stringify(mirror);
}

var _flags2 = new WeakMap();

var _sector = new WeakMap();

var _from = new WeakMap();

var _to = new WeakMap();

class Wall extends PoolMember {
  //#world = null;
  //name = null;
  // mate - to new sector
  // in same sector, mating wall
  // wall_at_start links from end of starting segment
  // in same sector, mating wall
  // wall_at_end links from end of ending segment
  set(opts) {
    if (opts.mating) {
      if (opts.mating.into) {
        throw new Error("Wall is alreadying mating another wall");
      }

      this.into = opts.mating;
      opts.mating.into = this;
      this.line = this.into.line;

      _classPrivateFieldSet(this, _sector, _classPrivateFieldGet(this.into, _sector));

      return;
    } //opts.world.addWall( this );	


    this.line = this.parent.getLine({
      ray: opts.using
    });

    if (opts.start) {
      if (_classPrivateFieldGet(opts.start, _sector)) _classPrivateFieldSet(this, _sector, _classPrivateFieldGet(opts.start, _sector));

      if (opts.startAtEnd) {
        ASSERT(opts.start.end === null);
        opts.start.end = this;
        opts.start.end_at_end = false;
      } else {
        ASSERT(opts.start.start === null);
        opts.start.start = this;
        opts.start.start_at_end = false;
      }

      this.start = opts.start;
      this.start_at_end = opts.startAtEnd; //console.log( "Do intersect line 1 start side.." );

      _classPrivateFieldSet(this, _from, this.line.ptFrom);

      _classPrivateFieldSet(this, _to, this.line.ptTo);

      this.line.intersect(false, this.start.line, opts.startAtEnd); //console.log( "Intersected lines:", this.line, this.start.line );
    }

    if (opts.end) {
      if (_classPrivateFieldGet(opts.start, _sector)) _classPrivateFieldSet(this, _sector, _classPrivateFieldGet(opts.start, _sector));

      if (opts.endAtEnd) {
        ASSERT(opts.end.end === null);
        opts.end.end = this;
        opts.end.end_at_end = true;
      } else {
        ASSERT(opts.end.start === null);
        opts.end.start = this;
        opts.end.start_at_end = true;
      }

      this.end = opts.end;
      this.end_at_end = opts.endAtEnd;
      this.line.intersect(true, this.end.line, opts.endAtEnd);
      console.log("Intersected lines:", this.line, this.end.line);
    } else console.log("Skipping second mating line");
  }

  constructor(set, opts) {
    super(set);

    _flags2.set(this, {
      writable: true,
      value: {
        bUpdating: false,
        // set this while updating to prevent recursion..
        detached: false,
        // joined by joined FAR
        bSkipMate: false,
        // used when updating sets of lines - avoid double update mating walls
        dirty: true
      }
    });

    _sector.set(this, {
      writable: true,
      value: null
    });

    _defineProperty(this, "line", null);

    _defineProperty(this, "into", null);

    _defineProperty(this, "start", null);

    _defineProperty(this, "start_at_end", false);

    _defineProperty(this, "end", null);

    _defineProperty(this, "end_at_end", false);

    _from.set(this, {
      writable: true,
      value: new Vector()
    });

    _to.set(this, {
      writable: true,
      value: new Vector()
    });

    if (opts) this.set(opts);
  }

  update() {
    if (_classPrivateFieldGet(this, _flags2).dirty) {
      _classPrivateFieldSet(this, _from, this.line.ptFrom);

      _classPrivateFieldSet(this, _to, this.line.ptTo);

      _classPrivateFieldGet(this, _flags2).dirty = false;
    }
  }

  next(fromEnd) {
    if (fromEnd[0]) {
      const e = this.end;
      fromEnd[0] = e.start === this;
      return e;
    }

    const e = this.start;
    fromEnd[0] = e.start === this;
    return this.start;
  }

  get from() {
    if (_classPrivateFieldGet(this, _flags2).dirty) this.update();
    return this.line.ptFrom;
  }

  get dirty() {
    return _classPrivateFieldGet(this, _flags2).dirty;
  }

  set dirty(val) {
    _classPrivateFieldGet(this, _flags2).dirty = true;
  }

  get to() {
    if (_classPrivateFieldGet(this, _flags2).dirty) this.update();
    return this.line.ptTo;
  }

  set sector(val) {
    _classPrivateFieldSet(this, _sector, val);
  }

  weld(wall) {
    if (!this.into && !wall.into) {
      this.into = wall.into;
      wall.into = this.into;
    } else {
      throw new Error("One of the walls is already linked");
    }
  }

  countWalls() {
    let pCur = this;
    let priorend = [true];
    let r = 0;

    do {
      r++;
      pCur = pCur.next(priorend);
    } while (pCur != this);

    return r;
  }

  updateMating(walls, bLockSlope, bErrorOK) {
    //PWORLD world = GetSetMember( WORLD, &g.worlds, iWorld );
    const result = {
      status: true
    };
    const pWall = this;

    function UpdateResult(r) {
      if (!r) console.log("Failing update at : updateResult updateMatin"); //console.log( "posting update for wall...", wall );

      if (r) if (!walls.find(w => w === wall)) walls.push(wall);
      _classPrivateFieldGet(wall, _flags2).bUpdating = false;
      result.status = result.status && r;
      return result;
    }

    var pls = this.line;
    var AdjustPass = 0;
    let pStart, pEnd;
    let ptStart, ptEnd;
    let lsStartSave, lsEndSave;
    let ptOther = new Vector();
    let ptOther2 = new Vector();
    bErrorOK = true; // DUH! 
    // this wall moved, so for all mating lines, update this beast.

    if (_classPrivateFieldGet(this, _flags2).bUpdating) return true; // this is okay - we're just looping backwards.

    _classPrivateFieldGet(this, _flags2).bUpdating = true; //Log( "updateMating("STRSYM(__LINE__)")" );

    if (this.countWalls() < 4) {
      // with a triangular configuration it looks like peers intersect
      bErrorOK = true;
    } //Log( "updateMating("STRSYM(__LINE__)")" );


    const wall = this;

    if (!bLockSlope) {
      let plsStart, plsEnd;
      let redo = true;

      while (redo) {
        redo = false;
        ptStart = wall.line.ptFrom;

        if (isNaN(ptStart.x)) {
          console.trace("Wall from is already bad.", ptStart, wall.line);
        }

        ptEnd = wall.line.ptTo; //Readjust:   

        pStart = wall.start;
        pEnd = wall.end;
        plsStart = pStart.line;
        plsEnd = pEnd.line;
        lsStartSave = new Line({
          line: pStart.line
        });
        lsEndSave = new Line({
          line: pEnd.line
        }); // check opposite any other walls other than those 
        // directly related for.. intersection with this line
        // which I intended to move.

        if (!bErrorOK) {
          let pCur = pWall;
          let plsCur;
          let priorend = [true];
          let r;

          do {
            plsCur = pCur.line;

            if (pCur != pStart && pCur != pWall && pCur != pEnd) {
              if (r = FindIntersectionTime(pls.r.n, pls.r.o, plsCur.r.n, plsCur.r.o)) {
                if (r.t1 >= pls.from && r.t1 <= pls.to && r.t2 >= plsCur.from && r.t2 <= plsCur.to) return UpdateResult(false);
              }
            }

            pCur = pCur.next(priorend);
          } while (pCur != pWall);
        }

        if (pWall.start_at_end) {
          //console.log( "111111111111111111111111111111111111" );
          // compute start point..
          if (!_classPrivateFieldGet(pStart, _flags2).bUpdating) {
            // compute original end of this line
            ptOther.set(pWall.start.to); // if original end != new end 

            if (!Near(ptOther, ptStart)) {
              ptOther.set(pWall.start.from);
              plsStart.from = -0.5;
              plsStart.to = 0.5;
              plsStart.r.o.set(ptOther2.add(ptStart, ptOther).scale(0.5));
              plsStart.r.n.set(ptOther.sub(ptStart, ptOther));
              if (!ptOther.x && !ptOther.y && !ptOther.z) debugger; //DrawLineSeg( plsStart, Color( 0, 0, 255 ) );

              walls.push(pStart);

              if (pStart.into) {
                _classPrivateFieldGet(pStart, _flags2).bUpdating = true;

                if (!pStart.into.updateMating(walls, false
                /*bLockSlope*/
                , bErrorOK)) {
                  _classPrivateFieldGet(pStart, _flags2).bUpdating = false;
                  plsStart.set(lsStartSave);
                  return UpdateResult(false);
                }

                _classPrivateFieldGet(pStart, _flags2).bUpdating = false;
              }
            }
          }
        } else // ( !pWall.start_at_end )
          {
            //console.log( "22222222222222222222222222222222222222222" );
            // compute end point..
            if (!_classPrivateFieldGet(pStart, _flags2).bUpdating) {
              // compute original end of this line
              ptOther.set(wall.start.from);

              if (!Near(ptOther, ptStart)) {
                ptOther.set(pWall.start.to);
                plsStart.from = -0.5;
                plsStart.to = 0.5;
                ptOther2.add(ptOther, ptStart).scale(0.5);
                plsStart.r.o.set(ptOther2); //SetPoint( plsStart.r.o, ptOther );

                ptOther.sub(ptOther, ptStart);
                plsStart.r.n.set(ptOther); //DrawLineSeg( plsStart, Color( 0, 0, 255 ) );

                walls.push(pStart);

                if (pStart.into) {
                  _classPrivateFieldGet(pStart, _flags2).bUpdating = true;

                  if (!pStart.into.updateMating(walls, false
                  /*bLockSlope*/
                  , bErrorOK)) {
                    pStart.flags.bUpdating = false;
                    plsStart.set(lsStartSave);
                    return UpdateResult(false);
                  }

                  _classPrivateFieldGet(pStart, _flags2).bUpdating = false;
                }
              }
            }
          } //Log( "updateMating("STRSYM(__LINE__)")" );


        if (pWall.end_at_end) {
          //console.log( "333333333333333333333333333333333" );
          if (!_classPrivateFieldGet(pEnd, _flags2).bUpdating) {
            // compute original end of this line
            ptOther.set(pWall.end.to); // if original end != new end 

            if (!Near(ptOther, ptEnd)) {
              ptOther.set(pWall.end.from);
              plsEnd.from = -0.5;
              plsEnd.to = 0.5;
              ptOther2.add(ptOther, ptEnd).scale(0.5);
              plsEnd.r.o.set(ptOther2);
              ptOther.sub(ptEnd, ptOther);
              if (!ptOther.x && !ptOther.y && !ptOther.z) debugger;
              plsEnd.r.n.set(ptOther); //DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );

              walls.push(pEnd);

              if (pEnd.into) {
                _classPrivateFieldGet(pEnd, _flags2).bUpdating = true;

                if (!pEnd.into.updateMating(walls, false
                /*bLockSlope*/
                , bErrorOK)) {
                  _classPrivateFieldGet(pEnd, _flags2).bUpdating = false;
                  plsStart.set(lsStartSave);
                  plsEnd.set(lsEndSave);
                  return UpdateResult(false);
                }

                _classPrivateFieldGet(pEnd, _flags2).bUpdating = false;
              }
            }
          }
        } else //(!pWall.end_at_end)
          {
            // compute end point
            //console.log( "44444444444444444444444444444444" );
            if (!_classPrivateFieldGet(pEnd, _flags2).bUpdating) {
              // compute original end of this line
              ptOther.set(pWall.end.from); // if original end != new end 

              if (!Near(ptOther, ptEnd)) {
                // so end is opposite
                ptOther.set(pWall.end.to);
                plsEnd.from = -0.5;
                plsEnd.to = 0.5;
                plsEnd.r.o.set(ptOther2.add(ptOther, ptEnd).scale(0.5));
                ptOther.sub(ptOther, ptEnd);
                if (!ptOther.x && !ptOther.y && !ptOther.z) debugger;
                plsEnd.r.n.set(ptOther); //DrawLineSeg( plsEnd, Color( 0, 0, 255 ) );

                walls.push(pEnd);

                if (pEnd.into) {
                  _classPrivateFieldGet(pEnd, _flags2).bUpdating = true;

                  if (!pEnd.into.updateMating(walls, false
                  /*bLockSlope*/
                  , bErrorOK)) {
                    _classPrivateFieldGet(pEnd, _flags2).bUpdating = false;
                    plsStart.set(lsStartSave);
                    plsEnd.set(lsEndSave);
                    return UpdateResult(false);
                  }

                  _classPrivateFieldGet(pEnd, _flags2).bUpdating = false;
                }
              }
            }
          } // check to see if we crossed the mating lines..
        // if so - uncross them.
        //Log( "updateMating("STRSYM(__LINE__)")" );


        if (!bErrorOK) {
          let r;

          if (r = FindIntersectionTime(plsStart.r.n, plsStart.r.o, plsEnd.r.n, plsEnd.r.o) && r.t1 >= plsStart.from && r.t1 <= plsStart.to && r.t2 >= plsEnd.from && r.t2 <= plsEnd.to) {
            let tmp;

            if (AdjustPass++) {
              console.log("We're dying!");
              return UpdateResult(false);
            }

            tmp = pWall.start_at_end;
            pWall.start_at_end = pWall.end_at_end;
            pWall.end_at_end = tmp;
            {
              let i = pWall.end;
              pWall.end = pWall.start;
              pWall.start = i;
            }
            if (pEnd.start == wall) pEnd.start_at_end = !pEnd.start_at_end;else pEnd.end_at_end = !pEnd.end_at_end;
            if (pStart.start == wall) pStart.start_at_end = !pStart.start_at_end;else pStart.end_at_end = !pStart.end_at_end;
            redo = true;
            continue; //goto Readjust;
          } // need to find some way to limit.. what happens when
          // lines become concave.. how do I detect that simply?
          //


          if (r = FindIntersectionTime(plsStart.r.n, plsStart.r.o, plsEnd.r.n, plsEnd.r.o) && (r.t2 >= plsEnd.from && r.t2 <= plsEnd.to || r.t1 >= plsStart.from && r.t1 <= plsStart.to)) {
            // if either segment intersects the other during itself..
            // then this is an invalid update.. 
            plsStart.set(lsStartSave);
            plsEnd.set(lsEndSave);
            return UpdateResult(false);
          } // this is still insufficient.. and should continue to check
          // remaining segments..

        } //Log( "updateMating("STRSYM(__LINE__)")" );


        _classPrivateFieldGet(this, _sector).dirty = true; //ComputeSectorPointList( iWorld, pWall.iSector, NULL );
        //ComputeSectorOrigin( iWorld, pWall.iSector );
        //MarkSectorUpdated( iWorld, pWall.iSector );
      }
    } else {
      let plsStart, plsEnd; // handle updates but keep constant slope on mating lines..
      // check intersect of current with every other line in the
      // sector - prevents intersection of adjoining

      pStart = pWall.start;
      pEnd = pWall.end;
      plsStart = pStart.line;
      plsEnd = pEnd.line;
      {
        let pCur = pWall;
        let plsCur;
        let priorend = [true];
        let r;

        do {
          plsCur = pCur.line;

          if (pCur != pStart && pCur != pWall && pCur != pEnd) {
            if (r = FindIntersectionTime(pls.r.n, pls.r.o, plsCur.r.n, plsCur.r.o)) {
              if (r.t1 >= pls.from && r.t1 <= pls.to && r.t2 >= plsCur.from && r.t2 <= plsCur.to) return UpdateResult(false);
            }
          }

          pCur = pCur.next(priorend);
        } while (pCur != pWall);
      }
      {
        let r; // sigh - moved line.. update end factors
        // of intersecting lines..

        if (r = FindIntersectionTime(pls.r.n, pls.r.o, plsStart.r.n, plsStart.r.o)) {
          pls.from = r.t1;
          if (pWall.start_at_end) plsStart.to = r.t2;else plsStart.from = r.t2;
          pWall.start.updateMating(walls, false, true);
        } else {
          console.log("Failed to intersect wall with iWallStart %s(%d)", "classes.mjs", 0);
          return UpdateResult(false);
        }

        if (r = FindIntersectionTime(pls.r.n, pls.r.o, plsEnd.r.n, plsEnd.r.o)) {
          pls.to = r.t1;
          if (pWall.end_at_end) plsEnd.to = r.t2;else plsEnd.from = r.t2;
          pWall.end.updateMating(walls, false, true);
        } else {
          console.log("Failed to intersect wall with iWallStart %s(%d)", "classes.mjs", 0);
          return UpdateResult(false);
        }
      }
    }

    if (pWall.into) {
      // only the orogiinal slopes can be locked..
      // the mating sector might have to move his wall slope.
      if (!pWall.into.updateMating(walls, false
      /*bLockSlope*/
      , bErrorOK)) return UpdateResult(false);
    } // posts line update too.
    //ServerBalanceALine( iWorld, pWall.iLine );
    //ServerBalanceALine( iWorld, pStart.iLine );
    //ServerBalanceALine( iWorld, pEnd.iLine );


    _classPrivateFieldGet(pWall, _sector).dirty = true;
    return UpdateResult(true);
  }

  move(x, y, lock) {
    this.line.r.o.x += x;
    this.line.r.o.y += y;
    const walls = [];
    this.updateMating(walls, true, false);

    for (let wall of walls) wall.line.on("update", wall.line);
  }

  turn(x, y, lock) {
    this.line.r.n.x += x;
    this.line.r.n.y += y;
    const walls = [];
    this.updateMating(walls, true, false);
    this.line.on("update", this.line);

    for (let wall of walls) wall.line.on("update", wall.line);
  }

  setStart(x, y, lock) {
    const startWas = this.from;
    const endWas = this.to;
    const newX = startWas.x + x;
    const newY = startWas.y + y;
    const newZ = startWas.z + 0;
    this.line.r.o.x = (newX + endWas.x) / 2;
    this.line.r.o.y = (newY + endWas.y) / 2;
    this.line.r.o.z = (newZ + endWas.z) / 2;
    this.line.from = -0.5;
    this.line.to = 0.5;
    this.line.r.n.x = endWas.x - newX;
    this.line.r.n.y = endWas.y - newY;
    this.line.r.n.z = endWas.z - newZ;
    const walls = [];

    if (this.updateMating(walls, lock, false)) {
      //console.log( "Update list:", walls.length );
      for (let wall of walls) {
        //console.log( "Sending wall ", wall.id );
        wall.line.on("update", wall.line);
      }
    } //console.log( "LINE RESULT after:", this.line.r, this.line );

  }

  setEnd(x, y, lock) {
    const startWas = this.from;
    const endWas = this.to;
    const newX = endWas.x + x;
    const newY = endWas.y + y;
    const newZ = endWas.z + 0;
    this.line.r.o.x = (startWas.x + newX) / 2;
    this.line.r.o.y = (startWas.y + newY) / 2;
    this.line.r.o.z = (startWas.z + newZ) / 2;
    this.line.from = -0.5;
    this.line.to = 0.5;
    this.line.r.n.x = newX - startWas.x;
    this.line.r.n.y = newY - startWas.y;
    this.line.r.n.z = newZ - startWas.z;
    const walls = [];

    if (this.updateMating(walls, lock, false)) {
      //console.log( "Update list2:", walls.length );
      for (let wall of walls) wall.line.on("update", wall.line);
    }
  }

} //--------------------------------------------


class SectorSet extends Pool {
  constructor(parent) {
    super(parent, Sector);
  }

}

class SectorMsg {
  constructor() {
    _defineProperty(this, "sector", localParseState.world.getSector());
  }

}

function buildSectorfromJSOX(field, val) {
  try {
    if (!field) {
      this.sector.dirty = true;
      return this.sector;
    } else {
      if (field === "id") {
        this.sector.id = val;
        return undefined;
      }

      if (field === "name") {
        this.sector.name = val;
        return undefined;
      }

      if (field === 'r') return this.sector.r = val; // have to replace this.

      if (field === "texture") {
        this.sector.texture = val;
        return undefined;
      }

      if (field === "wall") {
        this.sector.wall = val;
        return undefined;
      } //if( field === "flags" ) { return this.sector.flags; }


      console.log("GET:", field);
      return val;
    }
  } catch (err) {
    console.log("Failure in sector reviver:", err);
  }
}

var _flags3 = new WeakMap();

var _world = new WeakMap();

var _pointlist = new WeakMap();

var _facet = new WeakMap();

var _set3 = new WeakMap();

var _ComputePointList = new WeakSet();

class Sector extends PoolMember {
  // processed point list..
  set(opts) {
    if ("id" in opts) {
      this.r.set(opts.r);
      if (this.name === null) this.name = null;else this.name = this.parent.names[this.name];
      _classPrivateFieldGet(this, _flags3).dirty = true;
      return;
    }

    if ("undefined" !== typeof opts.normal) {
      this.r.n.x = opts.normal.x;
      this.r.n.y = opts.normal.y;
      this.r.n.z = opts.normal.z;
    }

    if (!opts.firstWall) throw new Error("Sector initialization requires a wall.");
    (this.wall = opts.firstWall).sector = this;
  }

  constructor(set, opts) {
    super(set);

    _ComputePointList.add(this);

    _flags3.set(this, {
      writable: true,
      value: {
        bBody: false,
        bStaticBody: false,
        bOpenShape: false,
        // should be drawn with lines not filled polygons (line/curve)
        dirty: false
      }
    });

    _defineProperty(this, "name", null);

    _defineProperty(this, "wall", null);

    _defineProperty(this, "r", new Ray());

    _defineProperty(this, "texture", null);

    _world.set(this, {
      writable: true,
      value: null
    });

    _pointlist.set(this, {
      writable: true,
      value: []
    });

    _facet.set(this, {
      writable: true,
      value: null
    });

    _set3.set(this, {
      writable: true,
      value: null
    });

    {
      _classPrivateFieldSet(this, _set3, set);

      if (opts) {
        this.set(opts); // set set set and #set - great naming scheme.

        if ("undefined" !== typeof opts.x) {
          this.r.o.x = opts.x;
          this.r.o.y = opts.y;
        }
      }
    }
  }

  has(wall) {
    const start = this.wall;
    let test = start;
    let fromEnd = [true];

    do {
      if (wall === test) return true;
      test = test.next(fromEnd);
    } while (test !== start);
  }

  set dirty(val) {
    _classPrivateFieldGet(this, _flags3).dirty = true;
    this.on("smudge");
  }

  toJSOX() {
    // right now only the ogrigin changes
    // but we don't want to send everything chagnes all the time?		
    return JSOX$1.stringify({
      id: this.id,
      r: this.r,
      t: this.texture && this.texture.id,
      n: this.name && this.name.id,
      w: this.wall && this.wall.id
    });
  }

  checkWalls() {
    const start = this.wall;
    let check = this.wall;
    const priorEnd = [false];

    do {
      const p1 = check.line.ptFrom;
      const p2 = check.line.ptTo;
      let e1, e2;

      if (check.start_at_end) {
        e1 = check.start.line.ptTo;
      } else {
        e1 = check.start.line.ptFrom;
      }

      if (check.end_at_end) {
        e2 = check.end.line.ptTo;
      } else {
        e2 = check.end.line.ptFrom;
      }

      if (!Near(p1, e1)) throw new Error("wall start is not mated correctly:" + check.id + ";" + check + '\nP1:' + p1 + '\nE1:' + e1 + "\nOther:" + check.end.id);
      if (!Near(p2, e2)) throw new Error("wall end is not mated correctly:" + check.id + ";" + check + '\nP2:' + p2 + '\nE2:' + e2 + "\nOther:" + check.end.id);
      check = check.next(priorEnd);
    } while (check != start);
  }

  get points() {
    if (_classPrivateFieldGet(this, _flags3).dirty) _classPrivateMethodGet(this, _ComputePointList, _ComputePointList2).call(this);
    return _classPrivateFieldGet(this, _pointlist);
  }

  get origin() {
    if (_classPrivateFieldGet(this, _flags3).dirty) _classPrivateMethodGet(this, _ComputePointList, _ComputePointList2).call(this);
    return this.r.o;
  }

  contains(p) {
    // this routine is perhaps a bit excessive - if one set of 
    // bounding lines is found ( break; ) we could probably return true
    let pStart, pCur;
    const norm = new Vector();
    let plsCur;
    let even = 0,
        odd = 0;
    let priorend = [true];
    const pSector = this;
    pCur = pStart = pSector.wall; //lprintf( "------ SECTOR %d --------------", n );

    if (NearValue(p, this.r.o)) {
      //lprintf( ".." );
      return pSector;
    }

    norm.sub(p, this.r.o);

    do {
      plsCur = pCur.line;
      const r = FindIntersectionTime(norm, this.r.o, plsCur.r.n, plsCur.r.o);

      if (r) {
        // if T1 < 1.0 or T1 > -1.0 then the intersection is not
        // beyond the end of this line..  which I guess if the origin is skewed
        // then one end or another may require success at more than the distance
        // from the origin to the line..
        //Log4( "Intersected at %g %g %g . %g", T1, T2,
        //	  plsCur.from, plsCur.to );
        if (r.t2 >= plsCur.from && r.t2 <= plsCur.to || r.t2 >= plsCur.to && r.t2 <= plsCur.from) {
          if (r.t1 > 1.0) even = 1;else if (r.t1 < -1.0) // less than zero - that's the point of the sector origin..
            odd = 1;
          if (even && odd) return true;
        }
      }

      pCur = pCur.next(priorend);
    } while (pCur !== pStart);

    return false;
  }

  findWall(n, o) {
    let pStart, pCur;
    let priorend = [true];
    pCur = pStart = this.wall; //Log( "------- FindIntersectingWall ------------ " );

    do {
      let plsCur = pCur.line;
      let r;

      if (r = FindIntersectionTime(n, o, plsCur.r.n, plsCur.r.o)) {
        if (drawLine) drawLine(n, o, 0.9, 1.1, 'rgb(255,0,0)'); //console.log( "Intersects somewhere.. %d<%d<%d %d<%d<%d", 0.0
        //         , r.t1, 1.0, plsCur.from, r.t2, plsCur.to );

        if (-1 <= r.t1 && r.t1 <= 1 && plsCur.from <= r.t2 && r.t2 <= plsCur.to) {
          return pCur;
        }
      }

      pCur = pCur.next(priorend);
    } while (pCur != pStart);

    return null;
  }

  move(x, y, lock) {
    const pStart = this.wall;
    let pCur = pStart;
    let priorend = [true];

    do {
      const o = pCur.line.r.o; //console.log( "Moving sector's line:", x, y );

      o.x += x;
      o.y += y;
      pCur = pCur.next(priorend);
    } while (pCur != pStart);

    const walls = [];

    do {
      pCur.updateMating(walls, lock, false);
      pCur = pCur.next(priorend);
    } while (pCur != pStart); //console.log( "Resulting move moved", walls.length, "walls" );


    for (let wall of walls) {
      //console.log( "update wall...", wall );
      wall.line.on('update'); //wall.set.on( 'update', wall );
    }

    this.on('update');
    return walls;
  }

} //--------------------------------------------

/*
typedef struct body_tag {
   // list of methods which are called when body is stepped in time.
	PLIST peripheral_tick;
	PTRANSFORM motion; // my current inertial frame;
   INDEX iSector; // sector in world which is me.
} FLATLANDER_BODY, *PFLATLANDER_BODY;
*/
//--------------------------------------------


var _ComputePointList2 = function _ComputePointList2() {
  const temp = new Vector();
  let plsCur;
  let npoints = 0;
  let pStart, pCur;
  let pt;
  let priorend = [true];
  pCur = pStart = this.wall;

  do {
    plsCur = pCur.line; //

    if (priorend[0]) pt = plsCur.ptTo;else pt = plsCur.ptFrom;
    temp.sum(pt);
    npoints++;
    pCur = pCur.next(priorend);
  } while (pCur != pStart && pCur);

  temp.scale(1.0 / npoints);
  this.r.o.set(temp);
};

const undoOperations = {
  create: {
    sector: 0,
    wall: 0,
    label: 0
  },
  delete: {
    sector: 0,
    wall: 0,
    label: 0
  },
  set: {
    sector: 0,
    wall: 0,
    label: 0
  }
};

function setEnum() {
  let n = 1;
  const k1 = Object.keys(undoOperations);

  for (let k of k1) {
    const here = undoOperations[k];
    const k2 = Object.keys(here);

    for (let k of k2) {
      here[k] = n++;
    }
  }
}

setEnum();

class UndoRecord {
  constructor() {
    _defineProperty(this, "type", 0);

    _defineProperty(this, "data", null);

    _defineProperty(this, "next", null);
  }

}
/*
struct flagset
{
		uint32_t num;
		uint32_t *flags;
};

struct all_flagset
{
	struct flagset lines;
	struct flagset walls;
	struct flagset sectors;
	struct flagset names;
	struct flagset textures;
	FLAGSET( deleteset, 5 ); // count of sets to delete entirely.
};
*/


var _lines = new WeakMap();

var _walls = new WeakMap();

var _sectors = new WeakMap();

var _names = new WeakMap();

var _textures = new WeakMap();

var _firstUndo = new WeakMap();

var _firstRedo = new WeakMap();

var _events2 = new WeakMap();

class World {
  get lineSet() {
    return _classPrivateFieldGet(this, _lines);
  }

  get lines() {
    return _classPrivateFieldGet(this, _lines).array;
  }

  get wallSet() {
    return _classPrivateFieldGet(this, _walls);
  }

  get walls() {
    return _classPrivateFieldGet(this, _walls).array;
  }

  get sectorSet() {
    return _classPrivateFieldGet(this, _sectors);
  }

  get sectors() {
    return _classPrivateFieldGet(this, _sectors).array;
  }

  get nameSet() {
    return _classPrivateFieldGet(this, _names);
  }

  get names() {
    return _classPrivateFieldGet(this, _names).array;
  }

  get textureSet() {
    return _classPrivateFieldGet(this, _textures);
  }

  get textures() {
    return _classPrivateFieldGet(this, _textures).array;
  }

  constructor(msg) {
    _lines.set(this, {
      writable: true,
      value: new LineSet(this)
    });

    _walls.set(this, {
      writable: true,
      value: new WallSet(this)
    });

    _sectors.set(this, {
      writable: true,
      value: new SectorSet(this)
    });

    _names.set(this, {
      writable: true,
      value: new NameSet(this)
    });

    _textures.set(this, {
      writable: true,
      value: new TextureSet(this)
    });

    _defineProperty(this, "bodies", []);

    _firstUndo.set(this, {
      writable: true,
      value: null
    });

    _firstRedo.set(this, {
      writable: true,
      value: null
    });

    _defineProperty(this, "name", null);

    _events2.set(this, {
      writable: true,
      value: {}
    });

    if (msg instanceof WorldMsg) {
      //this.#lines = msg.lines;
      //this.#walls = msg.walls;
      //this.#sectors = msg.sectors;
      //this.#names = msg.names
      this.name = msg.name;
      return;
    }
  }

  createSector(wall, x, y) {
    const w = this.getWall({
      mating: wall
    });
    const sector = this.getSector({
      firstWall: wall
    });
  }

  getLine(opts) {
    return _classPrivateFieldGet(this, _lines).get(opts);
  }

  getWall(opts) {
    return _classPrivateFieldGet(this, _walls).get(opts);
  }

  getTexture(opts) {
    return _classPrivateFieldGet(this, _textures).get(opts);
  }

  getSector(opts) {
    return _classPrivateFieldGet(this, _sectors).get(opts);
  }

  createSquareSector(x, y) {
    const wall1 = this.getWall({
      world: this,
      start: null,
      startAtEnd: false,
      end: null,
      endAtEnd: false,
      using: new Ray(new Vector(x - 5, 0), new Vector(0, 1))
    });
    const sector = this.getSector({
      firstWall: wall1,
      normal: new Vector(0, 0, 1)
    });
    const wall2 = this.getWall({
      world: this,
      start: wall1,
      startAtEnd: true,
      end: null,
      endAtEnd: false,
      using: new Ray(new Vector(0, y + 5, 0), new Vector(1, 0))
    });
    const wall3 = this.getWall({
      world: this,
      start: wall1,
      startAtEnd: false,
      end: null,
      endAtEnd: true,
      using: new Ray(new Vector(0, y - 5, 0), new Vector(1, 0))
    });
    this.getWall({
      world: this,
      start: wall3,
      startAtEnd: true,
      end: wall2,
      endAtEnd: true,
      using: new Ray(new Vector(x + 5, 0), new Vector(0, 1))
    });
    sector.checkWalls();
    const texture = this.getTexture(this.getName("Default"));
    if (!texture.flags.bColor) texture.SetSolidColor(AColor());
    sector.texture = texture; //MarkSectorUpdated( iWorld, iSector );
  }

  getName(name) {
    return _classPrivateFieldGet(this, _names).get({
      name: name
    });
  }

  getSectorAround(o) {
    for (let sector of this.sectors) {
      if (sector.contains(o)) return sector;
    }
  }

  moveSector(id, x, y, lock) {
    const sector = this.sectors[id];
    console.log("move sector:", sector, id, x, y);
    const walls = sector.move(x, y, lock); //console.log( "TRIGGER UPDATE", walls, this.#events );

    if (walls.length) this.on("update");
  }

  on(event, data, data2) {
    if ("function" === typeof data) {
      const newEvent = {
        cb: data,
        param: data2
      };
      if (event in _classPrivateFieldGet(this, _events2)) _classPrivateFieldGet(this, _events2)[event].push(newEvent);else _classPrivateFieldGet(this, _events2)[event] = [newEvent];
    } else {
      try {
        if (event in _classPrivateFieldGet(this, _events2)) {
          _classPrivateFieldGet(this, _events2)[event].forEach(cb => cb.cb.call(cb.param, data, data2));
        }
      } catch (err) {
        console.log("Callback event threw an error", err);
      }
    }
  }

  toJSOX(stringifier) {
    const msg = {
      names: _classPrivateFieldGet(this, _names).toObject(),
      sectors: _classPrivateFieldGet(this, _sectors).toObject(),
      walls: _classPrivateFieldGet(this, _walls).toObject(),
      lines: _classPrivateFieldGet(this, _lines).toObject()
    }; //console.log( "PARAM:", stringifier );
    //console.log( "Stringifying mirror world" );

    return stringifier.stringify(msg);
  }
  /*
  	POBJECT object;
  
  	PDATAQUEUE UpdatedLines;
  	CRITICALSECTION csDeletions;
  	struct all_flagset deletions;
  */


}

World.fromJSOX = function (field, val) {
  if (!field) {
    if (this instanceof WorldMsg) {
      console.log("Create new world from world message");
      return new World(this);
    }
  } else {
    this[field] = val;
    return undefined;
  }
};

World.toJSOX = function (stringifier) {
  return this.toJSOX(stringifier);
};

class WorldMsg {
  constructor() {
    _defineProperty(this, "world", new World());

    _defineProperty(this, "names", null);

    _defineProperty(this, "sectors", null);

    _defineProperty(this, "walls", null);

    _defineProperty(this, "lines", null);

    localParseState.world = this.world;
  }

}

function buildWorldfromJSOX(field, val) {
  //console.log( "FIELD:", field );
  if (!field) {
    return this.world;
  }

  return val; //this.world[field]  /// element allocation comes directly from the correct arrays anyway.
}
/*
World.revive = function(field,val) {
	if( field ) {
		return val;
	}else {
		return this;
	}
}
*/


const classes = {
  World: World,
  Sector: Sector,
  Wall: Wall,
  Line: Line,
  Name: Name,
  Texture: Texture,
  UndoRecord: UndoRecord,

  setDecoders(jsox) {
    jsox.fromJSOX("~Wr", WorldMsg, buildWorldfromJSOX);
    jsox.fromJSOX("~S", SectorMsg, buildSectorfromJSOX);
    jsox.fromJSOX("~Wl", WallMsg, buildWallfromJSOX);
    jsox.fromJSOX("~L", LineMsg, buildLinefromJSOX);
    jsox.fromJSOX("~N", NameMsg, buildNamefromJSOX);
    jsox.fromJSOX("~T", TextureMsg, buildTexturefromJSOX);
    jsox.fromJSOX("v3", Vector);
    jsox.fromJSOX("r", Ray);
  },

  setEncoders(jsox) {
    jsox.toJSOX("~Wr", World, World.toJSOX);
    jsox.toJSOX("~S", Sector
    /*, sectorToJSOX*/
    );
    jsox.toJSOX("~Wl", Wall, wallToJSOX);
    jsox.toJSOX("~L", Line);
    jsox.toJSOX("~N", Name);
    jsox.toJSOX("~T", Texture);
    jsox.toJSOX("v3", Vector);
    jsox.toJSOX("r", Ray);
  },

  setDrawLine(d) {
    drawLine = d;
  }

};
const surface = document.getElementById("testSurface");
const app = document.getElementById("AppContainer");
const parser = JSOX$1.begin(processMessage);
classes.setDecoders(JSOX$1);
const localStorage$1 = window.localStorage || {
  getItem(a) {
    return undefined;
  }

};
const l = {
  world: null,
  canvas: null,
  scale: 0.05,
  ws: null,
  // active connection to server.
  worldCtx: null,
  // world editor default context
  refresh: false,
  xOfs: 0,
  yOfs: 0,
  w: 0,
  h: 0,
  cursor: newImage("cursor.png"),
  cursorSpot: {
    x: 5,
    y: 5
  }
};

function openSocket() {
  var ws = new WebSocket((location.protocol === "http:" ? "ws://" : "wss://") + location.host + "/", "Flatland");

  ws.onopen = function () {
    // Web Socket is connected. You can send data by send() method.
    //ws.send("message to send"); 
    l.ws = ws;
    l.ws.send('{op:worlds}');
  };

  ws.onmessage = function (evt) {
    parser.write(evt.data);
    dispatchChanges();
  };

  ws.onclose = function () {
    l.ws = null;
    setTimeout(openSocket, 5000); // 5 second delay.

    if (l.editor) {
      l.editor.remove();
      l.editor = null;
      l.canvas = null;
    } // websocket is closed. 

  };
} //----------- World Selector ------------------------------


function selectWorld(worldList) {
  const selector = new popups.create("Select World", app);
  const rows = [];
  selector.addWorld = addWorld;
  selector.delWorld = delWorld;

  function delWorld(world) {
    for (let row of rows) {
      if (row.world.name === world.name) {
        console.log("Delete world?");
        row.row.remove();
        break;
      }
    }
  }

  function addWorld(world) {
    const row = document.createElement("div");
    rows.push({
      row: row,
      world: world
    });
    row.style.display = "table-row";
    const name = document.createElement("span");
    name.textContent = world.name;
    name.style.display = "table-cell";
    row.appendChild(name);
    const delWorld = popups.makeButton(row, "X", (world => () => {
      row.remove(); //selector.deleteItem( row );

      l.ws.send(JSOX$1.stringify({
        op: 'deleteWorld',
        world: world,
        user: localStorage$1.getItem("userId") || "AllowMe"
      })); //selector.hide();
    })(world));
    delWorld.style.display = "table-cell";
    delWorld.style.float = "right";
    const open = popups.makeButton(row, "Open", (world => () => {
      l.ws.send(JSOX$1.stringify({
        op: 'world',
        world: world
      }));
      selector.hide();
    })(world));
    open.style.display = "table-cell";
    open.style.float = "right";
    selector.appendChild(row);
  }

  for (let world of worldList) {
    addWorld(world);
  }

  {
    const row = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = "New World";
    name.style.display = "table-cell";
    row.style.display = "table-row";
    row.appendChild(name);
    const open = popups.makeButton(row, "New", () => {
      selector.hide();
      const question = popups.simpleForm("Enter new world name", "Name:", "My World", val => {
        l.ws.send(JSOX$1.stringify({
          op: 'create',
          sub: "world",
          name: val
        }));
        question.remove(); //selector.remove();
      }, () => {});
      question.show();
    });
    open.style.display = "table-cell";
    open.style.float = "right";
    selector.appendChild(row);
  }
  selector.show();
  return selector;
} //------------------------------------------------------------------


const selectedHotSpot = "rgb(255,255,0)";
const wallOriginColor = "rgb(0,0,127)";
const unselectedSectorStroke = "rgb(128,45,25)";
const selectedSectorStroke = "rgb(0,127,0)";
const selectedWallStroke = "rgb(0,0,127)";
const unselectedWallStroke = "rgb(0,127,0)";

function DISPLAY_SCALE(x) {
  return x / l.scale;
}

function DISPLAY_X(x) {
  return DISPLAY_SCALE(x + l.xOfs);
}

function DISPLAY_Y(y) {
  return DISPLAY_SCALE(y + l.yOfs);
}

function REAL_SCALE(x) {
  return x * l.scale;
}

function REAL_X(x) {
  return REAL_SCALE(x) - l.xOfs;
}

function REAL_Y(y) {
  return REAL_SCALE(y) - l.yOfs;
}

const Near$1 = (a, b, d) => a && b && Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d && Math.abs(a.z - b.z) < d;

const tmp = new Vector();
const editorState = {
  lockLineOrigin: false,
  lockCreate: false,
  lockSlope: false
};
let mouse = {
  pos: new Vector(),
  rpos: new Vector(),

  set x(a) {
    return this.pos.x;
  },

  set y(a) {
    return this.pos.y;
  },

  drag: false,
  delxaccum: 0,
  delyaccum: 0,
  mouseLock: {
    to: null,
    // text name of value
    drag: false,
    // is dragging
    near: null // vector that is where this is

  },
  CurSecOrigin: null,
  CurOrigin: null,
  CurSlope: null,
  CurEnds: [null, null],
  CurSector: null,
  CurSectors: [],
  CurWall: null,
  CurWalls: [] //, 
  ,
  flags: {
    bSectorOrigin: false,
    bOrigin: false,
    bSlope: false,
    bEndStart: false,
    bEndEnd: false,
    bLocked: false,
    bSelect: false,
    bMarkingMerge: false,
    bSectorList: false,
    bWwallList: false,
    bNormalMode: false
  },

  isNear(o, n) {
    if (mouse.mouseLock.near) {
      if (!mouse.mouseLock.drag && !Near$1(mouse.mouseLock.near, o, REAL_SCALE(mouse.mouseLock.del))) {
        mouse.mouseLock.near = null;
      }
    } else {
      if (Near$1(o, mouse.CurSecOrigin, REAL_SCALE(10))) {
        mouse.mouseLock.near = mouse.CurSecOrigin;
        mouse.mouseLock.to = "CurSecOrigin";
        mouse.mouseLock.del = 30;
      }

      if (Near$1(o, mouse.CurEnds[0], REAL_SCALE(10))) {
        mouse.mouseLock.near = mouse.CurEnds[0];
        mouse.mouseLock.to = "CurEnds[0]";
        mouse.mouseLock.del = 30;
      }

      if (Near$1(o, mouse.CurEnds[1], REAL_SCALE(10))) {
        mouse.mouseLock.near = mouse.CurEnds[1];
        mouse.mouseLock.to = "curEnds[1]";
        mouse.mouseLock.del = 30;
      }

      if (Near$1(o, mouse.CurSlope, REAL_SCALE(10))) {
        mouse.mouseLock.near = mouse.CurSlope;
        mouse.mouseLock.to = "CurSlope";
        mouse.mouseLock.del = 30;
      }

      if (Near$1(o, mouse.CurOrigin, REAL_SCALE(10))) {
        mouse.mouseLock.near = mouse.CurOrigin;
        mouse.mouseLock.to = "CurOrigin";
        mouse.mouseLock.del = 30;
      }
    }
  },

  drawNear(o, n) {
    if (mouse.mouseLock && mouse.mouseLock.near) {
      tmp.sub(o, mouse.mouseLock.near);
      DrawLine(tmp, mouse.mouseLock.near, 0, 1.0, "rgb(255,255,255)");
    }
  }

};

function DrawLine(d, o, from, to, c) {
  const ctx = l.worldCtx;
  ctx.beginPath();
  ctx.strokeStyle = c;
  ctx.moveTo(DISPLAY_X(o.x + d.x * from), DISPLAY_Y(o.y + d.y * from));
  ctx.lineTo(DISPLAY_X(o.x + d.x * to), DISPLAY_Y(o.y + d.y * to));
  ctx.stroke();
}

classes.setDrawLine(DrawLine);

function canvasRedraw() {
  const ctx = l.worldCtx;
  ctx.clearRect(0, 0, l.w, l.h);
  DrawDisplayGrid(); //	ctx.

  mouse.drawNear(mouse.rpos);
  mouse.CurSecOrigin = null;

  for (let sector of l.world.sectors) {
    const o = sector.origin;

    if (sector === mouse.CurSector) {
      mouse.CurSecOrigin = o;
      triangle(o.x, o.y, mouse.mouseLock.near === mouse.CurSecOrigin ? selectedHotSpot : selectedSectorStroke);
    } else {
      triangle(o.x, o.y, mouse.mouseLock.near === mouse.CurSecOrigin ? selectedHotSpot : unselectedSectorStroke);
    }

    let start = sector.wall;
    let check = start;
    const priorend = [true];
    let pt = start.from; // draw the walls.

    do {
      ctx.beginPath();

      if (sector === mouse.CurSector) {
        if (check === mouse.CurWall) {
          ctx.strokeStyle = selectedWallStroke;
        } else {
          ctx.strokeStyle = unselectedWallStroke;
        }
      } else if (check === mouse.CurWall) {
        ctx.strokeStyle = selectedWallStroke;
      } else ctx.strokeStyle = "rgb(0,0,0)";

      pt = check.from;
      ctx.moveTo(DISPLAY_X(pt.x), DISPLAY_Y(pt.y));
      pt = check.to;
      ctx.lineTo(DISPLAY_X(pt.x), DISPLAY_Y(pt.y));
      ctx.stroke();
      check = check.next(priorend);
    } while (check != start); // and go back to initial start point

    /*
    ctx.beginPath();
    if( sector === mouse.CurSector ){
    	if( prior === mouse.CurWall )
    		ctx.strokeStyle = selectedWallStroke;
    	else
    		ctx.strokeStyle = unselectedWallStroke;
    } else
    	if( check === mouse.CurWall )
    		ctx.strokeStyle = selectedWallStroke;
    	else
    		ctx.strokeStyle = "rgb(0,0,0)"
    ctx.moveTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
    pt = start.from;
    ctx.lineTo( DISPLAY_X(  pt.x ), DISPLAY_Y( pt.y) );
    ctx.stroke();	
    */
    // draw the icons on the walls


    pt = start.from;
    ctx.beginPath();
    ctx.strokeStyle = "rgb(0,0,0)";
    ctx.moveTo(DISPLAY_X(pt.x), DISPLAY_Y(pt.y));

    do {
      if (check === mouse.CurWall) {
        mouse.CurOrigin = check.line.r.o;
        mouse.CurSlope = check.line.to;
        mouse.CurEnds[0] = check.from;
        mouse.CurEnds[1] = check.to;

        if (editorState.lockLineOrigin) {
          triangle(check.line.r.o.x, check.line.r.o.y, mouse.mouseLock.near === mouse.CurOrigin ? selectedHotSpot : wallOriginColor);
          const end = check.to;
          square(end.x, end.y, mouse.mouseLock.near === check.to ? selectedHotSpot : "rgb(255,255,255)");
          const start = check.from;
          square(start.x, start.y, mouse.mouseLock.near === check.from ? selectedHotSpot : "rgb(255,255,255)");
        } else {
          triangle(check.line.r.o.x, check.line.r.o.y, mouse.mouseLock.near === mouse.CurOrigin ? selectedHotSpot : wallOriginColor);
          const end = check.to;
          square(end.x, end.y, mouse.mouseLock.near === check.to ? selectedHotSpot : "rgb(0,0,0)");
          const start = check.from;
          square(start.x, start.y, mouse.mouseLock.near === check.from ? selectedHotSpot : "rgb(0,0,0)");
        }
      }

      check = check.next(priorend);
    } while (check !== start); // and go back to initial start point

  }

  function DrawDisplayGrid() {
    const GridXUnits = 1; // unit step between lines

    const GridXSets = 10; // bold dividing lines

    const GridYUnits = 1;
    const GridYSets = 10;
    let x, y; //maxx, maxy, miny,, incx, incy, delx, dely, minx
    //let start= Date.now();

    let DrawSubLines, DrawSetLines; // , drawn

    let units, set;
    let rescale = 1.0;
    let drawnSet = false,
        drawnUnit = false;

    do {
      if (DISPLAY_SCALE(GridXUnits * rescale) > 50) {
        rescale /= GridXSets;
        DrawSubLines = false;
        continue;
      }

      DrawSubLines = DrawSetLines = true;
      units = GridXUnits * rescale; // * display->scale;

      if (DISPLAY_SCALE(units) < 5) DrawSubLines = false;
      set = GridXUnits * GridXSets * rescale; // * display->scale;

      if (DISPLAY_SCALE(set) < 5) DrawSetLines = false;
      if (!DrawSubLines) rescale *= GridXSets;
    } while (!DrawSubLines);

    for (x = 0; x < l.w; x++) {
      let real = REAL_X(x);
      let nextreal = REAL_X(x + 1);
      let setdraw, unitdraw;

      if (real > 0) {
        setdraw = Math.floor(nextreal / set) == Math.floor(real / set);
        unitdraw = Math.floor(nextreal / units) == Math.floor(real / units); //Log7( "test: %d %d %d %g %g %d %d", setdraw, unitdraw, x, nextreal, units, (int)(nextreal/units), (int)(real/units) );
      } else {
        setdraw = Math.floor(nextreal / set) != Math.floor(real / set);
        unitdraw = Math.floor(nextreal / units) != Math.floor(real / units); //Log7( "test: %d %d %d %g %g %d %d", setdraw, unitdraw, x, nextreal, units, (int)(nextreal/units), (int)(real/units) );
      }

      if (!setdraw) drawnSet = false;
      if (!unitdraw) drawnUnit = false;

      if (real <= 0 && nextreal >= 0) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.50)";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, l.h * 2);
        ctx.stroke();
        drawnUnit = true;
        drawnSet = true;
      } else if (DrawSetLines && setdraw && !drawnSet) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.375)";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, l.h * 2);
        ctx.stroke();
        drawnSet = true;
        drawnUnit = true;
      } else if (DrawSubLines && unitdraw && !drawnUnit) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1875)";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, l.h * 2);
        ctx.stroke();
        drawnUnit = true;
      }
    }
    /*
    if( dotiming ) 
    {
    	Log3( "%s(%d): %d Vertical Grid", __FILE__, __LINE__, GetTickCount() - start );
    	start = GetTickCount();
    }  
    */


    drawnSet = drawnUnit = false;
    rescale = 1.0;

    do {
      if (DISPLAY_SCALE(GridYUnits * rescale) > 50) {
        rescale /= GridYSets;
        DrawSubLines = false;
        continue;
      }

      DrawSubLines = DrawSetLines = true;
      units = GridYUnits * rescale; // * display->scale;

      if (DISPLAY_SCALE(units) < 5) DrawSubLines = false;
      set = GridYUnits * GridYSets * rescale; // * display->scale;

      if (DISPLAY_SCALE(set) < 5) DrawSetLines = false;
      if (!DrawSubLines) rescale *= GridYSets;
    } while (!DrawSubLines);

    for (y = l.h - 1; y >= 0; y--) //for( y = 0; y < display->pImage->height ; y++ )
    {
      let real = REAL_Y(y);
      let nextreal = REAL_Y(y - 1); //RCOORD nextreal = REAL_Y( display, y+1 );

      let setdraw, unitdraw;

      if (real > 0) {
        setdraw = Math.floor(nextreal / set) == Math.floor(real / set);
        unitdraw = Math.floor(nextreal / units) == Math.floor(real / units);
      } else {
        setdraw = Math.floor(nextreal / set) != Math.floor(real / set);
        unitdraw = Math.floor(nextreal / units) != Math.floor(real / units);
      }

      if (!setdraw) drawnSet = false;
      if (!unitdraw) drawnUnit = false;

      if (real >= 0 && nextreal < 0) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.50)";
        ctx.moveTo(0, y);
        ctx.lineTo(l.w, y);
        ctx.stroke();
        drawnUnit = true;
        drawnSet = true;
      } else if (DrawSetLines && setdraw && !drawnSet) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.375)";
        ctx.moveTo(0, y);
        ctx.lineTo(l.w, y);
        ctx.stroke();
        drawnSet = true;
        drawnUnit = true;
      } else if (DrawSubLines && unitdraw && !drawnUnit) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.1875)";
        ctx.moveTo(0, y);
        ctx.lineTo(l.w, y);
        ctx.stroke();
        drawnUnit = true;
      }
    }
    /*
    if( dotiming )
    {
    	Log3( "%s(%d): %d Horizontal Grid", __FILE__, __LINE__, GetTickCount() - start );
    	start = GetTickCount();
    }
    */

  }

  drawCursor(); // slope

  function triangle(x, y, c) {
    ctx.beginPath();
    ctx.strokeStyle = c || "rgb(0,127,0)";
    ctx.moveTo(DISPLAY_X(x) - 4, DISPLAY_Y(y) + 3);
    ctx.lineTo(DISPLAY_X(x) + 4, DISPLAY_Y(y) + 3);
    ctx.lineTo(DISPLAY_X(x), DISPLAY_Y(y) - 3);
    ctx.lineTo(DISPLAY_X(x) - 4, DISPLAY_Y(y) + 3);
    ctx.stroke();
  }

  function square(x, y, c) {
    ctx.beginPath();
    ctx.strokeStyle = c || "rgb(0,0,127)";
    ctx.moveTo(DISPLAY_X(x) - 3, DISPLAY_Y(y) - 3);
    ctx.lineTo(DISPLAY_X(x) + 3, DISPLAY_Y(y) - 3);
    ctx.lineTo(DISPLAY_X(x) + 3, DISPLAY_Y(y) + 3);
    ctx.lineTo(DISPLAY_X(x) - 3, DISPLAY_Y(y) + 3);
    ctx.lineTo(DISPLAY_X(x) - 3, DISPLAY_Y(y) - 3);
    ctx.stroke();
  }
}

function drawCursor() {
  if (document.pointerLockElement === l.canvas || document.mozPointerLockElement === l.canvas) {
    const near = mouse.mouseLock.near;

    if (near) {
      l.worldCtx.drawImage(l.cursor, DISPLAY_X(near.x) - l.cursorSpot.x, DISPLAY_Y(near.y) - l.cursorSpot.y);
    } else //console.log('The pointer lock status is now locked');
      l.worldCtx.drawImage(l.cursor, mouse.pos.x, mouse.pos.y);
  }
}

function setupMenu() {
  const menu = popups.createMenu();
  menu.addItem("option 1", () => option(1));
  menu.addItem("option 2", () => option(2));
  menu.separate();
  menu.addItem("option 3", () => option(3));
  menu.addItem("option 4", () => option(4));

  function option(n) {
    console.log("trigggered option?", n);
  }

  return menu;
}

function setupWorld(world) {
  const editor = new popups.create("World Editor", app);
  const canvas = l.canvas = document.createElement("canvas");
  const popup = setupMenu();
  canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
  editor.divContent.style.position = "relative";
  canvas.requestPointerLock();
  l.world = world;
  canvas.addEventListener("wheel", evt => {
    evt.preventDefault();

    if (evt.deltaY > 0) {
      const oldx = REAL_X(mouse.pos.x);
      const oldy = REAL_Y(mouse.pos.y);
      l.scale *= 1.1;
      const newx = REAL_X(mouse.pos.x);
      const newy = REAL_Y(mouse.pos.y);
      l.xOfs += newx - oldx;
      l.yOfs += newy - oldy;
      canvasRedraw();
    } else {
      const oldx = REAL_X(mouse.pos.x);
      const oldy = REAL_Y(mouse.pos.y);
      l.scale /= 1.1;
      const newx = REAL_X(mouse.pos.x);
      const newy = REAL_Y(mouse.pos.y);
      l.xOfs += newx - oldx;
      l.yOfs += newy - oldy;
      canvasRedraw();
    }
  });
  canvas.addEventListener("mousedown", evt => {
    evt.preventDefault();
    evt.stopPropagation();

    if (evt.buttons & 2) {
      evt.stopPropagation();
      popup.show(null, evt.clientX, evt.clientY, val => {
        console.log("Popup Value:", val);
      });
    } else {
      var rect = canvas.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      mouse.pos.x = x;
      mouse.pos.y = y;
      mouse.rpos.x = REAL_X(x);
      mouse.rpos.y = REAL_Y(y);

      if (mouse.mouseLock.near) {
        mouse.mouseLock.drag = true;
      } else mouse.drag = true;
    }
  });
  canvas.addEventListener("mousemove", evt => {
    var rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    const delx = x - mouse.pos.x;
    const dely = y - mouse.pos.y;
    let o = new Vector(REAL_X(x), REAL_Y(y), 0);
    let del = new Vector(REAL_SCALE(delx), REAL_SCALE(dely));
    mouse.isNear(o, del);
    canvasRedraw(); //console.log( "Del:", del, delx, dely );

    DrawLine(del, o, -1.0, 1.0, "rgb(255,255,255)");
    if (delx > 0) mouse.delxaccum++;else if (delx < 0) mouse.delxaccum--;
    if (dely > 0) mouse.delyaccum++;else if (dely < 0) mouse.delyaccum--;
    const rx = REAL_SCALE(x - mouse.pos.x);
    const ry = REAL_SCALE(y - mouse.pos.y);

    if (mouse.drag) {
      // this is dragigng the background coordinate system.
      l.xOfs += rx;
      l.yOfs += ry;
    }

    if (mouse.mouseLock.drag && mouse.mouseLock.near) {
      if (mouse.mouseLock.to === "CurSecOrigin") l.ws.send(`{op:move,t:S,id:${mouse.CurSector.id},lock:${editorState.lockSlope},x:${rx},y:${ry}}`);
      if (mouse.mouseLock.to === "CurEnds[0]") l.ws.send(`{op:move,t:e0,id:${mouse.CurWall.id},lock:${editorState.lockSlope},x:${rx},y:${ry}}`);
      if (mouse.mouseLock.to === "curEnds[1]") l.ws.send(`{op:move,t:e1,id:${mouse.CurWall.id},lock:${editorState.lockSlope},x:${rx},y:${ry}}`);
      if (mouse.mouseLock.to === "CurSlope") l.ws.send(`{op:move,t:s,id:${mouse.CurWall.id},lock:${editorState.lockSlope},x:${rx},y:${ry}}`);
      if (mouse.mouseLock.to === "CurOrigin") l.ws.send(`{op:move,t:o,id:${mouse.CurWall.id},lock:${editorState.lockSlope},x:${rx},y:${ry}}`);
    } else {
      if (!(mouse.flags.bMarkingMerge || mouse.flags.bSelect || mouse.flags.bLocked)) {
        function LockTo(what, extratest, boolvar) {
          if (what) if (x > what.x - 4 && x < what.x + 4 && y > what.y - 4 && y < what.y + 4 && extratest) {
            mouse.flags[boolvar] = true;
            mouse.flags.bLocked = true;
            mouse.pos.x = what.x;
            mouse.pos.y = what.y; //SetFrameMousePosition( pc, x, y );

            return true;
          }
          return false;
        }

        if (!(LockTo(mouse.CurSecOrigin, true, 'bSectorOrigin') || LockTo(mouse.CurOrigin, true, 'bOrigin') || LockTo(mouse.CurSlope, editorState.lockLineOrigin, 'bSlope') || LockTo(mouse.CurEnds[0], !editorState.lockLineOrigin, 'CurEnds[0]') || LockTo(mouse.CurEnds[1], !editorState.lockLineOrigin, 'CurEnds[1]'))) if (!mouse.flags.bNormalMode) {
          var pNewWall;
          var ps = null;

          if (!mouse.flags.bSectorList && !mouse.flags.bWallList) {
            var draw = false;

            if (mouse.CurSector) {
              //o.x = REAL_X(  mouse.x );
              //o.y = REAL_Y(  mouse.y );
              //del = new Vector( REAL_SCALE(  delx ), REAL_SCALE(  dely ) );
              //del.scale( 3 );
              //del.y = -del.y;
              //console.log( "DEL:", del, mouse.x, x )
              //DrawLine( 0, del, o, 0, 1, Color( 90, 90, 90 ) );
              pNewWall = mouse.CurSector.findWall(del, o);

              if (pNewWall && pNewWall !== mouse.CurWall) {
                // this bit of code... may or may not be needed...
                // at this point a sector needs to be found
                // before a wall can be found...
                //display->nWalls = 1;
                //display->CurWallList = &mouse.CurWall;
                //console.log( "Set wall:", pNewWall )
                mouse.CurWall = pNewWall; //BalanceALine( mouse.pWorld, GetWallLine( mouse.pWorld, pNewWall ) );

                draw = true;
              }
            } //else
            //	lprintf( "no current sector..." );


            o.x = REAL_X(x);
            o.y = REAL_Y(y);
            if (!(ps = mouse.CurSector) || !ps.contains(o)) ps = l.world.getSectorAround(o);

            if (ps && ps != mouse.CurSector) {
              //console.log( "marking new current sector? " );
              mouse.CurSecOrigin = ps.r.o;
              mouse.CurSector = ps;
              mouse.CurSectors.push(mouse.CurSector);
              mouse.nWalls = 1;
              if (mouse.CurWall && !mouse.CurSector.has(mouse.CurWall)) ;
              mouse.CurWalls.length = 0;
              mouse.CurWalls.push(mouse.CurWall);
              /*
              BalanceALine( mouse.pWorld, mouse.CurWall
               , GetWallLine( mouse.pWorld, mouse.CurWall ) 
               , 
               );
               */

              draw = true;
            } else {
              if (!ps && mouse.CurSector) {
                draw = true;
                mouse.CurSector = null;
                mouse.CurSectors.length = 0;
              }
            }

            if (draw) canvasRedraw();
          }
        }
      }
    }

    mouse.pos.x = x; //mouse.x + (x-mouse.x)/2;

    mouse.pos.y = y; //mouse.y + (y-mouse.y)/2;

    mouse.rpos.x = REAL_X(x);
    mouse.rpos.y = REAL_Y(y);
  });
  canvas.addEventListener("mouseup", evt => {
    mouse.drag = false;
    mouse.mouseLock.drag = false;
  });
  document.body.addEventListener("keydown", evt => {
    console.log("key:", evt);
    cs.value = evt.shiftKey;
    lo.value = evt.ctrlKey;
  });
  document.body.addEventListener("keyup", evt => {
    console.log("key:", evt);
    cs.value = evt.shiftKey;
    lo.value = evt.ctrlKey;
  });
  canvas.addEventListener('contextmenu', function (evt) {
    evt.preventDefault();
    evt.stopPropagation();
    return false;
  });
  l.w = canvas.width = 1024;
  l.h = canvas.height = 768;
  l.xOfs = l.w / 2 * l.scale;
  l.yOfs = l.h / 2 * l.scale;
  l.worldCtx = canvas.getContext("2d");
  editor.appendChild(canvas);
  const toggles = document.createElement("div");
  toggles.style.position = "absolute";
  toggles.style.left = 0;
  toggles.style.top = 0;
  const lo = popups.makeCheckbox(toggles, editorState, "lockLineOrigin", "Lock Origin");
  lo.on("change", canvasRedraw);
  const cs = popups.makeCheckbox(toggles, editorState, "lockCreate", "Create Sector");
  cs.on("change", canvasRedraw);
  const ls = popups.makeCheckbox(toggles, editorState, "lockSlope", "Lock Slopes");
  ls.on("change", canvasRedraw);
  editor.appendChild(toggles);
  canvasRedraw();
  console.log("Okay world data:", world.name);
  return editor;
}

function dispatchChanges() {
  if (l.refresh) {
    canvasRedraw(); //for( let update of l.updates )
    //	update.on( "flush" );
    //l.updates.length = 0;

    l.refresh = false;
  }
}

let selector = null;

function processMessage(msg) {
  if (msg.op === "worlds") {
    if (selector) selector.remove();
    selector = selectWorld(msg.worlds);
  } else if (msg.op === "error") {
    popups.simpleNotice("Error", msg.error, () => {
      selector.show();
    });
  } else if (msg.op === "world") {
    console.log("SETUP");
    l.editor = setupWorld(msg.world);
  } else if (msg.op === "deleteWorld") {
    selector.delWorld(msg.world);
  } else if (msg.op === "newWorld") {
    console.log("add World Live");
    l.editor = selector.addWorld(msg.world);
  } else if (msg.op === "Line") {
    l.world.lines[msg.id].set(JSOX$1.parse(msg.data));
  } else if (msg.op === "Sector") {
    l.world.sectors[msg.id].set(JSOX$1.parse(msg.data));
    l.refresh = true;
  } else if (msg.op === "wall") {
    l.world.walls[msg.id].set(JSOX$1.parse(msg.data));
  } else if (msg.op === "create") {
    if (msg.sub === "sector") ;
  } else if (msg.op === "move") {
    if (msg.t === "S") {
      // sector
      l.world.sectors[msg.id].move(msg.x, msg.y);
    }

    if (msg.t === "n") ;
    if (msg.t === "o") ;
  } else if (msg.op === "error") {
    console.log("ERROR:", msg);
  } else {
    console.log("Unhandled:", msg);
  }
}

openSocket();

function newImage(src) {
  var i = new Image();
  i.crossOrigin = "Anonymous";
  i.src = src;

  i.onload = () => {//DOM_text.innerHTML = "Loading... " + (100 - 100*requiredImages.length / maxRequired );
    //if( requiredImages == 0 ) doWork(); };
  };

  return i;
}
