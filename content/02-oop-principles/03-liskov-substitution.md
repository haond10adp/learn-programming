# Liskov Substitution Principle (LSP)

> *"Subtypes must be substitutable for their base types."*  
> — Barbara Liskov

## What Is It?

The Liskov Substitution Principle states that objects of a subclass should be able to **replace objects of the superclass** without breaking the program. If S is a subtype of T, then objects of type T can be replaced with objects of type S without altering correctness.

In simpler terms: **Derived classes must honor the contract of their base classes.**

## Why This Is Beautiful

LSP creates **reliability**:
- Polymorphism works correctly
- Abstractions are trustworthy
- Code behaves predictably
- Substitution is safe

When LSP is followed, inheritance becomes a powerful tool for abstraction rather than a source of bugs.

## The Classic Example: Rectangle and Square

This is THE example that breaks LSP:

```typescript
// Seems logical: Square IS-A Rectangle
class Rectangle {
  constructor(
    protected width: number,
    protected height: number
  ) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  area(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  // Square must have width === height
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // Keep them equal!
  }

  setHeight(height: number): void {
    this.width = height;
    this.height = height; // Keep them equal!
  }
}
```

**Problem**: This breaks LSP!

```typescript
function processRectangle(rect: Rectangle): void {
  rect.setWidth(5);
  rect.setHeight(4);
  
  console.log(rect.area()); // Expect 20
}

const rect = new Rectangle(0, 0);
processRectangle(rect); // 20 ✅

const square = new Square(0, 0);
processRectangle(square); // 16 ❌ Expected 20!
```

**Square cannot substitute for Rectangle** because it violates the expected behavior.

**Mathematical truth ≠ Programming truth**
- Mathematically: Square IS-A Rectangle
- In code: Square BEHAVES-LIKE Rectangle? NO!

## The Contract

LSP is about **behavioral subtyping**—subtypes must preserve the **contract** of the base type:

1. **Preconditions** cannot be strengthened
2. **Postconditions** cannot be weakened
3. **Invariants** must be preserved
4. **History constraint** (immutability, etc.)

### Example: Strengthening Preconditions (Violates LSP)

```typescript
class Bird {
  // Contract: Can fly with any speed >= 0
  fly(speed: number): void {
    if (speed < 0) throw new Error('Invalid speed');
    console.log(`Flying at ${speed} mph`);
  }
}

class FastBird extends Bird {
  // ❌ Strengthens precondition: Now requires speed > 10
  fly(speed: number): void {
    if (speed <= 10) throw new Error('Too slow!');
    super.fly(speed);
  }
}

function makeBirdFly(bird: Bird): void {
  bird.fly(5); // Valid for Bird, but fails for FastBird!
}
```

**Violation**: Subtype requires MORE than base type.

### Example: Weakening Postconditions (Violates LSP)

```typescript
class Account {
  private balance = 0;

  // Contract: Returns actual withdrawn amount
  withdraw(amount: number): number {
    if (amount > this.balance) {
      amount = this.balance;
    }
    this.balance -= amount;
    return amount; // Guarantees: return value <= requested amount
  }
}

class PremiumAccount extends Account {
  // ❌ Weakens postcondition: Can return more than requested
  withdraw(amount: number): number {
    // Premium accounts get 10% bonus
    const actualAmount = amount * 1.1;
    return super.withdraw(actualAmount); // Can return MORE than requested!
  }
}
```

**Violation**: Subtype guarantees LESS than base type.

## Real-World Violations

### 1. NotImplementedError

```typescript
interface Bird {
  fly(): void;
}

class Sparrow implements Bird {
  fly(): void {
    console.log('Flying!');
  }
}

// ❌ Violates LSP!
class Penguin implements Bird {
  fly(): void {
    throw new Error('Penguins cannot fly!');
  }
}

function makeBirdFly(bird: Bird): void {
  bird.fly(); // Crashes for Penguin!
}
```

**Fix**: Don't use inheritance when behavior differs fundamentally.

```typescript
// ✅ Better design
interface Bird {
  move(): void;
}

class Sparrow implements Bird {
  move(): void {
    console.log('Flying!');
  }
}

class Penguin implements Bird {
  move(): void {
    console.log('Swimming!');
  }
}
```

### 2. Returning null/undefined Unexpectedly

```typescript
class DataProvider {
  getData(): string {
    return 'data'; // Contract: always returns string
  }
}

// ❌ Violates LSP
class CachedDataProvider extends DataProvider {
  getData(): string | null {
    // Returns null when cache is empty
    return this.cache || null; // Violates return type!
  }
}
```

### 3. Modifying Parent Behavior Drastically

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }
}

// ❌ Completely changes behavior
class RandomStack<T> extends Stack<T> {
  pop(): T | undefined {
    // Returns random item instead of last one!
    const index = Math.floor(Math.random() * this.items.length);
    return this.items.splice(index, 1)[0];
  }
}
```

## How to Follow LSP

### 1. Design by Contract

Define clear contracts:

```typescript
interface PaymentProcessor {
  /**
   * Process payment
   * Precondition: amount > 0
   * Postcondition: Returns transaction ID
   * Exception: PaymentError if payment fails
   */
  process(amount: number): Promise<string>;
}

class CreditCardProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> {
    if (amount <= 0) throw new Error('Amount must be positive');
    // Process...
    return 'txn_' + Math.random();
  }
}

