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

function greet(name) {
  __tmbdl_print((("Hey dol! Merry dol! Hello " + name) + "!"));
  return true;
}
let hobbits = ["Frodo", "Sam", "Merry", "Pippin"];
__tmbdl_eyeof("The Fellowship", hobbits);
let count = 0;
for (let hobbit of hobbits) {
  __tmbdl_eyeof("Greeting", hobbit);
  greet(hobbit);
count = (count + 1)
}
if ((count == 4)) {
  __tmbdl_print("The fellowship of four hobbits is complete!");
} else {
  __tmbdl_print("We need more hobbits for this journey...");
}
let rings_of_power = (((3 + 7) + 9) + 1);
__tmbdl_print(("Total rings of power: " + str(rings_of_power)));
const ONE_RING = 1;
__tmbdl_print(("One Ring to rule them all: " + str(ONE_RING)));
__tmbdl_print("");
__tmbdl_print("Counting down to Mordor...");
let steps = 5;
while ((steps > 0)) {
  __tmbdl_print(("Steps remaining: " + str(steps)));
steps = (steps - 1)
}
__tmbdl_print("You have reached Mount Doom!");
function factorial(n) {
  if ((n <= 1)) {
    return 1;
  }
  return (n * factorial((n - 1)));
}
__tmbdl_print("");
__tmbdl_print(("The factorial of 5 is: " + str(factorial(5))));
let has_ring = true;
let is_invisible = false;
if ((has_ring && (!is_invisible))) {
  __tmbdl_print("Frodo has the Ring but is visible!");
}
let meals = ["breakfast", "second breakfast", "elevenses", "lunch", "tea", "dinner", "supper"];
__tmbdl_print("");
__tmbdl_print(("A hobbit's first meal: " + meals[0]));
__tmbdl_print(("A hobbit's favorite meal: " + meals[1]));
__tmbdl_print(("Total meals: " + str(length(meals))));
__tmbdl_print("");
__tmbdl_print("Tom Bombadil bids you farewell!");