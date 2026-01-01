# Immutability

> *"Data doesn't change—it transforms."*

## What Is It?

**Immutability** means data cannot be modified after creation. Instead of changing data, you create new versions with the desired changes.

```typescript
// ❌ Mutable: modify in place
const numbers = [1, 2, 3];
numbers.push(4);  // Modifies original
numbers[0] = 10;  // Modifies original

// ✅ Immutable: create new versions
const numbers = [1, 2, 3];
const with4 = [...numbers, 4];        // New array
const modified = [10, ...numbers.slice(1)]; // New array
// Original unchanged!
```

## Why This Is Beautiful

Immutability gives you:
- **Predictability**: Data never changes unexpectedly
- **Time travel**: Keep history of all states
- **Undo/Redo**: Free from immutability
- **Thread safety**: No race conditions
- **Easy debugging**: No "who changed this?"

It makes code easier to reason about.

## Immutable Operations

### Arrays

```typescript
const original = [1, 2, 3];

// ❌ Mutable operations
original.push(4);           // Modifies
original.pop();             // Modifies
original.splice(1, 1);      // Modifies
original[0] = 10;           // Modifies
original.sort();            // Modifies
original.reverse();         // Modifies

// ✅ Immutable operations
const appended = [...original, 4];
const prepended = [0, ...original];
const sliced = original.slice(1, 3);
const filtered = original.filter(x => x > 1);
const mapped = original.map(x => x * 2);
const reduced = original.reduce((sum, x) => sum + x, 0);
const sorted = [...original].sort();
const reversed = [...original].reverse();
```

### Objects

```typescript
const original = { name: 'Alice', age: 30 };

// ❌ Mutable operations
original.age = 31;           // Modifies
original.email = 'a@b.com';  // Modifies
delete original.age;         // Modifies

// ✅ Immutable operations
const updated = { ...original, age: 31 };
const added = { ...original, email: 'a@b.com' };
const removed = { ...original };
delete removed.age; // Remove from copy, not original

// Better: use object destructuring
const { age, ...removed } = original;
```

### Nested Updates

```typescript
interface User {
  name: string;
  address: {
    street: string;
    city: string;
  };
}

const user: User = {
  name: 'Alice',
  address: {
    street: '123 Main St',
    city: 'NYC'
  }
};

// ❌ Mutable: modifies deeply
user.address.city = 'SF';

// ✅ Immutable: create new objects at each level
const updated = {
  ...user,
  address: {
    ...user.address,
    city: 'SF'
  }
};
```

## Immutable Data Structures

### Immer

```typescript
import { produce } from 'immer';

const original = {
  name: 'Alice',
  todos: [
    { id: 1, text: 'Learn TypeScript', done: false },
    { id: 2, text: 'Build app', done: false }
  ]
};

// Write mutable code, get immutable result
const updated = produce(original, draft => {
  draft.todos[0].done = true;        // Looks mutable
  draft.todos.push({                  // Looks mutable
    id: 3,
    text: 'Deploy',
    done: false
  });
});

// original unchanged!
console.log(original.todos.length); // 2
console.log(updated.todos.length);  // 3
```

### Persistent Data Structures

```typescript
import { List, Map, Set } from 'immutable';

// Immutable.js collections
const list1 = List([1, 2, 3]);
const list2 = list1.push(4);     // New list
const list3 = list2.set(0, 10);  // New list

console.log(list1.toArray()); // [1, 2, 3]
console.log(list2.toArray()); // [1, 2, 3, 4]
console.log(list3.toArray()); // [10, 2, 3, 4]

// Efficient: structural sharing
const map1 = Map({ a: 1, b: 2 });
const map2 = map1.set('c', 3);  // Shares structure with map1
```

## Benefits in Practice

### 1. Predictable State

```typescript
// ❌ Mutable: surprising behavior
function addItem(cart: Cart, item: Item): Cart {
  cart.items.push(item);  // Modifies input!
  return cart;
}

const myCart = { items: [] };
const cartWith1 = addItem(myCart, item1);
const cartWith2 = addItem(myCart, item2);

console.log(myCart.items.length);      // 2 (surprise!)
console.log(cartWith1.items.length);   // 2 (surprise!)
console.log(cartWith2.items.length);   // 2

// ✅ Immutable: predictable
function addItemImmutable(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item]
  };
}

const myCart = { items: [] };
const cartWith1 = addItemImmutable(myCart, item1);
const cartWith2 = addItemImmutable(myCart, item2);

console.log(myCart.items.length);      // 0 (expected)
console.log(cartWith1.items.length);   // 1 (expected)
console.log(cartWith2.items.length);   // 1 (expected)
```

### 2. Easy Undo/Redo

```typescript
class History<T> {
  private history: T[] = [];
  private index = -1;
  
  push(state: T): void {
    // Remove future states
    this.history = this.history.slice(0, this.index + 1);
    
    // Add new state
    this.history.push(state);
    this.index++;
  }
  
  undo(): T | undefined {
    if (this.index > 0) {
      this.index--;
      return this.history[this.index];
    }
  }
  
  redo(): T | undefined {
    if (this.index < this.history.length - 1) {
      this.index++;
      return this.history[this.index];
    }
  }
  
  current(): T | undefined {
    return this.history[this.index];
  }
}

// Use it
const history = new History<AppState>();

history.push(initialState);
history.push(stateAfterEdit1);
history.push(stateAfterEdit2);

const previous = history.undo(); // Go back
const forward = history.redo();  // Go forward
```

### 3. Change Detection

