# Debugging AI-Generated Code

> *"When AI code breaks, you fix it."*

## Why AI Code Needs Debugging

**AI-generated code can have bugs**—logic errors, performance issues, security vulnerabilities, or misunderstandings of requirements. Debugging AI code requires understanding what AI generated and why it's not working.

```typescript
// AI generates this:
function findUser(users: User[], name: string): User {
  return users.find(u => u.name === name);
}

// Bug: Returns undefined if not found, but type says User (not User | undefined)
// Runtime error: Cannot read properties of undefined

// You debug and fix:
function findUser(users: User[], name: string): User | undefined {
  return users.find(u => u.name === name);
}

// Or throw:
function findUser(users: User[], name: string): User {
  const user = users.find(u => u.name === name);
  if (!user) {
    throw new Error(`User not found: ${name}`);
  }
  return user;
}
```

## Why This Matters

Debugging AI code:
- **Finds logic errors**: AI's implementation may not match intent
- **Reveals misunderstandings**: AI interpreted prompt differently
- **Catches edge cases**: AI often misses them
- **Improves security**: AI may introduce vulnerabilities
- **Enhances performance**: AI may use inefficient algorithms

## Reading AI Code

### Understand the Flow

```typescript
// AI generates complex function:
async function processOrder(order: Order): Promise<ProcessedOrder> {
  const validated = validateOrder(order);
  const items = await fetchInventory(validated.items);
  const total = calculateTotal(items);
  const payment = await chargeCustomer(total, order.customerId);
  const shipping = await scheduleShipping(order);
  
  return {
    orderId: order.id,
    payment,
    shipping,
    items
  };
}

// Debug by tracing:
// 1. What does validateOrder do?
// 2. What if fetchInventory fails?
// 3. Is calculateTotal correct?
// 4. What if payment fails?
// 5. Is shipping scheduled even if payment fails? Bug!
```

### Add Logging

```typescript
// Add logging to understand execution:
async function processOrder(order: Order): Promise<ProcessedOrder> {
  console.log('Processing order:', order.id);
  
  const validated = validateOrder(order);
  console.log('Validation result:', validated);
  
  const items = await fetchInventory(validated.items);
  console.log('Inventory fetched:', items.length, 'items');
  
  const total = calculateTotal(items);
  console.log('Total calculated:', total);
  
  try {
    const payment = await chargeCustomer(total, order.customerId);
    console.log('Payment successful:', payment.id);
    
    const shipping = await scheduleShipping(order);
    console.log('Shipping scheduled:', shipping.trackingNumber);
    
    return {
      orderId: order.id,
      payment,
      shipping,
      items
    };
  } catch (error) {
    console.error('Processing failed:', error);
    throw error;
  }
}

// Logs reveal where things break
```

## Common AI Bugs

### Bug 1: Off-by-One Errors

```typescript
// AI generates:
function getLastN(arr: any[], n: number): any[] {
  return arr.slice(arr.length - n, arr.length);
}

console.log(getLastN([1, 2, 3, 4, 5], 0));  // [] - correct
console.log(getLastN([1, 2, 3, 4, 5], 3));  // [3, 4, 5] - correct
console.log(getLastN([1, 2, 3, 4, 5], 10)); // [1, 2, 3, 4, 5] - Bug! Should handle n > length

// Fix:
function getLastN<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [];
  if (n >= arr.length) return [...arr];
  return arr.slice(arr.length - n);
}
```

### Bug 2: Mutation

```typescript
// AI generates:
function addToSet(set: number[], value: number): number[] {
  if (!set.includes(value)) {
    set.push(value);
  }
  return set;
}

// Bug: Mutates input!
const original = [1, 2, 3];
const updated = addToSet(original, 4);
console.log(original);  // [1, 2, 3, 4] - Mutated!

// Fix:
function addToSet(set: number[], value: number): number[] {
  if (!set.includes(value)) {
    return [...set, value];
  }
  return [...set];
}
```

### Bug 3: Missing Null Checks

```typescript
// AI generates:
function getUserEmail(userId: string): string {
  const user = findUser(userId);
  return user.email;  // Bug: user might be null!
}

// Fix:
function getUserEmail(userId: string): string | null {
  const user = findUser(userId);
  return user?.email ?? null;
}
```

### Bug 4: Async/Await Issues

```typescript
// AI generates:
async function processUsers(userIds: string[]) {
  const results = [];
  
  for (const id of userIds) {
    const user = await fetchUser(id);  // Sequential! Slow!
    results.push(user);
  }
  
  return results;
}

// Fix: Parallel processing
async function processUsers(userIds: string[]): Promise<User[]> {
  return await Promise.all(
    userIds.map(id => fetchUser(id))
  );
}
```

### Bug 5: Memory Leaks

```typescript
// AI generates event listener:
class Component {
  constructor(private eventBus: EventBus) {
    eventBus.on('update', (data) => {
      this.handleUpdate(data);
    });
  }
  
  // Bug: Never removes listener!
  // When Component is destroyed, listener remains
}

// Fix:
class Component {
  private unsubscribe?: () => void;
  
  constructor(private eventBus: EventBus) {
    this.unsubscribe = eventBus.on('update', (data) => {
      this.handleUpdate(data);
    });
  }
  
  destroy(): void {
    this.unsubscribe?.();
  }
}
```

## Debugging Strategies

### 1. Reproduce the Bug

