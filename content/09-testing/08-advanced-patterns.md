# Advanced Testing Patterns

> *"The art of testing is knowing what to test, when to test it, and how deeply."*

## What Are Advanced Testing Patterns?

**Advanced testing patterns** go beyond basic unit and integration tests to handle complex scenarios: property-based testing, contract testing, mutation testing, snapshot testing, visual regression, and testing patterns for specific architectural styles.

## Property-Based Testing

### What Is It?

Instead of testing specific examples, generate hundreds of random inputs and verify properties that should always hold.

```typescript
import { fc } from 'fast-check';

// Traditional example-based test
test('reverse twice returns original', () => {
  expect(reverse(reverse('hello'))).toBe('hello');
  expect(reverse(reverse('world'))).toBe('world');
  // What about other strings?
});

// Property-based test
test('reverse twice returns original (property)', () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      expect(reverse(reverse(str))).toBe(str);
    })
  );
  // Tests 100+ random strings!
});
```

### Properties to Test

```typescript
// Commutativity
test('addition is commutative', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => {
      expect(add(a, b)).toBe(add(b, a));
    })
  );
});

// Identity
test('adding zero is identity', () => {
  fc.assert(
    fc.property(fc.integer(), (n) => {
      expect(add(n, 0)).toBe(n);
    })
  );
});

// Inverse
test('parse and serialize are inverses', () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const parsed = JSON.parse(JSON.stringify(str));
      expect(parsed).toBe(str);
    })
  );
});

// Idempotence
test('sort is idempotent', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const sorted1 = sort(arr);
      const sorted2 = sort(sorted1);
      expect(sorted2).toEqual(sorted1);
    })
  );
});
```

### Custom Generators

```typescript
// Generate valid emails
const emailGen = fc.tuple(
  fc.stringOf(fc.char(), { minLength: 1 }),
  fc.stringOf(fc.char(), { minLength: 1 }),
  fc.stringOf(fc.char(), { minLength: 2 })
).map(([user, domain, tld]) => `${user}@${domain}.${tld}`);

test('email validation accepts generated emails', () => {
  fc.assert(
    fc.property(emailGen, (email) => {
      expect(isValidEmail(email)).toBe(true);
    })
  );
});

// Generate valid users
const userGen = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  age: fc.integer({ min: 0, max: 120 }),
  email: emailGen
});

test('user validation', () => {
  fc.assert(
    fc.property(userGen, (user) => {
      expect(validateUser(user).isValid).toBe(true);
    })
  );
});
```

### Finding Edge Cases

```typescript
// Property-based testing found this bug!
function divide(a: number, b: number): number {
  return a / b;
}

test('division properties', () => {
  fc.assert(
    fc.property(
      fc.integer(),
      fc.integer().filter(n => n !== 0),
      (a, b) => {
        const result = divide(a, b);
        expect(Math.abs(result * b - a)).toBeLessThan(0.0001);
      }
    )
  );
});
```

## Mutation Testing

### What Is It?

Modify (mutate) your code and check if tests catch the changes. If tests still pass with mutated code, they're not effective.

```typescript
// Original code
function calculateDiscount(price: number, isPremium: boolean): number {
  if (isPremium) {
    return price * 0.8;
  }
  return price;
}

// Mutation 1: Change 0.8 to 0.9
function calculateDiscount(price: number, isPremium: boolean): number {
  if (isPremium) {
    return price * 0.9; // Mutated!
  }
  return price;
}

// Mutation 2: Remove condition
function calculateDiscount(price: number, isPremium: boolean): number {
  return price * 0.8; // Mutated!
}

// Mutation 3: Flip condition
function calculateDiscount(price: number, isPremium: boolean): number {
  if (!isPremium) { // Mutated!
    return price * 0.8;
  }
  return price;
}

// Good tests kill these mutations
test('premium discount', () => {
  expect(calculateDiscount(100, true)).toBe(80);  // Catches mutation 1
  expect(calculateDiscount(100, false)).toBe(100); // Catches mutations 2 & 3
});
```

### Using Stryker

```bash
npm install --save-dev @stryker-mutator/core
npx stryker init
npx stryker run
```

```typescript
// Stryker config: stryker.conf.json
{
  "mutate": ["src/**/*.ts"],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest"
}

// Stryker will:
// 1. Mutate your code
// 2. Run tests
// 3. Report which mutations survived
```

## Snapshot Testing

### Component Snapshots

```typescript
test('renders user profile', () => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin'
  };
  
  const html = renderUserProfile(user);
  
  expect(html).toMatchSnapshot();
});

// First run creates snapshot file:
// __snapshots__/user.test.ts.snap
/*
exports[`renders user profile 1`] = `
"<div class=\\"profile\\">
  <h1>Alice</h1>
  <p>alice@example.com</p>
  <span class=\\"role\\">admin</span>
