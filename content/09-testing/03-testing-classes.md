# Testing Classes

> *"Testing is about much more than finding bugs—it's about understanding the design of your code."*

## What Is Class Testing?

**Class testing** focuses on verifying the behavior of object-oriented code—testing methods, state changes, inheritance, and interactions between objects.

```typescript
class BankAccount {
  private balance: number;
  
  constructor(initialBalance: number) {
    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }
    this.balance = initialBalance;
  }
  
  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
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

// Tests
describe('BankAccount', () => {
  test('creates account with initial balance', () => {
    const account = new BankAccount(100);
    expect(account.getBalance()).toBe(100);
  });
  
  test('deposits increase balance', () => {
    const account = new BankAccount(100);
    account.deposit(50);
    expect(account.getBalance()).toBe(150);
  });
});
```

## Why This Matters

Testing classes ensures:
- **Encapsulation**: Private state is correctly managed
- **Contracts**: Public methods behave as documented
- **Invariants**: Object state remains valid
- **Inheritance**: Subclasses properly extend behavior
- **Polymorphism**: Interfaces work correctly

## Testing State

### Initial State

```typescript
class ShoppingCart {
  private items: Item[] = [];
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  itemCount(): number {
    return this.items.length;
  }
}

describe('ShoppingCart', () => {
  test('starts empty', () => {
    const cart = new ShoppingCart();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.itemCount()).toBe(0);
  });
});
```

### State Transitions

```typescript
class Order {
  private state: 'pending' | 'confirmed' | 'shipped' | 'delivered' = 'pending';
  
  confirm(): void {
    if (this.state !== 'pending') {
      throw new Error('Can only confirm pending orders');
    }
    this.state = 'confirmed';
  }
  
  ship(): void {
    if (this.state !== 'confirmed') {
      throw new Error('Can only ship confirmed orders');
    }
    this.state = 'shipped';
  }
  
  getState(): string {
    return this.state;
  }
}

describe('Order', () => {
  test('transitions from pending to confirmed', () => {
    const order = new Order();
    expect(order.getState()).toBe('pending');
    
    order.confirm();
    expect(order.getState()).toBe('confirmed');
  });
  
  test('transitions from confirmed to shipped', () => {
    const order = new Order();
    order.confirm();
    
    order.ship();
    expect(order.getState()).toBe('shipped');
  });
  
  test('cannot confirm non-pending order', () => {
    const order = new Order();
    order.confirm();
    
    expect(() => order.confirm()).toThrow('Can only confirm pending orders');
  });
});
```

## Testing Methods

### Testing Return Values

```typescript
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
  
  multiply(a: number, b: number): number {
    return a * b;
  }
}

describe('Calculator', () => {
  let calc: Calculator;
  
  beforeEach(() => {
    calc = new Calculator();
  });
  
  test('adds numbers', () => {
    expect(calc.add(2, 3)).toBe(5);
    expect(calc.add(-1, 1)).toBe(0);
  });
  
  test('multiplies numbers', () => {
    expect(calc.multiply(3, 4)).toBe(12);
    expect(calc.multiply(0, 5)).toBe(0);
  });
});
```

### Testing Side Effects

```typescript
class Logger {
  private logs: string[] = [];
  
  log(message: string): void {
    this.logs.push(`${new Date().toISOString()}: ${message}`);
  }
  
  getLogs(): string[] {
    return [...this.logs];
  }
  
  clear(): void {
    this.logs = [];
  }
}

describe('Logger', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = new Logger();
  });
  
  test('logs messages', () => {
    logger.log('Hello');
    logger.log('World');
    
    const logs = logger.getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Hello');
    expect(logs[1]).toContain('World');
  });
  
  test('clears logs', () => {
    logger.log('Test');
    logger.clear();
    
    expect(logger.getLogs()).toHaveLength(0);
  });
});
```

## Testing with Dependencies

### Constructor Injection

