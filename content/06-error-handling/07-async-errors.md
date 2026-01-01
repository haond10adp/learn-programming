# Async Errors

> *"Promises can reject, awaits can throw—handle both."*

## What Are They?

**Async errors** are errors that occur in asynchronous operations. They're tricky because they happen in the future and can be easy to miss.

```typescript
// Synchronous error: easy to catch
try {
  const result = parseJSON(input);
} catch (error) {
  console.error(error);
}

// Asynchronous error: can be missed!
const promise = fetchData(); // No error yet
// Later... error occurs but nobody's listening!

// ✅ Properly handled
fetchData()
  .then(data => process(data))
  .catch(error => console.error(error));
```

## Why This Matters

Unhandled async errors:
- Crash Node.js processes
- Are silent in browsers (sometimes)
- Lead to inconsistent state
- Are hard to debug

## Promise Rejection

### Unhandled Rejections

```typescript
// ❌ Unhandled rejection
Promise.reject(new Error('Oops'));

// ✅ Handled
Promise.reject(new Error('Oops'))
  .catch(error => console.error(error));

// ❌ Forgotten chain
fetchData()
  .then(data => processData(data))
  // No .catch()!

// ✅ Always terminate chains
fetchData()
  .then(data => processData(data))
  .catch(error => handleError(error));
```

### Global Handlers

```typescript
// Browser
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled rejection:', event.reason);
  event.preventDefault(); // Prevent default logging
});

// Node.js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise);
  console.error('Reason:', reason);
  // Exit or handle appropriately
  process.exit(1);
});
```

## Async/Await Errors

### Try/Catch

```typescript
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
```

### Multiple Awaits

```typescript
async function loadUserData(id: string): Promise<Result<UserData, Error>> {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(id);
    const followers = await fetchFollowers(id);
    
    return ok({ user, posts, followers });
  } catch (error) {
    return err(error as Error);
  }
}
```

### Nested Try/Catch

```typescript
async function processUser(id: string): Promise<Result<void, Error>> {
  let user: User;
  
  // Critical operation
  try {
    user = await fetchUser(id);
  } catch (error) {
    return err(new Error(`Failed to fetch user: ${error}`));
  }
  
  // Optional operation
  try {
    await sendWelcomeEmail(user.email);
  } catch (error) {
    // Log but continue
    console.warn('Failed to send email:', error);
  }
  
  // Another critical operation
  try {
    await saveUser(user);
  } catch (error) {
    return err(new Error(`Failed to save user: ${error}`));
  }
  
  return ok(undefined);
}
```

## Async Result Types

```typescript
type AsyncResult<T, E> = Promise<Result<T, E>>;

async function fetchUser(id: string): AsyncResult<User, string> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return err(`HTTP error: ${response.status}`);
    }
    const user = await response.json();
    return ok(user);
  } catch (error) {
    return err('Network error');
  }
}

// Use it
const result = await fetchUser('123');
if (result.isOk()) {
  console.log(result.unwrap());
} else {
  console.error(result.unwrapErr());
}
```

## Promise Combinators

### Promise.all - Fail Fast

```typescript
// All must succeed, or entire operation fails
async function loadDashboard(): AsyncResult<Dashboard, Error> {
  try {
    const [user, posts, stats] = await Promise.all([
      fetchUser(),
      fetchPosts(),
      fetchStats()
    ]);
    
    return ok({ user, posts, stats });
  } catch (error) {
    return err(error as Error);
  }
}
```

### Promise.allSettled - Partial Success

```typescript
async function loadDashboard(): Promise<Dashboard> {
  const results = await Promise.allSettled([
    fetchUser(),
    fetchPosts(),
    fetchStats()
  ]);
  
  const user = results[0].status === 'fulfilled' 
    ? results[0].value 
    : null;
    
  const posts = results[1].status === 'fulfilled'
    ? results[1].value
    : [];
    
  const stats = results[2].status === 'fulfilled'
    ? results[2].value
    : getDefaultStats();
  
  return { user, posts, stats };
}
```

### Promise.race - First Wins

```typescript
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): AsyncResult<T, Error> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  try {
    const result = await Promise.race([promise, timeout]);
    return ok(result);
  } catch (error) {
    return err(error as Error);
  }
}
```

### Promise.any - First Success

```typescript
async function fetchFromMultipleServers(
  urls: string[]
): AsyncResult<Data, Error> {
  try {
    const data = await Promise.any(
      urls.map(url => fetch(url).then(r => r.json()))
    );
    return ok(data);
  } catch (error) {
    // All failed
    return err(new Error('All servers failed'));
  }
}
```

## Error Propagation in Chains

### Stopping Chain on Error

```typescript
fetchUser()
  .then(user => {
    if (!user.isActive) {
      throw new Error('User is inactive');
    }
    return user;
  })
  .then(user => fetchPosts(user.id))
  .then(posts => processPosts(posts))
  .catch(error => {
    // Catches errors from any step
    console.error('Chain failed:', error);
  });
```

### Continuing Despite Errors

