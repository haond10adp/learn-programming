# Promises

> *"A promise is a proxy for a value that will eventually be known."*

## What Are They?

A **Promise** is an object representing the eventual completion or failure of an asynchronous operation. It's a container for a future value.

```typescript
const promise = new Promise<string>((resolve, reject) => {
  setTimeout(() => {
    resolve('Success!');
  }, 1000);
});

promise.then(result => console.log(result)); // "Success!" after 1 second
```

Promises solve callback hell by making async operations **composable**.

## Why This Is Beautiful

Promises create **composability**:
- Flat chaining instead of nesting
- Unified error handling
- Built-in state management
- Standardized async pattern

Promises transform async code from spaghetti to linear flow.

## Promise States

A Promise is always in one of three states:

1. **Pending**: Initial state, neither fulfilled nor rejected
2. **Fulfilled**: Operation completed successfully
3. **Rejected**: Operation failed

```
   pending
      ↓
    ┌─┴─┐
fulfilled  rejected
    ↓          ↓
  value      error
```

Once settled (fulfilled or rejected), a Promise **never changes state**.

## Creating Promises

### Basic Constructor

```typescript
const promise = new Promise<number>((resolve, reject) => {
  const success = Math.random() > 0.5;
  
  if (success) {
    resolve(42); // Fulfill with value
  } else {
    reject(new Error('Failed')); // Reject with error
  }
});
```

### Static Methods

```typescript
// Already fulfilled
const resolved = Promise.resolve(42);

// Already rejected
const rejected = Promise.reject(new Error('Oops'));

// From value or thenable
const promise = Promise.resolve(someValue);
```

## then, catch, finally

### then

```typescript
promise
  .then(
    value => console.log('Success:', value),
    error => console.error('Error:', error)
  );

// Or split into separate handlers
promise
  .then(value => console.log('Success:', value))
  .catch(error => console.error('Error:', error));
```

### catch

```typescript
promise
  .then(value => {
    // Handle success
  })
  .catch(error => {
    // Handle any error in chain
  });
```

### finally

```typescript
promise
  .then(value => console.log(value))
  .catch(error => console.error(error))
  .finally(() => {
    // Always runs, regardless of success/failure
    console.log('Cleanup');
  });
```

## Promise Chaining

The killer feature:

```typescript
getUserById(userId)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => console.log(details))
  .catch(error => console.error('Any error in chain:', error));
```

**Each `.then()` returns a new Promise!**

### Returning Values

```typescript
Promise.resolve(5)
  .then(x => x * 2)      // 10
  .then(x => x + 3)      // 13
  .then(x => console.log(x)); // 13
```

### Returning Promises

```typescript
Promise.resolve(5)
  .then(x => {
    // Return a Promise
    return new Promise(resolve => {
      setTimeout(() => resolve(x * 2), 1000);
    });
  })
  .then(x => console.log(x)); // 10 after 1 second

// Promise is automatically unwrapped!
```

## Error Propagation

Errors **bubble up** the chain:

```typescript
Promise.resolve(5)
  .then(x => x * 2)
  .then(x => {
    throw new Error('Oops!'); // Error thrown here
  })
  .then(x => x + 3) // Skipped!
  .then(x => x * 5) // Skipped!
  .catch(error => {
    console.error('Caught:', error); // Catches here
  });
```

### Multiple Catches

```typescript
fetchUser()
  .then(user => processUser(user))
  .catch(error => {
    console.error('Error in user processing:', error);
    return defaultUser; // Recover!
  })
  .then(user => saveUser(user))
  .catch(error => {
    console.error('Error saving user:', error);
  });
```

## Parallel Execution

### Promise.all

Wait for **all** promises:

```typescript
const promises = [
  fetchUser(1),
  fetchUser(2),
  fetchUser(3)
];

Promise.all(promises)
  .then(users => {
    console.log('All users:', users); // Array of results
  })
  .catch(error => {
    console.error('Any failed:', error); // Fails if ANY rejects
  });
```

**Fails fast**: If one rejects, entire Promise.all rejects.

### Promise.allSettled

Wait for all, get all results:

```typescript
Promise.allSettled(promises)
  .then(results => {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        console.log('Success:', result.value);
      } else {
        console.error('Failed:', result.reason);
      }
    });
  });

// Never rejects—always resolves with all results
```

### Promise.race

First to complete wins:

```typescript
Promise.race([
  fetchFromCache(),
  fetchFromNetwork(),
  timeout(5000)
])
  .then(result => console.log('First result:', result))
  .catch(error => console.error('First error:', error));
```

Useful for timeouts!

### Promise.any

First to **succeed** wins:

