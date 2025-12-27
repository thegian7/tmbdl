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
