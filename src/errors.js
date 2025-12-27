// LOTR-themed error handling for Tmbdl

export class TmbdlError extends Error {
  constructor(message, line = null, column = null) {
    super(message);
    this.name = 'TmbdlError';
    this.line = line;
    this.column = column;
  }

  toString() {
    let location = '';
    if (this.line !== null) {
      location = ` at line ${this.line}`;
      if (this.column !== null) {
        location += `, column ${this.column}`;
      }
    }
    return `${this.name}${location}: ${this.message}`;
  }
}

export class SyntaxError extends TmbdlError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'The road has gone astray';
  }
}

export class RuntimeError extends TmbdlError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'A shadow has fallen';
  }
}

export class UndefinedVariableError extends TmbdlError {
  constructor(name, line, column) {
    super(`This ring has not been forged: '${name}'`, line, column);
    this.name = 'Unknown Ring';
  }
}

export class TypeError extends TmbdlError {
  constructor(message, line, column) {
    super(message, line, column);
    this.name = 'One does not simply';
  }
}

export class ConstantError extends TmbdlError {
  constructor(name, line, column) {
    super(`The precious '${name}' cannot be changed - it is bound forever`, line, column);
    this.name = 'Precious Violation';
  }
}

export class DivisionByZeroError extends TmbdlError {
  constructor(line, column) {
    super('A shadow has fallen upon your math - division by zero', line, column);
    this.name = 'Mathematical Shadow';
  }
}

// Format error for display
export function formatError(error, source = null) {
  let output = `\n  ${error.name}`;

  if (error.line !== null) {
    output += ` (line ${error.line}`;
    if (error.column !== null) {
      output += `:${error.column}`;
    }
    output += ')';
  }

  output += `\n  ${error.message}\n`;

  // Show source line if available
  if (source && error.line !== null) {
    const lines = source.split('\n');
    if (error.line <= lines.length) {
      const line = lines[error.line - 1];
      output += `\n  ${error.line} | ${line}\n`;

      if (error.column !== null) {
        const padding = ' '.repeat(String(error.line).length + 3 + error.column - 1);
        output += `${padding}^\n`;
      }
    }
  }

  return output;
}
