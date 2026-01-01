# Composition Over Inheritance

> *"Favor object composition over class inheritance."*  
> — Gang of Four, Design Patterns

## What Is It?

**Composition over Inheritance** is the principle that you should build complex behavior by **combining simple objects** rather than using inheritance hierarchies.

- **Inheritance**: "IS-A" relationship (Dog IS-A Animal)
- **Composition**: "HAS-A" relationship (Car HAS-A Engine)

In simpler terms: **Build functionality by assembling components, not by inheriting from parents.**

## Why This Is Beautiful

Composition creates **flexibility**:
- Behavior can be changed at runtime
- No rigid hierarchies
- Easier to understand and test
- Avoids the fragile base class problem

When composition is used, systems become **modular**: swap parts, combine differently, evolve independently.

## The Problem with Inheritance

```typescript
// ❌ Inheritance hierarchy
class Animal {
  move(): void {
    console.log('Moving');
  }
}

class FlyingAnimal extends Animal {
  fly(): void {
    console.log('Flying');
  }
}

class SwimmingAnimal extends Animal {
  swim(): void {
    console.log('Swimming');
  }
}

// Problem: What about a duck that flies AND swims?
// Multiple inheritance not supported in most languages!

class Duck extends FlyingAnimal {
  // Can fly, but can't swim!
}

// Try to add swimming?
class FlyingSwimmingAnimal extends FlyingAnimal {
  swim(): void {
    console.log('Swimming');
  }
}

// Now we need: FlyingSwimmingAnimal, FlyingWalkingAnimal, SwimmingWalkingAnimal...
// Combinatorial explosion!
```

**Problems**:
1. **Rigid hierarchy**: Must fit into one tree
2. **No multiple inheritance**: Can't be both Flying and Swimming
3. **Tight coupling**: Child depends on parent
4. **Fragile base class**: Changes to parent break children

## The Solution: Composition

```typescript
// ✅ Composition: Build with components
interface Movable {
  move(): void;
}

class WalkingAbility implements Movable {
  move(): void {
    console.log('Walking');
  }
}

class FlyingAbility implements Movable {
  move(): void {
    console.log('Flying');
  }
}

class SwimmingAbility implements Movable {
  move(): void {
    console.log('Swimming');
  }
}

// Compose abilities
class Duck {
  constructor(
    private flying: FlyingAbility,
    private swimming: SwimmingAbility
  ) {}

  move(): void {
    this.flying.move();
    this.swimming.move();
  }
}

class Penguin {
  constructor(
    private walking: WalkingAbility,
    private swimming: SwimmingAbility
  ) {}

  move(): void {
    this.walking.move();
    this.swimming.move();
  }
}

// Easy to compose any combination!
const duck = new Duck(new FlyingAbility(), new SwimmingAbility());
const penguin = new Penguin(new WalkingAbility(), new SwimmingAbility());
```

**Benefits**:
- Any combination of abilities
- Add/remove abilities at runtime
- Each ability is independent and testable
- No fragile base class

## The Fragile Base Class Problem

```typescript
// ❌ Inheritance: Child depends on parent internals
class Counter {
  protected count = 0;

  increment(): void {
    this.count++;
  }

  add(n: number): void {
    for (let i = 0; i < n; i++) {
      this.increment(); // Uses increment()
    }
  }

  getCount(): number {
    return this.count;
  }
}

class LoggingCounter extends Counter {
  private incrementCalls = 0;

  increment(): void {
    this.incrementCalls++;
    super.increment();
  }

  getIncrementCalls(): number {
    return this.incrementCalls;
  }
}

const counter = new LoggingCounter();
counter.add(5); // Calls increment() 5 times
console.log(counter.getIncrementCalls()); // 5 ✅

// Now someone "optimizes" the base class:
class Counter {
  protected count = 0;

  increment(): void {
    this.count++;
  }

  // "Optimized" to not use increment()
  add(n: number): void {
    this.count += n; // Direct addition!
  }

  getCount(): number {
    return this.count;
  }
}

// Child breaks!
const counter2 = new LoggingCounter();
counter2.add(5); // Doesn't call increment()!
console.log(counter2.getIncrementCalls()); // 0 ❌ Expected 5
```

**Problem**: Child depends on **implementation details** of parent. Changes to parent break child.

**With Composition**:

```typescript
// ✅ Composition: No hidden dependencies
interface Counter {
  increment(): void;
  add(n: number): void;
  getCount(): number;
}

class BasicCounter implements Counter {
  private count = 0;

  increment(): void {
    this.count++;
  }

  add(n: number): void {
    this.count += n; // Can optimize freely
  }

  getCount(): number {
    return this.count;
  }
}

class LoggingCounter implements Counter {
  private incrementCalls = 0;

  constructor(private counter: Counter) {}

  increment(): void {
    this.incrementCalls++;
    this.counter.increment();
  }

  add(n: number): void {
    // Doesn't assume implementation
    this.counter.add(n);
  }

  getCount(): number {
    return this.counter.getCount();
  }

  getIncrementCalls(): number {
    return this.incrementCalls;
  }
}

// Works regardless of BasicCounter's implementation
const counter = new LoggingCounter(new BasicCounter());
```

## Real-World Example: Game Characters

```typescript
// ❌ Inheritance approach
class Character {
  health = 100;
  
  takeDamage(damage: number): void {
    this.health -= damage;
  }
}

class MeleeCharacter extends Character {
  attack(): void {
    console.log('Melee attack!');
  }
}

class RangedCharacter extends Character {
  attack(): void {
    console.log('Ranged attack!');
  }
}

class MagicCharacter extends Character {
  mana = 100;
  
  castSpell(): void {
    console.log('Casting spell!');
  }
}

// What about a character with melee AND magic?
// Need MeleeMagicCharacter, RangedMagicCharacter, etc.
// Combinatorial explosion!
```

**With Composition**:

```typescript
// ✅ Composition approach
interface AttackBehavior {
  attack(): void;
}

class MeleeAttack implements AttackBehavior {
  attack(): void {
    console.log('Melee attack!');
  }
}

class RangedAttack implements AttackBehavior {
  attack(): void {
    console.log('Ranged attack!');
  }
}

class MagicAttack implements AttackBehavior {
  constructor(private manaCost: number) {}
  
  attack(): void {
    console.log(`Casting spell (costs ${this.manaCost} mana)!`);
  }
}

class Character {
  private health = 100;
  private attacks: AttackBehavior[] = [];

  constructor(attacks: AttackBehavior[]) {
    this.attacks = attacks;
  }

  performAttacks(): void {
    this.attacks.forEach(attack => attack.attack());
  }

  // Can change attacks at runtime!
  addAttack(attack: AttackBehavior): void {
    this.attacks.push(attack);
  }

  removeAttack(attack: AttackBehavior): void {
    const index = this.attacks.indexOf(attack);
    if (index > -1) this.attacks.splice(index, 1);
  }
}

// Any combination!
const warrior = new Character([new MeleeAttack()]);
const ranger = new Character([new RangedAttack()]);
const battlemage = new Character([
  new MeleeAttack(),
  new MagicAttack(20)
]);

// Can evolve at runtime!
battlemage.addAttack(new RangedAttack()); // Learned ranged attack!
```

## Strategy Pattern: Composition in Action

```typescript
// Composition enables strategy pattern
interface PaymentStrategy {
  pay(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} with credit card`);
  }
}

class PayPalPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} with PayPal`);
  }
}

class CryptoPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Paid ${amount} with crypto`);
  }
}

class ShoppingCart {
  private items: Item[] = [];
  private paymentStrategy?: PaymentStrategy;

  addItem(item: Item): void {
    this.items.push(item);
  }

  // Set strategy at runtime!
  setPaymentStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy;
  }

  checkout(): void {
    const total = this.items.reduce((sum, item) => sum + item.price, 0);
    this.paymentStrategy?.pay(total);
  }
}

// Use
const cart = new ShoppingCart();
cart.addItem({ name: 'Book', price: 20 });

cart.setPaymentStrategy(new CreditCardPayment());
cart.checkout(); // Paid with credit card

cart.setPaymentStrategy(new PayPalPayment());
cart.checkout(); // Paid with PayPal
```

## Delegation vs Inheritance

### Inheritance
```typescript
class Parent {
  doSomething(): void {
    console.log('Parent doing something');
  }
}

class Child extends Parent {
  // Inherits doSomething()
}

const child = new Child();
child.doSomething(); // Uses inherited method
```

### Delegation (Composition)
```typescript
class Worker {
  doSomething(): void {
    console.log('Worker doing something');
  }
}

class Manager {
  constructor(private worker: Worker) {}

  doSomething(): void {
    this.worker.doSomething(); // Delegates to composed object
  }
}

