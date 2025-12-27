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

// Class (Realm) representation
export class TmbdlClass {
  constructor(name, superClass, constructor_, methods) {
    this.name = name;
    this.superClass = superClass;  // TmbdlClass or null
    this.constructor = constructor_;  // ForgeDeclaration or null
    this.methods = new Map();  // Map of method name -> TmbdlFunction

    // Register methods
    for (const method of methods) {
      this.methods.set(method.name, method);
    }
  }

  findMethod(name) {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }
    // Check parent class
    if (this.superClass) {
      return this.superClass.findMethod(name);
    }
    return null;
  }

  toString() {
    return `<realm ${this.name}>`;
  }
}

// Instance of a class
export class TmbdlInstance {
  constructor(klass) {
    this.klass = klass;
    this.fields = new Map();
  }

  get(name) {
    // First check instance fields
    if (this.fields.has(name)) {
      return this.fields.get(name);
    }
    // Then check methods
    const method = this.klass.findMethod(name);
    if (method) {
      return method;
    }
    return undefined;
  }

  set(name, value) {
    this.fields.set(name, value);
  }

  toString() {
    return `<${this.klass.name} instance>`;
  }
}
