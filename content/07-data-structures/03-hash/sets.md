# Sets

## What is a Set?

A **Set** is a data structure that stores a collection of **unique elements** with no duplicates. It supports efficient membership testing, insertion, and deletion operations. Unlike arrays or lists, sets have no defined order (in most implementations) and automatically prevent duplicate entries.

### Key Properties

```
Set: {1, 2, 3, 4, 5}
- No duplicates: Adding 3 again has no effect
- No defined order: {1, 2, 3} ≡ {3, 1, 2}
- Membership: Check if element exists
- Operations: Union, intersection, difference, subset

Array vs Set:
[1, 2, 2, 3, 3, 3] → Set {1, 2, 3}
```

## Why Sets Matter

Sets are fundamental because they:

1. **Automatic Uniqueness**: No duplicate management needed
2. **Fast Membership Testing**: O(1) average case with hash sets
3. **Mathematical Operations**: Union, intersection, difference built-in
4. **Data Deduplication**: Remove duplicates from collections
5. **Relationship Queries**: Test subset/superset relationships
6. **Graph Algorithms**: Track visited nodes efficiently

## Time Complexity

| Operation   | Hash Set (Average) | Tree Set (Balanced) | Description                    |
|-------------|-------------------|---------------------|--------------------------------|
| Add         | O(1)              | O(log n)            | Insert element                 |
| Delete      | O(1)              | O(log n)            | Remove element                 |
| Has         | O(1)              | O(log n)            | Check membership               |
| Size        | O(1)              | O(1)                | Get element count              |
| Union       | O(n + m)          | O(n + m)            | Combine two sets               |
| Intersection| O(min(n, m))      | O(n + m)            | Find common elements           |
| Difference  | O(n)              | O(n + m)            | Elements in A but not in B     |
| Subset      | O(n)              | O(n + m)            | Check if A ⊆ B                 |

**Space Complexity**: O(n) where n is number of unique elements

## Basic Set Implementation (Hash Set)

```typescript
class HashSet<T> {
    private items: Map<T, boolean>;

    constructor(values?: Iterable<T>) {
        this.items = new Map();
        if (values) {
            for (const value of values) {
                this.add(value);
            }
        }
    }

    // Add element
    add(value: T): this {
        this.items.set(value, true);
        return this;
    }

    // Remove element
    delete(value: T): boolean {
        return this.items.delete(value);
    }

    // Check membership
    has(value: T): boolean {
        return this.items.has(value);
    }

    // Get size
    size(): number {
        return this.items.size;
    }

    // Check if empty
    isEmpty(): boolean {
        return this.items.size === 0;
    }

    // Clear all elements
    clear(): void {
        this.items.clear();
    }

    // Get all values
    values(): T[] {
        return Array.from(this.items.keys());
    }

    // Iterator support
    [Symbol.iterator](): Iterator<T> {
        return this.items.keys();
    }

    // For-each iteration
    forEach(callback: (value: T, index: number) => void): void {
        let index = 0;
        for (const value of this.items.keys()) {
            callback(value, index++);
        }
    }
}
```

### Usage Example

```typescript
const set = new HashSet<number>();

// Add elements
set.add(1);
set.add(2);
set.add(3);
set.add(2); // No effect (duplicate)

console.log(set.size());      // 3
console.log(set.has(2));      // true
console.log(set.has(5));      // false

// Delete
set.delete(2);
console.log(set.has(2));      // false

// Iteration
for (const value of set) {
    console.log(value);
}
// Output: 1, 3

// Convert to array
console.log(set.values());    // [1, 3]
```

## Set Operations

### Union (A ∪ B)

```typescript
class HashSet<T> {
    // ... previous methods ...

    union(other: HashSet<T>): HashSet<T> {
        const result = new HashSet<T>();

        // Add all from this set
        for (const value of this) {
            result.add(value);
        }

        // Add all from other set
        for (const value of other) {
            result.add(value);
        }

        return result;
    }
}

// Usage
const setA = new HashSet([1, 2, 3]);
const setB = new HashSet([3, 4, 5]);
const unionSet = setA.union(setB);
console.log(unionSet.values()); // [1, 2, 3, 4, 5]
```

### Intersection (A ∩ B)

```typescript
class HashSet<T> {
    // ... previous methods ...

    intersection(other: HashSet<T>): HashSet<T> {
        const result = new HashSet<T>();

        // Iterate through smaller set for efficiency
        const smaller = this.size() <= other.size() ? this : other;
        const larger = this.size() > other.size() ? this : other;

        for (const value of smaller) {
            if (larger.has(value)) {
                result.add(value);
            }
        }

        return result;
    }
}

// Usage
const setA = new HashSet([1, 2, 3, 4]);
const setB = new HashSet([3, 4, 5, 6]);
const intersectionSet = setA.intersection(setB);
console.log(intersectionSet.values()); // [3, 4]
```

