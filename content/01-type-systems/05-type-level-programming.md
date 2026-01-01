# Type-Level Programming

> *"If you can compute it, you can type it."*

## What Is Type-Level Programming?

Most programming happens at the **value level**—you write functions that manipulate values:

```typescript
function double(n: number): number {
  return n * 2;
}
```

But TypeScript's type system is powerful enough to compute at the **type level**:

```typescript
type Double<N extends number> = [N, N];
type Four = Double<2>; // [2, 2]
```

Type-level programming means using types not just to *describe* values, but to *compute* new types.

## Why This Is Beautiful

The type system is essentially a **functional programming language** that runs at compile time:
- Types are first-class values
- Type operators are functions
- Type parameters are function parameters
- Conditional types are if/else
- Recursive types are recursion
- Template literals are string manipulation

You're not just annotating—you're **computing** with types.

## The Mind-Shift

**Before understanding type-level programming:**
- "Types are documentation"
- "The compiler checks my annotations"

**After understanding type-level programming:**
- "Types are a programming language"
- "I can encode complex logic in types"
- "The compiler **proves** my code is correct"
- "I'm not just writing code—I'm writing proofs"

This is lifechanging because you realize: **the type system is Turing-complete**. Anything you can compute, you can type.

## Building Blocks

### 1. Type Parameters (Function Parameters)

```typescript
type Identity<T> = T;

type A = Identity<string>; // string
type B = Identity<number>; // number
```

### 2. Conditional Types (If/Else)

```typescript
type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>; // 'yes'
type B = IsString<number>; // 'no'
```

### 3. `infer` (Pattern Matching)

```typescript
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = GetReturnType<() => string>; // string
type B = GetReturnType<() => number>; // number
```

### 4. Recursive Types (Recursion)

```typescript
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
```

### 5. Mapped Types (Iteration)

```typescript
type ReadonlyAll<T> = {
  readonly [K in keyof T]: T[K];
};
```

### 6. Template Literal Types (String Manipulation)

```typescript
type Greeting<Name extends string> = `Hello, ${Name}!`;

type A = Greeting<'Alice'>; // 'Hello, Alice!'
```

## Type-Level Computation Examples

### Example 1: Type-Level Addition (Tuple Length)

```typescript
type Inc<T extends unknown[]> = [...T, unknown];

type Zero = [];
type One = Inc<Zero>;    // [unknown]
type Two = Inc<One>;     // [unknown, unknown]
type Three = Inc<Two>;   // [unknown, unknown, unknown]

type Length<T extends unknown[]> = T['length'];

type LenThree = Length<Three>; // 3
```

We're computing numbers using tuple lengths!

### Example 2: Type-Level Boolean Logic

```typescript
type Not<T extends boolean> = T extends true ? false : true;
type And<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? true
    : false
  : false;

type Or<A extends boolean, B extends boolean> = A extends true
  ? true
  : B extends true
  ? true
  : false;

type X = Not<true>;           // false
type Y = And<true, false>;    // false
type Z = Or<false, true>;     // true
```

### Example 3: Type-Level String Parsing

```typescript
type Split<S extends string, D extends string> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : [S];

type Parts = Split<'a.b.c', '.'>; // ['a', 'b', 'c']
```

### Example 4: Type-Level List Operations

```typescript
type Head<T extends unknown[]> = T extends [infer First, ...unknown[]] ? First : never;
type Tail<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : never;

type List = [1, 2, 3, 4];
type First = Head<List>;  // 1
type Rest = Tail<List>;   // [2, 3, 4]
```

### Example 5: Type-Level Reverse

```typescript
type Reverse<T extends unknown[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

type Original = [1, 2, 3, 4];
type Reversed = Reverse<Original>; // [4, 3, 2, 1]
```

## Real-World Applications

### 1. Type-Safe Routing

```typescript
type ExtractParams<Path extends string> = Path extends `${infer Start}/:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
  : Path extends `${infer Start}/:${infer Param}`
  ? { [K in Param]: string }
  : {};

type UserPath = ExtractParams<'/users/:id/posts/:postId'>;
// Result: { id: string; postId: string }
```

### 2. Type-Safe SQL Query Builder

```typescript
type SelectColumns<T, Cols extends (keyof T)[]> = {
  [K in Cols[number]]: T[K];
};

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

type PublicUser = SelectColumns<User, ['id', 'name']>;
// Result: { id: number; name: string }
```

### 3. Type-Safe State Machine

```typescript
type States = 'idle' | 'loading' | 'success' | 'error';

type Transitions = {
  idle: 'loading';
  loading: 'success' | 'error';
  success: 'idle';
  error: 'idle';
};

type ValidTransition<From extends States, To extends States> = To extends Transitions[From]
  ? true
  : false;

