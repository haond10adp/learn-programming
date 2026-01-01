# Higher-Order Functions

> *"Functions that work with functions."*

## What Are They?

A **higher-order function** is a function that either:
1. Takes one or more functions as arguments, OR
2. Returns a function

```typescript
// ✅ Higher-order: takes function as argument
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// ✅ Higher-order: returns function
function multiplier(factor: number): (x: number) => number {
  return (x) => x * factor;
}

const double = multiplier(2);
const triple = multiplier(3);

double(5); // 10
triple(5); // 15
```

## Why This Is Beautiful

Higher-order functions enable:
- **Abstraction**: Factor out common patterns
- **Composition**: Build complex from simple
- **Reusability**: Generic, flexible code
- **Declarative style**: What, not how

They're the essence of functional programming.

## Built-in Higher-Order Functions

### Array Methods

```typescript
const numbers = [1, 2, 3, 4, 5];

// map: transform each element
const doubled = numbers.map(x => x * 2);
// [2, 4, 6, 8, 10]

// filter: keep elements that pass test
const evens = numbers.filter(x => x % 2 === 0);
// [2, 4]

// reduce: accumulate value
const sum = numbers.reduce((acc, x) => acc + x, 0);
// 15

// find: first element that matches
const firstEven = numbers.find(x => x % 2 === 0);
// 2

// some: any element matches
const hasEven = numbers.some(x => x % 2 === 0);
// true

// every: all elements match
const allPositive = numbers.every(x => x > 0);
// true

// sort: custom comparator
const sorted = [...numbers].sort((a, b) => b - a);
// [5, 4, 3, 2, 1]
```

### Chaining

```typescript
const users = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true }
];

const result = users
  .filter(user => user.active)
  .map(user => user.name.toUpperCase())
  .sort();
// ['ALICE', 'CHARLIE']
```

## Creating Higher-Order Functions

### Functions that Take Functions

```typescript
// Generic retry
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying...`);
    }
  }
  throw new Error('Unreachable');
}

// Use it
const data = await retry(() => fetchData(), 3);
```

### Functions that Return Functions

```typescript
// Partial application
function add(a: number): (b: number) => number {
  return (b) => a + b;
}

const add5 = add(5);
add5(10); // 15
add5(20); // 25

// Configuration
function logger(prefix: string): (message: string) => void {
  return (message) => console.log(`[${prefix}] ${message}`);
}

const errorLog = logger('ERROR');
const infoLog = logger('INFO');

errorLog('Something broke');  // [ERROR] Something broke
infoLog('All good');          // [INFO] All good
```

## Common Patterns

### Curry

```typescript
// Convert multi-arg function to chain of single-arg functions
function curry<A, B, C>(
  fn: (a: A, b: B) => C
): (a: A) => (b: B) => C {
  return (a) => (b) => fn(a, b);
}

// Use it
function add(a: number, b: number): number {
  return a + b;
}

const curriedAdd = curry(add);
const add5 = curriedAdd(5);

add5(10); // 15
add5(20); // 25

// Generic curry for any arity
function curryN<T extends any[], R>(
  fn: (...args: T) => R
): any {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args as T);
    }
    return (...moreArgs: any[]) => curried(...args, ...moreArgs);
  };
}

const add3 = (a: number, b: number, c: number) => a + b + c;
const curriedAdd3 = curryN(add3);

curriedAdd3(1)(2)(3);     // 6
curriedAdd3(1, 2)(3);     // 6
curriedAdd3(1)(2, 3);     // 6
```

### Partial Application

```typescript
function partial<A extends any[], B extends any[], R>(
  fn: (...args: [...A, ...B]) => R,
  ...fixedArgs: A
): (...args: B) => R {
  return (...remainingArgs) => fn(...fixedArgs, ...remainingArgs);
}

// Use it
function greet(greeting: string, name: string): string {
  return `${greeting}, ${name}!`;
}

const sayHello = partial(greet, 'Hello');
const sayGoodbye = partial(greet, 'Goodbye');

sayHello('Alice');    // Hello, Alice!
sayGoodbye('Bob');    // Goodbye, Bob!
```

### Compose

```typescript
// Right-to-left composition
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a) => f(g(a));
}

// Use it
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;

const addOneThenDouble = compose(double, addOne);
addOneThenDouble(5); // (5 + 1) * 2 = 12

// Generic compose for any number of functions
function composeN(...fns: Function[]): Function {
  return fns.reduce((f, g) => (...args: any[]) => f(g(...args)));
}

const process = composeN(
  (x: number) => x * 3,
  (x: number) => x + 5,
  (x: number) => x * 2
);

process(10); // ((10 * 2) + 5) * 3 = 75
```

### Pipe

```typescript
// Left-to-right composition (more intuitive)
function pipe<A, B, C>(
  f: (a: A) => B,
  g: (b: B) => C
): (a: A) => C {
  return (a) => g(f(a));
}

const addOneThenDouble = pipe(addOne, double);
addOneThenDouble(5); // (5 + 1) * 2 = 12

