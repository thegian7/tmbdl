#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createInterface } from 'readline';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Interpreter } from '../src/interpreter.js';
import { formatError } from '../src/errors.js';

const VERSION = '1.0.0';

const BANNER = `
  ╔══════════════════════════════════════════════════════╗
  ║     _____           _         _ _                    ║
  ║    |_   _|_ _ ___ | |__   __| | |                    ║
  ║      | |/ _\` / _ \\| '_ \\ / _\` | |                    ║
  ║      | | (_| | (_) | |_) | (_| | |                   ║
  ║      |_|\\__,_|\\___/|_.__/ \\__,_|_|                   ║
  ║                                                      ║
  ║     Tom Bombadil Programming Language v${VERSION}        ║
  ║     "Hey dol! Merry dol! Ring a dong dillo!"         ║
  ╚══════════════════════════════════════════════════════╝
`;

function printHelp() {
  console.log(BANNER);
  console.log(`
Usage: tmbdl <command> [options]

Commands:
  run <file>     Execute a .tmbdl file
  lex <file>     Show tokens from a .tmbdl file
  parse <file>   Show AST from a .tmbdl file
  repl           Start interactive mode
  help           Show this message

Examples:
  tmbdl run examples/hello.tmbdl
  tmbdl repl
`);
}

function runFile(filepath) {
  try {
    const fullPath = resolve(filepath);
    const source = readFileSync(fullPath, 'utf-8');
    run(source, fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`\n  The path has vanished: '${filepath}' not found\n`);
    } else {
      console.error(formatError(error));
    }
    process.exit(1);
  }
}

function run(source, filepath = null) {
  try {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const interpreter = new Interpreter(filepath);
    interpreter.interpret(ast);
  } catch (error) {
    console.error(formatError(error, source));
    process.exit(1);
  }
}

function lexFile(filepath) {
  try {
    const source = readFileSync(filepath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    console.log('\nTokens:');
    console.log('─'.repeat(50));
    tokens.forEach((token, i) => {
      console.log(`${i.toString().padStart(3)}: ${token.toString()}`);
    });
    console.log('─'.repeat(50));
    console.log(`Total: ${tokens.length} tokens\n`);
  } catch (error) {
    console.error(formatError(error));
    process.exit(1);
  }
}

function parseFile(filepath) {
  try {
    const source = readFileSync(filepath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    console.log('\nAbstract Syntax Tree:');
    console.log('─'.repeat(50));
    console.log(JSON.stringify(ast, null, 2));
    console.log('─'.repeat(50) + '\n');
  } catch (error) {
    console.error(formatError(error, readFileSync(filepath, 'utf-8')));
    process.exit(1);
  }
}

function repl() {
  console.log(BANNER);
  console.log('  Type your code below. Use "flee" to exit.\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '  shire> '
  });

  const interpreter = new Interpreter();

  rl.prompt();

  rl.on('line', (line) => {
    const input = line.trim();

    if (input === 'flee' || input === 'exit' || input === 'quit') {
      console.log('\n  May the road go ever on! Farewell.\n');
      rl.close();
      return;
    }

    if (input === '') {
      rl.prompt();
      return;
    }

    try {
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const result = interpreter.interpret(ast);
      if (result !== undefined && result !== null) {
        console.log(`  => ${formatValue(result)}`);
      }
    } catch (error) {
      console.error(formatError(error, input));
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

function formatValue(value) {
  if (value === null) return 'shadow';
  if (value === true) return 'goldberry';
  if (value === false) return 'sauron';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) {
    return '[' + value.map(formatValue).join(', ') + ']';
  }
  return String(value);
}

// Main entry point
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'run':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl run <file>\n');
      process.exit(1);
    }
    runFile(args[1]);
    break;

  case 'lex':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl lex <file>\n');
      process.exit(1);
    }
    lexFile(args[1]);
    break;

  case 'parse':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl parse <file>\n');
      process.exit(1);
    }
    parseFile(args[1]);
    break;

  case 'repl':
    repl();
    break;

  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;

  case 'version':
  case '--version':
  case '-v':
    console.log(`tmbdl v${VERSION}`);
    break;

  default:
    if (command && command.endsWith('.tmbdl')) {
      // Allow running files directly: tmbdl file.tmbdl
      runFile(command);
    } else {
      printHelp();
    }
}
