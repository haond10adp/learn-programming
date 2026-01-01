# Polymorphism

> *"Many forms, one interface."*

## What Is It?

**Polymorphism** means "many forms": the ability to treat objects of different types through a common interface. A single function can work with multiple types that share a common behavior.

Types of polymorphism:
1. **Subtype (Runtime)**: Inheritance-based, dynamic dispatch
2. **Parametric (Compile-time)**: Generics/templates
3. **Ad-hoc**: Function/operator overloading
4. **Duck Typing**: Structural typing (TypeScript!)

In simpler terms: **Write code once, work with many types.**

## Why This Is Beautiful

Polymorphism creates **abstraction**:
- Write generic code that works with multiple types
- Add new types without changing existing code
- Depend on behavior, not concrete implementations
- Open/Closed Principle in action

When polymorphism is leveraged, code becomes **flexible and extensible**.

## Subtype Polymorphism (Runtime)

The classic form: using inheritance and interfaces.

```typescript
// Common interface
interface Animal {
  makeSound(): void;
}

// Different implementations
class Dog implements Animal {
  makeSound(): void {
    console.log('Woof!');
  }
}

class Cat implements Animal {
  makeSound(): void {
    console.log('Meow!');
  }
}

class Cow implements Animal {
  makeSound(): void {
    console.log('Moo!');
  }
}

// Polymorphic function: works with any Animal
function makeAnimalSpeak(animal: Animal): void {
  animal.makeSound(); // Don't need to know concrete type!
}

// Use with different types
makeAnimalSpeak(new Dog());  // Woof!
makeAnimalSpeak(new Cat());  // Meow!
makeAnimalSpeak(new Cow());  // Moo!
```

**Key**: `makeAnimalSpeak` doesn't care about the concrete type—it works with the interface.

## Dynamic Dispatch

At runtime, the correct method is called based on the actual object type:

```typescript
class Shape {
  area(): number {
    throw new Error('Must be implemented by subclass');
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }

  area(): number {
    return this.width * this.height;
  }
}

// Polymorphic function
function printArea(shape: Shape): void {
  console.log(`Area: ${shape.area()}`); // Calls correct method at runtime!
}

const shapes: Shape[] = [
  new Circle(5),
  new Rectangle(4, 6),
  new Circle(3)
];

shapes.forEach(printArea);
// Output:
// Area: 78.54 (Circle)
// Area: 24 (Rectangle)
// Area: 28.27 (Circle)
```

**Magic**: `shape.area()` calls the correct implementation even though the variable type is `Shape`.

## Structural Polymorphism (Duck Typing)

TypeScript uses **structural typing**: if it looks like a duck and quacks like a duck, it's a duck!

```typescript
// No explicit interface declaration needed
class Duck {
  quack(): void {
    console.log('Quack!');
  }
}

class Person {
  quack(): void {
    console.log('I can quack too!');
  }
}

class Robot {
  quack(): void {
    console.log('Beep boop quack!');
  }
}

// Works with anything that has quack()
function makeItQuack(thing: { quack(): void }): void {
  thing.quack();
}

makeItQuack(new Duck());   // Quack!
makeItQuack(new Person()); // I can quack too!
makeItQuack(new Robot());  // Beep boop quack!
```

**No explicit interface needed**—TypeScript checks structure, not names.

### Interface Compatibility

```typescript
interface Printable {
  print(): void;
}

class Document {
  content: string;
  
  constructor(content: string) {
    this.content = content;
  }
  
  print(): void {
    console.log(this.content);
  }
}

class Photo {
  url: string;
  
  constructor(url: string) {
    this.url = url;
  }
  
  print(): void {
    console.log(`Printing photo: ${this.url}`);
  }
}

// Both Document and Photo are compatible with Printable
// even if they don't explicitly implement it!
function printItem(item: Printable): void {
  item.print();
}

printItem(new Document('Hello'));      // ✅ Works
printItem(new Photo('photo.jpg'));     // ✅ Works
```

