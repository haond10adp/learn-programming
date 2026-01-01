# Observer Pattern: The Beauty of Reactive Systems

> *"Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically."*

## 🎯 The Problem

You have an object (the **subject**) whose state changes, and multiple other objects (the **observers**) that need to know about those changes.

**Real-world examples**:
- A button click needs to update the UI, log analytics, and trigger an API call
- A data model changes and multiple views need to update
- A stock price changes and multiple widgets need to refresh

### The Naive Approach (❌ Tightly Coupled)

```typescript
class StockPrice {
  private price: number = 0;
  private chart: Chart;
  private display: PriceDisplay;
  private logger: Logger;

  constructor(chart: Chart, display: PriceDisplay, logger: Logger) {
    this.chart = chart;
    this.display = display;
    this.logger = logger;
  }

  setPrice(price: number) {
    this.price = price;
    // Tightly coupled to specific observers
    this.chart.update(price);
    this.display.update(price);
    this.logger.log(price);
  }
}
```

**Problems**:
- Can't add new observers without modifying `StockPrice`
- Can't remove observers
- `StockPrice` knows too much about its dependents
- Violates Open/Closed Principle

## 🎨 The Solution: Observer Pattern

**Key Insight**: The subject doesn't know *what* the observers do, only *that* they want to be notified.

```typescript
// Observer interface: anything that can be notified
interface Observer<T> {
  update(data: T): void;
}

// Subject: manages observers and notifies them
interface Subject<T> {
  attach(observer: Observer<T>): void;
  detach(observer: Observer<T>): void;
  notify(data: T): void;
}
```

Now the subject is **decoupled** from its observers!

## 💎 Why This Is Beautiful

### 1. The subject broadcasts to void

The subject doesn't know or care who's listening:

```typescript
class StockPrice implements Subject<number> {
  private observers: Observer<number>[] = [];
  private price: number = 0;

  attach(observer: Observer<number>): void {
    this.observers.push(observer);
  }

  detach(observer: Observer<number>): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notify(data: number): void {
    for (const observer of this.observers) {
      observer.update(data);
    }
  }

  setPrice(price: number): void {
    this.price = price;
    this.notify(price); // Just notify—don't know who or how many!
  }
}
```

**The beauty**: Change propagates automatically. The subject doesn't orchestrate; it just announces.

### 2. Observers can be added/removed dynamically

```typescript
const stock = new StockPrice();

// Add observers at runtime
stock.attach(new PriceChart());
stock.attach(new PriceDisplay());
stock.attach(new Logger());

// Can add more later without changing StockPrice
stock.attach(new AlertSystem());
stock.attach(new AnalyticsTracker());

// Can remove observers
stock.detach(logger);
```

**The beauty**: The system is **open for extension**, **closed for modification**.

### 3. Each observer decides how to respond

```typescript
class PriceChart implements Observer<number> {
  update(price: number): void {
    // Chart decides to draw
    console.log(`📊 Chart: Drawing price ${price}`);
  }
}

class AlertSystem implements Observer<number> {
  update(price: number): void {
    // Alert decides when to notify
    if (price > 100) {
      console.log(`🚨 Alert: Price exceeded $100!`);
    }
  }
}

class Logger implements Observer<number> {
  update(price: number): void {
    // Logger decides to persist
    console.log(`📝 Log: Price changed to ${price} at ${new Date()}`);
  }
}
```

**The beauty**: Responsibility is distributed. Each observer encapsulates its own reaction.

## 🧮 Mathematical Beauty

Observer implements a **multicast function**:

```
subject.notify(data) → observer₁.update(data)
                    → observer₂.update(data)
                    → observer₃.update(data)
                    → ...
```

It's like `Array.map()` but for events—one input, multiple transformations!

## 🏗️ TypeScript Implementation

### Basic Implementation

```typescript
// Generic Subject class
class Observable<T> implements Subject<T> {
  private observers: Observer<T>[] = [];

  attach(observer: Observer<T>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: T): void {
    for (const observer of this.observers) {
      observer.update(data);
    }
  }
}
```

### With Event Types (More Powerful)

```typescript
// Multiple event types
type EventMap = {
  'price:changed': number;
  'volume:changed': number;
  'status:error': Error;
};

// Type-safe event emitter
class EventEmitter<Events extends EventMap> {
  private listeners: {
    [K in keyof Events]?: Array<(data: Events[K]) => void>;
  } = {};

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    const handlers = this.listeners[event];
    if (handlers) {
      this.listeners[event] = handlers.filter((l) => l !== listener) as any;
    }
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const handlers = this.listeners[event];
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }
}
```

