# Mocking

> *"Mocks aren't stubs."* — Martin Fowler

## What Is Mocking?

**Mocking** is the practice of replacing real dependencies with test doubles that simulate their behavior. This allows testing code in isolation without relying on databases, APIs, file systems, or other external dependencies.

```typescript
// Real dependency
class EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // Actually sends email via SMTP
  }
}

// Mock for testing
const mockEmailService = {
  send: vi.fn().mockResolvedValue(undefined)
};

// Use in test
test('sends welcome email', async () => {
  const userService = new UserService(mockEmailService);
  await userService.register('user@example.com');
  
  expect(mockEmailService.send).toHaveBeenCalledWith(
    'user@example.com',
    'Welcome!',
    'Thanks for joining'
  );
});
```

## Why This Matters

Mocking provides:
- **Isolation**: Test one component without dependencies
- **Speed**: Avoid slow I/O operations
- **Control**: Simulate edge cases and errors
- **Reliability**: Tests don't depend on external services
- **Focus**: Verify behavior, not implementation

## Types of Test Doubles

### Dummy

Objects passed around but never used:

```typescript
interface Logger {
  log(message: string): void;
}

// Dummy - just satisfies the interface
const dummyLogger: Logger = {
  log: () => {}
};

// Used when logger isn't actually tested
const service = new UserService(database, dummyLogger);
```

### Stub

Provides predetermined responses:

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// Stub - returns fixed data
const stubRepository: UserRepository = {
  findById: async (id: string) => ({
    id,
    name: 'Test User',
    email: 'test@example.com'
  })
};

test('gets user by ID', async () => {
  const service = new UserService(stubRepository);
  const user = await service.getUser('123');
  
  expect(user.name).toBe('Test User');
});
```

### Spy

Records how it was called:

```typescript
const spy = vi.spyOn(console, 'log');

doSomething();

expect(spy).toHaveBeenCalledWith('Hello, World!');
expect(spy).toHaveBeenCalledTimes(1);

spy.mockRestore(); // Restore original
```

### Mock

Pre-programmed with expectations:

```typescript
const mockEmailService = {
  send: vi.fn()
};

await userService.register('user@example.com');

expect(mockEmailService.send).toHaveBeenCalledWith(
  'user@example.com',
  'Welcome!',
  expect.any(String)
);
```

### Fake

Working implementation but simplified:

```typescript
class FakeDatabase implements Database {
  private data = new Map<string, any>();
  
  async save(id: string, data: any): Promise<void> {
    this.data.set(id, data);
  }
  
  async find(id: string): Promise<any> {
    return this.data.get(id);
  }
  
  async clear(): Promise<void> {
    this.data.clear();
  }
}

// Use in tests
const fakeDb = new FakeDatabase();
const service = new UserService(fakeDb);
```

## Creating Mocks with Vitest

### Basic Mocks

```typescript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();

mockFn('hello');
mockFn('world');

expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('hello');
expect(mockFn).toHaveBeenLastCalledWith('world');
```

### Mock Return Values

```typescript
const mock = vi.fn();

// Single return value
mock.mockReturnValue(42);
expect(mock()).toBe(42);

// Different values per call
mock.mockReturnValueOnce(1)
    .mockReturnValueOnce(2)
    .mockReturnValue(3);

expect(mock()).toBe(1);
expect(mock()).toBe(2);
expect(mock()).toBe(3);
expect(mock()).toBe(3); // All subsequent calls
```

### Mock Async Functions

```typescript
const mockAsync = vi.fn();

// Resolved value
mockAsync.mockResolvedValue({ id: '1', name: 'Alice' });
await expect(mockAsync()).resolves.toEqual({ id: '1', name: 'Alice' });

// Rejected value
mockAsync.mockRejectedValue(new Error('Failed'));
await expect(mockAsync()).rejects.toThrow('Failed');

// Sequence of resolved values
mockAsync
  .mockResolvedValueOnce({ id: '1' })
  .mockResolvedValueOnce({ id: '2' });
```

### Mock Implementations

```typescript
const mock = vi.fn();

// Custom implementation
mock.mockImplementation((a, b) => a + b);
expect(mock(2, 3)).toBe(5);

// Once
mock.mockImplementationOnce(() => 'first')
    .mockImplementationOnce(() => 'second');

expect(mock()).toBe('first');
expect(mock()).toBe('second');
```

## Mocking Modules

### Auto-mocking

```typescript
// __mocks__/emailService.ts
export const send = vi.fn();

// test.ts
vi.mock('./emailService');
import { send } from './emailService';

test('sends email', async () => {
  await userService.register('user@example.com');
  expect(send).toHaveBeenCalled();
});
```

### Manual Mocks

```typescript
vi.mock('./database', () => ({
  Database: vi.fn().mockImplementation(() => ({
    find: vi.fn().mockResolvedValue({ id: '1', name: 'Alice' }),
    save: vi.fn().mockResolvedValue(undefined)
  }))
}));
```

### Partial Mocks

```typescript
import * as utils from './utils';

