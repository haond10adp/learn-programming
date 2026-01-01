# Testing AI-Generated Code

> *"AI writes code. You verify it works."*

## Why Test AI Code?

**AI-generated code needs tests just like human-written code**—perhaps more so. AI can produce code that looks correct but has subtle bugs, security issues, or doesn't handle edge cases.

```typescript
// AI generates this function:
function calculateDiscount(price: number, percentage: number): number {
  return price - percentage;
}

// Looks reasonable, but is it correct?

// Tests reveal the bug:
test('applies discount correctly', () => {
  expect(calculateDiscount(100, 0.1)).toBe(90);  // FAILS! Returns 99.9
});

// Bug: Subtracts percentage value, not percentage of price
// Should be: price * (1 - percentage)
```

## Why This Matters

Testing AI code:
- **Catches logic errors**: AI's interpretation may differ from yours
- **Verifies edge cases**: AI often misses them
- **Documents intent**: Tests show expected behavior
- **Enables refactoring**: Change AI code confidently
- **Builds trust**: Proof code actually works

## Test-Driven AI Prompting

### Write Tests First

```typescript
// 1. Write tests describing what you want:
describe('EmailValidator', () => {
  test('accepts valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });
  
  test('rejects email without @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });
  
  test('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });
  
  test('handles internationalized domains', () => {
    expect(isValidEmail('user@münchen.de')).toBe(true);
  });
});

// 2. Give tests to AI as specification:
// "Implement isValidEmail function that passes these tests"

// 3. AI generates implementation:
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 4. Run tests - some fail! Refine and re-generate.
```

### Benefits

- **Clear specification**: Tests define exact behavior
- **Immediate feedback**: See if AI understood correctly
- **Regression prevention**: Tests catch future AI-induced bugs
- **Documentation**: Tests show usage examples

## What to Test

### 1. Core Functionality

```typescript
// AI generates user registration:
async function registerUser(
  email: string,
  password: string
): Promise<User> {
  const user = await createUser(email, password);
  await sendWelcomeEmail(email);
  return user;
}

// Test core behavior:
test('creates user with email and password', async () => {
  const user = await registerUser('test@example.com', 'SecurePass123');
  
  expect(user.email).toBe('test@example.com');
  expect(user.id).toBeDefined();
  expect(user.passwordHash).not.toBe('SecurePass123'); // Should be hashed
});
```

### 2. Edge Cases

```typescript
// AI generates array utils:
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

// Test edge cases AI might miss:
describe('getFirst', () => {
  test('returns first element', () => {
    expect(getFirst([1, 2, 3])).toBe(1);
  });
  
  test('handles empty array', () => {
    expect(getFirst([])).toBeUndefined();
  });
  
  test('handles single element', () => {
    expect(getFirst([42])).toBe(42);
  });
  
  test('handles null/undefined elements', () => {
    expect(getFirst([null, 1])).toBeNull();
    expect(getFirst([undefined, 1])).toBeUndefined();
  });
});
```

### 3. Error Handling

```typescript
// AI generates division:
function divide(a: number, b: number): number {
  return a / b;
}

// Test error cases:
describe('divide', () => {
  test('divides numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });
  
  test('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
  
  test('handles Infinity', () => {
    expect(() => divide(Infinity, 1)).toThrow('Invalid input');
  });
  
  test('handles NaN', () => {
    expect(() => divide(NaN, 1)).toThrow('Invalid input');
  });
});

// Tests fail! AI didn't add validation. Regenerate with requirements.
```

### 4. Integration

```typescript
// AI generates multiple components:
class UserService {
  constructor(private repo: UserRepository) {}
  
  async createUser(email: string): Promise<User> {
    return await this.repo.save({ email });
  }
}

// Test integration:
test('service saves user to repository', async () => {
  const mockRepo = {
    save: vi.fn().mockResolvedValue({ id: '1', email: 'test@example.com' })
  };
  
  const service = new UserService(mockRepo);
  const user = await service.createUser('test@example.com');
  
  expect(mockRepo.save).toHaveBeenCalledWith({ email: 'test@example.com' });
  expect(user.id).toBe('1');
});
```

### 5. Security

```typescript
// AI generates query builder:
class QueryBuilder {
  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }
  
  build(): string {
    return `SELECT * FROM users WHERE ${this.conditions.join(' AND ')}`;
  }
}

// Test for SQL injection:
test('prevents SQL injection', () => {
  const query = new QueryBuilder()
    .where("name = 'admin' OR '1'='1'")
    .build();
  
  // Should use parameterized queries, not string concatenation!
  // This test documents a security requirement
});
```

## Iterative Testing

### Round 1: Basic Tests

```typescript
// Test basic functionality:
test('sorts numbers ascending', () => {
  expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
});

// AI generates:
function sort(arr: number[]): number[] {
  return arr.sort((a, b) => a - b);
}

// ❌ Mutates original array!
```

### Round 2: Add Immutability Test

```typescript
test('does not mutate original array', () => {
  const original = [3, 1, 2];
  const sorted = sort(original);
  
  expect(original).toEqual([3, 1, 2]); // Should be unchanged
  expect(sorted).toEqual([1, 2, 3]);
});

// Tell AI: "Don't mutate input"
function sort(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}
```

