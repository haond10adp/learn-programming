# Dependency Inversion Principle (DIP)

> *"High-level modules should not depend on low-level modules. Both should depend on abstractions."*  
> — Robert C. Martin

## What Is It?

The Dependency Inversion Principle states:
1. **High-level modules** should not import anything from **low-level modules**. Both should depend on **abstractions** (interfaces).
2. **Abstractions** should not depend on **details**. Details should depend on abstractions.

In simpler terms: **Depend on interfaces, not on concrete implementations.**

## Why This Is Beautiful

DIP creates **independence**:
- Business logic doesn't depend on infrastructure
- Components can be swapped easily
- Testing becomes simple (mock dependencies)
- Code is resilient to change

When DIP is followed, the architecture is inverted: instead of high-level code depending on low-level details, **details depend on high-level abstractions**.

## The Classic Problem

```typescript
// ❌ High-level module depends on low-level module
class MySQLDatabase {
  connect(): void {
    console.log('Connecting to MySQL');
  }

  query(sql: string): any[] {
    console.log(`Executing: ${sql}`);
    return [];
  }
}

// Business logic depends on concrete database
class OrderService {
  private database = new MySQLDatabase(); // ❌ Direct dependency!

  createOrder(order: Order): void {
    this.database.connect();
    this.database.query(`INSERT INTO orders ...`);
  }
}
```

**Problems**:
1. OrderService is **tightly coupled** to MySQL
2. Cannot switch to PostgreSQL without changing OrderService
3. Cannot test OrderService without a real database
4. High-level business logic depends on low-level infrastructure

## The Inversion

```typescript
// ✅ Define abstraction (interface)
interface Database {
  connect(): void;
  query(sql: string): any[];
}

// Low-level module implements abstraction
class MySQLDatabase implements Database {
  connect(): void {
    console.log('Connecting to MySQL');
  }

  query(sql: string): any[] {
    console.log(`Executing MySQL: ${sql}`);
    return [];
  }
}

// Another implementation
class PostgreSQLDatabase implements Database {
  connect(): void {
    console.log('Connecting to PostgreSQL');
  }

  query(sql: string): any[] {
    console.log(`Executing PostgreSQL: ${sql}`);
    return [];
  }
}

// High-level module depends on abstraction
class OrderService {
  constructor(private database: Database) {} // ✅ Abstraction!

  createOrder(order: Order): void {
    this.database.connect();
    this.database.query(`INSERT INTO orders ...`);
  }
}

// Usage: Inject the dependency
const mysqlDb = new MySQLDatabase();
const orderService = new OrderService(mysqlDb);

// Easy to switch
const postgresDb = new PostgreSQLDatabase();
const orderService2 = new OrderService(postgresDb);
```

**Now**:
- OrderService doesn't know about MySQL or PostgreSQL
- Easy to swap databases
- Easy to test (mock Database interface)
- High-level module defines the interface it needs

## The Inversion Explained

**Before DIP** (traditional flow):
```
High-Level (OrderService) 
       ↓ depends on
Low-Level (MySQLDatabase)
```

**After DIP** (inverted flow):
```
High-Level (OrderService) 
       ↓ depends on
Abstraction (Database interface)
       ↑ implemented by
Low-Level (MySQLDatabase, PostgreSQL, etc.)
```

The dependency direction is **inverted**: low-level modules now depend on abstractions defined by high-level modules.

## Real-World Example: Notification System

```typescript
// ❌ Tight coupling to email
class EmailService {
  send(to: string, message: string): void {
    console.log(`Sending email to ${to}: ${message}`);
  }
}

class UserRegistration {
  private emailService = new EmailService(); // ❌ Hard-coded

  register(user: User): void {
    // Registration logic...
    this.emailService.send(user.email, 'Welcome!');
  }
}

// What if we want SMS? Must modify UserRegistration!
```

**With DIP:**

```typescript
// ✅ Define abstraction
interface NotificationService {
  send(recipient: string, message: string): void;
}

// Implementations
class EmailService implements NotificationService {
  send(recipient: string, message: string): void {
    console.log(`Email to ${recipient}: ${message}`);
  }
}

class SMSService implements NotificationService {
  send(recipient: string, message: string): void {
    console.log(`SMS to ${recipient}: ${message}`);
  }
}

class PushNotificationService implements NotificationService {
  send(recipient: string, message: string): void {
    console.log(`Push to ${recipient}: ${message}`);
  }
}

// High-level module depends on abstraction
class UserRegistration {
  constructor(private notifier: NotificationService) {}

  register(user: User): void {
    // Registration logic...
    this.notifier.send(user.email, 'Welcome!');
  }
}

// Easy to switch!
const registration = new UserRegistration(new EmailService());
// Or
const registration2 = new UserRegistration(new SMSService());
// Or combine multiple
class MultiNotifier implements NotificationService {
  constructor(private notifiers: NotificationService[]) {}

  send(recipient: string, message: string): void {
    this.notifiers.forEach(n => n.send(recipient, message));
  }
}

const multiNotifier = new MultiNotifier([
  new EmailService(),
  new SMSService(),
  new PushNotificationService()
]);
const registration3 = new UserRegistration(multiNotifier);
```

