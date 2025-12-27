// Standard library for Tmbdl
// Built-in functions with LOTR theming

import { TypeError } from './errors.js';

class NativeFunction {
  constructor(name, arity, fn) {
    this.name = name;
    this.arity = arity; // -1 means variadic
    this.fn = fn;
    this.isHigherOrder = false;
  }

  call(args, callFn = null) {
    return this.fn(args, callFn);
  }

  toString() {
    return `<native song ${this.name}>`;
  }
}

// Higher-order function that can call callbacks
class HigherOrderFunction extends NativeFunction {
  constructor(name, arity, fn) {
    super(name, arity, fn);
    this.isHigherOrder = true;
  }
}

// Format a value for display
function formatValue(value) {
  if (value === null) return 'shadow';
  if (value === true) return 'goldberry';
  if (value === false) return 'sauron';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return '[' + value.map(formatValue).join(', ') + ']';
  }
  // Check for TmbdlFunction (user-defined function)
  if (value && value.declaration && value.closure) {
    return `<song ${value.name}>`;
  }
  // Check for TmbdlLambda
  if (value && value.params && value.body && value.closure && !value.declaration) {
    return `<lambda (${value.params.join(', ')})>`;
  }
  // Check for TmbdlInstance (has klass property) or TmbdlClass (has methods Map)
  if (value && value.klass && value.fields) {
    // TmbdlInstance - format its fields
    const fields = [];
    for (const [k, v] of value.fields) {
      fields.push(`${k}: ${formatValue(v)}`);
    }
    return `<${value.klass.name} {${fields.join(', ')}}>`;
  }
  if (value && value.methods instanceof Map) {
    // TmbdlClass
    return `<realm ${value.name}>`;
  }
  if (typeof value === 'object') {
    const pairs = Object.entries(value)
      .map(([k, v]) => `${k}: ${formatValue(v)}`);
    return '{' + pairs.join(', ') + '}';
  }
  if (value && value.toString) {
    return value.toString();
  }
  return String(value);
}