```typescript
fetchUser()
  .catch(error => {
    console.warn('Failed to fetch user, using default');
    return DEFAULT_USER;
  })
  .then(user => fetchPosts(user.id))
  .catch(error => {
    console.warn('Failed to fetch posts, using empty');
    return [];
  })
  .then(posts => processPosts(posts));
```

## Concurrent Error Handling

```typescript
async function processUsers(
  ids: string[]
): Promise<Array<Result<User, Error>>> {
  return Promise.all(
    ids.map(async id => {
      try {
        const user = await fetchUser(id);
        return ok(user);
      } catch (error) {
        return err(error as Error);
      }
    })
  );
}

// Use it
const results = await processUsers(['1', '2', '3']);
const succeeded = results.filter(r => r.isOk()).map(r => r.unwrap());
const failed = results.filter(r => r.isErr()).map(r => r.unwrapErr());

console.log(`Succeeded: ${succeeded.length}, Failed: ${failed.length}`);
```

## Async Generators and Errors

```typescript
async function* fetchPages(
  startPage: number = 1
): AsyncGenerator<Page, void, undefined> {
  let page = startPage;
  
  while (true) {
    try {
      const response = await fetch(`/api/pages/${page}`);
      if (!response.ok) {
        if (response.status === 404) {
          return; // End of pages
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      yield data;
      page++;
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error);
      throw error; // Propagate to consumer
    }
  }
}

// Use it
try {
  for await (const page of fetchPages()) {
    processPage(page);
  }
} catch (error) {
  console.error('Pagination failed:', error);
}
```

## Cleanup with Finally

```typescript
async function processFile(path: string): Promise<void> {
  const file = await openFile(path);
  
  try {
    await processContent(file);
  } finally {
    // Always runs, even if error
    await closeFile(file);
  }
}
```

## Async Error Boundaries

### Custom Error Boundary

```typescript
async function withErrorBoundary<T>(
  fn: () => Promise<T>,
  onError: (error: Error) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    onError(error as Error);
    return null;
  }
}

// Use it
const user = await withErrorBoundary(
  () => fetchUser('123'),
  error => logError('User fetch failed', error)
);
```

### Retry Boundary

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<Result<T, Error>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return ok(result);
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        await sleep(1000 * attempt); // Backoff
      }
    }
  }
  
  return err(lastError!);
}
```

## Testing Async Errors

```typescript
describe('async error handling', () => {
  it('should handle fetch errors', async () => {
    const result = await fetchUser('invalid');
    
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toContain('not found');
  });
  
  it('should timeout after 5 seconds', async () => {
    const slowFetch = new Promise(resolve => 
      setTimeout(resolve, 10000)
    );
    
    const result = await fetchWithTimeout(slowFetch, 5000);
    
    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toBe('Timeout');
  });
  
  it('should handle multiple failures', async () => {
    const results = await processUsers(['1', '2', 'invalid']);
    
    const failed = results.filter(r => r.isErr());
    expect(failed).toHaveLength(1);
  });
});
```

## Common Async Error Patterns

### Loading State

```typescript
interface LoadingState<T> {
  loading: boolean;
  data: T | null;
  error: Error | null;
}

async function loadData<T>(
  setState: (state: LoadingState<T>) => void,
  fetch: () => Promise<T>
): Promise<void> {
  setState({ loading: true, data: null, error: null });
  
  try {
    const data = await fetch();
    setState({ loading: false, data, error: null });
  } catch (error) {
    setState({ loading: false, data: null, error: error as Error });
  }
}
```

### Cancellable Operations

```typescript
class CancellableOperation<T> {
  private cancelled = false;
  
  cancel(): void {
    this.cancelled = true;
  }
  
  async execute(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const result = await fn();
      
      if (this.cancelled) {
        return err(new Error('Operation cancelled'));
      }
      
      return ok(result);
    } catch (error) {
      return err(error as Error);
    }
  }
}

// Use it
const operation = new CancellableOperation();
const promise = operation.execute(() => fetchData());

// Cancel if needed
setTimeout(() => operation.cancel(), 1000);
```

## Best Practices

1. **Always handle rejections**
```typescript
// ✅ Good
fetchData().catch(handleError);

// ❌ Bad
fetchData(); // Unhandled!
```

2. **Use async/await with try/catch**
```typescript
try {
  const data = await fetchData();
} catch (error) {
  handleError(error);
}
```

3. **Return Result types**
```typescript
async function fetch(): AsyncResult<Data, Error> {
  try {
    return ok(await getData());
  } catch (error) {
    return err(error);
  }
}
```

4. **Clean up in finally**
```typescript
try {
  await operation();
} finally {
  await cleanup();
}
```

5. **Set up global handlers**
```typescript
process.on('unhandledRejection', handleUnhandled);
```

## The Mind-Shift

**Before understanding async errors:**
- Forget to handle promises
- Miss rejection handling
- Confused by async errors

**After:**
- Always handle promises
- Use Result types
- Clear async error strategy

## Summary

**Async Errors**:
- Promises can reject
- Always add .catch() or try/catch
- Use Result types for clarity
- Set up global handlers
- Clean up in finally

**Key insight**: *Async errors are just as important as sync errors—handle them explicitly or they'll surprise you later.*

---

**Next**: [Railway-Oriented Programming](../08-railway-programming.md)
