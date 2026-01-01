# Advanced Functional Patterns

> *"Elegant solutions to complex problems."*

## Pattern: Continuation Passing Style (CPS)

Instead of returning values, pass them to continuations:

```typescript
// Normal style
function add(a: number, b: number): number {
  return a + b;
}

// Continuation passing style
function addCPS<R>(
  a: number,
  b: number,
  cont: (result: number) => R
): R {
  return cont(a + b);
}

// Use it
addCPS(5, 3, result => result * 2); // 16

// Chain operations
addCPS(5, 3, sum =>
  addCPS(sum, 2, total =>
    addCPS(total, 1, final =>
      console.log(final) // 11
    )
  )
);
```

### CPS for Control Flow

```typescript
// Implement if/else with CPS
function ifCPS<R>(
  condition: boolean,
  thenBranch: () => R,
  elseBranch: () => R
): R {
  return condition ? thenBranch() : elseBranch();
}

// Implement loops with CPS
function timesCPS(
  n: number,
  action: (i: number, cont: () => void) => void,
  done: () => void
): void {
  if (n === 0) {
    done();
  } else {
    action(n, () => timesCPS(n - 1, action, done));
  }
}

// Use it
timesCPS(
  3,
  (i, cont) => {
    console.log(i);
    cont();
  },
  () => console.log('Done!')
);
// 3, 2, 1, Done!
```

## Pattern: Free Monads

Separate program description from interpretation:

```typescript
// Define operations
type Program<A> =
  | { type: 'pure'; value: A }
  | { type: 'bind'; program: Program<any>; fn: (value: any) => Program<A> }
  | { type: 'read'; key: string; cont: (value: string) => Program<A> }
  | { type: 'write'; key: string; value: string; cont: () => Program<A> };

// Constructors
const pure = <A>(value: A): Program<A> => ({
  type: 'pure',
  value
});

const read = (key: string): Program<string> => ({
  type: 'read',
  key,
  cont: pure
});

const write = (key: string, value: string): Program<void> => ({
  type: 'write',
  key,
  value,
  cont: () => pure(undefined)
});

const bind = <A, B>(
  program: Program<A>,
  fn: (value: A) => Program<B>
): Program<B> => ({
  type: 'bind',
  program,
  fn
});

// Build program (description, no execution)
const program = bind(
  read('name'),
  name => write('greeting', `Hello, ${name}!`)
);

// Interpreter 1: In-memory
function interpretMemory<A>(
  program: Program<A>,
  store: Map<string, string>
): A {
  switch (program.type) {
    case 'pure':
      return program.value;
      
    case 'read':
      const value = store.get(program.key) ?? '';
      return interpretMemory(program.cont(value), store);
      
    case 'write':
      store.set(program.key, program.value);
      return interpretMemory(program.cont(), store);
      
    case 'bind':
      const result = interpretMemory(program.program, store);
      return interpretMemory(program.fn(result), store);
  }
}

// Interpreter 2: Local storage
function interpretLocalStorage<A>(program: Program<A>): A {
  switch (program.type) {
    case 'pure':
      return program.value;
      
    case 'read':
      const value = localStorage.getItem(program.key) ?? '';
      return interpretLocalStorage(program.cont(value));
      
    case 'write':
      localStorage.setItem(program.key, program.value);
      return interpretLocalStorage(program.cont());
      
    case 'bind':
      const result = interpretLocalStorage(program.program);
      return interpretLocalStorage(program.fn(result));
  }
}
```

## Pattern: Tagless Final

Type-safe DSLs using interfaces:

```typescript
// Define operations interface
interface Expr<F> {
  lit: (value: number) => F;
  add: (a: F, b: F) => F;
  mul: (a: F, b: F) => F;
}

// Interpreter 1: Evaluate
const evalExpr: Expr<number> = {
  lit: (value) => value,
  add: (a, b) => a + b,
  mul: (a, b) => a * b
};

// Interpreter 2: Pretty print
const printExpr: Expr<string> = {
  lit: (value) => value.toString(),
  add: (a, b) => `(${a} + ${b})`,
  mul: (a, b) => `(${a} * ${b})`
};

// Generic program
function program<F>(expr: Expr<F>): F {
  return expr.add(
    expr.mul(expr.lit(2), expr.lit(3)),
    expr.lit(4)
  );
}

program(evalExpr);  // 10
program(printExpr); // '((2 * 3) + 4)'
```

## Pattern: Church Encoding

Represent data as functions:

```typescript
// Boolean as functions
type ChurchBool = <T>(t: T, f: T) => T;

const churchTrue: ChurchBool = (t, f) => t;
const churchFalse: ChurchBool = (t, f) => f;

const churchIf = <T>(
  condition: ChurchBool,
  thenBranch: T,
  elseBranch: T
): T => condition(thenBranch, elseBranch);

churchIf(churchTrue, 'yes', 'no');  // 'yes'
churchIf(churchFalse, 'yes', 'no'); // 'no'

// Natural numbers as functions
type ChurchNum = <T>(f: (x: T) => T, x: T) => T;

const zero: ChurchNum = (f, x) => x;
const one: ChurchNum = (f, x) => f(x);
const two: ChurchNum = (f, x) => f(f(x));
const three: ChurchNum = (f, x) => f(f(f(x)));

const toNumber = (n: ChurchNum): number =>
  n((x: number) => x + 1, 0);

toNumber(three); // 3

const add = (a: ChurchNum, b: ChurchNum): ChurchNum =>
  (f, x) => a(f, b(f, x));

toNumber(add(two, three)); // 5
```

