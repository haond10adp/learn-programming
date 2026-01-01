# Module 5: Asynchronous Programming

> *"The callback pyramid of doom is not a rite of passage—it's a warning."*

## 🎯 Overview

Asynchronous programming is one of the most challenging aspects of modern software development. JavaScript's single-threaded event loop means **everything that takes time must be async**: network requests, file I/O, timers, and more.

This module explores asynchronous programming from callbacks to Promises to async/await, revealing the patterns that make concurrent code manageable and even elegant.

## 🌟 Why This Module is Beautiful AND Lifechanging

### The Beauty
- **Callbacks to Promises**: The evolution from callback hell to linear code
- **Async/await**: Making asynchronous code read like synchronous code
- **Event Loop**: Understanding the elegant machinery beneath JavaScript
- **Concurrency patterns**: Coordinating multiple operations gracefully

### The Life-Changing Insight

Once you master async patterns, you'll never fear asynchronous code again:

1. **Before**: "Async code is confusing and error-prone"
2. **After**: "Async code follows clear patterns—I know which to use when"

You shift from *avoiding async complexity* to *embracing it*, knowing you have the tools to manage it.

## 📚 What You'll Learn

1. **The Event Loop** — How JavaScript handles concurrency
2. **Callbacks** — The original async pattern (and its problems)
3. **Promises** — Composable async operations
4. **Async/Await** — Syntactic sugar that changes everything
5. **Error Handling** — Managing failures in async code
6. **Concurrency Patterns** — Race, parallel, sequential, retry

## 🗺️ Topics

[01. The Event Loop](event-loop)
- Call stack, task queue, microtask queue
- How setTimeout actually works
- Blocking vs non-blocking code
- Visualizing async execution

[02. Callbacks](callbacks)
- Callback pattern basics
- Callback hell and pyramid of doom
- Error-first callbacks
- Why callbacks don't compose

[03. Promises](promises)
- Promise states (pending, fulfilled, rejected)
- then, catch, finally
- Promise chaining
- Error propagation

[04. Async/Await](async-await)
- Syntactic sugar over Promises
- Error handling with try/catch
- Top-level await
- Async function gotchas

[05. Concurrency Patterns](concurrency-patterns)
- Promise.all (parallel)
- Promise.race (first to complete)
- Promise.allSettled (all results)
- Promise.any (first success)
- Sequential execution
- Retry logic

[06. Cancellation](cancellation)
- AbortController and AbortSignal
- Canceling fetch requests
- Timeout patterns
- Cleaning up async operations

[07. Async Iteration](async-iteration)
- Async generators
- for await...of loops
- Async iterables
- Streaming data

[08. Advanced Patterns](advanced-patterns)
- Debounce and throttle
- Rate limiting
- Queue management
- Circuit breaker pattern

## ⏱️ Time Estimate

- **Reading**: 5 hours
- **Examples**: 4 hours
- **Exercises**: 6 hours
- **Total**: ~15 hours

## 🎓 Prerequisites

- Module 1 (Type Systems) recommended
- Basic Promise knowledge helpful
- Understanding of JavaScript execution model

## 🚀 Getting Started

1. Read topics in order—each builds on the previous
2. Run examples: `npx tsx 05-async-programming/01-event-loop/examples.ts`
3. Use debugging tools to visualize async execution
4. Complete exercises to master each pattern

## 💡 Key Takeaways

By the end of this module, you'll understand:

- ✅ The event loop is the foundation of JavaScript async
- ✅ Promises compose better than callbacks
- ✅ Async/await makes async code readable
- ✅ Error handling in async code requires care
- ✅ Different concurrency patterns suit different problems
- ✅ Cancellation is critical for robust async code

## 🌍 AI-Era Relevance

### What AI Generates
- Basic async/await functions
- Simple Promise chains
- Standard error handling (try/catch)
- Common patterns (fetch, setTimeout)

### What You Need to Know
- **Review concurrency**: Does the AI use Promise.all or sequential await?
- **Check error handling**: Are all paths handled correctly?
- **Identify race conditions**: Can operations interfere?
- **Design cancellation**: Should this operation be cancellable?
- **Optimize performance**: Is unnecessary serialization happening?

AI can generate async code, but **YOU design the concurrency model**.

## Common Async Pitfalls