```typescript
// Write test that demonstrates bug:
test('reproduces bug', () => {
  const result = processData([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);  // Fails!
});

// Now you can debug with test
```

### 2. Isolate the Problem

```typescript
// Break complex function into smaller parts:

// Before (hard to debug):
function processOrder(order: Order): number {
  return order.items.reduce((total, item) => {
    const discount = item.discounted ? item.price * 0.1 : 0;
    return total + (item.price - discount) * item.quantity;
  }, 0) * (1 + TAX_RATE);
}

// After (easy to debug):
function calculateItemTotal(item: OrderItem): number {
  const discount = item.discounted ? item.price * 0.1 : 0;
  const discountedPrice = item.price - discount;
  return discountedPrice * item.quantity;
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

function applyTax(amount: number): number {
  return amount * (1 + TAX_RATE);
}

function processOrder(order: Order): number {
  const subtotal = calculateSubtotal(order.items);
  return applyTax(subtotal);
}

// Now you can test and debug each function separately
```

### 3. Add Type Assertions

```typescript
// AI generates loose types:
function processData(data: any): any {
  return data.map((item: any) => item.value * 2);
}

// Add types to catch errors:
interface DataItem {
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value * 2);
  // TypeScript now catches type errors!
}
```

### 4. Use Debugger

```typescript
// Add breakpoints:
function complexCalculation(a: number, b: number): number {
  debugger;  // Execution pauses here
  
  const step1 = a * 2;
  debugger;  // And here
  
  const step2 = step1 + b;
  debugger;  // And here
  
  return step2 / 3;
}

// Or use IDE breakpoints
```

### 5. Binary Search Debugging

```typescript
// Complex function with bug somewhere:
function processData(data: Item[]): Result {
  const filtered = data.filter(/* ... */);
  console.log('After filter:', filtered);  // Checkpoint 1
  
  const mapped = filtered.map(/* ... */);
  console.log('After map:', mapped);  // Checkpoint 2
  
  const sorted = mapped.sort(/* ... */);
  console.log('After sort:', sorted);  // Checkpoint 3
  
  const reduced = sorted.reduce(/* ... */);
  console.log('After reduce:', reduced);  // Checkpoint 4
  
  return reduced;
}

// Find which step introduces the bug
```

## Performance Debugging

### Identify Bottlenecks

```typescript
// AI generates:
function findDuplicates(arr: number[]): number[] {
  const duplicates: number[] = [];
  
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  
  return duplicates;
}

// Profile:
console.time('findDuplicates');
findDuplicates(largeArray);
console.timeEnd('findDuplicates');  // Slow!

// Debug: O(n³) complexity (nested loops + includes)

// Fix:
function findDuplicates(arr: number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  
  for (const num of arr) {
    if (seen.has(num)) {
      duplicates.add(num);
    } else {
      seen.add(num);
    }
  }
  
  return Array.from(duplicates);
}
// O(n) complexity
```

### Memory Profiling

```typescript
// AI generates:
class DataProcessor {
  private cache = new Map<string, Data>();
  
  process(id: string, data: Data): void {
    this.cache.set(id, data);  // Bug: Cache grows forever!
  }
}

// Debug: Monitor memory usage
const processor = new DataProcessor();

setInterval(() => {
  console.log('Memory:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
}, 1000);

// Fix: Add cache eviction
class DataProcessor {
  private cache = new Map<string, Data>();
  private readonly MAX_SIZE = 1000;
  
  process(id: string, data: Data): void {
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);  // Evict oldest
    }
    this.cache.set(id, data);
  }
}
```

## Security Debugging

### Find Vulnerabilities

```typescript
// AI generates:
app.post('/search', (req, res) => {
  const query = `SELECT * FROM users WHERE name = '${req.body.name}'`;
  const results = db.execute(query);
  res.json(results);
});

// Debug: Test with malicious input
// Input: ' OR '1'='1
// Query becomes: SELECT * FROM users WHERE name = '' OR '1'='1'
// Returns all users! SQL injection!

// Fix:
app.post('/search', (req, res) => {
  const query = 'SELECT * FROM users WHERE name = $1';
  const results = db.execute(query, [req.body.name]);
  res.json(results);
});
```

## Asking AI for Help

### Show the Bug

```typescript
// "This function should return unique items, but it returns duplicates:

function getUnique(arr: number[]): number[] {
  return arr.filter((item, index) => {
    return arr.indexOf(item) === index;
  });
}

console.log(getUnique([1, 2, 2, 3, 3, 3]));  // Expected: [1, 2, 3]
// Actual: [1, 2, 3] - Wait, it works!
// But slow for large arrays due to indexOf in loop (O(n²))

// Can you optimize this?"

// AI suggests:
function getUnique(arr: number[]): number[] {
  return Array.from(new Set(arr));
}
```

## The Mind-Shift

**Before debugging AI code:**
- Assume AI code is correct
- Confused when bugs appear
- Don't know where to look

**After:**
- Critically examine AI code
- Systematically debug
- Understand the implementation

## Summary

**Debugging AI Code**:
- Read and understand generated code
- Add logging and breakpoints
- Look for common bugs (null checks, mutations, async issues)
- Profile for performance
- Test with edge cases
- Check for security vulnerabilities

**Key insight**: *AI-generated code needs the same rigorous debugging as human code—understanding what AI generated and systematically finding issues is an essential skill in the AI era.*

---

**Next**: [The Human Advantage](../08-human-advantage.md)
