# Open/Closed Principle (OCP)

> *"Software entities should be open for extension, but closed for modification."*  
> — Bertrand Meyer

## What Is It?

The Open/Closed Principle states that you should be able to **extend** a system's behavior **without modifying** existing code. Add new features by adding new code, not by changing old code.

## Why This Is Beautiful

OCP creates **stability**:
- Existing code doesn't change → existing tests still pass
- New features don't risk breaking old features
- System grows without destabilizing
- Extensions are isolated and safe

This is elegant because the system becomes like a plugin architecture—infinitely extensible without touching the core.

## The Paradox

*"How can I change behavior without changing code?"*

**Answer**: Through **abstraction**. Define interfaces or abstract classes, then create new implementations.

## The Key: Abstraction

```typescript
// ❌ CLOSED: Hard-coded logic
class PaymentProcessor {
  process(amount: number, method: string): void {
    if (method === 'credit-card') {
      // Credit card logic
    } else if (method === 'paypal') {
      // PayPal logic
    } else if (method === 'bitcoin') {
      // Bitcoin logic
    }
    // To add new method, must modify this code!
  }
}

// ✅ OPEN: Abstraction-based
interface PaymentMethod {
  process(amount: number): void;
}

class CreditCardPayment implements PaymentMethod {
  process(amount: number): void {
    // Credit card logic
  }
}

class PayPalPayment implements PaymentMethod {
  process(amount: number): void {
    // PayPal logic
  }
}

class PaymentProcessor {
  process(amount: number, method: PaymentMethod): void {
    method.process(amount);
    // To add new method, just create new class!
  }
}
```

The abstraction (`PaymentMethod`) is **closed**—it doesn't change.  
The implementations are **open**—we can add infinite new ones.

## Real-World Example: Shapes

### Before (Violates OCP)

```typescript
class Rectangle {
  constructor(public width: number, public height: number) {}
}

class Circle {
  constructor(public radius: number) {}
}

// ❌ Must modify to add new shapes
function calculateArea(shape: Rectangle | Circle): number {
  if (shape instanceof Rectangle) {
    return shape.width * shape.height;
  } else if (shape instanceof Circle) {
    return Math.PI * shape.radius ** 2;
  }
  // Add triangle? Must modify this function!
  return 0;
}
```

**Problem**: Adding a new shape requires modifying `calculateArea`.

### After (Follows OCP)

```typescript
// Abstraction
interface Shape {
  area(): number;
}

// Implementations (can add infinite new ones)
class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  
  area(): number {
    return this.width * this.height;
  }
}

class Circle implements Shape {
  constructor(private radius: number) {}
  
  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Triangle implements Shape {
  constructor(private base: number, private height: number) {}
  
  area(): number {
    return (this.base * this.height) / 2;
  }
}

// ✅ Never needs modification
function calculateArea(shape: Shape): number {
  return shape.area();
}

// Add new shape? Just create new class:
class Hexagon implements Shape {
  area(): number { /* ... */ }
}
```

**`calculateArea` is closed for modification, but open for extension!**

## Strategy Pattern Emerges

OCP naturally leads to the Strategy Pattern:

```typescript
// Different sorting strategies
interface SortStrategy {
  sort<T>(items: T[]): T[];
}

class QuickSort implements SortStrategy {
  sort<T>(items: T[]): T[] {
    // Quick sort implementation
    return items;
  }
}

class MergeSort implements SortStrategy {
  sort<T>(items: T[]): T[] {
    // Merge sort implementation
    return items;
  }
}

class Sorter {
  constructor(private strategy: SortStrategy) {}
  
  sort<T>(items: T[]): T[] {
    return this.strategy.sort(items);
  }
  
  // Can change strategy at runtime
  setStrategy(strategy: SortStrategy): void {
    this.strategy = strategy;
  }
}

// Add new strategy without modifying Sorter:
class BubbleSort implements SortStrategy {
  sort<T>(items: T[]): T[] {
    // Bubble sort implementation
    return items;
  }
}
```

## Techniques for OCP

### 1. Polymorphism (Interfaces/Abstract Classes)

```typescript
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

class FileLogger implements Logger {
  log(message: string): void {
    fs.appendFileSync('log.txt', message);
  }
}

// Closed for modification, open for extension
class Application {
  constructor(private logger: Logger) {}
  
  run(): void {
    this.logger.log('Application started');
  }
}
```

### 2. Dependency Injection

```typescript
// ✅ Inject dependencies (open for extension)
class EmailService {
  constructor(private transport: EmailTransport) {}
  
  send(email: Email): void {
    this.transport.send(email);
  }
}

// Can inject different transports without modifying EmailService
const service1 = new EmailService(new SMTPTransport());
const service2 = new EmailService(new SendGridTransport());
const service3 = new EmailService(new AWSTransport());
```

### 3. Configuration

```typescript
// Use configuration instead of hard-coding
interface DatabaseConfig {
  host: string;
  port: number;
  dialect: 'postgres' | 'mysql' | 'sqlite';
}

class Database {
  constructor(private config: DatabaseConfig) {}
  
  connect(): void {
    // Connect based on config
    // No code changes needed for different databases
  }
}
```

### 4. Plugin Architecture

