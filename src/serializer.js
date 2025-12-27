// Tmbdl Bytecode Serializer
//
// Serializes compiled bytecode to a binary format (.tmbdlc)
// and deserializes it back for execution.

import { Chunk, TmbdlBytecodeFunction } from './bytecode.js';

// Magic number: "TMBDL" + version
const MAGIC = [0x54, 0x4D, 0x42, 0x44, 0x4C];  // "TMBDL"
const VERSION = 1;

// Type tags for constants
const TYPE_NULL = 0x00;
const TYPE_BOOL = 0x01;
const TYPE_NUMBER = 0x02;
const TYPE_STRING = 0x03;
const TYPE_FUNCTION = 0x04;

// ============================================================
// SERIALIZER
// ============================================================

export class BytecodeSerializer {
  constructor() {
    this.buffer = [];
    this.functionMap = new Map();  // Map functions to indices
  }

  serialize(chunk) {
    this.buffer = [];
    this.functionMap = new Map();

    // Write header
    this.writeBytes(MAGIC);
    this.writeByte(VERSION);

    // Collect all functions first (for proper indexing)
    this.collectFunctions(chunk);

    // Write function count
    this.writeUint32(this.functionMap.size);

    // Write each function
    for (const [func, index] of this.functionMap) {
      this.writeFunction(func);
    }

    // Write main chunk index (always 0 since we write main first)
    this.writeUint32(0);

    return new Uint8Array(this.buffer);
  }

  collectFunctions(chunk) {
    // Create a dummy function for the main chunk
    const mainFunc = new TmbdlBytecodeFunction('__main__', 0, chunk);
    mainFunc.upvalueCount = 0;
    this.addFunction(mainFunc);
  }

  addFunction(func) {
    if (this.functionMap.has(func)) {
      return this.functionMap.get(func);
    }

    const index = this.functionMap.size;
    this.functionMap.set(func, index);

    // Recursively collect nested functions from constants
    for (const constant of func.chunk.constants) {
      if (constant instanceof TmbdlBytecodeFunction) {
        this.addFunction(constant);
      }
    }

    return index;
  }

  writeFunction(func) {
    const chunk = func.chunk;

    // Write function metadata
    this.writeString(func.name);
    this.writeUint16(func.arity);
    this.writeUint16(func.upvalueCount);

    // Write constants
    this.writeUint32(chunk.constants.length);
    for (const constant of chunk.constants) {
      this.writeConstant(constant);
    }

    // Write bytecode
    this.writeUint32(chunk.code.length);
    for (const byte of chunk.code) {
      this.writeByte(byte);
    }

    // Write line numbers
    this.writeUint32(chunk.lines.length);
    for (const line of chunk.lines) {
      this.writeUint16(line);
    }
  }

  writeConstant(value) {
    if (value === null) {
      this.writeByte(TYPE_NULL);
    } else if (typeof value === 'boolean') {
      this.writeByte(TYPE_BOOL);
      this.writeByte(value ? 1 : 0);
    } else if (typeof value === 'number') {
      this.writeByte(TYPE_NUMBER);
      this.writeFloat64(value);
    } else if (typeof value === 'string') {
      this.writeByte(TYPE_STRING);
      this.writeString(value);
    } else if (value instanceof TmbdlBytecodeFunction) {
      this.writeByte(TYPE_FUNCTION);
      this.writeUint32(this.functionMap.get(value));
    } else {
      throw new Error(`Cannot serialize constant of type: ${typeof value}`);
    }
  }

  writeByte(byte) {
    this.buffer.push(byte & 0xFF);
  }

  writeBytes(bytes) {
    for (const byte of bytes) {
      this.writeByte(byte);
    }
  }

  writeUint16(value) {
    this.writeByte((value >> 8) & 0xFF);
    this.writeByte(value & 0xFF);
  }

  writeUint32(value) {
    this.writeByte((value >> 24) & 0xFF);
    this.writeByte((value >> 16) & 0xFF);
    this.writeByte((value >> 8) & 0xFF);
    this.writeByte(value & 0xFF);
  }

