# Async Testing

> *"Asynchronous code is harder to test, but testing it is even more important."*

## What Is Async Testing?

**Async testing** involves verifying code that uses Promises, async/await, callbacks, or other asynchronous patterns. This includes API calls, database operations, timers, and event handlers.

```typescript
// Async function to test
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('User not found');
  }
  return response.json();
}

// Async test
test('fetches user by ID', async () => {
  const user = await fetchUser('123');
  expect(user.id).toBe('123');
});
```

## Why This Matters

Async testing ensures:
- **Correct timing**: Operations complete in right order
- **Error handling**: Failures are caught properly
- **Race conditions**: Concurrent operations don't conflict
- **Timeouts**: Operations don't hang forever
- **Cleanup**: Resources are released properly

## Testing Promises

### Basic Promise Testing

```typescript
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Using async/await
test('delays execution', async () => {
  const start = Date.now();
  await delay(100);
  const elapsed = Date.now() - start;
  
  expect(elapsed).toBeGreaterThanOrEqual(100);
});

// Using return
test('delays execution', () => {
  return delay(100).then(() => {
    // Assertions
  });
});

// Using resolves/rejects
test('resolves after delay', async () => {
  await expect(delay(100)).resolves.toBeUndefined();
});
```

### Testing Resolved Values

```typescript
async function getUserName(id: string): Promise<string> {
  const user = await fetchUser(id);
  return user.name;
}

test('returns user name', async () => {
  const name = await getUserName('123');
  expect(name).toBe('Alice');
});

// Or with resolves
test('returns user name', async () => {
  await expect(getUserName('123')).resolves.toBe('Alice');
});
```

### Testing Rejected Promises

```typescript
async function validateAge(age: number): Promise<void> {
  if (age < 0) {
    throw new Error('Age cannot be negative');
  }
  if (age > 150) {
    throw new Error('Age too high');
  }
}

test('throws for negative age', async () => {
  await expect(validateAge(-1)).rejects.toThrow('Age cannot be negative');
});

test('throws for age over 150', async () => {
  await expect(validateAge(200)).rejects.toThrow('Age too high');
});

// Or with try/catch
test('throws for negative age', async () => {
  try {
    await validateAge(-1);
    fail('Should have thrown');
  } catch (error) {
    expect(error.message).toBe('Age cannot be negative');
  }
});
```

## Testing Async/Await

### Sequential Operations

```typescript
async function createUserFlow(email: string): Promise<User> {
  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await logUserCreation(user);
  return user;
}

test('creates user and sends email', async () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' });
  const mockEmail = vi.fn().mockResolvedValue(undefined);
  const mockLog = vi.fn().mockResolvedValue(undefined);
  
  // ... (inject mocks)
  
  const user = await createUserFlow('test@example.com');
  
  expect(mockCreate).toHaveBeenCalled();
  expect(mockEmail).toHaveBeenCalledWith(user);
  expect(mockLog).toHaveBeenCalledWith(user);
});
```

### Parallel Operations

```typescript
async function loadDashboard(userId: string): Promise<Dashboard> {
  const [user, orders, notifications] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchNotifications(userId)
  ]);
  
  return { user, orders, notifications };
}

test('loads dashboard data in parallel', async () => {
  const dashboard = await loadDashboard('123');
  
  expect(dashboard.user).toBeDefined();
  expect(dashboard.orders).toBeInstanceOf(Array);
  expect(dashboard.notifications).toBeInstanceOf(Array);
});
```

### Error Handling

```typescript
async function robustOperation(): Promise<string> {
  try {
    return await riskyOperation();
  } catch (error) {
    return 'fallback';
  }
}

test('returns fallback on error', async () => {
  const mockRisky = vi.fn().mockRejectedValue(new Error('Failed'));
  
  // ... (inject mock)
  
  const result = await robustOperation();
  expect(result).toBe('fallback');
});
```

## Testing Timers

### Using Fake Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('executes after delay', () => {
  const callback = vi.fn();
  
  setTimeout(callback, 1000);
  
  expect(callback).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalled();
});

test('executes all timers', () => {
  const callback = vi.fn();
  
  setTimeout(callback, 1000);
  setTimeout(callback, 2000);
  
  vi.runAllTimers();
  
  expect(callback).toHaveBeenCalledTimes(2);
});
```

### Testing Debounce

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

test('debounces function calls', () => {
  vi.useFakeTimers();
  const fn = vi.fn();
  const debounced = debounce(fn, 100);
  
  debounced('a');
  debounced('b');
  debounced('c');
  
  expect(fn).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(100);
  
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith('c');
  
  vi.useRealTimers();
});
```

### Testing Throttle

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

