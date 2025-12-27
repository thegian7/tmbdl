// Token types for the Tmbdl language
export const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  TEMPLATE_STRING: 'TEMPLATE_STRING',  // `hello {name}` style
  IDENTIFIER: 'IDENTIFIER',

  // LOTR-themed keywords
  RING: 'RING',               // let (variable declaration)
  PRECIOUS: 'PRECIOUS',       // const (constant declaration)
  SONG: 'SONG',               // function
  ANSWER: 'ANSWER',           // return
  SING: 'SING',               // print
  EYEOF: 'EYEOF',             // logger/debug
  PERHAPS: 'PERHAPS',         // if
  OTHERWISE: 'OTHERWISE',     // else
  WANDER: 'WANDER',           // while
  JOURNEY: 'JOURNEY',         // for
  IN: 'IN',                   // in (for loops)
  GOLDBERRY: 'GOLDBERRY',     // true
  SAURON: 'SAURON',           // false
  SHADOW: 'SHADOW',           // null
  WITH: 'WITH',               // and
  EITHER: 'EITHER',           // or
  NONE: 'NONE',               // not
  FLEE: 'FLEE',               // break
  ONWARDS: 'ONWARDS',         // continue
  SHIRE: 'SHIRE',             // main entry point
  ATTEMPT: 'ATTEMPT',         // try
  RESCUE: 'RESCUE',           // catch
  PERIL: 'PERIL',             // error variable in catch

  // Operators
  PLUS: 'PLUS',               // +
  MINUS: 'MINUS',             // -
  STAR: 'STAR',               // *
  SLASH: 'SLASH',             // /
  PERCENT: 'PERCENT',         // %
  EQUALS: 'EQUALS',           // =
  EQUALS_EQUALS: 'EQUALS_EQUALS',   // ==
  BANG_EQUALS: 'BANG_EQUALS',       // !=
  LESS: 'LESS',               // <
  GREATER: 'GREATER',         // >
  LESS_EQUALS: 'LESS_EQUALS',       // <=
  GREATER_EQUALS: 'GREATER_EQUALS', // >=
  PLUS_EQUALS: 'PLUS_EQUALS',       // +=
  MINUS_EQUALS: 'MINUS_EQUALS',     // -=
  STAR_EQUALS: 'STAR_EQUALS',       // *=
  SLASH_EQUALS: 'SLASH_EQUALS',     // /=
  PLUS_PLUS: 'PLUS_PLUS',           // ++
  MINUS_MINUS: 'MINUS_MINUS',       // --
  ARROW: 'ARROW',                   // => (for lambdas)

  // Delimiters
  LPAREN: 'LPAREN',           // (
  RPAREN: 'RPAREN',           // )
  LBRACE: 'LBRACE',           // {
  RBRACE: 'RBRACE',           // }
  LBRACKET: 'LBRACKET',       // [
  RBRACKET: 'RBRACKET',       // ]
  COMMA: 'COMMA',             // ,
  COLON: 'COLON',             // :
  SEMICOLON: 'SEMICOLON',     // ; (optional)

  // Special
  EOF: 'EOF',
  NEWLINE: 'NEWLINE',
};

// Map keywords to token types
export const Keywords = {
  'ring': TokenType.RING,
  'precious': TokenType.PRECIOUS,
  'song': TokenType.SONG,
  'answer': TokenType.ANSWER,
  'sing': TokenType.SING,
  'eyeof': TokenType.EYEOF,
  'perhaps': TokenType.PERHAPS,
  'otherwise': TokenType.OTHERWISE,
  'wander': TokenType.WANDER,
  'journey': TokenType.JOURNEY,
  'in': TokenType.IN,
  'goldberry': TokenType.GOLDBERRY,
  'sauron': TokenType.SAURON,
  'shadow': TokenType.SHADOW,
  'with': TokenType.WITH,
  'either': TokenType.EITHER,
  'none': TokenType.NONE,
  'flee': TokenType.FLEE,
  'onwards': TokenType.ONWARDS,
  'shire': TokenType.SHIRE,
  'attempt': TokenType.ATTEMPT,
  'rescue': TokenType.RESCUE,
  'peril': TokenType.PERIL,
};

// Token class
export class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`;
  }
}
