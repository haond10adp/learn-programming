# Railway-Oriented Programming

> *"Let success and failure flow on separate tracks."*

## What Is It?

**Railway-Oriented Programming** (ROP) is a functional approach to error handling where operations are composed on two tracks: a success track and a failure track. Once an error occurs, all subsequent operations are skipped.

```typescript
// Traditional approach: if checks everywhere
function processUser(id: string): User | null {
  const user = findUser(id);
  if (!user) return null;
  
  const validated = validateUser(user);
  if (!validated) return null;
  
  const enriched = enrichUser(validated);
  if (!enriched) return null;
  
  return enriched;
}

// Railway approach: linear composition
function processUser(id: string): Result<User, Error> {
  return findUser(id)
    .flatMap(validateUser)
    .flatMap(enrichUser);
}
```

## The Railway Metaphor

Imagine railway tracks:
- **Success track** (top): Operations succeed
- **Failure track** (bottom): Operations fail

Once you switch to the failure track, you stay there.

```
Success Track:  findUser → validate → enrich → [Result]
                    ↓           ↓         ↓
Failure Track:  [Error] ────────────────────→ [Error]
```

## Two-Track Functions

### Track Types

```typescript
// One-track function: regular function
type OneTrack<A, B> = (input: A) => B;

// Two-track function: can succeed or fail
type TwoTrack<A, B, E> = (input: A) => Result<B, E>;

// Examples
const add10: OneTrack<number, number> = (x) => x + 10;
const divide: TwoTrack<number, number, string> = (x) => 
  x === 0 ? err('Division by zero') : ok(100 / x);
```

### Adapting Functions

```typescript
// Lift one-track to two-track
function lift<A, B, E>(
  fn: (input: A) => B
): (input: Result<A, E>) => Result<B, E> {
  return (result) => result.map(fn);
}

// Use it
const add10: (x: number) => number = (x) => x + 10;
const liftedAdd10 = lift(add10);

const result = ok(5);
const newResult = liftedAdd10(result); // ok(15)
```

## Basic Railway Operations

### Map (Success Track)

```typescript
// Transform success value, pass through errors
ok(10)
  .map(x => x * 2)      // ok(20)
  .map(x => x + 5)      // ok(25)
  .map(x => `Result: ${x}`) // ok("Result: 25")

err('Failed')
  .map(x => x * 2)      // err('Failed') - skipped!
  .map(x => x + 5)      // err('Failed') - skipped!
```

### FlatMap (Switch Tracks)

```typescript
// Chain operations that can fail
function divide(a: number, b: number): Result<number, string> {
  return b === 0 ? err('Division by zero') : ok(a / b);
}

ok(100)
  .flatMap(x => divide(x, 2))   // ok(50)
  .flatMap(x => divide(x, 5))   // ok(10)
  .flatMap(x => divide(x, 0))   // err('Division by zero')
  .flatMap(x => divide(x, 2))   // skipped!
```

### MapError (Failure Track)

```typescript
// Transform error, pass through success
err('DB_ERROR')
  .mapError(e => `Database failed: ${e}`)
  // err('Database failed: DB_ERROR')

ok(42)
  .mapError(e => `Database failed: ${e}`)
  // ok(42) - unchanged
```

## Complete Railway API

```typescript
class Result<T, E> {
  // Create results
  static ok<T>(value: T): Result<T, never> { }
  static err<E>(error: E): Result<never, E> { }
  
  // Check track
  isOk(): boolean { }
  isErr(): boolean { }
  
  // Success track operations
  map<U>(fn: (value: T) => U): Result<U, E> { }
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> { }
  
  // Failure track operations
  mapError<F>(fn: (error: E) => F): Result<T, F> { }
  orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> { }
  
  // Combine tracks
  match<U>(handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  }): U { }
  
  // Extract values
  unwrap(): T { }
  unwrapOr(defaultValue: T): T { }
  unwrapErr(): E { }
}
```

## Real-World Example

```typescript
interface User {
  id: string;
  email: string;
  age: number;
}

type ValidationError = 
  | { type: 'InvalidEmail'; email: string }
  | { type: 'InvalidAge'; age: number }
  | { type: 'UserNotFound'; id: string };

// Railway functions
function findUser(id: string): Result<User, ValidationError> {
  const user = database.findById(id);
  if (!user) {
    return err({ type: 'UserNotFound', id });
  }
  return ok(user);
}

function validateEmail(user: User): Result<User, ValidationError> {
  if (!user.email.includes('@')) {
    return err({ type: 'InvalidEmail', email: user.email });
  }
  return ok(user);
}

function validateAge(user: User): Result<User, ValidationError> {
  if (user.age < 0 || user.age > 150) {
    return err({ type: 'InvalidAge', age: user.age });
  }
  return ok(user);
}

function enrichUser(user: User): Result<EnrichedUser, ValidationError> {
  return ok({
    ...user,
    memberSince: calculateMemberSince(user),
    tier: calculateTier(user)
  });
}

// Compose the railway
function processUser(id: string): Result<EnrichedUser, ValidationError> {
  return findUser(id)
    .flatMap(validateEmail)
    .flatMap(validateAge)
    .flatMap(enrichUser);
}

// Handle result
const result = processUser('123');
result.match({
  ok: user => console.log('Success:', user),
  err: error => {
    switch (error.type) {
      case 'UserNotFound':
        console.error(`User ${error.id} not found`);
        break;
      case 'InvalidEmail':
        console.error(`Invalid email: ${error.email}`);
        break;
      case 'InvalidAge':
        console.error(`Invalid age: ${error.age}`);
        break;
    }
  }
});
```

