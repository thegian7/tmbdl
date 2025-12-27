// Tmbdl Code Generator
//
// Walks the AST and emits bytecode instructions.
// This is similar to our Compiler (transpiler), but outputs
// bytecode instead of JavaScript.

import { OpCode, Chunk, TmbdlBytecodeFunction } from './bytecode.js';

// Compiler context for a single function
class CompilerContext {
  constructor(name, enclosing = null) {
    this.chunk = new Chunk(name);
    this.locals = [];           // Local variables: { name, depth, isCaptured }
    this.upvalues = [];         // Upvalues: { index, isLocal }
    this.scopeDepth = 0;
    this.enclosing = enclosing; // Parent compiler context (for closures)
  }
}

export class CodeGenerator {
  constructor() {
    this.current = new CompilerContext('main');
    this.loopStack = [];      // For break/continue
  }

  // Convenience getters
  get chunk() { return this.current.chunk; }
  get locals() { return this.current.locals; }
  get scopeDepth() { return this.current.scopeDepth; }
  set scopeDepth(val) { this.current.scopeDepth = val; }

  // Main entry point
  generate(ast) {
    this.visit(ast);
    this.emit(OpCode.HALT);
    return this.chunk;
  }

  // Emit a single byte
  emit(byte, line = 0) {
    this.chunk.write(byte, line);
  }

  // Emit instruction with one operand
  emitWithOperand(opcode, operand, line = 0) {
    this.emit(opcode, line);
    this.emit(operand, line);
  }

  // Emit a constant (adds to constant pool)
  emitConstant(value, line = 0) {
    const index = this.chunk.addConstant(value);
    this.emitWithOperand(OpCode.PUSH_CONST, index, line);
  }

  // Emit a jump instruction, return offset to patch later
  emitJump(opcode, line = 0) {
    this.emit(opcode, line);
    this.emit(0xFF, line);  // Placeholder
    return this.chunk.currentOffset() - 2;
  }

  // Patch a previously emitted jump
  patchJump(offset) {
    const jump = this.chunk.currentOffset() - offset - 2;
    this.chunk.code[offset + 1] = jump;
  }

  // Emit a loop (backward jump)
  emitLoop(loopStart, line = 0) {
    this.emit(OpCode.LOOP, line);
    const offset = this.chunk.currentOffset() - loopStart + 1;
    this.emit(offset, line);
  }

  // Variable management
  addLocal(name) {
    this.current.locals.push({ name, depth: this.current.scopeDepth, isCaptured: false });
  }

  resolveLocal(name) {
    for (let i = this.current.locals.length - 1; i >= 0; i--) {
      if (this.current.locals[i].name === name) {
        return i;
      }
    }
    return -1;  // Not found in current context
  }

  // Add an upvalue to the current function
  addUpvalue(index, isLocal) {
    const upvalues = this.current.upvalues;

    // Check if we already have this upvalue
    for (let i = 0; i < upvalues.length; i++) {
      if (upvalues[i].index === index && upvalues[i].isLocal === isLocal) {
        return i;
      }
    }

    upvalues.push({ index, isLocal });
    return upvalues.length - 1;
  }

  // Resolve a variable that might be in an enclosing scope
  resolveUpvalue(name) {
    if (this.current.enclosing === null) {
      return -1;  // No enclosing scope - must be global
    }

    // Check if it's a local in the immediately enclosing function
    const enclosing = this.current.enclosing;
    for (let i = enclosing.locals.length - 1; i >= 0; i--) {
      if (enclosing.locals[i].name === name) {
        // Mark as captured so we know to close it later
        enclosing.locals[i].isCaptured = true;
        return this.addUpvalue(i, true);  // isLocal = true
      }
    }

    // Check if it's an upvalue in the enclosing function (recursive)
    const savedCurrent = this.current;
    this.current = enclosing;
    const upvalue = this.resolveUpvalue(name);
    this.current = savedCurrent;

    if (upvalue !== -1) {
      return this.addUpvalue(upvalue, false);  // isLocal = false (it's an upvalue)
    }

    return -1;  // Not found
  }

  beginScope() {
    this.current.scopeDepth++;
  }

  endScope() {
    this.current.scopeDepth--;
    // Pop locals that are going out of scope
    while (this.current.locals.length > 0 &&
           this.current.locals[this.current.locals.length - 1].depth > this.current.scopeDepth) {
      const local = this.current.locals.pop();
      if (local.isCaptured) {
        // Close the upvalue before popping
        this.emit(OpCode.CLOSE_UPVALUE);
      } else {
        this.emit(OpCode.POP);
      }
    }
  }

