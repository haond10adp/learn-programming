# Unit Testing

> *"A unit test is a piece of code that invokes a unit of work and checks one specific end result of that unit of work."* — Roy Osherove

## What Is Unit Testing?

**Unit testing** is the practice of testing individual units of code in isolation from the rest of the system. A "unit" is typically a single function, method, or class.

```typescript
// Unit under test
function calculateTax(amount: number, rate: number): number {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  return amount * rate;
}

// Unit tests
describe('calculateTax', () => {
  test('calculates tax correctly', () => {
    expect(calculateTax(100, 0.1)).toBe(10);
  });
  
  test('throws error for negative amount', () => {
    expect(() => calculateTax(-100, 0.1)).toThrow('Amount cannot be negative');
  });
});
```

## Why This Matters

Unit tests provide:
- **Fast feedback**: Run in milliseconds
- **Isolation**: Test one thing at a time
- **Precise failures**: Know exactly what broke
- **Living documentation**: Show how code should be used
- **Design pressure**: Hard-to-test code signals design problems

## Characteristics of Good Unit Tests

### 1. Fast

```typescript
// ❌ Slow: Makes network call
test('fetches user', async () => {
  const user = await fetch('https://api.example.com/users/1');
  expect(user.name).toBe('Alice');
});

// ✅ Fast: Pure function
test('formats user name', () => {
  const formatted = formatName('alice', 'smith');
  expect(formatted).toBe('Alice Smith');
});
```

### 2. Isolated

```typescript
// ❌ Not isolated: Depends on database
test('saves user', async () => {
  await database.save({ name: 'Alice' });
  const users = await database.findAll();
  expect(users).toHaveLength(1);
});

// ✅ Isolated: Tests pure logic
test('validates user data', () => {
  const result = validateUser({ name: 'Alice', age: 30 });
  expect(result.isValid).toBe(true);
});
```

### 3. Repeatable

```typescript
// ❌ Not repeatable: Uses random values
test('generates ID', () => {
  const id = generateId();
  expect(id).toBe('abc123'); // Fails randomly!
});

// ✅ Repeatable: Predictable output
test('generates ID from seed', () => {
  const id = generateId('seed');
  expect(id).toBe('abc123');
});
```

### 4. Self-checking

```typescript
// ❌ Requires manual verification
test('renders user', () => {
  const html = renderUser({ name: 'Alice' });
  console.log(html); // Have to look at output!
});

// ✅ Self-checking: Automatic verification
test('renders user name', () => {
  const html = renderUser({ name: 'Alice' });
  expect(html).toContain('Alice');
});
```

### 5. Timely

Write tests when writing code, not months later.

## Testing Pure Functions

Pure functions are ideal for unit testing:

```typescript
// Pure function
function calculateDiscount(price: number, percentage: number): number {
  return price * (1 - percentage);
}

// Easy to test
describe('calculateDiscount', () => {
  test('applies discount correctly', () => {
    expect(calculateDiscount(100, 0.1)).toBe(90);
    expect(calculateDiscount(50, 0.2)).toBe(40);
  });
  
  test('handles zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
  
  test('handles 100% discount', () => {
    expect(calculateDiscount(100, 1)).toBe(0);
  });
});
```

## Testing with Dependencies

### Dependency Injection

```typescript
// ❌ Hard to test: Hard-coded dependency
class UserService {
  async getUser(id: string) {
    const db = new Database(); // Can't replace in tests!
    return db.find(id);
  }
}

// ✅ Easy to test: Injected dependency
class UserService {
  constructor(private db: Database) {}
  
  async getUser(id: string) {
    return this.db.find(id);
  }
}

// Test with fake database
test('gets user by ID', async () => {
  const fakeDb = {
    find: (id: string) => Promise.resolve({ id, name: 'Alice' })
  };
  
  const service = new UserService(fakeDb);
  const user = await service.getUser('1');
  
  expect(user.name).toBe('Alice');
});
```

### Using Interfaces

```typescript
interface Database {
  find(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class UserService {
  constructor(private db: Database) {}
  
  async createUser(name: string): Promise<User> {
    const user = { id: generateId(), name };
    await this.db.save(user);
    return user;
  }
}

// Test with mock
test('creates and saves user', async () => {
  const mockDb: Database = {
    find: vi.fn(),
    save: vi.fn()
  };
  
  const service = new UserService(mockDb);
  const user = await service.createUser('Alice');
  
  expect(user.name).toBe('Alice');
  expect(mockDb.save).toHaveBeenCalledWith(user);
});
```

