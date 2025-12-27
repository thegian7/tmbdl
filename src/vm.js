// Tmbdl Virtual Machine
//
// A stack-based VM that executes bytecode.
// This is the "engine" that runs compiled Tmbdl programs.

import { OpCode, TmbdlBytecodeFunction, Closure, Upvalue } from './bytecode.js';

// ============================================================
// CALL FRAME - Represents a function call
// ============================================================

class CallFrame {
  constructor(closure, ip = 0, stackOffset = 0, returnSlot = 0) {
    this.closure = closure;         // The closure being executed
    this.ip = ip;                   // Instruction pointer (within closure's chunk)
    this.stackOffset = stackOffset; // Where this frame's locals start
    this.returnSlot = returnSlot;   // Stack position to restore to after return
  }

  // Get the chunk we're executing
  get chunk() {
    return this.closure.chunk;
  }
}

// ============================================================
// VIRTUAL MACHINE
// ============================================================

export class VM {
  constructor(options = {}) {
    this.stack = [];            // Value stack
    this.globals = new Map();   // Global variables
    this.frames = [];           // Call stack
    this.frame = null;          // Current frame
    this.openUpvalues = null;   // Linked list of open upvalues
    this.exports = {};          // Exports from current module
    this.moduleCache = new Map(); // Cache of loaded modules
    this.currentFile = options.currentFile || null;  // Current file being executed
    this.moduleLoader = options.moduleLoader || null; // Function to load modules

    // Initialize standard library
    this.initStdlib();
  }

  // Initialize built-in functions
  initStdlib() {
    // Native function wrapper
    const native = (name, arity, fn) => ({
      type: 'native',
      name,
      arity,
      fn
    });

    this.globals.set('length', native('length', 1, (args) => {
      const val = args[0];
      if (typeof val === 'string' || Array.isArray(val)) return val.length;
      throw new Error('length() requires a string or array');
    }));

    this.globals.set('push', native('push', 2, (args) => {
      args[0].push(args[1]);
      return args[0];
    }));

    this.globals.set('pop', native('pop', 1, (args) => {
      return args[0].pop();
    }));

    this.globals.set('type', native('type', 1, (args) => {
      const val = args[0];
      if (val === null) return 'shadow';
      if (typeof val === 'boolean') return 'truth';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'string') return 'tale';
      if (Array.isArray(val)) return 'fellowship';
      if (typeof val === 'function' || val?.type === 'native') return 'song';
      return 'realm';
    }));

    this.globals.set('str', native('str', 1, (args) => String(args[0])));
    this.globals.set('num', native('num', 1, (args) => Number(args[0])));

    this.globals.set('floor', native('floor', 1, (args) => Math.floor(args[0])));
    this.globals.set('ceil', native('ceil', 1, (args) => Math.ceil(args[0])));
    this.globals.set('round', native('round', 1, (args) => Math.round(args[0])));
    this.globals.set('abs', native('abs', 1, (args) => Math.abs(args[0])));
    this.globals.set('random', native('random', 0, () => Math.random()));

    this.globals.set('min', native('min', -1, (args) => Math.min(...args)));
    this.globals.set('max', native('max', -1, (args) => Math.max(...args)));

    this.globals.set('range', native('range', -1, (args) => {
      let start = 0, end, step = 1;
      if (args.length === 1) {
        end = args[0];
      } else if (args.length === 2) {
        start = args[0];
        end = args[1];
      } else {
        start = args[0];
        end = args[1];
        step = args[2];
      }
      const result = [];
      if (step > 0) {
        for (let i = start; i < end; i += step) result.push(i);
      } else {
        for (let i = start; i > end; i += step) result.push(i);
      }
      return result;
    }));

    this.globals.set('keys', native('keys', 1, (args) => Object.keys(args[0])));
    this.globals.set('values', native('values', 1, (args) => Object.values(args[0])));
    this.globals.set('split', native('split', 2, (args) => args[0].split(args[1])));
    this.globals.set('join', native('join', 2, (args) => args[0].join(args[1])));
    this.globals.set('slice', native('slice', -1, (args) => args[0].slice(args[1], args[2])));

    // Higher-order functions
    this.globals.set('map', native('map', 2, (args) => {
      const [arr, fn] = args;
      return arr.map((item, i) => this.callValue(fn, [item, i]));
    }));

    this.globals.set('filter', native('filter', 2, (args) => {
      const [arr, fn] = args;
      return arr.filter((item, i) => this.callValue(fn, [item, i]));
    }));

    this.globals.set('reduce', native('reduce', -1, (args) => {
      const [arr, fn, init] = args;
      if (args.length >= 3) {
        return arr.reduce((acc, item, i) => this.callValue(fn, [acc, item, i]), init);
      }
      return arr.reduce((acc, item, i) => this.callValue(fn, [acc, item, i]));
    }));

