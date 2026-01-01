# Type Inference & Narrowing

> *"The compiler knows more than you think."*

## What is Type Inference?

TypeScript doesn't just check the types you write—it **deduces** types you never explicitly stated. This is called **type inference**, and it's one of TypeScript's most powerful features.

```typescript
const x = 42; // TypeScript infers: number
const name = 'Alice'; // TypeScript infers: string
const items = [1, 2, 3]; // TypeScript infers: number[]

function add(a: number, b: number) {
  return a + b; // Return type inferred as number
}
```

## Why This Is Beautiful

Type inference represents a perfect balance:
- **Concision**: You don't write unnecessary annotations
- **Safety**: The compiler still verifies everything
- **Intelligence**: The system understands context

It's like having a brilliant assistant who knows what you mean before you finish speaking.

## Control Flow Analysis

TypeScript tracks how types change through your code:

```typescript
function process(input: string | number) {
  // Here, input is: string | number
  
  if (typeof input === 'string') {
    // TypeScript narrows: input is string
    console.log(input.toUpperCase());
  } else {
    // TypeScript narrows: input is number
    console.log(input.toFixed(2));
  }
}
```

The compiler analyzes control flow (if/else, switch, early returns) and **narrows** types accordingly. This is called **type narrowing** or **refinement**.

## Type Guards

Type guards are expressions that perform runtime checks and inform the type system:

### 1. `typeof` Guards

```typescript
function print(value: string | number) {
  if (typeof value === 'string') {
    // value is string here
    console.log(value.toUpperCase());
  } else {
    // value is number here
    console.log(value.toFixed(2));
  }
}
```

### 2. `instanceof` Guards

```typescript
class Dog {
  bark() { console.log('Woof!'); }
}

class Cat {
  meow() { console.log('Meow!'); }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // TypeScript knows it's Dog
  } else {
    animal.meow(); // TypeScript knows it's Cat
  }
}
```

### 3. `in` Guards

```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim(); // TypeScript knows it's Fish
  } else {
    animal.fly(); // TypeScript knows it's Bird
  }
}
```

### 4. Custom Type Predicates

The most powerful guard: defining your own!

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(input: unknown) {
  if (isString(input)) {
    // TypeScript narrows: input is string
    console.log(input.toUpperCase());
  }
}
```

The `value is string` syntax is a **type predicate**. It tells TypeScript: "If this function returns `true`, the parameter is a `string`."

## Discriminated Unions

A pattern so important it deserves its own section. A discriminated union is:
1. A union of object types
2. Each type has a common **discriminant** property
3. The discriminant has a unique literal value per type

```typescript
type Success = {
  status: 'success';
  data: string;
};

type Error = {
  status: 'error';
  message: string;
};

type Result = Success | Error;

function handle(result: Result) {
  if (result.status === 'success') {
    // TypeScript knows it's Success
    console.log(result.data);
  } else {
    // TypeScript knows it's Error
    console.log(result.message);
  }
}
```

The `status` property is the **discriminant**. By checking it, TypeScript narrows the union.

### Why Discriminated Unions Are Lifechanging

They make invalid states unrepresentable:

**Before (bad):**
```typescript
type Response = {
  status: 'success' | 'error';
  data?: string;
  message?: string;
};

// Can represent invalid states:
const bad: Response = { status: 'success', message: 'Error!' };
```

**After (good):**
```typescript
type Response =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };

// Invalid states are impossible!
// const bad: Response = { status: 'success', message: 'Error!' }; // ❌
```

## Exhaustiveness Checking with `never`

The `never` type represents values that never occur. Use it to ensure you handle all cases:

```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'triangle'; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.size ** 2;
    case 'triangle':
      return (shape.base * shape.height) / 2;
    default:
      // If we forgot a case, shape would be that type here
      // But if we handled all cases, shape is `never`
      const _exhaustive: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustive}`);
  }
}
```

If you add a new shape variant but forget to handle it, the `never` assignment will cause a compile error!

## The Power of `as const`

By default, TypeScript infers general types:

```typescript
const config = {
  host: 'localhost', // Type: string
  port: 3000,        // Type: number
};
```

