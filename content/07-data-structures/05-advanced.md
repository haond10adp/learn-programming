# Advanced Data Structures

## Introduction

**Advanced data structures** are specialized structures designed to solve specific problems efficiently. While basic structures (arrays, linked lists, trees, hash tables) cover many use cases, advanced structures provide optimized solutions for complex scenarios like range queries, set operations, probabilistic membership testing, and dynamic connectivity.

## Why Advanced Structures Matter

Advanced data structures are essential for:

1. **Optimization**: Solve problems faster than basic structures
2. **Space-Time Trade-offs**: Sacrifice accuracy for speed or memory
3. **Specialized Operations**: Efficient solutions for specific problem types
4. **Scalability**: Handle massive datasets efficiently
5. **Real-World Systems**: Power databases, caches, networks, and more

## Bloom Filters

### What is a Bloom Filter?

A **Bloom Filter** is a space-efficient probabilistic data structure that tests whether an element is a member of a set. It can have **false positives** but **never false negatives**.

### Properties
- Space-efficient: Uses bit array
- Probabilistic: Can't guarantee element isn't present
- No deletions: Can't remove elements (use Counting Bloom Filter)
- Fast: O(k) where k is number of hash functions

### Time Complexity

| Operation | Time Complexity |
|-----------|-----------------|
| Insert    | O(k)            |
| Query     | O(k)            |
| Space     | O(m)            |

Where k = number of hash functions, m = bit array size

### Implementation

```typescript
class BloomFilter {
    private bitArray: boolean[];
    private size: number;
    private hashCount: number;

    constructor(size: number = 1000, hashCount: number = 3) {
        this.size = size;
        this.hashCount = hashCount;
        this.bitArray = new Array(size).fill(false);
    }

    // Generate k hash values for input
    private hash(item: string, seed: number): number {
        let hash = 0;
        for (let i = 0; i < item.length; i++) {
            hash = (hash * seed + item.charCodeAt(i)) % this.size;
        }
        return Math.abs(hash);
    }

    // Add item to filter
    add(item: string): void {
        for (let i = 0; i < this.hashCount; i++) {
            const index = this.hash(item, i + 1);
            this.bitArray[index] = true;
        }
    }

    // Check if item might be in set
    contains(item: string): boolean {
        for (let i = 0; i < this.hashCount; i++) {
            const index = this.hash(item, i + 1);
            if (!this.bitArray[index]) {
                return false; // Definitely not in set
            }
        }
        return true; // Probably in set (could be false positive)
    }

    // Get false positive probability (approximate)
    getFalsePositiveRate(itemCount: number): number {
        const m = this.size;
        const k = this.hashCount;
        const n = itemCount;
        
        // (1 - e^(-kn/m))^k
        return Math.pow(1 - Math.exp(-k * n / m), k);
    }
}

// Usage
const bloom = new BloomFilter(1000, 3);

bloom.add('apple');
bloom.add('banana');
bloom.add('cherry');

console.log(bloom.contains('apple'));    // true (definitely added)
console.log(bloom.contains('grape'));    // false (definitely not added)
console.log(bloom.contains('apricot'));  // might be false positive

console.log(bloom.getFalsePositiveRate(3)); // ~0.008
```

### Real-World Applications

```typescript
// URL Crawler - avoid revisiting URLs
class WebCrawler {
    private visited: BloomFilter;

    constructor() {
        this.visited = new BloomFilter(1000000, 5);
    }

    shouldVisit(url: string): boolean {
        if (this.visited.contains(url)) {
            return false; // Probably visited
        }
        this.visited.add(url);
        return true;
    }
}

// Spam Filter
class SpamFilter {
    private spamWords: BloomFilter;

    constructor(spamWordList: string[]) {
        this.spamWords = new BloomFilter(10000, 4);
        spamWordList.forEach(word => this.spamWords.add(word));
    }

    isSpam(email: string): boolean {
        const words = email.toLowerCase().split(/\s+/);
        let spamWordCount = 0;

        for (const word of words) {
            if (this.spamWords.contains(word)) {
                spamWordCount++;
            }
        }

        return spamWordCount / words.length > 0.1; // 10% threshold
    }
}
```

