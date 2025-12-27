import { TokenType } from './tokens.js';
import { TmbdlError } from './errors.js';
import * as AST from './ast.js';
import { Lexer } from './lexer.js';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    const statements = [];

    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) statements.push(stmt);
    }

    return new AST.Program(statements);
  }

  // Declarations

  declaration() {
    try {
      if (this.check(TokenType.SUMMON)) return this.summonStatement();
      if (this.check(TokenType.SHARE)) return this.shareStatement();
      if (this.check(TokenType.REALM)) return this.realmDeclaration();
      if (this.check(TokenType.RING)) return this.variableDeclaration(false);
      if (this.check(TokenType.PRECIOUS)) return this.variableDeclaration(true);
      if (this.check(TokenType.SONG)) return this.functionDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      throw error;
    }
  }

  realmDeclaration() {
    const keyword = this.advance(); // consume realm
    const name = this.consume(TokenType.IDENTIFIER, "Expected realm name");

    // Check for inheritance: realm Wizard inherits Being
    let superClass = null;
    if (this.match(TokenType.INHERITS)) {
      superClass = this.consume(TokenType.IDENTIFIER, "Expected parent realm name").value;
    }

    this.consume(TokenType.LBRACE, "Expected '{' before realm body");

    let constructor_ = null;
    const methods = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      if (this.check(TokenType.FORGE)) {
        // Constructor
        if (constructor_) {
          throw new TmbdlError("A realm can only have one forge", this.peek().line, this.peek().column);
        }
        constructor_ = this.forgeDeclaration();
      } else if (this.check(TokenType.SONG)) {
        // Method
        methods.push(this.functionDeclaration());
      } else {
        throw new TmbdlError(
          "Expected 'forge' or 'song' in realm body",
          this.peek().line,
          this.peek().column
        );
      }
    }

    this.consume(TokenType.RBRACE, "Expected '}' after realm body");

    return new AST.RealmDeclaration(name.value, superClass, constructor_, methods, keyword.line, keyword.column);
  }

  forgeDeclaration() {
    const keyword = this.advance(); // consume forge
    this.consume(TokenType.LPAREN, "Expected '(' after 'forge'");

    const params = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const param = this.consume(TokenType.IDENTIFIER, "Expected parameter name");
        params.push(param.value);
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before forge body");

    const body = this.block();

    return new AST.ForgeDeclaration(params, body, keyword.line, keyword.column);
  }

  summonStatement() {
    const keyword = this.advance(); // consume summon

    // Check for destructured import: summon { x, y } from "path"
    if (this.check(TokenType.LBRACE)) {
      this.advance(); // consume {
      const imports = [];

      do {
        const name = this.consume(TokenType.IDENTIFIER, "Expected import name");
        let alias = name.value;

        if (this.match(TokenType.AS)) {
          alias = this.consume(TokenType.IDENTIFIER, "Expected alias name").value;
        }

        imports.push({ name: name.value, alias });
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RBRACE, "Expected '}' after imports");
      this.consume(TokenType.FROM, "Expected 'from' after imports");
      const path = this.consume(TokenType.STRING, "Expected module path");

      this.optionalSemicolon();
      return new AST.SummonStatement(path.value, imports, null, keyword.line, keyword.column);
    }

    // Regular import: summon "path" or summon "path" as alias
    const path = this.consume(TokenType.STRING, "Expected module path");
    let alias = null;

    if (this.match(TokenType.AS)) {
      alias = this.consume(TokenType.IDENTIFIER, "Expected alias name").value;
    }

    this.optionalSemicolon();
    return new AST.SummonStatement(path.value, null, alias, keyword.line, keyword.column);
  }

  shareStatement() {
    const keyword = this.advance(); // consume share

    // Check for named exports: share { x, y }
    if (this.check(TokenType.LBRACE)) {
      this.advance(); // consume {
      const names = [];

      do {
        const name = this.consume(TokenType.IDENTIFIER, "Expected export name");
        names.push(name.value);
      } while (this.match(TokenType.COMMA));

      this.consume(TokenType.RBRACE, "Expected '}' after exports");
      this.optionalSemicolon();
      return new AST.ShareStatement(null, names, keyword.line, keyword.column);
    }

    // Export declaration: share ring x = 5, share song foo() {}
    let declaration;
    if (this.check(TokenType.RING)) {
      declaration = this.variableDeclaration(false);
    } else if (this.check(TokenType.PRECIOUS)) {
      declaration = this.variableDeclaration(true);
    } else if (this.check(TokenType.SONG)) {
      declaration = this.functionDeclaration();
    } else {
      throw new TmbdlError(
        "Expected declaration after 'share'",
        keyword.line,
        keyword.column
      );
    }

    return new AST.ShareStatement(declaration, null, keyword.line, keyword.column);
  }

  variableDeclaration(isConstant) {
    const keyword = this.advance(); // consume ring/precious
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name');

    let value = null;
    if (this.match(TokenType.EQUALS)) {
      value = this.expression();
    } else if (isConstant) {
      throw new TmbdlError(
        "A precious must be given a value when forged",
        name.line,
        name.column
      );
    }

    this.optionalSemicolon();
    return new AST.VariableDeclaration(name.value, value, isConstant, keyword.line, keyword.column);
  }

  functionDeclaration() {
    const keyword = this.advance(); // consume song
    const name = this.consume(TokenType.IDENTIFIER, 'Expected song name');

    this.consume(TokenType.LPAREN, "Expected '(' after song name");
    const params = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        const param = this.consume(TokenType.IDENTIFIER, 'Expected parameter name');
        params.push(param.value);
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before song body");

    const body = this.block();

    return new AST.FunctionDeclaration(name.value, params, body, keyword.line, keyword.column);
  }

  // Statements

  statement() {
    if (this.check(TokenType.PERHAPS)) return this.ifStatement();
    if (this.check(TokenType.WANDER)) return this.whileStatement();
    if (this.check(TokenType.JOURNEY)) return this.forStatement();
    if (this.check(TokenType.ANSWER)) return this.returnStatement();
    if (this.check(TokenType.FLEE)) return this.breakStatement();
    if (this.check(TokenType.ONWARDS)) return this.continueStatement();
    if (this.check(TokenType.SING)) return this.printStatement();
    if (this.check(TokenType.EYEOF)) return this.eyeofStatement();
    if (this.check(TokenType.ATTEMPT)) return this.tryStatement();
    if (this.check(TokenType.LBRACE)) {
      this.advance();
      return new AST.BlockStatement(this.block(), this.previous().line, this.previous().column);
    }

    return this.expressionStatement();
  }

  tryStatement() {
    const keyword = this.advance(); // consume attempt
    this.consume(TokenType.LBRACE, "Expected '{' after 'attempt'");
    const tryBlock = new AST.BlockStatement(this.block(), keyword.line, keyword.column);

    this.consume(TokenType.RESCUE, "Expected 'rescue' after attempt block");
    this.consume(TokenType.LPAREN, "Expected '(' after 'rescue'");
    const catchParam = this.consume(TokenType.IDENTIFIER, "Expected error variable name");
    this.consume(TokenType.RPAREN, "Expected ')' after error variable");
    this.consume(TokenType.LBRACE, "Expected '{' after rescue declaration");
    const catchBlock = new AST.BlockStatement(this.block(), keyword.line, keyword.column);

    return new AST.TryStatement(tryBlock, catchParam.value, catchBlock, keyword.line, keyword.column);
  }

  ifStatement() {
    const keyword = this.advance(); // consume perhaps
    this.consume(TokenType.LPAREN, "Expected '(' after 'perhaps'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");

    this.consume(TokenType.LBRACE, "Expected '{' after condition");
    const thenBranch = new AST.BlockStatement(this.block(), keyword.line, keyword.column);

    let elseBranch = null;
    if (this.match(TokenType.OTHERWISE)) {
      if (this.check(TokenType.PERHAPS)) {
        elseBranch = this.ifStatement();
      } else {
        this.consume(TokenType.LBRACE, "Expected '{' after 'otherwise'");
        elseBranch = new AST.BlockStatement(this.block(), this.previous().line, this.previous().column);
      }
    }

    return new AST.IfStatement(condition, thenBranch, elseBranch, keyword.line, keyword.column);
  }

  whileStatement() {
    const keyword = this.advance(); // consume wander
    this.consume(TokenType.LPAREN, "Expected '(' after 'wander'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");

    this.consume(TokenType.LBRACE, "Expected '{' after condition");
    const body = new AST.BlockStatement(this.block(), keyword.line, keyword.column);

    return new AST.WhileStatement(condition, body, keyword.line, keyword.column);
  }

  forStatement() {
    const keyword = this.advance(); // consume journey
    this.consume(TokenType.LPAREN, "Expected '(' after 'journey'");

    const variable = this.consume(TokenType.IDENTIFIER, 'Expected variable name');
    this.consume(TokenType.IN, "Expected 'in' after variable");
    const iterable = this.expression();

    this.consume(TokenType.RPAREN, "Expected ')' after iterable");
    this.consume(TokenType.LBRACE, "Expected '{' after journey header");
    const body = new AST.BlockStatement(this.block(), keyword.line, keyword.column);

    return new AST.ForInStatement(variable.value, iterable, body, keyword.line, keyword.column);
  }

  returnStatement() {
    const keyword = this.advance(); // consume answer

    let value = null;
    if (!this.check(TokenType.SEMICOLON) && !this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      // Check if there's an expression on the same conceptual line
      if (!this.checkNewStatement()) {
        value = this.expression();
      }
    }

    this.optionalSemicolon();
    return new AST.ReturnStatement(value, keyword.line, keyword.column);
  }

  breakStatement() {
    const keyword = this.advance(); // consume flee
    this.optionalSemicolon();
    return new AST.BreakStatement(keyword.line, keyword.column);
  }

  continueStatement() {
    const keyword = this.advance(); // consume onwards
    this.optionalSemicolon();
    return new AST.ContinueStatement(keyword.line, keyword.column);
  }

  printStatement() {
    const keyword = this.advance(); // consume sing
    const value = this.expression();
    this.optionalSemicolon();
    return new AST.PrintStatement(value, keyword.line, keyword.column);
  }

  eyeofStatement() {
    const keyword = this.advance(); // consume eyeof
    const label = this.expression();
    const value = this.expression();
    this.optionalSemicolon();
    return new AST.EyeofStatement(label, value, keyword.line, keyword.column);
  }

  block() {
    const statements = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) statements.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after block");
    return statements;
  }

  expressionStatement() {
    const expr = this.expression();

    // Check for assignment
    if (expr.type === 'Identifier' && this.match(TokenType.EQUALS)) {
      const value = this.expression();
      this.optionalSemicolon();
      return new AST.Assignment(expr.name, value, expr.line, expr.column);
    }

    // Check for compound assignment: x += 1, x -= 1, etc.
    if (expr.type === 'Identifier') {
      if (this.match(TokenType.PLUS_EQUALS)) {
        const value = this.expression();
        this.optionalSemicolon();
        return new AST.CompoundAssignment(expr.name, '+', value, expr.line, expr.column);
      }
      if (this.match(TokenType.MINUS_EQUALS)) {
        const value = this.expression();
        this.optionalSemicolon();
        return new AST.CompoundAssignment(expr.name, '-', value, expr.line, expr.column);
      }
      if (this.match(TokenType.STAR_EQUALS)) {
        const value = this.expression();
        this.optionalSemicolon();
        return new AST.CompoundAssignment(expr.name, '*', value, expr.line, expr.column);
      }
      if (this.match(TokenType.SLASH_EQUALS)) {
        const value = this.expression();
        this.optionalSemicolon();
        return new AST.CompoundAssignment(expr.name, '/', value, expr.line, expr.column);
      }
      // Postfix increment/decrement: x++, x--
      if (this.match(TokenType.PLUS_PLUS)) {
        this.optionalSemicolon();
        return new AST.UpdateExpression(expr.name, '++', false, expr.line, expr.column);
      }
      if (this.match(TokenType.MINUS_MINUS)) {
        this.optionalSemicolon();
        return new AST.UpdateExpression(expr.name, '--', false, expr.line, expr.column);
      }
    }

    // Check for index assignment: arr[0] = value
    if (expr.type === 'IndexExpression' && this.match(TokenType.EQUALS)) {
      const value = this.expression();
      this.optionalSemicolon();
      return new AST.IndexAssignment(expr.object, expr.index, value, expr.line, expr.column);
    }

    // Check for property assignment: obj.prop = value or self.prop = value
    if (expr.type === 'PropertyAccess' && this.match(TokenType.EQUALS)) {
      const value = this.expression();
      this.optionalSemicolon();
      return new AST.PropertyAssignment(expr.object, expr.property, value, expr.line, expr.column);
    }

    this.optionalSemicolon();
    return new AST.ExpressionStatement(expr, expr.line, expr.column);
  }

  // Expressions

  expression() {
    return this.or();
  }

  or() {
    let left = this.and();

    while (this.match(TokenType.EITHER)) {
      const operator = this.previous();
      const right = this.and();
      left = new AST.LogicalExpression(left, 'either', right, operator.line, operator.column);
    }

    return left;
  }

  and() {
    let left = this.equality();

    while (this.match(TokenType.WITH)) {
      const operator = this.previous();
      const right = this.equality();
      left = new AST.LogicalExpression(left, 'with', right, operator.line, operator.column);
    }

    return left;
  }

  equality() {
    let left = this.comparison();

    while (this.match(TokenType.EQUALS_EQUALS, TokenType.BANG_EQUALS)) {
      const operator = this.previous();
      const right = this.comparison();
      left = new AST.BinaryExpression(left, operator.value, right, operator.line, operator.column);
    }

    return left;
  }

  comparison() {
    let left = this.term();

    while (this.match(TokenType.LESS, TokenType.GREATER, TokenType.LESS_EQUALS, TokenType.GREATER_EQUALS)) {
      const operator = this.previous();
      const right = this.term();
      left = new AST.BinaryExpression(left, operator.value, right, operator.line, operator.column);
    }

    return left;
  }

  term() {
    let left = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      left = new AST.BinaryExpression(left, operator.value, right, operator.line, operator.column);
    }

    return left;
  }

  factor() {
    let left = this.unary();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous();
      const right = this.unary();
      left = new AST.BinaryExpression(left, operator.value, right, operator.line, operator.column);
    }

    return left;
  }

  unary() {
    if (this.match(TokenType.MINUS, TokenType.NONE)) {
      const operator = this.previous();
      const operand = this.unary();
      return new AST.UnaryExpression(operator.value, operand, operator.line, operator.column);
    }

    // Prefix increment/decrement: ++x, --x
    if (this.match(TokenType.PLUS_PLUS, TokenType.MINUS_MINUS)) {
      const operator = this.previous();
      const operand = this.consume(TokenType.IDENTIFIER, "Expected variable name after " + operator.value);
      return new AST.UpdateExpression(operand.value, operator.value, true, operator.line, operator.column);
    }

    return this.call();
  }

  call() {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']' after index");
        expr = new AST.IndexExpression(expr, index, expr.line, expr.column);
      } else if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'");
        expr = new AST.PropertyAccess(expr, property.value, expr.line, expr.column);
      } else {
        break;
      }
    }

    return expr;
  }

  finishCall(callee) {
    const args = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(TokenType.RPAREN, "Expected ')' after arguments");
    return new AST.CallExpression(callee, args, callee.line, callee.column);
  }

  primary() {
    const token = this.peek();

    if (this.match(TokenType.NUMBER)) {
      return new AST.NumberLiteral(this.previous().value, token.line, token.column);
    }

    if (this.match(TokenType.STRING)) {
      return new AST.StringLiteral(this.previous().value, token.line, token.column);
    }

    if (this.match(TokenType.TEMPLATE_STRING)) {
      return this.parseTemplateLiteral(this.previous(), token.line, token.column);
    }

    if (this.match(TokenType.GOLDBERRY)) {
      return new AST.BooleanLiteral(true, token.line, token.column);
    }

    if (this.match(TokenType.SAURON)) {
      return new AST.BooleanLiteral(false, token.line, token.column);
    }

    if (this.match(TokenType.SHADOW)) {
      return new AST.NullLiteral(token.line, token.column);
    }

    if (this.match(TokenType.SELF)) {
      return new AST.SelfExpression(token.line, token.column);
    }

    if (this.match(TokenType.CREATE)) {
      return this.createExpression(token);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new AST.Identifier(this.previous().value, token.line, token.column);
    }

    if (this.match(TokenType.LPAREN)) {
      // Could be grouped expression or lambda
      // Check for lambda: () => ..., (x) => ..., (x, y) => ...
      if (this.check(TokenType.RPAREN)) {
        // () => ... (zero params)
        this.advance(); // consume )
        if (this.match(TokenType.ARROW)) {
          return this.lambdaBody([], token.line, token.column);
        }
        // Empty parens not followed by arrow - error
        throw new TmbdlError("Empty parentheses are not allowed", token.line, token.column);
      }

      // Check if this looks like a lambda parameter list
      const startPos = this.current;
      const params = [];
      let isLambda = false;

      if (this.check(TokenType.IDENTIFIER)) {
        params.push(this.advance().value);
        while (this.match(TokenType.COMMA)) {
          params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value);
        }
        if (this.match(TokenType.RPAREN)) {
          if (this.match(TokenType.ARROW)) {
            isLambda = true;
          }
        }
      }

      if (isLambda) {
        return this.lambdaBody(params, token.line, token.column);
      }

      // Not a lambda, backtrack and parse as grouped expression
      this.current = startPos;
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    if (this.match(TokenType.LBRACKET)) {
      return this.arrayLiteral(token);
    }

    if (this.match(TokenType.LBRACE)) {
      return this.objectLiteral(token);
    }

    throw new TmbdlError(
      `The path is unclear - unexpected token '${token.value}'`,
      token.line,
      token.column
    );
  }

  arrayLiteral(startToken) {
    const elements = [];

    if (!this.check(TokenType.RBRACKET)) {
      do {
        elements.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
    return new AST.ArrayLiteral(elements, startToken.line, startToken.column);
  }

  objectLiteral(startToken) {
    const properties = [];

    if (!this.check(TokenType.RBRACE)) {
      do {
        const key = this.consume(TokenType.IDENTIFIER, 'Expected property name');
        this.consume(TokenType.COLON, "Expected ':' after property name");
        const value = this.expression();
        properties.push({ key: key.value, value });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACE, "Expected '}' after object properties");
    return new AST.ObjectLiteral(properties, startToken.line, startToken.column);
  }

  lambdaBody(params, line, column) {
    // Lambda can have either a block body or an expression body
    if (this.match(TokenType.LBRACE)) {
      const body = this.block();
      return new AST.LambdaExpression(params, body, line, column);
    } else {
      // Expression body - wrap in implicit return
      const expr = this.expression();
      return new AST.LambdaExpression(params, expr, line, column);
    }
  }

  createExpression(token) {
    const className = this.consume(TokenType.IDENTIFIER, "Expected realm name after 'create'");
    this.consume(TokenType.LPAREN, "Expected '(' after realm name");

    const args = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after arguments");

    return new AST.CreateExpression(className.value, args, token.line, token.column);
  }

  parseTemplateLiteral(token, line, column) {
    const rawParts = token.value;
    const parsedParts = [];

    for (const part of rawParts) {
      if (part.type === 'text') {
        parsedParts.push({ type: 'text', value: part.value });
      } else if (part.type === 'expr') {
        // Parse the expression string
        const exprLexer = new Lexer(part.value);
        const exprTokens = exprLexer.tokenize();
        const exprParser = new Parser(exprTokens);
        const exprAst = exprParser.expression();
        parsedParts.push({ type: 'expr', value: exprAst });
      }
    }

    return new AST.TemplateLiteral(parsedParts, line, column);
  }

  // Helper methods

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  checkNewStatement() {
    // Check if the next token starts a new statement
    const next = this.peek();
    return [
      TokenType.RING, TokenType.PRECIOUS, TokenType.SONG,
      TokenType.PERHAPS, TokenType.WANDER, TokenType.JOURNEY,
      TokenType.ANSWER, TokenType.FLEE, TokenType.ONWARDS,
      TokenType.SING, TokenType.EYEOF, TokenType.ATTEMPT,
      TokenType.SUMMON, TokenType.SHARE, TokenType.REALM,
      TokenType.LBRACE, TokenType.RBRACE, TokenType.EOF
    ].includes(next.type);
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();

    const token = this.peek();
    throw new TmbdlError(message, token.line, token.column);
  }

  optionalSemicolon() {
    this.match(TokenType.SEMICOLON);
  }

  synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.RING:
        case TokenType.PRECIOUS:
        case TokenType.SONG:
        case TokenType.PERHAPS:
        case TokenType.WANDER:
        case TokenType.JOURNEY:
        case TokenType.ANSWER:
        case TokenType.SING:
        case TokenType.EYEOF:
        case TokenType.ATTEMPT:
        case TokenType.SUMMON:
        case TokenType.SHARE:
          return;
      }

      this.advance();
    }
  }
}
