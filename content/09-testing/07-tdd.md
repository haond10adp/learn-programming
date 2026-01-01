# Test-Driven Development (TDD)

> *"Test-driven development is a way of thinking about design first, and testing second."*

## What Is TDD?

**Test-Driven Development** is a software development approach where you write tests before writing the code. The cycle is simple: Red (write failing test) → Green (make it pass) → Refactor (improve code).

```typescript
// 1. RED: Write failing test
test('adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
// Error: add is not defined

// 2. GREEN: Make it pass (simplest way)
function add(a: number, b: number): number {
  return 5; // Hardcoded to pass test!
}

// 3. Add more tests
test('adds different numbers', () => {
  expect(add(1, 1)).toBe(2);
  expect(add(10, 5)).toBe(15);
});

// 4. GREEN: Proper implementation
function add(a: number, b: number): number {
  return a + b;
}

// 5. REFACTOR: Already simple, no changes needed
```

## Why This Matters

TDD provides:
- **Better design**: Tests force you to think about API first
- **Living documentation**: Tests show how to use code
- **Confidence**: Changes don't break existing functionality
- **Less debugging**: Catch issues immediately
- **Completeness**: Every feature has tests

## The TDD Cycle

### Red-Green-Refactor

```typescript
// RED: Write a failing test
test('validates email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true);
  expect(isValidEmail('invalid')).toBe(false);
});

// GREEN: Make it pass (simplest implementation)
function isValidEmail(email: string): boolean {
  return email.includes('@');
}

// Tests pass! But we can add more cases
test('validates email with domain', () => {
  expect(isValidEmail('test@example')).toBe(false);
});

// Now one test fails. Update implementation:
function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

// REFACTOR: Improve while keeping tests green
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

## Starting with TDD

### Baby Steps

```typescript
// Step 1: Simplest test
test('creates empty shopping cart', () => {
  const cart = new ShoppingCart();
  expect(cart.isEmpty()).toBe(true);
});

// Minimal implementation
class ShoppingCart {
  isEmpty(): boolean {
    return true;
  }
}

// Step 2: Add item
test('adds item to cart', () => {
  const cart = new ShoppingCart();
  cart.addItem({ id: '1', name: 'Book', price: 10 });
  expect(cart.isEmpty()).toBe(false);
});

// Update implementation
class ShoppingCart {
  private items: Item[] = [];
  
  addItem(item: Item): void {
    this.items.push(item);
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Step 3: Calculate total
test('calculates total', () => {
  const cart = new ShoppingCart();
  cart.addItem({ id: '1', name: 'Book', price: 10 });
  cart.addItem({ id: '2', name: 'Pen', price: 5 });
  expect(cart.getTotal()).toBe(15);
});

// Add method
class ShoppingCart {
  private items: Item[] = [];
  
  addItem(item: Item): void {
    this.items.push(item);
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}
```

## TDD with Classes

### Build Step by Step

```typescript
// Test 1: Constructor
test('creates bank account with initial balance', () => {
  const account = new BankAccount(100);
  expect(account.getBalance()).toBe(100);
});

class BankAccount {
  constructor(private balance: number) {}
  
  getBalance(): number {
    return this.balance;
  }
}

// Test 2: Deposit
test('deposits increase balance', () => {
  const account = new BankAccount(100);
  account.deposit(50);
  expect(account.getBalance()).toBe(150);
});

class BankAccount {
  constructor(private balance: number) {}
  
  deposit(amount: number): void {
    this.balance += amount;
  }
  
  getBalance(): number {
    return this.balance;
  }
}

// Test 3: Validation
test('rejects negative deposit', () => {
  const account = new BankAccount(100);
  expect(() => account.deposit(-50)).toThrow('Amount must be positive');
});

class BankAccount {
  constructor(private balance: number) {}
  
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.balance += amount;
  }
  
  getBalance(): number {
    return this.balance;
  }
}

// Test 4: Withdrawal
test('withdrawals decrease balance', () => {
  const account = new BankAccount(100);
  account.withdraw(30);
  expect(account.getBalance()).toBe(70);
});

class BankAccount {
  constructor(private balance: number) {}
  
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.balance += amount;
  }
  
  withdraw(amount: number): void {
    this.balance -= amount;
  }
  
  getBalance(): number {
    return this.balance;
  }
}

// Test 5: Insufficient funds
test('prevents overdraft', () => {
  const account = new BankAccount(50);
  expect(() => account.withdraw(100)).toThrow('Insufficient funds');
});

class BankAccount {
  constructor(private balance: number) {}
  
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.balance += amount;
  }
  
  withdraw(amount: number): void {
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }
  
  getBalance(): number {
    return this.balance;
  }
}
```

## TDD for Algorithms

### Prime Number Checker

```typescript
// Test 1: Known primes
test('identifies 2 as prime', () => {
  expect(isPrime(2)).toBe(true);
});

