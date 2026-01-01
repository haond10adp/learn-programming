# Type Theory Basics

> *"A type system is a tractable syntactic method for proving the absence of certain program behaviors by classifying phrases according to the kinds of values they compute."*  
> — Benjamin Pierce, Types and Programming Languages

## 🎯 The Problem

Imagine you're building a payment system. You write:

```typescript
function processPayment(amount: any, userId: any) {
  // What could go wrong?
  return database.charge(amount, userId);
}

// Later...
processPayment("100", 42);        // String amount?
processPayment(100, "not-a-user"); // String user ID?
processPayment(-100, 42);         // Negative amount?
processPayment(100);              // Missing userId?
```

**Everything could go wrong!** The function accepts garbage and hopes for the best.

Now with types:

```typescript
type PositiveNumber = number & { readonly __brand: "positive" };
type UserId = string & { readonly __brand: "userId" };

function processPayment(amount: PositiveNumber, userId: UserId): void {
  database.charge(amount, userId);
}

// Now these are compile errors:
processPayment("100", "user-42");     // ❌ Type error
processPayment(100, "user-42");       // ❌ Type error (not branded)
processPayment(-100, makeUserId("42")); // ❌ Can't create negative PositiveNumber
```

**Invalid calls cannot even be written.** The type system makes bad code impossible.

## 🌟 What is a Type?

### The Mathematical View

A **type** is a set of values plus operations on those values:

```typescript
// Type: number
// Set: {..., -2, -1, 0, 1, 2, ...}
// Operations: +, -, *, /, <, >, etc.

// Type: boolean  
// Set: {true, false}
// Operations: &&, ||, !, etc.

// Type: string
// Set: {"", "a", "ab", ...}
// Operations: +, .length, .charAt(), etc.
```

Types classify values and determine what you can do with them.

### The Practical View

Types are **contracts** that:
1. **Document intent**: What kind of data does this function expect?
2. **Enable tooling**: IDEs can autocomplete because they know types
3. **Catch errors**: The compiler rejects invalid operations
4. **Enable optimization**: Compilers can optimize typed code better

### The Mind-Blowing View: Types Are Proofs!

This is the **Curry-Howard correspondence**:

| Logic | Type System |
|-------|-------------|
| Proposition | Type |
| Proof | Program |
| Proposition is true | Type is inhabited |

When you write:
```typescript
function identity<T>(x: T): T {
  return x;
}
```

You're proving the theorem: **"For all types T, given a T, I can produce a T"**

The existence of this function is a proof that the theorem is true!

## 🎨 Why This is Beautiful

### Beauty 1: Types Prevent Errors Before Runtime

```typescript
// Without types
function divide(a, b) {
  return a / b;
}

divide(10, 0);        // Runtime: Infinity
divide("10", 2);      // Runtime: NaN
divide(10, null);     // Runtime: Infinity
divide();             // Runtime: NaN

// With types
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

divide(10, 0);        // Runtime: Error (but at least it's explicit)
divide("10", 2);      // ❌ Compile error
divide(10, null);     // ❌ Compile error  
divide();             // ❌ Compile error
```

**Three entire classes of errors caught at compile time!**

### Beauty 2: Making Invalid States Unrepresentable

Instead of validating, make bad states impossible:

```typescript
// ❌ Bad: Valid types, but allows invalid states
type User = {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
};

// This is valid but nonsensical:
const badUser: User = {
  id: "123",
  name: "Alice", 
  email: null,
  emailVerified: true  // ❌ How can null be verified?
};

// ✅ Good: Invalid states cannot be represented
type UnverifiedUser = {
  id: string;
  name: string;
  email: null;
};

type VerifiedUser = {
  id: string;
  name: string;
  email: string;  // Not null!
  emailVerifiedAt: Date;
};

type User = UnverifiedUser | VerifiedUser;

// Now this is impossible to construct:
// ❌ Compile error: null email but has emailVerifiedAt
```

**The bad state literally cannot exist in your program!**

### Beauty 3: Types Enable Fearless Refactoring

Change a type definition and the compiler tells you every place that needs updating:

```typescript
// Version 1
type PaymentStatus = "pending" | "completed" | "failed";

function handlePayment(status: PaymentStatus) {
  if (status === "pending") { /* ... */ }
  if (status === "completed") { /* ... */ }
  if (status === "failed") { /* ... */ }
}

// Version 2: Add "refunded"
type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

// Compiler: ❌ Error in handlePayment
// "refunded" case not handled!
```

No need to search the codebase. The compiler finds all affected code.

## 🔬 Structural vs Nominal Typing

