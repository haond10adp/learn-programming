# The Event Loop

> *"JavaScript is single-threaded, but not single-minded."*

## What Is It?

The **Event Loop** is the mechanism that allows JavaScript to perform non-blocking I/O operations despite being single-threaded. It coordinates the execution of code, collection of events, and execution of queued tasks.

**Key components**:
1. **Call Stack**: Where function execution happens
2. **Web APIs**: Browser/Node APIs (setTimeout, fetch, etc.)
3. **Task Queue** (Macro-task queue): Callbacks from setTimeout, setInterval
4. **Microtask Queue**: Promises, queueMicrotask
5. **Event Loop**: Orchestrator that moves tasks from queues to stack

## Why This Is Beautiful

The Event Loop creates **concurrency without parallelism**:
- Single thread, no race conditions
- Non-blocking I/O
- Responsive UIs
- Elegant coordination of async operations

Understanding the event loop transforms async code from mysterious to predictable.

## The Basic Model

```
┌───────────────────────────┐
│      Call Stack            │ ← Currently executing
└───────────────────────────┘
           ↑
           │
┌──────────┴────────────────┐
│     Event Loop             │ ← Checks & moves tasks
└──────────┬────────────────┘
           ↓
┌───────────────────────────┐
│   Microtask Queue          │ ← Promises, queueMicrotask
│   (High priority)          │
└───────────────────────────┘
           ↓
┌───────────────────────────┐
│   Task Queue               │ ← setTimeout, setInterval
│   (Lower priority)         │
└───────────────────────────┘
```

**Event Loop algorithm** (simplified):
1. Execute all code on call stack
2. Check microtask queue—execute ALL microtasks
3. Check task queue—execute ONE task
4. Render (in browser)
5. Repeat

## Example: Execution Order

```typescript
console.log('1: Synchronous');

setTimeout(() => {
  console.log('2: setTimeout (Task Queue)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise (Microtask Queue)');
});

console.log('4: Synchronous');

// Output:
// 1: Synchronous
// 4: Synchronous
// 3: Promise (Microtask Queue)
// 2: setTimeout (Task Queue)
```

**Why this order?**
1. Synchronous code runs first: `1`, `4`
2. Call stack empty → check microtask queue: `3`
3. Microtasks done → check task queue: `2`

## Microtasks vs Tasks

### Microtasks (Higher Priority)
- `Promise.then`, `Promise.catch`, `Promise.finally`
- `queueMicrotask()`
- `async/await` continuations
- `MutationObserver` (browser)

**Executed**: ALL microtasks before next task

### Tasks (Lower Priority)
- `setTimeout`, `setInterval`
- `setImmediate` (Node.js)
- I/O operations
- UI rendering events

**Executed**: ONE task per event loop iteration

### Example

```typescript
console.log('Start');

setTimeout(() => console.log('setTimeout 1'), 0);
setTimeout(() => console.log('setTimeout 2'), 0);

Promise.resolve()
  .then(() => console.log('Promise 1'))
  .then(() => console.log('Promise 2'))
  .then(() => console.log('Promise 3'));

console.log('End');

// Output:
// Start
// End
// Promise 1
// Promise 2
// Promise 3
// setTimeout 1
// setTimeout 2
```

**All promises execute before ANY setTimeout!**

## The Call Stack

JavaScript executes code on a **single call stack**:

```typescript
function third() {
  console.log('Third');
}

function second() {
  third();
  console.log('Second');
}

function first() {
  second();
  console.log('First');
}

first();

// Call stack evolution:
// 1. [first]
// 2. [first, second]
// 3. [first, second, third]
// 4. [first, second]        // third returns
// 5. [first]                // second returns
// 6. []                     // first returns
```

**Stack trace** shows this:
```
Error
    at third (script.js:2)
    at second (script.js:6)
    at first (script.js:11)
```

## Blocking the Event Loop

Long-running synchronous code **blocks** everything:

```typescript
console.log('Start');

// ❌ Blocks event loop for 3 seconds!
function busyWait(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy waiting
  }
}

busyWait(3000);

console.log('End');

// UI freezes, timers delayed, network requests queued
```

**Problem**: Nothing else can execute during busy waiting.

### Non-Blocking Alternative

```typescript
console.log('Start');

// ✅ Non-blocking: uses event loop
setTimeout(() => {
  console.log('After 3 seconds');
}, 3000);

console.log('End');

// UI responsive, other code can run
```

## How setTimeout Really Works

```typescript
setTimeout(() => {
  console.log('Hello');
}, 1000);
```

**What happens**:
1. `setTimeout` called → registers callback with Web APIs
2. Web APIs wait 1000ms
3. After 1000ms, callback added to **task queue**
4. Event loop checks: stack empty? microtasks done?
5. Event loop moves callback to call stack
6. Callback executes

**Key**: The delay is **minimum**, not guaranteed!

```typescript
setTimeout(() => console.log('After 0ms'), 0);

for (let i = 0; i < 1000000000; i++) {
  // Long computation
}

console.log('After loop');

// Output:
// After loop
// After 0ms

// Even with 0ms delay, callback waits for stack to clear!
```

## Async Code Execution

```typescript
console.log('1');

fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => {
    console.log('2: Data received', data);
  });

console.log('3');

// Output:
// 1
// 3
// 2: Data received [data]
```

**Execution**:
1. `console.log('1')` → call stack
2. `fetch()` → starts async operation (Web API)
3. `console.log('3')` → call stack
4. Fetch completes → `.then()` callback → microtask queue
5. Stack empty → event loop executes microtask
6. `console.log('2')` → call stack

## Nested Timers

```typescript
console.log('Start');

setTimeout(() => {
  console.log('Timeout 1');
  
  setTimeout(() => {
    console.log('Timeout 2');
  }, 0);
  
  Promise.resolve().then(() => {
    console.log('Promise');
  });
  
  console.log('Timeout 1 End');
}, 0);

console.log('End');

// Output:
// Start
// End
// Timeout 1
// Timeout 1 End
// Promise          ← Microtask runs before next timeout
// Timeout 2        ← Next task
```

**Microtasks** always run before the next task!

## Promise Microtasks

Each `.then()` creates a new microtask:

```typescript
Promise.resolve()
  .then(() => console.log('1'))
  .then(() => console.log('2'))
  .then(() => console.log('3'));

Promise.resolve()
  .then(() => console.log('A'))
  .then(() => console.log('B'))
  .then(() => console.log('C'));

// Output:
// 1
// A
// 2
// B
// 3
// C

// Microtasks interleave!
```

**Why?** Each `.then()` queues a microtask, event loop executes them in order.

## Visualizing the Event Loop

```typescript
console.log('Script start');        // 1. Call stack

setTimeout(() => {
  console.log('setTimeout');         // 5. Task queue
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise 1');        // 3. Microtask queue
  })
  .then(() => {
    console.log('Promise 2');        // 4. Microtask queue
  });

console.log('Script end');           // 2. Call stack

// Execution timeline:
// ┌─ Call Stack ──┐  ┌─ Microtask Queue ─┐  ┌─ Task Queue ─┐
// │ Script start  │  │                    │  │               │
// │ Script end    │  │                    │  │               │
// └───────────────┘  └────────────────────┘  └───────────────┘
//        ↓
// ┌─ Call Stack ──┐  ┌─ Microtask Queue ─┐  ┌─ Task Queue ─┐
// │ (empty)       │  │ Promise 1          │  │ setTimeout    │
// └───────────────┘  │ Promise 2          │  └───────────────┘
//                     └────────────────────┘
//        ↓
// ┌─ Call Stack ──┐  ┌─ Microtask Queue ─┐  ┌─ Task Queue ─┐
// │ Promise 1     │  │ Promise 2          │  │ setTimeout    │
// └───────────────┘  └────────────────────┘  └───────────────┘
//        ↓
// ┌─ Call Stack ──┐  ┌─ Microtask Queue ─┐  ┌─ Task Queue ─┐
// │ Promise 2     │  │ (empty)            │  │ setTimeout    │
// └───────────────┘  └────────────────────┘  └───────────────┘
//        ↓
// ┌─ Call Stack ──┐  ┌─ Microtask Queue ─┐  ┌─ Task Queue ─┐
// │ setTimeout    │  │ (empty)            │  │ (empty)       │
// └───────────────┘  └────────────────────┘  └───────────────┘
```

