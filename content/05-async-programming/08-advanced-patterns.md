# Advanced Async Patterns

> *"Mastery is in the details."*

## What Are They?

**Advanced async patterns** are sophisticated techniques for handling complex async scenarios: rate limiting, debouncing, circuit breakers, request deduplication, and more. These patterns solve real-world production problems.

## Why This Is Beautiful

Advanced patterns create **robustness**:
- Protect APIs from overload
- Improve user experience
- Handle failures gracefully
- Optimize performance

These patterns separate junior from senior engineers.

## Debounce

Delay execution until quiet period:

```typescript
function debounce<Args extends any[]>(
  fn: (...args: Args) => Promise<any>,
  delayMs: number
): (...args: Args) => Promise<any> {
  let timeoutId: NodeJS.Timeout | null = null;
  let latestResolve: ((value: any) => void) | null = null;
  let latestReject: ((error: any) => void) | null = null;
  
  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      latestResolve = resolve;
      latestReject = reject;
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          latestResolve?.(result);
        } catch (error) {
          latestReject?.(error);
        }
      }, delayMs);
    });
  };
}

// Use for search
const debouncedSearch = debounce(searchAPI, 300);

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value)
    .then(results => displayResults(results));
});
```

**Use case**: Search-as-you-type, auto-save, window resize handlers.

## Throttle

Limit execution frequency:

```typescript
function throttle<Args extends any[]>(
  fn: (...args: Args) => Promise<any>,
  intervalMs: number
): (...args: Args) => Promise<any> | null {
  let lastRun = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;
    
    if (timeSinceLastRun >= intervalMs) {
      lastRun = now;
      return fn(...args);
    }
    
    // Schedule for later
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        lastRun = Date.now();
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, intervalMs - timeSinceLastRun);
    });
  };
}

// Use for scroll events
const throttledScroll = throttle(handleScroll, 100);

window.addEventListener('scroll', () => {
  throttledScroll();
});
```

**Use case**: Scroll handlers, mouse move, analytics tracking.

## Rate Limiter

Limit requests per time window:

```typescript
class RateLimiter {
  private queue: Array<() => void> = [];
  private activeCount = 0;
  
  constructor(
    private maxConcurrent: number,
    private requestsPerInterval: number,
    private interval: number
  ) {
    // Reset counter periodically
    setInterval(() => {
      this.requestsPerInterval = requestsPerInterval;
      this.processQueue();
    }, interval);
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot();
    
    this.activeCount++;
    this.requestsPerInterval--;
    
    try {
      return await fn();
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
  
  private waitForSlot(): Promise<void> {
    if (
      this.activeCount < this.maxConcurrent &&
      this.requestsPerInterval > 0
    ) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }
  
  private processQueue(): void {
    while (
      this.queue.length > 0 &&
      this.activeCount < this.maxConcurrent &&
      this.requestsPerInterval > 0
    ) {
      const resolve = this.queue.shift()!;
      resolve();
    }
  }
}

// Use it: Max 5 concurrent, 100 per minute
const limiter = new RateLimiter(5, 100, 60000);

for (const url of urls) {
  await limiter.execute(() => fetch(url));
}
```

**Use case**: API rate limiting, protecting backend services.

## Request Deduplication

Prevent duplicate concurrent requests:

```typescript
class RequestDeduplicator<K, V> {
  private pending = new Map<K, Promise<V>>();
  
  async execute(
    key: K,
    fn: () => Promise<V>
  ): Promise<V> {
    // Return existing promise if pending
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    // Create new promise
    const promise = fn()
      .finally(() => {
        this.pending.delete(key);
      });
    
    this.pending.set(key, promise);
    return promise;
  }
}

// Use it
const dedup = new RequestDeduplicator<string, User>();

// Multiple simultaneous calls for same user
// Only one actual request made
const [user1, user2, user3] = await Promise.all([
  dedup.execute('user-123', () => fetchUser('user-123')),
  dedup.execute('user-123', () => fetchUser('user-123')),
  dedup.execute('user-123', () => fetchUser('user-123'))
]);

// user1, user2, user3 all reference same result
```

