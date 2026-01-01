# Module 6: Error Handling

> *"Errors are not exceptional—they're expected."*

## 🎯 Overview

Error handling is often an afterthought, but it's **fundamental to robust software**. Exceptional behavior is normal; failures happen constantly (network timeouts, invalid input, resource exhaustion). The question isn't *if* errors occur, but *how you handle them*.

This module explores error handling from exceptions to Result types, revealing patterns that make failure explicit, composable, and impossible to ignore.

## 🌟 Why This Module is Beautiful AND Lifechanging

### The Beauty
- **Explicit failure**: Result types make errors visible in type signatures
- **Composability**: Error handling patterns compose like data structures
- **Type safety**: The compiler ensures you handle all cases
- **Railway-oriented programming**: Errors flow through success/failure tracks

### The Life-Changing Insight

Once you understand error handling patterns, code becomes more reliable:

1. **Before**: "I'll just try/catch everything and hope"
2. **After**: "Errors are data—I model them in the type system"

You shift from *defensive programming* (preventing crashes) to *intentional error handling* (making errors explicit and composable).

## 📚 What You'll Learn

1. **Exception-Based Handling** — try/catch and its limitations
2. **Result Types** — Making errors explicit in return types
3. **Error Propagation** — How errors flow through your program
4. **Error Recovery** — Strategies for handling failures
5. **Validation** — Ensuring data meets expectations
6. **Domain Errors** — Modeling business rule failures

## 🗺️ Topics

[01. Exceptions and Try/Catch](exceptions)
- JavaScript error model
- try/catch/finally
- Error types and inheritance
- When exceptions make sense

[02. Result Types](result-types)
- Either/Result pattern
- Making errors explicit
- Type-safe error handling
- Composing Results

[03. Error Propagation](error-propagation)
- Throwing vs returning errors
- Error boundaries
- Error context and stack traces
- Logging and monitoring

[04. Validation Patterns](validation)
- Input validation
- Schema validation
- Accumulating errors
- Parse, don't validate

[05. Domain Errors](domain-errors)
- Business rule failures
- Error taxonomies
- Discriminated union errors
- Recoverable vs unrecoverable

[06. Error Recovery](error-recovery)
- Retry strategies
- Fallback values
- Circuit breakers
- Graceful degradation

[07. Async Error Handling](async-errors)
- Promise rejections
- Async/await error handling
- Unhandled rejection handling
- Timeout errors

[08. Railway-Oriented Programming](railway-programming)
- Success/failure tracks
- Binding and mapping
- Error composition
- Functional error handling

## ⏱️ Time Estimate

- **Reading**: 5 hours
- **Examples**: 4 hours
- **Exercises**: 6 hours
- **Total**: ~15 hours

## 🎓 Prerequisites

- Module 1 (Type Systems) recommended
- Module 5 (Async Programming) for async errors
- Understanding of discriminated unions

## 🚀 Getting Started

1. Read topics in order—each builds on the previous
2. Run examples: `npx tsx 06-error-handling/01-exceptions/examples.ts`
3. Complete exercises to internalize patterns
4. Build the project to see it all integrate

## 💡 Key Takeaways

By the end of this module, you'll understand:

- ✅ Exceptions are not the only way to handle errors
- ✅ Result types make errors explicit and type-safe
- ✅ Different error categories require different strategies
- ✅ Validation should happen at boundaries
- ✅ Errors compose through Railway-Oriented Programming
- ✅ The best code makes errors impossible (design-time prevention)

## 🌍 AI-Era Relevance

### What AI Generates
- Basic try/catch blocks
- Simple error throwing
- Standard error logging
- Common validation patterns

### What You Need to Know
- **Review error handling**: Are all error paths covered?
- **Design error types**: What errors can occur in this domain?
- **Choose patterns**: Should this return Result or throw?
- **Add context**: Are errors actionable and debuggable?
- **Plan recovery**: What should happen when this fails?

AI can generate error handling code, but **YOU design the error architecture**.

## Error Handling Philosophy

### The Four Questions

When designing error handling, ask:

1. **Can this fail?** (Yes, almost everything can)
2. **What failures are expected?** (Network timeout, validation error, etc.)
3. **Who handles the error?** (This function, caller, user?)
4. **Is recovery possible?** (Retry, fallback, fail gracefully)

### Errors as Data vs Exceptions

| Aspect | Exceptions | Result Types |
|--------|-----------|--------------|
| Visibility | Hidden (not in type) | Explicit (in return type) |
| Composability | Difficult (early return) | Natural (map, flatMap) |
| Performance | Expensive (stack unwinding) | Cheap (just data) |
| Control flow | Non-local (jumps) | Local (explicit handling) |
| Forgettable | Yes (easy to ignore) | No (compiler enforces) |

