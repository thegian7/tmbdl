#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, dirname } from 'path';
import { createInterface } from 'readline';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';
import { Interpreter } from '../src/interpreter.js';
import { formatError } from '../src/errors.js';
import { formatValue } from '../src/stdlib.js';
import { Compiler } from '../src/compiler.js';
import { CodeGenerator } from '../src/codegen.js';
import { VM } from '../src/vm.js';
import { serializeBytecode, deserializeBytecode } from '../src/serializer.js';

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
  run <file>        Execute a .tmbdl file (interpreter)
  vm <file>         Execute via bytecode VM
  compile <file>    Compile to JavaScript (.js output)
  build <file>      Compile to bytecode (.tmbdlc output)
  exec <file>       Run compiled bytecode (.tmbdlc)
  bytecode <file>   Show bytecode (debugging)
  lex <file>        Show tokens from a .tmbdl file
  parse <file>      Show AST from a .tmbdl file
  repl              Start interactive mode
  help              Show this message

Examples:
  tmbdl run examples/hello.tmbdl
  tmbdl vm examples/hello.tmbdl
  tmbdl build examples/hello.tmbdl   # Creates hello.tmbdlc
  tmbdl exec examples/hello.tmbdlc   # Runs compiled bytecode
  tmbdl compile examples/hello.tmbdl
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

function compileFile(filepath, outputPath = null) {
  try {
    const source = readFileSync(filepath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const compiler = new Compiler();
    const jsCode = compiler.compile(ast);

    // Determine output path: input.tmbdl → input.js
    if (!outputPath) {
      outputPath = filepath.replace(/\.tmbdl$/, '.js');
      if (outputPath === filepath) {
        outputPath = filepath + '.js';
      }
    }

    writeFileSync(outputPath, jsCode);
    console.log(`\n  ✨ Compiled successfully!`);
    console.log(`  📜 ${filepath} → ${outputPath}\n`);
  } catch (error) {
    console.error(formatError(error, readFileSync(filepath, 'utf-8')));
    process.exit(1);
  }
}

function showBytecode(filepath) {
  try {
    const source = readFileSync(filepath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const codegen = new CodeGenerator();
    const chunk = codegen.generate(ast);

    // Disassemble to show the bytecode
    chunk.disassemble();
  } catch (error) {
    console.error(formatError(error, readFileSync(filepath, 'utf-8')));
    process.exit(1);
  }
}

function createModuleLoader() {
  return function loadModule(modulePath, currentFile, moduleCache) {
    // Resolve the module path relative to current file
    const basePath = currentFile ? dirname(currentFile) : process.cwd();
    let fullPath = resolve(basePath, modulePath);

    // Add .tmbdl extension if not present
    if (!fullPath.endsWith('.tmbdl')) {
      fullPath += '.tmbdl';
    }

    // Check cache
    if (moduleCache.has(fullPath)) {
      return moduleCache.get(fullPath);
    }

    // Mark as loading (for circular import detection)
    moduleCache.set(fullPath, {});

    // Read and compile the module
    const source = readFileSync(fullPath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const codegen = new CodeGenerator();
    const chunk = codegen.generate(ast);

    // Execute the module
    const moduleVM = new VM({
      currentFile: fullPath,
      moduleLoader: loadModule,
    });
    moduleVM.moduleCache = moduleCache;
    moduleVM.run(chunk);

    // Get and cache the exports
    const exports = moduleVM.getExports();
    moduleCache.set(fullPath, exports);
    return exports;
  };
}

function runVM(filepath) {
  try {
    const fullPath = resolve(filepath);
    const source = readFileSync(fullPath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const codegen = new CodeGenerator();
    const chunk = codegen.generate(ast);

    const vm = new VM({
      currentFile: fullPath,
      moduleLoader: createModuleLoader(),
    });
    vm.run(chunk);
  } catch (error) {
    console.error(formatError(error, readFileSync(filepath, 'utf-8')));
    process.exit(1);
  }
}

function buildBytecode(filepath, outputPath = null) {
  try {
    const source = readFileSync(filepath, 'utf-8');
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const codegen = new CodeGenerator();
    const chunk = codegen.generate(ast);

    // Serialize to binary
    const bytecode = serializeBytecode(chunk);

    // Determine output path: input.tmbdl → input.tmbdlc
    if (!outputPath) {
      outputPath = filepath.replace(/\.tmbdl$/, '.tmbdlc');
      if (outputPath === filepath) {
        outputPath = filepath + 'c';
      }
    }

    writeFileSync(outputPath, bytecode);
    console.log(`\n  ✨ Built successfully!`);
    console.log(`  📦 ${filepath} → ${outputPath}`);
    console.log(`  📊 ${bytecode.length} bytes\n`);
  } catch (error) {
    console.error(formatError(error, readFileSync(filepath, 'utf-8')));
    process.exit(1);
  }
}

function execBytecode(filepath) {
  try {
    const bytecode = readFileSync(filepath);
    const chunk = deserializeBytecode(bytecode);

    const vm = new VM();
    vm.run(chunk);
  } catch (error) {
    console.error(formatError(error));
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
  let buffer = '';  // For multi-line input
  let braceDepth = 0;

  rl.prompt();

  rl.on('line', (line) => {
    const trimmed = line.trim();

    // Exit commands only work on fresh input
    if (buffer === '' && (trimmed === 'flee' || trimmed === 'exit' || trimmed === 'quit')) {
      console.log('\n  May the road go ever on! Farewell.\n');
      rl.close();
      return;
    }

    // Empty line with no buffer - just reprompt
    if (buffer === '' && trimmed === '') {
      rl.prompt();
      return;
    }

    // Add to buffer
    buffer += (buffer ? '\n' : '') + line;

    // Count braces to detect multi-line blocks
    for (const char of line) {
      if (char === '{') braceDepth++;
      if (char === '}') braceDepth--;
    }

    // If braces are unbalanced, continue reading
    if (braceDepth > 0) {
      rl.setPrompt('  .....> ');
      rl.prompt();
      return;
    }

    // Reset for next input
    braceDepth = 0;
    const input = buffer;
    buffer = '';
    rl.setPrompt('  shire> ');

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

  case 'compile':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl compile <file> [output]\n');
      process.exit(1);
    }
    compileFile(args[1], args[2]);
    break;

  case 'vm':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl vm <file>\n');
      process.exit(1);
    }
    runVM(args[1]);
    break;

  case 'bytecode':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl bytecode <file>\n');
      process.exit(1);
    }
    showBytecode(args[1]);
    break;

  case 'build':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl build <file> [output]\n');
      process.exit(1);
    }
    buildBytecode(args[1], args[2]);
    break;

  case 'exec':
    if (!args[1]) {
      console.error('\n  Usage: tmbdl exec <file.tmbdlc>\n');
      process.exit(1);
    }
    execBytecode(args[1]);
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
