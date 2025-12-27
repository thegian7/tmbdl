import { UndefinedVariableError, ConstantError } from './errors.js';

export class Environment {
  constructor(parent = null) {
    this.values = new Map();
    this.constants = new Set();
    this.parent = parent;
  }

  define(name, value, isConstant = false) {
    this.values.set(name, value);
    if (isConstant) {
      this.constants.add(name);
    }
  }

  get(name, line, column) {
    if (this.values.has(name)) {
      return this.values.get(name);
    }

    if (this.parent) {
      return this.parent.get(name, line, column);
    }

    throw new UndefinedVariableError(name, line, column);
  }

  assign(name, value, line, column) {
    if (this.values.has(name)) {
      if (this.constants.has(name)) {
        throw new ConstantError(name, line, column);
      }
      this.values.set(name, value);
      return;
    }

    if (this.parent) {
      this.parent.assign(name, value, line, column);
      return;
    }

    throw new UndefinedVariableError(name, line, column);
  }

  has(name) {
    if (this.values.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }

  // Create a child scope
  extend() {
    return new Environment(this);
  }
}

// Special control flow signals
export class ReturnValue {
  constructor(value) {
    this.value = value;
  }
}

export class BreakSignal {}
export class ContinueSignal {}

// User-defined function representation
export class TmbdlFunction {
  constructor(declaration, closure) {
    this.declaration = declaration;
    this.closure = closure;
    this.name = declaration.name;
    this.params = declaration.params;
    this.body = declaration.body;
  }

  toString() {
    return `<song ${this.name}>`;
  }
}

// Lambda/anonymous function representation
export class TmbdlLambda {
  constructor(params, body, closure) {
    this.params = params;
    this.body = body;
    this.closure = closure;
  }

  toString() {
    return `<lambda (${this.params.join(', ')})>`;
  }
}