TypeScript checks **shape compatibility**, not explicit declarations.

## Parametric Polymorphism (Generics)

Generics enable compile-time polymorphism:

```typescript
// Generic function: works with any type
function identity<T>(value: T): T {
  return value;
}

identity<number>(42);        // T = number
identity<string>('hello');   // T = string
identity<boolean>(true);     // T = boolean

// Type inference often works
identity(42);        // Infers T = number
identity('hello');   // Infers T = string
```

### Generic Data Structures

```typescript
class Box<T> {
  constructor(private value: T) {}

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}

const numberBox = new Box<number>(42);
console.log(numberBox.getValue()); // 42

const stringBox = new Box<string>('hello');
console.log(stringBox.getValue()); // "hello"

// Type-safe: can't put wrong type
// numberBox.setValue('hello'); // ❌ Compile error
```

### Constrained Generics

```typescript
// T must have length property
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

logLength('hello');       // 5
logLength([1, 2, 3]);     // 3
logLength({ length: 10 }); // 10
// logLength(42);          // ❌ Compile error: no length
```

### Generic Constraints with Interfaces

```typescript
interface Comparable<T> {
  compareTo(other: T): number;
}

class Version implements Comparable<Version> {
  constructor(private major: number, private minor: number) {}

  compareTo(other: Version): number {
    if (this.major !== other.major) {
      return this.major - other.major;
    }
    return this.minor - other.minor;
  }
}

function max<T extends Comparable<T>>(a: T, b: T): T {
  return a.compareTo(b) > 0 ? a : b;
}

const v1 = new Version(1, 2);
const v2 = new Version(1, 5);
console.log(max(v1, v2)); // Version(1, 5)
```

## Real-World Example: Payment Processing

```typescript
// Interface for all payment methods
interface PaymentMethod {
  processPayment(amount: number): Promise<PaymentResult>;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Different implementations
class CreditCardPayment implements PaymentMethod {
  constructor(private cardNumber: string) {}

  async processPayment(amount: number): Promise<PaymentResult> {
    // Credit card processing logic
    console.log(`Processing $${amount} via credit card`);
    return {
      success: true,
      transactionId: 'cc_' + Math.random()
    };
  }
}

class PayPalPayment implements PaymentMethod {
  constructor(private email: string) {}

  async processPayment(amount: number): Promise<PaymentResult> {
    // PayPal processing logic
    console.log(`Processing $${amount} via PayPal`);
    return {
      success: true,
      transactionId: 'pp_' + Math.random()
    };
  }
}

class CryptoPayment implements PaymentMethod {
  constructor(private walletAddress: string) {}

  async processPayment(amount: number): Promise<PaymentResult> {
    // Crypto processing logic
    console.log(`Processing $${amount} via crypto`);
    return {
      success: true,
      transactionId: 'crypto_' + Math.random()
    };
  }
}

// Polymorphic checkout function
class Checkout {
  async processPayment(
    method: PaymentMethod,
    amount: number
  ): Promise<PaymentResult> {
    // Works with ANY payment method!
    return await method.processPayment(amount);
  }
}

// Usage
const checkout = new Checkout();

await checkout.processPayment(new CreditCardPayment('1234'), 100);
await checkout.processPayment(new PayPalPayment('user@example.com'), 200);
await checkout.processPayment(new CryptoPayment('0x123...'), 300);

// Easy to add new payment method without changing Checkout!
class BankTransferPayment implements PaymentMethod {
  constructor(private accountNumber: string) {}

  async processPayment(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via bank transfer`);
    return { success: true, transactionId: 'bt_' + Math.random() };
  }
}

await checkout.processPayment(new BankTransferPayment('9876'), 400);
```

**Benefits**:
- `Checkout` doesn't care about specific payment types
- Easy to add new payment methods
- Each payment method is independently testable
- Open/Closed Principle: open for extension, closed for modification

## Method Overriding

Subclasses can override parent methods:

```typescript
class Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