```typescript
Promise.any([
  fetchFromServer1(),
  fetchFromServer2(),
  fetchFromServer3()
])
  .then(result => console.log('First success:', result))
  .catch(errors => console.error('All failed:', errors));

// Rejects only if ALL reject
```

## Real-World Example: API Calls

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

function fetchUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('User not found');
      }
      return response.json();
    });
}

function fetchOrders(userId: number): Promise<Order[]> {
  return fetch(`/api/users/${userId}/orders`)
    .then(response => response.json());
}

// Chain them
fetchUser(1)
  .then(user => {
    console.log('User:', user);
    return fetchOrders(user.id);
  })
  .then(orders => {
    console.log('Orders:', orders);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

## Promisifying Callbacks

Convert callback-based APIs:

```typescript
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Use it
delay(1000).then(() => console.log('After 1 second'));
```

### Generic Promisify

```typescript
function promisify<T>(
  fn: (callback: (err: Error | null, result: T) => void) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
```

## Error Handling Patterns

### Try-Catch Alternative

```typescript
// Instead of try-catch
async function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .catch(error => {
      console.error('Fetch failed:', error);
      return null; // Return fallback
    });
}
```

### Retrying

```typescript
function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number
): Promise<T> {
  return fn().catch(error => {
    if (maxAttempts <= 1) {
      throw error;
    }
    return retry(fn, maxAttempts - 1);
  });
}

// Use it
retry(() => fetchUser(1), 3)
  .then(user => console.log(user))
  .catch(error => console.error('Failed after 3 attempts:', error));
```

## Promise Anti-Patterns

### 1. Nested Promises (Promise Hell)

```typescript
// ❌ Don't do this!
fetchUser(1)
  .then(user => {
    fetchOrders(user.id)
      .then(orders => {
        fetchDetails(orders[0].id)
          .then(details => {
            console.log(details);
          });
      });
  });

// ✅ Flatten it!
fetchUser(1)
  .then(user => fetchOrders(user.id))
  .then(orders => fetchDetails(orders[0].id))
  .then(details => console.log(details));
```

### 2. Not Returning Promises

```typescript
// ❌ Missing return
fetchUser(1)
  .then(user => {
    fetchOrders(user.id); // Not returned!
  })
  .then(orders => {
    console.log(orders); // undefined!
  });

// ✅ Return the promise
fetchUser(1)
  .then(user => {
    return fetchOrders(user.id); // Return!
  })
  .then(orders => {
    console.log(orders); // Works!
  });
```

### 3. Forgetting .catch()

```typescript
// ❌ Unhandled rejection
fetchUser(1)
  .then(user => console.log(user));
// If fetchUser rejects, error is unhandled!

// ✅ Always catch
fetchUser(1)
  .then(user => console.log(user))
  .catch(error => console.error(error));
```

## Promise Executor Anti-Pattern

```typescript
// ❌ Don't wrap already-async functions
function fetchUserWrapper(id: number): Promise<User> {
  return new Promise((resolve, reject) => {
    fetchUser(id) // Already returns Promise!
      .then(user => resolve(user))
      .catch(error => reject(error));
  });
}

// ✅ Just return the promise
function fetchUserWrapper(id: number): Promise<User> {
  return fetchUser(id);
}
```

## The Mind-Shift

**Before Promises:**
- Callback hell
- Error handling scattered
- Hard to compose async operations

**After Promises:**
- Flat chains
- Unified error handling with .catch()
- Composable async operations
- Can combine with Promise.all, etc.

This is lifechanging because async code becomes **readable and maintainable**.

## Async/Await Preview

Promises enable async/await:

```typescript
// Promise chain
fetchUser(1)
  .then(user => fetchOrders(user.id))
  .then(orders => console.log(orders));

// Async/await (even better!)
const user = await fetchUser(1);
const orders = await fetchOrders(user.id);
console.log(orders);
```

## Benefits

1. **Composable**: Chain operations easily
2. **Error Handling**: Unified .catch()
3. **Readable**: Linear flow
4. **Standardized**: Universal async pattern
5. **Powerful**: Combine with .all, .race, etc.

## AI-Era Relevance

### What AI Does
- Creates callback hell
- Forgets .catch()
- Doesn't return promises in chains

### What You Must Do
- **Flatten**: Convert nested promises to chains
- **Catch**: Always handle errors
- **Return**: Return promises in .then()
- **Guide**: Prompt for Promise-based code

## Summary

**Promises** are:
- Objects representing future values
- Three states: pending, fulfilled, rejected
- Chainable with .then()
- Error-handling with .catch()
- Composable with .all, .race, etc.

**Key insight**: *Promises make async code composable and readable.*

---

**Next**: [Async/Await](../04-async-await.md)
