# Asynchronous Performance Optimization

## Understanding Async Performance

Async operations are **essential** for performance in JavaScript. Blocking the event loop makes your application unresponsive.

### The Event Loop

```
┌───────────────────────────┐
│        Call Stack         │
└───────────────────────────┘
              ↓
┌───────────────────────────┐
│      Event Loop           │
└───────────────────────────┘
         ↙        ↘
┌──────────────┐  ┌──────────────┐
│ Task Queue   │  │ Microtask    │
│ (Callbacks)  │  │ (Promises)   │
└──────────────┘  └──────────────┘
```

**Key Points**:
- **Microtasks** (Promises) have priority over **Tasks** (setTimeout)
- Never block the event loop with synchronous operations
- Keep individual tasks short (<50ms)

## Promise Optimization

### 1. Parallel Execution

```typescript
// ============================================
// PARALLEL VS SEQUENTIAL
// ============================================

// ❌ Bad: Sequential execution (slow)
async function fetchUserDataSequential(userId: string) {
    const user = await fetchUser(userId);         // Wait 100ms
    const posts = await fetchPosts(userId);       // Wait 100ms
    const comments = await fetchComments(userId); // Wait 100ms
    return { user, posts, comments };
}
// Total: 300ms

// ✅ Good: Parallel execution (fast)
async function fetchUserDataParallel(userId: string) {
    const [user, posts, comments] = await Promise.all([
        fetchUser(userId),       // All start simultaneously
        fetchPosts(userId),
        fetchComments(userId)
    ]);
    return { user, posts, comments };
}
// Total: 100ms (3x faster!)

// ✅ Alternative: Promise.allSettled (doesn't fail if one fails)
async function fetchUserDataResilient(userId: string) {
    const results = await Promise.allSettled([
        fetchUser(userId),
        fetchPosts(userId),
        fetchComments(userId)
    ]);
    
    return {
        user: results[0].status === 'fulfilled' ? results[0].value : null,
        posts: results[1].status === 'fulfilled' ? results[1].value : [],
        comments: results[2].status === 'fulfilled' ? results[2].value : []
    };
}
```

### 2. Avoid Await in Loops

```typescript
// ❌ Bad: Await in loop (sequential)
async function processItemsSlow(items: string[]) {
    const results = [];
    
    for (const item of items) {
        const result = await processItem(item); // Waits for each
        results.push(result);
    }
    
    return results;
}
// 100 items × 10ms = 1000ms

// ✅ Good: Promise.all (parallel)
async function processItemsFast(items: string[]) {
    return Promise.all(items.map(item => processItem(item)));
}
// 100 items in parallel = 10ms

// ✅ Best: Controlled concurrency
async function processItemsControlled(items: string[], concurrency: number = 5) {
    const results: any[] = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(item => processItem(item))
        );
        results.push(...batchResults);
    }
    
    return results;
}
// Balance between parallel (fast) and controlled (safe)
```

### 3. Promise Chaining Optimization

```typescript
// ❌ Bad: Nested promises
function badChaining(userId: string) {
    return fetchUser(userId)
        .then(user => {
            return fetchPosts(user.id)
                .then(posts => {
                    return fetchComments(posts[0].id)
                        .then(comments => {
                            return { user, posts, comments };
                        });
                });
        });
}

// ✅ Good: Flat promise chain
function goodChaining(userId: string) {
    let user: User;
    let posts: Post[];
    
    return fetchUser(userId)
        .then(u => {
            user = u;
            return fetchPosts(u.id);
        })
        .then(p => {
            posts = p;
            return fetchComments(posts[0].id);
        })
        .then(comments => ({ user, posts, comments }));
}

// ✅ Better: Async/await
async function bestChaining(userId: string) {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
}
```

## Async Patterns

### 1. Batching Requests

```typescript
// ============================================
// REQUEST BATCHING
// ============================================

class RequestBatcher<K, V> {
    private batch = new Map<K, Promise<V>>();
    private timer: NodeJS.Timeout | null = null;
    private delay: number;
    
    constructor(
        private fetcher: (keys: K[]) => Promise<Map<K, V>>,
        delay: number = 10
    ) {
        this.delay = delay;
    }
    
    get(key: K): Promise<V> {
        // Return existing promise if already batched
        if (this.batch.has(key)) {
            return this.batch.get(key)!;
        }
        
        // Create promise that will resolve when batch executes
        const promise = new Promise<V>((resolve, reject) => {
            this.batch.set(key, promise as any);
            
            // Schedule batch execution
            if (!this.timer) {
                this.timer = setTimeout(() => this.executeBatch(), this.delay);
            }
        });
        
        this.batch.set(key, promise);
        return promise;
    }
    
    private async executeBatch(): Promise<void> {
        const keys = Array.from(this.batch.keys());
        const batch = new Map(this.batch);
        
        // Clear for next batch
        this.batch.clear();
        this.timer = null;
        
        try {
            // Fetch all at once
            const results = await this.fetcher(keys);
            
            // Resolve individual promises
            for (const [key, promise] of batch) {
                const value = results.get(key);
                if (value !== undefined) {
                    (promise as any).resolve(value);
                } else {
                    (promise as any).reject(new Error(`Key not found: ${key}`));
                }
            }
        } catch (error) {
            // Reject all promises
            for (const promise of batch.values()) {
                (promise as any).reject(error);
            }
        }
    }
}

// Usage
const userBatcher = new RequestBatcher<string, User>(
    async (ids) => {
        // Single batch request
        const users = await fetchUsersBatch(ids);
        return new Map(users.map(u => [u.id, u]));
    }
);

// Multiple individual requests are automatically batched
const user1 = await userBatcher.get('user-1');
const user2 = await userBatcher.get('user-2');
const user3 = await userBatcher.get('user-3');
// All fetched in single request!
```