```typescript
interface Plugin {
  initialize(): void;
  execute(context: any): void;
}

class PluginManager {
  private plugins: Plugin[] = [];
  
  register(plugin: Plugin): void {
    this.plugins.push(plugin);
    plugin.initialize();
  }
  
  run(context: any): void {
    this.plugins.forEach(plugin => plugin.execute(context));
  }
}

// Add new plugins without modifying PluginManager
class LoggingPlugin implements Plugin {
  initialize(): void { }
  execute(context: any): void {
    console.log('Logging:', context);
  }
}

class MetricsPlugin implements Plugin {
  initialize(): void { }
  execute(context: any): void {
    // Collect metrics
  }
}
```

## When OCP Applies

### ✅ Use OCP when:
- You anticipate new variations
- You have multiple implementations of the same concept
- Behavior changes frequently
- You want plugin architectures

### ❌ Don't force OCP when:
- Requirements are stable and unlikely to change
- The abstraction would be artificial
- YAGNI (You Aren't Gonna Need It)

**Premature abstraction is as bad as premature optimization.**

## The Mind-Shift

**Before understanding OCP:**
- "I'll add new behavior with if/else statements"
- "I'll modify this function to handle the new case"

**After understanding OCP:**
- "I'll define an interface and create new implementations"
- "I'll extend behavior without touching existing code"
- "I think in terms of abstractions and concrete implementations"

This is lifechanging because you stop seeing code as monolithic and start seeing it as composable, extensible systems.

## Common Violations

### 1. Switch/If-Else Chains

```typescript
// ❌ Violates OCP
function processPayment(type: string, amount: number): void {
  switch (type) {
    case 'credit-card':
      // ...
      break;
    case 'paypal':
      // ...
      break;
    case 'bitcoin':
      // ...
      break;
  }
}

// ✅ Follows OCP
interface PaymentProcessor {
  process(amount: number): void;
}

const processors: Record<string, PaymentProcessor> = {
  'credit-card': new CreditCardProcessor(),
  'paypal': new PayPalProcessor(),
  'bitcoin': new BitcoinProcessor(),
};

function processPayment(type: string, amount: number): void {
  processors[type].process(amount);
}
```

### 2. Type Checking

```typescript
// ❌ Type checking violates OCP
function handle(event: Event): void {
  if (event.type === 'click') {
    // ...
  } else if (event.type === 'scroll') {
    // ...
  }
}

// ✅ Polymorphism
interface EventHandler {
  handle(): void;
}

class ClickHandler implements EventHandler {
  handle(): void { /* ... */ }
}

class ScrollHandler implements EventHandler {
  handle(): void { /* ... */ }
}
```

## Real-World Example: Discount System

### Violates OCP

```typescript
class Order {
  applyDiscount(discountType: string): number {
    if (discountType === 'percentage') {
      return this.total * 0.9;
    } else if (discountType === 'fixed') {
      return this.total - 10;
    } else if (discountType === 'loyalty') {
      return this.total * 0.85;
    }
    // Add new discount type? Modify this method!
    return this.total;
  }
}
```

### Follows OCP

```typescript
interface DiscountStrategy {
  apply(total: number): number;
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private percent: number) {}
  
  apply(total: number): number {
    return total * (1 - this.percent / 100);
  }
}

class FixedDiscount implements DiscountStrategy {
  constructor(private amount: number) {}
  
  apply(total: number): number {
    return total - this.amount;
  }
}

class LoyaltyDiscount implements DiscountStrategy {
  constructor(private tierMultiplier: number) {}
  
  apply(total: number): number {
    return total * this.tierMultiplier;
  }
}

class Order {
  constructor(private discount: DiscountStrategy) {}
  
  calculateTotal(): number {
    return this.discount.apply(this.total);
  }
}

// Add new discount? Just create new class:
class SeasonalDiscount implements DiscountStrategy {
  apply(total: number): number {
    const month = new Date().getMonth();
    return month === 11 ? total * 0.8 : total; // December sale
  }
}
```

## Benefits

1. **Stability**: Existing code doesn't change
2. **Safety**: Old tests still pass
3. **Extensibility**: Add features easily
4. **Isolation**: New code can't break old code
5. **Testability**: Test extensions independently

## OCP and TypeScript

TypeScript's type system helps enforce OCP:

```typescript
interface Shape {
  area(): number;
}

// TypeScript ensures all shapes implement area()
class Square implements Shape {
  constructor(private size: number) {}
  area(): number {
    return this.size ** 2;
  }
}

// Compiler error if we forget to implement area()!
class Pentagon implements Shape {
  // ❌ Error: Class 'Pentagon' incorrectly implements interface 'Shape'
}
```

## AI-Era Relevance

### What AI Does
- Generates switch statements and if-else chains
- Hard-codes behavior
- Misses abstraction opportunities

### What You Must Do
- **Identify**: Where should abstractions exist?
- **Refactor**: Replace conditionals with polymorphism
- **Guide**: Prompt AI to use interfaces/strategies
- **Design**: Create extension points

## Summary

**Open/Closed Principle** means:
- **Open for extension**: Can add new behavior
- **Closed for modification**: Without changing existing code
- Use abstractions (interfaces, abstract classes)
- Think in terms of plugins and strategies

**Key technique**: Define interfaces, create implementations.

When you find yourself modifying a function to add new cases, ask: *"Can I make this open for extension instead?"*

---

**Next**: [Liskov Substitution Principle](../03-liskov-substitution.md)