### Difference (A - B)

```typescript
class HashSet<T> {
    // ... previous methods ...

    difference(other: HashSet<T>): HashSet<T> {
        const result = new HashSet<T>();

        for (const value of this) {
            if (!other.has(value)) {
                result.add(value);
            }
        }

        return result;
    }
}

// Usage
const setA = new HashSet([1, 2, 3, 4]);
const setB = new HashSet([3, 4, 5, 6]);
const diffSet = setA.difference(setB);
console.log(diffSet.values()); // [1, 2]
```

### Symmetric Difference (A △ B)

```typescript
class HashSet<T> {
    // ... previous methods ...

    symmetricDifference(other: HashSet<T>): HashSet<T> {
        const result = new HashSet<T>();

        // Add elements in A but not in B
        for (const value of this) {
            if (!other.has(value)) {
                result.add(value);
            }
        }

        // Add elements in B but not in A
        for (const value of other) {
            if (!this.has(value)) {
                result.add(value);
            }
        }

        return result;
    }
}

// Usage
const setA = new HashSet([1, 2, 3, 4]);
const setB = new HashSet([3, 4, 5, 6]);
const symDiffSet = setA.symmetricDifference(setB);
console.log(symDiffSet.values()); // [1, 2, 5, 6]
```

### Subset and Superset

```typescript
class HashSet<T> {
    // ... previous methods ...

    // Check if this is subset of other (this ⊆ other)
    isSubsetOf(other: HashSet<T>): boolean {
        if (this.size() > other.size()) {
            return false;
        }

        for (const value of this) {
            if (!other.has(value)) {
                return false;
            }
        }

        return true;
    }

    // Check if this is superset of other (this ⊇ other)
    isSupersetOf(other: HashSet<T>): boolean {
        return other.isSubsetOf(this);
    }

    // Check if sets are disjoint (no common elements)
    isDisjoint(other: HashSet<T>): boolean {
        for (const value of this) {
            if (other.has(value)) {
                return false;
            }
        }
        return true;
    }
}

// Usage
const setA = new HashSet([1, 2]);
const setB = new HashSet([1, 2, 3, 4]);
const setC = new HashSet([5, 6]);

console.log(setA.isSubsetOf(setB));     // true
console.log(setB.isSupersetOf(setA));   // true
console.log(setA.isDisjoint(setC));     // true
console.log(setA.isDisjoint(setB));     // false
```

## Tree Set (Ordered Set)

```typescript
class TreeSet<T> {
    private items: Set<T>;
    private compare: (a: T, b: T) => number;

    constructor(compareFn?: (a: T, b: T) => number) {
        this.items = new Set();
        this.compare = compareFn || ((a: any, b: any) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
    }

    add(value: T): this {
        this.items.add(value);
        return this;
    }

    delete(value: T): boolean {
        return this.items.delete(value);
    }

    has(value: T): boolean {
        return this.items.has(value);
    }

    size(): number {
        return this.items.size;
    }

    // Get elements in sorted order
    values(): T[] {
        return Array.from(this.items).sort(this.compare);
    }

    // Get minimum element
    min(): T | undefined {
        const sorted = this.values();
        return sorted[0];
    }

    // Get maximum element
    max(): T | undefined {
        const sorted = this.values();
        return sorted[sorted.length - 1];
    }

    // Get elements in range [min, max]
    range(min: T, max: T): T[] {
        return this.values().filter(value =>
            this.compare(value, min) >= 0 &&
            this.compare(value, max) <= 0
        );
    }

    // Iterator in sorted order
    *[Symbol.iterator](): Iterator<T> {
        for (const value of this.values()) {
            yield value;
        }
    }
}

// Usage
const treeSet = new TreeSet<number>();
treeSet.add(5);
treeSet.add(2);
treeSet.add(8);
treeSet.add(1);

console.log(treeSet.values());    // [1, 2, 5, 8] (sorted)
console.log(treeSet.min());       // 1
console.log(treeSet.max());       // 8
console.log(treeSet.range(2, 6)); // [2, 5]
```

## Advanced Set Operations

### Power Set

```typescript
function powerSet<T>(set: HashSet<T>): HashSet<T>[] {
    const values = set.values();
    const result: HashSet<T>[] = [new HashSet<T>()]; // Empty set

    for (const value of values) {
        const currentLength = result.length;
        
        for (let i = 0; i < currentLength; i++) {
            const subset = new HashSet(result[i].values());
            subset.add(value);
            result.push(subset);
        }
    }

    return result;
}

// Usage
const set = new HashSet([1, 2, 3]);
const subsets = powerSet(set);
console.log(subsets.length); // 8 (2^3)
// [∅, {1}, {2}, {3}, {1,2}, {1,3}, {2,3}, {1,2,3}]
```

