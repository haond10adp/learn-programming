# Hash Tables

## What is a Hash Table?

A **Hash Table** (also called **Hash Map**) is a data structure that maps keys to values using a **hash function**. It provides average O(1) time complexity for insertion, deletion, and lookup operations, making it one of the most efficient data structures for key-value storage.

### Core Concepts

```
Key → Hash Function → Index → Value

Example:
"John" → hash("John") → 42 → {age: 30, city: "NYC"}

Hash Table Array:
[0]  → null
[1]  → null
[2]  → ["Alice" → {age: 25}]
...
[42] → ["John" → {age: 30}]
[43] → ["Bob" → {age: 35}]
...
```

### Components

1. **Hash Function**: Converts key to array index
2. **Buckets/Slots**: Array positions storing key-value pairs
3. **Collision Resolution**: Handling when multiple keys hash to same index
4. **Load Factor**: Ratio of elements to buckets (triggers resizing)

## Why Hash Tables Matter

Hash tables are fundamental because they:

1. **O(1) Average Operations**: Fastest lookup, insert, and delete
2. **Flexible Keys**: Support any hashable type (strings, numbers, objects)
3. **Caching**: Foundation of memoization and caching systems
4. **Database Indexes**: Hash indexes for quick lookups
5. **Symbol Tables**: Compiler variable/function lookups
6. **Ubiquitous**: Built into most languages (Map in JavaScript, dict in Python)

## Time Complexity

| Operation | Average Case | Worst Case | Description                    |
|-----------|-------------|------------|--------------------------------|
| Search    | O(1)        | O(n)       | Find value by key              |
| Insert    | O(1)        | O(n)       | Add key-value pair             |
| Delete    | O(1)        | O(n)       | Remove key-value pair          |
| Resize    | O(n)        | O(n)       | Rehash all elements            |

**Space Complexity**: O(n) where n is number of key-value pairs

**Worst case** occurs when:
- All keys collide (poor hash function)
- High load factor without resizing
- Using inefficient collision resolution

## Hash Functions

A good hash function should:
1. **Deterministic**: Same key always produces same hash
2. **Uniform Distribution**: Spread keys evenly across buckets
3. **Fast**: O(1) computation time
4. **Minimize Collisions**: Different keys rarely produce same hash

### Simple Hash Functions

```typescript
// String hash (simple but effective)
function hashString(str: string, size: number): number {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % size;
    }
    
    return Math.abs(hash);
}

// Number hash
function hashNumber(num: number, size: number): number {
    return Math.abs(num) % size;
}

// Object hash (using JSON)
function hashObject(obj: object, size: number): number {
    const str = JSON.stringify(obj);
    return hashString(str, size);
}
```

### Better Hash Function (DJB2)

```typescript
function djb2Hash(str: string, size: number): number {
    let hash = 5381;
    
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
    }
    
    return Math.abs(hash % size);
}
```

## Collision Resolution Strategies

### 1. Separate Chaining (Linked Lists)