class TimestampedLogger extends Logger {
  // Override to add timestamp
  log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

class ColoredLogger extends Logger {
  constructor(private color: string) {
    super();
  }

  // Override to add color
  log(message: string): void {
    console.log(`\x1b[${this.color}m[LOG] ${message}\x1b[0m`);
  }
}

// Polymorphic usage
function logMessage(logger: Logger, message: string): void {
  logger.log(message); // Calls appropriate override
}

logMessage(new Logger(), 'Hello');           // [LOG] Hello
logMessage(new TimestampedLogger(), 'Hello'); // [2024-01-01T12:00:00Z] Hello
logMessage(new ColoredLogger('32'), 'Hello'); // Green [LOG] Hello
```

## Operator Overloading (Ad-hoc Polymorphism)

TypeScript doesn't support operator overloading, but you can simulate it:

```typescript
class Vector {
  constructor(public x: number, public y: number) {}

  // Method instead of operator
  add(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y);
  }

  multiply(scalar: number): Vector {
    return new Vector(this.x * scalar, this.y * scalar);
  }

  toString(): string {
    return `(${this.x}, ${this.y})`;
  }
}

const v1 = new Vector(1, 2);
const v2 = new Vector(3, 4);

const v3 = v1.add(v2);          // (4, 6)
const v4 = v1.multiply(2);      // (2, 4)

console.log(v3.toString());
```

## Polymorphism with Union Types

TypeScript unions enable a different kind of polymorphism:

```typescript
type Shape = Circle | Rectangle | Triangle;

interface Circle {
  kind: 'circle';
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Triangle {
  kind: 'triangle';
  base: number;
  height: number;
}

// Polymorphic function using discriminated unions
function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
  }
}

const shapes: Shape[] = [
  { kind: 'circle', radius: 5 },
  { kind: 'rectangle', width: 4, height: 6 },
  { kind: 'triangle', base: 3, height: 4 }
];

shapes.forEach(shape => console.log(calculateArea(shape)));
```

**Type-safe**: TypeScript ensures all cases are handled.

## Strategy Pattern: Polymorphism in Action

```typescript
// Strategy interface
interface SortStrategy<T> {
  sort(items: T[]): T[];
}

// Concrete strategies
class QuickSort<T> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    console.log('Using QuickSort');
    // QuickSort implementation
    return [...items].sort();
  }
}

class MergeSort<T> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    console.log('Using MergeSort');
    // MergeSort implementation
    return [...items].sort();
  }
}

class BubbleSort<T> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    console.log('Using BubbleSort');
    // BubbleSort implementation
    return [...items].sort();
  }
}

// Context that uses strategy
class Sorter<T> {
  constructor(private strategy: SortStrategy<T>) {}

  // Can change strategy at runtime!
  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }

  sort(items: T[]): T[] {
    return this.strategy.sort(items);
  }
}

// Usage: polymorphic strategy selection
const numbers = [5, 2, 8, 1, 9];

const sorter = new Sorter(new QuickSort<number>());
console.log(sorter.sort(numbers)); // Using QuickSort

sorter.setStrategy(new MergeSort<number>());
console.log(sorter.sort(numbers)); // Using MergeSort

// Choose strategy based on data size
function getSortStrategy<T>(size: number): SortStrategy<T> {
  if (size < 10) return new BubbleSort<T>();
  if (size < 1000) return new QuickSort<T>();
  return new MergeSort<T>();
}

const strategy = getSortStrategy(numbers.length);
sorter.setStrategy(strategy);
```

## Polymorphism and Testing

Polymorphism makes testing easier:

```typescript
// Interface for data source
interface DataSource {
  fetch(id: string): Promise<Data>;
}

// Real implementation
class APIDataSource implements DataSource {
  async fetch(id: string): Promise<Data> {
    const response = await fetch(`/api/data/${id}`);
    return await response.json();
  }
}