### Cartesian Product

```typescript
function cartesianProduct<A, B>(
    setA: HashSet<A>,
    setB: HashSet<B>
): Array<[A, B]> {
    const result: Array<[A, B]> = [];

    for (const a of setA) {
        for (const b of setB) {
            result.push([a, b]);
        }
    }

    return result;
}

// Usage
const setA = new HashSet([1, 2]);
const setB = new HashSet(['a', 'b']);
const product = cartesianProduct(setA, setB);
console.log(product); // [[1,'a'], [1,'b'], [2,'a'], [2,'b']]
```

### Partition Set

```typescript
function partitionSet<T>(
    set: HashSet<T>,
    predicate: (value: T) => boolean
): [HashSet<T>, HashSet<T>] {
    const trueSet = new HashSet<T>();
    const falseSet = new HashSet<T>();

    for (const value of set) {
        if (predicate(value)) {
            trueSet.add(value);
        } else {
            falseSet.add(value);
        }
    }

    return [trueSet, falseSet];
}

// Usage
const numbers = new HashSet([1, 2, 3, 4, 5, 6]);
const [evens, odds] = partitionSet(numbers, n => n % 2 === 0);
console.log(evens.values()); // [2, 4, 6]
console.log(odds.values());  // [1, 3, 5]
```

## Real-World Applications

### 1. Remove Duplicates

```typescript
function removeDuplicates<T>(arr: T[]): T[] {
    const set = new HashSet(arr);
    return set.values();
}

// Usage
const numbers = [1, 2, 2, 3, 3, 3, 4, 5, 5];
console.log(removeDuplicates(numbers)); // [1, 2, 3, 4, 5]

const words = ['apple', 'banana', 'apple', 'cherry', 'banana'];
console.log(removeDuplicates(words)); // ['apple', 'banana', 'cherry']
```

### 2. Find Unique Characters

```typescript
function uniqueCharacters(str: string): string[] {
    const set = new HashSet<string>();
    
    for (const char of str) {
        set.add(char);
    }
    
    return set.values();
}

function hasUniqueCharacters(str: string): boolean {
    const set = new HashSet<string>();
    
    for (const char of str) {
        if (set.has(char)) {
            return false;
        }
        set.add(char);
    }
    
    return true;
}

// Usage
console.log(uniqueCharacters('hello'));      // ['h', 'e', 'l', 'o']
console.log(hasUniqueCharacters('abcdef')); // true
console.log(hasUniqueCharacters('hello'));  // false (l repeats)
```

### 3. Track Visited Nodes (Graph Traversal)

```typescript
interface Graph {
    [key: string]: string[];
}

function dfs(graph: Graph, start: string): string[] {
    const visited = new HashSet<string>();
    const result: string[] = [];

    function traverse(node: string): void {
        if (visited.has(node)) return;

        visited.add(node);
        result.push(node);

        for (const neighbor of graph[node] || []) {
            traverse(neighbor);
        }
    }

    traverse(start);
    return result;
}

// Usage
const graph: Graph = {
    'A': ['B', 'C'],
    'B': ['D'],
    'C': ['D'],
    'D': []
};

console.log(dfs(graph, 'A')); // ['A', 'B', 'D', 'C']
```

### 4. Find Intersection of Arrays

```typescript
function intersection(...arrays: number[][]): number[] {
    if (arrays.length === 0) return [];

    let result = new HashSet(arrays[0]);

    for (let i = 1; i < arrays.length; i++) {
        const current = new HashSet(arrays[i]);
        result = result.intersection(current);
    }

    return result.values();
}

// Usage
console.log(intersection([1, 2, 3], [2, 3, 4], [3, 4, 5])); // [3]
```

### 5. Check Subarray with Sum Zero

```typescript
function hasSubarrayWithSumZero(arr: number[]): boolean {
    const prefixSums = new HashSet<number>();
    let sum = 0;

    prefixSums.add(0); // Empty subarray has sum 0

    for (const num of arr) {
        sum += num;

        if (prefixSums.has(sum)) {
            return true; // Found subarray with sum 0
        }

        prefixSums.add(sum);
    }

    return false;
}

// Usage
console.log(hasSubarrayWithSumZero([4, 2, -3, 1, 6]));    // true
console.log(hasSubarrayWithSumZero([4, 2, 0, 1, 6]));     // true
console.log(hasSubarrayWithSumZero([1, 2, 3, 4]));        // false
```

### 6. Find Missing Number

```typescript
function findMissingNumber(arr: number[], n: number): number {
    const set = new HashSet(arr);

    for (let i = 1; i <= n; i++) {
        if (!set.has(i)) {
            return i;
        }
    }

    return -1; // All numbers present
}

// Usage
console.log(findMissingNumber([1, 2, 4, 5, 6], 6)); // 3
console.log(findMissingNumber([1, 2, 3, 5], 5));    // 4
```

