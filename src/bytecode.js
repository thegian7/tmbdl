// Tmbdl Bytecode Definitions
//
// This defines the instruction set for our virtual machine.
// Each opcode is a single byte, followed by optional operands.

// ============================================================
// OPCODES - The instructions our VM understands
// ============================================================

export const OpCode = {
  // Stack operations
  PUSH_CONST: 0x01,    // Push a constant onto the stack
  POP: 0x02,           // Discard top of stack
  DUP: 0x03,           // Duplicate top of stack

  // Arithmetic
  ADD: 0x10,           // Pop 2, push sum
  SUB: 0x11,           // Pop 2, push difference
  MUL: 0x12,           // Pop 2, push product
  DIV: 0x13,           // Pop 2, push quotient
  MOD: 0x14,           // Pop 2, push remainder
  NEG: 0x15,           // Negate top of stack

  // Comparison
  EQ: 0x20,            // Pop 2, push true if equal
  NEQ: 0x21,           // Pop 2, push true if not equal
  LT: 0x22,            // Pop 2, push true if less than
  LTE: 0x23,           // Pop 2, push true if less than or equal
  GT: 0x24,            // Pop 2, push true if greater than
  GTE: 0x25,           // Pop 2, push true if greater than or equal

  // Logical
  NOT: 0x30,           // Logical NOT
  AND: 0x31,           // Logical AND (short-circuit)
  OR: 0x32,            // Logical OR (short-circuit)

  // Variables
  LOAD: 0x40,          // Push variable value onto stack
  STORE: 0x41,         // Pop and store in variable
  LOAD_GLOBAL: 0x42,   // Load from global scope
  STORE_GLOBAL: 0x43,  // Store to global scope

  // Control flow
  JUMP: 0x50,          // Unconditional jump
  JUMP_IF_FALSE: 0x51, // Jump if top of stack is false
  JUMP_IF_TRUE: 0x52,  // Jump if top of stack is true
  LOOP: 0x53,          // Jump backwards (for loops)

  // Functions
  CALL: 0x60,          // Call function with N arguments
  RETURN: 0x61,        // Return from function
  MAKE_CLOSURE: 0x62,  // Create closure with upvalues
  GET_UPVALUE: 0x63,   // Get value from upvalue
  SET_UPVALUE: 0x64,   // Set value in upvalue
  CLOSE_UPVALUE: 0x65, // Close upvalue (move from stack to heap)

  // Built-ins
  PRINT: 0x70,         // Print top of stack
  EYEOF: 0x71,         // Debug print with label

  // Arrays
  MAKE_ARRAY: 0x80,    // Create array from N stack values
  INDEX_GET: 0x81,     // Get array/object element
  INDEX_SET: 0x82,     // Set array/object element
  LENGTH: 0x86,        // Get length of array/string

  // Objects
  MAKE_OBJECT: 0x83,   // Create object from N key-value pairs
  GET_PROP: 0x84,      // Get property
  SET_PROP: 0x85,      // Set property

  // Classes
  MAKE_CLASS: 0x90,    // Create class
  GET_THIS: 0x91,      // Push 'self' onto stack
  INVOKE: 0x92,        // Call method

  // Modules
  IMPORT: 0xA0,        // Import a module
  EXPORT: 0xA1,        // Export a value

  // Misc
  HALT: 0xFF,          // Stop execution
};

// Reverse lookup for disassembly
export const OpCodeNames = Object.fromEntries(
  Object.entries(OpCode).map(([name, code]) => [code, name])
);

// ============================================================
// CHUNK - A compiled unit of bytecode
// ============================================================

export class Chunk {
  constructor(name = 'main') {
    this.name = name;
    this.code = [];          // Bytecode instructions
    this.constants = [];     // Constant pool (numbers, strings, etc.)
    this.lines = [];         // Line numbers for debugging
  }

  // Write a byte to the chunk
  write(byte, line = 0) {
    this.code.push(byte);
    this.lines.push(line);
    return this.code.length - 1;  // Return offset
  }

  // Add a constant and return its index
  addConstant(value) {
    // Check if constant already exists
    const existing = this.constants.findIndex(c => c === value);
    if (existing !== -1) return existing;

    this.constants.push(value);
    return this.constants.length - 1;
  }

  // Write an instruction with a constant operand
  writeConstant(value, line = 0) {
    const index = this.addConstant(value);
    this.write(OpCode.PUSH_CONST, line);
    this.write(index, line);  // Constant index as operand
    return index;
  }

  // Get current code offset (for jumps)
  currentOffset() {
    return this.code.length;
  }

  // Patch a jump instruction with the actual offset
  patchJump(offset) {
    // Calculate jump distance
    const jump = this.code.length - offset - 2;  // -2 for the jump instruction itself
    this.code[offset + 1] = jump;
  }