vi.spyOn(utils, 'getCurrentTime').mockReturnValue(new Date('2024-01-01'));

// Other functions in utils still work normally
expect(utils.getCurrentTime()).toEqual(new Date('2024-01-01'));
expect(utils.formatDate(new Date())).toBe('...');
```

## Dependency Injection for Testability

### Constructor Injection

```typescript
interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

class UserService {
  constructor(
    private emailSender: EmailSender
  ) {}
  
  async register(email: string): Promise<User> {
    const user = await this.createUser(email);
    await this.emailSender.send(email, 'Welcome!', 'Thanks for joining');
    return user;
  }
}

// Test
const mockEmailSender: EmailSender = {
  send: vi.fn()
};

const service = new UserService(mockEmailSender);
```

### Factory Pattern

```typescript
type EmailSenderFactory = () => EmailSender;

class UserService {
  constructor(
    private createEmailSender: EmailSenderFactory
  ) {}
  
  async register(email: string): Promise<User> {
    const emailSender = this.createEmailSender();
    // ...
  }
}

// Test
const service = new UserService(() => mockEmailSender);
```

### Property Injection

```typescript
class UserService {
  emailSender: EmailSender = new RealEmailSender();
  
  async register(email: string): Promise<User> {
    await this.emailSender.send(/*...*/);
  }
}

// Test
const service = new UserService();
service.emailSender = mockEmailSender;
```

## Mocking Patterns

### Spy on Real Objects

```typescript
const logger = new Logger();
const spy = vi.spyOn(logger, 'log');

service.doSomething();

expect(spy).toHaveBeenCalledWith('Operation completed');
spy.mockRestore();
```

### Mock Chaining

```typescript
const mockBuilder = {
  withName: vi.fn().mockReturnThis(),
  withEmail: vi.fn().mockReturnThis(),
  build: vi.fn().mockReturnValue({ id: '1', name: 'Alice' })
};

const user = mockBuilder
  .withName('Alice')
  .withEmail('alice@example.com')
  .build();

expect(mockBuilder.withName).toHaveBeenCalledWith('Alice');
expect(mockBuilder.build).toHaveBeenCalled();
```

### Conditional Mocks

```typescript
const mockDb = {
  find: vi.fn().mockImplementation(async (id: string) => {
    if (id === 'exists') {
      return { id, name: 'Alice' };
    }
    return null;
  })
};