    this.globals.set('find', native('find', 2, (args) => {
      const [arr, fn] = args;
      return arr.find((item, i) => this.callValue(fn, [item, i])) ?? null;
    }));

    this.globals.set('some', native('some', 2, (args) => {
      const [arr, fn] = args;
      return arr.some((item, i) => this.callValue(fn, [item, i]));
    }));

    this.globals.set('every', native('every', 2, (args) => {
      const [arr, fn] = args;
      return arr.every((item, i) => this.callValue(fn, [item, i]));
    }));

    this.globals.set('sort', native('sort', -1, (args) => {
      const [arr, fn] = args;
      const copy = [...arr];
      if (fn) {
        copy.sort((a, b) => this.callValue(fn, [a, b]));
      } else {
        copy.sort((a, b) => a - b);
      }
      return copy;
    }));
  }

  // ============================================================
  // MAIN EXECUTION
  // ============================================================

  run(chunk) {
    // Create a "main" closure to run
    const mainFunc = new TmbdlBytecodeFunction('main', 0, chunk);
    mainFunc.upvalueCount = 0;
    const mainClosure = new Closure(mainFunc);
    this.frames = [new CallFrame(mainClosure, 0, 0)];
    this.frame = this.frames[0];
    this.openUpvalues = null;

    return this.execute();
  }

  execute() {
    while (true) {
      const instruction = this.readByte();

      switch (instruction) {
        // ==================== STACK ====================
        case OpCode.PUSH_CONST: {
          const index = this.readByte();
          this.push(this.frame.chunk.constants[index]);
          break;
        }

        case OpCode.POP:
          this.pop();
          break;

        case OpCode.DUP:
          this.push(this.peek());
          break;

        // ==================== ARITHMETIC ====================
        case OpCode.ADD: {
          const b = this.pop();
          const a = this.pop();
          this.push(a + b);
          break;
        }

        case OpCode.SUB: {
          const b = this.pop();
          const a = this.pop();
          this.push(a - b);
          break;
        }

        case OpCode.MUL: {
          const b = this.pop();
          const a = this.pop();
          this.push(a * b);
          break;
        }

        case OpCode.DIV: {
          const b = this.pop();
          const a = this.pop();
          if (b === 0) throw new Error('Division by zero');
          this.push(a / b);
          break;
        }

        case OpCode.MOD: {
          const b = this.pop();
          const a = this.pop();
          this.push(a % b);
          break;
        }

        case OpCode.NEG:
          this.push(-this.pop());
          break;

        // ==================== COMPARISON ====================
        case OpCode.EQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a === b);
          break;
        }

        case OpCode.NEQ: {
          const b = this.pop();
          const a = this.pop();
          this.push(a !== b);
          break;
        }

        case OpCode.LT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a < b);
          break;
        }

        case OpCode.LTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a <= b);
          break;
        }

        case OpCode.GT: {
          const b = this.pop();
          const a = this.pop();
          this.push(a > b);
          break;
        }

        case OpCode.GTE: {
          const b = this.pop();
          const a = this.pop();
          this.push(a >= b);
          break;
        }

        // ==================== LOGICAL ====================
        case OpCode.NOT:
          this.push(!this.isTruthy(this.pop()));
          break;

        // ==================== VARIABLES ====================
        case OpCode.LOAD: {
          const slot = this.readByte();
          this.push(this.stack[this.frame.stackOffset + slot]);
          break;
        }

        case OpCode.STORE: {
          const slot = this.readByte();
          this.stack[this.frame.stackOffset + slot] = this.peek();
          break;
        }

        case OpCode.LOAD_GLOBAL: {
          const nameIndex = this.readByte();
          const name = this.frame.chunk.constants[nameIndex];
          if (!this.globals.has(name)) {
            throw new Error(`Undefined variable: ${name}`);
          }
          this.push(this.globals.get(name));
          break;
        }

        case OpCode.STORE_GLOBAL: {
          const nameIndex = this.readByte();
          const name = this.frame.chunk.constants[nameIndex];
          this.globals.set(name, this.peek());
          break;
        }

        // ==================== CONTROL FLOW ====================
        case OpCode.JUMP: {
          const offset = this.readByte();
          this.frame.ip += offset;
          break;
        }

        case OpCode.JUMP_IF_FALSE: {
          const offset = this.readByte();
          if (!this.isTruthy(this.peek())) {
            this.frame.ip += offset;
          }
          break;
        }

        case OpCode.JUMP_IF_TRUE: {
          const offset = this.readByte();
          if (this.isTruthy(this.peek())) {
            this.frame.ip += offset;
          }
          break;
        }

        case OpCode.LOOP: {
          const offset = this.readByte();
          this.frame.ip -= offset;
          break;
        }

        // ==================== FUNCTIONS ====================
        case OpCode.CALL: {
          const argCount = this.readByte();
          const callee = this.stack[this.stack.length - 1 - argCount];
          this.callValue(callee, null, argCount);
          break;
        }

        case OpCode.MAKE_CLOSURE: {
          const funcIndex = this.readByte();
          const func = this.frame.chunk.constants[funcIndex];
          const closure = new Closure(func);

          // Read upvalue descriptors
          for (let i = 0; i < func.upvalueCount; i++) {
            const isLocal = this.readByte();
            const index = this.readByte();
            if (isLocal) {
              // Capture a local from the current frame
              closure.upvalues[i] = this.captureUpvalue(this.frame.stackOffset + index);
            } else {
              // Copy an upvalue from the enclosing closure
              closure.upvalues[i] = this.frame.closure.upvalues[index];
            }
          }

          this.push(closure);
          break;
        }

        case OpCode.GET_UPVALUE: {
          const slot = this.readByte();
          const upvalue = this.frame.closure.upvalues[slot];
          this.push(upvalue.get(this.stack));
          break;
        }

        case OpCode.SET_UPVALUE: {
          const slot = this.readByte();
          const upvalue = this.frame.closure.upvalues[slot];
          upvalue.set(this.stack, this.peek());
          break;
        }

        case OpCode.CLOSE_UPVALUE: {
          this.closeUpvalues(this.stack.length - 1);
          this.pop();
          break;
        }

        case OpCode.RETURN: {
          const result = this.pop();
          // Close any upvalues in the current frame
          this.closeUpvalues(this.frame.stackOffset);
          const returnSlot = this.frame.returnSlot;

          // Pop the frame
          this.frames.pop();

          if (this.frames.length === 0) {
            // We've returned from main
            return result;
          }

          // Restore previous frame
          this.frame = this.frames[this.frames.length - 1];

          // Restore stack to where the function was, then push result
          this.stack.length = returnSlot;
          this.push(result);
          break;
        }

        // ==================== BUILT-INS ====================
        case OpCode.PRINT: {
          const value = this.pop();
          console.log(this.formatValue(value));
          break;
        }

        case OpCode.EYEOF: {
          const value = this.pop();
          const label = this.pop();
          console.debug(`👁 [${label}]:`, this.formatValue(value));
          break;
        }

        // ==================== ARRAYS/OBJECTS ====================
        case OpCode.MAKE_ARRAY: {
          const count = this.readByte();
          const arr = [];
          for (let i = 0; i < count; i++) {
            arr.unshift(this.pop());
          }
          this.push(arr);
          break;
        }

        case OpCode.INDEX_GET: {
          const index = this.pop();
          const obj = this.pop();
          this.push(obj[index]);
          break;
        }

        case OpCode.INDEX_SET: {
          const value = this.pop();
          const index = this.pop();
          const obj = this.pop();
          obj[index] = value;
          this.push(value);
          break;
        }

        case OpCode.LENGTH: {
          const val = this.pop();
          this.push(val.length);
          break;
        }

        case OpCode.MAKE_OBJECT: {
          const count = this.readByte();
          const obj = {};
          for (let i = 0; i < count; i++) {
            const value = this.pop();
            const key = this.pop();
            obj[key] = value;
          }
          this.push(obj);
          break;
        }

        case OpCode.GET_PROP: {
          const propIndex = this.readByte();
          const prop = this.frame.chunk.constants[propIndex];
          const obj = this.pop();
          this.push(obj[prop]);
          break;
        }

        case OpCode.SET_PROP: {
          const propIndex = this.readByte();
          const prop = this.frame.chunk.constants[propIndex];
          const value = this.pop();
          const obj = this.pop();
          obj[prop] = value;
          this.push(value);
          break;
        }

        // ==================== MODULES ====================
        case OpCode.IMPORT: {
          const pathIndex = this.readByte();
          const modulePath = this.frame.chunk.constants[pathIndex];
          const moduleExports = this.loadModule(modulePath);
          this.push(moduleExports);
          break;
        }

        case OpCode.EXPORT: {
          const nameIndex = this.readByte();
          const name = this.frame.chunk.constants[nameIndex];
          const value = this.pop();
          this.exports[name] = value;
          break;
        }

        // ==================== END ====================
        case OpCode.HALT:
          return this.stack.length > 0 ? this.peek() : null;

        default:
          throw new Error(`Unknown opcode: ${instruction} at ip=${this.frame.ip - 1}`);
      }
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  readByte() {
    return this.frame.chunk.code[this.frame.ip++];
  }

  push(value) {
    this.stack.push(value);
  }

  pop() {
    return this.stack.pop();
  }

  peek(distance = 0) {
    return this.stack[this.stack.length - 1 - distance];
  }

  isTruthy(value) {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  countLocals() {
    // Rough count of locals in current frame
    return 0;  // Simplified for now
  }

  callValue(callee, argsArray, argCount = null) {
    // Called either with argsArray (from native functions)
    // or with argCount (from bytecode CALL instruction)

    if (argsArray !== null) {
      // Native calling native - direct call
      if (callee.type === 'native') {
        return callee.fn(argsArray);
      } else if (callee instanceof Closure) {
        // Push args onto stack and call
        for (const arg of argsArray) {
          this.push(arg);
        }
        return this.callClosure(callee, argsArray.length);
      } else if (callee instanceof TmbdlBytecodeFunction) {
        // Wrap in closure and call
        const closure = new Closure(callee);
        for (const arg of argsArray) {
          this.push(arg);
        }
        return this.callClosure(closure, argsArray.length);
      }
    }

    if (callee?.type === 'native') {
      // Native function
      const args = [];
      for (let i = 0; i < argCount; i++) {
        args.unshift(this.pop());
      }
      this.pop();  // Pop the function itself
      const result = callee.fn(args);
      this.push(result);
    } else if (callee instanceof Closure) {
      this.callClosure(callee, argCount);
    } else if (callee instanceof TmbdlBytecodeFunction) {
      // Wrap bare function in closure (shouldn't happen often)
      const closure = new Closure(callee);
      this.callClosure(closure, argCount);
    } else {
      throw new Error(`Cannot call ${typeof callee}`);
    }
  }

  callClosure(closure, argCount) {
    if (argCount !== closure.arity) {
      throw new Error(`Expected ${closure.arity} arguments but got ${argCount}`);
    }

    // returnSlot is where the closure object is - we'll replace it with the return value
    const returnSlot = this.stack.length - argCount - 1;
    const frame = new CallFrame(closure, 0, this.stack.length - argCount, returnSlot);
    this.frames.push(frame);
    this.frame = frame;
  }

  // Capture a local variable as an upvalue
  captureUpvalue(stackIndex) {
    // Check if we already have an upvalue for this slot
    let prevUpvalue = null;
    let upvalue = this.openUpvalues;

    while (upvalue !== null && upvalue.location > stackIndex) {
      prevUpvalue = upvalue;
      upvalue = upvalue.next;
    }

    if (upvalue !== null && upvalue.location === stackIndex) {
      return upvalue;  // Reuse existing upvalue
    }

    // Create new upvalue
    const createdUpvalue = new Upvalue(stackIndex);
    createdUpvalue.next = upvalue;

    if (prevUpvalue === null) {
      this.openUpvalues = createdUpvalue;
    } else {
      prevUpvalue.next = createdUpvalue;
    }

    return createdUpvalue;
  }

  // Close all upvalues at or above the given stack index
  closeUpvalues(lastIndex) {
    while (this.openUpvalues !== null && this.openUpvalues.location >= lastIndex) {
      const upvalue = this.openUpvalues;
      upvalue.close(this.stack);
      this.openUpvalues = upvalue.next;
    }
  }

  // Load a module (compile and execute it)
  loadModule(modulePath) {
    // Check cache first
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath);
    }

    // Use the provided module loader
    if (!this.moduleLoader) {
      throw new Error(`Cannot load module '${modulePath}': no module loader configured`);
    }

    // Load and compile the module
    const moduleExports = this.moduleLoader(modulePath, this.currentFile, this.moduleCache);

    // Cache and return
    this.moduleCache.set(modulePath, moduleExports);
    return moduleExports;
  }

  // Get exports from this module
  getExports() {
    return this.exports;
  }

  formatValue(value) {
    if (value === null) return 'shadow';
    if (value === true) return 'goldberry';
    if (value === false) return 'sauron';
    if (Array.isArray(value)) {
      return '[' + value.map(v => this.formatValue(v)).join(', ') + ']';
    }
    if (value instanceof Closure) {
      return `<song ${value.name}>`;
    }
    if (value instanceof TmbdlBytecodeFunction) {
      return `<song ${value.name}>`;
    }
    if (value?.type === 'native') {
      return `<native song ${value.name}>`;
    }
    if (typeof value === 'object') {
      const pairs = Object.entries(value).map(([k, v]) => `${k}: ${this.formatValue(v)}`);
      return '{' + pairs.join(', ') + '}';
    }
    return String(value);
  }
}