```typescript
// ❌ Mutable: expensive deep equality check
function hasChanged(prev: State, next: State): boolean {
  return JSON.stringify(prev) !== JSON.stringify(next);
}

// ✅ Immutable: fast reference check
function hasChanged(prev: State, next: State): boolean {
  return prev !== next; // O(1) instead of O(n)
}

// React optimization
const MemoizedComponent = React.memo(
  Component,
  (prevProps, nextProps) => {
    // Fast reference equality
    return prevProps.data === nextProps.data;
  }
);
```

### 4. Time Travel Debugging

```typescript
class TimeTravel<T> {
  private states: Array<{ timestamp: Date; state: T }> = [];
  
  record(state: T): void {
    this.states.push({
      timestamp: new Date(),
      state  // Store immutable snapshots
    });
  }
  
  at(time: Date): T | undefined {
    const snapshot = this.states
      .filter(s => s.timestamp <= time)
      .pop();
    
    return snapshot?.state;
  }
  
  replay(): void {
    for (const { timestamp, state } of this.states) {
      console.log(`At ${timestamp}:`, state);
    }
  }
}
```

## Immutability Patterns

### Update Helpers

```typescript
// Generic update function
function update<T, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K]
): T {
  return { ...obj, [key]: value };
}

const user = { name: 'Alice', age: 30 };
const updated = update(user, 'age', 31);

// Nested update helper
function updateNested<T>(
  obj: T,
  path: string[],
  value: any
): T {
  if (path.length === 0) {
    return value;
  }
  
  const [head, ...tail] = path;
  return {
    ...obj,
    [head]: updateNested((obj as any)[head], tail, value)
  };
}

const user = {
  name: 'Alice',
  address: {
    city: 'NYC'
  }
};

const updated = updateNested(user, ['address', 'city'], 'SF');
```

### Array Updates

```typescript
// Update at index
function updateAt<T>(arr: T[], index: number, value: T): T[] {
  return arr.map((item, i) => (i === index ? value : item));
}

// Remove at index
function removeAt<T>(arr: T[], index: number): T[] {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}

// Insert at index
function insertAt<T>(arr: T[], index: number, value: T): T[] {
  return [...arr.slice(0, index), value, ...arr.slice(index)];
}

// Update where condition matches
function updateWhere<T>(
  arr: T[],
  predicate: (item: T) => boolean,
  update: (item: T) => T
): T[] {
  return arr.map(item => (predicate(item) ? update(item) : item));
}

const todos = [
  { id: 1, text: 'Learn', done: false },
  { id: 2, text: 'Build', done: false }
];

const updated = updateWhere(
  todos,
  todo => todo.id === 1,
  todo => ({ ...todo, done: true })
);
```

## Const Assertions

```typescript
// Mutable by default
const colors = ['red', 'green', 'blue'];
colors.push('yellow'); // Allowed!

// ✅ Readonly with const assertion
const colors = ['red', 'green', 'blue'] as const;
colors.push('yellow'); // Error: push doesn't exist on readonly array

// Object const assertion
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const;

config.timeout = 10000; // Error: readonly property
```

## Readonly Types

```typescript
// Shallow readonly
interface User {
  readonly id: string;
  readonly name: string;
  age: number; // Still mutable
}

// Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

interface User {
  name: string;
  address: {
    city: string;
  };
}

const user: DeepReadonly<User> = {
  name: 'Alice',
  address: { city: 'NYC' }
};

user.name = 'Bob';             // Error
user.address.city = 'SF';      // Error

// ReadonlyArray
const numbers: ReadonlyArray<number> = [1, 2, 3];
numbers.push(4);  // Error: push doesn't exist
numbers[0] = 10;  // Error: index signature is readonly
```

## Freezing Objects

```typescript
// Object.freeze: runtime immutability
const user = Object.freeze({
  name: 'Alice',
  age: 30
});

user.age = 31;  // Error in strict mode, silent fail otherwise

// Deep freeze
function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  });
  
  return obj;
}

const config = deepFreeze({
  api: {
    url: 'https://api.example.com'
  }
});

config.api.url = 'other'; // Error
```

## Performance Considerations

```typescript
// ❌ Expensive: copying large arrays repeatedly
function processLargeArray(arr: number[]): number[] {
  let result = arr;
  for (let i = 0; i < 1000; i++) {
    result = [...result, i]; // Copies entire array!
  }
  return result;
}

// ✅ Better: batch updates
function processLargeArray(arr: number[]): number[] {
  const newItems = [];
  for (let i = 0; i < 1000; i++) {
    newItems.push(i);
  }
  return [...arr, ...newItems]; // Single copy
}

// ✅ Best: use mutable locally, return immutably
function processLargeArray(arr: number[]): number[] {
  const result = [...arr]; // Copy once
  for (let i = 0; i < 1000; i++) {
    result.push(i); // Mutate local copy
  }
  return result; // Return new array
}
```

## Trade-offs

**Advantages:**
- Predictable data flow
- Easy debugging
- Time travel / undo
- Thread safety

**Disadvantages:**
- Memory overhead (more objects)
- Performance cost (copying)
- Verbose syntax

**When to use immutability:**
- State management (React, Redux)
- Concurrent operations
- History/undo features
- Critical business logic

**When mutability is OK:**
- Local variables
- Performance-critical loops
- Large data structures (use libraries)

## The Mind-Shift

**Before understanding immutability:**
- Modify data in place
- Shared mutable state
- Bugs from unexpected changes

**After:**
- Transform data, don't mutate
- Each function returns new data
- Predictable, traceable changes

## Summary

**Immutability**:
- Data never changes after creation
- Create new versions instead of modifying
- Predictable, debuggable, safe

**Patterns**:
- Spread operator for copies
- Array methods (map, filter, slice)
- Libraries (Immer, Immutable.js)
- Const assertions and readonly

**Key insight**: *Immutable data is easier to reason about—you know it can't change behind your back.*

---

**Next**: [Higher-Order Functions](../03-higher-order-functions.md)
