// Tmbdl Compiler - Transpiles Tmbdl AST to JavaScript
//
// The compiler "visits" each AST node and outputs equivalent JavaScript.
// We start simple (literals) and build up to complex (classes).

export class Compiler {
  constructor() {
    this.indentLevel = 0;
    this.indentStr = '  '; // 2 spaces
  }

  // Main entry point - compile an entire program
  compile(ast) {
    // The runtime provides stdlib functions like sing, eyeof, etc.
    const runtime = this.generateRuntime();
    const code = this.visit(ast);
    return runtime + '\n' + code;
  }

  // Compile without runtime (for testing individual pieces)
  compileWithoutRuntime(ast) {
    return this.visit(ast);
  }

  // Generate the runtime support code
  generateRuntime() {
    return `// Tmbdl Runtime
const __tmbdl_print = (...args) => console.log(...args);
const __tmbdl_eyeof = (label, value) => console.debug(\`👁 [\${label}]:\`, value);

// Standard library functions
const length = (x) => x.length;
const push = (arr, val) => { arr.push(val); return arr; };
const pop = (arr) => arr.pop();
const type = (x) => {
  if (x === null) return 'shadow';
  if (typeof x === 'boolean') return 'truth';
  if (typeof x === 'number') return 'number';
  if (typeof x === 'string') return 'tale';
  if (Array.isArray(x)) return 'fellowship';
  if (typeof x === 'function') return 'song';
  if (typeof x === 'object') return 'realm';
  return 'unknown';
};
const str = (x) => String(x);
const num = (x) => Number(x);
const floor = (x) => Math.floor(x);
const ceil = (x) => Math.ceil(x);
const round = (x) => Math.round(x);
const abs = (x) => Math.abs(x);
const min = (...args) => Math.min(...args);
const max = (...args) => Math.max(...args);
const random = () => Math.random();
const range = (start, end, step = 1) => {
  if (end === undefined) { end = start; start = 0; }
  const result = [];
  if (step > 0) for (let i = start; i < end; i += step) result.push(i);
  else for (let i = start; i > end; i += step) result.push(i);
  return result;
};
const keys = (obj) => Object.keys(obj);
const values = (obj) => Object.values(obj);
const split = (str, delim) => str.split(delim);
const join = (arr, delim) => arr.join(delim);
const slice = (x, start, end) => x.slice(start, end);
const map = (arr, fn) => arr.map(fn);
const filter = (arr, fn) => arr.filter(fn);
const reduce = (arr, fn, init) => init !== undefined ? arr.reduce(fn, init) : arr.reduce(fn);
const find = (arr, fn) => arr.find(fn) ?? null;
const some = (arr, fn) => arr.some(fn);
const every = (arr, fn) => arr.every(fn);
const sort = (arr, fn) => [...arr].sort(fn || ((a, b) => a - b));
`;
  }

  // Helper: get current indentation
  indent() {
    return this.indentStr.repeat(this.indentLevel);
  }

  // The visitor - dispatches to the appropriate method based on node type
  visit(node) {
    if (!node) return '';

    const methodName = `visit${node.type}`;
    if (this[methodName]) {
      return this[methodName](node);
    }

    throw new Error(`Compiler: Unknown node type '${node.type}'`);
  }

  // ============================================================
  // LITERALS - The simplest nodes, just output their JS equivalent
  // ============================================================

  visitNumberLiteral(node) {
    // 42 → "42"
    return String(node.value);
  }

  visitStringLiteral(node) {
    // "hello" → '"hello"'
    // We need to escape the string properly for JS
    const escaped = node.value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }

  visitBooleanLiteral(node) {
    // goldberry → "true", sauron → "false"
    return node.value ? 'true' : 'false';
  }

  visitNullLiteral(node) {
    // shadow → "null"
    return 'null';
  }

  visitArrayLiteral(node) {
    // [1, 2, 3] → "[1, 2, 3]"
    const elements = node.elements.map(el => this.visit(el));
    return `[${elements.join(', ')}]`;
  }

