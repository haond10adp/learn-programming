# Async/Await

> *"Syntactic sugar that makes async code look synchronous."*

## What Is It?

**Async/await** is syntactic sugar built on top of Promises that makes asynchronous code look and behave like synchronous code. It eliminates callback hell and Promise chains in favor of linear, readable code.

```typescript
// Promise chain
fetchUser(1)
  .then(user => fetchOrders(user.id))
  .then(orders => fetchDetails(orders[0].id))
  .then(details => console.log(details))
  .catch(error => console.error(error));

// ✅ Async/await
async function loadUserDetails() {
  try {
    const user = await fetchUser(1);
    const orders = await fetchOrders(user.id);
    const details = await fetchDetails(orders[0].id);
    console.log(details);
  } catch (error) {
    console.error(error);
  }
}
```

## Why This Is Beautiful

Async/await creates **synchronous-looking async code**:
- Linear flow, no chaining
- try/catch for error handling
- Natural control flow (if, for, while)
- Debugging is easier

This is the most natural way to write async code.

## The async Keyword

Marks a function as asynchronous:

```typescript
async function fetchData(): Promise<string> {
  return 'data';
}

// Equivalent to:
function fetchData(): Promise<string> {
  return Promise.resolve('data');
}
```

**Key**: `async` functions **always return a Promise**, even if you return a plain value.

```typescript
async function getValue(): Promise<number> {
  return 42; // Automatically wrapped in Promise
}

getValue().then(value => console.log(value)); // 42
```

## The await Keyword

Pauses execution until Promise resolves:

```typescript
async function example() {
  console.log('Before');
  
  const result = await fetchData(); // Waits here
  
  console.log('After:', result);
}
```

**Key**: `await` can only be used inside `async` functions (or top-level in modules).

### What await Does

```typescript
// This:
const result = await promise;

// Is equivalent to:
promise.then(result => {
  // Continue here
});
```

But with cleaner syntax!

## Error Handling

Use try/catch:

```typescript
async function fetchUserData(id: number): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      throw new Error('User not found');
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error; // Re-throw or handle
  }
}
```

### Multiple Try-Catch Blocks

```typescript
async function processUser(id: number) {
  let user;
  
  try {
    user = await fetchUser(id);
  } catch (error) {
    console.error('Fetch failed:', error);
    return;
  }
  
  try {
    await saveUser(user);
  } catch (error) {
    console.error('Save failed:', error);
    // Continue or return
  }
}
```

### Catching Specific Errors

```typescript
async function fetchData() {
  try {
    const data = await fetch('/api/data');
    return await data.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error');
    } else if (error instanceof ValidationError) {
      console.error('Validation error');
    } else {
      console.error('Unknown error');
    }
    throw error;
  }
}
```

## Sequential vs Parallel

### Sequential (Slow)

```typescript
async function sequential() {
  const user = await fetchUser(1);      // Wait 1s
  const orders = await fetchOrders(2);  // Wait 1s
  const products = await fetchProducts(3); // Wait 1s
  
  // Total: 3 seconds
}
```

Each await waits for previous to complete.

### Parallel (Fast)

```typescript
async function parallel() {
  const [user, orders, products] = await Promise.all([
    fetchUser(1),
    fetchOrders(2),
    fetchProducts(3)
  ]);
  
  // Total: ~1 second (all execute simultaneously)
}
```

**Rule**: Use `Promise.all()` when operations are independent!

### Parallel with Error Handling

```typescript
async function parallelSafe() {
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchOrders(2),
    fetchProducts(3)
  ]);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`Result ${index}:`, result.value);
    } else {
      console.error(`Error ${index}:`, result.reason);
    }
  });
}
```

## Control Flow

Async/await works with normal control structures!

### If Statements

```typescript
async function checkUser(id: number) {
  const user = await fetchUser(id);
  
  if (user.isPremium) {
    const premiumData = await fetchPremiumData(user.id);
    return premiumData;
  } else {
    return user;
  }
}
```

