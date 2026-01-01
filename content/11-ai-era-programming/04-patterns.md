# AI and Design Patterns

> *"AI knows patterns. You know which pattern to use."*

## What AI Knows About Patterns

**AI has extensive knowledge** of design patterns from its training on millions of code examples. It can implement Singleton, Factory, Observer, Strategy—any classic pattern. But knowing patterns isn't the same as knowing when to use them.

```typescript
// AI can implement any pattern on request:

// Prompt: "Implement Factory pattern for creating users"
interface User {
  id: string;
  type: 'regular' | 'admin' | 'guest';
}

class UserFactory {
  static create(type: 'regular' | 'admin' | 'guest', id: string): User {
    switch (type) {
      case 'regular':
        return new RegularUser(id);
      case 'admin':
        return new AdminUser(id);
      case 'guest':
        return new GuestUser(id);
    }
  }
}
```

## Why This Matters

AI can generate pattern implementations, but YOU must:
- **Choose the right pattern** for the problem
- **Recognize when NOT to use patterns** (avoid over-engineering)
- **Adapt patterns** to your specific needs
- **Combine patterns** appropriately
- **Know trade-offs** of each pattern

## Patterns AI Implements Well

### Singleton

```typescript
// Prompt: "Create thread-safe singleton for Database"
class Database {
  private static instance: Database;
  private constructor() {}
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}
```

### Factory

```typescript
// Prompt: "Factory for payment processors (Stripe, PayPal, Square)"
interface PaymentProcessor {
  processPayment(amount: number): Promise<void>;
}

class PaymentProcessorFactory {
  create(type: 'stripe' | 'paypal' | 'square'): PaymentProcessor {
    switch (type) {
      case 'stripe':
        return new StripeProcessor();
      case 'paypal':
        return new PayPalProcessor();
      case 'square':
        return new SquareProcessor();
    }
  }
}
```

### Strategy

```typescript
// Prompt: "Strategy pattern for sorting algorithms"
interface SortStrategy<T> {
  sort(arr: T[]): T[];
}

class QuickSort<T> implements SortStrategy<T> {
  sort(arr: T[]): T[] {
    // Implementation
    return arr;
  }
}

class MergeSort<T> implements SortStrategy<T> {
  sort(arr: T[]): T[] {
    // Implementation
    return arr;
  }
}

class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}
  
  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }
  
  sort(arr: T[]): T[] {
    return this.strategy.sort(arr);
  }
}
```

### Observer

```typescript
// Prompt: "Observer pattern for event system"
interface Observer {
  update(event: Event): void;
}

class Subject {
  private observers: Observer[] = [];
  
  attach(observer: Observer): void {
    this.observers.push(observer);
  }
  
  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }
  
  notify(event: Event): void {
    for (const observer of this.observers) {
      observer.update(event);
    }
  }
}
```

## When AI Misapplies Patterns

### Over-Engineering

```typescript
// You ask: "Function to add two numbers"

// ❌ AI might over-engineer:
interface Calculator {
  calculate(a: number, b: number): number;
}

class Addition implements Calculator {
  calculate(a: number, b: number): number {
    return a + b;
  }
}

class CalculatorFactory {
  static create(operation: 'add'): Calculator {
    return new Addition();
  }
}

// ✅ You simplify:
function add(a: number, b: number): number {
  return a + b;
}
```

### Wrong Pattern Choice

```typescript
// Problem: "Need to format data in multiple ways"

// ❌ AI might suggest Factory when Strategy is better:
class FormatterFactory {
  create(type: 'json' | 'xml' | 'csv'): Formatter {
    // Factory creates formatter
  }
}

// ✅ You use Strategy:
interface Formatter {
  format(data: unknown): string;
}

class DataExporter {
  constructor(private formatter: Formatter) {}
  
  export(data: unknown): string {
    return this.formatter.format(data);
  }
}
```

## Guiding AI to Better Patterns

### Specify Pattern and Reason

```typescript
// ❌ Vague: "Make this extensible"

// ✅ Specific: "Use Strategy pattern so we can add new validation rules
// without modifying existing code (Open/Closed Principle)"

interface ValidationRule {
  validate(value: string): boolean;
  getMessage(): string;
}

class EmailRule implements ValidationRule {
  validate(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  getMessage(): string {
    return 'Invalid email format';
  }
}

class LengthRule implements ValidationRule {
  constructor(private min: number, private max: number) {}
  
  validate(value: string): boolean {
    return value.length >= this.min && value.length <= this.max;
  }
  
  getMessage(): string {
    return `Length must be between ${this.min} and ${this.max}`;
  }
}

class Validator {
  private rules: ValidationRule[] = [];
  
  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }
  
  validate(value: string): string[] {
    return this.rules
      .filter(rule => !rule.validate(value))
      .map(rule => rule.getMessage());
  }
}
```

### Provide Context

```typescript
// "We have multiple notification channels (email, SMS, push).
// New channels will be added frequently.
// Use Abstract Factory to create notification senders per channel."

interface NotificationSender {
  send(message: string): Promise<void>;
}

interface NotificationFactory {
  createSender(): NotificationSender;
}

class EmailFactory implements NotificationFactory {
  createSender(): NotificationSender {
    return new EmailSender();
  }
}

class SMSFactory implements NotificationFactory {
  createSender(): NotificationSender {
    return new SMSSender();
  }
}

class NotificationService {
  constructor(private factory: NotificationFactory) {}
  
  async notify(message: string): Promise<void> {
    const sender = this.factory.createSender();
    await sender.send(message);
  }
}
```

