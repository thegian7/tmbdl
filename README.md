# Tmbdl

**Tom Bombadil Programming Language** - A LOTR-themed interpreted programming language.

> *"Hey dol! Merry dol! Ring a dong dillo!"*

Tmbdl (pronounced "Tom Bombadil") is a dynamically-typed scripting language with syntax inspired by JavaScript but keywords drawn from Tolkien's Middle-earth. Built as a learning project to understand interpreters and compilers.

## Quick Example

```tmbdl
~ A simple program in Tmbdl

song greet(name) {
    sing `Hey dol! Hello {name}!`
}

ring hobbits = ["Frodo", "Sam", "Merry", "Pippin"]

journey (hobbit in hobbits) {
    greet(hobbit)
}

perhaps (length(hobbits) == 4) {
    sing "The fellowship begins!"
}
```

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd tmbdl

# Install dependencies (none currently)
npm install

# Link globally (optional)
npm link

# Run a program
node bin/tmbdl.js run examples/hello.tmbdl
# or if linked:
tmbdl run examples/hello.tmbdl
```

## CLI Usage

```bash
tmbdl run <file>     # Execute a .tmbdl file
tmbdl repl           # Start interactive mode
tmbdl lex <file>     # Show tokens (debugging)
tmbdl parse <file>   # Show AST (debugging)
tmbdl help           # Show help
```

## LOTR Keyword Mapping

| Tmbdl | JavaScript | Description |
|-------|------------|-------------|
| `ring` | `let` | Variable declaration |
| `precious` | `const` | Constant declaration |
| `song` | `function` | Function definition |
| `answer` | `return` | Return statement |
| `sing` | `console.log` | Print output |
| `eyeof` | `console.debug` | Debug logger (Eye of Sauron) |
| `perhaps` | `if` | Conditional |
| `otherwise` | `else` | Else clause |
| `wander` | `while` | While loop |
| `journey...in` | `for...of` | For-each loop |
| `goldberry` | `true` | Boolean true |
| `sauron` | `false` | Boolean false |
| `shadow` | `null` | Null value |
| `with` | `&&` | Logical AND |
| `either` | `\|\|` | Logical OR |
| `none` | `!` | Logical NOT |
| `flee` | `break` | Break from loop |
| `onwards` | `continue` | Continue loop |
| `realm` | `class` | Class definition |
| `forge` | `constructor` | Constructor |
| `self` | `this` | Instance reference |
| `inherits` | `extends` | Inheritance |
| `create` | `new` | Create instance |
| `attempt` | `try` | Try block |
| `rescue` | `catch` | Catch block |
| `summon` | `import` | Import module |
| `share` | `export` | Export from module |

## Features

- **Variables & Constants**: `ring` and `precious`
- **Functions**: Named functions with `song` and lambdas with `=>`
- **Control Flow**: `perhaps`/`otherwise`, `wander`, `journey...in`
- **Classes**: `realm` with `forge` constructor and `inherits`
- **Modules**: `summon`/`share` for imports/exports
- **Error Handling**: `attempt`/`rescue` (try/catch)
- **Template Strings**: `` `Hello {name}` ``
- **Higher-Order Functions**: `map`, `filter`, `reduce`, `find`, `some`, `every`, `sort`
- **Compound Operators**: `+=`, `-=`, `*=`, `/=`, `++`, `--`

## Standard Library

| Function | Description |
|----------|-------------|
| `length(x)` | Length of string or array |
| `push(arr, val)` | Add to array |
| `pop(arr)` | Remove last element |
| `type(x)` | Get type name |
| `str(x)` | Convert to string |
| `num(x)` | Convert to number |
| `floor(x)`, `ceil(x)`, `round(x)` | Rounding |
| `abs(x)`, `min(...)`, `max(...)` | Math functions |
| `random()` | Random number 0-1 |
| `range(end)` / `range(start, end)` | Create number array |
| `split(str, delim)` | Split string |
| `join(arr, delim)` | Join array to string |
| `slice(x, start, end)` | Get portion |
| `keys(obj)`, `values(obj)` | Object keys/values |
| `map(arr, fn)` | Transform elements |
| `filter(arr, fn)` | Filter elements |
| `reduce(arr, fn, init)` | Reduce to value |
| `find(arr, fn)` | Find first match |
| `some(arr, fn)` | Any match? |
| `every(arr, fn)` | All match? |
| `sort(arr, fn?)` | Sort array |

## REPL

Start an interactive session:

```bash
tmbdl repl
```

```
  shire> ring x = 42
  => 42
  shire> x * 2
  => 84
  shire> song double(n) {
  .....>   answer n * 2
  .....> }
  => <song double>
  shire> double(21)
  => 42
  shire> flee
  May the road go ever on! Farewell.
```

## Examples

See the `examples/` directory:
- `hello.tmbdl` - Basic features demo
- `features.tmbdl` - All language features
- `classes_test.tmbdl` - Class/inheritance demo
- `modules_test.tmbdl` - Module system demo

## Documentation

See [LANGUAGE.md](LANGUAGE.md) for the complete language specification.

## License

MIT