### 1. Forgetting await
```typescript
// ❌ Returns Promise<User>, not User!
async function getUser() {
  return fetchUser();
}

// ✅ Awaits the promise
async function getUser() {
  return await fetchUser();
}
```

### 2. Unnecessary Sequential Awaits
```typescript
// ❌ Slow: waits for each serially
const user = await fetchUser();
const posts = await fetchPosts();

// ✅ Fast: fetches in parallel
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts(),
]);
```

### 3. Not Handling Errors
```typescript
// ❌ Unhandled rejection!
async function process() {
  const data = await fetch('/api/data');
  return data.json();
}

// ✅ Proper error handling
async function process() {
  try {
    const data = await fetch('/api/data');
    return data.json();
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error; // or handle it
  }
}
```

### 4. Promise Constructor Anti-pattern
```typescript
// ❌ Unnecessary Promise wrapper
async function getData() {
  return new Promise((resolve) => {
    resolve(fetchData());
  });
}

// ✅ Just return the Promise
async function getData() {
  return fetchData();
}
```

### 5. Not Using AbortController
```typescript
// ❌ No way to cancel
async function search(query: string) {
  const response = await fetch(`/api/search?q=${query}`);
  return response.json();
}

// ✅ Cancellable
async function search(query: string, signal: AbortSignal) {
  const response = await fetch(`/api/search?q=${query}`, { signal });
  return response.json();
}
```

## The Evolution of Async JavaScript

### Era 1: Callbacks (2009-2015)
```typescript
function loadUser(id, callback) {
  xhr('/users/' + id, (error, user) => {
    if (error) {
      callback(error);
    } else {
      loadPosts(user.id, (error, posts) => {
        if (error) {
          callback(error);
        } else {
          // Pyramid of doom...
        }
      });
    }
  });
}
```

### Era 2: Promises (2015-2017)
```typescript
function loadUser(id) {
  return fetch(`/users/${id}`)
    .then(res => res.json())
    .then(user => fetch(`/posts?userId=${user.id}`))
    .then(res => res.json())
    .catch(handleError);
}
```

### Era 3: Async/Await (2017-Present)
```typescript
async function loadUser(id) {
  try {
    const userRes = await fetch(`/users/${id}`);
    const user = await userRes.json();
    const postsRes = await fetch(`/posts?userId=${user.id}`);
    return await postsRes.json();
  } catch (error) {
    handleError(error);
  }
}
```

Each era improved readability and composability.

## The Beauty of Promises

Promises are **monads** (from category theory):
- **Unit** (wrap a value): `Promise.resolve(42)`
- **Bind** (chain operations): `promise.then(f)`
- **Laws** (associativity, identity)

This mathematical foundation makes Promises composable:

```typescript
// Promises compose naturally
const result = Promise.resolve(1)
  .then(x => x * 2)
  .then(x => x + 3)
  .then(x => x.toString());
// result: Promise<string>
```

## Real-World Async Patterns

### Pattern 1: Timeout
```typescript
function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ]);
}
```

### Pattern 2: Retry
```typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
    }
  }
  throw new Error('Unreachable');
}
```

### Pattern 3: Parallel with Limit
```typescript
async function parallelLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const promise = fn(item).then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}
```

## When to Use Each Pattern

| Pattern | When to Use |
|---------|-------------|
| **Promise.all** | Need all results, fail if any fails |
| **Promise.allSettled** | Need all results, regardless of success/failure |
| **Promise.race** | Need first result (winner takes all) |
| **Promise.any** | Need first success, ignore failures |
| **Sequential await** | Operations depend on each other |
| **Parallel with limit** | Control concurrency (avoid overwhelming server) |

## The Mind-Shift

**Before mastering async:**
- "Async code is hard to read and debug"
- "I'll just use callbacks and hope for the best"

**After mastering async:**
- "Async code follows patterns—I know which to apply"
- "Promises compose elegantly"
- "Async/await makes complex flows readable"
- "I can design robust concurrent systems"

This is lifechanging because async programming stops being a source of bugs and becomes a tool for building responsive, efficient systems.

## 📚 Further Reading

- [JavaScript Event Loop](https://www.youtube.com/watch?v=8aGhZQkoFbQ) — Great video by Philip Roberts
- [Promises/A+ Spec](https://promisesaplus.com/) — The standard
- [MDN: Asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- *You Don't Know JS: Async & Performance* by Kyle Simpson

---

**Next**: [01. The Event Loop](01-event-loop.md)
