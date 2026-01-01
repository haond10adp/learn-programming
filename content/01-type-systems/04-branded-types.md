# Branded Types & Phantom Types

> *"A rose by any other name would smell as sweet—but not in TypeScript."*

## The Problem: Primitive Obsession

Consider this code:

```typescript
function transferMoney(from: number, to: number, amount: number) {
  // Transfer money from account `from` to account `to`
}

transferMoney(12345, 67890, 100);
```

This compiles fine, but what if you accidentally swap the arguments?

```typescript
transferMoney(100, 12345, 67890); // ❌ Logic error, but TypeScript doesn't catch it!
```

All three parameters are `number`, so TypeScript can't help. This is **primitive obsession**—using primitive types (string, number) for everything.

## The Solution: Branded Types

A **branded type** is a primitive type with an extra "brand" that makes it distinct:

```typescript
type AccountId = number & { readonly brand: unique symbol };
type Amount = number & { readonly brand: unique symbol };

function transferMoney(from: AccountId, to: AccountId, amount: Amount) {
  // Implementation...
}
```

Now you **can't** pass a regular `number`:

```typescript
// transferMoney(12345, 67890, 100); // ❌ Type error!

// You must explicitly create branded values:
const fromId = 12345 as AccountId;
const toId = 67890 as AccountId;
const amount = 100 as Amount;

transferMoney(fromId, toId, amount); // ✅
transferMoney(amount, fromId, toId); // ❌ Type error!
```

## Why This Is Beautiful

Branded types make **semantic meaning** part of the type system:
- `AccountId` and `Amount` are both numbers at runtime
- But they're **distinct types** at compile time
- Impossible to mix them up accidentally
- The type system enforces domain logic

## How Branded Types Work

The trick is using `& { readonly brand: unique symbol }`:

```typescript
type UserId = number & { readonly brand: unique symbol };
```