**Modern best practice**: Use Result types for expected errors, exceptions for truly exceptional cases.

## Common Error Patterns

### Pattern 1: Exception-Based (Traditional)
```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

try {
  const result = divide(10, 0);
  console.log(result);
} catch (error) {
  console.error('Error:', error);
}
```

**Pros**: Familiar, separates happy path from error handling  
**Cons**: Not visible in type, easy to forget to catch

### Pattern 2: Result Type (Modern)
```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, error: 'Division by zero' };
  }
  return { ok: true, value: a / b };
}

const result = divide(10, 0);
if (result.ok) {
  console.log('Result:', result.value);
} else {
  console.error('Error:', result.error);
}
```

**Pros**: Explicit, type-safe, composable  
**Cons**: More verbose, requires discipline

### Pattern 3: Option/Maybe (For Absence)
```typescript
type Option<T> = T | null | undefined;

function findUser(id: number): Option<User> {
  // May or may not find user
  return users.find(u => u.id === id);
}

const user = findUser(123);
if (user) {
  console.log(user.name);
} else {
  console.log('User not found');
}
```

**Use when**: Value may be absent, but that's not an error

## The Beauty of Result Types

Result types encode success/failure in the type system:

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Type-safe chaining
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return { ok: true, value: fn(result.value) };
  }
  return result;
}

// Chain transformations
const result = divide(10, 2);
const doubled = map(result, x => x * 2);
const stringified = map(doubled, x => x.toString());
```

This is beautiful because:
- **Type-safe**: Compiler ensures you handle both cases
- **Composable**: map, flatMap create transformation pipelines
- **Explicit**: Error type is part of the signature
- **Local**: No non-local control flow

## Railway-Oriented Programming

Imagine two railway tracks:
- **Success track**: All operations succeed
- **Failure track**: An error occurred

Functions are "switches" that can divert to the failure track:

```typescript
const result = parseInput(data)
  .flatMap(validate)
  .flatMap(process)
  .flatMap(save);

if (result.ok) {
  // Success track
} else {
  // Failure track
}
```

Once on the failure track, you stay there. No error is lost or ignored.

## Validation: Parse, Don't Validate

**Bad (validate):**
```typescript
function process(email: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  // Use email (still just a string)
}
```

**Good (parse):**
```typescript
type Email = string & { readonly brand: unique symbol };

function parseEmail(input: string): Result<Email, string> {
  if (!isValidEmail(input)) {
    return { ok: false, error: 'Invalid email' };
  }
  return { ok: true, value: input as Email };
}

function process(email: Email) {
  // Email is guaranteed valid
}
```

Parsing produces a **typed value** that carries the guarantee of validity.

## The Mind-Shift

**Before understanding error handling:**
- "try/catch is the only way"
- "Errors are annoying edge cases"
- "I'll handle errors later"

**After understanding error handling:**
- "Errors are data—I model them"
- "Result types make errors explicit"
- "Error handling is designed, not bolted on"
- "Good design prevents many errors at compile time"

This is lifechanging because errors stop being sources of bugs and become **first-class concerns in your design**.

## Error Handling Strategies

### 1. Fail Fast
```typescript
function process(data: unknown) {
  if (!isValid(data)) {
    throw new Error('Invalid data');
  }
  // Proceed knowing data is valid
}
```

**When**: At application boundaries, for programmer errors

### 2. Return Result
```typescript
function process(data: unknown): Result<ProcessedData, ValidationError> {
  if (!isValid(data)) {
    return { ok: false, error: new ValidationError('Invalid data') };
  }
  return { ok: true, value: processedData };
}
```

**When**: For expected errors, in business logic

### 3. Option for Absence
```typescript
function findUser(id: number): User | null {
  return database.find(u => u.id === id) ?? null;
}
```

**When**: Value may or may not exist, but that's not an error

### 4. Retry
```typescript
async function fetchWithRetry(url: string, maxAttempts: number) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
    }
  }
}
```

**When**: Transient failures (network errors)

### 5. Fallback
```typescript
function getConfig(): Config {
  try {
    return loadConfig();
  } catch (error) {
    return defaultConfig;
  }
}
```

**When**: Can continue with reasonable default

## 📚 Further Reading

- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) — Excellent F# article (concepts apply)
- [Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
- [Error Handling in Rust](https://doc.rust-lang.org/book/ch09-00-error-handling.html) — Result type origin
- *Functional Programming in Scala* — Error handling patterns

---

**Next**: [01. Exceptions and Try/Catch](01-exceptions.md)