  // Disassemble for debugging
  disassemble() {
    console.log(`\n== ${this.name} ==`);
    let offset = 0;
    while (offset < this.code.length) {
      offset = this.disassembleInstruction(offset);
    }
    console.log();
  }

  disassembleInstruction(offset) {
    const instruction = this.code[offset];
    const name = OpCodeNames[instruction] || `UNKNOWN(${instruction})`;
    const line = this.lines[offset];

    // Format: offset | line | instruction [operands]
    let output = `${offset.toString().padStart(4, '0')} | L${line.toString().padStart(3)} | ${name}`;

    switch (instruction) {
      case OpCode.PUSH_CONST: {
        const constIndex = this.code[offset + 1];
        const value = this.constants[constIndex];
        output += ` ${constIndex} (${JSON.stringify(value)})`;
        console.log(output);
        return offset + 2;
      }

      case OpCode.LOAD:
      case OpCode.STORE:
      case OpCode.LOAD_GLOBAL:
      case OpCode.STORE_GLOBAL: {
        const nameIndex = this.code[offset + 1];
        const varName = this.constants[nameIndex];
        output += ` ${nameIndex} (${varName})`;
        console.log(output);
        return offset + 2;
      }

      case OpCode.JUMP:
      case OpCode.JUMP_IF_FALSE:
      case OpCode.JUMP_IF_TRUE:
      case OpCode.LOOP: {
        const jumpOffset = this.code[offset + 1];
        const target = instruction === OpCode.LOOP
          ? offset - jumpOffset + 2
          : offset + jumpOffset + 2;
        output += ` -> ${target}`;
        console.log(output);
        return offset + 2;
      }

      case OpCode.CALL:
      case OpCode.MAKE_ARRAY:
      case OpCode.MAKE_OBJECT: {
        const count = this.code[offset + 1];
        output += ` (${count} args)`;
        console.log(output);
        return offset + 2;
      }

      case OpCode.MAKE_CLOSURE: {
        const funcIndex = this.code[offset + 1];
        const func = this.constants[funcIndex];
        output += ` ${funcIndex} (${func.name})`;
        console.log(output);
        // After MAKE_CLOSURE, there are upvalue descriptors
        let o = offset + 2;
        for (let i = 0; i < func.upvalueCount; i++) {
          const isLocal = this.code[o++];
          const index = this.code[o++];
          console.log(`     |       |  upvalue ${i}: ${isLocal ? 'local' : 'upvalue'} ${index}`);
        }
        return o;
      }

      case OpCode.GET_UPVALUE:
      case OpCode.SET_UPVALUE: {
        const slot = this.code[offset + 1];
        output += ` ${slot}`;
        console.log(output);
        return offset + 2;
      }

      case OpCode.CLOSE_UPVALUE: {
        console.log(output);
        return offset + 1;
      }

      case OpCode.PRINT:
      case OpCode.EYEOF: {
        console.log(output);
        return offset + 1;
      }

      default:
        console.log(output);
        return offset + 1;
    }
  }
}

// ============================================================
// FUNCTION OBJECT - Represents a compiled function
// ============================================================

export class TmbdlBytecodeFunction {
  constructor(name, arity, chunk) {
    this.name = name;
    this.arity = arity;      // Number of parameters
    this.chunk = chunk;      // The function's bytecode
    this.upvalueCount = 0;   // Number of upvalues this function captures
  }

  toString() {
    return `<song ${this.name}>`;
  }
}

// ============================================================
// UPVALUE - A captured variable from an enclosing scope
// ============================================================

export class Upvalue {
  constructor(location) {
    this.location = location;  // Stack index (while open) or null (when closed)
    this.closed = null;        // The value (when closed)
    this.next = null;          // For linked list of open upvalues
  }

  // Read the upvalue's current value
  get(stack) {
    if (this.location !== null) {
      return stack[this.location];
    }
    return this.closed;
  }

  // Set the upvalue's value
  set(stack, value) {
    if (this.location !== null) {
      stack[this.location] = value;
    } else {
      this.closed = value;
    }
  }

  // Close the upvalue - move value from stack to heap
  close(stack) {
    this.closed = stack[this.location];
    this.location = null;
  }
}

// ============================================================
// CLOSURE - A function plus its captured upvalues
// ============================================================

export class Closure {
  constructor(func) {
    this.func = func;
    this.upvalues = new Array(func.upvalueCount).fill(null);
  }

  get name() {
    return this.func.name;
  }

  get arity() {
    return this.func.arity;
  }

  get chunk() {
    return this.func.chunk;
  }

  toString() {
    return `<song ${this.func.name}>`;
  }
}
