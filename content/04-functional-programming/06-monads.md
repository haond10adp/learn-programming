# Monads

> *"Functors you can flatten."*

## What Are They?

A **monad** is a functor with two additional operations:
1. **of/return/pure**: Wrap a value in the monad
2. **flatMap/bind/chain**: Map and flatten in one step

```typescript
class Option<T> {
  // Functor: map
  map<U>(fn: (value: T) => U): Option<U> { }
  
  // Monad: of
  static some<T>(value: T): Option<T> { }
  
  // Monad: flatMap
  flatMap<U>(fn: (value: T) => Option<U>): Option<U> { }
}

// Without flatMap
Option.some(5)
  .map(x => Option.some(x * 2))  // Option<Option<number>> - nested!

// With flatMap
Option.some(5)
  .flatMap(x => Option.some(x * 2))  // Option<number> - flat!
```

## Why This Is Beautiful

Monads solve the problem of **nested contexts**:
- Chain operations that return wrapped values
- No manual unwrapping/rewrapping
- Compose effectful computations
- Handle errors, absence, async, etc. uniformly

## Monad Laws

### 1. Left Identity

```typescript
// of(a).flatMap(f) === f(a)
Option.some(5).flatMap(x => Option.some(x * 2))
===
Option.some(5 * 2)
```

### 2. Right Identity

```typescript
// m.flatMap(of) === m
option.flatMap(x => Option.some(x))
===
option
```

### 3. Associativity

```typescript
// m.flatMap(f).flatMap(g) === m.flatMap(x => f(x).flatMap(g))
option.flatMap(f).flatMap(g)
===
option.flatMap(x => f(x).flatMap(g))
```

## Option/Maybe Monad

```typescript
class Option<T> {
  private constructor(private readonly value: T | null) {}
  
  static some<T>(value: T): Option<T> {
    return new Option(value);
  }
  
  static none<T>(): Option<T> {
    return new Option<T>(null);
  }
  
  // Functor
  map<U>(fn: (value: T) => U): Option<U> {
    if (this.value === null) {
      return Option.none();
    }
    return Option.some(fn(this.value));
  }
  
  // Monad
  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    if (this.value === null) {
      return Option.none();
    }
    return fn(this.value);
  }
  
  getOrElse(defaultValue: T): T {
    return this.value ?? defaultValue;
  }
  
  isSome(): boolean {
    return this.value !== null;
  }
}

// Use it
function divide(a: number, b: number): Option<number> {
  return b === 0 ? Option.none() : Option.some(a / b);
}

// Chain divisions
const result = Option.some(100)
  .flatMap(x => divide(x, 2))   // Option.some(50)
  .flatMap(x => divide(x, 5))   // Option.some(10)
  .flatMap(x => divide(x, 0))   // Option.none()
  .flatMap(x => divide(x, 2));  // Skipped!

result.getOrElse(0); // 0
```

## Result/Either Monad

```typescript
class Result<T, E> {
  private constructor(
    private readonly _success: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}
  
  static ok<T, E = never>(value: T): Result<T, E> {
    return new Result(true, value, undefined);
  }
  
  static err<E, T = never>(error: E): Result<T, E> {
    return new Result(false, undefined, error);
  }
  
  // Functor
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (!this._success) {
      return Result.err(this._error!);
    }
    return Result.ok(fn(this._value!));
  }
  
  // Monad
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (!this._success) {
      return Result.err(this._error!);
    }
    return fn(this._value!);
  }
  
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (!this._success) {
      return Result.err(fn(this._error!));
    }
    return Result.ok(this._value!);
  }
  
  isOk(): boolean {
    return this._success;
  }
  
  unwrap(): T {
    if (!this._success) {
      throw new Error('Called unwrap on error');
    }
    return this._value!;
  }
}

// Use it
function parseNumber(s: string): Result<number, string> {
  const n = parseFloat(s);
  return isNaN(n)
    ? Result.err('Not a number')
    : Result.ok(n);
}

function assertPositive(n: number): Result<number, string> {
  return n > 0
    ? Result.ok(n)
    : Result.err('Must be positive');
}

function divide(a: number, b: number): Result<number, string> {
  return b === 0
    ? Result.err('Division by zero')
    : Result.ok(a / b);
}

// Chain operations
const result = parseNumber('100')
  .flatMap(assertPositive)
  .flatMap(n => divide(n, 5))
  .map(n => n * 2);

if (result.isOk()) {
  console.log(result.unwrap()); // 40
}
```

## Promise Monad

```typescript
// Promise is a monad!
// flatMap = then with async function that returns Promise

Promise.resolve(5)
  .then(x => Promise.resolve(x * 2))  // Promise<number>, not Promise<Promise<number>>
  .then(x => Promise.resolve(x + 1))
  .then(console.log); // 11

// Async/await is syntactic sugar for Promise monad
async function example() {
  const x = await Promise.resolve(5);      // flatMap
  const y = await Promise.resolve(x * 2);  // flatMap
  const z = await Promise.resolve(y + 1);  // flatMap
  return z;
}
```