Usage:

```typescript
const emitter = new EventEmitter<EventMap>();

// Type-safe subscriptions
emitter.on('price:changed', (price) => {
  // price is typed as number
  console.log(`New price: ${price}`);
});

emitter.on('status:error', (error) => {
  // error is typed as Error
  console.error(`Error occurred: ${error.message}`);
});

// Type-safe emissions
emitter.emit('price:changed', 42); // ✅
// emitter.emit('price:changed', 'hello'); // ❌ Error: string not assignable to number
```

**The beauty**: TypeScript enforces that events match their expected data types!

## 🌍 Real-World Examples

### 1. DOM Events (Browser)
```typescript
button.addEventListener('click', (event) => {
  // Button (subject) notifies click handler (observer)
});
```

### 2. React/Vue Reactivity
```typescript
// React state is an observable
const [count, setCount] = useState(0);

// Component is an observer
return <div>{count}</div>; // Re-renders when count changes
```

### 3. RxJS Observables
```typescript
const observable = new Observable((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
});

observable.subscribe((value) => console.log(value));
```

### 4. Node.js EventEmitter
```typescript
const emitter = new EventEmitter();
emitter.on('data', (data) => console.log(data));
emitter.emit('data', { message: 'Hello' });
```

**You've been using Observer your entire programming career!**

## 📊 When to Use

### ✅ Use Observer When:
- One object's state affects many others
- You don't know how many or which objects need updates
- Objects should be loosely coupled
- You need dynamic relationships (add/remove observers at runtime)

### ❌ Avoid Observer When:
- Only one or two objects need updates (use direct calls)
- The relationship is permanent (use composition)
- Performance is critical and notifications are frequent (consider batching)

## ⚠️ Common Pitfalls

### 1. Memory Leaks

```typescript
// ❌ BAD: Observer never detached
component.mount(() => {
  eventEmitter.on('data', handler); // Attached
});
// If component unmounts without detaching, handler stays in memory!

// ✅ GOOD: Clean up
component.mount(() => {
  eventEmitter.on('data', handler);
});

component.unmount(() => {
  eventEmitter.off('data', handler); // Detached
});
```

### 2. Notification Order Dependency

```typescript
// ❌ BAD: Observer B depends on Observer A running first
observerA.update(data); // Updates database
observerB.update(data); // Reads from database (depends on A)
```

**Solution**: Observers should be independent, or use a explicit dependency system.

### 3. Recursive Notifications

```typescript
// ❌ BAD: Update triggers notification, which triggers update...
class BadObserver implements Observer<number> {
  update(data: number): void {
    subject.setPrice(data + 1); // Triggers another notification! Infinite loop!
  }
}
```

**Solution**: Guard against re-entrant notifications or batch updates.

## 🤖 AI-Era Considerations

### What AI Generates Well
- Basic Observer implementation
- Standard event emitter patterns
- Simple subscribe/unsubscribe logic

### What You Need to Review
- **Memory leaks**: Did AI forget to detach observers?
- **Type safety**: Are event types properly constrained?
- **Error handling**: What if an observer throws?
- **Performance**: Are notifications batched or debounced when needed?

### Review Checklist
- ✅ Can observers be garbage collected?
- ✅ Are event types properly typed?
- ✅ What happens if observer.update() throws?
- ✅ Is notification order important? (It shouldn't be!)
- ✅ Could this be a simpler callback instead?

## 🎓 Key Takeaways

1. **Observer decouples** subjects from their dependents
2. **Observers can be added/removed** dynamically
3. **Each observer decides** how to react
4. **It's everywhere**: DOM events, React state, pub/sub systems
5. **Watch for memory leaks**: Always detach observers when done
6. **Keep observers independent**: No order dependencies

## 🧠 The Mind-Shift

### Before Observer
"How do I notify all these different things when something changes?"

### After Observer
"I'll just broadcast the change. Whoever cares can listen."

**The shift**: From orchestrating updates to announcing changes. From tight coupling to loose coupling. From fragility to flexibility.

## 🏆 Practice Exercise

Build a **Blog Post System** where:
- A blog post can be published (state change)
- Email subscribers get notified
- Social media posts are created
- Analytics are logged
- Admin dashboard updates

Use Observer pattern so adding new notifications doesn't require changing the blog post class.

---

**Next**: [Implementation Examples](./examples.ts) — See it in action