## Dependency Injection (DI)

DIP enables **Dependency Injection**: passing dependencies from outside rather than creating them inside.

### Without DI

```typescript
class OrderService {
  private database = new MySQLDatabase(); // ❌ Creates own dependency
  private logger = new FileLogger();       // ❌ Creates own dependency

  createOrder(order: Order): void {
    this.logger.log('Creating order');
    this.database.save(order);
  }
}
```

### With DI (Constructor Injection)

```typescript
class OrderService {
  constructor(
    private database: Database,    // ✅ Injected
    private logger: Logger         // ✅ Injected
  ) {}

  createOrder(order: Order): void {
    this.logger.log('Creating order');
    this.database.save(order);
  }
}

// Create dependencies externally
const database = new MySQLDatabase();
const logger = new FileLogger();
const orderService = new OrderService(database, logger);
```

### Other Injection Methods

**Method Injection:**
```typescript
class OrderService {
  createOrder(order: Order, database: Database): void {
    database.save(order);
  }
}
```

**Property Injection:**
```typescript
class OrderService {
  database!: Database; // Set externally

  createOrder(order: Order): void {
    this.database.save(order);
  }
}

const service = new OrderService();
service.database = new MySQLDatabase();
```

**Constructor injection** is preferred: makes dependencies explicit and ensures they're provided.

## Testing Benefits

DIP makes testing trivial:

```typescript
// Mock implementation
class MockDatabase implements Database {
  private data: Order[] = [];

  connect(): void { }

  query(sql: string): any[] {
    return this.data;
  }

  save(order: Order): void {
    this.data.push(order);
  }
}

// Test
describe('OrderService', () => {
  it('creates order', () => {
    const mockDb = new MockDatabase();
    const service = new OrderService(mockDb);
    
    const order = new Order(/* ... */);
    service.createOrder(order);
    
    expect(mockDb.query('SELECT * FROM orders')).toContain(order);
  });
});
```

No real database needed! Tests are:
- **Fast**: No I/O
- **Isolated**: No external dependencies
- **Reliable**: No flaky network issues

## Inversion of Control (IoC)

DIP enables **Inversion of Control**: framework controls the flow, not your code.

### Without IoC

```typescript
// Your code controls everything
function main() {
  const database = new MySQLDatabase();
  const logger = new FileLogger();
  const orderService = new OrderService(database, logger);
  
  orderService.createOrder(order);
}
```

### With IoC Container

```typescript
// Container manages dependencies
class Container {
  private services = new Map();

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    return factory();
  }
}

// Configuration
const container = new Container();
container.register('Database', () => new MySQLDatabase());
container.register('Logger', () => new FileLogger());
container.register('OrderService', () => new OrderService(
  container.resolve('Database'),
  container.resolve('Logger')
));

// Usage: Container creates everything
const orderService = container.resolve<OrderService>('OrderService');
```

Popular IoC containers: **InversifyJS**, **TSyringe**, **TypeDI**.

## Layers and Abstractions

DIP shapes architecture into layers:

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │
│   depends on ↓                       │
├─────────────────────────────────────┤
│   Business Logic Layer               │
│   defines interfaces, doesn't know   │
│   about infrastructure               │
│   depends on ↓                       │
├─────────────────────────────────────┤
│   Abstraction Layer (Interfaces)     │
│   ↑ implemented by                   │
├─────────────────────────────────────┤
│   Infrastructure Layer (DB, APIs)    │
│   implements abstractions            │
└─────────────────────────────────────┘
```

**Key**: Business logic is at the **center**, infrastructure at the **edges**.

### Example: Layered Architecture

```typescript
// ===== Business Logic Layer =====
// Defines what it needs
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

interface EmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Business logic depends on abstractions
class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async registerUser(data: UserData): Promise<void> {
    const user = new User(data);
    await this.userRepo.save(user);
    await this.emailService.send(user.email, 'Welcome', 'Thanks for joining!');
  }
}

// ===== Infrastructure Layer =====
// Implements abstractions
class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    // MongoDB-specific code
    return null;
  }

  async save(user: User): Promise<void> {
    // MongoDB-specific code
  }
}

class SendGridEmailService implements EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    // SendGrid-specific code
  }
}

