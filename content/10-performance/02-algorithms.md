# Algorithm Optimization

## Why Algorithms Matter

The choice of algorithm has the biggest impact on performance. A better algorithm can provide **10x, 100x, or even 1000x** performance improvements - far more than micro-optimizations.

## Time Complexity (Big O Notation)

### Common Time Complexities

```
O(1)        - Constant       - Array access, hash lookup
O(log n)    - Logarithmic    - Binary search
O(n)        - Linear         - Array iteration
O(n log n)  - Linearithmic   - Efficient sorting (merge sort)
O(n²)       - Quadratic      - Nested loops
O(2ⁿ)       - Exponential    - Recursive fibonacci
O(n!)       - Factorial      - Permutations

Faster ──────────────────────────────────────────► Slower
```

### Visual Comparison

```typescript
// For n = 1,000,000 items:

O(1):        1 operation
O(log n):    ~20 operations
O(n):        1,000,000 operations
O(n log n):  ~20,000,000 operations
O(n²):       1,000,000,000,000 operations (1 trillion!)
```

## Search Algorithms

### Linear Search vs Binary Search

```typescript
// ============================================
// LINEAR SEARCH - O(n)
// ============================================

function linearSearch<T>(arr: T[], target: T): number {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}

// ============================================
// BINARY SEARCH - O(log n)
// ============================================

function binarySearch(arr: number[], target: number): number {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

// Performance comparison
const sortedArray = Array.from({ length: 1000000 }, (_, i) => i);
const target = 999999;

console.time('linear');
linearSearch(sortedArray, target);
console.timeEnd('linear'); // ~10ms

console.time('binary');
binarySearch(sortedArray, target);
console.timeEnd('binary'); // ~0.01ms (1000x faster!)
```

### Hash-Based Search - O(1)

```typescript
// ============================================
// HASH-BASED LOOKUP
// ============================================

// ❌ Bad: O(n) lookup in array
function findUserByIdSlow(users: User[], id: string): User | undefined {
    return users.find(user => user.id === id); // O(n)
}

// ✅ Good: O(1) lookup with Map
class UserRepository {
    private users = new Map<string, User>();
    
    add(user: User): void {
        this.users.set(user.id, user);
    }
    
    findById(id: string): User | undefined {
        return this.users.get(id); // O(1)
    }
}

// Performance comparison
const users = Array.from({ length: 100000 }, (_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`
}));

// Array find: ~1ms per lookup
console.time('array');
users.find(u => u.id === 'user-99999');
console.timeEnd('array');

// Map get: ~0.001ms per lookup
const userMap = new Map(users.map(u => [u.id, u]));
console.time('map');
userMap.get('user-99999');
console.timeEnd('map');
```

## Sorting Algorithms

### Comparison

```typescript
// ============================================
// BUBBLE SORT - O(n²) - SLOW
// ============================================

function bubbleSort(arr: number[]): number[] {
    const result = [...arr];
    
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length - 1 - i; j++) {
            if (result[j] > result[j + 1]) {
                [result[j], result[j + 1]] = [result[j + 1], result[j]];
            }
        }
    }
    
    return result;
}

// ============================================
// MERGE SORT - O(n log n) - FAST
// ============================================

function mergeSort(arr: number[]): number[] {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
    const result: number[] = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}

// ============================================
// NATIVE SORT - O(n log n) - FASTEST (optimized C++)
// ============================================

function nativeSort(arr: number[]): number[] {
    return [...arr].sort((a, b) => a - b);
}

// Benchmark
const data = Array.from({ length: 10000 }, () => Math.random());

console.time('bubble');
bubbleSort(data);
console.timeEnd('bubble'); // ~2000ms

console.time('merge');
mergeSort(data);
console.timeEnd('merge'); // ~50ms