### 2. Debouncing and Throttling

```typescript
// ============================================
// DEBOUNCE
// ============================================

function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return function(...args: Parameters<T>) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// ✅ Good: Debounce search input
const searchDebounced = debounce(async (query: string) => {
    const results = await searchAPI(query);
    displayResults(results);
}, 300);

// Only calls API after user stops typing for 300ms
searchInput.addEventListener('input', (e) => {
    searchDebounced(e.target.value);
});

// ============================================
// THROTTLE
// ============================================

function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ✅ Good: Throttle scroll handler
const handleScrollThrottled = throttle(() => {
    const scrollTop = window.pageYOffset;
    updateUI(scrollTop);
}, 100);

// Only calls handler once every 100ms, even if scrolling constantly
window.addEventListener('scroll', handleScrollThrottled);
```

### 3. Async Queue

```typescript
// ============================================
// ASYNC QUEUE WITH CONCURRENCY CONTROL
// ============================================

class AsyncQueue {
    private queue: Array<() => Promise<any>> = [];
    private running: number = 0;
    
    constructor(private concurrency: number = 1) {}
    
    async add<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await task();
                    resolve(result);
                } catch (error) {
                    reject(error);
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
    
    async waitForAll(): Promise<void> {
        while (this.running > 0 || this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
}

// Usage: Limit concurrent API requests
const queue = new AsyncQueue(3); // Max 3 concurrent requests

const results = await Promise.all(
    urls.map(url => queue.add(() => fetch(url)))
);
```

### 4. Retry with Exponential Backoff

```typescript
// ============================================
// RETRY PATTERN
// ============================================

async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError!;
}

// Usage
const data = await retryWithBackoff(
    () => fetchFromUnreliableAPI(),
    3,      // 3 retries
    1000    // Start with 1s delay
);
// Retries after: 1s, 2s, 4s
```

## Async Iterators and Generators

### 1. Async Generator for Streaming

```typescript
// ============================================
// ASYNC GENERATOR
// ============================================

async function* fetchPaginated(url: string) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
        const response = await fetch(`${url}?page=${page}`);
        const data = await response.json();
        
        yield data.items;
        
        hasMore = data.hasMore;
        page++;
    }
}

// ✅ Good: Process data as it arrives
async function processLargeDataset() {
    for await (const batch of fetchPaginated('/api/items')) {
        processBatch(batch);
        // Don't load everything into memory at once!
    }
}

// ❌ Bad: Load everything first
async function processLargeDatasetBad() {
    const allData = [];
    
    for await (const batch of fetchPaginated('/api/items')) {
        allData.push(...batch); // Accumulates in memory
    }
    
    processBatch(allData); // May run out of memory!
}
```

### 2. Async Iterator for Real-time Data

```typescript
// ============================================
// ASYNC ITERATOR
// ============================================

class EventStream {
    private listeners: Array<(data: any) => void> = [];
    
    async *subscribe() {
        const queue: any[] = [];
        let resolve: ((value: any) => void) | null = null;
        
        const listener = (data: any) => {
            if (resolve) {
                resolve(data);
                resolve = null;
            } else {
                queue.push(data);
            }
        };
        
        this.listeners.push(listener);
        
        try {
            while (true) {
                if (queue.length > 0) {
                    yield queue.shift();
                } else {
                    yield await new Promise<any>(r => resolve = r);
                }
            }
        } finally {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        }
    }
    
    emit(data: any): void {
        this.listeners.forEach(listener => listener(data));
    }
}

// Usage
const stream = new EventStream();

// Consumer
(async () => {
    for await (const event of stream.subscribe()) {
        console.log('Received:', event);
    }
})();

// Producer
stream.emit({ type: 'update', data: 'Hello' });
```

## Worker Threads

### 1. CPU-Intensive Operations