// Create all standard library functions
export function createStdlib() {
  const stdlib = new Map();

  // length - Get length of array or string
  stdlib.set('length', new NativeFunction('length', 1, (args) => {
    const value = args[0];
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length;
    }
    throw new TypeError('length() requires a string or fellowship (array)');
  }));

  // push - Add element to array
  stdlib.set('push', new NativeFunction('push', 2, (args) => {
    const arr = args[0];
    const value = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('push() requires a fellowship (array) as first argument');
    }
    arr.push(value);
    return arr;
  }));

  // pop - Remove and return last element
  stdlib.set('pop', new NativeFunction('pop', 1, (args) => {
    const arr = args[0];
    if (!Array.isArray(arr)) {
      throw new TypeError('pop() requires a fellowship (array)');
    }
    return arr.pop();
  }));

  // type - Get type of value
  stdlib.set('type', new NativeFunction('type', 1, (args) => {
    const value = args[0];
    if (value === null) return 'shadow';
    if (typeof value === 'boolean') return 'truth';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'tale';
    if (Array.isArray(value)) return 'fellowship';
    if (typeof value === 'function' || value instanceof NativeFunction) return 'song';
    if (typeof value === 'object') return 'realm';
    return 'unknown';
  }));

  // str - Convert to string
  stdlib.set('str', new NativeFunction('str', 1, (args) => {
    return formatValue(args[0]);
  }));

  // num - Convert to number
  stdlib.set('num', new NativeFunction('num', 1, (args) => {
    const value = args[0];
    const num = Number(value);
    if (isNaN(num)) {
      throw new TypeError(`Cannot forge a number from '${formatValue(value)}'`);
    }
    return num;
  }));

  // floor - Round down
  stdlib.set('floor', new NativeFunction('floor', 1, (args) => {
    return Math.floor(args[0]);
  }));

  // ceil - Round up
  stdlib.set('ceil', new NativeFunction('ceil', 1, (args) => {
    return Math.ceil(args[0]);
  }));

  // round - Round to nearest
  stdlib.set('round', new NativeFunction('round', 1, (args) => {
    return Math.round(args[0]);
  }));

  // abs - Absolute value
  stdlib.set('abs', new NativeFunction('abs', 1, (args) => {
    return Math.abs(args[0]);
  }));

  // min - Minimum value
  stdlib.set('min', new NativeFunction('min', -1, (args) => {
    return Math.min(...args);
  }));

  // max - Maximum value
  stdlib.set('max', new NativeFunction('max', -1, (args) => {
    return Math.max(...args);
  }));

  // random - Random number between 0 and 1
  stdlib.set('random', new NativeFunction('random', 0, () => {
    return Math.random();
  }));

  // range - Create an array of numbers
  stdlib.set('range', new NativeFunction('range', -1, (args) => {
    let start = 0, end, step = 1;

    if (args.length === 1) {
      end = args[0];
    } else if (args.length === 2) {
      start = args[0];
      end = args[1];
    } else {
      start = args[0];
      end = args[1];
      step = args[2];
    }

    const result = [];
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
    } else if (step < 0) {
      for (let i = start; i > end; i += step) {
        result.push(i);
      }
    }
    return result;
  }));

  // keys - Get object keys
  stdlib.set('keys', new NativeFunction('keys', 1, (args) => {
    const obj = args[0];
    if (typeof obj !== 'object' || obj === null) {
      throw new TypeError('keys() requires a realm (object)');
    }
    return Object.keys(obj);
  }));

  // values - Get object values
  stdlib.set('values', new NativeFunction('values', 1, (args) => {
    const obj = args[0];
    if (typeof obj !== 'object' || obj === null) {
      throw new TypeError('values() requires a realm (object)');
    }
    return Object.values(obj);
  }));

  // split - Split string
  stdlib.set('split', new NativeFunction('split', 2, (args) => {
    const str = args[0];
    const delimiter = args[1];
    if (typeof str !== 'string') {
      throw new TypeError('split() requires a tale (string)');
    }
    return str.split(delimiter);
  }));

  // join - Join array to string
  stdlib.set('join', new NativeFunction('join', 2, (args) => {
    const arr = args[0];
    const delimiter = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('join() requires a fellowship (array)');
    }
    return arr.join(delimiter);
  }));

  // slice - Get portion of array or string
  stdlib.set('slice', new NativeFunction('slice', -1, (args) => {
    const value = args[0];
    const start = args[1] || 0;
    const end = args[2];
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.slice(start, end);
    }
    throw new TypeError('slice() requires a tale (string) or fellowship (array)');
  }));

  // map - Transform each element with a callback
  stdlib.set('map', new HigherOrderFunction('map', 2, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('map() requires a fellowship (array) as first argument');
    }
    return arr.map((item, index) => callFn(callback, [item, index]));
  }));

  // filter - Keep elements that pass a test
  stdlib.set('filter', new HigherOrderFunction('filter', 2, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('filter() requires a fellowship (array) as first argument');
    }
    return arr.filter((item, index) => callFn(callback, [item, index]));
  }));

  // reduce - Accumulate values
  stdlib.set('reduce', new HigherOrderFunction('reduce', -1, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    const initial = args[2];
    if (!Array.isArray(arr)) {
      throw new TypeError('reduce() requires a fellowship (array) as first argument');
    }
    if (args.length >= 3) {
      return arr.reduce((acc, item, index) => callFn(callback, [acc, item, index]), initial);
    } else {
      return arr.reduce((acc, item, index) => callFn(callback, [acc, item, index]));
    }
  }));

  // find - Find first element matching condition
  stdlib.set('find', new HigherOrderFunction('find', 2, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('find() requires a fellowship (array) as first argument');
    }
    return arr.find((item, index) => callFn(callback, [item, index])) ?? null;
  }));

  // some - Check if any element passes test
  stdlib.set('some', new HigherOrderFunction('some', 2, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('some() requires a fellowship (array) as first argument');
    }
    return arr.some((item, index) => callFn(callback, [item, index]));
  }));

  // every - Check if all elements pass test
  stdlib.set('every', new HigherOrderFunction('every', 2, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('every() requires a fellowship (array) as first argument');
    }
    return arr.every((item, index) => callFn(callback, [item, index]));
  }));

  // sort - Sort array with optional comparator
  stdlib.set('sort', new HigherOrderFunction('sort', -1, (args, callFn) => {
    const arr = args[0];
    const callback = args[1];
    if (!Array.isArray(arr)) {
      throw new TypeError('sort() requires a fellowship (array) as first argument');
    }
    const copy = [...arr];
    if (callback) {
      copy.sort((a, b) => callFn(callback, [a, b]));
    } else {
      copy.sort((a, b) => a - b);
    }
    return copy;
  }));

  return stdlib;
}

export { NativeFunction, HigherOrderFunction, formatValue };
