import { Environment, ReturnValue, BreakSignal, ContinueSignal, TmbdlFunction, TmbdlLambda } from './environment.js';
import { RuntimeError, TypeError, DivisionByZeroError, TmbdlError } from './errors.js';
import { createStdlib, NativeFunction, HigherOrderFunction, formatValue } from './stdlib.js';

export class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.environment = this.globals;

    // Load standard library
    const stdlib = createStdlib();
    for (const [name, fn] of stdlib) {
      this.globals.define(name, fn);
    }
  }

  interpret(program) {
    let result = null;

    for (const statement of program.statements) {
      result = this.execute(statement);
    }

    return result;
  }

  execute(node) {
    switch (node.type) {
      case 'Program':
        return this.interpret(node);

      case 'VariableDeclaration':
        return this.executeVariableDeclaration(node);

      case 'Assignment':
        return this.executeAssignment(node);

      case 'IndexAssignment':
        return this.executeIndexAssignment(node);

      case 'BlockStatement':
        return this.executeBlock(node.statements, new Environment(this.environment));

      case 'IfStatement':
        return this.executeIf(node);

      case 'WhileStatement':
        return this.executeWhile(node);

      case 'ForInStatement':
        return this.executeForIn(node);

      case 'FunctionDeclaration':
        return this.executeFunctionDeclaration(node);

      case 'ReturnStatement':
        return this.executeReturn(node);

      case 'BreakStatement':
        throw new BreakSignal();

      case 'ContinueStatement':
        throw new ContinueSignal();

      case 'PrintStatement':
        return this.executePrint(node);

      case 'EyeofStatement':
        return this.executeEyeof(node);

      case 'TryStatement':
        return this.executeTry(node);

      case 'CompoundAssignment':
        return this.executeCompoundAssignment(node);

      case 'UpdateExpression':
        return this.executeUpdate(node);

      case 'ExpressionStatement':
        return this.evaluate(node.expression);

      default:
        return this.evaluate(node);
    }
  }

  executeTry(node) {
    try {
      return this.execute(node.tryBlock);
    } catch (error) {
      // Only catch TmbdlErrors, not control flow signals
      if (error instanceof ReturnValue || error instanceof BreakSignal || error instanceof ContinueSignal) {
        throw error;
      }

      // Create error object for the rescue block
      const errorObj = {
        message: error.message || String(error),
        line: error.line || null,
        name: error.name || 'Error'
      };

      const catchEnv = new Environment(this.environment);
      catchEnv.define(node.catchParam, errorObj);
      return this.executeBlock(node.catchBlock.statements, catchEnv);
    }
  }

  executeCompoundAssignment(node) {
    const current = this.environment.get(node.name, node.line, node.column);
    const operand = this.evaluate(node.value);

    let result;
    switch (node.operator) {
      case '+':
        if (typeof current === 'string' || typeof operand === 'string') {
          result = formatValue(current) + formatValue(operand);
        } else {
          result = current + operand;
        }
        break;
      case '-':
        result = current - operand;
        break;
      case '*':
        result = current * operand;
        break;
      case '/':
        if (operand === 0) {
          throw new DivisionByZeroError(node.line, node.column);
        }
        result = current / operand;
        break;
      default:
        throw new RuntimeError(`Unknown compound operator: ${node.operator}`, node.line, node.column);
    }

    this.environment.assign(node.name, result, node.line, node.column);
    return result;
  }

  executeUpdate(node) {
    const current = this.environment.get(node.name, node.line, node.column);

    if (typeof current !== 'number') {
      throw new TypeError(
        `One does not simply use '${node.operator}' on a non-number`,
        node.line,
        node.column
      );
    }

    const newValue = node.operator === '++' ? current + 1 : current - 1;
    this.environment.assign(node.name, newValue, node.line, node.column);

    // Return old value for postfix, new value for prefix
    return node.prefix ? newValue : current;
  }

  executeVariableDeclaration(node) {
    let value = null;
    if (node.value) {
      value = this.evaluate(node.value);
    }
    this.environment.define(node.name, value, node.isConstant);
    return value;
  }

  executeAssignment(node) {
    const value = this.evaluate(node.value);
    this.environment.assign(node.name, value, node.line, node.column);
    return value;
  }

  executeIndexAssignment(node) {
    const object = this.evaluate(node.object);
    const index = this.evaluate(node.index);
    const value = this.evaluate(node.value);

    if (Array.isArray(object)) {
      object[index] = value;
    } else if (typeof object === 'object' && object !== null) {
      object[index] = value;
    } else {
      throw new TypeError(
        'Cannot index into this value',
        node.line,
        node.column
      );
    }

    return value;
  }

  executeBlock(statements, environment) {
    const previous = this.environment;
    let result = null;

    try {
      this.environment = environment;
      for (const statement of statements) {
        result = this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }

    return result;
  }

  executeIf(node) {
    const condition = this.evaluate(node.condition);

    if (this.isTruthy(condition)) {
      return this.execute(node.thenBranch);
    } else if (node.elseBranch) {
      return this.execute(node.elseBranch);
    }

    return null;
  }

  executeWhile(node) {
    let result = null;

    while (this.isTruthy(this.evaluate(node.condition))) {
      try {
        result = this.execute(node.body);
      } catch (signal) {
        if (signal instanceof BreakSignal) break;
        if (signal instanceof ContinueSignal) continue;
        throw signal;
      }
    }

    return result;
  }

  executeForIn(node) {
    const iterable = this.evaluate(node.iterable);
    let result = null;

    if (!Array.isArray(iterable) && typeof iterable !== 'string') {
      throw new TypeError(
        'Can only journey through a fellowship (array) or tale (string)',
        node.line,
        node.column
      );
    }

    const items = Array.isArray(iterable) ? iterable : [...iterable];

    for (const item of items) {
      const loopEnv = new Environment(this.environment);
      loopEnv.define(node.variable, item);

      try {
        result = this.executeBlock(node.body.statements, loopEnv);
      } catch (signal) {
        if (signal instanceof BreakSignal) break;
        if (signal instanceof ContinueSignal) continue;
        throw signal;
      }
    }

    return result;
  }

  executeFunctionDeclaration(node) {
    const fn = new TmbdlFunction(node, this.environment);
    this.environment.define(node.name, fn);
    return fn;
  }

  executeReturn(node) {
    let value = null;
    if (node.value) {
      value = this.evaluate(node.value);
    }
    throw new ReturnValue(value);
  }

  executePrint(node) {
    const value = this.evaluate(node.value);
    console.log(formatValue(value));
    return value;
  }

  executeEyeof(node) {
    const label = this.evaluate(node.label);
    const value = this.evaluate(node.value);

    // The Eye of Sauron sees all
    console.log(`\x1b[31m👁 [${formatValue(label)}]:\x1b[0m ${formatValue(value)}`);

    return value;
  }

  evaluate(node) {
    switch (node.type) {
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        return node.value;

      case 'NullLiteral':
        return null;

      case 'ArrayLiteral':
        return node.elements.map(el => this.evaluate(el));

      case 'ObjectLiteral':
        const obj = {};
        for (const prop of node.properties) {
          obj[prop.key] = this.evaluate(prop.value);
        }
        return obj;

      case 'Identifier':
        return this.environment.get(node.name, node.line, node.column);

      case 'BinaryExpression':
        return this.evaluateBinary(node);

      case 'UnaryExpression':
        return this.evaluateUnary(node);

      case 'LogicalExpression':
        return this.evaluateLogical(node);

      case 'CallExpression':
        return this.evaluateCall(node);

      case 'IndexExpression':
        return this.evaluateIndex(node);

      case 'LambdaExpression':
        return new TmbdlLambda(node.params, node.body, this.environment);

      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node);

      case 'UpdateExpression':
        return this.executeUpdate(node);

      default:
        throw new RuntimeError(
          `Unknown expression type: ${node.type}`,
          node.line,
          node.column
        );
    }
  }

  evaluateBinary(node) {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);

    switch (node.operator) {
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return formatValue(left) + formatValue(right);
        }
        return left + right;

      case '-':
        this.checkNumbers(left, right, '-', node);
        return left - right;

      case '*':
        this.checkNumbers(left, right, '*', node);
        return left * right;

      case '/':
        this.checkNumbers(left, right, '/', node);
        if (right === 0) {
          throw new DivisionByZeroError(node.line, node.column);
        }
        return left / right;

      case '%':
        this.checkNumbers(left, right, '%', node);
        return left % right;

      case '==':
        return this.isEqual(left, right);

      case '!=':
        return !this.isEqual(left, right);

      case '<':
        this.checkNumbers(left, right, '<', node);
        return left < right;

      case '>':
        this.checkNumbers(left, right, '>', node);
        return left > right;

      case '<=':
        this.checkNumbers(left, right, '<=', node);
        return left <= right;

      case '>=':
        this.checkNumbers(left, right, '>=', node);
        return left >= right;

      default:
        throw new RuntimeError(
          `Unknown operator: ${node.operator}`,
          node.line,
          node.column
        );
    }
  }

  evaluateUnary(node) {
    const operand = this.evaluate(node.operand);

    switch (node.operator) {
      case '-':
        if (typeof operand !== 'number') {
          throw new TypeError(
            'One does not simply negate a non-number',
            node.line,
            node.column
          );
        }
        return -operand;

      case 'none':
        return !this.isTruthy(operand);

      default:
        throw new RuntimeError(
          `Unknown unary operator: ${node.operator}`,
          node.line,
          node.column
        );
    }
  }

  evaluateLogical(node) {
    const left = this.evaluate(node.left);

    if (node.operator === 'either') {
      if (this.isTruthy(left)) return left;
    } else if (node.operator === 'with') {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(node.right);
  }

  evaluateCall(node) {
    const callee = this.evaluate(node.callee);
    const args = node.arguments.map(arg => this.evaluate(arg));

    // Native function
    if (callee instanceof NativeFunction) {
      if (callee.arity !== -1 && args.length !== callee.arity) {
        throw new RuntimeError(
          `Song '${callee.name}' expects ${callee.arity} arguments but received ${args.length}`,
          node.line,
          node.column
        );
      }

      // For higher-order functions, provide a callback invoker
      if (callee.isHigherOrder) {
        const callFn = (callback, callArgs) => {
          return this.invokeCallable(callback, callArgs, node);
        };
        return callee.call(args, callFn);
      }

      return callee.call(args);
    }

    // User-defined function
    if (callee instanceof TmbdlFunction) {
      if (args.length !== callee.params.length) {
        throw new RuntimeError(
          `Song '${callee.name}' expects ${callee.params.length} arguments but received ${args.length}`,
          node.line,
          node.column
        );
      }

      const environment = new Environment(callee.closure);
      for (let i = 0; i < callee.params.length; i++) {
        environment.define(callee.params[i], args[i]);
      }

      try {
        this.executeBlock(callee.body, environment);
      } catch (returnValue) {
        if (returnValue instanceof ReturnValue) {
          return returnValue.value;
        }
        throw returnValue;
      }

      return null;
    }

    // Lambda expression
    if (callee instanceof TmbdlLambda) {
      if (args.length !== callee.params.length) {
        throw new RuntimeError(
          `Lambda expects ${callee.params.length} arguments but received ${args.length}`,
          node.line,
          node.column
        );
      }

      const environment = new Environment(callee.closure);
      for (let i = 0; i < callee.params.length; i++) {
        environment.define(callee.params[i], args[i]);
      }

      // Lambda body can be an expression (implicit return) or a block
      if (Array.isArray(callee.body)) {
        // Block body
        try {
          this.executeBlock(callee.body, environment);
        } catch (returnValue) {
          if (returnValue instanceof ReturnValue) {
            return returnValue.value;
          }
          throw returnValue;
        }
        return null;
      } else {
        // Expression body - evaluate and return
        const previous = this.environment;
        try {
          this.environment = environment;
          return this.evaluate(callee.body);
        } finally {
          this.environment = previous;
        }
      }
    }

    throw new TypeError(
      `'${formatValue(callee)}' is not a song (function)`,
      node.line,
      node.column
    );
  }

  evaluateTemplateLiteral(node) {
    let result = '';
    for (const part of node.parts) {
      if (part.type === 'text') {
        result += part.value;
      } else {
        const value = this.evaluate(part.value);
        result += formatValue(value);
      }
    }
    return result;
  }

  evaluateIndex(node) {
    const object = this.evaluate(node.object);
    const index = this.evaluate(node.index);

    if (Array.isArray(object)) {
      if (typeof index !== 'number') {
        throw new TypeError(
          'Fellowship (array) index must be a number',
          node.line,
          node.column
        );
      }
      return object[index];
    }

    if (typeof object === 'string') {
      if (typeof index !== 'number') {
        throw new TypeError(
          'Tale (string) index must be a number',
          node.line,
          node.column
        );
      }
      return object[index];
    }

    if (typeof object === 'object' && object !== null) {
      return object[index];
    }

    throw new TypeError(
      'Cannot index into this value',
      node.line,
      node.column
    );
  }

  // Helper methods

  isTruthy(value) {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    return true;
  }

  isEqual(a, b) {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return a === b;
  }

  checkNumbers(left, right, operator, node) {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw new TypeError(
        `One does not simply use '${operator}' with non-numbers`,
        node.line,
        node.column
      );
    }
  }

  // Helper to invoke any callable (function, lambda, or native)
  invokeCallable(callable, args, node) {
    if (callable instanceof TmbdlFunction) {
      const environment = new Environment(callable.closure);
      for (let i = 0; i < callable.params.length && i < args.length; i++) {
        environment.define(callable.params[i], args[i]);
      }

      try {
        this.executeBlock(callable.body, environment);
      } catch (returnValue) {
        if (returnValue instanceof ReturnValue) {
          return returnValue.value;
        }
        throw returnValue;
      }
      return null;
    }

    if (callable instanceof TmbdlLambda) {
      const environment = new Environment(callable.closure);
      for (let i = 0; i < callable.params.length && i < args.length; i++) {
        environment.define(callable.params[i], args[i]);
      }

      if (Array.isArray(callable.body)) {
        try {
          this.executeBlock(callable.body, environment);
        } catch (returnValue) {
          if (returnValue instanceof ReturnValue) {
            return returnValue.value;
          }
          throw returnValue;
        }
        return null;
      } else {
        const previous = this.environment;
        try {
          this.environment = environment;
          return this.evaluate(callable.body);
        } finally {
          this.environment = previous;
        }
      }
    }

    if (callable instanceof NativeFunction) {
      return callable.call(args);
    }

    throw new TypeError(
      `'${formatValue(callable)}' is not callable`,
      node.line,
      node.column
    );
  }
}
