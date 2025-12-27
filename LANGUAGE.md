# Tmbdl Language Specification

This document describes the complete syntax and semantics of the Tmbdl programming language.

## Table of Contents

1. [Lexical Structure](#lexical-structure)
2. [Data Types](#data-types)
3. [Variables](#variables)
4. [Operators](#operators)
5. [Control Flow](#control-flow)
6. [Functions](#functions)
7. [Classes (Realms)](#classes-realms)
8. [Modules](#modules)
9. [Error Handling](#error-handling)
10. [Standard Library](#standard-library)
11. [Comments](#comments)

---

## Lexical Structure

### Keywords

All keywords are lowercase and LOTR-themed:

| Keyword | Purpose | JavaScript Equivalent |
|---------|---------|----------------------|
| `ring` | Variable declaration | `let` |
| `precious` | Constant declaration | `const` |
| `song` | Function definition | `function` |
| `answer` | Return value | `return` |
| `sing` | Print to stdout | `console.log()` |
| `eyeof` | Debug output | `console.debug()` |
| `perhaps` | If statement | `if` |
| `otherwise` | Else clause | `else` |
| `wander` | While loop | `while` |
| `journey` | For-each loop | `for` |
| `in` | Iterator keyword | `of` |
| `goldberry` | Boolean true | `true` |
| `sauron` | Boolean false | `false` |
| `shadow` | Null value | `null` |
| `with` | Logical AND | `&&` |
| `either` | Logical OR | `\|\|` |
| `none` | Logical NOT | `!` |
| `flee` | Break loop | `break` |
| `onwards` | Continue loop | `continue` |
| `realm` | Class definition | `class` |
| `forge` | Constructor | `constructor` |
| `self` | Instance reference | `this` |
| `inherits` | Class extension | `extends` |
| `create` | Instantiation | `new` |
| `attempt` | Try block | `try` |
| `rescue` | Catch block | `catch` |
| `summon` | Import | `import` |
| `share` | Export | `export` |
| `from` | Selective import | `from` |
| `as` | Alias | `as` |

### Identifiers

Identifiers must start with a letter or underscore, followed by letters, digits, or underscores:

```
identifier = [a-zA-Z_][a-zA-Z0-9_]*
```

### Literals

**Numbers:**
```tmbdl
42          ~ Integer
3.14159     ~ Floating point
```

**Strings:**
```tmbdl
"Hello"     ~ Double quotes
'Hello'     ~ Single quotes
```

**Template Strings:**
```tmbdl
`Hello {name}!`                    ~ Interpolated string
`Result: {a + b}`                  ~ Expressions allowed
`Multi
line`                              ~ Multiline allowed
```

**Booleans:**
```tmbdl
goldberry   ~ true
sauron      ~ false
```

**Null:**
```tmbdl
shadow      ~ null
```

**Arrays:**
```tmbdl
[1, 2, 3]
["a", "b", "c"]
[1, "mixed", goldberry, [nested]]
```

**Objects:**
```tmbdl
{name: "Frodo", age: 50}
{key: value, "string-key": 123}
```

---

## Data Types

Tmbdl has the following types:

| Type | Description | Example |
|------|-------------|---------|
| `number` | Floating-point number | `42`, `3.14` |
| `tale` | String | `"hello"` |
| `truth` | Boolean | `goldberry`, `sauron` |
| `shadow` | Null | `shadow` |
| `fellowship` | Array | `[1, 2, 3]` |
| `realm` | Object/Instance | `{a: 1}`, class instances |
| `song` | Function | `song foo() {}` |

Use `type(value)` to get the type name as a string.

---

## Variables

### Declaration with `ring`

Variables are declared with `ring` and can be reassigned:

```tmbdl
ring name = "Frodo"
ring age = 50
ring items = ["ring", "sword", "cloak"]

name = "Samwise"        ~ Reassignment OK
age += 1                ~ Compound assignment OK
```

### Constants with `precious`

Constants cannot be reassigned:

```tmbdl
precious PI = 3.14159
precious MAX_HOBBITS = 4

PI = 3                  ~ Error: Cannot reassign constant
```

### Scope

Variables are block-scoped:

```tmbdl
ring outer = 1

perhaps (goldberry) {
    ring inner = 2      ~ Only visible in this block
    outer = 10          ~ Can access outer scope
}

sing inner              ~ Error: inner not defined
```

---

## Operators

### Arithmetic

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition / Concatenation | `3 + 4`, `"a" + "b"` |
| `-` | Subtraction | `10 - 5` |
| `*` | Multiplication | `6 * 7` |
| `/` | Division | `20 / 4` |
| `%` | Modulo | `10 % 3` |

### Comparison

| Operator | Description |
|----------|-------------|
| `==` | Equal to |
| `!=` | Not equal to |
| `<` | Less than |
| `>` | Greater than |
| `<=` | Less than or equal |
| `>=` | Greater than or equal |

### Logical

| Operator | Description | Example |
|----------|-------------|---------|
| `with` | Logical AND | `a with b` |
| `either` | Logical OR | `a either b` |
| `none` | Logical NOT | `none a` |

### Compound Assignment

| Operator | Equivalent |
|----------|------------|
| `+=` | `x = x + y` |
| `-=` | `x = x - y` |
| `*=` | `x = x * y` |
| `/=` | `x = x / y` |

### Increment/Decrement

| Operator | Description |
|----------|-------------|
| `++` | Increment by 1 |
| `--` | Decrement by 1 |

Both prefix and postfix forms are supported:

```tmbdl
ring x = 5
x++         ~ x is now 6
++x         ~ x is now 7
```

---

## Control Flow

### Conditionals: `perhaps` / `otherwise`

```tmbdl
perhaps (age >= 111) {
    sing "Eleventy-one!"
} otherwise perhaps (age >= 50) {
    sing "Mature hobbit"
} otherwise {
    sing "Young hobbit"
}
```

### While Loop: `wander`

```tmbdl
ring count = 5

wander (count > 0) {
    sing `Counting: {count}`
    count--
}
```

### For-Each Loop: `journey...in`

```tmbdl
ring hobbits = ["Frodo", "Sam", "Merry", "Pippin"]

journey (hobbit in hobbits) {
    sing `Hello, {hobbit}!`
}
```

Works with arrays, strings, and ranges:

```tmbdl
~ Iterate over characters
journey (char in "ABC") {
    sing char
}

~ Iterate over range
journey (i in range(5)) {
    sing i
}
```

### Loop Control

**`flee`** - Exit loop immediately:

```tmbdl
journey (i in range(100)) {
    perhaps (i == 5) {
        flee
    }
    sing i
}
~ Prints 0, 1, 2, 3, 4
```

**`onwards`** - Skip to next iteration:

```tmbdl
journey (i in range(5)) {
    perhaps (i == 2) {
        onwards
    }
    sing i
}
~ Prints 0, 1, 3, 4
```

---

## Functions

### Named Functions: `song`

```tmbdl
song greet(name) {
    sing `Hello, {name}!`
}

song add(a, b) {
    answer a + b
}

greet("Gandalf")
ring sum = add(3, 4)
```

### Return Values: `answer`

Functions return `shadow` (null) by default. Use `answer` to return a value:

```tmbdl
song factorial(n) {
    perhaps (n <= 1) {
        answer 1
    }
    answer n * factorial(n - 1)
}
```

### Lambda Functions

Short syntax for anonymous functions:

```tmbdl
~ Single expression (implicit return)
ring double = (x) => x * 2
ring add = (a, b) => a + b

~ Block body (explicit return)
ring greet = (name) => {
    ring message = `Hello, {name}!`
    answer message
}

~ No parameters
ring random = () => random() * 100
```

### Higher-Order Functions

Functions can be passed as arguments:

```tmbdl
ring numbers = [1, 2, 3, 4, 5]

ring doubled = map(numbers, (n) => n * 2)
ring evens = filter(numbers, (n) => n % 2 == 0)
ring sum = reduce(numbers, (acc, n) => acc + n, 0)
```

---

## Classes (Realms)

### Basic Class

Classes are called "realms" in Tmbdl:

```tmbdl
realm Hobbit {
    forge(name, age) {
        self.name = name
        self.age = age
    }

    song greet() {
        sing `I am {self.name}, age {self.age}`
    }

    song birthday() {
        self.age += 1
    }
}

ring frodo = create Hobbit("Frodo", 50)
frodo.greet()
frodo.birthday()
sing frodo.age     ~ 51
```

### Constructor: `forge`

The `forge` method is called when creating instances:

```tmbdl
realm Point {
    forge(x, y) {
        self.x = x
        self.y = y
    }
}

ring p = create Point(10, 20)
```

### Instance Reference: `self`

Use `self` to access instance properties and methods:

```tmbdl
realm Counter {
    forge() {
        self.count = 0
    }

    song increment() {
        self.count += 1
        answer self.count
    }
}
```

### Inheritance: `inherits`

Classes can extend other classes:

```tmbdl
realm Being {
    forge(name) {
        self.name = name
        self.alive = goldberry
    }

    song speak(words) {
        sing `{self.name} says: "{words}"`
    }
}

realm Wizard inherits Being {
    forge(name, power) {
        self.name = name
        self.alive = goldberry
        self.power = power
    }

    song castSpell(spell) {
        sing `{self.name} casts {spell}!`
    }
}

ring gandalf = create Wizard("Gandalf", 100)
gandalf.speak("You shall not pass!")    ~ Inherited method
gandalf.castSpell("Light")              ~ Own method
```

---

## Modules

### Exporting: `share`

Export functions, classes, or variables:

```tmbdl
~ math.tmbdl

share song add(a, b) {
    answer a + b
}

share precious PI = 3.14159

share realm Calculator {
    forge() {
        self.result = 0
    }
}
```

### Importing: `summon`

Import an entire module:

```tmbdl
summon "./math.tmbdl" as math

ring result = math.add(1, 2)
sing math.PI
```

Import specific items:

```tmbdl
summon { add, PI } from "./math.tmbdl"

ring result = add(1, 2)
```

Import with alias:

```tmbdl
summon { add as plus } from "./math.tmbdl"

ring result = plus(1, 2)
```

---

## Error Handling

### Try/Catch: `attempt` / `rescue`

```tmbdl
attempt {
    ring result = riskyOperation()
    sing result
} rescue (error) {
    sing `Error: {error["message"]}`
}
```

The error object has properties:
- `error["name"]` - Error type
- `error["message"]` - Error message
- `error["line"]` - Line number (if available)

### Error Types

- **SyntaxError**: Invalid syntax
- **UndefinedVariableError**: Variable not found
- **TypeError**: Wrong type for operation
- **RuntimeError**: General runtime error

---

## Standard Library

### Output

| Function | Description |
|----------|-------------|
| `sing value` | Print to stdout |
| `eyeof label value` | Debug output with label |

```tmbdl
sing "Hello, World!"
eyeof "debug" someVariable    ~ 👁 [debug]: value
```

### Type Functions

| Function | Description |
|----------|-------------|
| `type(x)` | Get type name |
| `str(x)` | Convert to string |
| `num(x)` | Convert to number |

```tmbdl
type(42)           ~ "number"
type("hello")      ~ "tale"
type([1,2,3])      ~ "fellowship"
str(42)            ~ "42"
num("42")          ~ 42
```

### Math Functions

| Function | Description |
|----------|-------------|
| `floor(x)` | Round down |
| `ceil(x)` | Round up |
| `round(x)` | Round to nearest |
| `abs(x)` | Absolute value |
| `min(...)` | Minimum of arguments |
| `max(...)` | Maximum of arguments |
| `random()` | Random number 0-1 |

### Array Functions

| Function | Description |
|----------|-------------|
| `length(x)` | Length of array or string |
| `push(arr, val)` | Add element to end |
| `pop(arr)` | Remove and return last |
| `slice(arr, start, end?)` | Get portion |
| `range(end)` | Create `[0, 1, ..., end-1]` |
| `range(start, end)` | Create `[start, ..., end-1]` |
| `range(start, end, step)` | With step |

### String Functions

| Function | Description |
|----------|-------------|
| `split(str, delim)` | Split into array |
| `join(arr, delim)` | Join array to string |

### Object Functions

| Function | Description |
|----------|-------------|
| `keys(obj)` | Get object keys |
| `values(obj)` | Get object values |

### Higher-Order Functions

| Function | Description |
|----------|-------------|
| `map(arr, fn)` | Transform each element |
| `filter(arr, fn)` | Keep matching elements |
| `reduce(arr, fn, init?)` | Reduce to single value |
| `find(arr, fn)` | Find first match |
| `some(arr, fn)` | Any element matches? |
| `every(arr, fn)` | All elements match? |
| `sort(arr, fn?)` | Sort (returns copy) |

```tmbdl
ring nums = [1, 2, 3, 4, 5]

map(nums, (n) => n * 2)              ~ [2, 4, 6, 8, 10]
filter(nums, (n) => n > 2)           ~ [3, 4, 5]
reduce(nums, (a, b) => a + b, 0)     ~ 15
find(nums, (n) => n > 3)             ~ 4
some(nums, (n) => n > 4)             ~ goldberry
every(nums, (n) => n > 0)            ~ goldberry
sort([3,1,2])                        ~ [1, 2, 3]
```

---

## Comments

### Single-Line Comments

Start with `~`:

```tmbdl
~ This is a comment
ring x = 42  ~ Inline comment
```

### Multi-Line Comments

Wrapped in `~* *~`:

```tmbdl
~*
  This is a multi-line comment.
  It can span many lines.
  Old Tom Bombadil style!
*~
```

---

## Grammar Summary

```ebnf
program        = statement* ;

statement      = varDecl
               | constDecl
               | funcDecl
               | classDecl
               | ifStmt
               | whileStmt
               | forStmt
               | returnStmt
               | breakStmt
               | continueStmt
               | tryStmt
               | exprStmt
               | printStmt
               | logStmt
               | importStmt
               | exportStmt
               | block ;

varDecl        = "ring" IDENTIFIER "=" expression ;
constDecl      = "precious" IDENTIFIER "=" expression ;
funcDecl       = "song" IDENTIFIER "(" params? ")" block ;
classDecl      = "realm" IDENTIFIER ("inherits" IDENTIFIER)? "{" classMember* "}" ;

classMember    = "forge" "(" params? ")" block
               | "song" IDENTIFIER "(" params? ")" block ;

ifStmt         = "perhaps" "(" expression ")" block
                 ("otherwise" "perhaps" "(" expression ")" block)*
                 ("otherwise" block)? ;

whileStmt      = "wander" "(" expression ")" block ;
forStmt        = "journey" "(" IDENTIFIER "in" expression ")" block ;
tryStmt        = "attempt" block "rescue" "(" IDENTIFIER ")" block ;

expression     = assignment ;
assignment     = IDENTIFIER ("=" | "+=" | "-=" | "*=" | "/=") expression
               | logicOr ;
logicOr        = logicAnd ("either" logicAnd)* ;
logicAnd       = equality ("with" equality)* ;
equality       = comparison (("==" | "!=") comparison)* ;
comparison     = term (("<" | ">" | "<=" | ">=") term)* ;
term           = factor (("+" | "-") factor)* ;
factor         = unary (("*" | "/" | "%") unary)* ;
unary          = ("none" | "-") unary | postfix ;
postfix        = primary ("++" | "--")? ;
primary        = NUMBER | STRING | "goldberry" | "sauron" | "shadow"
               | IDENTIFIER | "(" expression ")" | array | object
               | lambda | call | propertyAccess | "create" call ;

lambda         = "(" params? ")" "=>" (expression | block) ;
```

---

## Error Messages

Tmbdl provides LOTR-themed error messages:

| Error | Message |
|-------|---------|
| Undefined variable | "This ring has not been forged: X" |
| Constant reassignment | "The precious cannot be changed: X" |
| Syntax error | "The road has gone astray at line X" |
| Type error | "One does not simply..." |
| Division by zero | "A shadow has fallen upon your math" |
| Unterminated string | "The words faded into shadow" |

---

*May your code journey ever onward to Mount Doom and back!*