```typescript
interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

class UserService {
  constructor(
    private emailSender: EmailSender
  ) {}
  
  async registerUser(email: string): Promise<void> {
    // Registration logic...
    await this.emailSender.send(
      email,
      'Welcome!',
      'Thanks for registering'
    );
  }
}

// Test with mock
describe('UserService', () => {
  test('sends welcome email on registration', async () => {
    const mockEmailSender: EmailSender = {
      send: vi.fn()
    };
    
    const service = new UserService(mockEmailSender);
    await service.registerUser('test@example.com');
    
    expect(mockEmailSender.send).toHaveBeenCalledWith(
      'test@example.com',
      'Welcome!',
      'Thanks for registering'
    );
  });
});
```

### Property Injection

```typescript
class NotificationService {
  emailSender?: EmailSender;
  smsSender?: SmsSender;
  
  async notify(user: User, message: string): Promise<void> {
    if (this.emailSender && user.email) {
      await this.emailSender.send(user.email, 'Notification', message);
    }
    if (this.smsSender && user.phone) {
      await this.smsSender.send(user.phone, message);
    }
  }
}

describe('NotificationService', () => {
  test('sends email when email sender is configured', async () => {
    const mockEmailSender: EmailSender = { send: vi.fn() };
    const service = new NotificationService();
    service.emailSender = mockEmailSender;
    
    await service.notify(
      { email: 'test@example.com' },
      'Hello'
    );
    
    expect(mockEmailSender.send).toHaveBeenCalledWith(
      'test@example.com',
      'Notification',
      'Hello'
    );
  });
});
```

## Testing Inheritance

### Testing Base Class

```typescript
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;
  
  describe(): string {
    return `Area: ${this.area()}, Perimeter: ${this.perimeter()}`;
  }
}

class Rectangle extends Shape {
  constructor(
    private width: number,
    private height: number
  ) {
    super();
  }
  
  area(): number {
    return this.width * this.height;
  }
  
  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}

describe('Rectangle', () => {
  test('calculates area', () => {
    const rect = new Rectangle(4, 5);
    expect(rect.area()).toBe(20);
  });
  
  test('calculates perimeter', () => {
    const rect = new Rectangle(4, 5);
    expect(rect.perimeter()).toBe(18);
  });
  
  test('describes shape', () => {
    const rect = new Rectangle(4, 5);
    expect(rect.describe()).toBe('Area: 20, Perimeter: 18');
  });
});
```

### Testing Overridden Methods

```typescript
class Animal {
  speak(): string {
    return 'Some sound';
  }
}

class Dog extends Animal {
  speak(): string {
    return 'Woof!';
  }
}

class Cat extends Animal {
  speak(): string {
    return 'Meow!';
  }
}

describe('Animal subclasses', () => {
  test('Dog speaks correctly', () => {
    const dog = new Dog();
    expect(dog.speak()).toBe('Woof!');
  });
  
  test('Cat speaks correctly', () => {
    const cat = new Cat();
    expect(cat.speak()).toBe('Meow!');
  });
  
  test('polymorphic behavior', () => {
    const animals: Animal[] = [new Dog(), new Cat()];
    const sounds = animals.map(a => a.speak());
    expect(sounds).toEqual(['Woof!', 'Meow!']);
  });
});
```

## Testing Encapsulation

### Testing Through Public Interface

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
  
  reset(): void {
    this.count = 0;
  }
}

describe('Counter', () => {
  // ❌ Bad: Accessing private state
  // test('has count property', () => {
  //   const counter = new Counter();
  //   expect(counter.count).toBe(0);
  // });
  
  // ✅ Good: Testing through public interface
  test('starts at zero', () => {
    const counter = new Counter();
    expect(counter.getCount()).toBe(0);
  });
  
  test('increments and decrements', () => {
    const counter = new Counter();
    counter.increment();
    counter.increment();
    counter.decrement();
    expect(counter.getCount()).toBe(1);
  });
  
  test('resets to zero', () => {
    const counter = new Counter();
    counter.increment();
    counter.reset();
    expect(counter.getCount()).toBe(0);
  });
});
```

## Testing Invariants

```typescript
class DateRange {
  constructor(
    private start: Date,
    private end: Date
  ) {
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
  }
  
  getDuration(): number {
    return this.end.getTime() - this.start.getTime();
  }
  
  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }
}

