# Error Recovery

> *"Errors are not the end—they're opportunities to recover."*

## What Is It?

**Error recovery** is the ability to handle errors gracefully and continue operating, rather than crashing. It's about making systems resilient.

```typescript
// ❌ No recovery: crash on error
const data = await fetchData();

// ✅ With recovery: fallback on error
const data = await fetchData().catch(() => loadFromCache());
```

## Why This Matters

Systems fail. Networks drop. Disks fill. Recovery strategies:
- Keep the system running
- Provide degraded service
- Give users options
- Log for later analysis

## Recovery Strategies

### 1. Fallback Values

```typescript
function getUserPreference(key: string): string {
  return loadPreference(key)
    .unwrapOr(DEFAULT_PREFERENCES[key]);
}

// With Result type
function fetchUserData(id: string): Result<UserData, Error> {
  return fetchFromAPI(id)
    .orElse(() => fetchFromCache(id))
    .orElse(() => ok(DEFAULT_USER_DATA));
}
```

### 2. Retry with Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Result<T, Error>> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return ok(result);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return err(error as Error);
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await sleep(delay);
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries}`);
    }
  }
  
  return err(new Error('Max retries exceeded'));
}

// Use it
const data = await fetchWithRetry(() => fetch('/api/data'));
```

### 3. Circuit Breaker

```typescript
class CircuitBreaker<T> {
  private failureCount = 0;
  private lastFailureTime?: number;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute(fn: () => Promise<T>): Promise<Result<T, Error>> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = 'half-open';
        this.failureCount = 0;
      } else {
        return err(new Error('Circuit breaker is open'));
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return ok(result);
    } catch (error) {
      this.onFailure();
      return err(error as Error);
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened');
    }
  }
}

// Use it
const breaker = new CircuitBreaker<UserData>();

async function getUser(id: string): Promise<Result<UserData, Error>> {
  return breaker.execute(() => fetchUser(id));
}
```

### 4. Graceful Degradation

```typescript
interface FullUserProfile {
  user: User;
  posts: Post[];
  followers: User[];
  recommendations: Post[];
}

interface DegradedProfile {
  user: User;
  posts?: Post[];
  followers?: User[];
  recommendations?: Post[];
  degraded: true;
  errors: string[];
}

type UserProfile = FullUserProfile | DegradedProfile;

async function getUserProfile(id: string): Promise<UserProfile> {
  const errors: string[] = [];
  
  // Critical: Must succeed
  const user = await getUser(id);
  if (user.isErr()) {
    throw new Error('Cannot load profile: user not found');
  }
  
  // Optional: Degrade gracefully
  const posts = await getPosts(id).catch(err => {
    errors.push('Failed to load posts');
    return null;
  });
  
  const followers = await getFollowers(id).catch(err => {
    errors.push('Failed to load followers');
    return null;
  });
  
  const recommendations = await getRecommendations(id).catch(err => {
    errors.push('Failed to load recommendations');
    return null;
  });
  
  if (errors.length > 0) {
    return {
      user: user.unwrap(),
      posts: posts ?? undefined,
      followers: followers ?? undefined,
      recommendations: recommendations ?? undefined,
      degraded: true,
      errors
    };
  }
  
  return {
    user: user.unwrap(),
    posts: posts!,
    followers: followers!,
    recommendations: recommendations!
  };
}
```

### 5. Compensating Actions

```typescript
class Transaction {
  private actions: Array<() => Promise<void>> = [];
  private compensations: Array<() => Promise<void>> = [];
  
  async execute<T>(
    action: () => Promise<T>,
    compensation: () => Promise<void>
  ): Promise<T> {
    const result = await action();
    this.compensations.unshift(compensation); // Add to front
    return result;
  }
  
  async commit(): Promise<void> {
    // Clear compensations on success
    this.compensations = [];
  }
  
  async rollback(): Promise<void> {
    console.log('Rolling back transaction...');
    
    for (const compensation of this.compensations) {
      try {
        await compensation();
      } catch (error) {
        console.error('Compensation failed:', error);
      }
    }
    
    this.compensations = [];
  }
}

async function bookFlight(): Promise<Result<Booking, Error>> {
  const tx = new Transaction();
  
  try {
    // Reserve seat
    const seat = await tx.execute(
      () => reserveSeat('12A'),
      () => releaseSeat('12A')
    );
    
    // Charge payment
    const payment = await tx.execute(
      () => chargeCard(299.99),
      () => refundCard(299.99)
    );
    
    // Send confirmation
    const confirmation = await tx.execute(
      () => sendEmail('Booking confirmed'),
      () => sendEmail('Booking cancelled')
    );
    
    await tx.commit();
    
    return ok({ seat, payment, confirmation });
  } catch (error) {
    await tx.rollback();
    return err(error as Error);
  }
}
```

## Timeout and Cancellation

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<Result<T, Error>> {
  return Promise.race([
    promise.then(value => ok(value)),
    sleep(timeoutMs).then(() => err(new Error('Operation timed out')))
  ]);
}