  visitObjectLiteral(node) {
    // {name: "frodo"} → '{name: "frodo"}'
    const props = node.properties.map(prop => {
      const key = prop.key;
      const value = this.visit(prop.value);
      return `${key}: ${value}`;
    });
    return `{${props.join(', ')}}`;
  }

  visitTemplateLiteral(node) {
    // `Hello {name}` → `Hello ${name}`
    let result = '`';
    for (const part of node.parts) {
      if (part.type === 'text') {
        result += part.value;
      } else {
        // It's an expression
        result += '${' + this.visit(part.value) + '}';
      }
    }
    result += '`';
    return result;
  }

  // ============================================================
  // EXPRESSIONS - Combine values with operators
  // ============================================================

  visitIdentifier(node) {
    // Variable name stays the same
    return node.name;
  }

  visitBinaryExpression(node) {
    // a + b → "(a + b)"
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    return `(${left} ${node.operator} ${right})`;
  }

  visitUnaryExpression(node) {
    // none x → "(!x)"  (none is our NOT)
    const operand = this.visit(node.operand);
    const operator = node.operator === 'none' ? '!' : node.operator;
    return `(${operator}${operand})`;
  }

  visitLogicalExpression(node) {
    // a with b → "(a && b)"
    // a either b → "(a || b)"
    const left = this.visit(node.left);
    const right = this.visit(node.right);

    let jsOperator;
    switch (node.operator) {
      case 'with': jsOperator = '&&'; break;
      case 'either': jsOperator = '||'; break;
      default: jsOperator = node.operator;
    }

    return `(${left} ${jsOperator} ${right})`;
  }

  visitCallExpression(node) {
    // greet("Frodo") → "greet("Frodo")"
    const callee = this.visit(node.callee);
    const args = node.arguments.map(arg => this.visit(arg));
    return `${callee}(${args.join(', ')})`;
  }

  visitIndexExpression(node) {
    // arr[0] → "arr[0]"
    const obj = this.visit(node.object);
    const index = this.visit(node.index);
    return `${obj}[${index}]`;
  }

  visitUpdateExpression(node) {
    // x++ → "x++", ++x → "++x"
    if (node.prefix) {
      return `(${node.operator}${node.name})`;
    } else {
      return `(${node.name}${node.operator})`;
    }
  }

  visitLambdaExpression(node) {
    // (x) => x * 2 → "(x) => x * 2"
    const params = node.params.join(', ');

    // Body can be an expression, block, or array
    if (Array.isArray(node.body) || (node.body && node.body.type === 'BlockStatement')) {
      const body = this.compileBody(node.body);
      return `(${params}) => ${body}`;
    } else {
      const body = this.visit(node.body);
      return `(${params}) => ${body}`;
    }
  }

  // ============================================================
  // VARIABLES - Declarations and assignments
  // ============================================================

  visitVariableDeclaration(node) {
    // ring x = 5 → "let x = 5;"
    // precious y = 10 → "const y = 10;"
    const keyword = node.isConstant ? 'const' : 'let';
    const value = this.visit(node.value);
    return `${this.indent()}${keyword} ${node.name} = ${value};`;
  }

  visitAssignment(node) {
    // x = 10 → "x = 10"
    const value = this.visit(node.value);
    return `${node.name} = ${value}`;
  }

  visitIndexAssignment(node) {
    // arr[0] = 5 → "arr[0] = 5"
    const obj = this.visit(node.object);
    const index = this.visit(node.index);
    const value = this.visit(node.value);
    return `${obj}[${index}] = ${value}`;
  }

  visitCompoundAssignment(node) {
    // x += 5 → "x += 5"
    const value = this.visit(node.value);
    return `${node.name} ${node.operator}= ${value}`;
  }

  // ============================================================
  // STATEMENTS - Program structure
  // ============================================================

