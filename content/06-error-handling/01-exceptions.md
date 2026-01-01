# Exceptions and Try/Catch

> *"Exceptions are for exceptional circumstances."*

## What Are They?

**Exceptions** are a mechanism for handling errors by "throwing" an error object that propagates up the call stack until it's "caught" by a try/catch block. They interrupt normal program flow.

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
  console.error('Error:', error.message);
}
```

## Why This Pattern Exists

Exceptions solve the problem of error handling without cluttering every function call with error checks:

```typescript
// Without exceptions: error checks everywhere
const file = openFile('data.txt');
if (file.error) {
  handleError(file.error);
  return;
}

const content = readFile(file);
if (content.error) {
  closeFile(file);
  handleError(content.error);
  return;
}

// With exceptions: clean happy path
try {
  const file = openFile('data.txt');
  const content = readFile(file);
  processContent(content);
  closeFile(file);
} catch (error) {
  handleError(error);
}
```

## JavaScript Error Types

### Built-in Errors

```typescript
// Error: Generic error
throw new Error('Something went wrong');

// TypeError: Wrong type
const obj: any = null;
obj.method(); // TypeError: Cannot read properties of null

// ReferenceError: Variable doesn't exist
console.log(undefinedVariable); // ReferenceError

// RangeError: Value out of range
new Array(-1); // RangeError: Invalid array length

// SyntaxError: Invalid syntax
eval('invalid syntax'); // SyntaxError
```

### Custom Error Classes

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

class NotFoundError extends Error {
  constructor(message: string, public resourceId: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Use them
function validateAge(age: number): void {
  if (age < 0 || age > 150) {
    throw new ValidationError(
      'Age must be between 0 and 150',
      'age',
      age
    );
  }
}

try {
  validateAge(200);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed for ${error.field}: ${error.message}`);
  }
}
```

## Try/Catch/Finally

```typescript
try {
  // Code that might throw
  const data = riskyOperation();
  processData(data);
} catch (error) {
  // Handle error
  console.error('Operation failed:', error);
} finally {
  // Always runs, even if error thrown or caught
  cleanup();
}
```

### Finally Executes Always

```typescript
function example() {
  try {
    console.log('Try');
    return 'success';
  } catch (error) {
    console.log('Catch');
    return 'error';
  } finally {
    console.log('Finally'); // Always runs!
  }
}

example();
// Output:
// Try
// Finally
// Returns: "success"
```

## Error Handling Patterns

### Specific Error Types

```typescript
try {
  await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error);
    // Retry logic
  } else if (error instanceof ValidationError) {
    console.error('Invalid data:', error);
    // Show to user
  } else {
    console.error('Unknown error:', error);
    // Log and report
  }
}
```

### Rethrowing

```typescript
function processUser(id: string): User {
  try {
    return fetchUser(id);
  } catch (error) {
    console.error(`Failed to process user ${id}`);
    throw error; // Rethrow to caller
  }
}
```

### Wrapping Errors

```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

try {
  const data = parseJSON(input);
} catch (error) {
  throw new ApplicationError(
    'Failed to parse user data',
    error as Error
  );
}
```

## When to Use Exceptions

### ✅ Use Exceptions For:

1. **Truly exceptional conditions**
```typescript
function accessArray<T>(arr: T[], index: number): T {
  if (index < 0 || index >= arr.length) {
    throw new RangeError('Index out of bounds');
  }
  return arr[index];
}
```

2. **Unrecoverable errors**
```typescript
function initializeDatabase(): Database {
  const db = connectToDatabase();
  if (!db) {
    throw new Error('Cannot start without database');
  }
  return db;
}
```

3. **Contract violations**
```typescript
function withdraw(amount: number): void {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  // Process withdrawal
}
```

### ❌ Don't Use Exceptions For:

1. **Expected conditions**
```typescript
// ❌ Bad: Using exception for expected case
function findUser(id: string): User {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error('User not found'); // Expected!
  }
  return user;
}