// ===== Composition Root =====
// Wire everything together
const userRepo = new MongoUserRepository();
const emailService = new SendGridEmailService();
const userService = new UserService(userRepo, emailService);
```

**Benefits**:
- Business logic doesn't know about MongoDB or SendGrid
- Easy to swap: MongoDB → PostgreSQL, SendGrid → Mailgun
- Easy to test: Mock both dependencies

## The Stable Abstractions Principle

Related to DIP:
> *"Abstractions should be more stable than implementations."*

- **Interfaces** (abstractions): Change rarely
- **Classes** (implementations): Change frequently

```typescript
// Stable: Interface rarely changes
interface PaymentProcessor {
  process(amount: number): Promise<string>;
}

// Unstable: Implementations change often
class StripePaymentProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> {
    // Stripe API v2024.1
    return 'txn_123';
  }
}

// New implementation added without changing interface
class PayPalPaymentProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> {
    // PayPal API
    return 'pp_456';
  }
}
```

## Common Violations

### 1. Creating Dependencies Internally

```typescript
// ❌ Creates dependency internally
class OrderController {
  private orderService = new OrderService(); // Hard-coded!

  createOrder(req: Request): Response {
    return this.orderService.create(req.body);
  }
}

// ✅ Inject dependency
class OrderController {
  constructor(private orderService: OrderService) {}

  createOrder(req: Request): Response {
    return this.orderService.create(req.body);
  }
}
```

### 2. Depending on Concretions

```typescript
// ❌ Depends on concrete class
class UserService {
  constructor(private repo: MongoUserRepository) {} // Concrete!
}

// ✅ Depend on abstraction
class UserService {
  constructor(private repo: UserRepository) {} // Interface!
}
```

### 3. Leaking Implementation Details

```typescript
// ❌ Interface exposes MongoDB details
interface UserRepository {
  findByMongoQuery(query: MongoQuery): User[];
}

// ✅ Abstract interface
interface UserRepository {
  findByCriteria(criteria: SearchCriteria): User[];
}
```

## The Mind-Shift

**Before DIP:**
- "Create what you need when you need it"
- "High-level code knows about low-level details"
- "One class, one file"

**After DIP:**
- "Declare what you need, receive it from outside"
- "High-level defines interfaces, low-level implements"
- "Program to interfaces, not implementations"
- "Composition root wires everything together"

This is lifechanging because you stop thinking about **concrete implementations** and start thinking about **abstract capabilities**.

## When to Apply DIP

Apply when:
- ✅ Class depends on external services (DB, API, file system)
- ✅ Multiple implementations might exist
- ✅ Testing requires mocking
- ✅ Component might be reused in different contexts

Don't apply when:
- ❌ Dependency is a simple value object
- ❌ Dependency is stable and never changes (e.g., Math, Date)
- ❌ Over-engineering simple code

Example of over-engineering:
```typescript
// ❌ Unnecessary abstraction
interface Adder {
  add(a: number, b: number): number;
}

class Calculator {
  constructor(private adder: Adder) {}
}

// Just use + operator!
```

## Real-World Example: Logger

```typescript
// ===== Abstraction =====
interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

// ===== Implementations =====
class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }
}

class FileLogger implements Logger {
  constructor(private filePath: string) {}

  info(message: string): void {
    fs.appendFileSync(this.filePath, `[INFO] ${message}\n`);
  }

  error(message: string, error?: Error): void {
    fs.appendFileSync(this.filePath, `[ERROR] ${message}\n`);
  }
}

class CloudLogger implements Logger {
  constructor(private apiKey: string) {}

  info(message: string): void {
    // Send to cloud logging service
  }

  error(message: string, error?: Error): void {
    // Send to cloud logging service
  }
}

// ===== Usage =====
class OrderService {
  constructor(private logger: Logger) {}

  createOrder(order: Order): void {
    this.logger.info('Creating order');
    // ...
    this.logger.info('Order created');
  }
}

// Easy to configure based on environment
const logger = process.env.NODE_ENV === 'production'
  ? new CloudLogger(process.env.API_KEY)
  : new ConsoleLogger();

const orderService = new OrderService(logger);
```

## Benefits

1. **Flexibility**: Swap implementations easily
2. **Testability**: Mock dependencies
3. **Maintainability**: Changes don't ripple
4. **Reusability**: Components work in different contexts
5. **Decoupling**: Business logic independent of infrastructure

## AI-Era Relevance

### What AI Does
- Creates tight coupling by default
- Instantiates dependencies directly
- Doesn't think about abstractions

### What You Must Do
- **Identify**: What are the dependencies?
- **Abstract**: Define interfaces for them
- **Inject**: Pass dependencies from outside
- **Test**: Verify with mocks
- **Guide**: Prompt AI to use dependency injection

## Summary

**Dependency Inversion Principle** means:
- Depend on abstractions (interfaces), not on concrete classes
- High-level modules define the interfaces they need
- Low-level modules implement those interfaces
- Use dependency injection to wire components together

**Key questions**:
- *"Am I depending on a concrete class?"* → Depend on interface instead
- *"Am I creating my own dependencies?"* → Inject them from outside

---

**Next**: [Composition over Inheritance](../06-composition.md)