```typescript
interface HashNode<K, V> {
    key: K;
    value: V;
    next: HashNode<K, V> | null;
}

class HashTableChaining<K, V> {
    private buckets: Array<HashNode<K, V> | null>;
    private size: number;
    private count: number;

    constructor(initialSize: number = 16) {
        this.size = initialSize;
        this.buckets = new Array(initialSize).fill(null);
        this.count = 0;
    }

    private hash(key: K): number {
        const str = String(key);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % this.size;
        }
        
        return Math.abs(hash);
    }

    set(key: K, value: V): void {
        const index = this.hash(key);
        let node = this.buckets[index];

        // Update existing key
        while (node !== null) {
            if (node.key === key) {
                node.value = value;
                return;
            }
            node = node.next;
        }

        // Add new node at beginning (O(1))
        const newNode: HashNode<K, V> = {
            key,
            value,
            next: this.buckets[index]
        };
        this.buckets[index] = newNode;
        this.count++;

        // Resize if load factor > 0.75
        if (this.count / this.size > 0.75) {
            this.resize();
        }
    }

    get(key: K): V | undefined {
        const index = this.hash(key);
        let node = this.buckets[index];

        while (node !== null) {
            if (node.key === key) {
                return node.value;
            }
            node = node.next;
        }

        return undefined;
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: K): boolean {
        const index = this.hash(key);
        let node = this.buckets[index];
        let prev: HashNode<K, V> | null = null;

        while (node !== null) {
            if (node.key === key) {
                if (prev === null) {
                    // Remove first node
                    this.buckets[index] = node.next;
                } else {
                    prev.next = node.next;
                }
                this.count--;
                return true;
            }
            prev = node;
            node = node.next;
        }

        return false;
    }

    private resize(): void {
        const oldBuckets = this.buckets;
        this.size *= 2;
        this.buckets = new Array(this.size).fill(null);
        this.count = 0;

        // Rehash all elements
        for (const bucket of oldBuckets) {
            let node = bucket;
            while (node !== null) {
                this.set(node.key, node.value);
                node = node.next;
            }
        }
    }

    length(): number {
        return this.count;
    }

    keys(): K[] {
        const keys: K[] = [];
        
        for (const bucket of this.buckets) {
            let node = bucket;
            while (node !== null) {
                keys.push(node.key);
                node = node.next;
            }
        }
        
        return keys;
    }

    values(): V[] {
        const values: V[] = [];
        
        for (const bucket of this.buckets) {
            let node = bucket;
            while (node !== null) {
                values.push(node.value);
                node = node.next;
            }
        }
        
        return values;
    }

    entries(): Array<[K, V]> {
        const entries: Array<[K, V]> = [];
        
        for (const bucket of this.buckets) {
            let node = bucket;
            while (node !== null) {
                entries.push([node.key, node.value]);
                node = node.next;
            }
        }
        
        return entries;
    }
}
```

### Usage Example

```typescript
const hashTable = new HashTableChaining<string, number>();

// Insert
hashTable.set('apple', 5);
hashTable.set('banana', 3);
hashTable.set('orange', 7);

// Get
console.log(hashTable.get('apple'));    // 5
console.log(hashTable.get('grape'));    // undefined

// Update
hashTable.set('apple', 10);
console.log(hashTable.get('apple'));    // 10

// Check existence
console.log(hashTable.has('banana'));   // true

// Delete
hashTable.delete('banana');
console.log(hashTable.has('banana'));   // false

// Iteration
console.log(hashTable.keys());          // ['apple', 'orange']
console.log(hashTable.values());        // [10, 7]
console.log(hashTable.entries());       // [['apple', 10], ['orange', 7]]
```

### 2. Open Addressing (Linear Probing)

```typescript
interface HashEntry<K, V> {
    key: K;
    value: V;
    deleted: boolean; // Tombstone for deleted entries
}

class HashTableOpenAddressing<K, V> {
    private table: Array<HashEntry<K, V> | null>;
    private size: number;
    private count: number;

    constructor(initialSize: number = 16) {
        this.size = initialSize;
        this.table = new Array(initialSize).fill(null);
        this.count = 0;
    }

    private hash(key: K): number {
        const str = String(key);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % this.size;
        }
        
        return Math.abs(hash);
    }

    set(key: K, value: V): void {
        if (this.count / this.size > 0.7) {
            this.resize();
        }

        let index = this.hash(key);
        let i = 0;

        // Linear probing
        while (i < this.size) {
            const entry = this.table[index];

            if (entry === null || entry.deleted) {
                // Empty or deleted slot
                this.table[index] = { key, value, deleted: false };
                this.count++;
                return;
            }

            if (entry.key === key) {
                // Update existing key
                entry.value = value;
                return;
            }

            // Move to next slot
            index = (index + 1) % this.size;
            i++;
        }

        throw new Error('Hash table is full');
    }

    get(key: K): V | undefined {
        let index = this.hash(key);
        let i = 0;

        while (i < this.size) {
            const entry = this.table[index];

            if (entry === null) {
                return undefined; // Not found
            }

            if (!entry.deleted && entry.key === key) {
                return entry.value;
            }

            index = (index + 1) % this.size;
            i++;
        }

        return undefined;
    }

    has(key: K): boolean {
        return this.get(key) !== undefined;
    }

    delete(key: K): boolean {
        let index = this.hash(key);
        let i = 0;

        while (i < this.size) {
            const entry = this.table[index];

            if (entry === null) {
                return false; // Not found
            }

            if (!entry.deleted && entry.key === key) {
                entry.deleted = true; // Tombstone
                this.count--;
                return true;
            }

            index = (index + 1) % this.size;
            i++;
        }

        return false;
    }

    private resize(): void {
        const oldTable = this.table;
        this.size *= 2;
        this.table = new Array(this.size).fill(null);
        this.count = 0;

        for (const entry of oldTable) {
            if (entry && !entry.deleted) {
                this.set(entry.key, entry.value);
            }
        }
    }

    length(): number {
        return this.count;
    }
}
```