function isPrime(n: number): boolean {
  return n === 2;
}

// Test 2: More primes
test('identifies small primes', () => {
  expect(isPrime(2)).toBe(true);
  expect(isPrime(3)).toBe(true);
  expect(isPrime(5)).toBe(true);
});

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  return n === 5;
}

// Test 3: Composite numbers
test('identifies composite numbers', () => {
  expect(isPrime(4)).toBe(false);
  expect(isPrime(6)).toBe(false);
  expect(isPrime(8)).toBe(false);
});

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Test 4: Edge cases
test('handles edge cases', () => {
  expect(isPrime(0)).toBe(false);
  expect(isPrime(1)).toBe(false);
  expect(isPrime(-5)).toBe(false);
});

// Implementation already handles these!

// Refactor: Add early return for performance
function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}
```

## TDD for Business Logic

### Order Processing

```typescript
// Test 1: Create order
test('creates order with items', () => {
  const order = new Order([
    { product: 'Book', price: 10, quantity: 2 }
  ]);
  
  expect(order.getTotal()).toBe(20);
});

class Order {
  constructor(private items: OrderItem[]) {}
  
  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
}

// Test 2: Apply discount
test('applies percentage discount', () => {
  const order = new Order([
    { product: 'Book', price: 10, quantity: 2 }
  ]);
  
  order.applyDiscount(0.1);
  
  expect(order.getTotal()).toBe(18); // 20 - 10%
});

class Order {
  private discount = 0;
  
  constructor(private items: OrderItem[]) {}
  
  applyDiscount(percentage: number): void {
    this.discount = percentage;
  }
  
  getTotal(): number {
    const subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return subtotal * (1 - this.discount);
  }
}

// Test 3: Minimum order for discount
test('only applies discount above minimum', () => {
  const smallOrder = new Order([
    { product: 'Pen', price: 5, quantity: 1 }
  ]);
  
  smallOrder.applyDiscount(0.1, 10); // Min $10
  
  expect(smallOrder.getTotal()).toBe(5); // No discount
  
  const largeOrder = new Order([
    { product: 'Book', price: 15, quantity: 1 }
  ]);
  
  largeOrder.applyDiscount(0.1, 10); // Min $10
  
  expect(largeOrder.getTotal()).toBe(13.5); // With discount
});

class Order {
  private discount = 0;
  private minimumForDiscount = 0;
  
  constructor(private items: OrderItem[]) {}
  
  applyDiscount(percentage: number, minimum = 0): void {
    this.discount = percentage;
    this.minimumForDiscount = minimum;
  }
  
  getTotal(): number {
    const subtotal = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    
    if (subtotal >= this.minimumForDiscount) {
      return subtotal * (1 - this.discount);
    }
    
    return subtotal;
  }
}
```

## Mocking in TDD

```typescript
// Test with dependency
test('sends email on user registration', async () => {
  const mockEmailService = {
    send: vi.fn().mockResolvedValue(undefined)
  };
  
  const service = new UserService(mockEmailService);
  
  await service.register('alice@example.com', 'password');
  
  expect(mockEmailService.send).toHaveBeenCalledWith(
    'alice@example.com',
    'Welcome!',
    expect.any(String)
  );
});

// Implementation
class UserService {
  constructor(private emailService: EmailService) {}
  
  async register(email: string, password: string): Promise<User> {
    const user = await this.createUser(email, password);
    await this.emailService.send(email, 'Welcome!', 'Thanks for joining');
    return user;
  }
}
```

## Refactoring with Tests

### Extract Method

```typescript
// Before: Complex method
class OrderProcessor {
  processOrder(order: Order): void {
    // Validate
    if (order.items.length === 0) {
      throw new Error('Empty order');
    }
    for (const item of order.items) {
      if (item.quantity <= 0) {
        throw new Error('Invalid quantity');
      }
    }
    
    // Calculate
    let total = 0;
    for (const item of order.items) {
      total += item.price * item.quantity;
    }
    
    // Apply discount
    if (total > 100) {
      total *= 0.9;
    }
    
    order.total = total;
  }
}

// Tests still pass! Now refactor:
class OrderProcessor {
  processOrder(order: Order): void {
    this.validateOrder(order);
    const total = this.calculateTotal(order);
    order.total = this.applyDiscounts(total);
  }
  
  private validateOrder(order: Order): void {
    if (order.items.length === 0) {
      throw new Error('Empty order');
    }
    for (const item of order.items) {
      if (item.quantity <= 0) {
        throw new Error('Invalid quantity');
      }
    }
  }
  