## Long-Running Tasks

Break them up:

```typescript
// ❌ Blocks event loop
function processLargeArray(items: any[]): void {
  items.forEach(item => {
    // Expensive processing
  });
}

// ✅ Non-blocking: chunk processing
async function processLargeArrayAsync(items: any[]): Promise<void> {
  const chunkSize = 100;
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    chunk.forEach(item => {
      // Expensive processing
    });
    
    // Yield to event loop
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

Now the UI stays responsive!

## Node.js Event Loop

Node.js has a more complex event loop with **phases**:

```
   ┌───────────────────────────┐
┌─>│           timers          │ ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ ← I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ ← Internal
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │ ← I/O events
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ ← setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │ ← socket.close, etc.
   └───────────────────────────┘
```

**Between each phase**: Microtasks execute!

```typescript
// Node.js-specific
setImmediate(() => console.log('setImmediate'));
setTimeout(() => console.log('setTimeout'), 0);
Promise.resolve().then(() => console.log('Promise'));

// Order can vary, but Promise always before setTimeout!
```

## The Mind-Shift

**Before understanding event loop:**
- "Async code is unpredictable"
- "Why is this executing out of order?"
- "setTimeout(fn, 0) should be instant"

**After understanding event loop:**
- "I can predict execution order"
- "Microtasks run before tasks"
- "setTimeout schedules, doesn't execute immediately"

This is lifechanging because async behavior goes from mysterious to **completely predictable**.

## Common Pitfalls

### 1. Expecting Immediate Execution

```typescript
setTimeout(() => console.log('This'), 0);
console.log('Runs first!');
```

### 2. Blocking with Synchronous Code

```typescript
// ❌ Blocks everything
while (true) {
  // Infinite loop freezes app
}
```

### 3. Microtask Queue Starvation

```typescript
// ❌ Infinite microtasks prevent tasks from running
function recursiveMicrotask() {
  Promise.resolve().then(recursiveMicrotask);
}
recursiveMicrotask();

// Tasks (setTimeout, UI events) never execute!
```

## Tools for Visualizing

- **Loupe**: [latentflip.com/loupe](http://latentflip.com/loupe)  
  Visualize call stack, Web APIs, queues

- **Chrome DevTools**:  
  Performance tab → Record → See task timing

- **Node.js**:  
  `node --trace-warnings` to debug async issues

## Benefits

1. **Predictability**: Know execution order
2. **Performance**: Write non-blocking code
3. **Debugging**: Understand stack traces
4. **Architecture**: Design around event loop

## AI-Era Relevance

### What AI Does
- Writes blocking code
- Doesn't consider event loop
- Mixes microtasks and tasks incorrectly

### What You Must Do
- **Verify**: Is this code blocking?
- **Test**: Check execution order
- **Optimize**: Break up long tasks
- **Guide**: Prompt for non-blocking patterns

## Summary

The **Event Loop** is JavaScript's concurrency model:
- Single-threaded, non-blocking
- Call stack → Microtask queue → Task queue
- Promises (microtasks) run before timers (tasks)
- Long synchronous code blocks everything

**Key insight**: *Async execution order is deterministic when you understand the event loop.*

---

**Next**: [Callbacks](../02-callbacks.md)
