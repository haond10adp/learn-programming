# Function Composition

> *"Build complex functions from simple ones."*

## What Is It?

**Function composition** is combining two or more functions to produce a new function. The output of one function becomes the input of the next.

```typescript
// Two simple functions
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;

// Composed function
const addOneThenDouble = (x: number) => double(addOne(x));

addOneThenDouble(5); // (5 + 1) * 2 = 12
```

Mathematical notation: `(f ∘ g)(x) = f(g(x))`

## Why This Is Beautiful

Composition enables:
- **Modularity**: Small, focused functions
- **Reusability**: Combine in different ways
- **Readability**: Express intent clearly
- **Testability**: Test small parts independently

Build complex behavior from simple building blocks.

## Basic Composition

### Manual Composition

```typescript
const addOne = (x: number) => x + 1;
const double = (x: number) => x * 2;
const square = (x: number) => x * x;

// Manual nesting (right to left)
const process1 = (x: number) => square(double(addOne(x)));
process1(5); // (5 + 1) * 2 = 12, 12 ^ 2 = 144

// Intermediate variables (easier to read)
const process2 = (x: number) => {
  const added = addOne(x);
  const doubled = double(added);
  const squared = square(doubled);
  return squared;
};
```

### Compose Function

```typescript
// Compose: right-to-left execution
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a: A) => f(g(a));
}

const addOneThenDouble = compose(double, addOne);
addOneThenDouble(5); // 12

// Three functions
function compose3<A, B, C, D>(
  f: (c: C) => D,
  g: (b: B) => C,
  h: (a: A) => B
): (a: A) => D {
  return (a) => f(g(h(a)));
}

const process = compose3(square, double, addOne);
process(5); // ((5 + 1) * 2) ^ 2 = 144
```

### Pipe Function

```typescript
// Pipe: left-to-right execution (more intuitive)
function pipe<A, B, C>(
  f: (a: A) => B,
  g: (b: B) => C
): (a: A) => C {
  return (a: A) => g(f(a));
}

const addOneThenDouble = pipe(addOne, double);
addOneThenDouble(5); // 12

// Variadic pipe
function pipeN<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

const process = pipeN(
  addOne,   // 5 + 1 = 6
  double,   // 6 * 2 = 12
  square    // 12 * 12 = 144
);

process(5); // 144
```

## Real-World Examples

### Data Transformation Pipeline

```typescript
interface User {
  name: string;
  email: string;
  age: number;
  active: boolean;
}

// Small, focused functions
const filterActive = (users: User[]) =>
  users.filter(u => u.active);

const sortByAge = (users: User[]) =>
  [...users].sort((a, b) => a.age - b.age);

const mapToNames = (users: User[]) =>
  users.map(u => u.name);

const toUpperCase = (names: string[]) =>
  names.map(n => n.toUpperCase());

// Compose them
const getActiveUserNamesUpper = pipe(
  filterActive,
  sortByAge,
  mapToNames,
  toUpperCase
);

const users: User[] = [
  { name: 'Alice', email: 'a@ex.com', age: 30, active: true },
  { name: 'Bob', email: 'b@ex.com', age: 25, active: false },
  { name: 'Charlie', email: 'c@ex.com', age: 35, active: true }
];

getActiveUserNamesUpper(users);
// ['ALICE', 'CHARLIE']
```

### String Processing

```typescript
const trim = (s: string) => s.trim();
const toLowerCase = (s: string) => s.toLowerCase();
const removeSpaces = (s: string) => s.replace(/\s+/g, '');
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Normalize strings
const normalize = pipe(
  trim,
  toLowerCase,
  removeSpaces
);

normalize('  Hello  World  '); // 'helloworld'

// Clean and capitalize
const cleanAndCap = pipe(
  trim,
  toLowerCase,
  capitalize
);

cleanAndCap('  hello world  '); // 'Hello world'
```

### Validation Pipeline