With `as const`, TypeScript infers the most specific (literal) types:

```typescript
const config = {
  host: 'localhost', // Type: 'localhost'
  port: 3000,        // Type: 3000
} as const;
```

This makes the object deeply readonly and uses literal types everywhere. Useful for:
- Configuration objects
- Constant arrays
- Enum-like structures

```typescript
const COLORS = ['red', 'green', 'blue'] as const;
type Color = typeof COLORS[number]; // 'red' | 'green' | 'blue'
```

## Contextual Typing

TypeScript infers types based on context:

```typescript
window.addEventListener('click', (event) => {
  // event is inferred as MouseEvent
  console.log(event.clientX);
});

const numbers = [1, 2, 3];
numbers.map((n) => {
  // n is inferred as number
  return n * 2;
});
```

No annotations needed—TypeScript knows the expected types from the function signatures.

## Inferred Generic Types

When you call a generic function, TypeScript infers the type parameters:

```typescript
function identity<T>(value: T): T {
  return value;
}

const num = identity(42); // T inferred as number
const str = identity('hello'); // T inferred as string
```

You can also specify them explicitly:

```typescript
const num = identity<number>(42);
```

## The Mind-Shift

**Before understanding inference:**
- "I need to annotate everything"
- "The compiler is checking what I wrote"

**After understanding inference:**
- "I only annotate where it adds clarity"
- "The compiler is my co-pilot, deducing truths"
- "Type narrowing makes my code safer automatically"

## Common Patterns

### 1. Early Return Pattern

```typescript
function process(value: string | null) {
  if (!value) {
    return;
  }
  
  // value is narrowed to string
  console.log(value.toUpperCase());
}
```

### 2. Assertion Functions

```typescript
function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function process(value: unknown) {
  assert(typeof value === 'string', 'Expected string');
  
  // TypeScript narrows: value is string
  console.log(value.toUpperCase());
}
```

The `asserts condition` tells TypeScript: "After this function, the condition is true (or we threw)."

### 3. Optional Chaining & Nullish Coalescing

```typescript
type User = {
  name: string;
  address?: {
    city?: string;
  };
};

function getCity(user: User): string {
  // Optional chaining returns string | undefined
  return user.address?.city ?? 'Unknown';
}
```

TypeScript tracks the possibility of `undefined` through the chain.

## When to Add Explicit Annotations

You don't need them everywhere, but they help when:

1. **Function parameters** (clarity for callers)
2. **Public API boundaries** (documentation)
3. **Complex inferred types** (readability)
4. **Disambiguating edge cases** (when inference is wrong)

## Pitfalls to Avoid

### 1. Over-annotation
```typescript
// ❌ Redundant
const x: number = 42;

// ✅ Let it infer
const x = 42;
```

### 2. `any` Breaks Inference
```typescript
function broken(x: any) {
  return x.toUpperCase(); // No error, no inference
}

const result = broken(42); // result is `any`, no error!
```

### 3. Ignoring Narrowing
```typescript
function process(value: string | null) {
  // TypeScript narrowed it!
  if (value !== null) {
    console.log(value.toUpperCase());
  }
  
  // But you forgot and used it anyway
  // console.log(value.toUpperCase()); // ❌ Error!
}
```

## AI-Era Relevance

### What AI Can Do
- Generate basic type guards
- Create discriminated unions
- Write common patterns (typeof, instanceof)

### What You Must Understand
- **Review narrowing**: Does the generated code actually narrow correctly?
- **Design discriminants**: What makes a good discriminant property?
- **Debug inference**: Why is TypeScript inferring the wrong type?
- **Optimize annotations**: Where should annotations be explicit vs inferred?

AI generates code, but YOU design the type architecture.

## Exercises

Try these after reading:
1. Create a type guard for a complex object shape
2. Design a discriminated union for a state machine
3. Use `never` for exhaustiveness checking
4. Leverage `as const` for type-safe configurations

## Further Reading

- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Control Flow Analysis](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#control-flow-analysis)
- [Type Predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)

---

**Next**: [Examples](examples.ts) | [Exercises](exercises.ts)