  // ============================================================
  // VISITOR - Dispatch to appropriate method
  // ============================================================

  visit(node) {
    if (!node) return;

    const methodName = `visit${node.type}`;
    if (this[methodName]) {
      return this[methodName](node);
    }

    throw new Error(`CodeGenerator: Unknown node type '${node.type}'`);
  }

  // ============================================================
  // PROGRAM
  // ============================================================

  visitProgram(node) {
    for (const stmt of node.statements) {
      this.visit(stmt);
    }
  }

  // ============================================================
  // LITERALS
  // ============================================================

  visitNumberLiteral(node) {
    this.emitConstant(node.value, node.line);
  }

  visitStringLiteral(node) {
    this.emitConstant(node.value, node.line);
  }

  visitBooleanLiteral(node) {
    this.emitConstant(node.value, node.line);
  }

  visitNullLiteral(node) {
    this.emitConstant(null, node.line);
  }

  visitArrayLiteral(node) {
    // Push all elements onto stack, then create array
    for (const element of node.elements) {
      this.visit(element);
    }
    this.emit(OpCode.MAKE_ARRAY, node.line);
    this.emit(node.elements.length, node.line);
  }

  visitObjectLiteral(node) {
    // Push key-value pairs, then create object
    for (const prop of node.properties) {
      this.emitConstant(prop.key, node.line);  // Key as string
      this.visit(prop.value);                   // Value
    }
    this.emit(OpCode.MAKE_OBJECT, node.line);
    this.emit(node.properties.length, node.line);
  }

  visitTemplateLiteral(node) {
    // Build string by concatenating parts
    let first = true;
    for (const part of node.parts) {
      if (part.type === 'text') {
        this.emitConstant(part.value, node.line);
      } else {
        this.visit(part.value);
        // Convert to string if needed (we'll handle in VM)
      }

      if (!first) {
        this.emit(OpCode.ADD, node.line);  // Concatenate
      }
      first = false;
    }

    // Handle empty template
    if (node.parts.length === 0) {
      this.emitConstant('', node.line);
    }
  }

  // ============================================================
  // EXPRESSIONS
  // ============================================================

  visitIdentifier(node) {
    const local = this.resolveLocal(node.name);
    if (local !== -1) {
      this.emitWithOperand(OpCode.LOAD, local, node.line);
    } else {
      const upvalue = this.resolveUpvalue(node.name);
      if (upvalue !== -1) {
        this.emitWithOperand(OpCode.GET_UPVALUE, upvalue, node.line);
      } else {
        const nameIndex = this.chunk.addConstant(node.name);
        this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
      }
    }
  }

  visitBinaryExpression(node) {
    this.visit(node.left);
    this.visit(node.right);

    switch (node.operator) {
      case '+': this.emit(OpCode.ADD, node.line); break;
      case '-': this.emit(OpCode.SUB, node.line); break;
      case '*': this.emit(OpCode.MUL, node.line); break;
      case '/': this.emit(OpCode.DIV, node.line); break;
      case '%': this.emit(OpCode.MOD, node.line); break;
      case '==': this.emit(OpCode.EQ, node.line); break;
      case '!=': this.emit(OpCode.NEQ, node.line); break;
      case '<': this.emit(OpCode.LT, node.line); break;
      case '<=': this.emit(OpCode.LTE, node.line); break;
      case '>': this.emit(OpCode.GT, node.line); break;
      case '>=': this.emit(OpCode.GTE, node.line); break;
      default:
        throw new Error(`Unknown binary operator: ${node.operator}`);
    }
  }

  visitUnaryExpression(node) {
    this.visit(node.operand);

    switch (node.operator) {
      case '-': this.emit(OpCode.NEG, node.line); break;
      case 'none': this.emit(OpCode.NOT, node.line); break;
      default:
        throw new Error(`Unknown unary operator: ${node.operator}`);
    }
  }

  visitLogicalExpression(node) {
    // Short-circuit evaluation
    this.visit(node.left);

    if (node.operator === 'with') {  // AND
      const endJump = this.emitJump(OpCode.JUMP_IF_FALSE, node.line);
      this.emit(OpCode.POP, node.line);
      this.visit(node.right);
      this.patchJump(endJump);
    } else {  // OR (either)
      const elseJump = this.emitJump(OpCode.JUMP_IF_FALSE, node.line);
      const endJump = this.emitJump(OpCode.JUMP, node.line);
      this.patchJump(elseJump);
      this.emit(OpCode.POP, node.line);
      this.visit(node.right);
      this.patchJump(endJump);
    }
  }