test('throttles function calls', () => {
  vi.useFakeTimers();
  const fn = vi.fn();
  const throttled = throttle(fn, 100);
  
  throttled('a');
  expect(fn).toHaveBeenCalledTimes(1);
  
  vi.advanceTimersByTime(50);
  throttled('b');
  expect(fn).toHaveBeenCalledTimes(1); // Still 1
  
  vi.advanceTimersByTime(50);
  throttled('c');
  expect(fn).toHaveBeenCalledTimes(2); // Now 2
  
  vi.useRealTimers();
});
```

## Testing Retries

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
    }
  }
  throw new Error('Unreachable');
}

test('retries on failure', async () => {
  const mock = vi.fn()
    .mockRejectedValueOnce(new Error('Fail 1'))
    .mockRejectedValueOnce(new Error('Fail 2'))
    .mockResolvedValueOnce('Success');
  
  const result = await retry(mock, 3);
  
  expect(result).toBe('Success');
  expect(mock).toHaveBeenCalledTimes(3);
});

test('throws after max attempts', async () => {
  const mock = vi.fn().mockRejectedValue(new Error('Always fails'));
  
  await expect(retry(mock, 3)).rejects.toThrow('Always fails');
  expect(mock).toHaveBeenCalledTimes(3);
});
```

## Testing Concurrent Operations

### Promise.all

```typescript
async function fetchAllUsers(ids: string[]): Promise<User[]> {
  const promises = ids.map(id => fetchUser(id));
  return Promise.all(promises);
}

test('fetches all users in parallel', async () => {
  const mockFetch = vi.fn()
    .mockResolvedValueOnce({ id: '1', name: 'Alice' })
    .mockResolvedValueOnce({ id: '2', name: 'Bob' })
    .mockResolvedValueOnce({ id: '3', name: 'Charlie' });
  
  // ... (inject mock)
  
  const users = await fetchAllUsers(['1', '2', '3']);
  
  expect(users).toHaveLength(3);
  expect(mockFetch).toHaveBeenCalledTimes(3);
});

test('fails if any promise rejects', async () => {
  const mockFetch = vi.fn()
    .mockResolvedValueOnce({ id: '1', name: 'Alice' })
    .mockRejectedValueOnce(new Error('Failed'))
    .mockResolvedValueOnce({ id: '3', name: 'Charlie' });
  
  // ... (inject mock)
  
  await expect(fetchAllUsers(['1', '2', '3'])).rejects.toThrow('Failed');
});
```

### Promise.allSettled

```typescript
async function fetchUsersWithFallback(ids: string[]): Promise<User[]> {
  const promises = ids.map(id => fetchUser(id));
  const results = await Promise.allSettled(promises);
  
  return results
    .filter((r): r is PromiseFulfilledResult<User> => r.status === 'fulfilled')
    .map(r => r.value);
}

test('returns successful results only', async () => {
  const mockFetch = vi.fn()
    .mockResolvedValueOnce({ id: '1', name: 'Alice' })
    .mockRejectedValueOnce(new Error('Failed'))
    .mockResolvedValueOnce({ id: '3', name: 'Charlie' });
  
  // ... (inject mock)
  
  const users = await fetchUsersWithFallback(['1', '2', '3']);
  
  expect(users).toHaveLength(2);
  expect(users.map(u => u.id)).toEqual(['1', '3']);
});
```

### Promise.race

```typescript
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

test('resolves if promise completes in time', async () => {
  const promise = new Promise(resolve =>
    setTimeout(() => resolve('Success'), 100)
  );
  
  await expect(fetchWithTimeout(promise, 200)).resolves.toBe('Success');
});

test('rejects on timeout', async () => {
  const promise = new Promise(resolve =>
    setTimeout(() => resolve('Success'), 200)
  );
  
  await expect(fetchWithTimeout(promise, 100)).rejects.toThrow('Timeout');
});
```

## Testing Event Emitters

```typescript
import { EventEmitter } from 'events';

class OrderProcessor extends EventEmitter {
  async processOrder(order: Order): Promise<void> {
    this.emit('started', order);
    
    try {
      await this.validateOrder(order);
      this.emit('validated', order);
      
      await this.chargeCustomer(order);
      this.emit('charged', order);
      
      await this.shipOrder(order);
      this.emit('completed', order);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

test('emits events during processing', async () => {
  const processor = new OrderProcessor();
  const events: string[] = [];
  
  processor.on('started', () => events.push('started'));
  processor.on('validated', () => events.push('validated'));
  processor.on('charged', () => events.push('charged'));
  processor.on('completed', () => events.push('completed'));
  
  await processor.processOrder({ id: '1', amount: 100 });
  
  expect(events).toEqual(['started', 'validated', 'charged', 'completed']);
});

test('emits error event on failure', async () => {
  const processor = new OrderProcessor();
  const errorHandler = vi.fn();
  
  processor.on('error', errorHandler);
  
  // ... (mock to cause failure)
  
  await expect(processor.processOrder({ id: '1', amount: 100 }))
    .rejects.toThrow();
  
  expect(errorHandler).toHaveBeenCalled();
});
```

## Testing Async Generators

```typescript
async function* fetchPages(baseUrl: string): AsyncGenerator<Page> {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${baseUrl}?page=${page}`);
    const data = await response.json();
    
    yield data;
    
    hasMore = data.hasMore;
    page++;
  }
}

