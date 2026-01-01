# Functors

> *"Containers you can map over."*

## What Are They?

A **functor** is a container (or context) that holds a value and provides a `map` function. Map applies a function to the wrapped value without leaving the container.

```typescript
// Array is a functor
const numbers = [1, 2, 3];
const doubled = numbers.map(x => x * 2);
// [2, 4, 6]

// Option/Maybe is a functor
class Option<T> {
  map<U>(fn: (value: T) => U): Option<U> {
    // Apply function, stay in Option
  }
}

// Promise is a functor
const promise = Promise.resolve(5);
const doubled = promise.then(x => x * 2);
// Promise<10>
```

## Why This Is Beautiful

Functors allow you to:
- **Transform** values while staying in context
- **Compose** transformations
- **Abstract** over different containers
- **Avoid** manual unwrapping/rewrapping

Work with values as if they weren't wrapped!

## Functor Laws

A proper functor must satisfy two laws:

### 1. Identity Law

```typescript
// map(identity) === identity
functor.map(x => x) === functor

// Example with Array
[1, 2, 3].map(x => x) // [1, 2, 3] - unchanged
```

### 2. Composition Law

```typescript
// map(compose(f, g)) === map(g).map(f)
functor.map(x => f(g(x))) === functor.map(g).map(f)

// Example
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;

// These are equivalent:
[1, 2, 3].map(x => double(addOne(x)));  // [4, 6, 8]
[1, 2, 3].map(addOne).map(double);       // [4, 6, 8]
```

## Common Functors

### Array Functor

```typescript
// Array is the most familiar functor
const numbers = [1, 2, 3];

numbers
  .map(x => x + 1)      // [2, 3, 4]
  .map(x => x * 2)      // [4, 6, 8]
  .map(x => `n: ${x}`); // ['n: 4', 'n: 6', 'n: 8']
```

### Option/Maybe Functor

```typescript
class Option<T> {
  private constructor(private readonly value: T | null) {}
  
  static some<T>(value: T): Option<T> {
    return new Option(value);
  }
  
  static none<T>(): Option<T> {
    return new Option<T>(null);
  }
  
  map<U>(fn: (value: T) => U): Option<U> {
    if (this.value === null) {
      return Option.none();
    }
    return Option.some(fn(this.value));
  }
  
  getOrElse(defaultValue: T): T {
    return this.value ?? defaultValue;
  }
}

// Use it
const some = Option.some(5);
const none = Option.none<number>();

some.map(x => x * 2);  // Option.some(10)
none.map(x => x * 2);  // Option.none() - function not called!

// Chain transformations
Option.some(5)
  .map(x => x + 1)      // Option.some(6)
  .map(x => x * 2)      // Option.some(12)
  .map(x => `Result: ${x}`)
  .getOrElse('No value'); // 'Result: 12'
```

### Result/Either Functor

```typescript
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };

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
  
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (!this._success) {
      return Result.err(this._error!);
    }
    return Result.ok(fn(this._value!));
  }
  
  isOk(): boolean {
    return this._success;
  }
}

// Use it
const success = Result.ok(5);
const failure = Result.err('Error');

success.map(x => x * 2);  // Result.ok(10)
failure.map(x => x * 2);  // Result.err('Error') - not called!

// Transformation chain
Result.ok(5)
  .map(x => x + 1)
  .map(x => x * 2)
  .map(x => `Value: ${x}`);
// Result.ok('Value: 12')
```

### Promise Functor

```typescript
// Promise is a functor via .then()
const promise = Promise.resolve(5);

promise
  .then(x => x + 1)      // Promise<6>
  .then(x => x * 2)      // Promise<12>
  .then(x => `Result: ${x}`);
// Promise<'Result: 12'>

// Handles async
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

fetchUser('123')
  .then(user => user.name)
  .then(name => name.toUpperCase());
// Promise<string>
```

### Function Functor

```typescript
// Functions are functors!
// map = compose
type Func<A, B> = (a: A) => B;

function map<A, B, C>(
  fn: Func<A, B>,
  transform: (b: B) => C
): Func<A, C> {
  return (a: A) => transform(fn(a));
}

// Use it
const addOne = (x: number) => x + 1;
const double = map(addOne, x => x * 2);

double(5); // (5 + 1) * 2 = 12
```

## Creating Custom Functors

### Box Functor (Identity)

```typescript
class Box<T> {
  constructor(private readonly value: T) {}
  
  map<U>(fn: (value: T) => U): Box<U> {
    return new Box(fn(this.value));
  }
  
  unwrap(): T {
    return this.value;
  }
}

// Use it
const result = new Box(5)
  .map(x => x + 1)
  .map(x => x * 2)
  .map(x => `Result: ${x}`)
  .unwrap();
// 'Result: 12'
```

### Tree Functor

```typescript
type Tree<T> = 
  | { type: 'leaf'; value: T }
  | { type: 'node'; left: Tree<T>; right: Tree<T> };

function mapTree<T, U>(tree: Tree<T>, fn: (value: T) => U): Tree<U> {
  if (tree.type === 'leaf') {
    return { type: 'leaf', value: fn(tree.value) };
  }
  
  return {
    type: 'node',
    left: mapTree(tree.left, fn),
    right: mapTree(tree.right, fn)
  };
}

// Use it
const tree: Tree<number> = {
  type: 'node',
  left: { type: 'leaf', value: 1 },
  right: { type: 'leaf', value: 2 }
};

const doubled = mapTree(tree, x => x * 2);
// { type: 'node', left: { value: 2 }, right: { value: 4 } }
```