// Generic pipe
function pipeN<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg) => fns.reduce((acc, fn) => fn(acc), arg);
}

const process = pipeN(
  (x: number) => x * 2,
  (x: number) => x + 5,
  (x: number) => x * 3
);

process(10); // ((10 * 2) + 5) * 3 = 75
```

## Practical Examples

### Memoization

```typescript
function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache = new Map<A, R>();
  
  return (arg: A): R => {
    if (cache.has(arg)) {
      console.log('Cache hit!');
      return cache.get(arg)!;
    }
    
    console.log('Computing...');
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

// Use it
const expensiveFibonacci = (n: number): number => {
  if (n <= 1) return n;
  return expensiveFibonacci(n - 1) + expensiveFibonacci(n - 2);
};

const fastFibonacci = memoize(expensiveFibonacci);

fastFibonacci(40); // Slow first time
fastFibonacci(40); // Instant second time
```

### Debounce

```typescript
function debounce<A extends any[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: A) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

// Use it
const saveToServer = (data: string) => {
  console.log('Saving:', data);
};

const debouncedSave = debounce(saveToServer, 500);

// Only last call executes after 500ms of inactivity
debouncedSave('a');
debouncedSave('ab');
debouncedSave('abc'); // Only this saves
```

### Throttle

```typescript
function throttle<A extends any[]>(
  fn: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  let lastRun = 0;
  
  return (...args: A) => {
    const now = Date.now();
    
    if (now - lastRun >= delayMs) {
      fn(...args);
      lastRun = now;
    }
  };
}

// Use it
const logScroll = () => console.log('Scrolled');
const throttledLog = throttle(logScroll, 1000);

// Only executes once per second max
window.addEventListener('scroll', throttledLog);
```

### Once

```typescript
function once<A extends any[], R>(
  fn: (...args: A) => R
): (...args: A) => R | undefined {
  let called = false;
  let result: R;
  
  return (...args: A): R | undefined => {
    if (!called) {
      called = true;
      result = fn(...args);
      return result;
    }
    return result;
  };
}

// Use it
const initialize = once(() => {
  console.log('Initializing...');
  return { initialized: true };
});

initialize(); // Logs "Initializing..."
initialize(); // Silent (already called)
```

## Functional Array Operations

### GroupBy

```typescript
function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

// Use it
const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 30 }
];

const byAge = groupBy(users, user => user.age);
// { 25: [Bob], 30: [Alice, Charlie] }
```

### Chunk

```typescript
function chunk<T>(arr: T[], size: number): T[][] {
  return arr.reduce((chunks, item, index) => {
    const chunkIndex = Math.floor(index / size);
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    chunks[chunkIndex].push(item);
    return chunks;
  }, [] as T[][]);
}

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
```

### Partition

```typescript
function partition<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  return arr.reduce(
    ([pass, fail], item) => {
      return predicate(item)
        ? [[...pass, item], fail]
        : [pass, [...fail, item]];
    },
    [[], []] as [T[], T[]]
  );
}

const [evens, odds] = partition([1, 2, 3, 4, 5], x => x % 2 === 0);
// evens: [2, 4], odds: [1, 3, 5]
```

## Decorators (Higher-Order Functions)

```typescript
// Log function calls
function log<A extends any[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A): R => {
    console.log(`Calling ${fn.name} with:`, args);
    const result = fn(...args);
    console.log(`Result:`, result);
    return result;
  };
}

// Measure execution time
function time<A extends any[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A): R => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    console.log(`${fn.name} took ${end - start}ms`);
    return result;
  };
}

// Use them
const add = (a: number, b: number) => a + b;
const loggedAdd = log(add);
const timedAdd = time(add);
const both = time(log(add));

both(5, 10);
// Calling add with: [5, 10]
// Result: 15
// add took 0.123ms
```

## Type Safety

```typescript
// Strongly typed map
function map<T, U>(
  arr: T[],
  fn: (item: T, index: number) => U
): U[] {
  return arr.map(fn);
}

const numbers = [1, 2, 3];
const strings = map(numbers, n => n.toString()); // string[]

// Type error
const wrong = map(numbers, n => n.toUpperCase()); // Error!

// Constrained higher-order function
function filterByProperty<T, K extends keyof T>(
  arr: T[],
  key: K,
  value: T[K]
): T[] {
  return arr.filter(item => item[key] === value);
}

const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
];

filterByProperty(users, 'age', 30);     // ✅ OK
filterByProperty(users, 'age', 'Alice'); // ❌ Error: type mismatch
```

## The Mind-Shift

**Before higher-order functions:**
- Imperative loops everywhere
- Duplicated patterns
- Hard to abstract

**After:**
- Declarative transformations
- Reusable abstractions
- Composable operations

## Summary

**Higher-Order Functions**:
- Take functions as arguments
- Return functions
- Enable abstraction and composition

**Common patterns**:
- Map, filter, reduce
- Curry, partial application
- Compose, pipe
- Memoize, debounce, throttle

**Key insight**: *Functions are values—pass them around, return them, combine them to build powerful abstractions.*

---

**Next**: [Function Composition](../04-function-composition.md)
