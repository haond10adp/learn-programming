# Cancellation

> *"The ability to stop is as important as the ability to start."*

## What Is It?

**Cancellation** is the ability to stop an asynchronous operation that's in progress. Without cancellation, you have no way to abort a long-running fetch, timeout a query, or clean up when a user navigates away.

JavaScript provides `AbortController` and `AbortSignal` as the standard cancellation API.

## Why This Is Beautiful

Cancellation creates **control**:
- Stop unnecessary work
- Prevent race conditions
- Clean up resources
- Improve performance and UX

When you can cancel, applications become responsive and efficient.

## AbortController Basics

```typescript
// Create controller
const controller = new AbortController();
const signal = controller.signal;

// Use signal
fetch('/api/data', { signal })
  .then(response => console.log(response))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Fetch aborted');
    }
  });

// Cancel it
controller.abort();
```

**How it works**:
1. Create `AbortController`
2. Pass `signal` to async operation
3. Call `controller.abort()` to cancel

## Canceling Fetch Requests

```typescript
async function fetchWithCancel(url: string) {
  const controller = new AbortController();
  
  // Auto-cancel after 5 seconds
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request cancelled');
      return null;
    }
    
    throw error;
  }
}
```

## Timeout Pattern

```typescript
function withTimeout(
  promise: Promise<Response>,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return promise
    .then(response => {
      clearTimeout(timeoutId);
      return response;
    })
    .catch(error => {
      clearTimeout(timeoutId);
      throw error;
    });
}

// Use it
const response = await withTimeout(
  fetch('/api/data', { signal: controller.signal }),
  5000
);
```

## Listening to Abort Events

```typescript
const controller = new AbortController();
const signal = controller.signal;

signal.addEventListener('abort', () => {
  console.log('Operation was aborted');
  // Clean up resources
});

// Later
controller.abort();
```

## Canceling Multiple Operations

```typescript
async function fetchMultiple(urls: string[]) {
  const controller = new AbortController();
  
  try {
    const promises = urls.map(url =>
      fetch(url, { signal: controller.signal })
    );
    
    const responses = await Promise.all(promises);
    return responses;
  } catch (error) {
    // If any fails or is aborted, cancel all
    controller.abort();
    throw error;
  }
}

// All fetches use same signal—abort cancels all
```

## React Example: Canceling on Unmount

```typescript
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const controller = new AbortController();
    
    fetch(`/api/users/${userId}`, { signal: controller.signal })
      .then(response => response.json())
      .then(data => setUser(data))
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      });
    
    // Cleanup: abort on unmount
    return () => controller.abort();
  }, [userId]);
  
  return <div>{user?.name}</div>;
}
```

## Custom Async Functions with Cancellation

```typescript
async function delay(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    
    const timeoutId = setTimeout(resolve, ms);
    
    // Listen for abort
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

// Use it
const controller = new AbortController();

delay(5000, controller.signal)
  .then(() => console.log('Completed'))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Cancelled');
    }
  });

// Cancel after 2 seconds
setTimeout(() => controller.abort(), 2000);
```

## Cancellable Task

```typescript
class CancellableTask<T> {
  private controller = new AbortController();
  private promise: Promise<T>;
  
  constructor(
    executor: (signal: AbortSignal) => Promise<T>
  ) {
    this.promise = executor(this.controller.signal);
  }
  
  cancel(): void {
    this.controller.abort();
  }
  
  then<R>(
    onFulfilled: (value: T) => R
  ): Promise<R> {
    return this.promise.then(onFulfilled);
  }
  
  catch<R>(
    onRejected: (error: any) => R
  ): Promise<R | T> {
    return this.promise.catch(onRejected);
  }
}

// Use it
const task = new CancellableTask(async (signal) => {
  const response = await fetch('/api/data', { signal });
  return await response.json();
});

task
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Cancel anytime
task.cancel();
```

## Racing with Cancellation

```typescript
async function raceWithCancel<T>(
  promises: Array<Promise<T>>,
  signal: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check if already aborted
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    
    // Listen for abort
    signal.addEventListener('abort', () => {
      reject(new DOMException('Aborted', 'AbortError'));
    });
    
    // Race promises
    Promise.race(promises).then(resolve, reject);
  });
}
```

## Retry with Cancellation

```typescript
async function retryWithCancel<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: {
    maxAttempts: number;
    delay: number;
    signal?: AbortSignal;
  }
): Promise<T> {
  const { maxAttempts, delay: delayMs, signal } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check if cancelled
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    try {
      return await fn(signal!);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retry
      await delay(delayMs, signal);
    }
  }
  
  throw new Error('Unreachable');
}

// Use it
const controller = new AbortController();

retryWithCancel(
  (signal) => fetch('/api/data', { signal }).then(r => r.json()),
  { maxAttempts: 3, delay: 1000, signal: controller.signal }
)
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Can cancel at any time
controller.abort();
```