// Must honor the same contract
class PayPalProcessor implements PaymentProcessor {
  async process(amount: number): Promise<string> {
    if (amount <= 0) throw new Error('Amount must be positive');
    // Process...
    return 'pp_' + Math.random();
  }
}
```

### 2. Use Composition Over Inheritance

Often, composition avoids LSP violations:

```typescript
// Instead of inheritance:
// class Square extends Rectangle { }

// Use composition:
class Square {
  constructor(private size: number) {}

  area(): number {
    return this.size ** 2;
  }
}

class Rectangle {
  constructor(private width: number, private height: number) {}

  area(): number {
    return this.width * this.height;
  }
}

// Common interface if needed
interface Shape {
  area(): number;
}
```

### 3. Favor Interfaces Over Classes

```typescript
// ✅ Interface defines contract
interface Flyable {
  fly(speed: number): void;
}

interface Swimmable {
  swim(speed: number): void;
}

class Duck implements Flyable, Swimmable {
  fly(speed: number): void { /* ... */ }
  swim(speed: number): void { /* ... */ }
}

class Penguin implements Swimmable {
  swim(speed: number): void { /* ... */ }
  // No fly() method—doesn't claim to fly
}
```

### 4. Test Substitutability

Write tests that verify LSP:

```typescript
describe('Shape LSP', () => {
  function testShape(shape: Shape): void {
    const area = shape.area();
    expect(area).toBeGreaterThan(0);
    expect(typeof area).toBe('number');
  }

  test('Rectangle substitutes for Shape', () => {
    testShape(new Rectangle(5, 4));
  });

  test('Circle substitutes for Shape', () => {
    testShape(new Circle(3));
  });

  test('Triangle substitutes for Shape', () => {
    testShape(new Triangle(5, 4));
  });
});
```

## Covariance and Contravariance

LSP relates to type variance:

### Covariance (Return Types)

Subtypes can return MORE specific types:

```typescript
class Animal { }
class Dog extends Animal { }

class AnimalShelter {
  getAnimal(): Animal {
    return new Animal();
  }
}

// ✅ Covariance: Can return more specific type
class DogShelter extends AnimalShelter {
  getAnimal(): Dog {
    return new Dog(); // Dog IS-A Animal
  }
}
```

### Contravariance (Parameter Types)

Subtypes can accept MORE general parameters:

```typescript
class Handler {
  handle(animal: Dog): void {
    // Expects Dog
  }
}

// ✅ Contravariance: Can accept more general type
class GeneralHandler extends Handler {
  handle(animal: Animal): void {
    // Accepts any Animal (including Dog)
  }
}
```

## The Mind-Shift

**Before understanding LSP:**
- "Inheritance models IS-A relationships"
- "If mathematically A IS-A B, then inherit"

**After understanding LSP:**
- "Inheritance models BEHAVES-LIKE relationships"
- "Can A substitute for B in all contexts?"
- "Composition often beats inheritance"

This is lifechanging because you stop using inheritance casually and start thinking about behavioral contracts.

## When Inheritance Is Appropriate

Inheritance works when:
- ✅ Subtype truly extends, doesn't change behavior
- ✅ All methods make sense for subtype
- ✅ Subtype can be used anywhere base type is used
- ✅ You can pass all the same tests

If in doubt, **use composition**.

## Real-World Example: Storage

```typescript
// ❌ Violates LSP
interface Storage {
  save(key: string, value: string): void;
  load(key: string): string;
}

class DiskStorage implements Storage {
  save(key: string, value: string): void {
    fs.writeFileSync(key, value);
  }

  load(key: string): string {
    return fs.readFileSync(key, 'utf-8');
  }
}

class InMemoryStorage implements Storage {
  private data = new Map();

  save(key: string, value: string): void {
    this.data.set(key, value);
  }

  // ❌ Violates LSP: throws when key doesn't exist
  load(key: string): string {
    if (!this.data.has(key)) {
      throw new Error('Key not found'); // DiskStorage returns empty string!
    }
    return this.data.get(key);
  }
}
```

**Fix**: Make contract explicit:

```typescript
// ✅ Clear contract
interface Storage {
  save(key: string, value: string): void;
  load(key: string): string | null; // Can return null
}

class DiskStorage implements Storage {
  save(key: string, value: string): void {
    fs.writeFileSync(key, value);
  }

  load(key: string): string | null {
    try {
      return fs.readFileSync(key, 'utf-8');
    } catch {
      return null;
    }
  }
}

class InMemoryStorage implements Storage {
  private data = new Map();

  save(key: string, value: string): void {
    this.data.set(key, value);
  }

  load(key: string): string | null {
    return this.data.get(key) || null;
  }
}
```

## Benefits

1. **Predictable**: Polymorphism works as expected
2. **Trustworthy**: Can rely on abstractions
3. **Testable**: Test once at base level
4. **Maintainable**: Changes don't break substitutability
5. **Safe**: Runtime surprises reduced

## AI-Era Relevance

### What AI Does
- Creates inheritance hierarchies naively
- Violates LSP without realizing
- Doesn't think about behavioral contracts

### What You Must Do
- **Review**: Can subtype truly substitute?
- **Test**: Verify substitutability
- **Refactor**: Remove inappropriate inheritance
- **Guide**: Prompt for composition over inheritance

## Summary

**Liskov Substitution Principle** means:
- Subtypes must be behaviorally compatible with base types
- Don't strengthen preconditions
- Don't weaken postconditions
- Preserve invariants
- If in doubt, use composition

**Key question**: *"Can I use the subtype anywhere the base type is expected?"*

If the answer is no, you're violating LSP.

---

**Next**: [Interface Segregation Principle](../04-interface-segregation.md)