### 3. Quadratic Probing

```typescript
class HashTableQuadratic<K, V> {
    private table: Array<HashEntry<K, V> | null>;
    private size: number;
    private count: number;

    constructor(initialSize: number = 16) {
        this.size = initialSize;
        this.table = new Array(initialSize).fill(null);
        this.count = 0;
    }

    private hash(key: K): number {
        const str = String(key);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % this.size;
        }
        
        return Math.abs(hash);
    }

    set(key: K, value: V): void {
        if (this.count / this.size > 0.7) {
            this.resize();
        }

        const baseIndex = this.hash(key);

        for (let i = 0; i < this.size; i++) {
            // Quadratic probing: index = (h + i^2) % size
            const index = (baseIndex + i * i) % this.size;
            const entry = this.table[index];

            if (entry === null || entry.deleted) {
                this.table[index] = { key, value, deleted: false };
                this.count++;
                return;
            }

            if (entry.key === key) {
                entry.value = value;
                return;
            }
        }

        throw new Error('Hash table is full');
    }

    // get, delete, resize similar to linear probing...
    
    private resize(): void {
        const oldTable = this.table;
        this.size *= 2;
        this.table = new Array(this.size).fill(null);
        this.count = 0;

        for (const entry of oldTable) {
            if (entry && !entry.deleted) {
                this.set(entry.key, entry.value);
            }
        }
    }
}
```

## Advanced Operations

### LRU Cache with Hash Table

```typescript
class LRUNode<K, V> {
    key: K;
    value: V;
    prev: LRUNode<K, V> | null = null;
    next: LRUNode<K, V> | null = null;

    constructor(key: K, value: V) {
        this.key = key;
        this.value = value;
    }
}

class LRUCache<K, V> {
    private capacity: number;
    private cache: Map<K, LRUNode<K, V>>;
    private head: LRUNode<K, V>;
    private tail: LRUNode<K, V>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.cache = new Map();
        
        // Dummy head and tail
        this.head = new LRUNode(null as any, null as any);
        this.tail = new LRUNode(null as any, null as any);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    get(key: K): V | undefined {
        const node = this.cache.get(key);
        
        if (!node) {
            return undefined;
        }

        // Move to front (most recently used)
        this.moveToFront(node);
        return node.value;
    }

    put(key: K, value: V): void {
        let node = this.cache.get(key);

        if (node) {
            // Update existing
            node.value = value;
            this.moveToFront(node);
        } else {
            // Add new node
            node = new LRUNode(key, value);
            this.cache.set(key, node);
            this.addToFront(node);

            // Evict if over capacity
            if (this.cache.size > this.capacity) {
                const lru = this.removeLRU();
                if (lru) {
                    this.cache.delete(lru.key);
                }
            }
        }
    }

    private addToFront(node: LRUNode<K, V>): void {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    private removeNode(node: LRUNode<K, V>): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private moveToFront(node: LRUNode<K, V>): void {
        this.removeNode(node);
        this.addToFront(node);
    }

    private removeLRU(): LRUNode<K, V> | null {
        const lru = this.tail.prev;
        
        if (lru === this.head) {
            return null;
        }

        this.removeNode(lru!);
        return lru;
    }
}

// Usage
const lru = new LRUCache<string, number>(3);
lru.put('a', 1);
lru.put('b', 2);
lru.put('c', 3);
console.log(lru.get('a'));    // 1, 'a' becomes most recent
lru.put('d', 4);             // Evicts 'b' (least recently used)
console.log(lru.get('b'));    // undefined
```