## Pattern: Lenses

Composable getters and setters:

```typescript
interface Lens<S, A> {
  get: (s: S) => A;
  set: (a: A, s: S) => S;
}

// Create lens
const lens = <S, A>(
  get: (s: S) => A,
  set: (a: A, s: S) => S
): Lens<S, A> => ({ get, set });

// Modify through lens
const over = <S, A>(
  lens: Lens<S, A>,
  fn: (a: A) => A,
  s: S
): S => lens.set(fn(lens.get(s)), s);

// Compose lenses
const composeLens = <A, B, C>(
  outer: Lens<A, B>,
  inner: Lens<B, C>
): Lens<A, C> => ({
  get: (a: A) => inner.get(outer.get(a)),
  set: (c: C, a: A) => outer.set(inner.set(c, outer.get(a)), a)
});

// Use it
interface Address {
  street: string;
  city: string;
}

interface Person {
  name: string;
  address: Address;
}

const addressLens = lens<Person, Address>(
  person => person.address,
  (address, person) => ({ ...person, address })
);

const cityLens = lens<Address, string>(
  address => address.city,
  (city, address) => ({ ...address, city })
);

const personCityLens = composeLens(addressLens, cityLens);

const person: Person = {
  name: 'Alice',
  address: { street: '123 Main', city: 'NYC' }
};

personCityLens.get(person); // 'NYC'
personCityLens.set('SF', person);
// { name: 'Alice', address: { street: '123 Main', city: 'SF' } }

over(personCityLens, city => city.toUpperCase(), person);
// { name: 'Alice', address: { street: '123 Main', city: 'NYC' } } - unchanged because already uppercase
```

## Pattern: Optics (Prisms, Traversals)

### Prism (for sum types)

```typescript
interface Prism<S, A> {
  preview: (s: S) => A | null;
  review: (a: A) => S;
}

type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'rectangle'; width: number; height: number };

const circlePrism: Prism<Shape, number> = {
  preview: (shape) =>
    shape.type === 'circle' ? shape.radius : null,
  review: (radius) => ({ type: 'circle', radius })
};

const shape: Shape = { type: 'circle', radius: 5 };
circlePrism.preview(shape); // 5

const rect: Shape = { type: 'rectangle', width: 10, height: 20 };
circlePrism.preview(rect); // null
```

### Traversal (for collections)

```typescript
interface Traversal<S, A> {
  toList: (s: S) => A[];
  set: (fn: (a: A) => A, s: S) => S;
}

const arrayTraversal = <A>(): Traversal<A[], A> => ({
  toList: (arr) => arr,
  set: (fn, arr) => arr.map(fn)
});

const numbers = [1, 2, 3, 4, 5];
arrayTraversal<number>().set(x => x * 2, numbers);
// [2, 4, 6, 8, 10]
```

## Pattern: Catamorphism (Fold)

Generalized fold pattern:

```typescript
// List catamorphism
type List<T> = { type: 'nil' } | { type: 'cons'; head: T; tail: List<T> };

function foldList<T, R>(
  list: List<T>,
  onNil: () => R,
  onCons: (head: T, tailResult: R) => R
): R {
  if (list.type === 'nil') {
    return onNil();
  }
  return onCons(list.head, foldList(list.tail, onNil, onCons));
}

// Use it
const list: List<number> = {
  type: 'cons',
  head: 1,
  tail: {
    type: 'cons',
    head: 2,
    tail: { type: 'nil' }
  }
};

foldList(
  list,
  () => 0,
  (head, tailSum) => head + tailSum
); // 3

// Tree catamorphism
type Tree<T> =
  | { type: 'leaf'; value: T }
  | { type: 'node'; left: Tree<T>; right: Tree<T> };

function foldTree<T, R>(
  tree: Tree<T>,
  onLeaf: (value: T) => R,
  onNode: (left: R, right: R) => R
): R {
  if (tree.type === 'leaf') {
    return onLeaf(tree.value);
  }
  return onNode(
    foldTree(tree.left, onLeaf, onNode),
    foldTree(tree.right, onLeaf, onNode)
  );
}
```

## Pattern: Recursion Schemes

### Anamorphism (Unfold)

```typescript
function unfold<A, B>(
  seed: B,
  fn: (b: B) => [A, B] | null
): A[] {
  const result: A[] = [];
  let current = seed;
  
  while (true) {
    const next = fn(current);
    if (next === null) break;
    
    const [value, nextSeed] = next;
    result.push(value);
    current = nextSeed;
  }
  
  return result;
}

// Generate range
unfold(0, n => n < 5 ? [n, n + 1] : null);
// [0, 1, 2, 3, 4]

// Fibonacci
unfold(
  [0, 1],
  ([a, b]) => a > 100 ? null : [a, [b, a + b]]
);
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
```

