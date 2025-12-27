# Tmbdl

**Tom Bombadil Programming Language** - A LOTR-themed programming language with interpreter, bytecode VM, and JavaScript transpiler.

> *"Hey dol! Merry dol! Ring a dong dillo!"*

## Quick Start

### Option 1: Standalone Binary (Linux x64 - No dependencies!)

```bash
# Download and run directly
wget https://github.com/thegian7/tmbdl/releases/download/v1.0.0/tmbdl-linux-x64
chmod +x tmbdl-linux-x64
./tmbdl-linux-x64 run examples/hello.tmbdl
```

### Option 2: With Node.js (All platforms)

```bash
git clone https://github.com/thegian7/tmbdl.git
cd tmbdl
npm link
tmbdl run examples/hello.tmbdl
```

## Example Program

```tmbdl
~ FizzBuzz in Tmbdl

journey (n in range(1, 101)) {
    perhaps (n % 15 == 0) {
        sing "FizzBuzz"
    } otherwise perhaps (n % 3 == 0) {
        sing "Fizz"
    } otherwise perhaps (n % 5 == 0) {
        sing "Buzz"
    } otherwise {
        sing n
    }
}
```

## CLI Commands

```bash
tmbdl run <file>       # Run with interpreter
tmbdl vm <file>        # Run with bytecode VM (faster)
tmbdl compile <file>   # Transpile to JavaScript
tmbdl build <file>     # Compile to bytecode (.tmbdlc)
tmbdl exec <file>      # Run compiled bytecode
tmbdl repl             # Interactive mode
tmbdl bytecode <file>  # Show bytecode (debugging)
tmbdl lex <file>       # Show tokens (debugging)
tmbdl parse <file>     # Show AST (debugging)
```

## Language Syntax

| Tmbdl | JavaScript | Description |
|-------|------------|-------------|
| `ring x = 5` | `let x = 5` | Variable |
| `precious PI = 3.14` | `const PI = 3.14` | Constant |
| `song greet(name) { }` | `function greet(name) { }` | Function |
| `answer x` | `return x` | Return |
| `sing "hello"` | `console.log("hello")` | Print |
| `perhaps (x) { }` | `if (x) { }` | If |
| `otherwise { }` | `else { }` | Else |
| `wander (x > 0) { }` | `while (x > 0) { }` | While loop |
| `journey (x in arr) { }` | `for (x of arr) { }` | For-each |
| `goldberry` / `sauron` | `true` / `false` | Booleans |
| `shadow` | `null` | Null |
| `with` / `either` | `&&` / `\|\|` | And / Or |
| `none x` | `!x` | Not |
| `flee` / `onwards` | `break` / `continue` | Loop control |
| `realm Hobbit { }` | `class Hobbit { }` | Class |
| `forge(name) { }` | `constructor(name) { }` | Constructor |
| `self.name` | `this.name` | Instance |
| `summon { x } from "y"` | `import { x } from "y"` | Import |
| `share { x }` | `export { x }` | Export |

## Features

- **Three Execution Modes**: Interpreter, Bytecode VM, JavaScript transpiler
- **Bytecode Serialization**: Compile once, run many times (`.tmbdlc` files)
- **Closures**: Functions capture variables from outer scope
- **Modules**: Import/export between files
- **Classes**: With inheritance (`inherits`)
- **Standard Library**: `map`, `filter`, `reduce`, `range`, etc.
- **REPL**: Interactive mode with multi-line support
- **LOTR-themed Errors**: *"The road has gone astray at line 42"*

## Standard Library

```tmbdl
length(x)              ~ Length of string/array
push(arr, val)         ~ Add to array
pop(arr)               ~ Remove last
range(5)               ~ [0, 1, 2, 3, 4]
range(1, 5)            ~ [1, 2, 3, 4]
map(arr, |x| => x * 2) ~ Transform
filter(arr, |x| => x > 0)
reduce(arr, |a,b| => a + b, 0)
split("a,b", ",")      ~ ["a", "b"]
join(["a","b"], ",")   ~ "a,b"
keys(obj), values(obj)
floor(x), ceil(x), round(x), abs(x)
min(...), max(...), random()
type(x), str(x), num(x)
```

## More Examples

### Closures

```tmbdl
song makeCounter() {
    ring count = 0
    song increment() {
        count = count + 1
        answer count
    }
    answer increment
}

ring counter = makeCounter()
sing counter()  ~ 1
sing counter()  ~ 2
```

### Classes

```tmbdl
realm Hobbit {
    forge(name) {
        self.name = name
    }

    song greet() {
        sing "Hello, I'm " + self.name
    }
}

ring frodo = create Hobbit("Frodo")
frodo.greet()
```

### Modules

```tmbdl
~ math.tmbdl
share song add(a, b) { answer a + b }
share ring PI = 3.14159

~ main.tmbdl
summon { add, PI } from "./math"
sing add(2, 3)  ~ 5
```

## REPL

```
$ tmbdl repl

  shire> ring x = 42
  shire> x * 2
  => 84
  shire> flee
  May the road go ever on! Farewell.
```

## Documentation

See [LANGUAGE.md](LANGUAGE.md) for the complete language specification.

## License

MIT