console.time('native');
nativeSort(data);
console.timeEnd('native'); // ~5ms (built-in is fastest!)
```

**Key Takeaway**: Use `Array.prototype.sort()` - it's highly optimized!

## Array Operations

### Efficient Array Manipulation

```typescript
// ============================================
// ARRAY OPERATIONS PERFORMANCE
// ============================================

// ❌ Bad: Repeated array operations - O(n²)
function badArrayManipulation(items: number[]): number[] {
    let result: number[] = [];
    
    for (const item of items) {
        result.push(item * 2);        // Each push is O(1)
        result = result.filter(x => x > 0); // But filter is O(n)!
    }
    
    return result;
}

// ✅ Good: Single pass - O(n)
function goodArrayManipulation(items: number[]): number[] {
    const result: number[] = [];
    
    for (const item of items) {
        const doubled = item * 2;
        if (doubled > 0) {
            result.push(doubled);
        }
    }
    
    return result;
}

// ✅ Even better: Use reduce or map/filter
function bestArrayManipulation(items: number[]): number[] {
    return items
        .map(x => x * 2)
        .filter(x => x > 0);
}
```

### Array vs Set for Uniqueness

```typescript
// ❌ Bad: Array includes - O(n²)
function removeDuplicatesSlow(arr: number[]): number[] {
    const result: number[] = [];
    
    for (const item of arr) {
        if (!result.includes(item)) { // O(n) lookup
            result.push(item);
        }
    }
    
    return result;
}

// ✅ Good: Set - O(n)
function removeDuplicatesFast(arr: number[]): number[] {
    return Array.from(new Set(arr)); // O(1) lookup in Set
}

// ✅ Alternative: Spread syntax
function removeDuplicatesSpread(arr: number[]): number[] {
    return [...new Set(arr)];
}

// Benchmark
const data = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 1000));

console.time('slow');
removeDuplicatesSlow(data);
console.timeEnd('slow'); // ~500ms

console.time('fast');
removeDuplicatesFast(data);
console.timeEnd('fast'); // ~5ms (100x faster!)
```

## String Operations

### String Concatenation

```typescript
// ❌ Bad: String concatenation in loop - O(n²)
function buildStringSlow(items: string[]): string {
    let result = '';
    
    for (const item of items) {
        result += item; // Creates new string each time!
    }
    
    return result;
}

// ✅ Good: Array join - O(n)
function buildStringFast(items: string[]): string {
    return items.join('');
}

// ✅ Also good: Template literals for small strings
function buildStringTemplate(items: string[]): string {
    return items.reduce((acc, item) => `${acc}${item}`, '');
}

// Benchmark
const items = Array.from({ length: 10000 }, (_, i) => `item-${i}`);

console.time('slow');
buildStringSlow(items);
console.timeEnd('slow'); // ~200ms

console.time('fast');
buildStringFast(items);
console.timeEnd('fast'); // ~2ms (100x faster!)
```

### String Search

```typescript
// ✅ Good: Use built-in methods (optimized in C++)
const text = 'The quick brown fox jumps over the lazy dog';

// Fast built-in methods
console.time('includes');
text.includes('fox');
console.timeEnd('includes');

console.time('indexOf');
text.indexOf('fox');
console.timeEnd('indexOf');

console.time('regex');
/fox/.test(text);
console.timeEnd('regex');

// ❌ Bad: Manual character-by-character search
console.time('manual');
function manualSearch(text: string, pattern: string): boolean {
    for (let i = 0; i <= text.length - pattern.length; i++) {
        let found = true;
        for (let j = 0; j < pattern.length; j++) {
            if (text[i + j] !== pattern[j]) {
                found = false;
                break;
            }
        }
        if (found) return true;
    }
    return false;
}
manualSearch(text, 'fox');
console.timeEnd('manual');
```

## Object Operations

### Object Lookup Optimization

```typescript
// ============================================
// OBJECT PROPERTY ACCESS
// ============================================

interface User {
    id: string;
    name: string;
    email: string;
    age: number;
}

// ✅ Good: Direct property access - O(1)
function getUserName(user: User): string {
    return user.name;
}