## Union-Find (Disjoint Set Union)

### What is Union-Find?

**Union-Find** is a data structure that tracks elements partitioned into disjoint (non-overlapping) sets. It efficiently supports two operations: finding which set an element belongs to, and merging two sets.

### Time Complexity

| Operation | Time Complexity |
|-----------|-----------------|
| Find      | O(α(n))         |
| Union     | O(α(n))         |
| Connected | O(α(n))         |

Where α(n) is the inverse Ackermann function (effectively constant)

### Implementation

```typescript
class UnionFind<T> {
    private parent: Map<T, T>;
    private rank: Map<T, number>;
    private count: number;

    constructor(elements: T[]) {
        this.parent = new Map();
        this.rank = new Map();
        this.count = elements.length;

        for (const element of elements) {
            this.parent.set(element, element);
            this.rank.set(element, 0);
        }
    }

    // Find root with path compression
    find(x: T): T {
        if (this.parent.get(x) !== x) {
            // Path compression: point directly to root
            this.parent.set(x, this.find(this.parent.get(x)!));
        }
        return this.parent.get(x)!;
    }

    // Union by rank
    union(x: T, y: T): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) {
            return false; // Already in same set
        }

        const rankX = this.rank.get(rootX)!;
        const rankY = this.rank.get(rootY)!;

        // Attach smaller tree under larger tree
        if (rankX < rankY) {
            this.parent.set(rootX, rootY);
        } else if (rankX > rankY) {
            this.parent.set(rootY, rootX);
        } else {
            this.parent.set(rootY, rootX);
            this.rank.set(rootX, rankX + 1);
        }

        this.count--;
        return true;
    }

    // Check if two elements are in same set
    connected(x: T, y: T): boolean {
        return this.find(x) === this.find(y);
    }

    // Get number of disjoint sets
    getCount(): number {
        return this.count;
    }

    // Get all elements in same set
    getSet(x: T): T[] {
        const root = this.find(x);
        const set: T[] = [];

        for (const [element, _] of this.parent) {
            if (this.find(element) === root) {
                set.push(element);
            }
        }

        return set;
    }
}

// Usage
const uf = new UnionFind([1, 2, 3, 4, 5]);

uf.union(1, 2);
uf.union(3, 4);

console.log(uf.connected(1, 2)); // true
console.log(uf.connected(1, 3)); // false
console.log(uf.getCount());      // 3 sets: {1,2}, {3,4}, {5}

uf.union(2, 3);
console.log(uf.connected(1, 4)); // true
console.log(uf.getCount());      // 2 sets: {1,2,3,4}, {5}
```

### Real-World Applications

```typescript
// Network Connectivity
function networkConnectivity(
    n: number,
    connections: Array<[number, number]>
): number {
    const uf = new UnionFind(Array.from({ length: n }, (_, i) => i));

    for (const [a, b] of connections) {
        uf.union(a, b);
    }

    return uf.getCount(); // Number of separate networks
}

// Detect Cycles in Undirected Graph
function hasCycle(
    n: number,
    edges: Array<[number, number]>
): boolean {
    const uf = new UnionFind(Array.from({ length: n }, (_, i) => i));

    for (const [u, v] of edges) {
        if (uf.connected(u, v)) {
            return true; // Edge creates cycle
        }
        uf.union(u, v);
    }

    return false;
}

// Friend Circles
function findCircleNum(isConnected: number[][]): number {
    const n = isConnected.length;
    const uf = new UnionFind(Array.from({ length: n }, (_, i) => i));

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (isConnected[i][j] === 1) {
                uf.union(i, j);
            }
        }
    }

    return uf.getCount();
}
```

## Skip List

### What is a Skip List?