  visitProgram(node) {
    // Compile all statements
    const statements = node.statements.map(stmt => this.visit(stmt));
    return statements.join('\n');
  }

  visitBlockStatement(node) {
    // { ... } → "{ ... }"
    this.indentLevel++;
    const statements = node.statements.map(stmt => this.visit(stmt));
    this.indentLevel--;

    return `{\n${statements.join('\n')}\n${this.indent()}}`;
  }

  visitExpressionStatement(node) {
    // An expression used as a statement
    return `${this.indent()}${this.visit(node.expression)};`;
  }

  visitPrintStatement(node) {
    // sing "hello" → 'console.log("hello");'
    const value = this.visit(node.value);
    return `${this.indent()}__tmbdl_print(${value});`;
  }

  visitEyeofStatement(node) {
    // eyeof "label" value → 'console.debug("👁 [label]:", value);'
    const label = this.visit(node.label);
    const value = this.visit(node.value);
    return `${this.indent()}__tmbdl_eyeof(${label}, ${value});`;
  }

  // ============================================================
  // CONTROL FLOW - Conditionals and loops
  // ============================================================

  visitIfStatement(node) {
    // perhaps (x > 0) { ... } otherwise { ... }
    // → if (x > 0) { ... } else { ... }
    const condition = this.visit(node.condition);
    const thenBranch = this.visit(node.thenBranch);

    let result = `${this.indent()}if (${condition}) ${thenBranch}`;

    if (node.elseBranch) {
      const elseBranch = this.visit(node.elseBranch);
      // Check if it's an else-if chain
      if (node.elseBranch.type === 'IfStatement') {
        result += ` else ${elseBranch.trim()}`;
      } else {
        result += ` else ${elseBranch}`;
      }
    }

    return result;
  }

  visitWhileStatement(node) {
    // wander (condition) { ... } → while (condition) { ... }
    const condition = this.visit(node.condition);
    const body = this.visit(node.body);
    return `${this.indent()}while (${condition}) ${body}`;
  }

  visitForInStatement(node) {
    // journey (x in arr) { ... } → for (let x of arr) { ... }
    const variable = node.variable;
    const iterable = this.visit(node.iterable);
    const body = this.visit(node.body);
    return `${this.indent()}for (let ${variable} of ${iterable}) ${body}`;
  }

  visitBreakStatement(node) {
    // flee → break
    return `${this.indent()}break;`;
  }

  visitContinueStatement(node) {
    // onwards → continue
    return `${this.indent()}continue;`;
  }

  // ============================================================
  // FUNCTIONS
  // ============================================================

  visitFunctionDeclaration(node) {
    // song greet(name) { ... } → function greet(name) { ... }
    const params = node.params.join(', ');
    // Body might be an array or a BlockStatement
    const body = this.compileBody(node.body);
    return `${this.indent()}function ${node.name}(${params}) ${body}`;
  }

  // Helper to compile a body that might be an array or BlockStatement
  compileBody(body) {
    if (Array.isArray(body)) {
      this.indentLevel++;
      const statements = body.map(stmt => this.visit(stmt));
      this.indentLevel--;
      return `{\n${statements.join('\n')}\n${this.indent()}}`;
    }
    return this.visit(body);
  }

  visitReturnStatement(node) {
    // answer x → return x
    if (node.value) {
      const value = this.visit(node.value);
      return `${this.indent()}return ${value};`;
    }
    return `${this.indent()}return;`;
  }

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  visitTryStatement(node) {
    // attempt { ... } rescue (e) { ... }
    // → try { ... } catch (e) { ... }
    const tryBlock = this.visit(node.tryBlock);
    const catchBlock = this.visit(node.catchBlock);
    const catchParam = node.catchParam || 'e';

    return `${this.indent()}try ${tryBlock} catch (${catchParam}) ${catchBlock}`;
  }

  // ============================================================
  // CLASSES (Realms)
  // ============================================================