  writeFloat64(value) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, value, false);  // big-endian
    for (let i = 0; i < 8; i++) {
      this.writeByte(view.getUint8(i));
    }
  }

  writeString(str) {
    const encoded = new TextEncoder().encode(str);
    this.writeUint32(encoded.length);
    for (const byte of encoded) {
      this.writeByte(byte);
    }
  }
}

// ============================================================
// DESERIALIZER
// ============================================================

export class BytecodeDeserializer {
  constructor() {
    this.buffer = null;
    this.offset = 0;
    this.functions = [];
    this.pendingRefs = [];  // Track function references that need resolution
  }

  deserialize(bytes) {
    this.buffer = bytes;
    this.offset = 0;
    this.functions = [];
    this.pendingRefs = [];

    // Read and verify header
    const magic = this.readBytes(5);
    for (let i = 0; i < 5; i++) {
      if (magic[i] !== MAGIC[i]) {
        throw new Error('Invalid bytecode file: bad magic number');
      }
    }

    const version = this.readByte();
    if (version !== VERSION) {
      throw new Error(`Unsupported bytecode version: ${version}`);
    }

    // Read function count
    const functionCount = this.readUint32();

    // Read all functions
    for (let i = 0; i < functionCount; i++) {
      this.functions.push(this.readFunction());
    }

    // Resolve function references in constants
    for (const ref of this.pendingRefs) {
      ref.constants[ref.constantIndex] = this.functions[ref.functionIndex];
    }

    // Read main chunk index
    const mainIndex = this.readUint32();

    // Return the main chunk
    return this.functions[mainIndex].chunk;
  }

  readFunction() {
    // Read function metadata
    const name = this.readString();
    const arity = this.readUint16();
    const upvalueCount = this.readUint16();

    // Read constants
    const constantCount = this.readUint32();
    const constants = [];
    for (let i = 0; i < constantCount; i++) {
      const constant = this.readConstant(constants, i);
      constants.push(constant);
    }

    // Read bytecode
    const codeLength = this.readUint32();
    const code = [];
    for (let i = 0; i < codeLength; i++) {
      code.push(this.readByte());
    }

    // Read line numbers
    const linesLength = this.readUint32();
    const lines = [];
    for (let i = 0; i < linesLength; i++) {
      lines.push(this.readUint16());
    }

    // Create chunk and function
    const chunk = new Chunk(name);
    chunk.constants = constants;
    chunk.code = code;
    chunk.lines = lines;

    const func = new TmbdlBytecodeFunction(name, arity, chunk);
    func.upvalueCount = upvalueCount;

    return func;
  }

  readConstant(constants, constantIndex) {
    const type = this.readByte();

    switch (type) {
      case TYPE_NULL:
        return null;
      case TYPE_BOOL:
        return this.readByte() !== 0;
      case TYPE_NUMBER:
        return this.readFloat64();
      case TYPE_STRING:
        return this.readString();
      case TYPE_FUNCTION:
        const index = this.readUint32();
        // Store a pending reference to resolve after all functions are read
        this.pendingRefs.push({ constants, constantIndex, functionIndex: index });
        return null;  // Placeholder, will be resolved later
      default:
        throw new Error(`Unknown constant type: ${type}`);
    }
  }

  readByte() {
    return this.buffer[this.offset++];
  }

  readBytes(count) {
    const bytes = [];
    for (let i = 0; i < count; i++) {
      bytes.push(this.readByte());
    }
    return bytes;
  }

  readUint16() {
    const high = this.readByte();
    const low = this.readByte();
    return (high << 8) | low;
  }

  readUint32() {
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    const b4 = this.readByte();
    return (b1 << 24) | (b2 << 16) | (b3 << 8) | b4;
  }

  readFloat64() {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < 8; i++) {
      view.setUint8(i, this.readByte());
    }
    return view.getFloat64(0, false);  // big-endian
  }

  readString() {
    const length = this.readUint32();
    const bytes = this.readBytes(length);
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export function serializeBytecode(chunk) {
  const serializer = new BytecodeSerializer();
  return serializer.serialize(chunk);
}

export function deserializeBytecode(bytes) {
  const deserializer = new BytecodeDeserializer();
  return deserializer.deserialize(bytes);
}
