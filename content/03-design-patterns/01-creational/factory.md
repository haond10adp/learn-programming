# Factory Method Pattern

> *"Define an interface for creating an object, but let subclasses decide which class to instantiate."*  
> — Gang of Four

## What is the Factory Method Pattern?

The **Factory Method pattern** delegates object creation to subclasses or specialized methods. Instead of calling `new` directly, you call a factory method that decides which class to instantiate.

```typescript
// Without Factory - direct instantiation
const notification = new EmailNotification();

// With Factory - creation delegated
const notification = NotificationFactory.create('email');
```

## Why This Matters

Factory Method is useful when:
- **Creation logic is complex**: Many steps or conditions
- **Type determined at runtime**: User input, configuration, conditions
- **Encapsulate instantiation**: Hide which concrete class is created
- **Extensibility**: Easy to add new types without changing client code

## The Philosophy

Think of a factory method like a **restaurant kitchen**: you order "pasta" from the menu, and the kitchen decides whether to make Carbonara, Alfredo, or Marinara based on what's available, the chef's specialty, or your preferences. You don't need to know how each dish is made.

## Basic Implementation

### Simple Factory

```typescript
interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification {
  send(message: string): void {
    console.log(`Sending email: ${message}`);
  }
}

class SMSNotification implements Notification {
  send(message: string): void {
    console.log(`Sending SMS: ${message}`);
  }
}

class PushNotification implements Notification {
  send(message: string): void {
    console.log(`Sending push notification: ${message}`);
  }
}

// Factory
class NotificationFactory {
  static create(type: string): Notification {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SMSNotification();
      case 'push':
        return new PushNotification();
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

// Usage
const notification = NotificationFactory.create('email');
notification.send('Hello!');

const sms = NotificationFactory.create('sms');
sms.send('Quick message!');
```

### Factory Method (Abstract Creator)

```typescript
// Product interface
interface Logger {
  log(message: string): void;
}

// Concrete products
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[Console] ${message}`);
  }
}

class FileLogger implements Logger {
  log(message: string): void {
    console.log(`[File] Writing to log.txt: ${message}`);
    // In real app, write to file
  }
}

class CloudLogger implements Logger {
  log(message: string): void {
    console.log(`[Cloud] Sending to cloud: ${message}`);
    // In real app, send to cloud service
  }
}

// Abstract creator
abstract class Application {
  // Factory method (to be implemented by subclasses)
  abstract createLogger(): Logger;
  
  // Business logic that uses the logger
  run(): void {
    const logger = this.createLogger();
    logger.log('Application started');
    logger.log('Performing operations...');
    logger.log('Application finished');
  }
}

// Concrete creators
class DevelopmentApp extends Application {
  createLogger(): Logger {
    return new ConsoleLogger();
  }
}

class ProductionApp extends Application {
  createLogger(): Logger {
    return new CloudLogger();
  }
}

// Usage
const env = process.env.NODE_ENV;

let app: Application;
if (env === 'production') {
  app = new ProductionApp();
} else {
  app = new DevelopmentApp();
}

app.run();
// In dev: logs to console
// In prod: sends to cloud
```

## Real-World Examples

### Document Factory

```typescript
interface Document {
  open(): void;
  save(): void;
  close(): void;
}

class PDFDocument implements Document {
  private content: string = '';
  
  open(): void {
    console.log('Opening PDF document');
  }
  
  save(): void {
    console.log('Saving PDF document');
  }
  
  close(): void {
    console.log('Closing PDF document');
  }
}

class WordDocument implements Document {
  private content: string = '';
  
  open(): void {
    console.log('Opening Word document');
  }
  
  save(): void {
    console.log('Saving Word document');
  }
  
  close(): void {
    console.log('Closing Word document');
  }
}

class SpreadsheetDocument implements Document {
  private data: any[][] = [];
  
  open(): void {
    console.log('Opening spreadsheet');
  }
  
  save(): void {
    console.log('Saving spreadsheet');
  }
  