test('yields all pages', async () => {
  const mockFetch = vi.fn()
    .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [1, 2], hasMore: true }) })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [3, 4], hasMore: true }) })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ data: [5], hasMore: false }) });
  
  global.fetch = mockFetch;
  
  const pages: Page[] = [];
  for await (const page of fetchPages('/api/items')) {
    pages.push(page);
  }
  
  expect(pages).toHaveLength(3);
  expect(mockFetch).toHaveBeenCalledTimes(3);
});
```

## Testing Cleanup

```typescript
class Connection {
  private socket: any;
  
  async connect(): Promise<void> {
    this.socket = await openSocket();
  }
  
  async disconnect(): Promise<void> {
    await this.socket.close();
  }
}

test('cleans up connection', async () => {
  const connection = new Connection();
  const mockClose = vi.fn();
  
  await connection.connect();
  connection.socket = { close: mockClose };
  
  await connection.disconnect();
  
  expect(mockClose).toHaveBeenCalled();
});

test('handles cleanup in finally', async () => {
  const connection = new Connection();
  const mockClose = vi.fn();
  connection.socket = { close: mockClose };
  
  try {
    await doSomethingThatMightFail();
  } finally {
    await connection.disconnect();
  }
  
  expect(mockClose).toHaveBeenCalled();
});
```

## Common Patterns

### Waiting for Conditions

```typescript
async function waitFor(
  condition: () => boolean,
  timeout: number = 1000
): Promise<void> {
  const start = Date.now();
  
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

test('waits for condition', async () => {
  let ready = false;
  setTimeout(() => { ready = true; }, 100);
  
  await waitFor(() => ready, 200);
  
  expect(ready).toBe(true);
});
```

### Async Polling

```typescript
async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  interval: number = 100,
  timeout: number = 1000
): Promise<T> {
  const start = Date.now();
  
  while (true) {
    const result = await fn();
    if (predicate(result)) return result;
    
    if (Date.now() - start > timeout) {
      throw new Error('Polling timeout');
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

test('polls until condition met', async () => {
  let count = 0;
  const fn = async () => ++count;
  
  const result = await pollUntil(fn, n => n >= 3, 10, 1000);
  
  expect(result).toBe(3);
});
```

## Common Pitfalls

### Forgetting to await

```typescript
// ❌ Bad: Not awaiting async function
test('creates user', () => {
  createUser('alice@example.com'); // Promise ignored!
  expect(userCount).toBe(1); // Fails!
});

// ✅ Good: Awaiting async function
test('creates user', async () => {
  await createUser('alice@example.com');
  expect(userCount).toBe(1);
});
```

### Not returning Promise

```typescript
// ❌ Bad: Promise not returned
test('fetches data', () => {
  fetchData().then(data => {
    expect(data).toBeDefined();
  });
  // Test completes before promise resolves!
});

// ✅ Good: Returning promise
test('fetches data', () => {
  return fetchData().then(data => {
    expect(data).toBeDefined();
  });
});

// ✅ Better: Using async/await
test('fetches data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Race Conditions in Tests

```typescript
// ❌ Bad: Race condition
test('updates counter', async () => {
  updateCounter(); // Async but not awaited
  expect(getCounter()).toBe(1); // Might fail!
});

// ✅ Good: Proper sequencing
test('updates counter', async () => {
  await updateCounter();
  expect(getCounter()).toBe(1);
});
```

## Best Practices

### 1. Always await or return Promises

```typescript
// ✅ Await
test('example', async () => {
  await asyncOperation();
});

// ✅ Return
test('example', () => {
  return asyncOperation();
});
```

### 2. Use Fake Timers for Time-Dependent Code

```typescript
// ✅ Fast test with fake timers
test('delays execution', () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  
  setTimeout(callback, 5000);
  vi.advanceTimersByTime(5000);
  
  expect(callback).toHaveBeenCalled();
  vi.useRealTimers();
});
```

### 3. Test Both Success and Failure

```typescript
test('succeeds with valid input', async () => {
  await expect(process(validInput)).resolves.toBeDefined();
});

test('fails with invalid input', async () => {
  await expect(process(invalidInput)).rejects.toThrow();
});
```

### 4. Cleanup After Tests

```typescript
afterEach(async () => {
  await closeConnections();
  await clearDatabase();
  vi.clearAllMocks();
});
```

## The Mind-Shift

**Before async testing:**
- Flaky tests
- Race conditions
- Unclear failures
- Slow tests

**After:**
- Reliable async tests
- Controlled timing
- Clear error messages
- Fast with fake timers

## Summary

**Async Testing Essentials**:
- Always await or return Promises
- Use fake timers for time-dependent code
- Test concurrent operations
- Handle cleanup properly
- Test both success and failure paths

**Key insight**: *Async testing requires careful attention to timing and sequencing—use async/await consistently, control time with fake timers, and ensure proper cleanup to create reliable async tests.*

---

**Next**: [Integration Testing](../06-integration-testing.md)
