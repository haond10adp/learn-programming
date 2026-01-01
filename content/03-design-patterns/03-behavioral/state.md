# State Pattern

> *"Allow an object to alter its behavior when its internal state changes."*  
> — Gang of Four

## What is the State Pattern?

The **State pattern** changes an object's behavior when its internal state changes. Instead of complex conditionals checking state, each state is a separate class with its own behavior—like a vending machine that behaves differently when it has coins vs. when it's dispensing.

```typescript
// State interface
interface State {
  insertCoin(): void;
  ejectCoin(): void;
  selectProduct(): void;
  dispense(): void;
}

// Context
class VendingMachine {
  private state: State;
  
  constructor() {
    this.state = new NoCoinState(this);
  }
  
  setState(state: State): void {
    this.state = state;
  }
  
  insertCoin(): void {
    this.state.insertCoin();
  }
  
  ejectCoin(): void {
    this.state.ejectCoin();
  }
  
  selectProduct(): void {
    this.state.selectProduct();
  }
  
  dispense(): void {
    this.state.dispense();
  }
}

// Concrete states
class NoCoinState implements State {
  constructor(private machine: VendingMachine) {}
  
  insertCoin(): void {
    console.log('Coin inserted');
    this.machine.setState(new HasCoinState(this.machine));
  }
  
  ejectCoin(): void {
    console.log('No coin to eject');
  }
  
  selectProduct(): void {
    console.log('Insert coin first');
  }
  
  dispense(): void {
    console.log('Insert coin first');
  }
}

class HasCoinState implements State {
  constructor(private machine: VendingMachine) {}
  
  insertCoin(): void {
    console.log('Coin already inserted');
  }
  
  ejectCoin(): void {
    console.log('Coin ejected');
    this.machine.setState(new NoCoinState(this.machine));
  }
  
  selectProduct(): void {
    console.log('Product selected');
    this.machine.setState(new DispensingState(this.machine));
  }
  
  dispense(): void {
    console.log('Select product first');
  }
}

class DispensingState implements State {
  constructor(private machine: VendingMachine) {}
  
  insertCoin(): void {
    console.log('Please wait, dispensing');
  }
  
  ejectCoin(): void {
    console.log('Cannot eject, dispensing');
  }
  
  selectProduct(): void {
    console.log('Please wait, dispensing');
  }
  
  dispense(): void {
    console.log('Dispensing product');
    this.machine.setState(new NoCoinState(this.machine));
  }
}

// Usage
const machine = new VendingMachine();
machine.insertCoin();     // Coin inserted
machine.selectProduct();  // Product selected
machine.dispense();       // Dispensing product
```

## Why This Matters

State is useful when:
- **State-dependent behavior**: Object behaves differently based on state
- **Complex conditionals**: Many if/else checking state
- **State transitions**: Clear rules for changing states
- **State-specific behavior**: Each state has different methods

## The Philosophy

Think of State like **water phases**: ice, liquid, steam. Same H₂O molecules, but behavior completely different based on state. You don't check temperature in every method—the state itself determines behavior.

## Real-World Examples

### Order State Machine

```typescript
interface OrderState {
  confirm(): void;
  ship(): void;
  deliver(): void;
  cancel(): void;
}

class Order {
  private state: OrderState;
  
  constructor(private id: string) {
    this.state = new PendingState(this);
  }
  
  setState(state: OrderState): void {
    this.state = state;
  }
  
  confirm(): void {
    this.state.confirm();
  }
  
  ship(): void {
    this.state.ship();
  }
  
  deliver(): void {
    this.state.deliver();
  }
  
  cancel(): void {
    this.state.cancel();
  }
  
  getId(): string {
    return this.id;
  }
}

class PendingState implements OrderState {
  constructor(private order: Order) {}
  
  confirm(): void {
    console.log(`Order ${this.order.getId()} confirmed`);
    this.order.setState(new ConfirmedState(this.order));
  }
  
  ship(): void {
    console.log('Cannot ship: Order not confirmed');
  }
  
  deliver(): void {
    console.log('Cannot deliver: Order not confirmed');
  }
  
  cancel(): void {
    console.log(`Order ${this.order.getId()} cancelled`);
    this.order.setState(new CancelledState(this.order));
  }
}

class ConfirmedState implements OrderState {
  constructor(private order: Order) {}
  
  confirm(): void {
    console.log('Order already confirmed');
  }
  
  ship(): void {
    console.log(`Order ${this.order.getId()} shipped`);
    this.order.setState(new ShippedState(this.order));
  }
  
  deliver(): void {
    console.log('Cannot deliver: Order not shipped yet');
  }
  
  cancel(): void {
    console.log(`Order ${this.order.getId()} cancelled`);
    this.order.setState(new CancelledState(this.order));
  }
}

class ShippedState implements OrderState {
  constructor(private order: Order) {}
  
  confirm(): void {
    console.log('Order already confirmed');
  }
  
  ship(): void {
    console.log('Order already shipped');
  }
  
  deliver(): void {
    console.log(`Order ${this.order.getId()} delivered`);
    this.order.setState(new DeliveredState(this.order));
  }
  
  cancel(): void {
    console.log('Cannot cancel: Order already shipped');
  }
}

class DeliveredState implements OrderState {
  constructor(private order: Order) {}
  
  confirm(): void {
    console.log('Order already delivered');
  }
  
  ship(): void {
    console.log('Order already delivered');
  }
  
  deliver(): void {
    console.log('Order already delivered');
  }
  
  cancel(): void {
    console.log('Cannot cancel: Order delivered');
  }
}

class CancelledState implements OrderState {
  constructor(private order: Order) {}
  
  confirm(): void {
    console.log('Cannot confirm: Order cancelled');
  }
  
  ship(): void {
    console.log('Cannot ship: Order cancelled');
  }
  
  deliver(): void {
    console.log('Cannot deliver: Order cancelled');
  }
  
  cancel(): void {
    console.log('Order already cancelled');
  }
}

// Usage
const order = new Order('#12345');
order.confirm();   // Pending → Confirmed
order.ship();      // Confirmed → Shipped
order.deliver();   // Shipped → Delivered
order.cancel();    // Cannot cancel: Order delivered
```