  close(): void {
    console.log('Closing spreadsheet');
  }
}

class DocumentFactory {
  static create(extension: string): Document {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return new PDFDocument();
      case 'doc':
      case 'docx':
        return new WordDocument();
      case 'xls':
      case 'xlsx':
        return new SpreadsheetDocument();
      default:
        throw new Error(`Unsupported document type: ${extension}`);
    }
  }
  
  static createFromFilename(filename: string): Document {
    const extension = filename.split('.').pop() || '';
    return this.create(extension);
  }
}

// Usage
const doc1 = DocumentFactory.createFromFilename('report.pdf');
doc1.open();
doc1.save();

const doc2 = DocumentFactory.createFromFilename('data.xlsx');
doc2.open();
```

### Payment Processor Factory

```typescript
interface PaymentProcessor {
  processPayment(amount: number): Promise<PaymentResult>;
  refund(transactionId: string): Promise<void>;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

class StripeProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via Stripe`);
    return {
      success: true,
      transactionId: `stripe_${Date.now()}`,
      message: 'Payment successful'
    };
  }
  
  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding Stripe transaction ${transactionId}`);
  }
}

class PayPalProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via PayPal`);
    return {
      success: true,
      transactionId: `paypal_${Date.now()}`,
      message: 'Payment successful'
    };
  }
  
  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding PayPal transaction ${transactionId}`);
  }
}