const manager = new Manager(new Worker());
manager.doSomething(); // Delegates to worker
```

**Delegation advantages**:
- Can change worker at runtime
- Worker is testable independently
- No tight coupling
- Clear ownership

## Mixins: Middle Ground

TypeScript supports mixins as a middle ground:

```typescript
// Mixin functions
type Constructor<T = {}> = new (...args: any[]) => T;

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    timestamp = new Date();
    
    getTimestamp(): Date {
      return this.timestamp;
    }
  };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    
    activate(): void {
      this.isActive = true;
    }
    
    deactivate(): void {
      this.isActive = false;
    }
  };
}

// Apply mixins
class User {
  constructor(public name: string) {}
}

const TimestampedUser = Timestamped(User);
const TimestampedActivatableUser = Activatable(Timestamped(User));

const user = new TimestampedActivatableUser('Alice');
user.activate();
console.log(user.getTimestamp());
console.log(user.isActive);
```

Mixins provide multiple behaviors, but still have some coupling.

## When to Use Inheritance

Inheritance is appropriate when:
- ✅ True "IS-A" relationship (Cat IS-A Animal)
- ✅ Subtype honors LSP (substitutable)
- ✅ Base class is designed for extension
- ✅ Hierarchy is shallow (1-2 levels)
- ✅ Base class is abstract (not concrete)

```typescript
// ✅ Good use of inheritance: Abstract base
abstract class Shape {
  abstract area(): number;
  abstract perimeter(): number;
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }
}
```

**Why this works**:
- Shape is abstract (can't instantiate)
- Clear contract (area, perimeter)
- Shallow hierarchy
- True "IS-A" relationship

## The Mind-Shift

**Before understanding composition:**
- "Reuse code with inheritance"
- "Build deep class hierarchies"
- "IS-A relationships everywhere"

**After understanding composition:**
- "Reuse code with composition"
- "Build flat structures with components"
- "HAS-A relationships by default"
- "Inheritance only when appropriate"

This is lifechanging because you stop building rigid hierarchies and start building **flexible, modular systems**.

## Testing Benefits

Composition makes testing easier:

```typescript
// With composition
class EmailSender {
  constructor(private smtp: SMTPClient) {}
  
  send(to: string, message: string): void {
    this.smtp.send(to, message);
  }
}

// Test: Mock the dependency
class MockSMTP implements SMTPClient {
  sentEmails: Array<{to: string, message: string}> = [];
  
  send(to: string, message: string): void {
    this.sentEmails.push({ to, message });
  }
}

const mockSMTP = new MockSMTP();
const emailSender = new EmailSender(mockSMTP);
emailSender.send('alice@example.com', 'Hello');

expect(mockSMTP.sentEmails).toHaveLength(1);
```

With inheritance, testing the base class behavior is harder.

## Real-World Example: React Components

React embraces composition:

```typescript
// ✅ Composition in React
function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

function IconButton({ icon, children, onClick }: IconButtonProps) {
  return (
    <Button onClick={onClick}>
      <Icon name={icon} />
      {children}
    </Button>
  );
}

function PrimaryButton({ children, onClick }: PrimaryButtonProps) {
  return (
    <Button onClick={onClick} className="primary">
      {children}
    </Button>
  );
}

// Compose buttons in any way
function App() {
  return (
    <div>
      <Button onClick={handleClick}>Click me</Button>
      <IconButton icon="save" onClick={handleSave}>Save</IconButton>
      <PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
    </div>
  );
}
```

Instead of inheritance, React uses **composition** to build complex UIs from simple components.

## Benefits

1. **Flexibility**: Change behavior at runtime
2. **Modularity**: Components are independent
3. **Testability**: Test components in isolation
4. **Simplicity**: Flat structure, no deep hierarchies
5. **Reusability**: Combine components in many ways

## AI-Era Relevance

### What AI Does
- Creates inheritance hierarchies by default
- Builds deep class trees
- Doesn't consider composition

### What You Must Do
- **Identify**: Can this be composition instead?
- **Refactor**: Replace inheritance with composition
- **Test**: Verify components independently
- **Guide**: Prompt for "composition over inheritance"

## Summary

**Composition over Inheritance** means:
- Build with components (HAS-A), not hierarchies (IS-A)
- Use delegation instead of extension
- Keep hierarchies shallow
- Reserve inheritance for true "IS-A" relationships

**Key questions**:
- *"Can I achieve this with composition?"* → Prefer composition
- *"Is this truly an IS-A relationship?"* → If not, use composition
- *"Will this hierarchy grow deep?"* → Use composition instead

---

**Next**: [Encapsulation](../07-encapsulation.md)