  visitRealmDeclaration(node) {
    // realm Hobbit { ... } → class Hobbit { ... }
    // realm Wizard inherits Being { ... } → class Wizard extends Being { ... }

    let declaration = `${this.indent()}class ${node.name}`;
    if (node.superClass) {
      declaration += ` extends ${node.superClass}`;
    }
    declaration += ' {\n';

    this.indentLevel++;

    // Constructor (forge)
    if (node.constructor) {
      // Pass superClass info so we can inject super() call
      declaration += this.visitForgeDeclaration(node.constructor, node.superClass) + '\n';
    }

    // Methods
    for (const method of node.methods) {
      declaration += this.visitMethodDeclaration(method) + '\n';
    }

    this.indentLevel--;
    declaration += `${this.indent()}}`;

    return declaration;
  }

  visitForgeDeclaration(node, superClass = null) {
    // forge(name, age) { self.name = name }
    // → constructor(name, age) { this.name = name }
    // If there's a superclass, we need to inject super() at the start
    const params = node.params.join(', ');

    if (superClass) {
      // Inject super() call at the beginning of the constructor body
      this.indentLevel++;
      const superCall = `${this.indent()}super();\n`;

      let bodyStatements;
      if (Array.isArray(node.body)) {
        bodyStatements = node.body.map(stmt => this.visit(stmt));
      } else {
        bodyStatements = node.body.statements.map(stmt => this.visit(stmt));
      }
      this.indentLevel--;

      return `${this.indent()}constructor(${params}) {\n${superCall}${bodyStatements.join('\n')}\n${this.indent()}}`;
    }

    const body = this.compileBody(node.body);
    return `${this.indent()}constructor(${params}) ${body}`;
  }

  visitMethodDeclaration(node) {
    // song greet() { ... } → greet() { ... }
    const params = node.params.join(', ');
    const body = this.compileBody(node.body);
    return `${this.indent()}${node.name}(${params}) ${body}`;
  }

  visitSelfExpression(node) {
    // self → this
    return 'this';
  }

  visitPropertyAccess(node) {
    // self.name → this.name
    const obj = this.visit(node.object);
    return `${obj}.${node.property}`;
  }

  visitPropertyAssignment(node) {
    // self.name = value → this.name = value
    const obj = this.visit(node.object);
    const value = this.visit(node.value);
    return `${obj}.${node.property} = ${value}`;
  }

  visitCreateExpression(node) {
    // create Hobbit("Frodo") → new Hobbit("Frodo")
    const args = node.arguments.map(arg => this.visit(arg));
    return `new ${node.className}(${args.join(', ')})`;
  }

  // ============================================================
  // MODULES
  // ============================================================

  visitSummonStatement(node) {
    // summon "module.tmbdl" → import ... from "module.js"
    // Note: Module paths need .tmbdl → .js conversion
    const path = node.path.replace(/\.tmbdl$/, '.js');

    if (node.imports) {
      // summon { foo, bar } from "module.tmbdl"
      const imports = node.imports.map(imp => {
        if (imp.alias) {
          return `${imp.name} as ${imp.alias}`;
        }
        return imp.name;
      });
      return `${this.indent()}import { ${imports.join(', ')} } from "${path}";`;
    } else if (node.alias) {
      // summon "module.tmbdl" as myModule
      return `${this.indent()}import * as ${node.alias} from "${path}";`;
    } else {
      // summon "module.tmbdl" (side effects only)
      return `${this.indent()}import "${path}";`;
    }
  }

  visitShareStatement(node) {
    // share ring x = 5 → export let x = 5
    // share { x, y } → export { x, y }

    if (node.declaration) {
      // Compile the declaration without indent (we'll add export prefix)
      const savedIndent = this.indentLevel;
      this.indentLevel = 0;
      const decl = this.visit(node.declaration);
      this.indentLevel = savedIndent;
      return `${this.indent()}export ${decl.trim()}`;
    } else if (node.names) {
      return `${this.indent()}export { ${node.names.join(', ')} };`;
    }

    return '';
  }
}