## Parallel Railway

```typescript
// Run multiple operations, collect results
function parallel<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isErr()) {
      return result as Result<T[], E>;
    }
    values.push(result.unwrap());
  }
  
  return ok(values);
}

// Use it
const results = parallel([
  validateEmail(user),
  validateAge(user),
  validateName(user)
]);

if (results.isOk()) {
  console.log('All validations passed');
}
```

## Error Accumulation Railway

```typescript
// Collect all errors instead of failing fast
function collect<T, E>(
  results: Result<T, E>[]
): Result<T[], E[]> {
  const values: T[] = [];
  const errors: E[] = [];
  
  for (const result of results) {
    if (result.isOk()) {
      values.push(result.unwrap());
    } else {
      errors.push(result.unwrapErr());
    }
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok(values);
}

// Use it
const validations = collect([
  validateEmail(user),
  validateAge(user),
  validateName(user)
]);

validations.match({
  ok: () => console.log('All valid'),
  err: errors => {
    console.log('Validation failed:');
    errors.forEach(e => console.error(e));
  }
});
```

## Async Railway

```typescript
type AsyncResult<T, E> = Promise<Result<T, E>>;

class AsyncResult<T, E> {
  constructor(private promise: Promise<Result<T, E>>) {}
  
  static from<T, E>(promise: Promise<Result<T, E>>): AsyncResult<T, E> {
    return new AsyncResult(promise);
  }
  
  async map<U>(fn: (value: T) => U): Promise<AsyncResult<U, E>> {
    const result = await this.promise;
    return AsyncResult.from(Promise.resolve(result.map(fn)));
  }
  
  async flatMap<U>(
    fn: (value: T) => AsyncResult<U, E>
  ): Promise<AsyncResult<U, E>> {
    const result = await this.promise;
    if (result.isErr()) {
      return AsyncResult.from(Promise.resolve(result as Result<U, E>));
    }
    return fn(result.unwrap());
  }
  
  async unwrap(): Promise<Result<T, E>> {
    return this.promise;
  }
}

// Use it
async function processUserAsync(id: string): Promise<Result<User, Error>> {
  return AsyncResult
    .from(fetchUser(id))
    .flatMap(user => validateUser(user))
    .flatMap(user => enrichUser(user))
    .then(r => r.unwrap());
}
```

## Tap (Side Effects)

```typescript
// Perform side effect without changing result
Result.prototype.tap = function<T, E>(
  this: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> {
  if (this.isOk()) {
    fn(this.unwrap());
  }
  return this;
};

// Use it
processUser('123')
  .tap(user => console.log('Processing:', user.email))
  .flatMap(enrichUser)
  .tap(user => logMetric('user_enriched'))
  .match({
    ok: user => saveUser(user),
    err: error => logError(error)
  });
```

## BiMap (Transform Both Tracks)

```typescript
// Transform success AND error
Result.prototype.bimap = function<T, E, U, F>(
  this: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => F
): Result<U, F> {
  if (this.isOk()) {
    return ok(onSuccess(this.unwrap()));
  }
  return err(onError(this.unwrapErr()));
};

// Use it
findUser('123')
  .bimap(
    user => user.email,           // Success: extract email
    error => `Failed: ${error}`   // Error: add context
  );
```

## Pattern: Dead-End Function

```typescript
// Function that can only fail
function assertPositive(n: number): Result<number, string> {
  return n > 0 ? ok(n) : err('Must be positive');
}

// Chain it
ok(10)
  .flatMap(assertPositive)  // Pass
  .map(x => x * 2);

ok(-5)
  .flatMap(assertPositive)  // Fail here
  .map(x => x * 2);         // Skipped
```

## Pattern: Tee Junction

```typescript
// Split railway, join results
function tee<T, U, V, E>(
  result: Result<T, E>,
  fn1: (value: T) => Result<U, E>,
  fn2: (value: T) => Result<V, E>
): Result<[U, V], E> {
  if (result.isErr()) {
    return result as Result<[U, V], E>;
  }
  
  const value = result.unwrap();
  const result1 = fn1(value);
  const result2 = fn2(value);
  
  if (result1.isErr()) return result1 as Result<[U, V], E>;
  if (result2.isErr()) return result2 as Result<[U, V], E>;
  
  return ok([result1.unwrap(), result2.unwrap()]);
}
```

## Benefits

1. **Explicit error handling**: Errors are values
2. **Composition**: Chain operations linearly
3. **No exceptions**: Pure functions
4. **Type safety**: Compiler tracks errors
5. **Readable**: Linear flow, no nesting

## Trade-offs

**Advantages:**
- Clear error flow
- Composable
- No hidden exceptions

**Disadvantages:**
- More verbose
- Learning curve
- Wrapping/unwrapping overhead

## The Mind-Shift

**Before Railway-Oriented Programming:**
- if/else pyramids
- Try/catch everywhere
- Hard to compose

**After:**
- Linear composition
- Two tracks (success/failure)
- Elegant error handling

## Summary

**Railway-Oriented Programming**:
- Two tracks: success and failure
- Operations compose linearly
- Errors flow on separate track
- Pattern matching at the end

**Key insight**: *Treat errors as data flowing on a separate track. Compose operations without worrying about error checking at each step.*

---

**Module Complete!** See the [Error Handling README](../00-index.md) for more.
