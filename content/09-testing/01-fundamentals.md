# Testing Fundamentals

> *"Tests are executable documentation."*

## What Is Testing?

**Testing** is the practice of verifying that code behaves as expected. Tests are programs that execute your code and assert that the results match expectations.

```typescript
// Code to test
function add(a: number, b: number): number {
  return a + b;
}

// Test
test('adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
  expect(add(0, 0)).toBe(0);
});
```

## Why This Matters

Tests provide:
- **Confidence**: Code works as intended
- **Documentation**: How code should be used
- **Regression prevention**: Changes don't break existing functionality
- **Design feedback**: Hard-to-test code is often poorly designed
- **Refactoring safety**: Change implementation with confidence

## Test Anatomy

```typescript
test('description of what is being tested', () => {
  // 1. Arrange: Set up test data
  const user = { name: 'Alice', age: 30 };
  
  // 2. Act: Execute the code being tested
  const greeting = greetUser(user);
  
  // 3. Assert: Verify the result
  expect(greeting).toBe('Hello, Alice!');
});
```

## Test Frameworks

### Vitest (Modern, Fast)

```typescript
import { describe, test, expect } from 'vitest';

describe('Calculator', () => {
  test('adds numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  
  test('subtracts numbers', () => {
    expect(subtract(5, 3)).toBe(2);
  });
});
```

### Jest (Popular, Comprehensive)

```typescript
describe('User', () => {
  it('should create a user', () => {
    const user = new User('Alice');
    expect(user.name).toBe('Alice');
  });
  
  it('should validate email', () => {
    expect(User.isValidEmail('test@example.com')).toBe(true);
    expect(User.isValidEmail('invalid')).toBe(false);
  });
});
```

## Assertions

### Basic Assertions

```typescript
// Equality
expect(value).toBe(5);                    // Strict equality (===)
expect(obj).toEqual({ a: 1 });            // Deep equality
expect(value).not.toBe(10);               // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeGreaterThanOrEqual(10);
expect(value).toBeLessThan(20);
expect(value).toBeCloseTo(0.3, 5);        // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toEqual(expect.arrayContaining([1, 2]));

// Objects
expect(obj).toHaveProperty('name');
expect(obj).toHaveProperty('age', 30);
expect(obj).toMatchObject({ name: 'Alice' });
```

### Custom Matchers

```typescript
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  }
});

// Use it
expect(15).toBeWithinRange(10, 20);
```

## Test Structure

### Describe Blocks

```typescript
describe('User', () => {
  describe('constructor', () => {
    test('creates user with name', () => {
      const user = new User('Alice');
      expect(user.name).toBe('Alice');
    });
  });
  
  describe('validate', () => {
    test('returns true for valid user', () => {
      const user = new User('Alice');
      expect(user.validate()).toBe(true);
    });
    
    test('returns false for invalid user', () => {
      const user = new User('');
      expect(user.validate()).toBe(false);
    });
  });
});
```

### Setup and Teardown

```typescript
describe('Database', () => {
  let db: Database;
  
  // Run once before all tests
  beforeAll(async () => {
    db = await connectDatabase();
  });
  
  // Run before each test
  beforeEach(async () => {
    await db.clear();
  });
  
  // Run after each test
  afterEach(async () => {
    await db.rollback();
  });
  
  // Run once after all tests
  afterAll(async () => {
    await db.close();
  });
  
  test('saves user', async () => {
    await db.save({ name: 'Alice' });
    const users = await db.findAll();
    expect(users).toHaveLength(1);
  });
});
```

## Test Categories

### Unit Tests

Test individual functions or methods in isolation:

```typescript
test('calculateDiscount returns correct value', () => {
  expect(calculateDiscount(100, 0.1)).toBe(90);
  expect(calculateDiscount(50, 0.2)).toBe(40);
  expect(calculateDiscount(0, 0.5)).toBe(0);
});
```

### Integration Tests

Test multiple components working together:

```typescript
test('user registration flow', async () => {
  const user = await register('alice@example.com', 'password');
  const saved = await userRepository.findById(user.id);
  expect(saved.email).toBe('alice@example.com');
  
  const email = await emailService.getSent(user.email);
  expect(email.subject).toBe('Welcome!');
});
```

### End-to-End Tests

Test entire application flow:

```typescript
test('user can complete purchase', async () => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.goto('/cart');
  await page.click('[data-testid="checkout"]');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[data-testid="complete-order"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Test-Driven Development (TDD)

Write tests before implementation:

```typescript
// 1. Write failing test (Red)
test('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});

// 2. Implement minimum to pass (Green)
function isValidEmail(email: string): boolean {
  return email.includes('@');
}

// 3. Refactor
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

## Test Coverage

```typescript
// Run with coverage
npm test -- --coverage

// Coverage report
// File        | % Stmts | % Branch | % Funcs | % Lines
// user.ts     |   100   |    100   |   100   |   100
// order.ts    |   85.7  |    75    |   100   |   85.7
```

Aim for high coverage, but 100% isn't always necessary or practical.

## Common Patterns

### Parameterized Tests

```typescript
test.each([
  [2, 3, 5],
  [0, 0, 0],
  [-1, 1, 0],
  [10, -5, 5]
])('add(%i, %i) returns %i', (a, b, expected) => {
  expect(add(a, b)).toBe(expected);
});
```

### Testing Error Cases

```typescript
test('throws error for division by zero', () => {
  expect(() => divide(10, 0)).toThrow('Division by zero');
  expect(() => divide(10, 0)).toThrow(Error);
});
```

### Snapshot Testing

```typescript
test('renders component correctly', () => {
  const tree = renderer.create(<User name="Alice" />).toJSON();
  expect(tree).toMatchSnapshot();
});

// First run creates snapshot, subsequent runs compare
```

## Test Doubles

### Stubs

Return predetermined values:

```typescript
const stub = {
  getUser: () => ({ id: '1', name: 'Alice' })
};
```

### Mocks

Record calls and verify behavior:

```typescript
const mock = {
  save: vi.fn()
};

await service.createUser('Alice');
expect(mock.save).toHaveBeenCalledWith({ name: 'Alice' });
expect(mock.save).toHaveBeenCalledTimes(1);
```

### Spies

Wrap real objects to observe behavior:

```typescript
const spy = vi.spyOn(console, 'log');

doSomething();

expect(spy).toHaveBeenCalledWith('Hello');
spy.mockRestore();
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Tests implementation details
test('uses array to store users', () => {
  const manager = new UserManager();
  expect(manager.users).toEqual([]);
});

// ✅ Good: Tests behavior
test('starts with no users', () => {
  const manager = new UserManager();
  expect(manager.count()).toBe(0);
});
```

### 2. One Assertion Per Test (Usually)

```typescript
// ❌ Bad: Multiple unrelated assertions
test('user operations', () => {
  expect(add(1, 2)).toBe(3);
  expect(subtract(5, 3)).toBe(2);
  expect(multiply(2, 3)).toBe(6);
});

// ✅ Good: Focused tests
test('adds numbers', () => {
  expect(add(1, 2)).toBe(3);
});

test('subtracts numbers', () => {
  expect(subtract(5, 3)).toBe(2);
});
```

### 3. Clear Test Names

```typescript
// ❌ Bad: Vague
test('user test', () => {});

// ✅ Good: Descriptive
test('creates user with valid email', () => {});
test('throws error when email is invalid', () => {});
```

### 4. Arrange-Act-Assert

```typescript
test('updates user name', () => {
  // Arrange
  const user = new User('Alice');
  
  // Act
  user.setName('Bob');
  
  // Assert
  expect(user.name).toBe('Bob');
});
```

### 5. Independent Tests

```typescript
// ❌ Bad: Tests depend on each other
let user: User;

test('creates user', () => {
  user = new User('Alice');
  expect(user.name).toBe('Alice');
});

test('updates user', () => {
  user.setName('Bob'); // Depends on previous test!
  expect(user.name).toBe('Bob');
});

// ✅ Good: Independent tests
test('creates user', () => {
  const user = new User('Alice');
  expect(user.name).toBe('Alice');
});

test('updates user name', () => {
  const user = new User('Alice');
  user.setName('Bob');
  expect(user.name).toBe('Bob');
});
```

## What to Test

### ✅ Test:
- Public API
- Edge cases
- Error conditions
- Business logic
- Complex algorithms

### ❌ Don't Test:
- Private methods (test through public API)
- Third-party libraries
- Trivial getters/setters
- Framework code

## The Mind-Shift

**Before testing:**
- Manual verification
- Fear of changing code
- Bugs in production

**After:**
- Automated verification
- Confident refactoring
- Catch bugs early

## Summary

**Testing Fundamentals**:
- Arrange-Act-Assert pattern
- Unit, integration, E2E tests
- Assertions and expectations
- Setup/teardown hooks
- Test-driven development

**Key insight**: *Tests are an investment—they cost time upfront but save much more time by catching bugs early and enabling confident refactoring.*

---

**Next**: [Unit Testing](../02-unit-testing.md)
