# Applicatives

> *"Apply wrapped functions to wrapped values."*

## What Are They?

An **applicative functor** (applicative) is a functor with two additional operations:
1. **of/pure**: Wrap a value
2. **ap/apply**: Apply a wrapped function to a wrapped value

```typescript
class Option<T> {
  // Functor
  map<U>(fn: (value: T) => U): Option<U> { }
  
  // Applicative
  static some<T>(value: T): Option<T> { }
  
  ap<U>(wrappedFn: Option<(value: T) => U>): Option<U> { }
}

// Apply wrapped function to wrapped value
const wrappedValue = Option.some(5);
const wrappedFn = Option.some((x: number) => x * 2);

wrappedValue.ap(wrappedFn); // Option.some(10)
```

## Why This Is Beautiful

Applicatives enable:
- **Parallel** operations (unlike monads which are sequential)
- **Multiple** wrapped arguments
- **Independent** computations
- **Validation** that collects all errors

## Applicative Laws

### 1. Identity

```typescript
// of(id).ap(v) === v
Option.some((x: T) => x).ap(value) === value
```

### 2. Composition

```typescript
// of(compose).ap(u).ap(v).ap(w) === u.ap(v.ap(w))
```

### 3. Homomorphism

```typescript
// of(f).ap(of(x)) === of(f(x))
Option.some(f).ap(Option.some(x)) === Option.some(f(x))
```

### 4. Interchange

```typescript
// u.ap(of(y)) === of(f => f(y)).ap(u)
```

## Option Applicative

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
  
  // Applicative
  ap<U>(wrappedFn: Option<(value: T) => U>): Option<U> {
    if (this.value === null || wrappedFn.value === null) {
      return Option.none();
    }
    return Option.some(wrappedFn.value(this.value));
  }
  
  // Helper: lift2
  static lift2<A, B, C>(
    fn: (a: A, b: B) => C
  ): (a: Option<A>, b: Option<B>) => Option<C> {
    return (a, b) =>
      a.map(aVal => (bVal: B) => fn(aVal, bVal)).ap(b);
  }
  
  getOrElse(defaultValue: T): T {
    return this.value ?? defaultValue;
  }
}

// Use it
const add = (a: number) => (b: number) => a + b;

Option.some(5)
  .map(add)                    // Option<(b: number) => number>
  .ap(Option.some(10));        // Option<15>

// Or with lift2
const optionAdd = Option.lift2((a: number, b: number) => a + b);
optionAdd(Option.some(5), Option.some(10)); // Option.some(15)
optionAdd(Option.some(5), Option.none());   // Option.none()
```

## Result Applicative

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
  
  // Applicative
  ap<U>(wrappedFn: Result<(value: T) => U, E>): Result<U, E> {
    if (!this._success) {
      return Result.err(this._error!);
    }
    if (!wrappedFn._success) {
      return Result.err(wrappedFn._error!);
    }
    return Result.ok(wrappedFn._value!(this._value!));
  }
  
  // Combine multiple Results
  static all<T, E>(...results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    
    for (const result of results) {
      if (!result._success) {
        return Result.err(result._error!);
      }
      values.push(result._value!);
    }
    
    return Result.ok(values);
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
```

## Validation Applicative

The key difference: **accumulate errors** instead of failing fast:

```typescript
class Validation<T, E> {
  private constructor(
    private readonly _errors: E[],
    private readonly _value?: T
  ) {}
  
  static success<T, E>(value: T): Validation<T, E> {
    return new Validation([], value);
  }
  
  static failure<T, E>(...errors: E[]): Validation<T, E> {
    return new Validation(errors);
  }
  
  // Applicative: accumulates errors!
  ap<U>(wrappedFn: Validation<(value: T) => U, E>): Validation<U, E> {
    // Both have errors: combine them
    if (this._errors.length > 0 && wrappedFn._errors.length > 0) {
      return Validation.failure(...wrappedFn._errors, ...this._errors);
    }
    
    // Only value has errors
    if (this._errors.length > 0) {
      return Validation.failure(...this._errors);
    }
    
    // Only function has errors
    if (wrappedFn._errors.length > 0) {
      return Validation.failure(...wrappedFn._errors);
    }
    
    // Both valid
    return Validation.success(wrappedFn._value!(this._value!));
  }
  
  isValid(): boolean {
    return this._errors.length === 0;
  }
  
  getErrors(): E[] {
    return this._errors;
  }
  
  getValue(): T | undefined {
    return this._value;
  }
}

// Helper to lift functions
function lift2<A, B, C, E>(
  fn: (a: A, b: B) => C
): (a: Validation<A, E>, b: Validation<B, E>) => Validation<C, E> {
  return (a, b) =>
    a.map(aVal => (bVal: B) => fn(aVal, bVal)).ap(b);
}

function lift3<A, B, C, D, E>(
  fn: (a: A, b: B, c: C) => D
): (a: Validation<A, E>, b: Validation<B, E>, c: Validation<C, E>) => Validation<D, E> {
  return (a, b, c) =>
    a.map(aVal => (bVal: B) => (cVal: C) => fn(aVal, bVal, cVal))
      .ap(b)
      .ap(c);
}
```

