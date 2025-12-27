// Tmbdl Runtime
const __tmbdl_print = (...args) => console.log(...args);
const __tmbdl_eyeof = (label, value) => console.debug(`👁 [${label}]:`, value);

// Standard library functions
const length = (x) => x.length;
const push = (arr, val) => { arr.push(val); return arr; };
const pop = (arr) => arr.pop();
const type = (x) => {
  if (x === null) return 'shadow';
  if (typeof x === 'boolean') return 'truth';
  if (typeof x === 'number') return 'number';
  if (typeof x === 'string') return 'tale';
  if (Array.isArray(x)) return 'fellowship';
  if (typeof x === 'function') return 'song';
  if (typeof x === 'object') return 'realm';
  return 'unknown';
};
const str = (x) => String(x);
const num = (x) => Number(x);
const floor = (x) => Math.floor(x);
const ceil = (x) => Math.ceil(x);
const round = (x) => Math.round(x);
const abs = (x) => Math.abs(x);
const min = (...args) => Math.min(...args);
const max = (...args) => Math.max(...args);
const random = () => Math.random();
const range = (start, end, step = 1) => {
  if (end === undefined) { end = start; start = 0; }
  const result = [];
  if (step > 0) for (let i = start; i < end; i += step) result.push(i);
  else for (let i = start; i > end; i += step) result.push(i);
  return result;
};
const keys = (obj) => Object.keys(obj);
const values = (obj) => Object.values(obj);
const split = (str, delim) => str.split(delim);
const join = (arr, delim) => arr.join(delim);
const slice = (x, start, end) => x.slice(start, end);
const map = (arr, fn) => arr.map(fn);
const filter = (arr, fn) => arr.filter(fn);
const reduce = (arr, fn, init) => init !== undefined ? arr.reduce(fn, init) : arr.reduce(fn);
const find = (arr, fn) => arr.find(fn) ?? null;
const some = (arr, fn) => arr.some(fn);
const every = (arr, fn) => arr.every(fn);
const sort = (arr, fn) => [...arr].sort(fn || ((a, b) => a - b));

__tmbdl_print("=== Testing Realms (Classes) ===");
__tmbdl_print("");
class Hobbit {
  constructor(name, age) {
this.name = name
this.age = age
  }
  greet() {
    __tmbdl_print(`Hello! I am ${this.name}, a hobbit of ${this.age} years.`);
  }
  birthday() {
this.age = (this.age + 1)
    __tmbdl_print(`${this.name} is now ${this.age} years old!`);
  }
  getName() {
    return this.name;
  }
}
__tmbdl_print("--- Basic Realm Test ---");
let frodo = new Hobbit("Frodo Baggins", 50);
frodo.greet();
frodo.birthday();
__tmbdl_print(`Name via method: ${frodo.getName()}`);
__tmbdl_print(`Direct access: ${frodo.name}`);
__tmbdl_print("");
let sam = new Hobbit("Samwise Gamgee", 38);
sam.greet();
__tmbdl_print("");
__tmbdl_print("--- Inheritance Test ---");
class Being {
  constructor(name) {
this.name = name
this.alive = true
  }
  isAlive() {
    return this.alive;
  }
  speak(words) {
    __tmbdl_print(`${this.name} says: "${words}"`);
  }
}
class Wizard extends Being {
  constructor(name, power) {
    super();
this.name = name
this.alive = true
this.power = power
  }
  castSpell(spell) {
    __tmbdl_print(`${this.name} casts ${spell} with power level ${this.power}!`);
  }
  introduce() {
    this.speak("You shall not pass!");
  }
}
let gandalf = new Wizard("Gandalf the Grey", 100);
gandalf.speak("A wizard is never late.");
gandalf.castSpell("Light");
gandalf.introduce();
__tmbdl_print(`Is Gandalf alive? ${gandalf.isAlive()}`);
__tmbdl_print("");
__tmbdl_print("--- Multiple Instances ---");
let hobbits = [new Hobbit("Merry", 36), new Hobbit("Pippin", 28)];
for (let h of hobbits) {
  h.greet();
}
__tmbdl_print("");
__tmbdl_print("=== All Realm Tests Passed! ===");