```typescript
type ValidationResult<T> = 
  | { valid: true; value: T }
  | { valid: false; error: string };

// Validators
const notEmpty = (s: string): ValidationResult<string> =>
  s.length > 0
    ? { valid: true, value: s }
    : { valid: false, error: 'Cannot be empty' };

const minLength = (min: number) => (s: string): ValidationResult<string> =>
  s.length >= min
    ? { valid: true, value: s }
    : { valid: false, error: `Must be at least ${min} characters` };

const hasEmail = (s: string): ValidationResult<string> =>
  s.includes('@')
    ? { valid: true, value: s }
    : { valid: false, error: 'Must be valid email' };

// Compose validators
function composeValidators<T>(
  ...validators: Array<(value: T) => ValidationResult<T>>
): (value: T) => ValidationResult<T> {
  return (value: T) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true, value };
  };
}

const validateEmail = composeValidators(
  notEmpty,
  minLength(5),
  hasEmail
);

validateEmail('');              // { valid: false, error: 'Cannot be empty' }
validateEmail('ab');            // { valid: false, error: 'Must be at least 5 characters' }
validateEmail('abcde');         // { valid: false, error: 'Must be valid email' }
validateEmail('a@b.com');       // { valid: true, value: 'a@b.com' }
```

## Point-Free Style

"Point-free" means writing functions without explicitly mentioning arguments:

```typescript
// ❌ Not point-free: mentions 'x'
const addOneThenDouble = (x: number) => double(addOne(x));

// ✅ Point-free: no 'x' mentioned
const addOneThenDouble = compose(double, addOne);

// More examples
const numbers = [1, 2, 3, 4, 5];

// ❌ Not point-free
numbers.map(x => double(x));
numbers.filter(x => isEven(x));

// ✅ Point-free
numbers.map(double);
numbers.filter(isEven);
```

### Benefits and Readability

```typescript
// Data transformation
const users = [
  { name: 'Alice', active: true },
  { name: 'Bob', active: false }
];

// ❌ Verbose
const activeNames = users
  .filter(user => user.active)
  .map(user => user.name);

// ✅ Point-free (with helpers)
const getActive = (users: User[]) => users.filter(u => u.active);
const getNames = (users: User[]) => users.map(u => u.name);

const activeNames = pipe(getActive, getNames)(users);

// Or even better with property accessor
const prop = <K extends string>(key: K) =>
  <T extends Record<K, any>>(obj: T): T[K] => obj[key];

const getName = prop('name');
const isActive = prop('active');

const activeNames = users
  .filter(isActive)
  .map(getName);
```

## Composing Async Functions

```typescript
type AsyncFn<A, B> = (a: A) => Promise<B>;

function composeAsync<A, B, C>(
  f: AsyncFn<B, C>,
  g: AsyncFn<A, B>
): AsyncFn<A, C> {
  return async (a: A) => {
    const b = await g(a);
    return f(b);
  };
}

function pipeAsync<A, B, C>(
  f: AsyncFn<A, B>,
  g: AsyncFn<B, C>
): AsyncFn<A, C> {
  return async (a: A) => {
    const b = await f(a);
    return g(b);
  };
}

// Use it
const fetchUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

const enrichUser = async (user: User): Promise<EnrichedUser> => {
  const posts = await fetchPosts(user.id);
  return { ...user, posts };
};

const sendEmail = async (user: EnrichedUser): Promise<void> => {
  await emailService.send(user.email, 'Welcome!');
};

// Compose them
const processUser = pipeAsync(
  pipeAsync(fetchUser, enrichUser),
  sendEmail
);

await processUser('123');
```

## Composition with Error Handling

```typescript
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };

// Compose functions that can fail
function composeResults<A, B, C, E>(
  f: (b: B) => Result<C, E>,
  g: (a: A) => Result<B, E>
): (a: A) => Result<C, E> {
  return (a: A) => {
    const resultB = g(a);
    if (!resultB.success) {
      return resultB;
    }
    return f(resultB.value);
  };
}

// Use it
const parseNumber = (s: string): Result<number, string> => {
  const n = parseFloat(s);
  return isNaN(n)
    ? { success: false, error: 'Not a number' }
    : { success: true, value: n };
};

const assertPositive = (n: number): Result<number, string> =>
  n > 0
    ? { success: true, value: n }
    : { success: false, error: 'Must be positive' };

const double = (n: number): Result<number, string> =>
  ({ success: true, value: n * 2 });

const process = composeResults(
  composeResults(double, assertPositive),
  parseNumber
);

process('10');   // { success: true, value: 20 }
process('-5');   // { success: false, error: 'Must be positive' }
process('abc');  // { success: false, error: 'Not a number' }
```