// Mock for testing
class MockDataSource implements DataSource {
  private data: Map<string, Data> = new Map();

  setData(id: string, data: Data): void {
    this.data.set(id, data);
  }

  async fetch(id: string): Promise<Data> {
    const data = this.data.get(id);
    if (!data) throw new Error('Not found');
    return data;
  }
}

// Service uses interface, not concrete class
class UserService {
  constructor(private dataSource: DataSource) {}

  async getUser(id: string): Promise<Data> {
    return await this.dataSource.fetch(id);
  }
}

// Production: use real API
const service = new UserService(new APIDataSource());

// Testing: use mock
const mockSource = new MockDataSource();
mockSource.setData('123', { name: 'Alice' });
const testService = new UserService(mockSource);
```

## The Mind-Shift

**Before understanding polymorphism:**
- "Write specific code for each type"
- "Use if/switch to handle different cases"
- "Duplicate code for similar behavior"

**After understanding polymorphism:**
- "Write generic code that works with many types"
- "Use interfaces and dispatch"
- "Behavior is separated from structure"
- "Open/Closed: add types without changing code"

This is lifechanging because you stop writing repetitive, type-specific code and start writing **abstract, reusable algorithms**.

## Common Patterns

### 1. Factory Pattern

```typescript
interface Product {
  use(): void;
}

class ConcreteProductA implements Product {
  use(): void {
    console.log('Using Product A');
  }
}

class ConcreteProductB implements Product {
  use(): void {
    console.log('Using Product B');
  }
}

// Factory returns interface, hides concrete types
class ProductFactory {
  createProduct(type: string): Product {
    switch (type) {
      case 'A': return new ConcreteProductA();
      case 'B': return new ConcreteProductB();
      default: throw new Error('Unknown type');
    }
  }
}

// Client works with interface
const factory = new ProductFactory();
const product = factory.createProduct('A');
product.use(); // Polymorphic call
```

### 2. Command Pattern

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class CopyCommand implements Command {
  execute(): void { console.log('Copying...'); }
  undo(): void { console.log('Undo copy'); }
}

class PasteCommand implements Command {
  execute(): void { console.log('Pasting...'); }
  undo(): void { console.log('Undo paste'); }
}

class CommandInvoker {
  private history: Command[] = [];

  executeCommand(command: Command): void {
    command.execute();
    this.history.push(command);
  }

  undo(): void {
    const command = this.history.pop();
    command?.undo();
  }
}

// Polymorphic command execution
const invoker = new CommandInvoker();
invoker.executeCommand(new CopyCommand());
invoker.executeCommand(new PasteCommand());
invoker.undo(); // Undo paste
```

## Benefits

1. **Flexibility**: Single interface, multiple implementations
2. **Extensibility**: Add new types without changing existing code
3. **Testability**: Easy to mock and test
4. **Maintainability**: Changes localized to specific types
5. **Abstraction**: Work with behavior, not concrete types

## AI-Era Relevance

### What AI Does
- Uses concrete types everywhere
- Writes type-specific code
- Misses abstraction opportunities

### What You Must Do
- **Identify**: What behavior is common?
- **Abstract**: Create interfaces
- **Implement**: Provide concrete types
- **Test**: Verify substitutability
- **Guide**: Prompt for polymorphic designs

## Summary

**Polymorphism** means:
- Write code that works with multiple types through a common interface
- Use subtype polymorphism (inheritance/interfaces)
- Use parametric polymorphism (generics)
- Leverage structural typing (duck typing)
- Separate behavior from structure

**Key questions**:
- *"Can I write this to work with multiple types?"* → Use polymorphism
- *"Am I checking types with if/switch?"* → Consider polymorphic dispatch
- *"Is this algorithm generic?"* → Use generics

---

**Module 02 Complete!** All OOP principles covered. Continue to [Module 03: Design Patterns](../../03-design-patterns/00-index.md)