```typescript
// ============================================
// WEB WORKER
// ============================================

// worker.ts
self.addEventListener('message', (event) => {
    const { data } = event;
    
    // CPU-intensive operation
    const result = processLargeData(data);
    
    self.postMessage(result);
});

// main.ts
class WorkerPool {
    private workers: Worker[] = [];
    private queue: Array<{
        data: any;
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];
    
    constructor(workerUrl: string, poolSize: number = 4) {
        for (let i = 0; i < poolSize; i++) {
            const worker = new Worker(workerUrl);
            
            worker.addEventListener('message', (event) => {
                const task = this.queue.shift();
                if (task) {
                    task.resolve(event.data);
                }
            });
            
            worker.addEventListener('error', (error) => {
                const task = this.queue.shift();
                if (task) {
                    task.reject(error);
                }
            });
            
            this.workers.push(worker);
        }
    }
    
    async execute(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push({ data, resolve, reject });
            
            // Find available worker
            const worker = this.workers[this.queue.length % this.workers.length];
            worker.postMessage(data);
        });
    }
    
    terminate(): void {
        this.workers.forEach(worker => worker.terminate());
    }
}

// Usage
const pool = new WorkerPool('/worker.js', 4);

const results = await Promise.all(
    largeDatasets.map(data => pool.execute(data))
);
```

## Streaming and Backpressure

### 1. Stream Processing

```typescript
// ============================================
// READABLE STREAM
// ============================================

async function processStream(response: Response) {
    const reader = response.body?.getReader();
    if (!reader) return;
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            // Process chunk as it arrives
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                processLine(line);
            }
        }
        
        // Process remaining buffer
        if (buffer) {
            processLine(buffer);
        }
    } finally {
        reader.releaseLock();
    }
}

// ✅ Good: Process data as it streams
await processStream(await fetch('/large-file.json'));

// ❌ Bad: Wait for entire response
const text = await (await fetch('/large-file.json')).text();
```

### 2. Transform Stream

```typescript
// ============================================
// TRANSFORM STREAM
// ============================================

class JsonLineParser extends TransformStream {
    constructor() {
        let buffer = '';
        
        super({
            transform(chunk, controller) {
                buffer += new TextDecoder().decode(chunk);
                
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            controller.enqueue(JSON.parse(line));
                        } catch (error) {
                            console.error('Invalid JSON:', line);
                        }
                    }
                }
            },
            
            flush(controller) {
                if (buffer.trim()) {
                    try {
                        controller.enqueue(JSON.parse(buffer));
                    } catch (error) {
                        console.error('Invalid JSON:', buffer);
                    }
                }
            }
        });
    }
}

// Usage
const response = await fetch('/stream.jsonl');
const stream = response.body!
    .pipeThrough(new JsonLineParser());

for await (const obj of stream) {
    processObject(obj);
}
```

## Performance Monitoring

```typescript
// ============================================
// ASYNC OPERATION MONITOR
// ============================================

class AsyncMonitor {
    private operations = new Map<string, {
        count: number;
        totalTime: number;
        errors: number;
    }>();
    
    async track<T>(name: string, operation: () => Promise<T>): Promise<T> {
        const start = performance.now();
        
        try {
            const result = await operation();
            this.recordSuccess(name, performance.now() - start);
            return result;
        } catch (error) {
            this.recordError(name, performance.now() - start);
            throw error;
        }
    }
    
    private recordSuccess(name: string, duration: number): void {
        const stats = this.getStats(name);
        stats.count++;
        stats.totalTime += duration;
    }
    
    private recordError(name: string, duration: number): void {
        const stats = this.getStats(name);
        stats.count++;
        stats.totalTime += duration;
        stats.errors++;
    }
    
    private getStats(name: string) {
        if (!this.operations.has(name)) {
            this.operations.set(name, { count: 0, totalTime: 0, errors: 0 });
        }
        return this.operations.get(name)!;
    }
    
    report(): void {
        console.log('Async Operations Report:');
        
        for (const [name, stats] of this.operations) {
            const avgTime = stats.totalTime / stats.count;
            const errorRate = (stats.errors / stats.count * 100).toFixed(2);
            
            console.log(`  ${name}:`);
            console.log(`    Count: ${stats.count}`);
            console.log(`    Avg Time: ${avgTime.toFixed(2)}ms`);
            console.log(`    Error Rate: ${errorRate}%`);
        }
    }
}

// Usage
const monitor = new AsyncMonitor();

await monitor.track('fetchUser', () => fetchUser(userId));
await monitor.track('fetchPosts', () => fetchPosts(userId));

monitor.report();
```

## Best Practices

1. **Use Promise.all for independent operations**
2. **Avoid await in loops** - use Promise.all instead
3. **Implement retry logic for unreliable operations**
4. **Use debouncing/throttling for frequent events**
5. **Process streams instead of loading everything**
6. **Use worker threads for CPU-intensive tasks**
7. **Implement concurrency limits to avoid overload**
8. **Monitor async operation performance**

## Summary

**Async optimization** is critical for responsive applications:

1. **Parallel Execution**: Use Promise.all for independent operations
2. **Avoid Blocking**: Never await in loops unnecessarily
3. **Batching**: Combine multiple requests into one
4. **Debouncing/Throttling**: Reduce frequency of expensive operations
5. **Streaming**: Process data as it arrives, don't load everything
6. **Worker Threads**: Move CPU-intensive work off main thread
7. **Retry Logic**: Handle failures gracefully with exponential backoff

**Key Takeaway**: The fastest async operation is one that runs in parallel with others. Always look for opportunities to parallelize independent operations.

---

**Next**: Explore [Rendering Performance](../05-rendering.md) for UI optimization techniques.