## Transducers (Advanced)

Compose transformations efficiently:

```typescript
type Reducer<A, B> = (acc: B, value: A) => B;
type Transducer<A, B> = <C>(reducer: Reducer<B, C>) => Reducer<A, C>;

// Map transducer
const map = <A, B>(fn: (a: A) => B): Transducer<A, B> =>
  (reducer) =>
    (acc, value) =>
      reducer(acc, fn(value));

// Filter transducer
const filter = <A>(predicate: (a: A) => boolean): Transducer<A, A> =>
  (reducer) =>
    (acc, value) =>
      predicate(value) ? reducer(acc, value) : acc;

// Compose transducers
function composeTransducers<A, B, C>(
  t1: Transducer<A, B>,
  t2: Transducer<B, C>
): Transducer<A, C> {
  return (reducer) => t1(t2(reducer));
}

// Use it
const numbers = [1, 2, 3, 4, 5];

const transducer = composeTransducers(
  filter((x: number) => x % 2 === 0),
  map((x: number) => x * 2)
);

const result = numbers.reduce(
  transducer((acc, x) => [...acc, x]),
  [] as number[]
);
// [4, 8] - single pass instead of two!
```

## Debugging Compositions

```typescript
// Add logging to pipeline
const log = <T>(label: string) => (value: T): T => {
  console.log(label, value);
  return value;
};

const process = pipe(
  addOne,
  log('After addOne'),
  double,
  log('After double'),
  square,
  log('After square')
);

process(5);
// After addOne 6
// After double 12
// After square 144
```

## Practical Patterns

### Middleware Pattern

```typescript
type Middleware<T> = (value: T, next: (value: T) => T) => T;

function composeMiddleware<T>(
  ...middlewares: Middleware<T>[]
): (value: T) => T {
  return (value: T) => {
    let index = 0;
    
    const next = (v: T): T => {
      if (index >= middlewares.length) {
        return v;
      }
      const middleware = middlewares[index++];
      return middleware(v, next);
    };
    
    return next(value);
  };
}

// Use it
const logger: Middleware<number> = (value, next) => {
  console.log('Before:', value);
  const result = next(value);
  console.log('After:', result);
  return result;
};

const timer: Middleware<number> = (value, next) => {
  const start = Date.now();
  const result = next(value);
  console.log('Took:', Date.now() - start, 'ms');
  return result;
};

const processor = composeMiddleware(logger, timer);
```

### Lenses (Functional Getters/Setters)

```typescript
interface Lens<S, A> {
  get: (s: S) => A;
  set: (a: A, s: S) => S;
}

const lens = <S, A>(
  get: (s: S) => A,
  set: (a: A, s: S) => S
): Lens<S, A> => ({ get, set });

// Compose lenses
const composeLens = <A, B, C>(
  l1: Lens<A, B>,
  l2: Lens<B, C>
): Lens<A, C> => ({
  get: (a: A) => l2.get(l1.get(a)),
  set: (c: C, a: A) => l1.set(l2.set(c, l1.get(a)), a)
});

// Use it
interface User {
  name: string;
  address: {
    city: string;
  };
}

const addressLens = lens<User, User['address']>(
  user => user.address,
  (address, user) => ({ ...user, address })
);

const cityLens = lens<User['address'], string>(
  address => address.city,
  (city, address) => ({ ...address, city })
);

const userCityLens = composeLens(addressLens, cityLens);

const user: User = {
  name: 'Alice',
  address: { city: 'NYC' }
};

userCityLens.get(user);                   // 'NYC'
userCityLens.set('SF', user);            // New user with city 'SF'
```

## The Mind-Shift

**Before composition:**
- Large, monolithic functions
- Hard to test
- Copy-paste reuse

**After:**
- Small, focused functions
- Easy to test individually
- Combine in different ways

## Summary

**Function Composition**:
- Build complex from simple
- Combine functions like Lego blocks
- Left-to-right (pipe) or right-to-left (compose)

**Patterns**:
- Pipe for readability
- Point-free style
- Async composition
- Transducers for efficiency

**Key insight**: *Software is more maintainable when built from small, composable pieces rather than large, monolithic functions.*

---

**Next**: [Functors](../05-functors.md)