// ❌ Bad: Dynamic property access - slower
function getUserProperty(user: User, key: keyof User): any {
    return user[key];
}

// ✅ Good: Map for dynamic lookups
const propertyGetters = new Map<keyof User, (user: User) => any>([
    ['name', (u) => u.name],
    ['email', (u) => u.email],
    ['age', (u) => u.age]
]);

function getUserPropertyFast(user: User, key: keyof User): any {
    const getter = propertyGetters.get(key);
    return getter ? getter(user) : undefined;
}
```

## Recursive vs Iterative

### Fibonacci Example

```typescript
// ============================================
// RECURSIVE - O(2ⁿ) - EXPONENTIAL (VERY SLOW)
// ============================================

function fibRecursive(n: number): number {
    if (n <= 1) return n;
    return fibRecursive(n - 1) + fibRecursive(n - 2);
}

// ============================================
// MEMOIZED RECURSIVE - O(n) - LINEAR
// ============================================

function fibMemoized(n: number, memo: Map<number, number> = new Map()): number {
    if (n <= 1) return n;
    if (memo.has(n)) return memo.get(n)!;
    
    const result = fibMemoized(n - 1, memo) + fibMemoized(n - 2, memo);
    memo.set(n, result);
    return result;
}

// ============================================
// ITERATIVE - O(n) - LINEAR (FASTEST)
// ============================================

function fibIterative(n: number): number {
    if (n <= 1) return n;
    
    let prev = 0, curr = 1;
    
    for (let i = 2; i <= n; i++) {
        [prev, curr] = [curr, prev + curr];
    }
    
    return curr;
}

// ============================================
// FORMULA - O(1) - CONSTANT (INSTANT)
// ============================================

function fibFormula(n: number): number {
    const phi = (1 + Math.sqrt(5)) / 2;
    return Math.round(Math.pow(phi, n) / Math.sqrt(5));
}

// Benchmark
console.time('recursive');
fibRecursive(35);
console.timeEnd('recursive'); // ~500ms

console.time('memoized');
fibMemoized(35);
console.timeEnd('memoized'); // ~0.5ms

console.time('iterative');
fibIterative(35);
console.timeEnd('iterative'); // ~0.01ms

console.time('formula');
fibFormula(35);
console.timeEnd('formula'); // ~0.001ms
```

## Data Structure Selection

### Array vs Set vs Map

```typescript
// ============================================
// CHOOSE THE RIGHT DATA STRUCTURE
// ============================================

// Use Array when:
// - Order matters
// - Need indexed access
// - Small dataset (<100 items)
const users: User[] = [];

// Use Set when:
// - Need uniqueness
// - Frequent has() checks
// - Order doesn't matter
const uniqueIds = new Set<string>();

// Use Map when:
// - Key-value pairs
// - Frequent get/set operations
// - Non-string keys
const userCache = new Map<string, User>();

// Performance comparison
const operations = 10000;

// Array.includes() - O(n)
console.time('array');
const arr = Array.from({ length: operations }, (_, i) => i);
for (let i = 0; i < 1000; i++) {
    arr.includes(Math.random() * operations);
}
console.timeEnd('array'); // ~100ms

// Set.has() - O(1)
console.time('set');
const set = new Set(arr);
for (let i = 0; i < 1000; i++) {
    set.has(Math.random() * operations);
}
console.timeEnd('set'); // ~0.1ms (1000x faster!)

// Map.get() - O(1)
console.time('map');
const map = new Map(arr.map(x => [x, x]));
for (let i = 0; i < 1000; i++) {
    map.get(Math.random() * operations);
}
console.timeEnd('map'); // ~0.1ms
```

## Early Exit Optimization

```typescript
// ============================================
// EARLY EXIT
// ============================================

// ❌ Bad: Check all items even after finding result
function hasAdminSlow(users: User[]): boolean {
    let hasAdmin = false;
    
    for (const user of users) {
        if (user.role === 'admin') {
            hasAdmin = true;
        }
    }
    
    return hasAdmin;
}