  private calculateTotal(order: Order): number {
    return order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
  
  private applyDiscounts(total: number): number {
    return total > 100 ? total * 0.9 : total;
  }
}

// Tests still pass! Code is cleaner.
```

## TDD Benefits

### Design Feedback

```typescript
// Bad design revealed by difficult test
test('processes payment', () => {
  const db = new Database();
  const emailService = new EmailService();
  const paymentGateway = new PaymentGateway();
  const logger = new Logger();
  const config = new Config();
  
  const processor = new PaymentProcessor(); // Too many dependencies!
  // How do we inject all these?
});

// TDD pushes toward better design
test('processes payment', () => {
  const mockPaymentGateway = { charge: vi.fn() };
  
  const processor = new PaymentProcessor(mockPaymentGateway);
  // Clean! Only one dependency.
});
```

### Prevents Over-Engineering

```typescript
// Test shows what you actually need
test('formats user name', () => {
  expect(formatName('alice')).toBe('Alice');
  expect(formatName('bob smith')).toBe('Bob Smith');
});

// Simple implementation
function formatName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// No need for complex name parsing library!
```

## TDD Patterns

### Fake It Till You Make It

```typescript
// Test
test('returns larger number', () => {
  expect(max(3, 5)).toBe(5);
});

// Fake it
function max(a: number, b: number): number {
  return 5;
}

// Add test
test('returns either number', () => {
  expect(max(3, 5)).toBe(5);
  expect(max(7, 2)).toBe(7);
});

// Make it real
function max(a: number, b: number): number {
  return a > b ? a : b;
}
```

### Triangulation

```typescript
// Test 1
test('fibonacci of 0', () => {
  expect(fib(0)).toBe(0);
});

function fib(n: number): number {
  return 0;
}

// Test 2
test('fibonacci of 1', () => {
  expect(fib(1)).toBe(1);
});

function fib(n: number): number {
  if (n === 0) return 0;
  return 1;
}

// Test 3 - Now we see the pattern
test('fibonacci sequence', () => {
  expect(fib(2)).toBe(1);
  expect(fib(3)).toBe(2);
  expect(fib(4)).toBe(3);
  expect(fib(5)).toBe(5);
});

function fib(n: number): number {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
```

### Obvious Implementation

```typescript
// When implementation is obvious, write it
test('reverses string', () => {
  expect(reverse('hello')).toBe('olleh');
});

function reverse(str: string): string {
  return str.split('').reverse().join('');
}
```

## Common Pitfalls

### Writing Too Much Code

```typescript
// ❌ Bad: Implementing everything at once
function processOrder(order: Order): Result {
  // 100 lines of code before running tests
}

// ✅ Good: Small steps
test('validates order', () => {
  expect(() => processOrder(emptyOrder)).toThrow();
});

function processOrder(order: Order): Result {
  if (order.items.length === 0) {
    throw new Error('Empty order');
  }
  return { success: true };
}

// Then add next feature
```

### Testing Implementation

```typescript
// ❌ Bad: Testing internals
test('uses array to store items', () => {
  const cart = new ShoppingCart();
  expect(cart.items).toBeInstanceOf(Array); // Private detail!
});

// ✅ Good: Testing behavior
test('stores items', () => {
  const cart = new ShoppingCart();
  cart.addItem(item);
  expect(cart.getItems()).toContain(item);
});
```

### Skipping Refactoring

```typescript
// After making tests pass, REFACTOR!

// Before refactoring
function calculate(a: number, b: number, op: string): number {
  if (op === 'add') return a + b;
  if (op === 'sub') return a - b;
  if (op === 'mul') return a * b;
  if (op === 'div') return a / b;
  throw new Error('Unknown operation');
}

// After refactoring (tests still pass)
type Operation = 'add' | 'sub' | 'mul' | 'div';

const operations: Record<Operation, (a: number, b: number) => number> = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b,
  div: (a, b) => a / b
};

function calculate(a: number, b: number, op: Operation): number {
  const operation = operations[op];
  if (!operation) throw new Error('Unknown operation');
  return operation(a, b);
}
```

## Best Practices

### 1. Write Smallest Test First

Start with simplest case, add complexity incrementally.

### 2. One Test at a Time

Don't write multiple failing tests. Focus on making one pass.

### 3. Test Behavior, Not Implementation

Focus on what code does, not how it does it.

### 4. Refactor Only When Green

Never refactor while tests are failing.

### 5. Keep Tests Fast

Slow tests discourage running them frequently.

## The Mind-Shift

**Before TDD:**
- Write code, then test it
- Unclear what to test
- Over-engineered solutions
- Fear of refactoring

**After:**
- Tests guide design
- Clear requirements from tests
- Simplest solution that works
- Confident refactoring

## Summary

**TDD Essentials**:
- Red: Write failing test
- Green: Make it pass (simplest way)
- Refactor: Improve code while keeping tests green
- Small steps
- Test behavior, not implementation

**Key insight**: *TDD is a design technique that happens to produce tests—by writing tests first, you're forced to think about how your code will be used before you write it, leading to better, simpler designs.*

---

**Next**: [Advanced Testing Patterns](../08-advanced-patterns.md)