await expect(mockDb.find('exists')).resolves.toBeDefined();
await expect(mockDb.find('missing')).resolves.toBeNull();
```

## Testing with Mocks

### Verify Calls

```typescript
test('calls email service with correct arguments', async () => {
  const mock = vi.fn();
  const service = new UserService({ send: mock });
  
  await service.register('user@example.com');
  
  // Called at all
  expect(mock).toHaveBeenCalled();
  
  // Called with specific args
  expect(mock).toHaveBeenCalledWith(
    'user@example.com',
    'Welcome!',
    expect.any(String)
  );
  
  // Called exact number of times
  expect(mock).toHaveBeenCalledTimes(1);
  
  // Called in order
  expect(mock).toHaveBeenNthCalledWith(1, 'user@example.com', 'Welcome!', expect.any(String));
});
```

### Verify Call Order

```typescript
test('saves user before sending email', async () => {
  const mockDb = { save: vi.fn() };
  const mockEmail = { send: vi.fn() };
  
  const service = new UserService(mockDb, mockEmail);
  await service.register('user@example.com');
  
  expect(mockDb.save).toHaveBeenCalled();
  expect(mockEmail.send).toHaveBeenCalled();
  
  // Verify order
  const dbCall = mockDb.save.mock.invocationCallOrder[0];
  const emailCall = mockEmail.send.mock.invocationCallOrder[0];
  expect(dbCall).toBeLessThan(emailCall);
});
```

### Reset Mocks

```typescript
describe('UserService', () => {
  const mock = vi.fn();
  
  beforeEach(() => {
    mock.mockClear(); // Clear call history
    // mock.mockReset(); // Clear + remove return value/implementation
    // mock.mockRestore(); // Clear + restore original (for spies)
  });
  
  test('first test', () => {
    mock();
    expect(mock).toHaveBeenCalledTimes(1);
  });
  
  test('second test', () => {
    // Mock is cleared, so count starts at 0
    mock();
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
```

## Advanced Mocking

### Mocking Time

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('delays execution', () => {
  const callback = vi.fn();
  
  setTimeout(callback, 1000);
  
  expect(callback).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalled();
});

test('sets specific time', () => {
  const now = new Date('2024-01-01');
  vi.setSystemTime(now);
  
  expect(new Date().toISOString()).toBe(now.toISOString());
});
```

### Mocking Modules

```typescript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

// test.ts
vi.mock('./math', () => ({
  add: vi.fn((a, b) => a + b), // Keep implementation
  multiply: vi.fn(() => 999)    // Mock implementation
}));

import { add, multiply } from './math';

test('mocked multiply', () => {
  expect(add(2, 3)).toBe(5);      // Real
  expect(multiply(2, 3)).toBe(999); // Mocked
});
```

### Mocking Classes

```typescript
class Database {
  async connect(): Promise<void> {
    // Connect to real database
  }
  
  async query(sql: string): Promise<any[]> {
    // Execute query
  }
}

// Mock the class
vi.mock('./database', () => {
  return {
    Database: vi.fn().mockImplementation(() => ({
      connect: vi.fn(),
      query: vi.fn().mockResolvedValue([{ id: 1 }])
    }))
  };
});

test('uses database', async () => {
  const db = new Database();
  await db.connect();
  const results = await db.query('SELECT * FROM users');
  
  expect(db.connect).toHaveBeenCalled();
  expect(results).toEqual([{ id: 1 }]);
});
```

## Common Pitfalls

### Over-mocking

```typescript
// ❌ Bad: Mocking everything
test('processes order', async () => {
  const mockInventory = { check: vi.fn(), reserve: vi.fn() };
  const mockPayment = { charge: vi.fn() };
  const mockShipping = { ship: vi.fn() };
  const mockEmail = { send: vi.fn() };
  
  // Test becomes coupled to implementation
});

// ✅ Good: Mock only external dependencies
test('processes order', async () => {
  const fakeDb = new FakeDatabase();
  const mockEmailService = { send: vi.fn() };
  
  // Real business logic, mock only I/O
});
```

### Testing Implementation Details

```typescript
// ❌ Bad: Verifying internal calls
test('saves user', async () => {
  const mock = vi.fn();
  service.internalHelper = mock; // Testing private method!
  
  await service.saveUser(user);
  expect(mock).toHaveBeenCalled();
});

// ✅ Good: Testing behavior
test('saves user', async () => {
  await service.saveUser(user);
  
  const saved = await db.findById(user.id);
  expect(saved).toEqual(user);
});
```

### Brittle Tests

```typescript
// ❌ Bad: Too specific
expect(mock).toHaveBeenCalledWith({
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: expect.any(Date),
  updatedAt: expect.any(Date),
  role: 'user',
  status: 'active'
});

// ✅ Good: Test what matters
expect(mock).toHaveBeenCalledWith(
  expect.objectContaining({
    id: '123',
    name: 'Alice'
  })
);
```

## Best Practices

### 1. Mock at the Boundaries

```typescript
// ✅ Good: Mock external services
const mockHttp = { get: vi.fn() };
const api = new ApiClient(mockHttp);

// ❌ Bad: Mock business logic
const mockOrderProcessor = { process: vi.fn() };
```

### 2. Use Real Objects When Possible

```typescript
// ✅ Prefer real implementations for pure logic
const calculator = new Calculator();
expect(calculator.add(2, 3)).toBe(5);

// Mock only when necessary (I/O, slow, non-deterministic)
const mockDatabase = { query: vi.fn() };
```

### 3. Verify Behavior, Not Calls

```typescript
// ❌ Bad: Only checking calls
expect(mock.send).toHaveBeenCalled();

// ✅ Good: Checking outcome
const user = await db.findById('123');
expect(user.emailVerified).toBe(true);
```

### 4. Keep Mocks Simple

```typescript
// ✅ Simple mock
const mock = vi.fn().mockResolvedValue({ id: '1' });

// ❌ Complex mock that replicates real implementation
const mock = vi.fn().mockImplementation(async (id) => {
  if (!id) throw new Error('ID required');
  const user = await findInCache(id);
  if (user) return user;
  // ... 50 more lines
});
```

## When to Mock

### ✅ Mock:
- Network calls (HTTP, database)
- File system operations
- Current time/randomness
- External APIs
- Slow operations

### ❌ Don't Mock:
- Pure functions
- Simple classes
- Value objects
- Business logic
- Entities

## The Mind-Shift

**Before mocking:**
- Tests depend on external services
- Slow test suites
- Flaky tests
- Hard to test edge cases

**After:**
- Isolated, fast tests
- Reliable test suites
- Easy to simulate errors
- Focus on behavior

## Summary

**Mocking Essentials**:
- Use test doubles to isolate code
- Mock external dependencies, not business logic
- Verify behavior, not implementation
- Keep mocks simple
- Use dependency injection

**Key insight**: *Mock to isolate, not to avoid testing—good mocking isolates the code under test while keeping tests focused on behavior rather than implementation details.*

---

**Next**: [Async Testing](../05-async-testing.md)
