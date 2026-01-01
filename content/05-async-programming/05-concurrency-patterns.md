# Concurrency Patterns

> *"Concurrency is about dealing with lots of things at once."*

## What Are They?

**Concurrency patterns** are strategies for coordinating multiple asynchronous operations. They answer questions like:
- Should operations run in parallel or sequence?
- How do I handle partial failures?
- What if I need the first successful result?
- How do I limit concurrent operations?

## Why This Is Beautiful

Concurrency patterns create **orchestration**:
- Run operations efficiently
- Handle failures gracefully
- Control resource usage
- Optimize for speed or reliability

Mastering these patterns transforms chaotic async code into elegant coordination.

## Promise.all - All or Nothing

Wait for **all** promises to succeed:

```typescript
async function loadDashboard() {
  const [user, orders, notifications] = await Promise.all([
    fetchUser(),
    fetchOrders(),
    fetchNotifications()
  ]);
  
  return { user, orders, notifications };
}
```

**Behavior**:
- Runs all in parallel
- Waits for all to complete
- **Fails immediately** if any rejects
- Returns array of results in same order

**Use when**: All results are required.

### With Error Handling

```typescript
async function loadDashboard() {
  try {
    const [user, orders, notifications] = await Promise.all([
      fetchUser(),
      fetchOrders(),
      fetchNotifications()
    ]);
    
    return { user, orders, notifications };
  } catch (error) {
    console.error('One or more requests failed:', error);
    throw error;
  }
}
```

## Promise.allSettled - All Results

Wait for all, get all results (success or failure):

```typescript
async function loadDashboardSafe() {
  const results = await Promise.allSettled([
    fetchUser(),
    fetchOrders(),
    fetchNotifications()
  ]);
  
  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const orders = results[1].status === 'fulfilled' ? results[1].value : [];
  const notifications = results[2].status === 'fulfilled' ? results[2].value : [];
  
  return { user, orders, notifications };
}
```

**Behavior**:
- Runs all in parallel
- Waits for all to settle
- **Never rejects**
- Returns array with status and value/reason

**Use when**: You want partial results even if some fail.

### Helper Function

```typescript
function getSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

async function loadDashboard() {
  const results = await Promise.allSettled([
    fetchUser(),
    fetchOrders(),
    fetchNotifications()
  ]);
  
  return {
    user: getSettledValue(results[0], null),
    orders: getSettledValue(results[1], []),
    notifications: getSettledValue(results[2], [])
  };
}
```

## Promise.race - First to Complete

Returns first promise to settle (fulfill or reject):

```typescript
async function fetchWithTimeout(url: string, timeout: number) {
  return Promise.race([
    fetch(url),
    delay(timeout).then(() => {
      throw new Error('Timeout');
    })
  ]);
}

// Timeout after 5 seconds
const response = await fetchWithTimeout('/api/data', 5000);
```

**Behavior**:
- Returns first to settle
- Ignores others (they still run!)
- Can resolve or reject

**Use when**: Need fastest result, or implementing timeouts.

### Multiple Endpoints

```typescript
async function fetchFromFastest() {
  return Promise.race([
    fetch('https://api1.example.com/data'),
    fetch('https://api2.example.com/data'),
    fetch('https://api3.example.com/data')
  ]);
}
```

## Promise.any - First Success

Returns first promise to **fulfill** (ignores rejections):

```typescript
async function fetchFromAnySource() {
  return Promise.any([
    fetch('https://primary.api.com/data'),
    fetch('https://backup.api.com/data'),
    fetch('https://cache.api.com/data')
  ]);
}
```

**Behavior**:
- Returns first fulfilled promise
- Ignores rejections
- Only rejects if **all** reject (AggregateError)

**Use when**: Multiple sources, any success is acceptable.

### Handling All Failures

```typescript
async function fetchData() {
  try {
    return await Promise.any([
      fetchFromSource1(),
      fetchFromSource2(),
      fetchFromSource3()
    ]);
  } catch (error) {
    if (error instanceof AggregateError) {
      console.error('All sources failed:', error.errors);
    }
    throw error;
  }
}
```

## Sequential Execution

Run operations one after another:

```typescript
async function sequential(items: number[]) {
  const results = [];
  
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  
  return results;
}
```

**Use when**:
- Operations depend on previous results
- Rate limiting required
- Order matters

### With reduce

```typescript
async function sequentialReduce<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  return items.reduce(async (promiseChain, item) => {
    const results = await promiseChain;
    const result = await fn(item);
    return [...results, result];
  }, Promise.resolve([] as R[]));
}
```