TypeScript uses **structural typing** (unlike Java/C# which use nominal typing).

### Structural Typing: "Duck Typing"

> "If it walks like a duck and quacks like a duck, it's a duck."

```typescript
type Point = { x: number; y: number };
type Vector = { x: number; y: number };

const point: Point = { x: 10, y: 20 };
const vector: Vector = point;  // ✅ OK! Same structure

function distance(p: Point): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

distance(vector);  // ✅ OK! Vector has x and y
```

**Types are compared by structure, not name.**

### Why Structural Typing?

```typescript
// Works with any object that has the right shape
type Positioned = { x: number; y: number };

function move(obj: Positioned, dx: number, dy: number) {
  obj.x += dx;
  obj.y += dy;
}

// All these work:
move({ x: 0, y: 0 }, 5, 5);
move({ x: 0, y: 0, z: 0 }, 5, 5);  // Extra properties OK
move({ x: 0, y: 0, name: "point" }, 5, 5);

// Even works with classes
class Sprite {
  constructor(public x: number, public y: number) {}
}
move(new Sprite(0, 0), 5, 5);  // ✅ OK!
```

**Flexible and interoperable!**

### The Downside: Type Equivalence

Sometimes you want types to be distinct even with same structure:

```typescript
type UserId = string;
type OrderId = string;

function getUser(id: UserId) { /* ... */ }

const orderId: OrderId = "order-123";
getUser(orderId);  // ✅ Accepted! But semantically wrong
```

This is where **branded types** come in (covered in Topic 04).

## 🛡️ Type Safety & Soundness

### What is Type Safety?

A program is **type-safe** if it never performs an operation on the wrong kind of value:

```typescript
// Type safe: Operations match types
const n: number = 42;
const s: string = "hello";
const result = n + n;  // ✅ number + number

// Not type safe (in JavaScript without types)
const x = "10";
const y = 20;
const z = x + y;  // "1020" - unexpected!
```

### What is Soundness?

A type system is **sound** if:
> "Well-typed programs cannot go wrong"

More precisely: If a program type-checks, it will never have a type error at runtime.

### TypeScript's Trade-off

TypeScript is **not 100% sound** by design. It allows:

```typescript
// Escape hatch 1: any
const x: any = "hello";
const n: number = x;  // No error, but unsafe!

// Escape hatch 2: Type assertions
const obj = {} as { x: number };
console.log(obj.x.toFixed());  // Runtime error!

// Escape hatch 3: Array covariance
const numbers: number[] = [1, 2, 3];
const values: any[] = numbers;
values.push("not a number");  // ☠️
console.log(numbers[3].toFixed());  // Runtime error!
```

**Why?** Pragmatism. JavaScript interop and gradual typing are more important than perfect soundness.

But you can get close to soundness by:
- Avoid `any` (use `unknown` instead)
- Enable strict mode
- Use branded types
- Leverage exhaustiveness checking

## 💡 The Life-Changing Insight

### Before Understanding Types

You write code and **hope** it's correct:
- Write function
- Add console.logs
- Test manually
- Hope all edge cases are covered
- Cross fingers in production

### After Understanding Types

You **design with types first**:
- Define types that make invalid states impossible
- Write functions that type-check
- Compiler guarantees correctness
- Tests focus on business logic, not basic correctness
- Deploy with confidence

### The Mind Shift

```typescript
// Before: Hope-driven development
function updateUser(userId, updates) {
  // Hope userId is valid
  // Hope updates has right shape
  // Hope nothing breaks
}

// After: Type-driven development
type UserId = string & { readonly __brand: "userId" };

type UserUpdates = {
  name?: string;
  email?: string;
  age?: number;
};

function updateUser(userId: UserId, updates: UserUpdates): Result<User, Error> {
  // Types guarantee inputs are valid
  // Return type guarantees handling errors
  // Compiler verifies everything
}
```

**You shift from reactive debugging to proactive design.**

## 🎯 Key Takeaways

1. **Types are sets** of values with operations
2. **Types are documentation** that the compiler enforces
3. **Types are proofs** (Curry-Howard correspondence)
4. **Make invalid states unrepresentable** instead of validating
5. **Structural typing** compares by shape, not name
6. **Type safety** prevents operations on wrong types
7. **TypeScript trades soundness for pragmatism** (but you can be strict)

## 🌍 Real-World Impact

### Where You've Seen This

- **React**: `Props` types prevent passing wrong data to components
- **Express**: Route type-safety with typed request handlers
- **Databases**: ORMs like Prisma generate types from schema
- **APIs**: GraphQL codegen creates types from schemas
- **State management**: Redux Toolkit uses types for actions/reducers

### In the AI Era

**AI generates code, but you must:**
- Verify types make sense
- Ensure invalid states are unrepresentable
- Check for `any` escapes
- Validate business logic is type-safe

## 🚀 What's Next

- **Topic 02**: Advanced Types — Generics, conditional types, mapped types
- **Topic 03**: Type Inference — How TypeScript reads your mind
- **Topic 04**: Branded Types — Make primitives semantically distinct
- **Topic 05**: Type-Level Programming — Computing with types

---

**Next**: [02. Advanced Types](advanced-types)

## 📚 Further Reading

- [TypeScript Handbook - Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Types and Programming Languages](https://www.cis.upenn.edu/~bcpierce/tapl/) by Benjamin Pierce
- [The Curry-Howard Correspondence](https://en.wikipedia.org/wiki/Curry%E2%80%93Howard_correspondence)