describe('DateRange', () => {
  test('enforces start before end', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2023-12-31');
    
    expect(() => new DateRange(start, end)).toThrow(
      'Start date must be before end date'
    );
  });
  
  test('calculates duration', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const range = new DateRange(start, end);
    
    expect(range.getDuration()).toBe(24 * 60 * 60 * 1000); // 1 day
  });
  
  test('checks if date is in range', () => {
    const range = new DateRange(
      new Date('2024-01-01'),
      new Date('2024-01-31')
    );
    
    expect(range.contains(new Date('2024-01-15'))).toBe(true);
    expect(range.contains(new Date('2024-02-01'))).toBe(false);
  });
});
```

## Testing Static Methods

```typescript
class MathUtils {
  static factorial(n: number): number {
    if (n < 0) {
      throw new Error('Factorial not defined for negative numbers');
    }
    if (n === 0 || n === 1) return 1;
    return n * MathUtils.factorial(n - 1);
  }
  
  static fibonacci(n: number): number {
    if (n <= 1) return n;
    return MathUtils.fibonacci(n - 1) + MathUtils.fibonacci(n - 2);
  }
}

describe('MathUtils', () => {
  describe('factorial', () => {
    test('calculates factorial', () => {
      expect(MathUtils.factorial(0)).toBe(1);
      expect(MathUtils.factorial(1)).toBe(1);
      expect(MathUtils.factorial(5)).toBe(120);
    });
    
    test('throws for negative numbers', () => {
      expect(() => MathUtils.factorial(-1)).toThrow();
    });
  });
  
  describe('fibonacci', () => {
    test('calculates fibonacci numbers', () => {
      expect(MathUtils.fibonacci(0)).toBe(0);
      expect(MathUtils.fibonacci(1)).toBe(1);
      expect(MathUtils.fibonacci(6)).toBe(8);
    });
  });
});
```

## Testing Builders

```typescript
class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly role: 'user' | 'admin'
  ) {}
}

class UserBuilder {
  private id = 'default-id';
  private name = 'Default Name';
  private email = 'default@example.com';
  private role: 'user' | 'admin' = 'user';
  
  withId(id: string): this {
    this.id = id;
    return this;
  }
  
  withName(name: string): this {
    this.name = name;
    return this;
  }
  
  withEmail(email: string): this {
    this.email = email;
    return this;
  }
  
  withRole(role: 'user' | 'admin'): this {
    this.role = role;
    return this;
  }
  
  build(): User {
    return new User(this.id, this.name, this.email, this.role);
  }
}

describe('UserBuilder', () => {
  test('builds user with defaults', () => {
    const user = new UserBuilder().build();
    
    expect(user.id).toBe('default-id');
    expect(user.name).toBe('Default Name');
    expect(user.email).toBe('default@example.com');
    expect(user.role).toBe('user');
  });
  
  test('builds user with custom values', () => {
    const user = new UserBuilder()
      .withId('123')
      .withName('Alice')
      .withEmail('alice@example.com')
      .withRole('admin')
      .build();
    
    expect(user.id).toBe('123');
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
    expect(user.role).toBe('admin');
  });
  
  test('chains method calls', () => {
    const user = new UserBuilder()
      .withName('Bob')
      .withEmail('bob@example.com')
      .build();
    
    expect(user.name).toBe('Bob');
    expect(user.email).toBe('bob@example.com');
  });
});
```

## Testing Value Objects

```typescript
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }
  
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

describe('Money', () => {
  test('creates money with amount and currency', () => {
    const money = new Money(100, 'USD');
    expect(money.amount).toBe(100);
    expect(money.currency).toBe('USD');
  });
  
  test('throws for negative amount', () => {
    expect(() => new Money(-10, 'USD')).toThrow('Amount cannot be negative');
  });
  
  test('adds money with same currency', () => {
    const m1 = new Money(100, 'USD');
    const m2 = new Money(50, 'USD');
    const result = m1.add(m2);
    
    expect(result.amount).toBe(150);
    expect(result.currency).toBe('USD');
  });
  
  test('throws when adding different currencies', () => {
    const m1 = new Money(100, 'USD');
    const m2 = new Money(50, 'EUR');
    
    expect(() => m1.add(m2)).toThrow('Cannot add different currencies');
  });
  
  test('compares equality', () => {
    const m1 = new Money(100, 'USD');
    const m2 = new Money(100, 'USD');
    const m3 = new Money(50, 'USD');
    
    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
  });
});
```

## Testing Complex Interactions

```typescript
class Inventory {
  private items = new Map<string, number>();
  