### Loops

```typescript
async function processUsers(ids: number[]) {
  for (const id of ids) {
    const user = await fetchUser(id); // Sequential
    await saveUser(user);
  }
}

// Parallel version
async function processUsersParallel(ids: number[]) {
  await Promise.all(
    ids.map(id => fetchUser(id).then(user => saveUser(user)))
  );
}
```

### While Loops

```typescript
async function retryUntilSuccess() {
  let attempts = 0;
  
  while (attempts < 3) {
    try {
      const result = await fetchData();
      return result; // Success!
    } catch (error) {
      attempts++;
      await delay(1000); // Wait before retry
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Real-World Example: Data Pipeline

```typescript
interface User {
  id: number;
  name: string;
}

interface Order {
  id: number;
  userId: number;
  total: number;
}

interface Report {
  user: User;
  orders: Order[];
  total: number;
}

async function generateUserReport(userId: number): Promise<Report> {
  try {
    // Fetch user and orders in parallel
    const [user, orders] = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId)
    ]);
    
    // Calculate total
    const total = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Save report
    const report: Report = { user, orders, total };
    await saveReport(report);
    
    return report;
  } catch (error) {
    console.error('Report generation failed:', error);
    throw error;
  }
}

// Use it
const report = await generateUserReport(1);
console.log(report);
```

## Top-Level Await

In ES2022+, you can use await at the top level of modules:

```typescript
// Top-level await (in module)
const data = await fetchData();
const config = await loadConfig();

console.log(data, config);

// No need to wrap in async function!
```

**Caution**: Blocks module execution until resolved.

## Async Immediately Invoked Function Expression (IIFE)

Before top-level await:

```typescript
(async () => {
  const data = await fetchData();
  console.log(data);
})();
```

## Return vs Await Return

### Just Return

```typescript
async function getUser(id: number): Promise<User> {
  return fetchUser(id); // Returns Promise directly
}
```

### Await Then Return

```typescript
async function getUser(id: number): Promise<User> {
  const user = await fetchUser(id); // Waits, unwraps
  return user; // Returns unwrapped value (re-wrapped by async)
}
```

**When to await before returning?**
- Need to use the value
- Want error to be caught by this function's try/catch

### Example

```typescript
// ❌ Error not caught here
async function getUser(id: number): Promise<User> {
  try {
    return fetchUser(id); // Error propagates to caller
  } catch (error) {
    console.error('Never reaches here!');
    throw error;
  }
}

// ✅ Error caught here
async function getUser(id: number): Promise<User> {
  try {
    return await fetchUser(id); // Await to catch error
  } catch (error) {
    console.error('Caught!', error);
    throw error;
  }
}
```

## Common Gotchas

### 1. Forgetting await

```typescript
async function example() {
  const data = fetchData(); // ❌ Forgot await!
  console.log(data); // Promise object, not data!
  
  const data2 = await fetchData(); // ✅ Correct
  console.log(data2); // Actual data
}
```

### 2. await in Loops (Sequential)

```typescript
// ❌ Sequential (slow)
for (const id of ids) {
  await processUser(id); // Waits for each
}

// ✅ Parallel (fast)
await Promise.all(ids.map(id => processUser(id)));
```

### 3. Not Catching Errors

```typescript
// ❌ Unhandled rejection
async function example() {
  await fetchData(); // If this fails, error is unhandled
}

// ✅ Handle errors
async function example() {
  try {
    await fetchData();
  } catch (error) {
    console.error(error);
  }
}
```

### 4. Mixing async/await with .then()

```typescript
// ❌ Don't mix styles
async function example() {
  await fetchUser(1)
    .then(user => console.log(user)); // Confusing!
}