A **Skip List** is a probabilistic data structure that allows O(log n) search, insertion, and deletion by maintaining multiple linked list layers with increasing sparsity.

### Time Complexity

| Operation | Average | Worst Case |
|-----------|---------|------------|
| Search    | O(log n)| O(n)       |
| Insert    | O(log n)| O(n)       |
| Delete    | O(log n)| O(n)       |
| Space     | O(n)    | O(n log n) |

### Implementation

```typescript
class SkipListNode<T> {
    value: T;
    forward: (SkipListNode<T> | null)[];

    constructor(value: T, level: number) {
        this.value = value;
        this.forward = new Array(level + 1).fill(null);
    }
}

class SkipList<T> {
    private head: SkipListNode<T>;
    private maxLevel: number;
    private level: number;
    private compare: (a: T, b: T) => number;

    constructor(maxLevel: number = 16, compareFn?: (a: T, b: T) => number) {
        this.maxLevel = maxLevel;
        this.level = 0;
        this.head = new SkipListNode(null as any, maxLevel);
        this.compare = compareFn || ((a: any, b: any) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
    }

    // Random level for new node
    private randomLevel(): number {
        let level = 0;
        while (Math.random() < 0.5 && level < this.maxLevel) {
            level++;
        }
        return level;
    }

    // Search for value
    search(value: T): boolean {
        let current = this.head;

        for (let i = this.level; i >= 0; i--) {
            while (
                current.forward[i] !== null &&
                this.compare(current.forward[i]!.value, value) < 0
            ) {
                current = current.forward[i]!;
            }
        }

        current = current.forward[0]!;
        return current !== null && this.compare(current.value, value) === 0;
    }

    // Insert value
    insert(value: T): void {
        const update: (SkipListNode<T> | null)[] = new Array(this.maxLevel + 1).fill(null);
        let current = this.head;

        // Find position
        for (let i = this.level; i >= 0; i--) {
            while (
                current.forward[i] !== null &&
                this.compare(current.forward[i]!.value, value) < 0
            ) {
                current = current.forward[i]!;
            }
            update[i] = current;
        }

        // Random level for new node
        const newLevel = this.randomLevel();

        if (newLevel > this.level) {
            for (let i = this.level + 1; i <= newLevel; i++) {
                update[i] = this.head;
            }
            this.level = newLevel;
        }

        // Create and insert new node
        const newNode = new SkipListNode(value, newLevel);
        for (let i = 0; i <= newLevel; i++) {
            newNode.forward[i] = update[i]!.forward[i];
            update[i]!.forward[i] = newNode;
        }
    }

    // Delete value
    delete(value: T): boolean {
        const update: (SkipListNode<T> | null)[] = new Array(this.maxLevel + 1).fill(null);
        let current = this.head;

        // Find node
        for (let i = this.level; i >= 0; i--) {
            while (
                current.forward[i] !== null &&
                this.compare(current.forward[i]!.value, value) < 0
            ) {
                current = current.forward[i]!;
            }
            update[i] = current;
        }

        current = current.forward[0]!;

        if (current === null || this.compare(current.value, value) !== 0) {
            return false; // Not found
        }

        // Remove node from all levels
        for (let i = 0; i <= this.level; i++) {
            if (update[i]!.forward[i] !== current) {
                break;
            }
            update[i]!.forward[i] = current.forward[i];
        }

        // Update level
        while (this.level > 0 && this.head.forward[this.level] === null) {
            this.level--;
        }

        return true;
    }

    // Get all values (in order)
    values(): T[] {
        const result: T[] = [];
        let current = this.head.forward[0];

        while (current !== null) {
            result.push(current.value);
            current = current.forward[0];
        }

        return result;
    }
}

// Usage
const skipList = new SkipList<number>();

skipList.insert(3);
skipList.insert(6);
skipList.insert(7);
skipList.insert(9);
skipList.insert(12);
skipList.insert(19);

console.log(skipList.search(7));   // true
console.log(skipList.search(10));  // false
console.log(skipList.values());    // [3, 6, 7, 9, 12, 19]

skipList.delete(7);
console.log(skipList.values());    // [3, 6, 9, 12, 19]
```