// Use it
const result = await withTimeout(
  fetchData(),
  5000 // 5 second timeout
);

if (result.isErr()) {
  console.error('Timed out, using cached data');
  return getCachedData();
}
```

### With AbortController

```typescript
async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Result<Response, Error>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return ok(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      return err(new Error('Request timed out'));
    }
    return err(error as Error);
  }
}
```

## Partial Success

```typescript
interface BatchResult<T, E> {
  succeeded: T[];
  failed: Array<{ error: E; index: number }>;
}

async function batchProcess<T, E>(
  items: T[],
  process: (item: T) => Promise<Result<void, E>>
): Promise<BatchResult<T, E>> {
  const results = await Promise.allSettled(
    items.map(item => process(item))
  );
  
  const succeeded: T[] = [];
  const failed: Array<{ error: E; index: number }> = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.isOk()) {
      succeeded.push(items[index]);
    } else {
      const error = result.status === 'fulfilled'
        ? result.value.unwrapErr()
        : result.reason;
      failed.push({ error, index });
    }
  });
  
  return { succeeded, failed };
}

// Use it
const result = await batchProcess(
  users,
  user => sendEmail(user.email, 'Welcome!')
);

console.log(`Sent ${result.succeeded.length} emails`);
console.log(`Failed: ${result.failed.length}`);

// Retry failed ones
for (const { error, index } of result.failed) {
  console.error(`Failed to send to ${users[index].email}:`, error);
  await retryLater(users[index]);
}
```

## Health Checks

```typescript
interface HealthStatus {
  healthy: boolean;
  services: Record<string, boolean>;
  timestamp: Date;
}

class HealthChecker {
  private statuses = new Map<string, boolean>();
  
  async check(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkExternalAPI()
    ]);
    
    const services = {
      database: checks[0].status === 'fulfilled' && checks[0].value,
      cache: checks[1].status === 'fulfilled' && checks[1].value,
      externalAPI: checks[2].status === 'fulfilled' && checks[2].value
    };
    
    const healthy = Object.values(services).every(status => status);
    
    return {
      healthy,
      services,
      timestamp: new Date()
    };
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      await database.ping();
      return true;
    } catch {
      return false;
    }
  }
  
  private async checkCache(): Promise<boolean> {
    try {
      await cache.ping();
      return true;
    } catch {
      return false;
    }
  }
  
  private async checkExternalAPI(): Promise<boolean> {
    try {
      const response = await fetch('https://api.example.com/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

## Recovery Examples

### File Operations

```typescript
async function saveFile(
  path: string,
  data: string
): Promise<Result<void, Error>> {
  // Try to save
  const result = await writeFile(path, data);
  if (result.isOk()) {
    return result;
  }
  
  // Recovery: Try backup location
  console.warn('Primary save failed, trying backup');
  const backup = await writeFile(`${path}.backup`, data);
  if (backup.isOk()) {
    return ok(undefined);
  }
  
  // Recovery: Save to temp and notify
  console.error('Backup save failed, using temp');
  await writeFile(`/tmp/recovery-${Date.now()}`, data);
  await notifyAdmin('File save failed, data in temp');
  
  return err(new Error('All save attempts failed'));
}
```

### API Calls

```typescript
async function callAPI<T>(endpoint: string): Promise<Result<T, Error>> {
  // Try primary
  let result = await fetch(endpoint);
  if (result.isOk()) {
    return result;
  }
  
  // Try secondary region
  result = await fetch(endpoint.replace('.com', '.eu'));
  if (result.isOk()) {
    return result;
  }
  
  // Use cached response
  const cached = await getFromCache(endpoint);
  if (cached) {
    console.warn('Using cached response');
    return ok(cached);
  }
  
  return err(new Error('All API attempts failed'));
}
```

## Best Practices

1. **Have a recovery plan**
```typescript
// Always know what to do on failure
.catch(() => loadFromCache())
```

2. **Log recovery attempts**
```typescript
console.warn('Primary failed, trying fallback');
```

3. **Set limits**
```typescript
// Don't retry forever
fetchWithRetry(fn, maxRetries: 3)
```

4. **Fail fast when appropriate**
```typescript
// If recovery is impossible, fail immediately
if (criticalServiceDown) {
  throw new Error('Cannot continue');
}
```

5. **Monitor recovery rates**
```typescript
metrics.recordRecovery('cache_fallback');
```

## The Mind-Shift

**Before understanding recovery:**
- Errors = failure
- No fallbacks
- Crash on error

**After:**
- Errors = opportunities
- Multiple strategies
- Resilient systems

## Summary

**Error Recovery**:
- Fallback values
- Retry with backoff
- Circuit breakers
- Graceful degradation
- Compensating actions

**Key insight**: *Errors don't have to be fatal—with proper recovery strategies, systems can continue operating despite failures.*

---

**Next**: [Async Errors](../07-async-errors.md)