## Batching

Process items in batches:

```typescript
async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  
  return results;
}

// Process 1000 items in batches of 10
const results = await batchProcess(items, 10, processItem);
```

## Concurrent with Limit

Control maximum concurrent operations:

```typescript
async function concurrentWithLimit<T, R>(
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
      // Remove completed promises
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}

// Maximum 5 concurrent requests
await concurrentWithLimit(urls, 5, fetch);
```

## Retry Pattern

Retry failed operations:

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    delay: number;
    backoff?: number; // Exponential backoff multiplier
  }
): Promise<T> {
  const { maxAttempts, delay, backoff = 1 } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Unreachable');
}

// Use it
const data = await retry(
  () => fetch('/api/data'),
  { maxAttempts: 3, delay: 1000, backoff: 2 }
);
// Retries with delays: 1s, 2s, 4s
```

## Circuit Breaker

Stop calling failing service:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number,
    private timeout: number
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Use it
const breaker = new CircuitBreaker(3, 60000); // 3 failures, 60s timeout

const data = await breaker.execute(() => fetch('/api/data'));
```

## Debounce

Delay execution until quiet period:

```typescript
function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, delay);
      });
    }
    
    return pendingPromise;
  };
}

// Use it
const debouncedSearch = debounce(searchAPI, 300);

// Only last call executes (after 300ms quiet)
debouncedSearch('a');
debouncedSearch('ab');
debouncedSearch('abc'); // Only this one runs
```

## Throttle

Limit execution frequency:

```typescript
function throttle<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  let lastRun = 0;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return async (...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRun >= interval) {
      lastRun = now;
      return await fn(...args);
    }
    
    return null; // Skipped
  };
}

// Use it
const throttledSave = throttle(saveData, 1000);

// Only runs once per second
throttledSave(data); // Executes
throttledSave(data); // Skipped
throttledSave(data); // Skipped
// ... 1 second later
throttledSave(data); // Executes
```

## Queue

Process tasks from a queue:

```typescript
class TaskQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private running = 0;
  
  constructor(private concurrency: number) {}
  
  async add(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      this.process();
    });
  }
  
  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const task = this.queue.shift()!;
    
    try {
      await task();
    } finally {
      this.running--;
      this.process(); // Process next
    }
  }
}

// Use it
const queue = new TaskQueue(3); // Max 3 concurrent

for (const url of urls) {
  queue.add(() => fetch(url)); // Queued
}
```

## Timeout Pattern

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    })
  ]);
}

// Use it
const data = await withTimeout(fetch('/api/data'), 5000);
```

## Real-World Example: Data Aggregation

```typescript
interface DataSource {
  name: string;
  fetch: () => Promise<any>;
}

async function aggregateData(sources: DataSource[]) {
  // Try all sources, use first success
  const primaryResult = await Promise.any(
    sources.map(source => source.fetch())
  ).catch(() => null);
  
  if (primaryResult) {
    return primaryResult;
  }
  
  // All failed, try with retry
  for (const source of sources) {
    try {
      const result = await retry(
        source.fetch,
        { maxAttempts: 3, delay: 1000, backoff: 2 }
      );
      return result;
    } catch {
      // Try next source
    }
  }
  
  throw new Error('All sources failed');
}
```

## The Mind-Shift

**Before concurrency patterns:**
- "Just await everything sequentially"
- "Can't control concurrent operations"
- "Failures break everything"

**After:**
- "Choose the right pattern for the use case"
- "Control concurrency, handle partial failures"
- "Optimize for speed or reliability"

## Benefits

1. **Performance**: Run operations efficiently
2. **Reliability**: Handle failures gracefully
3. **Control**: Limit resource usage
4. **Flexibility**: Choose appropriate pattern

## AI-Era Relevance

### What AI Does
- Always uses Promise.all
- Doesn't consider failure modes
- No concurrency limits

### What You Must Do
- **Choose**: Right pattern for use case
- **Limit**: Add concurrency control
- **Handle**: Partial failures
- **Guide**: Prompt for specific patterns

## Summary

**Concurrency Patterns**:
- Promise.all: All or nothing
- Promise.allSettled: All results
- Promise.race: First to complete
- Promise.any: First success
- Sequential, batching, limiting
- Retry, circuit breaker, debounce, throttle

**Key insight**: *Choose the pattern that matches your requirements: speed, reliability, resource control.*

---

**Next**: [Cancellation](../06-cancellation.md)