  visitCallExpression(node) {
    // Push the function
    this.visit(node.callee);

    // Push arguments
    for (const arg of node.arguments) {
      this.visit(arg);
    }

    // Call with argument count
    this.emit(OpCode.CALL, node.line);
    this.emit(node.arguments.length, node.line);
  }

  visitIndexExpression(node) {
    this.visit(node.object);
    this.visit(node.index);
    this.emit(OpCode.INDEX_GET, node.line);
  }

  visitUpdateExpression(node) {
    // x++ or ++x
    const local = this.resolveLocal(node.name);
    const upvalue = local === -1 ? this.resolveUpvalue(node.name) : -1;

    // Load current value
    if (local !== -1) {
      this.emitWithOperand(OpCode.LOAD, local, node.line);
    } else if (upvalue !== -1) {
      this.emitWithOperand(OpCode.GET_UPVALUE, upvalue, node.line);
    } else {
      const nameIndex = this.chunk.addConstant(node.name);
      this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
    }

    if (!node.prefix) {
      this.emit(OpCode.DUP, node.line);  // Keep original for postfix
    }

    // Add or subtract 1
    this.emitConstant(1, node.line);
    if (node.operator === '++') {
      this.emit(OpCode.ADD, node.line);
    } else {
      this.emit(OpCode.SUB, node.line);
    }

    // Store back
    if (local !== -1) {
      this.emitWithOperand(OpCode.STORE, local, node.line);
    } else if (upvalue !== -1) {
      this.emitWithOperand(OpCode.SET_UPVALUE, upvalue, node.line);
    } else {
      const nameIndex = this.chunk.addConstant(node.name);
      this.emitWithOperand(OpCode.STORE_GLOBAL, nameIndex, node.line);
    }

    if (node.prefix) {
      // Prefix: result is the new value (already on stack from STORE)
      if (local !== -1) {
        this.emitWithOperand(OpCode.LOAD, local, node.line);
      } else if (upvalue !== -1) {
        this.emitWithOperand(OpCode.GET_UPVALUE, upvalue, node.line);
      } else {
        const nameIndex = this.chunk.addConstant(node.name);
        this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
      }
    }
  }

  // ============================================================
  // VARIABLES
  // ============================================================

  visitVariableDeclaration(node) {
    this.visit(node.value);

    if (this.scopeDepth > 0) {
      // Local variable - value stays on stack as the local's slot
      this.addLocal(node.name);
    } else {
      // Global variable - store and pop (globals don't use stack slots)
      const nameIndex = this.chunk.addConstant(node.name);
      this.emitWithOperand(OpCode.STORE_GLOBAL, nameIndex, node.line);
      this.emit(OpCode.POP, node.line);  // Don't leave on stack
    }
  }

  visitAssignment(node) {
    this.visit(node.value);

    const local = this.resolveLocal(node.name);
    if (local !== -1) {
      this.emitWithOperand(OpCode.STORE, local, node.line);
    } else {
      const upvalue = this.resolveUpvalue(node.name);
      if (upvalue !== -1) {
        this.emitWithOperand(OpCode.SET_UPVALUE, upvalue, node.line);
      } else {
        const nameIndex = this.chunk.addConstant(node.name);
        this.emitWithOperand(OpCode.STORE_GLOBAL, nameIndex, node.line);
      }
    }
    // Leave value on stack (assignment is an expression)
  }

  visitIndexAssignment(node) {
    this.visit(node.object);
    this.visit(node.index);
    this.visit(node.value);
    this.emit(OpCode.INDEX_SET, node.line);
  }

  visitCompoundAssignment(node) {
    // x += 5 → x = x + 5
    const local = this.resolveLocal(node.name);
    const upvalue = local === -1 ? this.resolveUpvalue(node.name) : -1;

    // Load current value
    if (local !== -1) {
      this.emitWithOperand(OpCode.LOAD, local, node.line);
    } else if (upvalue !== -1) {
      this.emitWithOperand(OpCode.GET_UPVALUE, upvalue, node.line);
    } else {
      const nameIndex = this.chunk.addConstant(node.name);
      this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
    }

    // Push the operand
    this.visit(node.value);

    // Apply the operator
    switch (node.operator) {
      case '+': this.emit(OpCode.ADD, node.line); break;
      case '-': this.emit(OpCode.SUB, node.line); break;
      case '*': this.emit(OpCode.MUL, node.line); break;
      case '/': this.emit(OpCode.DIV, node.line); break;
    }

    // Store back
    if (local !== -1) {
      this.emitWithOperand(OpCode.STORE, local, node.line);
    } else if (upvalue !== -1) {
      this.emitWithOperand(OpCode.SET_UPVALUE, upvalue, node.line);
    } else {
      const nameIndex = this.chunk.addConstant(node.name);
      this.emitWithOperand(OpCode.STORE_GLOBAL, nameIndex, node.line);
    }
  }

