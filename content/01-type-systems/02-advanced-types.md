# Advanced Types: The Power of Generics and Composition

> *"Generics are to types what functions are to values."*

## 🎯 What Are Advanced Types?

TypeScript's type system goes far beyond basic primitives. **Advanced types** let you:
- Write reusable, type-safe abstractions (generics)
- Transform types programmatically (mapped types)
- Make decisions at the type level (conditional types)
- Build complex types from simple ones (unions, intersections)

## 🌟 Why This Is Beautiful

Generic types are **functions that operate on types**:

```typescript
// A function that operates on values
const identity = (x: number) => x;

// A "function" that operates on types!
type Identity<T> = T;
```

This parallel between runtime and compile-time computation is profound. You can:
- **Abstract patterns**: `Array<T>` works for any type `T`
- **Preserve information**: Functions remain type-safe
- **Compute with types**: Build new types from existing ones

The beauty: **the same abstraction principles apply at both levels**.

## 📚 Topics Covered

### 1. Generics: Type Parameters

Generics let you write code that works with *any* type while preserving type safety.

```typescript
// Without generics: have to duplicate for each type
function getFirstNumber(arr: number[]): number | undefined {
  return arr[0];
}

function getFirstString(arr: string[]): string | undefined {
  return arr[0];
}

// With generics: one function for all types!
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

const firstNum = getFirst([1, 2, 3]); // Type: number | undefined
const firstStr = getFirst(['a', 'b']); // Type: string | undefined
```

**The beautiful insight**: Generics let you abstract over types, not just values. You're programming at a higher level.

### 2. Generic Constraints

Sometimes you need to constrain what types can be used:

```typescript
// Constrain T to types that have a 'length' property
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

logLength('hello'); // ✅ string has length
logLength([1, 2, 3]); // ✅ array has length
logLength({ length: 10 }); // ✅ object with length property
// logLength(123); // ❌ number doesn't have length
```

### 3. Conditional Types

Types can make decisions based on other types:

```typescript
// If T is a string, return string[], otherwise return T
type Wrap<T> = T extends string ? string[] : T;

type A = Wrap<string>; // string[]
type B = Wrap<number>; // number
```

This is **type-level computation**. The type system is Turing-complete!

### 4. Mapped Types

Transform every property of an existing type:

```typescript
type Person = {
  name: string;
  age: number;
};

// Make all properties optional
type PartialPerson = {
  [K in keyof Person]?: Person[K];
};
// Result: { name?: string; age?: number }

// Make all properties readonly
type ReadonlyPerson = {
  readonly [K in keyof Person]: Person[K];
};
```

**The elegance**: You're iterating over type properties just like you'd iterate over array elements!

### 5. Template Literal Types

Build types from string literals:

```typescript
type EventName = 'click' | 'focus' | 'blur';

// Create 'onClick', 'onFocus', 'onBlur'
type EventHandler = `on${Capitalize<EventName>}`;

// Use in object
type Handlers = {
  [K in EventHandler]: () => void;
};
// Result: {
//   onClick: () => void;
//   onFocus: () => void;
//   onBlur: () => void;
// }
```

String manipulation **at the type level**!

### 6. Utility Types Deep Dive

TypeScript provides built-in utility types:

```typescript
// Partial<T>: Make all properties optional
type PartialPerson = Partial<Person>;

// Required<T>: Make all properties required
type RequiredPerson = Required<PartialPerson>;

// Readonly<T>: Make all properties readonly
type ImmutablePerson = Readonly<Person>;

// Pick<T, K>: Select specific properties
type PersonName = Pick<Person, 'name'>;

// Omit<T, K>: Exclude specific properties
type PersonWithoutAge = Omit<Person, 'age'>;

// Record<K, T>: Object type with keys K and values T
type PageInfo = Record<'home' | 'about' | 'contact', { title: string }>;
```

## 🎓 Real-World Example: Type-Safe API Client

```typescript
// Define API endpoints with their return types
interface APIEndpoints {
  '/users': User[];
  '/users/:id': User;
  '/posts': Post[];
  '/posts/:id': Post;
}

// Extract the return type for any endpoint
type APIResponse<T extends keyof APIEndpoints> = APIEndpoints[T];

// Type-safe fetch function
async function fetchAPI<T extends keyof APIEndpoints>(
  endpoint: T
): Promise<APIResponse<T>> {
  const response = await fetch(endpoint);
  return response.json();
}

// Usage: return types are automatically inferred!
const users = await fetchAPI('/users'); // Type: User[]
const user = await fetchAPI('/users/:id'); // Type: User
const posts = await fetchAPI('/posts'); // Type: Post[]
```

The compiler ensures you can't typo an endpoint, and the return type is always correct!

## 💡 Why This Matters in the AI Era

### AI Can Generate
- Basic generic functions
- Simple mapped types
- Standard utility type usage

### You Need to Know
- **When to use generics**: AI might use `any` where generics would preserve types
- **Complex type constraints**: Domain-specific constraints require human understanding
- **Type-level algorithms**: Recursive conditional types are beyond most AI training
- **Performance implications**: Some type operations can slow compilation

### Review Checklist for AI-Generated Generics
- ✅ Are generics used where they should be, or is `any` hiding errors?
- ✅ Are constraints appropriate? (Too strict or too loose?)
- ✅ Are types preserved through function calls?
- ✅ Could simpler types work just as well?

## 🧠 Key Takeaways

1. **Generics abstract over types** like functions abstract over values
2. **Constraints** let you require specific capabilities
3. **Conditional types** enable type-level computation
4. **Mapped types** transform existing types systematically
5. **Template literals** enable string manipulation at type level
6. **Utility types** provide common transformations

The power of advanced types: **make illegal states unrepresentable** and **preserve type information through complex transformations**.

---

**Next**: [Examples](./examples.ts) — See advanced types in action