## Test Coverage

### Branch Coverage

```typescript
function getDiscount(customer: Customer): number {
  if (customer.isPremium) {
    return 0.2;
  }
  if (customer.orderCount > 10) {
    return 0.1;
  }
  return 0;
}

// Cover all branches
describe('getDiscount', () => {
  test('returns 20% for premium customers', () => {
    expect(getDiscount({ isPremium: true, orderCount: 0 })).toBe(0.2);
  });
  
  test('returns 10% for customers with >10 orders', () => {
    expect(getDiscount({ isPremium: false, orderCount: 11 })).toBe(0.1);
  });
  
  test('returns 0% for regular customers', () => {
    expect(getDiscount({ isPremium: false, orderCount: 5 })).toBe(0);
  });
});
```

### Edge Cases

```typescript
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

describe('divide', () => {
  // Normal cases
  test('divides positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  // Edge cases
  test('divides by 1', () => {
    expect(divide(10, 1)).toBe(10);
  });
  
  test('divides zero', () => {
    expect(divide(0, 5)).toBe(0);
  });
  
  test('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
  
  test('handles negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
  });
});
```

## Parameterized Tests

Test multiple inputs efficiently:

```typescript
describe('isPrime', () => {
  test.each([
    [2, true],
    [3, true],
    [4, false],
    [5, true],
    [9, false],
    [11, true],
    [15, false]
  ])('isPrime(%i) returns %s', (num, expected) => {
    expect(isPrime(num)).toBe(expected);
  });
});

// Or with objects
describe('validateEmail', () => {
  test.each([
    { email: 'test@example.com', valid: true },
    { email: 'invalid', valid: false },
    { email: 'no@domain', valid: false },
    { email: '@nodomain.com', valid: false }
  ])('validates $email as $valid', ({ email, valid }) => {
    expect(validateEmail(email)).toBe(valid);
  });
});
```

## Testing State Changes

```typescript
class Counter {
  private count = 0;
  
  increment(): void {
    this.count++;
  }
  
  decrement(): void {
    this.count--;
  }
  
  getCount(): number {
    return this.count;
  }
}

describe('Counter', () => {
  test('starts at zero', () => {
    const counter = new Counter();
    expect(counter.getCount()).toBe(0);
  });
  
  test('increments count', () => {
    const counter = new Counter();
    counter.increment();
    expect(counter.getCount()).toBe(1);
  });
  
  test('decrements count', () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    counter.decrement();
    expect(counter.getCount()).toBe(1);
  });
  
  test('handles multiple operations', () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    counter.increment();
    counter.decrement();
    expect(counter.getCount()).toBe(2);
  });
});
```

## Test Organization

### Grouping Related Tests

```typescript
describe('Calculator', () => {
  describe('addition', () => {
    test('adds positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    
    test('adds negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });
  });
  
  describe('subtraction', () => {
    test('subtracts positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });
    
    test('subtracts negative numbers', () => {
      expect(subtract(-5, -3)).toBe(-2);
    });
  });
});
```

### Shared Setup

```typescript
describe('ShoppingCart', () => {
  let cart: ShoppingCart;
  
  beforeEach(() => {
    cart = new ShoppingCart();
  });
  
  test('starts empty', () => {
    expect(cart.isEmpty()).toBe(true);
  });
  
  test('adds items', () => {
    cart.addItem({ id: '1', name: 'Book', price: 10 });
    expect(cart.itemCount()).toBe(1);
  });
  
  test('calculates total', () => {
    cart.addItem({ id: '1', name: 'Book', price: 10 });
    cart.addItem({ id: '2', name: 'Pen', price: 5 });
    expect(cart.getTotal()).toBe(15);
  });
});
```

## Common Patterns

### Testing Validation

```typescript
function validatePassword(password: string): ValidationResult {
  if (password.length < 8) {
    return { valid: false, error: 'Too short' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Must contain uppercase' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Must contain number' };
  }
  return { valid: true };
}

describe('validatePassword', () => {
  test('accepts valid password', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
  });
  
  test('rejects short password', () => {
    const result = validatePassword('Pass1');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Too short');
  });
  
  test('rejects password without uppercase', () => {
    const result = validatePassword('password123');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Must contain uppercase');
  });
  
  test('rejects password without number', () => {
    const result = validatePassword('Password');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Must contain number');
  });
});
```