// ✅ Good: Return null/undefined for expected case
function findUser(id: string): User | null {
  return users.find(u => u.id === id) ?? null;
}
```

2. **Control flow**
```typescript
// ❌ Bad: Exception for control flow
try {
  for (let i = 0; ; i++) {
    processItem(items[i]);
  }
} catch (error) {
  // Stop when out of bounds
}

// ✅ Good: Normal control flow
for (let i = 0; i < items.length; i++) {
  processItem(items[i]);
}
```

3. **Validation**
```typescript
// ❌ Bad: Throw on invalid input
function setAge(age: number): void {
  if (age < 0) {
    throw new Error('Invalid age');
  }
  this.age = age;
}

// ✅ Good: Return validation result
function setAge(age: number): boolean {
  if (age < 0) {
    return false;
  }
  this.age = age;
  return true;
}
```

## Problems with Exceptions

### 1. Invisible in Type Signatures

```typescript
// What errors can this throw? Unknown!
function processData(data: string): number {
  // Could throw ParseError, ValidationError, etc.
  return parseInt(data);
}
```

### 2. Easy to Forget

```typescript
// ❌ Forgot to catch
const result = mightThrow(); // Uncaught exception crashes app
```

### 3. Breaking Control Flow

```typescript
function complicated() {
  const a = step1();
  const b = step2(a); // Might throw
  const c = step3(b); // Never reached if step2 throws
  return c;
}
```

### 4. Resource Leaks

```typescript
// ❌ Resource leak if error occurs
function processFile(path: string): void {
  const file = openFile(path);
  processContent(file); // Might throw
  closeFile(file); // Never called if error!
}

// ✅ Use finally
function processFile(path: string): void {
  const file = openFile(path);
  try {
    processContent(file);
  } finally {
    closeFile(file); // Always called
  }
}
```

## TypeScript and Checked Exceptions

TypeScript doesn't have checked exceptions (unlike Java):

```typescript
// Can't declare what exceptions are thrown
function readFile(path: string): string {
  // No way to say "throws FileNotFoundError"
}
```

Some alternatives:

### JSDoc Comments

```typescript
/**
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {PermissionError} If no read permission
 */
function readFile(path: string): string {
  // Implementation
}
```

### Result Types (Better)

```typescript
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

function readFile(path: string): Result<string, FileError> {
  // Errors are explicit in return type!
}
```

## Error Boundaries

In frameworks like React:

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Global Error Handlers

```typescript
// Browser
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Node.js
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
```

## Best Practices

1. **Use specific error types**
```typescript
throw new ValidationError('Invalid email', 'email', input);
// Not: throw new Error('Invalid email');
```

2. **Include context**
```typescript
throw new Error(`Failed to process user ${userId} at ${timestamp}`);
```

3. **Preserve stack traces**
```typescript
try {
  operation();
} catch (error) {
  throw new ApplicationError('Operation failed', error);
}
```

4. **Clean up in finally**
```typescript
const resource = acquire();
try {
  useResource(resource);
} finally {
  release(resource);
}
```

5. **Don't catch and ignore**
```typescript
// ❌ Bad
try {
  operation();
} catch (error) {
  // Silent failure!
}

// ✅ Good
try {
  operation();
} catch (error) {
  console.error('Operation failed:', error);
  // Handle or rethrow
}
```

## The Mind-Shift

**Before understanding exceptions:**
- Throw errors for everything
- Catch and ignore
- No error strategy

**After:**
- Exceptions for exceptional cases
- Result types for expected failures
- Clear error handling strategy

## Summary

**Exceptions**:
- Interrupt normal flow
- Propagate up call stack
- Invisible in type signatures
- Best for truly exceptional conditions
- Use Result types for expected failures

**Key insight**: *Exceptions are powerful but should be used sparingly—reserve them for truly exceptional circumstances.*

---

**Next**: [Result Types](../02-result-types.md)