### Validation Functor

```typescript
class Validation<T, E> {
  private constructor(
    private readonly _errors: E[],
    private readonly _value?: T
  ) {}
  
  static success<T, E>(value: T): Validation<T, E> {
    return new Validation([], value);
  }
  
  static failure<T, E>(errors: E[]): Validation<T, E> {
    return new Validation(errors);
  }
  
  map<U>(fn: (value: T) => U): Validation<U, E> {
    if (this._errors.length > 0) {
      return Validation.failure(this._errors);
    }
    return Validation.success(fn(this._value!));
  }
  
  isValid(): boolean {
    return this._errors.length === 0;
  }
  
  getErrors(): E[] {
    return this._errors;
  }
}
```

## Practical Examples

### Nullable Values

```typescript
function safeDivide(a: number, b: number): Option<number> {
  return b === 0 ? Option.none() : Option.some(a / b);
}

// Transform safely
safeDivide(10, 2)
  .map(x => x * 2)              // Option.some(10)
  .map(x => Math.round(x))      // Option.some(10)
  .getOrElse(0);                // 10

safeDivide(10, 0)
  .map(x => x * 2)              // Option.none() - skipped
  .map(x => Math.round(x))      // Option.none() - skipped
  .getOrElse(0);                // 0
```

### API Responses

```typescript
async function fetchUserSafe(id: string): Promise<Result<User, string>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return Result.err('User not found');
    }
    const user = await response.json();
    return Result.ok(user);
  } catch (error) {
    return Result.err('Network error');
  }
}

// Transform safely
const userName = await fetchUserSafe('123')
  .then(result => result.map(user => user.name))
  .then(result => result.map(name => name.toUpperCase()));
  
if (userName.isOk()) {
  console.log('User name:', userName.unwrap());
}
```

### Form Validation

```typescript
function validateEmail(email: string): Result<string, string> {
  return email.includes('@')
    ? Result.ok(email)
    : Result.err('Invalid email');
}

function validateAge(age: number): Result<number, string> {
  return age >= 18
    ? Result.ok(age)
    : Result.err('Must be 18 or older');
}

// Transform valid data
validateEmail('user@example.com')
  .map(email => email.toLowerCase())
  .map(email => email.trim());

validateAge(25)
  .map(age => age * 12) // Convert to months
  .map(months => `${months} months old`);
```

## Lifting Functions

"Lift" a regular function to work with functors:

```typescript
// Lift function into Option context
function lift<A, B>(fn: (a: A) => B): (option: Option<A>) => Option<B> {
  return (option) => option.map(fn);
}

// Regular function
const double = (x: number) => x * 2;

// Lifted function
const doubleOption = lift(double);

doubleOption(Option.some(5));  // Option.some(10)
doubleOption(Option.none());   // Option.none()
```

## Bi-Functors

Map over both sides:

```typescript
class Either<L, R> {
  private constructor(
    private readonly _left?: L,
    private readonly _right?: R
  ) {}
  
  static left<L, R>(value: L): Either<L, R> {
    return new Either(value, undefined);
  }
  
  static right<L, R>(value: R): Either<L, R> {
    return new Either(undefined, value);
  }
  
  // Map right side (success)
  map<U>(fn: (value: R) => U): Either<L, U> {
    if (this._left !== undefined) {
      return Either.left(this._left);
    }
    return Either.right(fn(this._right!));
  }
  
  // Map left side (error)
  mapLeft<U>(fn: (value: L) => U): Either<U, R> {
    if (this._left !== undefined) {
      return Either.left(fn(this._left));
    }
    return Either.right(this._right!);
  }
  
  // Map both sides
  bimap<U, V>(
    leftFn: (left: L) => U,
    rightFn: (right: R) => V
  ): Either<U, V> {
    if (this._left !== undefined) {
      return Either.left(leftFn(this._left));
    }
    return Either.right(rightFn(this._right!));
  }
}

// Use it
const success = Either.right<string, number>(42);
const failure = Either.left<string, number>('Error');

success.map(x => x * 2);              // Either.right(84)
failure.mapLeft(e => e.toUpperCase()); // Either.left('ERROR')
```

## Contra-Functors

Map in reverse (for things like comparators):

```typescript
class Predicate<T> {
  constructor(private readonly test: (value: T) => boolean) {}
  
  // Contramap: transform input before testing
  contramap<U>(fn: (u: U) => T): Predicate<U> {
    return new Predicate(u => this.test(fn(u)));
  }
  
  check(value: T): boolean {
    return this.test(value);
  }
}

// Use it
const isPositive = new Predicate<number>(x => x > 0);

const isLongString = isPositive.contramap((s: string) => s.length);

isLongString.check('hello');  // true (length 5 > 0)
isLongString.check('');        // false (length 0)
```

## The Mind-Shift

**Before functors:**
- Manually unwrap/rewrap containers
- Conditional logic everywhere
- Hard to compose

**After:**
- Map over containers
- Stay in context
- Compose transformations

## Summary

**Functors**:
- Containers with `map`
- Transform wrapped values
- Stay in context

**Laws**:
- Identity: `map(id) = id`
- Composition: `map(f ∘ g) = map(g).map(f)`

**Common functors**:
- Array, Option, Result, Promise, Function

**Key insight**: *Functors let you transform values without leaving their container, making code more composable and safer.*

---

**Next**: [Monads](../06-monads.md)
