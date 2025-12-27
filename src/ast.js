// Abstract Syntax Tree node definitions for Tmbdl

// Base class for all AST nodes
class ASTNode {
  constructor(line, column) {
    this.line = line;
    this.column = column;
  }
}

// Program - the root node
export class Program extends ASTNode {
  constructor(statements) {
    super(1, 1);
    this.type = 'Program';
    this.statements = statements;
  }
}

// Statements

export class VariableDeclaration extends ASTNode {
  constructor(name, value, isConstant, line, column) {
    super(line, column);
    this.type = 'VariableDeclaration';
    this.name = name;
    this.value = value;
    this.isConstant = isConstant;
  }
}

export class Assignment extends ASTNode {
  constructor(name, value, line, column) {
    super(line, column);
    this.type = 'Assignment';
    this.name = name;
    this.value = value;
  }
}

export class IndexAssignment extends ASTNode {
  constructor(object, index, value, line, column) {
    super(line, column);
    this.type = 'IndexAssignment';
    this.object = object;
    this.index = index;
    this.value = value;
  }
}

export class BlockStatement extends ASTNode {
  constructor(statements, line, column) {
    super(line, column);
    this.type = 'BlockStatement';
    this.statements = statements;
  }
}

export class IfStatement extends ASTNode {
  constructor(condition, thenBranch, elseBranch, line, column) {
    super(line, column);
    this.type = 'IfStatement';
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
}

export class WhileStatement extends ASTNode {
  constructor(condition, body, line, column) {
    super(line, column);
    this.type = 'WhileStatement';
    this.condition = condition;
    this.body = body;
  }
}

export class ForInStatement extends ASTNode {
  constructor(variable, iterable, body, line, column) {
    super(line, column);
    this.type = 'ForInStatement';
    this.variable = variable;
    this.iterable = iterable;
    this.body = body;
  }
}

export class FunctionDeclaration extends ASTNode {
  constructor(name, params, body, line, column) {
    super(line, column);
    this.type = 'FunctionDeclaration';
    this.name = name;
    this.params = params;
    this.body = body;
  }
}

export class ReturnStatement extends ASTNode {
  constructor(value, line, column) {
    super(line, column);
    this.type = 'ReturnStatement';
    this.value = value;
  }
}

export class BreakStatement extends ASTNode {
  constructor(line, column) {
    super(line, column);
    this.type = 'BreakStatement';
  }
}

export class ContinueStatement extends ASTNode {
  constructor(line, column) {
    super(line, column);
    this.type = 'ContinueStatement';
  }
}

export class ExpressionStatement extends ASTNode {
  constructor(expression, line, column) {
    super(line, column);
    this.type = 'ExpressionStatement';
    this.expression = expression;
  }
}

export class PrintStatement extends ASTNode {
  constructor(value, line, column) {
    super(line, column);
    this.type = 'PrintStatement';
    this.value = value;
  }
}

export class EyeofStatement extends ASTNode {
  constructor(label, value, line, column) {
    super(line, column);
    this.type = 'EyeofStatement';
    this.label = label;
    this.value = value;
  }
}

export class TryStatement extends ASTNode {
  constructor(tryBlock, catchParam, catchBlock, line, column) {
    super(line, column);
    this.type = 'TryStatement';
    this.tryBlock = tryBlock;
    this.catchParam = catchParam;  // variable name for the error
    this.catchBlock = catchBlock;
  }
}

export class CompoundAssignment extends ASTNode {
  constructor(name, operator, value, line, column) {
    super(line, column);
    this.type = 'CompoundAssignment';
    this.name = name;
    this.operator = operator;  // '+', '-', '*', '/'
    this.value = value;
  }
}

export class UpdateExpression extends ASTNode {
  constructor(name, operator, prefix, line, column) {
    super(line, column);
    this.type = 'UpdateExpression';
    this.name = name;
    this.operator = operator;  // '++' or '--'
    this.prefix = prefix;      // true if ++x, false if x++
  }
}

// Expressions

export class LambdaExpression extends ASTNode {
  constructor(params, body, line, column) {
    super(line, column);
    this.type = 'LambdaExpression';
    this.params = params;
    this.body = body;  // can be expression or block
  }
}

export class BinaryExpression extends ASTNode {
  constructor(left, operator, right, line, column) {
    super(line, column);
    this.type = 'BinaryExpression';
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

export class UnaryExpression extends ASTNode {
  constructor(operator, operand, line, column) {
    super(line, column);
    this.type = 'UnaryExpression';
    this.operator = operator;
    this.operand = operand;
  }
}

export class LogicalExpression extends ASTNode {
  constructor(left, operator, right, line, column) {
    super(line, column);
    this.type = 'LogicalExpression';
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
}

export class CallExpression extends ASTNode {
  constructor(callee, args, line, column) {
    super(line, column);
    this.type = 'CallExpression';
    this.callee = callee;
    this.arguments = args;
  }
}

export class IndexExpression extends ASTNode {
  constructor(object, index, line, column) {
    super(line, column);
    this.type = 'IndexExpression';
    this.object = object;
    this.index = index;
  }
}

export class Identifier extends ASTNode {
  constructor(name, line, column) {
    super(line, column);
    this.type = 'Identifier';
    this.name = name;
  }
}

// Literals

export class NumberLiteral extends ASTNode {
  constructor(value, line, column) {
    super(line, column);
    this.type = 'NumberLiteral';
    this.value = value;
  }
}

export class StringLiteral extends ASTNode {
  constructor(value, line, column) {
    super(line, column);
    this.type = 'StringLiteral';
    this.value = value;
  }
}

export class BooleanLiteral extends ASTNode {
  constructor(value, line, column) {
    super(line, column);
    this.type = 'BooleanLiteral';
    this.value = value;
  }
}

export class NullLiteral extends ASTNode {
  constructor(line, column) {
    super(line, column);
    this.type = 'NullLiteral';
    this.value = null;
  }
}

export class ArrayLiteral extends ASTNode {
  constructor(elements, line, column) {
    super(line, column);
    this.type = 'ArrayLiteral';
    this.elements = elements;
  }
}

export class ObjectLiteral extends ASTNode {
  constructor(properties, line, column) {
    super(line, column);
    this.type = 'ObjectLiteral';
    this.properties = properties;
  }
}

export class TemplateLiteral extends ASTNode {
  constructor(parts, line, column) {
    super(line, column);
    this.type = 'TemplateLiteral';
    this.parts = parts;  // Array of { type: 'text'|'expr', value: string|AST }
  }
}

// Module system

// summon "path/to/module.tmbdl"
// summon "module.tmbdl" as myModule
// summon { foo, bar } from "module.tmbdl"
// summon { foo as f } from "module.tmbdl"
export class SummonStatement extends ASTNode {
  constructor(path, imports, alias, line, column) {
    super(line, column);
    this.type = 'SummonStatement';
    this.path = path;           // string path to module
    this.imports = imports;     // null (import all) or array of {name, alias}
    this.alias = alias;         // alias for whole module (when imports is null)
  }
}

// share ring x = 5
// share song greet() { }
// share { x, y, greet }
export class ShareStatement extends ASTNode {
  constructor(declaration, names, line, column) {
    super(line, column);
    this.type = 'ShareStatement';
    this.declaration = declaration;  // the declaration being exported, or null
    this.names = names;              // for "share { x, y }" syntax
  }
}

// Classes (Realms)

// realm Hobbit { ... }
// realm Wizard inherits Being { ... }
export class RealmDeclaration extends ASTNode {
  constructor(name, superClass, constructor_, methods, line, column) {
    super(line, column);
    this.type = 'RealmDeclaration';
    this.name = name;
    this.superClass = superClass;    // name of parent class or null
    this.constructor = constructor_; // ForgeDeclaration or null
    this.methods = methods;          // array of method declarations
  }
}

// forge(name, age) { self.name = name }
export class ForgeDeclaration extends ASTNode {
  constructor(params, body, line, column) {
    super(line, column);
    this.type = 'ForgeDeclaration';
    this.params = params;
    this.body = body;
  }
}

// self.name or self.greet()
export class SelfExpression extends ASTNode {
  constructor(line, column) {
    super(line, column);
    this.type = 'SelfExpression';
  }
}

// self.property access: self.name
export class PropertyAccess extends ASTNode {
  constructor(object, property, line, column) {
    super(line, column);
    this.type = 'PropertyAccess';
    this.object = object;
    this.property = property;  // string property name
  }
}

// self.property = value
export class PropertyAssignment extends ASTNode {
  constructor(object, property, value, line, column) {
    super(line, column);
    this.type = 'PropertyAssignment';
    this.object = object;
    this.property = property;
    this.value = value;
  }
}

// create Hobbit("Frodo", 50)
export class CreateExpression extends ASTNode {
  constructor(className, args, line, column) {
    super(line, column);
    this.type = 'CreateExpression';
    this.className = className;
    this.arguments = args;
  }
}