  add(itemId: string, quantity: number): void {
    const current = this.items.get(itemId) || 0;
    this.items.set(itemId, current + quantity);
  }
  
  remove(itemId: string, quantity: number): void {
    const current = this.items.get(itemId) || 0;
    if (current < quantity) {
      throw new Error('Insufficient quantity');
    }
    this.items.set(itemId, current - quantity);
  }
  
  getQuantity(itemId: string): number {
    return this.items.get(itemId) || 0;
  }
}

class OrderProcessor {
  constructor(private inventory: Inventory) {}
  
  processOrder(items: Array<{ id: string; quantity: number }>): void {
    // Check availability first
    for (const item of items) {
      if (this.inventory.getQuantity(item.id) < item.quantity) {
        throw new Error(`Insufficient stock for ${item.id}`);
      }
    }
    
    // Remove items
    for (const item of items) {
      this.inventory.remove(item.id, item.quantity);
    }
  }
}

describe('OrderProcessor', () => {
  let inventory: Inventory;
  let processor: OrderProcessor;
  
  beforeEach(() => {
    inventory = new Inventory();
    processor = new OrderProcessor(inventory);
  });
  
  test('processes order with sufficient stock', () => {
    inventory.add('item1', 10);
    inventory.add('item2', 20);
    
    processor.processOrder([
      { id: 'item1', quantity: 5 },
      { id: 'item2', quantity: 10 }
    ]);
    
    expect(inventory.getQuantity('item1')).toBe(5);
    expect(inventory.getQuantity('item2')).toBe(10);
  });
  
  test('throws when insufficient stock', () => {
    inventory.add('item1', 5);
    
    expect(() => {
      processor.processOrder([{ id: 'item1', quantity: 10 }]);
    }).toThrow('Insufficient stock for item1');
  });
  
  test('does not modify inventory on error', () => {
    inventory.add('item1', 10);
    inventory.add('item2', 5);
    
    try {
      processor.processOrder([
        { id: 'item1', quantity: 5 },
        { id: 'item2', quantity: 10 } // Not enough!
      ]);
    } catch {}
    
    // Inventory should not change
    expect(inventory.getQuantity('item1')).toBe(10);
    expect(inventory.getQuantity('item2')).toBe(5);
  });
});
```

## Best Practices

### 1. Use Test Fixtures

```typescript
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides
  };
}

test('example', () => {
  const admin = createTestUser({ role: 'admin' });
  expect(admin.role).toBe('admin');
});
```

### 2. Test One Behavior Per Test

```typescript
// ❌ Bad: Multiple behaviors
test('account operations', () => {
  const account = new BankAccount(100);
  account.deposit(50);
  expect(account.getBalance()).toBe(150);
  account.withdraw(30);
  expect(account.getBalance()).toBe(120);
});

// ✅ Good: Separate tests
test('deposit increases balance', () => {
  const account = new BankAccount(100);
  account.deposit(50);
  expect(account.getBalance()).toBe(150);
});

test('withdraw decreases balance', () => {
  const account = new BankAccount(100);
  account.withdraw(30);
  expect(account.getBalance()).toBe(70);
});
```

### 3. Use Descriptive Test Names

```typescript
// ✅ Good: Clear what is being tested
test('throws error when withdrawing more than balance', () => {
  const account = new BankAccount(50);
  expect(() => account.withdraw(100)).toThrow('Insufficient funds');
});
```

## The Mind-Shift

**Before testing classes:**
- Manual testing through UI
- Unclear what changed when refactoring
- Fear of breaking encapsulation

**After:**
- Automated behavior verification
- Clear contracts through tests
- Confident refactoring of internals

## Summary

**Testing Classes**:
- Test through public interface
- Verify state transitions
- Test invariants and contracts
- Use dependency injection
- Test inheritance and polymorphism

**Key insight**: *Test behavior, not implementation—good class tests verify public contracts while respecting encapsulation, making refactoring safe and code more maintainable.*

---

**Next**: [Mocking](../04-mocking.md)