### Round 3: Add Edge Cases

```typescript
test('handles empty array', () => {
  expect(sort([])).toEqual([]);
});

test('handles single element', () => {
  expect(sort([42])).toEqual([42]);
});

test('handles duplicates', () => {
  expect(sort([2, 1, 2, 1])).toEqual([1, 1, 2, 2]);
});

// All pass! Implementation is robust.
```

## Property-Based Testing

```typescript
import { fc } from 'fast-check';

// AI generates sorting function
function sort(arr: number[]): number[] {
  return [...arr].sort((a, b) => a - b);
}

// Property-based tests catch edge cases:
test('sorted array is same length', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      expect(sort(arr)).toHaveLength(arr.length);
    })
  );
});

test('sorted array contains same elements', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sort(arr);
      expect(sorted.slice().sort((a, b) => a - b)).toEqual(sorted);
    })
  );
});

test('sorted array is actually sorted', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted = sort(arr);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
      }
    })
  );
});
```

## Testing Async AI Code

```typescript
// AI generates async function:
async function fetchUserData(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return await response.json();
}

// Test async behavior:
describe('fetchUserData', () => {
  test('fetches user successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ id: '1', name: 'Alice' })
    });
    
    const user = await fetchUserData('1');
    
    expect(user.name).toBe('Alice');
    expect(fetch).toHaveBeenCalledWith('/api/users/1');
  });
  
  test('handles network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(fetchUserData('1')).rejects.toThrow('Network error');
  });
  
  test('handles 404 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });
    
    await expect(fetchUserData('1')).rejects.toThrow('User not found');
  });
});
```

## Snapshot Testing for AI

```typescript
// AI generates complex object transformation:
function transformApiResponse(response: ApiResponse): UserProfile {
  return {
    id: response.user_id,
    name: response.full_name,
    email: response.email_address,
    settings: {
      theme: response.preferences?.theme || 'light',
      notifications: response.preferences?.notifications || true
    }
  };
}

// Snapshot test to catch unexpected changes:
test('transforms API response correctly', () => {
  const apiResponse = {
    user_id: '123',
    full_name: 'Alice Smith',
    email_address: 'alice@example.com',
    preferences: {
      theme: 'dark',
      notifications: false
    }
  };
  
  expect(transformApiResponse(apiResponse)).toMatchSnapshot();
});

// If AI regenerates with changes, snapshot diff shows exactly what changed
```

## Testing AI Refactorings

```typescript
// Before refactoring:
function processOrder(order: Order): number {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  if (total > 100) {
    total = total * 0.9;
  }
  return total;
}

// Write tests:
test('calculates total without discount', () => {
  const order = {
    items: [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ]
  };
  expect(processOrder(order)).toBe(35);
});

test('applies discount over $100', () => {
  const order = {
    items: [{ price: 150, quantity: 1 }]
  };
  expect(processOrder(order)).toBe(135); // 10% off
});

// Ask AI to refactor:
// "Extract discount logic to separate function"

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(total: number): number {
  return total > 100 ? total * 0.9 : total;
}

function processOrder(order: Order): number {
  const subtotal = calculateSubtotal(order.items);
  return applyDiscount(subtotal);
}

// Tests still pass! Refactoring was correct.
```

## Coverage for AI Code

```typescript
// AI generates complex function:
function processPayment(amount: number, method: string): string {
  if (amount <= 0) {
    throw new Error('Invalid amount');
  }
  
  if (method === 'credit') {
    return 'Charged credit card';
  } else if (method === 'debit') {
    return 'Charged debit card';
  } else if (method === 'paypal') {
    return 'Charged PayPal';
  }
  
  throw new Error('Unknown payment method');
}

// Check coverage:
// Run: npm test -- --coverage

// Aim for 100% branch coverage of AI code:
describe('processPayment', () => {
  test('credit card', () => {
    expect(processPayment(100, 'credit')).toBe('Charged credit card');
  });
  
  test('debit card', () => {
    expect(processPayment(100, 'debit')).toBe('Charged debit card');
  });
  
  test('paypal', () => {
    expect(processPayment(100, 'paypal')).toBe('Charged PayPal');
  });
  
  test('invalid amount', () => {
    expect(() => processPayment(0, 'credit')).toThrow('Invalid amount');
  });
  
  test('unknown method', () => {
    expect(() => processPayment(100, 'bitcoin')).toThrow('Unknown payment method');
  });
});

// 100% coverage - all branches tested!
```

## The Mind-Shift

**Before testing AI code:**
- "AI generated it, should work"
- Accept code without verification
- Discover bugs in production

**After:**
- "AI generates, I verify"
- Test-driven AI prompting
- Catch bugs before deployment

## Summary

**Testing AI Code**:
- Write tests first (specification)
- Test edge cases and errors
- Use property-based testing
- Verify security
- Iterate based on test failures
- Aim for high coverage

**Key insight**: *Tests are your contract with AI—they specify exactly what you want, verify AI understood correctly, and catch bugs before code reaches production.*

---

**Next**: [Architecture and System Design](../06-architecture.md)