### Frequency Counter

```typescript
class FrequencyCounter<T> {
    private map: Map<T, number>;

    constructor() {
        this.map = new Map();
    }

    add(item: T): void {
        this.map.set(item, (this.map.get(item) || 0) + 1);
    }

    getFrequency(item: T): number {
        return this.map.get(item) || 0;
    }

    getMostFrequent(): T | null {
        let maxFreq = 0;
        let mostFrequent: T | null = null;

        for (const [item, freq] of this.map) {
            if (freq > maxFreq) {
                maxFreq = freq;
                mostFrequent = item;
            }
        }

        return mostFrequent;
    }

    getTopK(k: number): T[] {
        return Array.from(this.map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, k)
            .map(([item]) => item);
    }
}

// Usage
const counter = new FrequencyCounter<string>();
['apple', 'banana', 'apple', 'orange', 'banana', 'apple'].forEach(fruit =>
    counter.add(fruit)
);

console.log(counter.getFrequency('apple'));      // 3
console.log(counter.getMostFrequent());          // 'apple'
console.log(counter.getTopK(2));                 // ['apple', 'banana']
```

## Real-World Applications

### 1. Caching System

```typescript
interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
}

class CacheSystem<K, V> {
    private cache: Map<K, { value: V; timestamp: number }>;
    private ttl: number;

    constructor(options: CacheOptions = {}) {
        this.cache = new Map();
        this.ttl = options.ttl || 60000; // Default 60 seconds
    }

    set(key: K, value: V): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key: K): V | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    invalidate(key: K): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    cleanup(): void {
        const now = Date.now();
        
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}
```

### 2. Two Sum Problem

```typescript
function twoSum(nums: number[], target: number): [number, number] | null {
    const map = new Map<number, number>();

    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];

        if (map.has(complement)) {
            return [map.get(complement)!, i];
        }

        map.set(nums[i], i);
    }

    return null;
}

// Usage
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));      // [1, 2]
```

### 3. Group Anagrams

```typescript
function groupAnagrams(words: string[]): string[][] {
    const map = new Map<string, string[]>();

    for (const word of words) {
        // Sort word to create key
        const sorted = word.split('').sort().join('');

        if (!map.has(sorted)) {
            map.set(sorted, []);
        }

        map.get(sorted)!.push(word);
    }

    return Array.from(map.values());
}

// Usage
console.log(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']));
// [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
```

### 4. First Non-Repeating Character

```typescript
function firstNonRepeating(str: string): string | null {
    const freq = new Map<string, number>();

    // Count frequencies
    for (const char of str) {
        freq.set(char, (freq.get(char) || 0) + 1);
    }

    // Find first with frequency 1
    for (const char of str) {
        if (freq.get(char) === 1) {
            return char;
        }
    }

    return null;
}

// Usage
console.log(firstNonRepeating('leetcode'));     // 'l'
console.log(firstNonRepeating('loveleetcode')); // 'v'
console.log(firstNonRepeating('aabb'));         // null
```

### 5. Substring with K Distinct Characters

```typescript
function longestSubstringKDistinct(s: string, k: number): number {
    const map = new Map<string, number>();
    let left = 0;
    let maxLength = 0;

    for (let right = 0; right < s.length; right++) {
        map.set(s[right], (map.get(s[right]) || 0) + 1);

        while (map.size > k) {
            const leftChar = s[left];
            map.set(leftChar, map.get(leftChar)! - 1);
            
            if (map.get(leftChar) === 0) {
                map.delete(leftChar);
            }
            
            left++;
        }

        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}

// Usage
console.log(longestSubstringKDistinct('eceba', 2));  // 3 ('ece')
console.log(longestSubstringKDistinct('aa', 1));      // 2 ('aa')
```