**Use case**: Prevent duplicate API calls, cache warming.

## Cache with TTL

```typescript
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class AsyncCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private pending = new Map<K, Promise<V>>();
  
  constructor(private ttlMs: number) {}
  
  async get(
    key: K,
    fetcher: () => Promise<V>
  ): Promise<V> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }
    
    // Check if fetch in progress
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }
    
    // Fetch and cache
    const promise = fetcher()
      .then(value => {
        this.cache.set(key, {
          value,
          expiresAt: Date.now() + this.ttlMs
        });
        this.pending.delete(key);
        return value;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  invalidate(key: K): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }
}

// Use it
const cache = new AsyncCache<string, User>(60000); // 1 minute TTL

const user = await cache.get('user-123', () => fetchUser('user-123'));
```

**Use case**: Reduce API calls, improve performance.

## Circuit Breaker

Stop calling failing service:

```typescript
enum CircuitState {
  Closed = 'CLOSED',
  Open = 'OPEN',
  HalfOpen = 'HALF_OPEN'
}

class CircuitBreaker<T> {
  private state = CircuitState.Closed;
  private failureCount = 0;
  private lastFailureTime?: number;
  private successCount = 0;
  
  constructor(
    private options: {
      failureThreshold: number;
      resetTimeout: number;
      halfOpenSuccessThreshold: number;
    }
  ) {}
  
  async execute(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.Open) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HalfOpen;
      } else {
        throw new Error('Circuit breaker is OPEN');
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
    this.failureCount = 0;
    
    if (this.state === CircuitState.HalfOpen) {
      this.successCount++;
      
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        this.state = CircuitState.Closed;
        this.successCount = 0;
      }
    }
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.Open;
    }
    
    if (this.state === CircuitState.HalfOpen) {
      this.state = CircuitState.Open;
      this.successCount = 0;
    }
  }
  
  private shouldAttemptReset(): boolean {
    return (
      Date.now() - this.lastFailureTime! > this.options.resetTimeout
    );
  }
  
  getState(): CircuitState {
    return this.state;
  }
}

// Use it
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenSuccessThreshold: 2
});

try {
  const data = await breaker.execute(() => fetch('/api/data'));
} catch (error) {
  console.error('Circuit breaker prevented call or request failed');
}
```

**Use case**: Protect against cascading failures, failing dependencies.

## Retry with Exponential Backoff

```typescript
interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryIf?: (error: any) => boolean;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryIf = () => true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts || !retryIf(error)) {
        throw error;
      }
      
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      // Add jitter
      const jitter = delay * 0.1 * Math.random();
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay + jitter}ms`);
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

// Use it
const data = await retryWithBackoff(
  () => fetch('/api/data').then(r => r.json()),
  {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryIf: (error) => error.status >= 500 // Only retry server errors
  }
);
```

**Use case**: Transient failures, network issues.

## Parallel with Concurrency Limit

```typescript
async function parallelLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  
  const execute = async (): Promise<void> => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  };
  
  // Start workers
  const workers = Array.from({ length: Math.min(limit, items.length) }, execute);
  
  await Promise.all(workers);
  return results;
}

// Process 1000 items with max 10 concurrent
const results = await parallelLimit(items, 10, processItem);
```

**Use case**: Control resource usage, respect API limits.

## Waterfall

Execute functions in sequence, passing results:

```typescript
async function waterfall<T>(
  ...fns: Array<(input: any) => Promise<any>>
): Promise<T> {
  let result: any;
  
  for (const fn of fns) {
    result = await fn(result);
  }
  
  return result;
}