## Array Monad

```typescript
// Array is a monad!
// flatMap flattens nested arrays

[1, 2, 3]
  .flatMap(x => [x, x * 2])
  // [1, 2, 2, 4, 3, 6]

[1, 2, 3]
  .flatMap(x => [x, x + 1])
  .flatMap(x => [x, x * 2]);
  // [1, 2, 2, 4, 2, 4, 3, 6, 3, 6, 4, 8]

// Compared to map
[1, 2, 3].map(x => [x, x * 2]);
// [[1, 2], [2, 4], [3, 6]] - nested!
```

## List Monad

```typescript
class List<T> {
  constructor(private readonly items: T[]) {}
  
  static of<T>(...items: T[]): List<T> {
    return new List(items);
  }
  
  // Functor
  map<U>(fn: (item: T) => U): List<U> {
    return new List(this.items.map(fn));
  }
  
  // Monad
  flatMap<U>(fn: (item: T) => List<U>): List<U> {
    const result: U[] = [];
    for (const item of this.items) {
      const list = fn(item);
      result.push(...list.items);
    }
    return new List(result);
  }
  
  toArray(): T[] {
    return this.items;
  }
}

// Use for combinations
const colors = List.of('red', 'blue');
const sizes = List.of('S', 'M', 'L');

const combinations = colors.flatMap(color =>
  sizes.map(size => `${color}-${size}`)
);

combinations.toArray();
// ['red-S', 'red-M', 'red-L', 'blue-S', 'blue-M', 'blue-L']
```

## IO Monad

Defer side effects:

```typescript
class IO<T> {
  constructor(private readonly effect: () => T) {}
  
  static of<T>(value: T): IO<T> {
    return new IO(() => value);
  }
  
  // Functor
  map<U>(fn: (value: T) => U): IO<U> {
    return new IO(() => fn(this.effect()));
  }
  
  // Monad
  flatMap<U>(fn: (value: T) => IO<U>): IO<U> {
    return new IO(() => fn(this.effect()).run());
  }
  
  // Run the effect
  run(): T {
    return this.effect();
  }
}

// Use it
const getUser = (id: string) =>
  new IO(() => {
    console.log('Fetching user:', id);
    return { id, name: 'Alice' };
  });

const saveUser = (user: User) =>
  new IO(() => {
    console.log('Saving user:', user);
    return user;
  });

// Compose without running
const program = getUser('123')
  .flatMap(user => saveUser(user))
  .map(user => user.name);

// Nothing happens until run
program.run(); // Now side effects occur
```

## Reader Monad

Dependency injection:

```typescript
class Reader<R, A> {
  constructor(private readonly run: (env: R) => A) {}
  
  static of<R, A>(value: A): Reader<R, A> {
    return new Reader(() => value);
  }
  
  // Functor
  map<B>(fn: (a: A) => B): Reader<R, B> {
    return new Reader(env => fn(this.run(env)));
  }
  
  // Monad
  flatMap<B>(fn: (a: A) => Reader<R, B>): Reader<R, B> {
    return new Reader(env => fn(this.run(env)).run(env));
  }
  
  runWith(env: R): A {
    return this.run(env);
  }
}

interface Config {
  apiUrl: string;
  timeout: number;
}

// Use it
const getApiUrl = new Reader<Config, string>(config => config.apiUrl);
const getTimeout = new Reader<Config, number>(config => config.timeout);

const fetchUser = (id: string) =>
  getApiUrl.flatMap(url =>
    getTimeout.map(timeout => ({
      url: `${url}/users/${id}`,
      timeout
    }))
  );

// Run with config
const config: Config = { apiUrl: 'https://api.example.com', timeout: 5000 };
const request = fetchUser('123').runWith(config);
// { url: 'https://api.example.com/users/123', timeout: 5000 }
```

## Writer Monad

Accumulate logs:

```typescript
class Writer<W, A> {
  constructor(
    private readonly value: A,
    private readonly log: W[]
  ) {}
  
  static of<W, A>(value: A): Writer<W, A> {
    return new Writer(value, []);
  }
  
  // Functor
  map<B>(fn: (a: A) => B): Writer<W, B> {
    return new Writer(fn(this.value), this.log);
  }
  
  // Monad
  flatMap<B>(fn: (a: A) => Writer<W, B>): Writer<W, B> {
    const writer = fn(this.value);
    return new Writer(
      writer.value,
      [...this.log, ...writer.log]
    );
  }
  
  tell(log: W): Writer<W, A> {
    return new Writer(this.value, [...this.log, log]);
  }
  
  run(): [A, W[]] {
    return [this.value, this.log];
  }
}

// Use it
const addWithLog = (a: number, b: number): Writer<string, number> =>
  new Writer(a + b, [`Added ${a} + ${b} = ${a + b}`]);

const multiplyWithLog = (a: number, b: number): Writer<string, number> =>
  new Writer(a * b, [`Multiplied ${a} * ${b} = ${a * b}`]);

const result = Writer.of<string, number>(5)
  .flatMap(x => addWithLog(x, 3))
  .flatMap(x => multiplyWithLog(x, 2));

const [value, logs] = result.run();
console.log(value); // 16
console.log(logs);
// ['Added 5 + 3 = 8', 'Multiplied 8 * 2 = 16']
```

