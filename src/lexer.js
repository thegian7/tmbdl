import { TokenType, Keywords, Token } from './tokens.js';
import { TmbdlError } from './errors.js';

export class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;
    this.startColumn = 1;
  }

  tokenize() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return this.tokens;
  }

  scanToken() {
    const char = this.advance();

    switch (char) {
      // Single character tokens
      case '(': this.addToken(TokenType.LPAREN); break;
      case ')': this.addToken(TokenType.RPAREN); break;
      case '{': this.addToken(TokenType.LBRACE); break;
      case '}': this.addToken(TokenType.RBRACE); break;
      case '[': this.addToken(TokenType.LBRACKET); break;
      case ']': this.addToken(TokenType.RBRACKET); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case ':': this.addToken(TokenType.COLON); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '+':
        if (this.match('+')) this.addToken(TokenType.PLUS_PLUS);
        else if (this.match('=')) this.addToken(TokenType.PLUS_EQUALS);
        else this.addToken(TokenType.PLUS);
        break;
      case '-':
        if (this.match('-')) this.addToken(TokenType.MINUS_MINUS);
        else if (this.match('=')) this.addToken(TokenType.MINUS_EQUALS);
        else this.addToken(TokenType.MINUS);
        break;
      case '*':
        this.addToken(this.match('=') ? TokenType.STAR_EQUALS : TokenType.STAR);
        break;
      case '/':
        this.addToken(this.match('=') ? TokenType.SLASH_EQUALS : TokenType.SLASH);
        break;
      case '%': this.addToken(TokenType.PERCENT); break;

      // One or two character tokens
      case '=':
        if (this.match('=')) this.addToken(TokenType.EQUALS_EQUALS);
        else if (this.match('>')) this.addToken(TokenType.ARROW);
        else this.addToken(TokenType.EQUALS);
        break;
      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.BANG_EQUALS);
        } else {
          throw new TmbdlError(
            `Unexpected character '!' - perhaps you meant '!='?`,
            this.line,
            this.column
          );
        }
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUALS : TokenType.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GREATER_EQUALS : TokenType.GREATER);
        break;

      // Comments: ~ for single line, ~* *~ for multi-line
      case '~':
        if (this.match('*')) {
          this.multiLineComment();
        } else {
          this.singleLineComment();
        }
        break;

      // Whitespace
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;

      // Strings
      case '"': this.string('"'); break;
      case "'": this.string("'"); break;
      case '`': this.templateString(); break;

      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          throw new TmbdlError(
            `The road has gone astray - unexpected character '${char}'`,
            this.line,
            this.startColumn
          );
        }
    }
  }

  singleLineComment() {
    // Consume until end of line
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }

  multiLineComment() {
    // Consume until *~
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '~') {
        this.advance(); // consume *
        this.advance(); // consume ~
        return;
      }
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }

    throw new TmbdlError(
      'The tale was left unfinished - unterminated multi-line comment',
      this.line,
      this.column
    );
  }

  templateString() {
    const startLine = this.line;
    const startCol = this.startColumn;
    const parts = [];
    let currentText = '';

    while (this.peek() !== '`' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
        currentText += '\n';
        this.advance();
      } else if (this.peek() === '{') {
        // Save current text part
        if (currentText.length > 0) {
          parts.push({ type: 'text', value: currentText });
          currentText = '';
        }
        this.advance(); // consume {

        // Collect the expression text
        let exprText = '';
        let braceDepth = 1;
        while (braceDepth > 0 && !this.isAtEnd()) {
          if (this.peek() === '{') braceDepth++;
          if (this.peek() === '}') braceDepth--;
          if (braceDepth > 0) {
            exprText += this.peek();
            this.advance();
          }
        }
        if (this.peek() === '}') {
          this.advance(); // consume }
        }
        parts.push({ type: 'expr', value: exprText });
      } else if (this.peek() === '\\') {
        this.advance();
        if (!this.isAtEnd()) {
          const escaped = this.advance();
          switch (escaped) {
            case 'n': currentText += '\n'; break;
            case 't': currentText += '\t'; break;
            case 'r': currentText += '\r'; break;
            case '\\': currentText += '\\'; break;
            case '`': currentText += '`'; break;
            case '{': currentText += '{'; break;
            default: currentText += '\\' + escaped;
          }
        }
      } else {
        currentText += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new TmbdlError(
        'The tale was left unfinished - unterminated template string',
        startLine,
        startCol
      );
    }

    // Consume closing backtick
    this.advance();

    // Save remaining text
    if (currentText.length > 0) {
      parts.push({ type: 'text', value: currentText });
    }

    this.addToken(TokenType.TEMPLATE_STRING, parts);
  }

  string(quote) {
    const startLine = this.line;
    const startCol = this.startColumn;

    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 0;
      }
      // Handle escape sequences
      if (this.peek() === '\\' && this.peekNext() !== null) {
        this.advance();
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new TmbdlError(
        'The words faded into shadow - unterminated string',
        startLine,
        startCol
      );
    }

    // Consume closing quote
    this.advance();

    // Extract the string value (without quotes)
    let value = this.source.substring(this.start + 1, this.current - 1);

    // Process escape sequences
    value = value
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

    this.addToken(TokenType.STRING, value);
  }

  number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume .
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = Keywords[text] || TokenType.IDENTIFIER;

    // For boolean and null literals, store the actual value
    let value = text;
    if (type === TokenType.GOLDBERRY) value = true;
    else if (type === TokenType.SAURON) value = false;
    else if (type === TokenType.SHADOW) value = null;

    this.addToken(type, value);
  }

  // Helper methods
  isAtEnd() {
    return this.current >= this.source.length;
  }

  advance() {
    const char = this.source[this.current];
    this.current++;
    this.column++;
    return char;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  isDigit(char) {
    return char >= '0' && char <= '9';
  }

  isAlpha(char) {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  isAlphaNumeric(char) {
    return this.isAlpha(char) || this.isDigit(char);
  }

  addToken(type, value = null) {
    if (value === null) {
      value = this.source.substring(this.start, this.current);
    }
    this.tokens.push(new Token(type, value, this.line, this.startColumn));
  }
}