// ✅ Pick one style
async function example() {
  const user = await fetchUser(1);
  console.log(user);
}
```

## Async with Array Methods

```typescript
// ❌ map with async doesn't work as expected
async function processAll(ids: number[]) {
  const results = ids.map(async (id) => {
    return await fetchUser(id);
  });
  
  console.log(results); // Array of Promises, not users!
}

// ✅ Use Promise.all
async function processAll(ids: number[]) {
  const results = await Promise.all(
    ids.map(async (id) => await fetchUser(id))
  );
  
  console.log(results); // Array of users!
}
```

### forEach Doesn't Work

```typescript
// ❌ forEach doesn't await
async function processAll(ids: number[]) {
  ids.forEach(async (id) => {
    await fetchUser(id); // Doesn't wait!
  });
  
  console.log('Done'); // Prints before fetches complete!
}

// ✅ Use for...of
async function processAll(ids: number[]) {
  for (const id of ids) {
    await fetchUser(id); // Waits for each
  }
  
  console.log('Done'); // Prints after all complete
}

// ✅ Or use Promise.all for parallel
async function processAll(ids: number[]) {
  await Promise.all(ids.map(id => fetchUser(id)));
  console.log('Done');
}
```

## Debugging Async/Await

### Stack Traces

```typescript
async function a() {
  await b();
}

async function b() {
  await c();
}

async function c() {
  throw new Error('Oops!');
}

a().catch(error => console.error(error.stack));

// Stack trace shows full async chain:
// Error: Oops!
//     at c
//     at b
//     at a
```

Much better than Promise chains!

### Breakpoints

Async/await code can be debugged with normal breakpoints—execution pauses at `await`.

## Performance Considerations

### Unnecessary await

```typescript
// ❌ Unnecessary await at end
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data; // Could just: return response.json();
}

// ✅ Skip last await if just returning
async function fetchData(): Promise<Data> {
  const response = await fetch('/api/data');
  return response.json(); // No await needed
}
```

### Parallel When Possible

```typescript
// ❌ Slow: 3 seconds
async function slow() {
  const a = await fetchA(); // 1s
  const b = await fetchB(); // 1s
  const c = await fetchC(); // 1s
  return [a, b, c];
}

// ✅ Fast: 1 second
async function fast() {
  const [a, b, c] = await Promise.all([
    fetchA(),
    fetchB(),
    fetchC()
  ]);
  return [a, b, c];
}
```

## Testing Async Functions

```typescript
describe('fetchUser', () => {
  it('fetches user data', async () => {
    const user = await fetchUser(1);
    expect(user.name).toBe('Alice');
  });
  
  it('handles errors', async () => {
    await expect(fetchUser(999)).rejects.toThrow('Not found');
  });
});
```

Testing is natural with async/await!

## The Mind-Shift

**Before async/await:**
- Promise chains
- Nested .then() calls
- Error handling with .catch()

**After async/await:**
- Linear, synchronous-looking code
- Natural try/catch
- Control flow works as expected

This is lifechanging because async code becomes **as readable as synchronous code**.

## Benefits

1. **Readability**: Looks synchronous
2. **Error Handling**: try/catch works
3. **Control Flow**: if, for, while work naturally
4. **Debugging**: Better stack traces
5. **Composability**: Easy to reason about

## AI-Era Relevance

### What AI Does
- Forgets await
- Uses sequential when parallel is better
- Mixes .then() with await

### What You Must Do
- **Verify**: Every async call has await
- **Optimize**: Use Promise.all for parallel
- **Catch**: Add try/catch blocks
- **Guide**: Prompt for async/await over .then()

## Summary

**Async/await**:
- Syntactic sugar over Promises
- Makes async code look synchronous
- Use try/catch for errors
- await pauses until Promise resolves
- Optimize with Promise.all for parallel operations

**Key insight**: *Async/await is the most natural way to write asynchronous JavaScript.*

---

**Next**: [Concurrency Patterns](../05-concurrency-patterns.md)