## State Monad

Thread state through computations:

```typescript
class State<S, A> {
  constructor(private readonly run: (state: S) => [A, S]) {}
  
  static of<S, A>(value: A): State<S, A> {
    return new State(state => [value, state]);
  }
  
  // Functor
  map<B>(fn: (a: A) => B): State<S, B> {
    return new State(state => {
      const [value, newState] = this.run(state);
      return [fn(value), newState];
    });
  }
  
  // Monad
  flatMap<B>(fn: (a: A) => State<S, B>): State<S, B> {
    return new State(state => {
      const [value, newState] = this.run(state);
      return fn(value).run(newState);
    });
  }
  
  static get<S>(): State<S, S> {
    return new State(state => [state, state]);
  }
  
  static put<S>(newState: S): State<S, void> {
    return new State(() => [undefined, newState]);
  }
  
  runWith(initialState: S): [A, S] {
    return this.run(initialState);
  }
}

// Use it
type Stack = number[];

const push = (value: number): State<Stack, void> =>
  new State(stack => [undefined, [...stack, value]]);

const pop = (): State<Stack, number | undefined> =>
  new State(stack => {
    if (stack.length === 0) {
      return [undefined, stack];
    }
    return [stack[stack.length - 1], stack.slice(0, -1)];
  });

// Compose operations
const program = push(1)
  .flatMap(() => push(2))
  .flatMap(() => push(3))
  .flatMap(() => pop())
  .flatMap(value => State.of(value));

const [result, finalState] = program.runWith([]);
console.log(result);     // 3
console.log(finalState); // [1, 2]
```

## Do Notation (Syntactic Sugar)

Async/await is do-notation for Promises:

```typescript
// Without do-notation
fetchUser('123')
  .then(user => fetchPosts(user.id)
    .then(posts => ({ user, posts }))
  );

// With do-notation (async/await)
async function getUserWithPosts(id: string) {
  const user = await fetchUser(id);
  const posts = await fetchPosts(user.id);
  return { user, posts };
}

// For Result monad, we can simulate:
function doResult<T, E>(
  generator: () => Generator<Result<any, E>, T, any>
): Result<T, E> {
  const gen = generator();
  let result = gen.next();
  
  while (!result.done) {
    const value = result.value;
    if (!value.isOk()) {
      return value as Result<T, E>;
    }
    result = gen.next(value.unwrap());
  }
  
  return Result.ok(result.value);
}

// Use it
const result = doResult(function*() {
  const a = yield parseNumber('5');
  const b = yield parseNumber('10');
  const c = yield divide(a, b);
  return c * 2;
});
```

## Practical Example: Validation

```typescript
interface User {
  email: string;
  age: number;
  name: string;
}

function validateEmail(email: string): Result<string, string> {
  return email.includes('@')
    ? Result.ok(email)
    : Result.err('Invalid email');
}

function validateAge(age: number): Result<number, string> {
  return age >= 18
    ? Result.ok(age)
    : Result.err('Must be 18+');
}

function validateName(name: string): Result<string, string> {
  return name.length >= 2
    ? Result.ok(name)
    : Result.err('Name too short');
}

// Monadic composition
function validateUser(data: any): Result<User, string> {
  return validateEmail(data.email)
    .flatMap(email =>
      validateAge(data.age).flatMap(age =>
        validateName(data.name).map(name => ({
          email,
          age,
          name
        }))
      )
    );
}

// With do-notation (if available)
async function validateUserAsync(data: any): Promise<Result<User, string>> {
  const email = await validateEmail(data.email);
  if (!email.isOk()) return email;
  
  const age = await validateAge(data.age);
  if (!age.isOk()) return age;
  
  const name = await validateName(data.name);
  if (!name.isOk()) return name;
  
  return Result.ok({
    email: email.unwrap(),
    age: age.unwrap(),
    name: name.unwrap()
  });
}
```

## The Mind-Shift

**Before monads:**
- Nested if/else
- Manual unwrapping
- Error-prone composition

**After:**
- Chain with flatMap
- Automatic error handling
- Composable effects

## Summary

**Monads**:
- Functors with flatMap
- Flatten nested contexts
- Compose effectful computations

**Common monads**:
- Option/Maybe: nullable values
- Result/Either: errors
- Promise: async
- Array: non-determinism
- IO: side effects
- Reader: dependency injection
- Writer: logging
- State: stateful computation

**Key insight**: *Monads let you chain operations that produce wrapped values without manual unwrapping—making composition of effects elegant and safe.*

---

**Next**: [Applicatives](../07-applicatives.md)