  // ============================================================
  // STATEMENTS
  // ============================================================

  visitBlockStatement(node) {
    this.beginScope();
    for (const stmt of node.statements) {
      this.visit(stmt);
    }
    this.endScope();
  }

  visitExpressionStatement(node) {
    this.visit(node.expression);
    this.emit(OpCode.POP, node.line);  // Discard result
  }

  visitPrintStatement(node) {
    this.visit(node.value);
    this.emit(OpCode.PRINT, node.line);
  }

  visitEyeofStatement(node) {
    this.visit(node.label);
    this.visit(node.value);
    this.emit(OpCode.EYEOF, node.line);
  }

  // ============================================================
  // CONTROL FLOW
  // ============================================================

  visitIfStatement(node) {
    this.visit(node.condition);

    // Jump over 'then' branch if condition is false
    const thenJump = this.emitJump(OpCode.JUMP_IF_FALSE, node.line);
    this.emit(OpCode.POP, node.line);  // Pop condition

    // Compile 'then' branch
    this.visit(node.thenBranch);

    // Jump over 'else' branch
    const elseJump = this.emitJump(OpCode.JUMP, node.line);

    this.patchJump(thenJump);
    this.emit(OpCode.POP, node.line);  // Pop condition

    // Compile 'else' branch if present
    if (node.elseBranch) {
      this.visit(node.elseBranch);
    }

    this.patchJump(elseJump);
  }

  visitWhileStatement(node) {
    const loopStart = this.chunk.currentOffset();

    // Push loop info for break/continue
    this.loopStack.push({ start: loopStart, breaks: [] });

    this.visit(node.condition);
    const exitJump = this.emitJump(OpCode.JUMP_IF_FALSE, node.line);
    this.emit(OpCode.POP, node.line);

    this.visit(node.body);

    this.emitLoop(loopStart, node.line);

    this.patchJump(exitJump);
    this.emit(OpCode.POP, node.line);

    // Patch all break statements
    const loop = this.loopStack.pop();
    for (const breakJump of loop.breaks) {
      this.patchJump(breakJump);
    }
  }

  visitForInStatement(node) {
    // journey (x in arr) { ... }
    // Compile as:
    //   let __iter = arr
    //   let __i = 0
    //   while (__i < length(__iter)) {
    //     let x = __iter[__i]
    //     ...body...
    //     __i++
    //   }

    this.beginScope();

    // Store the iterable in a local: __iter = arr
    this.visit(node.iterable);
    const iterLocal = this.locals.length;
    this.addLocal('__iter');

    // Initialize index: __i = 0
    this.emitConstant(0, node.line);
    const indexLocal = this.locals.length;
    this.addLocal('__i');

    // Loop variable slot (will hold current element)
    this.emitConstant(null, node.line);  // Placeholder value
    const varLocal = this.locals.length;
    this.addLocal(node.variable);

    // Loop start - save position for jumping back
    const loopStart = this.chunk.currentOffset();
    this.loopStack.push({ start: loopStart, breaks: [] });

    // Condition: __i < length(__iter)
    this.emitWithOperand(OpCode.LOAD, indexLocal, node.line);  // Push __i
    this.emitWithOperand(OpCode.LOAD, iterLocal, node.line);   // Push __iter
    this.emit(OpCode.LENGTH, node.line);                       // Replace __iter with its length
    this.emit(OpCode.LT, node.line);                           // __i < length

    // Jump to end if condition is false
    const exitJump = this.emitJump(OpCode.JUMP_IF_FALSE, node.line);
    this.emit(OpCode.POP, node.line);  // Pop the condition result

    // Get current element: x = __iter[__i]
    this.emitWithOperand(OpCode.LOAD, iterLocal, node.line);   // Push __iter
    this.emitWithOperand(OpCode.LOAD, indexLocal, node.line);  // Push __i
    this.emit(OpCode.INDEX_GET, node.line);                    // Get __iter[__i]
    this.emitWithOperand(OpCode.STORE, varLocal, node.line);   // Store in x
    this.emit(OpCode.POP, node.line);  // Pop the stored value

    // Compile the loop body
    this.visit(node.body);

    // Increment index: __i = __i + 1
    this.emitWithOperand(OpCode.LOAD, indexLocal, node.line);  // Push __i
    this.emitConstant(1, node.line);                           // Push 1
    this.emit(OpCode.ADD, node.line);                          // __i + 1
    this.emitWithOperand(OpCode.STORE, indexLocal, node.line); // Store back in __i
    this.emit(OpCode.POP, node.line);  // Pop the stored value

    // Jump back to loop start
    this.emitLoop(loopStart, node.line);

    // Patch the exit jump
    this.patchJump(exitJump);
    this.emit(OpCode.POP, node.line);  // Pop the condition result

    // Patch all break statements
    const loop = this.loopStack.pop();
    for (const breakJump of loop.breaks) {
      this.patchJump(breakJump);
    }

    this.endScope();
  }