## Combining Multiple Signals

```typescript
function combineSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    
    signal.addEventListener('abort', () => controller.abort());
  }
  
  return controller.signal;
}

// Use it
const userSignal = new AbortController().signal;
const timeoutSignal = AbortSignal.timeout(5000); // Browser API

const combinedSignal = combineSignals(userSignal, timeoutSignal);

fetch('/api/data', { signal: combinedSignal });
// Aborts if user cancels OR timeout reaches
```

## AbortSignal.timeout (Modern API)

```typescript
// Modern browsers provide timeout helper
const signal = AbortSignal.timeout(5000); // Aborts after 5 seconds

fetch('/api/data', { signal })
  .then(response => response.json())
  .catch(error => {
    if (error.name === 'TimeoutError') {
      console.log('Request timed out');
    }
  });
```

## Cancellation in Async Generators

```typescript
async function* fetchPages(
  signal: AbortSignal
): AsyncGenerator<any[], void, undefined> {
  let page = 1;
  
  while (!signal.aborted) {
    const response = await fetch(`/api/data?page=${page}`, { signal });
    const data = await response.json();
    
    if (data.length === 0) break;
    
    yield data;
    page++;
  }
}

// Use it
const controller = new AbortController();

(async () => {
  for await (const page of fetchPages(controller.signal)) {
    console.log(page);
  }
})();

// Cancel pagination
setTimeout(() => controller.abort(), 5000);
```

## Resource Cleanup

```typescript
class Resource {
  private controller = new AbortController();
  
  async initialize(): Promise<void> {
    const signal = this.controller.signal;
    
    try {
      // Set up resource
      await fetch('/api/init', { signal });
      
      // Start background tasks
      this.backgroundTask(signal);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Initialization cancelled');
      }
      throw error;
    }
  }
  
  private async backgroundTask(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      await delay(1000, signal);
      // Do work
    }
  }
  
  dispose(): void {
    this.controller.abort(); // Cancel all operations
  }
}

// Use it
const resource = new Resource();
await resource.initialize();

// Clean up
resource.dispose(); // Cancels all ongoing operations
```

## Search Example with Debounce + Cancel

```typescript
class SearchManager {
  private controller?: AbortController;
  private timeoutId?: NodeJS.Timeout;
  
  search(query: string): Promise<any[]> {
    // Cancel previous search
    this.cancel();
    
    return new Promise((resolve, reject) => {
      // Debounce
      this.timeoutId = setTimeout(async () => {
        this.controller = new AbortController();
        
        try {
          const response = await fetch(`/api/search?q=${query}`, {
            signal: this.controller.signal
          });
          const results = await response.json();
          resolve(results);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            reject(new Error('Search cancelled'));
          } else {
            reject(error);
          }
        }
      }, 300);
    });
  }
  
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.controller) {
      this.controller.abort();
    }
  }
}

// Use it
const searchManager = new SearchManager();

searchManager.search('a'); // Cancelled
searchManager.search('ab'); // Cancelled
searchManager.search('abc'); // Executes
```

## Common Patterns

### 1. Timeout

```typescript
async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 2. User Cancellation

```typescript
const controller = new AbortController();

button.addEventListener('click', () => {
  controller.abort();
  status.textContent = 'Cancelled';
});

fetch('/api/large-download', { signal: controller.signal });
```

### 3. Component Unmount

```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort(); // Cleanup
}, []);
```

## The Mind-Shift

**Before cancellation:**
- "Can't stop operations once started"
- "Race conditions when component unmounts"
- "Wasted network requests"

**After cancellation:**
- "Can stop any operation"
- "Clean cleanup on unmount"
- "Efficient resource usage"

## Benefits

1. **Responsive**: Stop unnecessary work
2. **Efficient**: Save bandwidth and CPU
3. **Clean**: Proper resource cleanup
4. **Safe**: Prevent race conditions

## AI-Era Relevance

### What AI Does
- Forgets to support cancellation
- No cleanup in useEffect
- Doesn't handle AbortError

### What You Must Do
- **Add**: AbortSignal parameters
- **Check**: signal.aborted before work
- **Listen**: addEventListener('abort')
- **Handle**: AbortError specially
- **Guide**: Prompt for cancellation support

## Summary

**Cancellation**:
- AbortController creates signals
- Pass signal to async operations
- controller.abort() cancels
- Handle AbortError specially
- Essential for timeouts, cleanup, and UX

**Key insight**: *Every long-running async operation should support cancellation.*

---

**Next**: [Async Iteration](../07-async-iteration.md)
