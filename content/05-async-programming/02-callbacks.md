# Callbacks

> *"Callbacks: where good intentions meet the pyramid of doom."*

## What Are They?

**Callbacks** are functions passed as arguments to other functions, to be executed later when an asynchronous operation completes.

```typescript
function doSomethingAsync(callback: (result: string) => void): void {
  setTimeout(() => {
    callback('Done!');
  }, 1000);
}

doSomethingAsync((result) => {
  console.log(result); // "Done!" after 1 second
});
```

Callbacks were JavaScript's original async pattern, predating Promises and async/await.

## Why This Was Beautiful (Initially)

Callbacks enabled **non-blocking I/O**:
- Simple concept: "Call this function when done"
- No special syntax needed
- Works with any async operation

For simple cases, callbacks are elegant.

## The Problem: Callback Hell

```typescript
// ❌ Pyramid of doom
getUserData(userId, (user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      getShippingInfo(details.shippingId, (shipping) => {
        updateTrackingInfo(shipping.trackingNumber, (updated) => {
          console.log('Finally done!', updated);
        });
      });
    });
  });
});
```

**Problems**:
1. **Deeply nested**: Hard to read
2. **Error handling scattered**: No unified way to catch errors
3. **Doesn't compose**: Can't easily combine callbacks
4. **Inversion of control**: You give control to called function

This is why callbacks are now considered an anti-pattern for complex async code.

## Error-First Callbacks

Node.js convention:

```typescript
function readFile(
  path: string,
  callback: (err: Error | null, data: string | null) => void
): void {
  // Simulate async file read
  setTimeout(() => {
    if (Math.random() > 0.5) {
      callback(null, 'file contents');
    } else {
      callback(new Error('File not found'), null);
    }
  }, 100);
}

// Usage
readFile('/path/to/file.txt', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});
```

**Pattern**: First argument is error (null if success), second is result.

### Error Handling Nightmare

```typescript
// ❌ Error handling in callback hell
step1((err1, result1) => {
  if (err1) {
    handleError(err1);
    return;
  }
  
  step2(result1, (err2, result2) => {
    if (err2) {
      handleError(err2);
      return;
    }
    
    step3(result2, (err3, result3) => {
      if (err3) {
        handleError(err3);
        return;
      }
      
      console.log('Success!', result3);
    });
  });
});

// Repeated error checking at every level!
```

## Why Callbacks Don't Compose

Can't easily combine callbacks like you can with Promises:

```typescript
// ❌ Can't do this with callbacks
const result = await callback1()
  .then(callback2)
  .then(callback3);

// Must nest deeply instead
callback1((result1) => {
  callback2(result1, (result2) => {
    callback3(result2, (result3) => {
      // Finally!
    });
  });
});
```

## Control Flow with Callbacks

### Sequential

```typescript
function sequential(callback: () => void): void {
  step1(() => {
    step2(() => {
      step3(() => {
        callback();
      });
    });
  });
}
```

### Parallel

```typescript
function parallel(callback: () => void): void {
  let completed = 0;
  const total = 3;
  
  function onComplete() {
    completed++;
    if (completed === total) {
      callback();
    }
  }
  
  step1(onComplete);
  step2(onComplete);
  step3(onComplete);
}
```

**Hard to read and error-prone!**

## Promises: The Solution

```typescript
// ✅ With Promises: flat, composable
getUserData(userId)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => getShippingInfo(details.shippingId))
  .then(shipping => updateTrackingInfo(shipping.trackingNumber))
  .then(updated => console.log('Done!', updated))
  .catch(err => console.error('Error:', err));

// Unified error handling!
```

## Converting Callbacks to Promises

```typescript
// Callback version
function readFileCallback(
  path: string,
  callback: (err: Error | null, data: string | null) => void
): void {
  // Implementation
}

// Promise version
function readFilePromise(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFileCallback(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data!);
      }
    });
  });
}

// Usage
readFilePromise('/path/to/file.txt')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## Node.js util.promisify

Node.js provides a helper:

```typescript
import { promisify } from 'util';
import fs from 'fs';

// Convert callback-based function to Promise
const readFilePromise = promisify(fs.readFile);

// Use with async/await
const data = await readFilePromise('/path/to/file.txt', 'utf-8');
```

## When Callbacks Are Still OK

Simple, one-time events:

```typescript
// Event listeners
button.addEventListener('click', () => {
  console.log('Clicked!');
});

// Array methods
[1, 2, 3].map(x => x * 2);

// Simple async operations
setTimeout(() => console.log('Hello'), 1000);
```

**Rule**: Callbacks are fine for **simple, non-nested** cases.

## The Mind-Shift

**Before understanding callback problems:**
- "Callbacks are the async pattern"
- "Nesting is how you sequence operations"

**After:**
- "Callbacks don't compose"
- "Promises/async-await are superior for complex async"
- "Callback hell is avoidable"

## Summary

**Callbacks**:
- Original async pattern
- Simple for one-off operations
- Lead to callback hell when nested
- Don't compose well
- Superseded by Promises and async/await

**Key insight**: *Callbacks work for simple cases, but Promises are the better abstraction for complex async workflows.*

---

**Next**: [Promises](../03-promises.md)