### 7. Longest Consecutive Sequence

```typescript
function longestConsecutive(nums: number[]): number {
    const set = new HashSet(nums);
    let maxLength = 0;

    for (const num of set) {
        // Only start counting from sequence start
        if (!set.has(num - 1)) {
            let currentNum = num;
            let currentLength = 1;

            while (set.has(currentNum + 1)) {
                currentNum++;
                currentLength++;
            }

            maxLength = Math.max(maxLength, currentLength);
        }
    }

    return maxLength;
}

// Usage
console.log(longestConsecutive([100, 4, 200, 1, 3, 2])); // 4 ([1,2,3,4])
console.log(longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1])); // 9
```

## When to Use Sets

### Use Sets When:
- ✅ You need to **ensure uniqueness** automatically
- ✅ **Membership testing** is frequent
- ✅ **Removing duplicates** from collections
- ✅ **Set operations** (union, intersection) are needed
- ✅ **Tracking visited** nodes/items
- ✅ Order doesn't matter (use TreeSet if it does)

### Don't Use Sets When:
- ❌ You need **indexed access** → use Array
- ❌ You need **key-value pairs** → use Map/Hash Table
- ❌ **Duplicates are meaningful** → use Array or Multiset
- ❌ **Order matters** and you need efficient operations → use TreeSet or Array
- ❌ You need to **count occurrences** → use Map

## Common Pitfalls and How to Avoid Them

### 1. Expecting Order in Hash Sets

```typescript
// ❌ Wrong: Assuming insertion order
const set = new HashSet([3, 1, 2]);
console.log(set.values()); // Order not guaranteed!

// ✅ Correct: Use TreeSet for ordered iteration
const treeSet = new TreeSet<number>();
treeSet.add(3).add(1).add(2);
console.log(treeSet.values()); // [1, 2, 3]
```

### 2. Using Mutable Objects as Elements

```typescript
// ❌ Wrong: Mutating objects in set
const set = new HashSet<{id: number}>();
const obj = {id: 1};
set.add(obj);
obj.id = 2; // Mutates object in set!
console.log(set.has({id: 2})); // false (different reference)

// ✅ Correct: Use immutable values or primitives
const set = new HashSet<number>();
set.add(1);
// Can't mutate primitive values
```

### 3. Confusing Set Operations

```typescript
const setA = new HashSet([1, 2, 3]);
const setB = new HashSet([3, 4, 5]);

// Different operations produce different results:
console.log(setA.union(setB));              // [1, 2, 3, 4, 5]
console.log(setA.intersection(setB));       // [3]
console.log(setA.difference(setB));         // [1, 2]
console.log(setA.symmetricDifference(setB));// [1, 2, 4, 5]
```

### 4. Not Checking for Existence Before Deleting

```typescript
// ❌ Inefficient: Delete without checking
if (set.has(value)) {
    set.delete(value);
}

// ✅ Correct: delete() returns boolean
if (set.delete(value)) {
    console.log('Deleted successfully');
}
```

### 5. Performance with Large Sets

```typescript
// ❌ Wrong: Inefficient subset check
function isSubset(subset: number[], superset: number[]): boolean {
    for (const item of subset) {
        if (!superset.includes(item)) { // O(n) lookup per item
            return false;
        }
    }
    return true;
}

// ✅ Correct: Use set for O(1) lookups
function isSubset(subset: number[], superset: number[]): boolean {
    const superSet = new HashSet(superset);
    for (const item of subset) {
        if (!superSet.has(item)) { // O(1) lookup
            return false;
        }
    }
    return true;
}
```

## Summary

**Sets** are essential data structures for managing unique collections:

1. **Automatic Uniqueness**: No duplicate elements allowed
2. **Fast Operations**: O(1) average for add/delete/has with hash sets
3. **Set Theory**: Union, intersection, difference, subset operations built-in
4. **Applications**: Deduplication, membership testing, graph traversal, finding unique elements
5. **Variants**: Hash Set (unordered, O(1)) vs Tree Set (ordered, O(log n))
6. **Key Advantage**: Simplifies uniqueness management and set-based algorithms

Sets excel when:
- Uniqueness is required
- Fast membership testing is critical
- Set operations are needed
- Order doesn't matter (or use TreeSet)

**Remember**: Choose Hash Set for best performance when order doesn't matter, Tree Set when you need sorted iteration, and regular Arrays when duplicates are meaningful or indexed access is required. JavaScript's built-in Set is a Hash Set implementation and should be preferred over custom implementations in most cases.

---

**Next**: Explore [Graphs](../04-graphs/graphs.md) for network structures, or review [Hash Tables](./hash-tables.md) for key-value storage.