// ✅ Good: Exit early when condition met
function hasAdminFast(users: User[]): boolean {
    for (const user of users) {
        if (user.role === 'admin') {
            return true; // Exit immediately
        }
    }
    return false;
}

// ✅ Even better: Use built-in some()
function hasAdminBest(users: User[]): boolean {
    return users.some(user => user.role === 'admin');
}
```

## Batch Operations

```typescript
// ============================================
// BATCH PROCESSING
// ============================================

// ❌ Bad: Process one at a time
async function processItemsSlow(items: any[]): Promise<void> {
    for (const item of items) {
        await processItem(item); // Waits for each item sequentially
    }
}

// ✅ Good: Process in parallel batches
async function processItemsFast(items: any[], batchSize: number = 10): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(item => processItem(item)));
    }
}

// Example usage
const items = Array.from({ length: 100 }, (_, i) => i);

console.time('slow');
await processItemsSlow(items);
console.timeEnd('slow'); // ~10s (100 * 100ms each)

console.time('fast');
await processItemsFast(items, 10);
console.timeEnd('fast'); // ~1s (10 batches * 100ms)
```

## Practical Example: Filter + Map Optimization

```typescript
// ============================================
// CHAINED OPERATIONS
// ============================================

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

// ❌ Bad: Multiple array iterations
function getExpensiveProductNamesSlow(products: Product[]): string[] {
    const inStock = products.filter(p => p.inStock);        // O(n)
    const expensive = inStock.filter(p => p.price > 100);   // O(n)
    const electronics = expensive.filter(p => p.category === 'electronics'); // O(n)
    const names = electronics.map(p => p.name);             // O(n)
    return names;
}

// ✅ Good: Single iteration with reduce
function getExpensiveProductNamesFast(products: Product[]): string[] {
    return products.reduce((acc, p) => {
        if (p.inStock && p.price > 100 && p.category === 'electronics') {
            acc.push(p.name);
        }
        return acc;
    }, [] as string[]);
}

// ✅ Also good: Chained operations (readable, engine-optimized)
function getExpensiveProductNamesReadable(products: Product[]): string[] {
    return products
        .filter(p => p.inStock && p.price > 100 && p.category === 'electronics')
        .map(p => p.name);
}

// Modern engines optimize chained operations well
// Readability > micro-optimization in most cases
```

## Algorithm Selection Guidelines

### When to Use What

| Problem | Algorithm | Complexity | When to Use |
|---------|-----------|------------|-------------|
| Search unsorted | Linear search | O(n) | Small arrays (<100) |
| Search sorted | Binary search | O(log n) | Large arrays |
| Search with lookup | Hash/Map | O(1) | Frequent lookups |
| Sort | Built-in sort | O(n log n) | Always (it's optimized) |
| Unique values | Set | O(n) | Removing duplicates |
| Count occurrences | Map | O(n) | Frequency counting |
| Find max/min | Single pass | O(n) | One-time operation |
| Multiple queries | Preprocess | O(n) + O(1) | Many queries |

## Summary

**Algorithm optimization** provides the biggest performance gains:

1. **Time Complexity**: O(1) > O(log n) > O(n) > O(n log n) > O(n²)
2. **Choose Right Algorithm**: Binary search over linear, merge sort over bubble
3. **Choose Right Data Structure**: Map/Set for lookups, Array for ordered data
4. **Avoid Nested Loops**: Often can be reduced to single pass
5. **Early Exit**: Stop when result found
6. **Batch Operations**: Process in parallel when possible
7. **Use Built-ins**: Native methods are highly optimized

**Key Takeaway**: A better algorithm beats micro-optimizations. O(n) is infinitely better than O(n²) for large datasets.

---

**Next**: Explore [Memory Management](../03-memory.md) for efficient memory usage and leak prevention.