### Hylomorphism (Unfold then Fold)

```typescript
function hylo<A, B, C>(
  unfold: (b: B) => [A, B] | null,
  fold: (a: A, acc: C) => C,
  seed: B,
  initial: C
): C {
  const unfolded = unfoldToList(seed, unfold);
  return unfolded.reduce(fold, initial);
}

function unfoldToList<A, B>(
  seed: B,
  fn: (b: B) => [A, B] | null
): A[] {
  const result: A[] = [];
  let current = seed;
  
  while (true) {
    const next = fn(current);
    if (next === null) break;
    const [value, nextSeed] = next;
    result.push(value);
    current = nextSeed;
  }
  
  return result;
}

// Factorial using hylo
hylo(
  (n: number) => n === 0 ? null : [n, n - 1],
  (n: number, acc: number) => n * acc,
  5,
  1
); // 120
```

## Pattern: Fixed Points

```typescript
// Fix point type
type Fix<F> = F extends (x: infer X) => any ? X : never;

// Y combinator (fixed-point combinator)
const Y = <A, R>(f: (self: (a: A) => R) => (a: A) => R): (a: A) => R =>
  (a: A) => f(Y(f))(a);

// Use it for recursion without named function
const factorial = Y<number, number>(self => n =>
  n === 0 ? 1 : n * self(n - 1)
);

factorial(5); // 120

// Fibonacci
const fib = Y<number, number>(self => n =>
  n <= 1 ? n : self(n - 1) + self(n - 2)
);

fib(10); // 55
```

## Pattern: Comonads

Dual of monads - extract instead of wrap:

```typescript
interface Comonad<W> {
  extract: () => W;
  extend: <U>(fn: (w: W) => U) => Comonad<U>;
}

// Zipper comonad (focus on element with context)
class Zipper<T> implements Comonad<T> {
  constructor(
    private readonly left: T[],
    private readonly focus: T,
    private readonly right: T[]
  ) {}
  
  extract(): T {
    return this.focus;
  }
  
  extend<U>(fn: (z: Zipper<T>) => U): Zipper<U> {
    const newLeft = this.left.map((_, i) =>
      fn(this.moveLeft(this.left.length - i))
    );
    
    const newFocus = fn(this);
    
    const newRight = this.right.map((_, i) =>
      fn(this.moveRight(i + 1))
    );
    
    return new Zipper(newLeft, newFocus, newRight);
  }
  
  private moveLeft(steps: number): Zipper<T> {
    if (steps === 0 || this.left.length === 0) return this;
    
    const [newFocus, ...newLeft] = [...this.left].reverse();
    return new Zipper(
      newLeft.reverse(),
      newFocus,
      [this.focus, ...this.right]
    );
  }
  
  private moveRight(steps: number): Zipper<T> {
    if (steps === 0 || this.right.length === 0) return this;
    
    const [newFocus, ...newRight] = this.right;
    return new Zipper(
      [...this.left, this.focus],
      newFocus,
      newRight
    );
  }
}

// Use it - blur/average with neighbors
const numbers = new Zipper([1, 2], 3, [4, 5]);

const averaged = numbers.extend(z => {
  const left = z.extract();
  // Average with neighbors
  return left;
});
```

## Pattern: Arrows

Generalized function composition:

```typescript
interface Arrow<A, B> {
  run: (a: A) => B;
}

const arrow = <A, B>(fn: (a: A) => B): Arrow<A, B> => ({
  run: fn
});

// Compose arrows
const compose = <A, B, C>(
  f: Arrow<B, C>,
  g: Arrow<A, B>
): Arrow<A, C> => ({
  run: (a: A) => f.run(g.run(a))
});

// First (apply to first element of pair)
const first = <A, B, C>(
  f: Arrow<A, B>
): Arrow<[A, C], [B, C]> => ({
  run: ([a, c]) => [f.run(a), c]
});

// Split (apply different functions to pair)
const split = <A, B, C, D>(
  f: Arrow<A, B>,
  g: Arrow<C, D>
): Arrow<[A, C], [B, D]> => ({
  run: ([a, c]) => [f.run(a), g.run(c)]
});
```

## The Mind-Shift

**Before advanced patterns:**
- Reinventing solutions
- Tight coupling
- Limited abstraction

**After:**
- Recognize patterns
- Compose solutions
- Powerful abstractions

## Summary

**Advanced Patterns**:
- CPS: Control flow as data
- Free Monads: Separate description from interpretation
- Tagless Final: Type-safe DSLs
- Church Encoding: Data as functions
- Lenses/Optics: Composable updates
- Recursion Schemes: Generalized recursion
- Fixed Points: Y combinator
- Comonads: Context-dependent computations
- Arrows: Generalized composition

**Key insight**: *These patterns solve complex problems elegantly by leveraging functional programming principles—learn them to recognize when they apply.*

---

**Module Complete!** See the [Functional Programming README](../00-index.md) for more.