## Combining Patterns

```typescript
// "Create a logging system using:
// - Singleton for logger instance
// - Strategy for log formatters (JSON, Text, XML)
// - Observer for log destinations (Console, File, Remote)"

// Singleton Logger
class Logger {
  private static instance: Logger;
  private formatter: LogFormatter;
  private destinations: LogDestination[] = [];
  
  private constructor() {
    this.formatter = new TextFormatter();
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  // Strategy: Set formatter
  setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }
  
  // Observer: Add destination
  addDestination(destination: LogDestination): void {
    this.destinations.push(destination);
  }
  
  log(level: LogLevel, message: string): void {
    const formatted = this.formatter.format(level, message);
    
    // Notify all destinations
    for (const destination of this.destinations) {
      destination.write(formatted);
    }
  }
}

// Strategy: Formatters
interface LogFormatter {
  format(level: LogLevel, message: string): string;
}

class JSONFormatter implements LogFormatter {
  format(level: LogLevel, message: string): string {
    return JSON.stringify({ level, message, timestamp: new Date() });
  }
}

class TextFormatter implements LogFormatter {
  format(level: LogLevel, message: string): string {
    return `[${level}] ${message}`;
  }
}

// Observer: Destinations
interface LogDestination {
  write(message: string): void;
}

class ConsoleDestination implements LogDestination {
  write(message: string): void {
    console.log(message);
  }
}

class FileDestination implements LogDestination {
  constructor(private filePath: string) {}
  
  write(message: string): void {
    // Write to file
  }
}
```

## Pattern Anti-Patterns

### When NOT to Use Patterns

```typescript
// Simple requirement: "Get user by ID"

// ❌ Over-patterned:
interface UserReader {
  read(id: string): Promise<User>;
}

class UserReaderFactory {
  create(source: 'database'): UserReader {
    return new DatabaseUserReader();
  }
}

abstract class AbstractUserReader implements UserReader {
  abstract read(id: string): Promise<User>;
}

class DatabaseUserReader extends AbstractUserReader {
  async read(id: string): Promise<User> {
    return await db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// ✅ Simple and clear:
async function getUserById(id: string): Promise<User | null> {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}
```

## Pattern Recognition

### Teach AI Your Codebase Patterns

```typescript
// "This codebase uses these patterns:
// 1. Repository pattern for data access
// 2. Service layer for business logic
// 3. Result types instead of exceptions
// 4. Dependency injection via constructors
//
// Create a ProductService following these patterns."

interface ProductRepository {
  findById(id: string): Promise<Result<Product, NotFoundError>>;
  save(product: Product): Promise<Result<Product, DatabaseError>>;
}

class ProductService {
  constructor(private repository: ProductRepository) {}
  
  async getProduct(id: string): Promise<Result<Product, NotFoundError>> {
    return await this.repository.findById(id);
  }
  
  async createProduct(
    data: CreateProductDto
  ): Promise<Result<Product, ValidationError | DatabaseError>> {
    const validation = validateProduct(data);
    if (!validation.valid) {
      return err(new ValidationError(validation.errors));
    }
    
    const product = new Product(data);
    return await this.repository.save(product);
  }
}
```

## Modern Pattern Adaptations

### Functional Patterns

```typescript
// "Implement middleware pattern functionally (like Express/Koa)"

type Middleware<T> = (
  context: T,
  next: () => Promise<void>
) => Promise<void>;

class MiddlewareChain<T> {
  private middlewares: Middleware<T>[] = [];
  
  use(middleware: Middleware<T>): this {
    this.middlewares.push(middleware);
    return this;
  }
  
  async execute(context: T): Promise<void> {
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(context, next);
      }
    };
    
    await next();
  }
}

// Usage
const chain = new MiddlewareChain<Request>();

chain
  .use(async (req, next) => {
    console.log('Logging');
    await next();
  })
  .use(async (req, next) => {
    // Auth check
    await next();
  })
  .use(async (req, next) => {
    // Handle request
  });
```

### TypeScript-Specific Patterns

```typescript
// "Create a type-safe builder using TypeScript's type system"

type Builder<T> = {
  [K in keyof T]-?: (value: T[K]) => Builder<T> & Record<K, true>;
} & {
  build(): T;
};

function createBuilder<T>(): Builder<T> {
  const data: Partial<T> = {};
  
  return new Proxy({} as Builder<T>, {
    get(target, prop) {
      if (prop === 'build') {
        return () => data as T;
      }
      return (value: any) => {
        data[prop as keyof T] = value;
        return target;
      };
    }
  });
}

// Type-safe usage
interface User {
  id: string;
  email: string;
  name: string;
}

const builder = createBuilder<User>();
const user = builder
  .id('123')        // Must provide
  .email('test@example.com')  // Must provide
  .name('Alice')    // Must provide
  .build();         // Only available after all fields set
```

## The Mind-Shift

**Before understanding pattern context:**
- "Use patterns everywhere!"
- Copy pattern implementations blindly
- Miss simpler solutions

**After:**
- "Use patterns when they add value"
- Adapt patterns to specific needs
- Balance simplicity and structure

## Summary

**AI and Design Patterns**:
- AI knows pattern implementations
- YOU choose which pattern fits
- Guide AI with context and reasoning
- Avoid over-engineering
- Combine patterns appropriately
- Know when NOT to use patterns

**Key insight**: *AI is a pattern implementation engine—you're the architect who decides which patterns solve your problems, ensuring solutions are appropriately complex, not over-engineered.*

---

**Next**: [Testing AI Code](../05-testing.md)