## Segment Tree

### What is a Segment Tree?

A **Segment Tree** is a tree data structure for storing intervals or segments. It allows efficient range queries (sum, min, max) and updates on array intervals.

### Time Complexity

| Operation      | Time Complexity |
|----------------|-----------------|
| Build          | O(n)            |
| Query Range    | O(log n)        |
| Update Element | O(log n)        |
| Space          | O(n)            |

### Implementation (Range Sum)

```typescript
class SegmentTree {
    private tree: number[];
    private n: number;

    constructor(arr: number[]) {
        this.n = arr.length;
        this.tree = new Array(4 * this.n).fill(0);
        this.build(arr, 0, 0, this.n - 1);
    }

    // Build tree
    private build(arr: number[], node: number, start: number, end: number): void {
        if (start === end) {
            this.tree[node] = arr[start];
            return;
        }

        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;

        this.build(arr, leftChild, start, mid);
        this.build(arr, rightChild, mid + 1, end);

        this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
    }

    // Query range sum [left, right]
    query(left: number, right: number): number {
        return this.queryHelper(0, 0, this.n - 1, left, right);
    }

    private queryHelper(
        node: number,
        start: number,
        end: number,
        left: number,
        right: number
    ): number {
        // No overlap
        if (right < start || left > end) {
            return 0;
        }

        // Complete overlap
        if (left <= start && end <= right) {
            return this.tree[node];
        }

        // Partial overlap
        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;

        const leftSum = this.queryHelper(leftChild, start, mid, left, right);
        const rightSum = this.queryHelper(rightChild, mid + 1, end, left, right);

        return leftSum + rightSum;
    }

    // Update element at index
    update(index: number, value: number): void {
        this.updateHelper(0, 0, this.n - 1, index, value);
    }

    private updateHelper(
        node: number,
        start: number,
        end: number,
        index: number,
        value: number
    ): void {
        if (start === end) {
            this.tree[node] = value;
            return;
        }

        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;

        if (index <= mid) {
            this.updateHelper(leftChild, start, mid, index, value);
        } else {
            this.updateHelper(rightChild, mid + 1, end, index, value);
        }

        this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
    }
}

// Usage
const arr = [1, 3, 5, 7, 9, 11];
const segTree = new SegmentTree(arr);

console.log(segTree.query(1, 3));  // 15 (3+5+7)
console.log(segTree.query(0, 5));  // 36 (sum of all)

segTree.update(2, 10);             // Change arr[2] from 5 to 10
console.log(segTree.query(1, 3));  // 20 (3+10+7)
```

### Range Minimum Query (RMQ)

```typescript
class SegmentTreeRMQ {
    private tree: number[];
    private n: number;

    constructor(arr: number[]) {
        this.n = arr.length;
        this.tree = new Array(4 * this.n).fill(Infinity);
        this.build(arr, 0, 0, this.n - 1);
    }

    private build(arr: number[], node: number, start: number, end: number): void {
        if (start === end) {
            this.tree[node] = arr[start];
            return;
        }

        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;

        this.build(arr, leftChild, start, mid);
        this.build(arr, rightChild, mid + 1, end);

        this.tree[node] = Math.min(this.tree[leftChild], this.tree[rightChild]);
    }

    queryMin(left: number, right: number): number {
        return this.queryHelper(0, 0, this.n - 1, left, right);
    }

    private queryHelper(
        node: number,
        start: number,
        end: number,
        left: number,
        right: number
    ): number {
        if (right < start || left > end) {
            return Infinity;
        }

        if (left <= start && end <= right) {
            return this.tree[node];
        }

        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;

        return Math.min(
            this.queryHelper(leftChild, start, mid, left, right),
            this.queryHelper(rightChild, mid + 1, end, left, right)
        );
    }
}

// Usage
const arr = [4, 2, 6, 1, 8, 3];
const rmq = new SegmentTreeRMQ(arr);

console.log(rmq.queryMin(0, 3));  // 1
console.log(rmq.queryMin(2, 5));  // 1
console.log(rmq.queryMin(4, 5));  // 3
```