type Valid = ValidTransition<'idle', 'loading'>;     // true
type Invalid = ValidTransition<'idle', 'success'>;   // false
```

### 4. Type-Level Calculator

```typescript
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type AddOne = {
  0: 1; 1: 2; 2: 3; 3: 4; 4: 5;
  5: 6; 6: 7; 7: 8; 8: 9; 9: 10;
};

type Inc<N extends Digit> = AddOne[N];

type One = Inc<0>;    // 1
type Two = Inc<1>;    // 2
type Three = Inc<2>;  // 3
```

## Advanced Patterns

### 1. Fixed-Point Types (Y Combinator for Types!)

```typescript
type Fix<F> = F extends (x: infer X) => infer R ? Fix<(x: X) => R> : F;

// This is getting into advanced type theory...
```

### 2. Higher-Kinded Types (Simulated)

```typescript
type HKT<F, A> = F extends (x: infer X) => infer R ? R : never;

// TypeScript doesn't have true HKTs, but we can simulate them
```

### 3. Dependent Types (Limited)

```typescript
type Vector<N extends number, T> = N extends 0
  ? []
  : [T, ...Vector<N extends 1 ? 0 : any, T>];

// Limited because TS can't do full dependent types
```

## Limits of TypeScript's Type System

While powerful, TypeScript's type system has limits:

1. **Recursion depth**: Limited to ~50 levels
2. **No arbitrary computation**: Can't compute factorial, fibonacci, etc. directly
3. **No true dependent types**: Can't fully depend types on values
4. **Performance**: Complex types slow down compilation
5. **Readability**: Type-level code is harder to understand than value-level code

## When to Use Type-Level Programming

✅ **Use when:**
- Encoding complex invariants (state machines)
- Generic libraries (parsing, routing)
- Type-safe DSLs
- Compile-time validation
- The benefit outweighs the complexity

❌ **Don't use when:**
- Simple types suffice
- Readability is more important than correctness
- Compilation performance matters
- Team isn't comfortable with advanced types

## Practical Tips

1. **Start simple**: Master conditional types before recursion
2. **Test incrementally**: Build complex types step by step
3. **Document heavily**: Type-level code is hard to read
4. **Consider runtime**: Sometimes runtime checks are simpler
5. **Profile compilation**: Watch for slow builds

## The Curry-Howard Correspondence (Again!)

Remember from type theory: **types are proofs**.

When you write:

```typescript
type IsValid<T> = T extends ValidType ? true : false;
```

You're writing a **proof** that `T` is or isn't valid. The type system is a **proof checker**.

Type-level programming is **proof-level programming**. You're not just checking types—you're constructing mathematical proofs about your program.

## Resources for Going Deeper

### TypeScript-Specific
- [Type Challenges](https://github.com/type-challenges/type-challenges) — Practice problems
- [Type-Level TypeScript](https://type-level-typescript.com/) — Comprehensive guide
- [TS Toolbelt](https://github.com/millsp/ts-toolbelt) — Utility type library

### Type Theory
- *Types and Programming Languages* by Benjamin Pierce — The classic textbook
- [Lambda Calculus](https://en.wikipedia.org/wiki/Lambda_calculus) — Foundation of type systems
- [Curry-Howard Correspondence](https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence) — Types as proofs

## Exercises

Try these after reading:
1. Implement type-level Fibonacci (using tuple lengths)
2. Create a type-safe router with parameter extraction
3. Build a type-level parser for a simple language
4. Implement type-level list operations (map, filter, reduce)

## The Ultimate Mind-Shift

Once you understand type-level programming, you see the type system differently:

- **It's not a constraint**—it's a **programming language**
- **It's not checking code**—it's **proving theorems**
- **It's not documentation**—it's **executable mathematics**

This is the final form of type understanding. You're no longer a programmer who uses types—you're a programmer who **computes with types**.

## AI-Era Relevance

### What AI Generates
- Basic type-level utilities
- Common patterns (Omit, Pick, Partial)
- Simple conditional types

### What You Must Design
- **Complex type logic**: Multi-step type transformations
- **Domain-specific types**: Your business rules in types
- **Type architectures**: How types compose across your system
- **Debug type errors**: Understanding cryptic error messages

AI can generate code, but **type-level design requires deep understanding**.

## Closing Thought

Type-level programming is where programming becomes mathematics. You're not writing instructions for a computer—you're writing proofs about what your program can and cannot do.

This is beautiful because it's **pure**—no side effects, no runtime, no ambiguity. Just logic.

This is lifechanging because it shows you: **programming is thinking**.

---

**Next**: [Examples](examples.ts) | [Exercises](exercises.ts) | [Project](../project/requirements.md)
