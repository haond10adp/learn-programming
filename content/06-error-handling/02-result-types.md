# Result Types

> *"Make errors impossible to ignore."*

## What Are They?

**Result types** (also called Either types) make errors explicit in the type signature. Instead of throwing exceptions, functions return a value that can be either success or failure.

```typescript
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: 'Division by zero' };
  }
  return { success: true, value: a / b };
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

## Why This Is Beautiful

Result types create **explicit error handling**:
- Errors visible in type signature
- Compiler forces handling
- No silent failures
- Composable operations

Errors become data, not exceptions.

## Basic Result Type

```typescript
type Success<T> = {
  success: true;
  value: T;
};

type Failure<E> = {
  success: false;
  error: E;
};

type Result<T, E> = Success<T> | Failure<E>;

// Helper functions
function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

## Using Results

```typescript
function parseNumber(input: string): Result<number, string> {
  const num = parseFloat(input);
  if (isNaN(num)) {
    return err('Invalid number');
  }
  return ok(num);
}

const result = parseNumber('42');
if (result.success) {
  console.log('Parsed:', result.value);
} else {
  console.error('Error:', result.error);
}
```

## Mapping Over Results

```typescript
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
}

// Use it
const parsed = parseNumber('42');
const doubled = map(parsed, x => x * 2);
// doubled: Result<number, string>
```

## FlatMap / Chain

```typescript
function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

// Chain operations
const result = parseNumber('10')
  |> flatMap(n => divide(100, n))
  |> map(n => n * 2);
```

## Result Class

```typescript
class Result<T, E> {
  private constructor(
    private readonly _success: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result(true, value, undefined);
  }

  static err<E>(error: E): Result<never, E> {
    return new Result(false, undefined, error);
  }

  isOk(): this is Result<T, never> {
    return this._success;
  }

  isErr(): this is Result<never, E> {
    return !this._success;
  }

  unwrap(): T {
    if (!this._success) {
      throw new Error('Called unwrap on error');
    }
    return this._value!;
  }

  unwrapOr(defaultValue: T): T {
    return this._success ? this._value! : defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._success) {
      return Result.ok(fn(this._value!));
    }
    return Result.err(this._error!);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._success) {
      return fn(this._value!);
    }
    return Result.err(this._error!);
  }

  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this._success) {
      return Result.ok(this._value!);
    }
    return Result.err(fn(this._error!));
  }

  match<U>(handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }): U {
    if (this._success) {
      return handlers.ok(this._value!);
    }
    return handlers.err(this._error!);
  }
}

// Use it
const result = Result.ok(42)
  .map(x => x * 2)
  .flatMap(x => divide(x, 2))
  .match({
    ok: value => `Success: ${value}`,
    err: error => `Error: ${error}`
  });
```

## Async Results

```typescript
type AsyncResult<T, E> = Promise<Result<T, E>>;

async function fetchUser(id: string): AsyncResult<User, string> {
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

// Use it
const userResult = await fetchUser('123');
if (userResult.isOk()) {
  console.log(userResult.unwrap());
}
```

## Collecting Results

```typescript
function sequence<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isErr()) {
      return result as Result<T[], E>;
    }
    values.push(result.unwrap());
  }
  
  return Result.ok(values);
}

// Use it
const results = [
  Result.ok(1),
  Result.ok(2),
  Result.ok(3)
];

const combined = sequence(results);
// combined: Result<number[], never>
```

## Error Accumulation

```typescript
type Validation<T> = Result<T, string[]>;

function combine<T>(...validations: Validation<T>[]): Validation<T[]> {
  const values: T[] = [];
  const errors: string[] = [];
  
  for (const validation of validations) {
    if (validation.isOk()) {
      values.push(validation.unwrap());
    } else {
      errors.push(...validation.unwrapOr([]));
    }
  }
  
  if (errors.length > 0) {
    return Result.err(errors);
  }
  
  return Result.ok(values);
}
```

## Real-World Example

```typescript
interface User {
  id: string;
  email: string;
  age: number;
}

function validateEmail(email: string): Result<string, string> {
  if (!email.includes('@')) {
    return Result.err('Invalid email format');
  }
  return Result.ok(email);
}

function validateAge(age: number): Result<number, string> {
  if (age < 0 || age > 150) {
    return Result.err('Age must be between 0 and 150');
  }
  return Result.ok(age);
}

function createUser(
  id: string,
  email: string,
  age: number
): Result<User, string> {
  return validateEmail(email)
    .flatMap(validEmail =>
      validateAge(age).map(validAge => ({
        id,
        email: validEmail,
        age: validAge
      }))
    );
}

const userResult = createUser('1', 'user@example.com', 25);
userResult.match({
  ok: user => console.log('Created:', user),
  err: error => console.error('Failed:', error)
});
```

## Option Type

For cases where there's no error, just presence/absence:

```typescript
type Option<T> = 
  | { some: true; value: T }
  | { some: false };

class Option<T> {
  private constructor(
    private readonly _some: boolean,
    private readonly _value?: T
  ) {}

  static some<T>(value: T): Option<T> {
    return new Option(true, value);
  }

  static none<T>(): Option<T> {
    return new Option(false);
  }

  isSome(): this is Option<T> & { _some: true } {
    return this._some;
  }

  isNone(): boolean {
    return !this._some;
  }

  unwrap(): T {
    if (!this._some) {
      throw new Error('Called unwrap on none');
    }
    return this._value!;
  }

  unwrapOr(defaultValue: T): T {
    return this._some ? this._value! : defaultValue;
  }

  map<U>(fn: (value: T) => U): Option<U> {
    if (this._some) {
      return Option.some(fn(this._value!));
    }
    return Option.none();
  }

  flatMap<U>(fn: (value: T) => Option<U>): Option<U> {
    if (this._some) {
      return fn(this._value!);
    }
    return Option.none();
  }
}

// Use it
function findUser(id: string): Option<User> {
  const user = users.find(u => u.id === id);
  return user ? Option.some(user) : Option.none();
}
```

## Benefits Over Exceptions

1. **Explicit**: Errors in type signature
2. **Composable**: Chain with map/flatMap
3. **Safe**: Compiler forces handling
4. **No surprises**: Can't forget to catch

## Trade-offs

**Advantages:**
- Type-safe
- Explicit
- Composable

**Disadvantages:**
- More verbose
- Extra wrapping/unwrapping
- Need library support

## When to Use

✅ **Use Result types for:**
- Expected failures (user not found, validation)
- Parsing/validation
- Domain operations
- When you want compile-time safety

❌ **Use exceptions for:**
- Truly exceptional conditions
- Programming errors
- Third-party code that throws

## Libraries

Popular Result type libraries:

- **neverthrow**: Full-featured Result type
- **ts-results**: Simple Result/Option types
- **fp-ts**: Full functional programming library

```typescript
import { Result, ok, err } from 'neverthrow';

const divide = (a: number, b: number): Result<number, string> => {
  return b === 0
    ? err('Division by zero')
    : ok(a / b);
};
```

## The Mind-Shift

**Before Result types:**
- Exceptions everywhere
- Errors are invisible
- Easy to forget handling

**After Result types:**
- Errors are data
- Explicit in signatures
- Compiler ensures handling

## Summary

**Result Types**:
- Make errors explicit
- Force error handling
- Composable with map/flatMap
- Type-safe alternative to exceptions

**Key insight**: *Treat errors as data, make them visible in types, let the compiler help.*

---

**Next**: [Error Propagation](../03-error-propagation.md)