## Fenwick Tree (Binary Indexed Tree)

### What is a Fenwick Tree?

A **Fenwick Tree** (or **Binary Indexed Tree**) is a data structure that efficiently computes prefix sums and updates elements in O(log n) time.

### Time Complexity

| Operation   | Time Complexity |
|-------------|-----------------|
| Build       | O(n log n)      |
| Prefix Sum  | O(log n)        |
| Update      | O(log n)        |
| Range Sum   | O(log n)        |
| Space       | O(n)            |

### Implementation

```typescript
class FenwickTree {
    private tree: number[];
    private n: number;

    constructor(size: number) {
        this.n = size;
        this.tree = new Array(size + 1).fill(0);
    }

    // Update element at index (1-indexed)
    update(index: number, delta: number): void {
        while (index <= this.n) {
            this.tree[index] += delta;
            index += index & -index; // Add last set bit
        }
    }

    // Get prefix sum [1, index]
    prefixSum(index: number): number {
        let sum = 0;
        while (index > 0) {
            sum += this.tree[index];
            index -= index & -index; // Remove last set bit
        }
        return sum;
    }

    // Get range sum [left, right]
    rangeSum(left: number, right: number): number {
        return this.prefixSum(right) - this.prefixSum(left - 1);
    }

    // Build from array (1-indexed)
    static fromArray(arr: number[]): FenwickTree {
        const tree = new FenwickTree(arr.length);
        for (let i = 0; i < arr.length; i++) {
            tree.update(i + 1, arr[i]);
        }
        return tree;
    }
}

// Usage
const fenwick = FenwickTree.fromArray([1, 3, 5, 7, 9, 11]);

console.log(fenwick.prefixSum(3));      // 9 (1+3+5)
console.log(fenwick.rangeSum(2, 4));    // 15 (3+5+7)

fenwick.update(3, 5);                   // Add 5 to index 3 (5 becomes 10)
console.log(fenwick.rangeSum(2, 4));    // 20 (3+10+7)
```

## Summary

**Advanced data structures** provide optimized solutions for specialized problems:

1. **Bloom Filter**: Space-efficient probabilistic membership testing
   - Use for: Large-scale duplicate detection, caching, spam filtering
   - Trade-off: False positives possible, no deletions

2. **Union-Find**: Track disjoint sets with near-constant operations
   - Use for: Connected components, cycle detection, network connectivity
   - Optimization: Path compression + union by rank

3. **Skip List**: Probabilistic balanced search structure
   - Use for: Alternative to balanced trees, concurrent access
   - Trade-off: Probabilistic balance, simple implementation

4. **Segment Tree**: Efficient range queries and updates
   - Use for: Range sum/min/max queries, interval operations
   - Build: O(n), Query/Update: O(log n)

5. **Fenwick Tree**: Compact prefix sum structure
   - Use for: Prefix sums, range queries, frequency counting
   - Advantage: Simpler than segment tree, less space

**Selection Guide**:
- **Membership testing at scale** → Bloom Filter
- **Dynamic connectivity** → Union-Find
- **Sorted data with frequent updates** → Skip List
- **Range queries (any operation)** → Segment Tree
- **Prefix/range sums only** → Fenwick Tree (simpler, faster)

**Remember**: These structures optimize specific operations at the cost of complexity or guarantees. Use them when basic structures can't meet performance requirements, and understand their trade-offs (space, false positives, probabilistic behavior).

---

**Module Complete**: You've finished Data Structures! Review the [Module README](../00-index.md) or continue to [Architecture Patterns](../../08-architecture/00-index.md).