  visitBreakStatement(node) {
    if (this.loopStack.length === 0) {
      throw new Error('flee (break) outside of loop');
    }
    const jump = this.emitJump(OpCode.JUMP, node.line);
    this.loopStack[this.loopStack.length - 1].breaks.push(jump);
  }

  visitContinueStatement(node) {
    if (this.loopStack.length === 0) {
      throw new Error('onwards (continue) outside of loop');
    }
    const loop = this.loopStack[this.loopStack.length - 1];
    this.emitLoop(loop.start, node.line);
  }

  // ============================================================
  // FUNCTIONS
  // ============================================================

  visitFunctionDeclaration(node) {
    // Create a new compiler context for the function
    const funcContext = new CompilerContext(node.name, this.current);
    const outerContext = this.current;

    this.current = funcContext;

    // Parameters become locals
    this.beginScope();
    for (const param of node.params) {
      this.addLocal(param);
    }

    // Compile body
    if (Array.isArray(node.body)) {
      for (const stmt of node.body) {
        this.visit(stmt);
      }
    } else {
      this.visit(node.body);
    }

    // Implicit return null
    this.emitConstant(null);
    this.emit(OpCode.RETURN);

    // Get the compiled function info
    const funcChunk = this.current.chunk;
    const upvalues = this.current.upvalues;

    // Restore outer context
    this.current = outerContext;

    // Create function object
    const func = new TmbdlBytecodeFunction(node.name, node.params.length, funcChunk);
    func.upvalueCount = upvalues.length;

    // Emit MAKE_CLOSURE with upvalue descriptors
    const funcIndex = this.chunk.addConstant(func);
    this.emitWithOperand(OpCode.MAKE_CLOSURE, funcIndex, node.line);

    // Emit upvalue descriptors: [isLocal, index] for each
    for (const upvalue of upvalues) {
      this.emit(upvalue.isLocal ? 1 : 0, node.line);
      this.emit(upvalue.index, node.line);
    }

    // Store in global and pop (function declaration is a statement, not expression)
    const nameIndex = this.chunk.addConstant(node.name);
    this.emitWithOperand(OpCode.STORE_GLOBAL, nameIndex, node.line);
    this.emit(OpCode.POP, node.line);
  }

  visitReturnStatement(node) {
    if (node.value) {
      this.visit(node.value);
    } else {
      this.emitConstant(null, node.line);
    }
    this.emit(OpCode.RETURN, node.line);
  }

  visitLambdaExpression(node) {
    // Create a new compiler context for the lambda
    const funcContext = new CompilerContext('<lambda>', this.current);
    const outerContext = this.current;

    this.current = funcContext;

    this.beginScope();
    for (const param of node.params) {
      this.addLocal(param);
    }

    // Body might be expression or block
    if (Array.isArray(node.body)) {
      for (const stmt of node.body) {
        this.visit(stmt);
      }
      this.emitConstant(null);
    } else if (node.body.type === 'BlockStatement') {
      this.visit(node.body);
      this.emitConstant(null);
    } else {
      // Expression body - return it
      this.visit(node.body);
    }
    this.emit(OpCode.RETURN);

    // Get the compiled function info
    const funcChunk = this.current.chunk;
    const upvalues = this.current.upvalues;

    // Restore outer context
    this.current = outerContext;

    // Create function object
    const func = new TmbdlBytecodeFunction('<lambda>', node.params.length, funcChunk);
    func.upvalueCount = upvalues.length;

    // Emit MAKE_CLOSURE with upvalue descriptors
    const funcIndex = this.chunk.addConstant(func);
    this.emitWithOperand(OpCode.MAKE_CLOSURE, funcIndex, node.line);

    // Emit upvalue descriptors: [isLocal, index] for each
    for (const upvalue of upvalues) {
      this.emit(upvalue.isLocal ? 1 : 0, node.line);
      this.emit(upvalue.index, node.line);
    }
  }