// Use it
const finalResult = await waterfall(
  async () => fetchUser(userId),
  async (user) => fetchOrders(user.id),
  async (orders) => calculateTotal(orders),
  async (total) => applyDiscount(total)
);
```

**Use case**: Sequential transformations, data pipelines.

## Polling

Repeatedly check for updates:

```typescript
async function poll<T>(
  fn: () => Promise<T>,
  options: {
    intervalMs: number;
    maxAttempts?: number;
    stopCondition?: (result: T) => boolean;
  }
): Promise<T> {
  const { intervalMs, maxAttempts = Infinity, stopCondition } = options;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const result = await fn();
      
      if (!stopCondition || stopCondition(result)) {
        return result;
      }
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Max attempts reached');
}

// Use it: Poll until job completes
const result = await poll(
  () => fetch('/api/job/123').then(r => r.json()),
  {
    intervalMs: 2000,
    maxAttempts: 30,
    stopCondition: (job) => job.status === 'completed'
  }
);
```

**Use case**: Long-running jobs, background tasks.

## Memoization

Cache function results:

```typescript
function memoizeAsync<Args extends any[], R>(
  fn: (...args: Args) => Promise<R>,
  keyFn?: (...args: Args) => string
): (...args: Args) => Promise<R> {
  const cache = new Map<string, Promise<R>>();
  
  const getKey = keyFn || ((...args: Args) => JSON.stringify(args));
  
  return async (...args: Args): Promise<R> => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const promise = fn(...args)
      .catch(error => {
        cache.delete(key); // Don't cache errors
        throw error;
      });
    
    cache.set(key, promise);
    return promise;
  };
}

// Use it
const memoizedFetch = memoizeAsync(fetchUser);

const user1 = await memoizedFetch(123); // Fetches
const user2 = await memoizedFetch(123); // Cached
```

**Use case**: Expensive computations, API calls with stable results.

## Timeout Wrapper

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    })
  ]);
}

// Use it
const data = await withTimeout(
  fetch('/api/slow-endpoint'),
  5000,
  'API request timed out after 5 seconds'
);
```

## Promise Pool

Manage concurrent operations:

```typescript
class PromisePool<T> {
  private queue: Array<() => Promise<T>> = [];
  private active = 0;
  private results: T[] = [];
  
  constructor(private concurrency: number) {}
  
  add(fn: () => Promise<T>): void {
    this.queue.push(fn);
  }
  
  async run(): Promise<T[]> {
    const workers = Array.from(
      { length: this.concurrency },
      () => this.worker()
    );
    
    await Promise.all(workers);
    return this.results;
  }
  
  private async worker(): Promise<void> {
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      this.active++;
      
      try {
        const result = await fn();
        this.results.push(result);
      } finally {
        this.active--;
      }
    }
  }
}

// Use it
const pool = new PromisePool<User>(5);

urls.forEach(url => {
  pool.add(() => fetch(url).then(r => r.json()));
});

const results = await pool.run();
```

## The Mind-Shift

**Before advanced patterns:**
- Reinvent solutions each time
- Don't handle edge cases
- Simple but fragile code

**After:**
- Use proven patterns
- Handle failures, rate limits, retries
- Robust production code

## Benefits

1. **Robustness**: Handle edge cases
2. **Performance**: Optimize resource usage
3. **Reliability**: Graceful degradation
4. **Maintainability**: Well-known patterns

## AI-Era Relevance

### What AI Does
- Basic implementations
- Doesn't consider edge cases
- No rate limiting or retries

### What You Must Do
- **Apply**: Use these patterns
- **Test**: Verify edge cases
- **Monitor**: Track failures
- **Guide**: Prompt for specific patterns

## Summary

**Advanced Patterns**:
- Debounce/Throttle: Control execution frequency
- Rate Limiter: Respect API limits
- Circuit Breaker: Protect against cascading failures
- Retry: Handle transient failures
- Cache: Reduce redundant work
- Deduplication: Prevent duplicate requests

**Key insight**: *These patterns solve real production problems—learn them, use them.*

---

**Module 05 Complete!** All async programming topics covered.