</div>"
`;
*/

// Future runs compare against snapshot
```

### Data Structure Snapshots

```typescript
test('processes order', () => {
  const order = processOrder({
    items: [
      { id: '1', quantity: 2, price: 10 },
      { id: '2', quantity: 1, price: 20 }
    ],
    discountCode: 'SAVE10'
  });
  
  expect(order).toMatchSnapshot();
});

// Snapshot captures entire structure
```

### Inline Snapshots

```typescript
test('formats date', () => {
  const formatted = formatDate(new Date('2024-01-01'));
  
  expect(formatted).toMatchInlineSnapshot(`"January 1, 2024"`);
  // Snapshot stored directly in test file
});
```

### When to Use Snapshots

✅ **Good uses:**
- Complex object structures
- API responses
- Rendered output
- Configuration objects

❌ **Bad uses:**
- Dynamic data (timestamps, IDs)
- Large outputs (hard to review)
- Business logic (use explicit assertions)

## Contract Testing

### Consumer-Driven Contracts

```typescript
// Consumer defines expected API contract
const userContract = {
  request: {
    method: 'GET',
    path: '/api/users/123'
  },
  response: {
    status: 200,
    body: {
      id: '123',
      name: 'Alice',
      email: 'alice@example.com'
    }
  }
};

// Consumer test
test('fetches user from API', async () => {
  const mockServer = setupMockServer(userContract);
  
  const client = new ApiClient('http://localhost:8080');
  const user = await client.getUser('123');
  
  expect(user.name).toBe('Alice');
});

// Provider test (on server)
test('GET /api/users/:id matches contract', async () => {
  const response = await request(app)
    .get('/api/users/123');
  
  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    email: expect.any(String)
  });
});
```

### Using Pact

```typescript
import { PactV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'UserService',
  provider: 'APIGateway'
});

describe('User API Contract', () => {
  test('get user by ID', async () => {
    await provider
      .given('user 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({
        method: 'GET',
        path: '/users/123'
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: '123',
          name: 'Alice'
        }
      })
      .executeTest(async (mockServer) => {
        const client = new ApiClient(mockServer.url);
        const user = await client.getUser('123');
        expect(user.name).toBe('Alice');
      });
  });
});
```

## Approval Testing

### Golden Master Testing

```typescript
// Test complex transformations by comparing to approved output
test('generates invoice PDF', async () => {
  const invoice = {
    customer: 'Alice',
    items: [
      { name: 'Book', price: 10, quantity: 2 },
      { name: 'Pen', price: 5, quantity: 3 }
    ]
  };
  
  const pdf = await generateInvoicePDF(invoice);
  
  // Compare to approved file
  const approved = await readFile('approvals/invoice.pdf');
  expect(pdf).toEqual(approved);
  
  // If different, save as received file for manual review
  if (!pdf.equals(approved)) {
    await writeFile('approvals/invoice.received.pdf', pdf);
  }
});
```

## Parameterized Tests

### Table-Driven Tests

```typescript
describe('tax calculation', () => {
  test.each([
    { income: 10000, expected: 1000 },
    { income: 50000, expected: 7500 },
    { income: 100000, expected: 20000 },
    { income: 200000, expected: 50000 }
  ])('calculates tax for income $income', ({ income, expected }) => {
    expect(calculateTax(income)).toBe(expected);
  });
});

// Or with arrays
describe('string operations', () => {
  test.each([
    ['hello', 'HELLO'],
    ['world', 'WORLD'],
    ['TypeScript', 'TYPESCRIPT']
  ])('toUpperCase(%s) returns %s', (input, expected) => {
    expect(input.toUpperCase()).toBe(expected);
  });
});
```

## Fuzzing

### Random Input Testing

```typescript
test('parser handles arbitrary input', () => {
  const fuzz = fc.string();
  
  fc.assert(
    fc.property(fuzz, (input) => {
      try {
        parse(input);
        // Shouldn't crash
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, should be a valid ParseError
        expect(error).toBeInstanceOf(ParseError);
      }
    })
  );
});

test('API handles malformed requests', async () => {
  const fuzzData = fc.anything();
  
  fc.assert(
    fc.asyncProperty(fuzzData, async (data) => {
      const response = await request(app)
        .post('/api/users')
        .send(data);
      
      // Should either accept or return 400, never crash
      expect([200, 201, 400]).toContain(response.status);
    })
  );
});
```

## Testing Patterns by Architecture

### Testing Hexagonal Architecture

