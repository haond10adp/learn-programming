# Pure Functions

> *"Same input, same output. No surprises."*

## What Are They?

A **pure function** is a function that:
1. Always returns the same output for the same input
2. Has no side effects (doesn't modify external state)

```typescript
// ✅ Pure: same input → same output
function add(a: number, b: number): number {
  return a + b;
}

add(2, 3); // Always 5
add(2, 3); // Always 5

// ❌ Impure: depends on external state
let total = 0;
function addToTotal(n: number): number {
  total += n;  // Side effect!
  return total;
}

addToTotal(5); // 5
addToTotal(5); // 10 (different result!)
```

## Why This Is Beautiful

Pure functions are **predictable**, **testable**, and **composable**:
- No hidden dependencies
- Easy to reason about
- Can be memoized
- Parallel execution safe
- Time-travel debugging possible

They're the foundation of functional programming.

## Characteristics

### 1. Deterministic

```typescript
// ✅ Pure: deterministic
function multiply(x: number, y: number): number {
  return x * y;
}

// ❌ Impure: non-deterministic
function getRandomNumber(): number {
  return Math.random();
}

function getCurrentTime(): Date {
  return new Date(); // Different each call
}
```

### 2. No Side Effects

```typescript
// ✅ Pure: no side effects
function calculateTotal(items: number[]): number {
  return items.reduce((sum, item) => sum + item, 0);
}

// ❌ Impure: modifies external state
let counter = 0;
function incrementCounter(): number {
  counter++;  // Side effect!
  return counter;
}

// ❌ Impure: modifies input
function sortArray(arr: number[]): number[] {
  arr.sort();  // Mutates input!
  return arr;
}

// ✅ Pure: returns new array
function sortArrayPure(arr: number[]): number[] {
  return [...arr].sort();
}
```

### 3. No I/O Operations

```typescript
// ❌ Impure: reads from file system
function readConfig(): Config {
  return JSON.parse(fs.readFileSync('config.json', 'utf-8'));
}

// ❌ Impure: network call
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ❌ Impure: console output
function logAndAdd(a: number, b: number): number {
  console.log('Adding:', a, b);  // Side effect!
  return a + b;
}
```

## Common Side Effects to Avoid

```typescript
// Modifying variables
let x = 10;
function impure() {
  x = 20;  // ❌
}

// Modifying arguments
function impure(arr: number[]) {
  arr.push(5);  // ❌
}

// Console output
function impure() {
  console.log('Hi');  // ❌
}

// Random values
function impure() {
  return Math.random();  // ❌
}

// Date/time
function impure() {
  return new Date();  // ❌
}

// Network/File I/O
function impure() {
  fs.writeFileSync('file.txt', 'data');  // ❌
}

// Throwing exceptions
function impure(x: number) {
  if (x < 0) throw new Error('Negative');  // ❌
}
```

## Making Functions Pure

### Example 1: Remove Global State

```typescript
// ❌ Impure: uses global state
let discount = 0.1;

function calculatePrice(price: number): number {
  return price * (1 - discount);
}

// ✅ Pure: pass everything as arguments
function calculatePricePure(price: number, discount: number): number {
  return price * (1 - discount);
}
```

### Example 2: Avoid Mutations

```typescript
// ❌ Impure: mutates input
function addItem(cart: Cart, item: Item): Cart {
  cart.items.push(item);
  return cart;
}

// ✅ Pure: returns new object
function addItemPure(cart: Cart, item: Item): Cart {
  return {
    ...cart,
    items: [...cart.items, item]
  };
}
```

### Example 3: Return Values Instead of Logging

```typescript
// ❌ Impure: side effect (logging)
function processData(data: string): number {
  console.log('Processing:', data);
  const result = data.length;
  console.log('Result:', result);
  return result;
}

// ✅ Pure: return result only
function processDataPure(data: string): number {
  return data.length;
}

// Log at call site
const result = processDataPure(data);
console.log('Processing:', data, 'Result:', result);
```

### Example 4: Dependency Injection

```typescript
// ❌ Impure: hardcoded dependency
function getUser(id: string): User {
  return database.findById(id);  // Hidden dependency
}

// ✅ Pure: inject dependency
function getUserPure(id: string, db: Database): User {
  return db.findById(id);
}
```

## Benefits of Pure Functions

### 1. Easy to Test

```typescript
// Pure function: simple to test
function add(a: number, b: number): number {
  return a + b;
}

// No setup needed!
expect(add(2, 3)).toBe(5);
expect(add(-1, 1)).toBe(0);
expect(add(0, 0)).toBe(0);
```

### 2. Memoization

```typescript
function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache = new Map<A, R>();
  
  return (arg: A): R => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

// Only works with pure functions!
const expensiveCalculation = memoize((n: number) => {
  // Complex computation
  return n * n * n;
});

expensiveCalculation(10); // Computed
expensiveCalculation(10); // Cached!
```

### 3. Parallel Execution

```typescript
// Pure functions can run in parallel safely
const results = await Promise.all([
  calculate(data1),
  calculate(data2),
  calculate(data3)
]);

// No race conditions, no shared state issues
```

### 4. Easier Reasoning

```typescript
// You know EXACTLY what this does
function calculateTotal(prices: number[], tax: number): number {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  return subtotal * (1 + tax);
}

// No need to trace through code to find:
// - What global variables it reads/writes
// - What side effects it has
// - What it depends on
```

## Practical Examples

### Pure Transformations

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

// ✅ Pure: transforms data
function normalizeUser(user: User): User {
  return {
    name: user.name.trim().toLowerCase(),
    email: user.email.trim().toLowerCase(),
    age: user.age
  };
}

// ✅ Pure: filters array
function getAdults(users: User[]): User[] {
  return users.filter(user => user.age >= 18);
}

// ✅ Pure: maps array
function getUserEmails(users: User[]): string[] {
  return users.map(user => user.email);
}
```

### Pure Business Logic

```typescript
interface Order {
  items: Item[];
  coupon?: Coupon;
}

interface Item {
  price: number;
  quantity: number;
}

interface Coupon {
  discount: number;
}

// ✅ Pure: all business logic
function calculateOrderTotal(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  if (order.coupon) {
    return subtotal * (1 - order.coupon.discount);
  }
  
  return subtotal;
}
```

### Pure Validators

```typescript
// ✅ Pure: validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidAge(age: number): boolean {
  return age >= 0 && age <= 150;
}