### Testing Transformations

```typescript
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

describe('normalizeEmail', () => {
  test('converts to lowercase', () => {
    expect(normalizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
  });
  
  test('removes whitespace', () => {
    expect(normalizeEmail('  test@example.com  ')).toBe('test@example.com');
  });
  
  test('handles mixed case with spaces', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
  });
});
```

## Avoiding Common Pitfalls

### Don't Test Implementation Details

```typescript
// ❌ Bad: Tests implementation
test('uses Map internally', () => {
  const cache = new Cache();
  expect(cache.storage instanceof Map).toBe(true);
});

// ✅ Good: Tests behavior
test('caches values', () => {
  const cache = new Cache();
  cache.set('key', 'value');
  expect(cache.get('key')).toBe('value');
});
```

### Don't Couple Tests to Order

```typescript
// ❌ Bad: Tests depend on order
describe('Database', () => {
  test('creates user', () => {
    db.create({ name: 'Alice' });
  });
  
  test('finds user', () => {
    const user = db.find('Alice'); // Depends on previous test!
    expect(user).toBeDefined();
  });
});

// ✅ Good: Independent tests
describe('Database', () => {
  beforeEach(() => {
    db.clear();
  });
  
  test('creates user', () => {
    db.create({ name: 'Alice' });
    expect(db.count()).toBe(1);
  });
  
  test('finds created user', () => {
    db.create({ name: 'Alice' });
    const user = db.find('Alice');
    expect(user).toBeDefined();
  });
});
```

### Keep Tests Focused

```typescript
// ❌ Bad: Tests too much
test('user operations', () => {
  const user = new User('Alice');
  expect(user.name).toBe('Alice');
  user.setAge(30);
  expect(user.age).toBe(30);
  expect(user.isAdult()).toBe(true);
  user.setName('Bob');
  expect(user.name).toBe('Bob');
});

// ✅ Good: Focused tests
test('creates user with name', () => {
  const user = new User('Alice');
  expect(user.name).toBe('Alice');
});

test('sets user age', () => {
  const user = new User('Alice');
  user.setAge(30);
  expect(user.age).toBe(30);
});

test('determines if user is adult', () => {
  const user = new User('Alice');
  user.setAge(30);
  expect(user.isAdult()).toBe(true);
});
```

## Testing Exceptions

```typescript
function withdraw(account: Account, amount: number): void {
  if (amount > account.balance) {
    throw new InsufficientFundsError(
      `Cannot withdraw ${amount}, balance is ${account.balance}`
    );
  }
  account.balance -= amount;
}

describe('withdraw', () => {
  test('withdraws from account', () => {
    const account = { balance: 100 };
    withdraw(account, 30);
    expect(account.balance).toBe(70);
  });
  
  test('throws when insufficient funds', () => {
    const account = { balance: 50 };
    expect(() => withdraw(account, 100)).toThrow(InsufficientFundsError);
    expect(() => withdraw(account, 100)).toThrow(
      'Cannot withdraw 100, balance is 50'
    );
  });
  
  test('does not modify balance on error', () => {
    const account = { balance: 50 };
    try {
      withdraw(account, 100);
    } catch {}
    expect(account.balance).toBe(50);
  });
});
```

## Test-First Development

```typescript
// 1. Write test (Red)
test('capitalizes first letter', () => {
  expect(capitalize('hello')).toBe('Hello');
});

// 2. Implement (Green)
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 3. Add more tests
test('handles empty string', () => {
  expect(capitalize('')).toBe('');
});

test('handles single character', () => {
  expect(capitalize('a')).toBe('A');
});

// 4. Refine implementation
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
```

## The Mind-Shift

**Before unit testing:**
- Test entire application manually
- Unsure what broke when tests fail
- Afraid to refactor
- Slow feedback cycle

**After:**
- Test each unit independently
- Failures point to exact problem
- Refactor with confidence
- Instant feedback

## Summary

**Unit Testing Essentials**:
- Test individual units in isolation
- Fast, repeatable, self-checking
- Use dependency injection
- Cover edge cases and errors
- Keep tests focused and independent

**Key insight**: *Good unit tests are fast, isolated, and test behavior rather than implementation—they give instant feedback and enable confident refactoring.*

---

**Next**: [Testing Classes](../03-testing-classes.md)