  // ============================================================
  // TRY/CATCH (simplified - just compile the try block for now)
  // ============================================================

  visitTryStatement(node) {
    // TODO: Proper exception handling
    // For now, just compile try block
    this.visit(node.tryBlock);
  }

  // ============================================================
  // CLASSES (Placeholder - complex to implement)
  // ============================================================

  visitRealmDeclaration(node) {
    console.warn('Warning: Classes not fully implemented in bytecode yet');
    // TODO: Implement class compilation
  }

  visitSelfExpression(node) {
    this.emit(OpCode.GET_THIS, node.line);
  }

  visitPropertyAccess(node) {
    this.visit(node.object);
    const propIndex = this.chunk.addConstant(node.property);
    this.emitWithOperand(OpCode.GET_PROP, propIndex, node.line);
  }

  visitPropertyAssignment(node) {
    this.visit(node.object);
    const propIndex = this.chunk.addConstant(node.property);
    this.visit(node.value);
    this.emitWithOperand(OpCode.SET_PROP, propIndex, node.line);
  }

  visitCreateExpression(node) {
    console.warn('Warning: create (new) not implemented in bytecode yet');
  }

  // ============================================================
  // MODULES (Not implemented for bytecode)
  // ============================================================

  visitSummonStatement(node) {
    // Emit IMPORT with the module path
    const pathIndex = this.chunk.addConstant(node.path);
    this.emitWithOperand(OpCode.IMPORT, pathIndex, node.line);

    if (node.imports) {
      // Destructured import: summon { x, y } from "module"
      // Stack has the module exports object
      for (const { name, alias } of node.imports) {
        this.emit(OpCode.DUP, node.line);  // Keep module on stack
        const nameIndex = this.chunk.addConstant(name);
        this.emitWithOperand(OpCode.GET_PROP, nameIndex, node.line);
        // Store in current scope
        if (this.current.scopeDepth > 0) {
          this.addLocal(alias);
        } else {
          const aliasIndex = this.chunk.addConstant(alias);
          this.emitWithOperand(OpCode.STORE_GLOBAL, aliasIndex, node.line);
          this.emit(OpCode.POP, node.line);
        }
      }
      this.emit(OpCode.POP, node.line);  // Pop module object
    } else if (node.alias) {
      // Import as namespace: summon "module" as m
      if (this.current.scopeDepth > 0) {
        this.addLocal(node.alias);
      } else {
        const aliasIndex = this.chunk.addConstant(node.alias);
        this.emitWithOperand(OpCode.STORE_GLOBAL, aliasIndex, node.line);
        this.emit(OpCode.POP, node.line);
      }
    } else {
      // Import all exports into current scope
      // We can't easily do this in bytecode without knowing the keys at compile time
      // For now, store as __module_<path>
      const tempName = `__module_${node.path}`;
      const tempIndex = this.chunk.addConstant(tempName);
      this.emitWithOperand(OpCode.STORE_GLOBAL, tempIndex, node.line);
      this.emit(OpCode.POP, node.line);
    }
  }

  visitShareStatement(node) {
    if (node.declaration) {
      // share ring x = 5 or share song foo() {}
      this.visit(node.declaration);

      // Get the name from the declaration
      const name = node.declaration.name;
      const nameIndex = this.chunk.addConstant(name);

      // Load the value we just defined
      if (this.current.scopeDepth > 0) {
        const local = this.resolveLocal(name);
        this.emitWithOperand(OpCode.LOAD, local, node.line);
      } else {
        this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
      }

      // Export it
      this.emitWithOperand(OpCode.EXPORT, nameIndex, node.line);
    } else if (node.names) {
      // share { x, y, z }
      for (const name of node.names) {
        const nameIndex = this.chunk.addConstant(name);

        // Load the value
        const local = this.resolveLocal(name);
        if (local !== -1) {
          this.emitWithOperand(OpCode.LOAD, local, node.line);
        } else {
          this.emitWithOperand(OpCode.LOAD_GLOBAL, nameIndex, node.line);
        }

        // Export it
        this.emitWithOperand(OpCode.EXPORT, nameIndex, node.line);
      }
    }
  }
}