function isValidUser(user: User): boolean {
  return isValidEmail(user.email) && isValidAge(user.age);
}
```

## When You Can't Be Pure

Sometimes you need side effects. The strategy: **push side effects to the edges**.

```typescript
// Pure core
function calculateReport(data: Data): Report {
  // All pure transformations
  return processData(data);
}

// Impure shell
async function generateReport(userId: string): Promise<void> {
  // I/O at the edges
  const data = await fetchData(userId);      // Impure
  const report = calculateReport(data);      // Pure!
  await saveReport(report);                   // Impure
  await sendEmail(userId, report);           // Impure
}
```

## Functional Core, Imperative Shell

```typescript
// Pure core: business logic
function processOrder(order: Order): ProcessedOrder {
  return {
    ...order,
    total: calculateTotal(order),
    validated: validateOrder(order),
    timestamp: Date.now() // OK: passed as data
  };
}

// Impure shell: side effects
async function handleOrderRequest(req: Request): Promise<Response> {
  // Input
  const order = req.body;
  
  // Pure processing
  const processed = processOrder(order);
  
  // Output
  await saveToDatabase(processed);
  await sendConfirmationEmail(processed);
  
  return { status: 200, body: processed };
}
```

## Testing Pure vs Impure

```typescript
// ✅ Pure: trivial to test
function calculateDiscount(price: number, percent: number): number {
  return price * (1 - percent);
}

test('calculateDiscount', () => {
  expect(calculateDiscount(100, 0.1)).toBe(90);
  expect(calculateDiscount(50, 0.2)).toBe(40);
});

// ❌ Impure: hard to test
function saveAndNotify(user: User): void {
  database.save(user);           // Need to mock
  emailService.send(user.email); // Need to mock
  logger.log('User saved');       // Need to mock
}

test('saveAndNotify', () => {
  // Complex setup
  const mockDB = createMockDatabase();
  const mockEmail = createMockEmailService();
  const mockLogger = createMockLogger();
  
  // Inject mocks somehow...
  saveAndNotify(user);
  
  // Verify calls
  expect(mockDB.save).toHaveBeenCalled();
  expect(mockEmail.send).toHaveBeenCalled();
});
```

## The Mind-Shift

**Before understanding pure functions:**
- Functions are procedures that "do stuff"
- Side effects everywhere
- Hard to test and reason about

**After:**
- Functions are mathematical transformations
- Side effects pushed to edges
- Easy to test and compose

## Summary

**Pure Functions**:
- Same input → same output
- No side effects
- Deterministic
- Easy to test, memoize, parallelize

**Benefits**:
- Predictable
- Testable
- Composable
- Maintainable

**Strategy**: Keep core logic pure, push side effects to edges.

**Key insight**: *Pure functions are like mathematical functions—reliable, predictable, and beautiful.*

---

**Next**: [Immutability](../02-immutability.md)