## When to Use Hash Tables

### Use Hash Tables When:
- ✅ You need **O(1) average lookup** by key
- ✅ **Counting frequencies** or occurrences
- ✅ **Detecting duplicates** in a collection
- ✅ **Caching** results for fast retrieval
- ✅ **Group items** by computed keys (anagrams, etc.)
- ✅ **Two-pointer** problems with complement lookups
- ✅ Order doesn't matter

### Don't Use Hash Tables When:
- ❌ You need **sorted iteration** → use BST or sorted array
- ❌ You need **range queries** → use BST
- ❌ **Memory is very limited** → arrays more compact
- ❌ You need **order preservation** → use array or linked list
- ❌ Keys are **not hashable** or hash poorly

## Common Pitfalls and How to Avoid Them

### 1. Poor Hash Function

```typescript
// ❌ Wrong: Bad distribution
function badHash(str: string, size: number): number {
    return str.length % size; // All same-length strings collide!
}

// ✅ Correct: Good distribution
function goodHash(str: string, size: number): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % size;
    }
    return Math.abs(hash);
}
```

### 2. Forgetting to Handle Collisions

```typescript
// ❌ Wrong: Overwrites on collision
set(key: K, value: V): void {
    const index = this.hash(key);
    this.table[index] = { key, value }; // Lost previous entry!
}

// ✅ Correct: Use chaining or probing
set(key: K, value: V): void {
    const index = this.hash(key);
    // Add to linked list at index (chaining)
    // Or find next available slot (probing)
}
```

### 3. Not Resizing

```typescript
// ❌ Wrong: Fixed size causes degradation
class HashTable<K, V> {
    private size = 10; // Never changes
    // Performance degrades as elements increase
}

// ✅ Correct: Resize when load factor exceeds threshold
set(key: K, value: V): void {
    // ... add element ...
    
    if (this.count / this.size > 0.75) {
        this.resize(); // Double size and rehash
    }
}
```

### 4. Using Non-Hashable Keys

```typescript
// ❌ Wrong: Objects as keys without custom hash
const map = new Map();
const obj1 = { id: 1 };
const obj2 = { id: 1 };
map.set(obj1, 'value');
console.log(map.get(obj2)); // undefined (different references!)

// ✅ Correct: Use primitive keys or custom hash
const map = new Map();
map.set(1, 'value'); // Use obj.id as key
console.log(map.get(1)); // 'value'
```

### 5. Modifying Keys After Insertion

```typescript
// ❌ Wrong: Mutating key object
const map = new Map();
const key = { id: 1 };
map.set(key, 'value');
key.id = 2; // Hash changes, can't find entry!
console.log(map.get(key)); // undefined

// ✅ Correct: Use immutable keys
const map = new Map();
map.set(1, 'value'); // Primitive key can't be mutated
console.log(map.get(1)); // 'value'
```

## Summary

**Hash Tables** are among the most important data structures in programming:

1. **O(1) Average Operations**: Fastest lookup, insert, delete
2. **Hash Function**: Maps keys to array indexes
3. **Collision Resolution**: Chaining (linked lists) or Open Addressing (probing)
4. **Load Factor**: Triggers resizing to maintain performance
5. **Applications**: Caching, frequency counting, duplicate detection, grouping
6. **Key Advantage**: Unmatched speed for key-value operations

Hash tables excel at:
- Fast lookups by key
- Counting and frequency problems
- Detecting duplicates
- Implementing caches
- Grouping related items

**Remember**: Hash tables trade order for speed. If you need sorted iteration or range queries, use a BST. If you need O(1) lookup and don't care about order, hash tables are the best choice. Built-in implementations (Map in JavaScript) are highly optimized and should be preferred over custom implementations in production code.

---

**Next**: Explore [Sets](../03-hash/sets.md) for unique element collections, or review [Tries](../02-trees/tries.md) for prefix-based operations.