### Document Editor States

```typescript
interface DocumentState {
  type(): void;
  save(): void;
  publish(): void;
}

class Document {
  private state: DocumentState;
  private content: string = '';
  
  constructor() {
    this.state = new DraftState(this);
  }
  
  setState(state: DocumentState): void {
    this.state = state;
  }
  
  type(text: string): void {
    this.content += text;
    this.state.type();
  }
  
  save(): void {
    this.state.save();
  }
  
  publish(): void {
    this.state.publish();
  }
  
  getContent(): string {
    return this.content;
  }
}

class DraftState implements DocumentState {
  constructor(private document: Document) {}
  
  type(): void {
    console.log('Typing...');
  }
  
  save(): void {
    console.log('Document saved as draft');
    this.document.setState(new ModerationState(this.document));
  }
  
  publish(): void {
    console.log('Cannot publish draft directly. Save for moderation first.');
  }
}

class ModerationState implements DocumentState {
  constructor(private document: Document) {}
  
  type(): void {
    console.log('Document in moderation. Creating new draft...');
    this.document.setState(new DraftState(this.document));
  }
  
  save(): void {
    console.log('Document already in moderation');
  }
  
  publish(): void {
    console.log('Document approved and published!');
    this.document.setState(new PublishedState(this.document));
  }
}

class PublishedState implements DocumentState {
  constructor(private document: Document) {}
  
  type(): void {
    console.log('Cannot edit published document. Creating new draft...');
    this.document.setState(new DraftState(this.document));
  }
  
  save(): void {
    console.log('Document is published');
  }
  
  publish(): void {
    console.log('Document already published');
  }
}

// Usage
const doc = new Document();
doc.type('Hello world');  // Draft state
doc.save();               // Draft → Moderation
doc.publish();            // Moderation → Published
doc.type('Edit');         // Published → Draft
```

## Benefits

1. **Eliminates conditionals**: No if/else chains checking state
2. **Single Responsibility**: Each state class has one responsibility
3. **Open/Closed**: Easy to add new states
4. **Explicit transitions**: Clear state changes
5. **Localized behavior**: State-specific code in state classes

## When to Use

✅ **Use State when:**
- Object behavior changes based on state
- Many conditionals checking state
- State transitions follow clear rules
- State-specific behavior is complex

❌ **Don't use State when:**
- Few states with simple behavior
- State doesn't affect behavior much
- Adds unnecessary complexity

## Common Violations

```typescript
// ❌ BAD: State checks everywhere
class Order {
  private status: string;
  
  ship() {
    if (this.status === 'pending') {
      console.log('Cannot ship');
    } else if (this.status === 'confirmed') {
      this.status = 'shipped';
    } else if (this.status === 'shipped') {
      console.log('Already shipped');
    }
  }
}

// ✅ GOOD: State pattern
class Order {
  private state: OrderState;
  
  ship() {
    this.state.ship();  // Behavior in state class
  }
}
```

## The Mind-Shift

**Before**: Check state in every method  
**After**: State object handles behavior

## Summary

**State Pattern**:
- Encapsulates state-specific behavior in separate classes
- Object changes behavior when state changes
- Eliminates conditional logic
- Clear state transitions
- Each state is a class implementing common interface

**Key insight**: *The State pattern externalizes state—when an object's behavior depends heavily on its state, put each state's behavior in a separate class instead of scattering conditionals everywhere.*

---

**Next**: [Chain of Responsibility Pattern](../chain.md)