```typescript
// Domain logic (pure, easy to test)
test('order total calculation', () => {
  const order = new Order();
  order.addItem({ price: 10, quantity: 2 });
  expect(order.getTotal()).toBe(20);
});

// Port (interface)
interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order>;
}

// Adapter (infrastructure)
class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    await this.db.query('INSERT INTO orders ...');
  }
  
  async findById(id: string): Promise<Order> {
    const row = await this.db.query('SELECT ...');
    return Order.fromRow(row);
  }
}

// Test adapter with real database
test('saves order to database', async () => {
  const repo = new PostgresOrderRepository(testDb);
  const order = new Order();
  
  await repo.save(order);
  
  const found = await repo.findById(order.id);
  expect(found).toEqual(order);
});

// Test use case with mock adapter
test('creates order use case', async () => {
  const mockRepo: OrderRepository = {
    save: vi.fn(),
    findById: vi.fn()
  };
  
  const useCase = new CreateOrderUseCase(mockRepo);
  await useCase.execute({ items: [...] });
  
  expect(mockRepo.save).toHaveBeenCalled();
});
```

### Testing Event-Driven Systems

```typescript
test('order created event triggers handlers', async () => {
  const events: DomainEvent[] = [];
  const eventBus = new InMemoryEventBus();
  
  // Subscribe handlers
  eventBus.subscribe('OrderCreated', async (event) => {
    events.push(event);
    await sendConfirmationEmail(event.data.email);
  });
  
  eventBus.subscribe('OrderCreated', async (event) => {
    await reserveInventory(event.data.items);
  });
  
  // Trigger event
  await eventBus.publish({
    type: 'OrderCreated',
    data: { orderId: '1', email: 'test@example.com', items: [] }
  });
  
  // Wait for async handlers
  await new Promise(resolve => setTimeout(resolve, 50));
  
  expect(events).toHaveLength(1);
  // Verify side effects
});
```

## Performance Testing

### Benchmarking

```typescript
import { bench, describe } from 'vitest';

describe('array operations', () => {
  bench('native sort', () => {
    const arr = Array.from({ length: 1000 }, () => Math.random());
    arr.sort((a, b) => a - b);
  });
  
  bench('quick sort', () => {
    const arr = Array.from({ length: 1000 }, () => Math.random());
    quickSort(arr);
  });
});

// Compare implementations
describe('fibonacci implementations', () => {
  bench('recursive', () => {
    fib_recursive(20);
  });
  
  bench('iterative', () => {
    fib_iterative(20);
  });
  
  bench('memoized', () => {
    fib_memoized(20);
  });
});
```

### Load Testing

```typescript
test('handles concurrent requests', async () => {
  const requests = Array.from({ length: 100 }, (_, i) =>
    request(app).get(`/api/users/${i}`)
  );
  
  const responses = await Promise.all(requests);
  
  const successful = responses.filter(r => r.status === 200);
  expect(successful.length).toBeGreaterThan(95); // 95% success rate
});
```

## Visual Regression Testing

```typescript
// Using Playwright or similar
test('homepage renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Take screenshot
  const screenshot = await page.screenshot();
  
  // Compare to baseline
  expect(screenshot).toMatchImageSnapshot();
});

test('button hover state', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.hover('button.primary');
  
  expect(await page.screenshot()).toMatchImageSnapshot();
});
```

## Testing Best Practices

### Test Pyramid

```
        /\
       /E2E\      Few, slow, expensive
      /------\
     /Integra\   Moderate number
    /----------\
   /   Unit     \  Many, fast, cheap
  /--------------\
```

### Test Organization

```typescript
describe('OrderService', () => {
  describe('createOrder', () => {
    describe('with valid data', () => {
      test('creates order', () => {});
      test('returns order ID', () => {});
    });
    
    describe('with invalid data', () => {
      test('throws validation error', () => {});
    });
    
    describe('with insufficient inventory', () => {
      test('throws inventory error', () => {});
    });
  });
});
```

### Custom Matchers

```typescript
expect.extend({
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`
    };
  }
});

test('validates email', () => {
  expect('test@example.com').toBeValidEmail();
  expect('invalid').not.toBeValidEmail();
});
```

## The Mind-Shift

**Before advanced patterns:**
- Basic example-based tests
- Manual verification of complex scenarios
- Untested edge cases
- Brittle tests

**After:**
- Property-based testing finds edge cases
- Mutation testing validates test quality
- Contract testing ensures integration
- Comprehensive confidence

## Summary

**Advanced Testing Patterns**:
- Property-based testing for edge cases
- Mutation testing to verify test quality
- Snapshot testing for complex outputs
- Contract testing for API boundaries
- Performance and load testing
- Architecture-specific patterns

**Key insight**: *Advanced testing patterns complement basic unit tests—they help find edge cases you wouldn't think of, ensure your tests are actually testing something, and provide confidence in complex scenarios.*

---

**Module Complete!** 🎉

You've learned the fundamentals of testing, from basic unit tests through advanced patterns. Next, apply these concepts to real projects to build reliable, maintainable software.