class CryptoProcessor implements PaymentProcessor {
  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via Cryptocurrency`);
    return {
      success: true,
      transactionId: `crypto_${Date.now()}`,
      message: 'Payment successful'
    };
  }
  
  async refund(transactionId: string): Promise<void> {
    console.log(`Refunding crypto transaction ${transactionId}`);
  }
}

class PaymentProcessorFactory {
  static create(method: string): PaymentProcessor {
    switch (method.toLowerCase()) {
      case 'stripe':
      case 'credit_card':
        return new StripeProcessor();
      case 'paypal':
        return new PayPalProcessor();
      case 'crypto':
      case 'bitcoin':
        return new CryptoProcessor();
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }
}

// Usage
async function checkout(amount: number, method: string) {
  const processor = PaymentProcessorFactory.create(method);
  const result = await processor.processPayment(amount);
  
  if (result.success) {
    console.log('Payment successful!', result.transactionId);
  }
}

checkout(99.99, 'stripe');
checkout(49.99, 'paypal');
```

### Database Connection Factory

```typescript
interface DatabaseConnection {
  connect(): Promise<void>;
  query(sql: string): Promise<any>;
  disconnect(): Promise<void>;
}

class PostgresConnection implements DatabaseConnection {
  async connect(): Promise<void> {
    console.log('Connecting to PostgreSQL');
  }
  
  async query(sql: string): Promise<any> {
    console.log('Executing Postgres query:', sql);
    return [];
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnecting from PostgreSQL');
  }
}

class MongoConnection implements DatabaseConnection {
  async connect(): Promise<void> {
    console.log('Connecting to MongoDB');
  }
  
  async query(sql: string): Promise<any> {
    console.log('Executing MongoDB query:', sql);
    return [];
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnecting from MongoDB');
  }
}

class MySQLConnection implements DatabaseConnection {
  async connect(): Promise<void> {
    console.log('Connecting to MySQL');
  }
  
  async query(sql: string): Promise<any> {
    console.log('Executing MySQL query:', sql);
    return [];
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnecting from MySQL');
  }
}

class DatabaseFactory {
  static create(type: string, config?: any): DatabaseConnection {
    switch (type.toLowerCase()) {
      case 'postgres':
      case 'postgresql':
        return new PostgresConnection();
      case 'mongo':
      case 'mongodb':
        return new MongoConnection();
      case 'mysql':
        return new MySQLConnection();
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
  
  static createFromUrl(url: string): DatabaseConnection {
    if (url.startsWith('postgresql://')) {
      return new PostgresConnection();
    } else if (url.startsWith('mongodb://')) {
      return new MongoConnection();
    } else if (url.startsWith('mysql://')) {
      return new MySQLConnection();
    }
    throw new Error('Invalid database URL');
  }
}

// Usage
const db = DatabaseFactory.createFromUrl(process.env.DATABASE_URL!);
await db.connect();
await db.query('SELECT * FROM users');
await db.disconnect();
```

## Common Violations

### Exposing Concrete Classes

```typescript
// ❌ BAD: Client knows about concrete classes
import { EmailNotification, SMSNotification } from './notifications';

let notification;
if (type === 'email') {
  notification = new EmailNotification();
} else {
  notification = new SMSNotification();
}

// ✅ GOOD: Client only knows about interface
import { NotificationFactory, Notification } from './notifications';

const notification: Notification = NotificationFactory.create(type);
```

### Not Using Consistent Interface

```typescript
// ❌ BAD: Different methods for different types
class EmailNotification {
  sendEmail(to: string, message: string): void {}
}

class SMSNotification {
  sendSMS(phone: string, text: string): void {}
}

// ✅ GOOD: Common interface
interface Notification {
  send(recipient: string, message: string): void;
}

class EmailNotification implements Notification {
  send(recipient: string, message: string): void {
    // Send email
  }
}

class SMSNotification implements Notification {
  send(recipient: string, message: string): void {
    // Send SMS
  }
}
```

### Hardcoding Factory Logic

```typescript
// ❌ BAD: Factory knows all types
class NotificationFactory {
  static create(type: string): Notification {
    switch (type) {
      case 'email': return new EmailNotification();
      case 'sms': return new SMSNotification();
      // Adding new type requires changing factory
    }
  }
}

// ✅ GOOD: Registry pattern for extensibility
class NotificationFactory {
  private static creators = new Map<string, () => Notification>();
  
  static register(type: string, creator: () => Notification): void {
    this.creators.set(type, creator);
  }
  
  static create(type: string): Notification {
    const creator = this.creators.get(type);
    if (!creator) {
      throw new Error(`Unknown type: ${type}`);
    }
    return creator();
  }
}

// Register types
NotificationFactory.register('email', () => new EmailNotification());
NotificationFactory.register('sms', () => new SMSNotification());

// Easy to extend
NotificationFactory.register('slack', () => new SlackNotification());
```

## Benefits

1. **Encapsulation**: Hide concrete classes from client
2. **Flexibility**: Easy to add new types
3. **Single Responsibility**: Creation logic in one place
4. **Open/Closed**: Open for extension, closed for modification
5. **Loose Coupling**: Client depends on interface, not concrete classes

## When to Use

✅ **Use Factory Method when:**
- You don't know the exact types at compile time
- Creation logic is complex or configurable
- You want to centralize object creation
- You need to support multiple types dynamically
- You want to make adding new types easy

❌ **Don't use Factory Method when:**
- Only one type exists (no need for abstraction)
- Creation is trivial (`new MyClass()`)
- It adds unnecessary complexity

## Trade-offs

**Pros:**
- Flexible object creation
- Centralized creation logic
- Easy to extend with new types
- Follows Open/Closed Principle

**Cons:**
- More classes/code
- Can be overkill for simple cases
- Adds indirection

## The Mind-Shift

**Before understanding Factory:**
- Scatter `new` calls everywhere
- Client knows all concrete classes
- Hard to add new types

**After:**
- Centralized creation
- Client depends on interfaces
- Easy extensibility

## Summary

**Factory Method Pattern**:
- Delegates object creation to a method or subclass
- Client depends on interface, not concrete class
- Factory decides which class to instantiate
- Useful when type is determined at runtime
- Makes adding new types easy
- Centralize creation logic

**Key insight**: *The Factory Method pattern is about delegating object creation—when you need flexibility in what gets created, let a factory decide instead of hardcoding `new`.*

---

**Next**: [Abstract Factory Pattern](../abstract-factory.md)