This type is:
1. **Structurally** a number (can use it as a number)
2. **Nominally** distinct (TypeScript treats it as different from `number`)
3. **Zero runtime cost** (the brand doesn't exist at runtime)

The `unique symbol` ensures each brand is distinct—no two branded types are compatible.

## Creating Branded Types

### Method 1: Type Assertion

```typescript
type Email = string & { readonly brand: unique symbol };

const email = 'user@example.com' as Email;
```

**Downside**: No validation—you can brand anything.

### Method 2: Factory Function

```typescript
type Email = string & { readonly brand: unique symbol };

function createEmail(value: string): Email {
  if (!value.includes('@')) {
    throw new Error('Invalid email');
  }
  return value as Email;
}

const email = createEmail('user@example.com'); // ✅ Validated
// const bad = createEmail('not-an-email'); // ❌ Throws at runtime
```

**Upside**: Validation enforced at creation time.

### Method 3: Type Guard + Validation

```typescript
type Email = string & { readonly brand: unique symbol };

function isEmail(value: string): value is Email {
  return value.includes('@') && value.includes('.');
}

function process(value: string) {
  if (isEmail(value)) {
    // value is Email here
    sendEmail(value);
  }
}

function sendEmail(email: Email) {
  // Only accepts validated emails
}
```

**Upside**: Integrates with type narrowing.

## Common Use Cases

### 1. IDs

```typescript
type UserId = number & { readonly brand: unique symbol };
type PostId = number & { readonly brand: unique symbol };
type CommentId = number & { readonly brand: unique symbol };

function getUser(id: UserId): User { /* ... */ }
function getPost(id: PostId): Post { /* ... */ }

// Can't mix them up:
// getUser(postId); // ❌ Type error
```

### 2. Units of Measurement

```typescript
type Meters = number & { readonly brand: unique symbol };
type Kilometers = number & { readonly brand: unique symbol };
type Miles = number & { readonly brand: unique symbol };

function addDistances(a: Meters, b: Meters): Meters {
  return (a + b) as Meters;
}

// addDistances(meters, kilometers); // ❌ Type error!
```

### 3. Validated Strings

```typescript
type Email = string & { readonly brand: unique symbol };
type URL = string & { readonly brand: unique symbol };
type PhoneNumber = string & { readonly brand: unique symbol };

function sendEmail(to: Email, from: Email, subject: string) { /* ... */ }

// Can't accidentally pass a URL as email:
// sendEmail(url, email, 'Hello'); // ❌ Type error
```

### 4. Security-Sensitive Data

```typescript
type SanitizedHTML = string & { readonly brand: unique symbol };

function sanitize(html: string): SanitizedHTML {
  // Sanitization logic...
  return html as SanitizedHTML;
}

function render(html: SanitizedHTML) {
  document.body.innerHTML = html; // Safe!
}

// render(userInput); // ❌ Must sanitize first
const safe = sanitize(userInput);
render(safe); // ✅
```

## Phantom Types

A **phantom type** is a type parameter that doesn't appear in the value structure but affects the type:

```typescript
type List<T> = {
  items: unknown[]; // T not used in structure
  readonly phantom?: T; // Phantom field (never exists at runtime)
};

type SortedList<T> = List<T> & { readonly brand: 'sorted' };

function sort<T>(list: List<T>): SortedList<T> {
  // Sort items...
  return list as SortedList<T>;
}

function binarySearch<T>(list: SortedList<T>, target: T): number {
  // Only accepts sorted lists!
  return -1;
}
```

The `T` in `SortedList<T>` is a phantom—it exists only at compile time to track state.

## Real-World Example: State Machine

```typescript
type State = 'idle' | 'loading' | 'success' | 'error';

// Tag the data with its state
type Data<S extends State> = {
  state: S;
  value: unknown;
};

type IdleData = Data<'idle'>;
type LoadingData = Data<'loading'>;
type SuccessData = Data<'success'> & { value: string };
type ErrorData = Data<'error'> & { error: string };

// Type-safe transitions
function load(data: IdleData): LoadingData {
  return { state: 'loading', value: null };
}

function success(data: LoadingData, value: string): SuccessData {
  return { state: 'success', value };
}

// Can't call success on idle data:
// success(idleData, 'hello'); // ❌ Type error
```

## The Mind-Shift

**Before branded types:**
- "Primitives are fine, I'll just be careful"
- "Type errors are about syntax, not semantics"

**After branded types:**
- "I can encode domain rules in types"
- "Invalid usage becomes impossible, not just discouraged"
- "The compiler enforces business logic"

This is lifechanging because you're no longer fighting against mistakes—you're **preventing them at design time**.

## Combining Branded Types with Other Features

### With Generics

```typescript
type Branded<T, Brand> = T & { readonly brand: Brand };

type UserId = Branded<number, 'UserId'>;
type PostId = Branded<number, 'PostId'>;
type Email = Branded<string, 'Email'>;
```

### With Validation

```typescript
type PositiveNumber = number & { readonly brand: unique symbol };

function createPositive(n: number): PositiveNumber {
  if (n <= 0) {
    throw new Error('Must be positive');
  }
  return n as PositiveNumber;
}

function sqrt(n: PositiveNumber): number {
  // No need to check n >= 0, type guarantees it!
  return Math.sqrt(n);
}
```

### With Type Guards

```typescript
type NonEmptyString = string & { readonly brand: unique symbol };

function isNonEmpty(s: string): s is NonEmptyString {
  return s.length > 0;
}

function process(s: string) {
  if (isNonEmpty(s)) {
    // s is NonEmptyString here
    safeUse(s);
  }
}

function safeUse(s: NonEmptyString) {
  // Guaranteed non-empty
}
```

## Limitations

1. **Runtime**: Brands don't exist at runtime—purely compile-time
2. **Validation**: Type assertion bypasses validation (use factory functions!)
3. **Interop**: Third-party libraries won't understand your brands
4. **Ergonomics**: More verbose than plain types

## Best Practices

1. **Use factory functions** for validated construction
2. **Name brands clearly** (UserId, not Id)
3. **Don't over-brand** (not every string needs a brand)
4. **Document the invariants** (what does the brand guarantee?)

## When to Use Branded Types

✅ **Use when:**
- Types have semantic meaning (IDs, emails, URLs)
- Mix-ups would cause bugs (account IDs, amounts)
- Validation is critical (sanitized HTML, positive numbers)
- State transitions matter (state machines)

❌ **Don't use when:**
- Primitives have no special meaning (a name is just a string)
- Overhead isn't worth it (internal helper functions)
- Interop with external libs is difficult

## AI-Era Relevance

### What AI Generates
- Basic branded type definitions
- Simple factory functions
- Common patterns (Email, UserId)

### What You Must Design
- **What to brand**: Which types need semantic distinction?
- **Validation logic**: What makes a value valid?
- **State transitions**: What operations are allowed?
- **Error handling**: What happens when validation fails?

Branded types encode domain knowledge—AI can't design your domain.

## Exercises

Try these after reading:
1. Create branded types for a payment system
2. Build a state machine with phantom types
3. Implement validated branded types with factory functions
4. Design a units-of-measurement system

## Further Reading

- [Branded Types in TypeScript](https://egghead.io/blog/using-branded-types-in-typescript)
- [Phantom Types](https://wiki.haskell.org/Phantom_type)
- [Type-Driven Development](https://blog.logrocket.com/type-driven-development-typescript/)

---

**Next**: [Examples](examples.ts) | [Exercises](exercises.ts)