## Practical Example: Form Validation

```typescript
interface User {
  email: string;
  age: number;
  name: string;
}

function validateEmail(email: string): Validation<string, string> {
  return email.includes('@')
    ? Validation.success(email)
    : Validation.failure('Invalid email format');
}

function validateAge(age: number): Validation<number, string> {
  if (age < 0) {
    return Validation.failure('Age cannot be negative');
  }
  if (age < 18) {
    return Validation.failure('Must be 18 or older');
  }
  if (age > 150) {
    return Validation.failure('Age seems unrealistic');
  }
  return Validation.success(age);
}

function validateName(name: string): Validation<string, string> {
  const errors: string[] = [];
  
  if (name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (name.length > 50) {
    errors.push('Name must be at most 50 characters');
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return errors.length > 0
    ? Validation.failure(...errors)
    : Validation.success(name);
}

// Combine validations with lift3
const createUser = lift3(
  (email: string, age: number, name: string): User => ({
    email,
    age,
    name
  })
);

// Validate user - collects ALL errors!
const result = createUser(
  validateEmail('invalid'),
  validateAge(-5),
  validateName('A')
);

if (!result.isValid()) {
  console.log('Validation errors:', result.getErrors());
  // [
  //   'Invalid email format',
  //   'Age cannot be negative',
  //   'Must be 18 or older',
  //   'Name must be at least 2 characters'
  // ]
}
```

## Multiple Arguments

### Curried Functions

```typescript
// Curry to handle multiple arguments
const add = (a: number) => (b: number) => (c: number) => a + b + c;

Option.some(1)
  .map(add)                 // Option<(b: number) => (c: number) => number>
  .ap(Option.some(2))       // Option<(c: number) => number>
  .ap(Option.some(3));      // Option<6>

// Generic liftn
function liftA2<A, B, C, E>(
  fn: (a: A, b: B) => C
): (a: Validation<A, E>, b: Validation<B, E>) => Validation<C, E> {
  return (a, b) => {
    const curriedFn = (aVal: A) => (bVal: B) => fn(aVal, bVal);
    return a.map(curriedFn).ap(b);
  };
}

function liftA3<A, B, C, D, E>(
  fn: (a: A, b: B, c: C) => D
): (
  a: Validation<A, E>,
  b: Validation<B, E>,
  c: Validation<C, E>
) => Validation<D, E> {
  return (a, b, c) => {
    const curriedFn = (aVal: A) => (bVal: B) => (cVal: C) =>
      fn(aVal, bVal, cVal);
    return a.map(curriedFn).ap(b).ap(c);
  };
}
```

## Sequence and Traverse

### Sequence

Convert list of wrapped values to wrapped list:

```typescript
function sequence<T, E>(
  validations: Validation<T, E>[]
): Validation<T[], E> {
  const values: T[] = [];
  const errors: E[] = [];
  
  for (const validation of validations) {
    if (validation.isValid()) {
      values.push(validation.getValue()!);
    } else {
      errors.push(...validation.getErrors());
    }
  }
  
  return errors.length > 0
    ? Validation.failure(...errors)
    : Validation.success(values);
}

// Use it
const results = [
  validateEmail('a@b.com'),
  validateEmail('invalid'),
  validateEmail('c@d.com')
];

const combined = sequence(results);
// Validation.failure(['Invalid email format'])
```

### Traverse

Map then sequence:

```typescript
function traverse<T, U, E>(
  items: T[],
  fn: (item: T) => Validation<U, E>
): Validation<U[], E> {
  return sequence(items.map(fn));
}

// Use it
const emails = ['a@b.com', 'invalid', 'c@d.com'];
const validated = traverse(emails, validateEmail);
```

## Parallel vs Sequential

```typescript
// Applicative: parallel (independent)
const result = liftA2(
  (a: number, b: number) => a + b
)(
  fetchUserAge('user1'),     // These can run in parallel
  fetchUserAge('user2')
);

// Monad: sequential (dependent)
fetchUserAge('user1')
  .flatMap(age1 =>
    fetchUserAge('user2')    // Must wait for first to complete
      .map(age2 => age1 + age2)
  );
```

## ZipList Applicative

Different behavior for arrays:

```typescript
class ZipList<T> {
  constructor(private readonly items: T[]) {}
  
  static of<T>(value: T): ZipList<T> {
    return new ZipList([value]);
  }
  
  // Zip-based applicative
  ap<U>(wrappedFns: ZipList<(value: T) => U>): ZipList<U> {
    const result: U[] = [];
    const length = Math.min(this.items.length, wrappedFns.items.length);
    
    for (let i = 0; i < length; i++) {
      result.push(wrappedFns.items[i](this.items[i]));
    }
    
    return new ZipList(result);
  }
  
  toArray(): T[] {
    return this.items;
  }
}

// Use it
const add = (a: number) => (b: number) => a + b;

const nums = new ZipList([1, 2, 3]);
const fns = new ZipList([add(10), add(20), add(30)]);

nums.ap(fns).toArray(); // [11, 22, 33]

// Compare to regular Array applicative (cartesian product)
// [1, 2, 3] with [+10, +20, +30]
// Would give [11, 21, 31, 12, 22, 32, 13, 23, 33]
```

## Practical Pattern: Configuration

```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function validateUrl(url: string): Validation<string, string> {
  return url.startsWith('http')
    ? Validation.success(url)
    : Validation.failure('URL must start with http');
}

function validateTimeout(timeout: number): Validation<number, string> {
  return timeout > 0 && timeout <= 60000
    ? Validation.success(timeout)
    : Validation.failure('Timeout must be between 0 and 60000ms');
}

function validateRetries(retries: number): Validation<number, string> {
  return retries >= 0 && retries <= 10
    ? Validation.success(retries)
    : Validation.failure('Retries must be between 0 and 10');
}

const createConfig = lift3(
  (apiUrl: string, timeout: number, retries: number): AppConfig => ({
    apiUrl,
    timeout,
    retries
  })
);

// Validate entire config, collect all errors
const config = createConfig(
  validateUrl('invalid'),
  validateTimeout(-100),
  validateRetries(20)
);

if (!config.isValid()) {
  console.log('Config errors:', config.getErrors());
  // [
  //   'URL must start with http',
  //   'Timeout must be between 0 and 60000ms',
  //   'Retries must be between 0 and 10'
  // ]
}
```

## Applicative vs Monad

**When to use Applicative:**
- Validations that can run independently
- Operations that can run in parallel
- Want to collect all errors
- Fixed structure (known number of operations)

**When to use Monad:**
- Operations depend on previous results
- Sequential execution required
- Early exit on first error
- Dynamic structure (depends on runtime values)

```typescript
// Applicative: validate all fields independently
const user = liftA3(createUser)(
  validateEmail(data.email),
  validateAge(data.age),
  validateName(data.name)
);

// Monad: each step depends on previous
parseNumber('5')
  .flatMap(n => divide(100, n))  // Needs the number
  .flatMap(n => sqrt(n));         // Needs the division result
```

## The Mind-Shift

**Before applicatives:**
- Validate sequentially, lose errors
- Manual unwrapping for multiple values
- Hard to compose

**After:**
- Collect all validation errors
- Clean composition of wrapped values
- Parallel operations

## Summary

**Applicatives**:
- Apply wrapped functions to wrapped values
- Independent computations
- Accumulate errors (for Validation)
- More restrictive than Monads, more flexible than Functors

**Key operations**:
- `of`/`pure`: wrap value
- `ap`: apply wrapped function
- `lift2`, `lift3`: combine multiple values

**Key insight**: *Applicatives let you work with multiple wrapped values independently, perfect for validations that should collect all errors rather than fail fast.*

---

**Next**: [Advanced Patterns](../08-advanced-patterns.md)
