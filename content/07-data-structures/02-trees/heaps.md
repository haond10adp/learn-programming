# Heaps

## What is a Heap?

A **Heap** is a specialized tree-based data structure that satisfies the **heap property**. It's a complete binary tree where each node follows a specific ordering relationship with its children. Heaps are the foundation of efficient priority queues and are used in sorting algorithms like Heap Sort.

### Types of Heaps

1. **Max Heap**: Parent ≥ Children (largest element at root)
2. **Min Heap**: Parent ≤ Children (smallest element at root)

```
Max Heap:              Min Heap:
    100                    1
   /   \                 /   \
  80    90              3     5
 / \    /              / \   /
50 70  85            8  10  12

Parent ≥ Children    Parent ≤ Children
```

### Heap Properties

1. **Complete Binary Tree**: All levels filled except possibly the last, which fills left-to-right
2. **Heap Property**: Parent-child ordering relationship maintained throughout
3. **Array Representation**: Can be efficiently stored in an array without pointers

## Why Heaps Matter

Heaps are crucial because they:

1. **Efficient Priority Queues**: O(log n) insert/remove with O(1) peek
2. **Heap Sort**: O(n log n) sorting algorithm with O(1) space
3. **Graph Algorithms**: Used in Dijkstra's and Prim's algorithms
4. **K-way Merge**: Efficiently merge multiple sorted sequences
5. **Median Maintenance**: Finding running median in data streams
6. **Top-K Problems**: Efficiently find K largest/smallest elements

## Time Complexity

| Operation      | Time Complexity | Description                    |
|----------------|-----------------|--------------------------------|
| Insert         | O(log n)        | Add element and bubble up      |
| Extract Min/Max| O(log n)        | Remove root and heapify down   |
| Peek Min/Max   | O(1)            | View root without removing     |
| Build Heap     | O(n)            | Create heap from array         |
| Heapify        | O(log n)        | Restore heap property          |
| Heap Sort      | O(n log n)      | Sort using heap operations     |
| Search         | O(n)            | Heaps aren't optimized for this|

**Space Complexity**: O(n) for storing n elements

## Array Representation

Heaps use an efficient array-based representation:

```typescript
// For element at index i (0-based):
Parent Index:      Math.floor((i - 1) / 2)
Left Child Index:  2 * i + 1
Right Child Index: 2 * i + 2

// Example: [100, 80, 90, 50, 70, 85]
//           0    1   2   3   4   5
//
//         100 (0)
//        /       \
//     80(1)      90(2)
//     /  \       /
//  50(3) 70(4) 85(5)
```

## Min Heap Implementation

```typescript
class MinHeap<T> {
    private heap: T[];
    private compare: (a: T, b: T) => number;

    constructor(compareFn?: (a: T, b: T) => number) {
        this.heap = [];
        // Default: number comparison
        this.compare = compareFn || ((a: any, b: any) => a - b);
    }

    // Get number of elements
    size(): number {
        return this.heap.length;
    }

    // Check if heap is empty
    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    // View minimum element without removing
    peek(): T | null {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    // Insert element
    insert(value: T): void {
        this.heap.push(value);
        this.bubbleUp(this.heap.length - 1);
    }

    // Remove and return minimum element
    extractMin(): T | null {
        if (this.isEmpty()) return null;

        if (this.heap.length === 1) {
            return this.heap.pop()!;
        }

        const min = this.heap[0];
        this.heap[0] = this.heap.pop()!;
        this.bubbleDown(0);

        return min;
    }

    // Bubble up: restore heap property upward
    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            // If heap property satisfied, stop
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) {
                break;
            }

            // Swap with parent
            [this.heap[index], this.heap[parentIndex]] = 
            [this.heap[parentIndex], this.heap[index]];

            index = parentIndex;
        }
    }

    // Bubble down: restore heap property downward
    private bubbleDown(index: number): void {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            // Find smallest among node and its children
            if (
                leftChild < this.heap.length &&
                this.compare(this.heap[leftChild], this.heap[smallest]) < 0
            ) {
                smallest = leftChild;
            }

            if (
                rightChild < this.heap.length &&
                this.compare(this.heap[rightChild], this.heap[smallest]) < 0
            ) {
                smallest = rightChild;
            }

            // If heap property satisfied, stop
            if (smallest === index) {
                break;
            }

            // Swap with smallest child
            [this.heap[index], this.heap[smallest]] = 
            [this.heap[smallest], this.heap[index]];

            index = smallest;
        }
    }

    // Build heap from array (O(n) operation)
    static fromArray<T>(arr: T[], compareFn?: (a: T, b: T) => number): MinHeap<T> {
        const heap = new MinHeap<T>(compareFn);
        heap.heap = [...arr];

        // Start from last parent and heapify down
        for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
            heap.bubbleDown(i);
        }

        return heap;
    }

    // Convert to array
    toArray(): T[] {
        return [...this.heap];
    }
}
```

### Usage Example

```typescript
const minHeap = new MinHeap<number>();

// Insert elements
minHeap.insert(10);
minHeap.insert(5);
minHeap.insert(15);
minHeap.insert(3);
minHeap.insert(8);

console.log(minHeap.peek());         // 3
console.log(minHeap.extractMin());   // 3
console.log(minHeap.extractMin());   // 5
console.log(minHeap.size());         // 3

// Build from array (efficient)
const heap = MinHeap.fromArray([10, 5, 15, 3, 8, 12]);
console.log(heap.toArray());         // [3, 5, 12, 10, 8, 15]
```

## Max Heap Implementation

```typescript
class MaxHeap<T> {
    private heap: T[];
    private compare: (a: T, b: T) => number;

    constructor(compareFn?: (a: T, b: T) => number) {
        this.heap = [];
        // For max heap, reverse comparison
        this.compare = compareFn || ((a: any, b: any) => b - a);
    }

    size(): number {
        return this.heap.length;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    peek(): T | null {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    insert(value: T): void {
        this.heap.push(value);
        this.bubbleUp(this.heap.length - 1);
    }

    extractMax(): T | null {
        if (this.isEmpty()) return null;

        if (this.heap.length === 1) {
            return this.heap.pop()!;
        }

        const max = this.heap[0];
        this.heap[0] = this.heap.pop()!;
        this.bubbleDown(0);

        return max;
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);

            // For max heap: child should be <= parent
            if (this.compare(this.heap[parentIndex], this.heap[index]) >= 0) {
                break;
            }

            [this.heap[index], this.heap[parentIndex]] = 
            [this.heap[parentIndex], this.heap[index]];

            index = parentIndex;
        }
    }

    private bubbleDown(index: number): void {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let largest = index;

            if (
                leftChild < this.heap.length &&
                this.compare(this.heap[leftChild], this.heap[largest]) > 0
            ) {
                largest = leftChild;
            }

            if (
                rightChild < this.heap.length &&
                this.compare(this.heap[rightChild], this.heap[largest]) > 0
            ) {
                largest = rightChild;
            }

            if (largest === index) {
                break;
            }

            [this.heap[index], this.heap[largest]] = 
            [this.heap[largest], this.heap[index]];

            index = largest;
        }
    }
}
```

## Priority Queue Implementation

```typescript
interface PriorityItem<T> {
    value: T;
    priority: number;
}

class PriorityQueue<T> {
    private heap: MinHeap<PriorityItem<T>>;

    constructor() {
        this.heap = new MinHeap<PriorityItem<T>>(
            (a, b) => a.priority - b.priority
        );
    }

    // Add item with priority
    enqueue(value: T, priority: number): void {
        this.heap.insert({ value, priority });
    }

    // Remove and return highest priority item (lowest priority number)
    dequeue(): T | null {
        const item = this.heap.extractMin();
        return item ? item.value : null;
    }

    // View highest priority item
    peek(): T | null {
        const item = this.heap.peek();
        return item ? item.value : null;
    }

    isEmpty(): boolean {
        return this.heap.isEmpty();
    }

    size(): number {
        return this.heap.size();
    }
}

// Usage
const pq = new PriorityQueue<string>();
pq.enqueue("Low priority task", 5);
pq.enqueue("High priority task", 1);
pq.enqueue("Medium priority task", 3);

console.log(pq.dequeue()); // "High priority task" (priority 1)
console.log(pq.dequeue()); // "Medium priority task" (priority 3)
console.log(pq.dequeue()); // "Low priority task" (priority 5)
```

## Advanced Heap Operations

### Heap Sort

```typescript
function heapSort<T>(arr: T[]): T[] {
    const maxHeap = new MaxHeap<T>();

    // Build heap: O(n)
    for (const item of arr) {
        maxHeap.insert(item);
    }

    // Extract elements in sorted order: O(n log n)
    const sorted: T[] = [];
    while (!maxHeap.isEmpty()) {
        sorted.push(maxHeap.extractMax()!);
    }

    return sorted.reverse(); // Ascending order
}

// Usage
console.log(heapSort([5, 2, 8, 1, 9, 3])); // [1, 2, 3, 5, 8, 9]
```

### Find Kth Largest Element

```typescript
function findKthLargest(arr: number[], k: number): number | null {
    // Use min heap of size k
    const minHeap = new MinHeap<number>();

    for (const num of arr) {
        minHeap.insert(num);

        // Keep only k largest elements
        if (minHeap.size() > k) {
            minHeap.extractMin();
        }
    }

    // Root of min heap is kth largest
    return minHeap.peek();
}

// Usage
console.log(findKthLargest([3, 2, 1, 5, 6, 4], 2)); // 5
```

### Find Kth Smallest Element

```typescript
function findKthSmallest(arr: number[], k: number): number | null {
    // Use max heap of size k
    const maxHeap = new MaxHeap<number>();

    for (const num of arr) {
        maxHeap.insert(num);

        // Keep only k smallest elements
        if (maxHeap.size() > k) {
            maxHeap.extractMax();
        }
    }

    // Root of max heap is kth smallest
    return maxHeap.peek();
}

// Usage
console.log(findKthSmallest([3, 2, 1, 5, 6, 4], 2)); // 2
```

### Median Finder (Running Median)

```typescript
class MedianFinder {
    private maxHeap: MaxHeap<number>; // Stores smaller half
    private minHeap: MinHeap<number>; // Stores larger half

    constructor() {
        this.maxHeap = new MaxHeap<number>();
        this.minHeap = new MinHeap<number>();
    }

    addNum(num: number): void {
        // Add to max heap (smaller half) first
        if (this.maxHeap.isEmpty() || num <= this.maxHeap.peek()!) {
            this.maxHeap.insert(num);
        } else {
            this.minHeap.insert(num);
        }

        // Balance heaps (max heap size should be equal or 1 more than min heap)
        if (this.maxHeap.size() > this.minHeap.size() + 1) {
            this.minHeap.insert(this.maxHeap.extractMax()!);
        } else if (this.minHeap.size() > this.maxHeap.size()) {
            this.maxHeap.insert(this.minHeap.extractMin()!);
        }
    }

    findMedian(): number {
        if (this.maxHeap.size() > this.minHeap.size()) {
            return this.maxHeap.peek()!;
        }

        return (this.maxHeap.peek()! + this.minHeap.peek()!) / 2;
    }
}

// Usage
const mf = new MedianFinder();
mf.addNum(1);
mf.addNum(2);
console.log(mf.findMedian()); // 1.5
mf.addNum(3);
console.log(mf.findMedian()); // 2
```

### Merge K Sorted Arrays

```typescript
function mergeKSortedArrays(arrays: number[][]): number[] {
    interface HeapItem {
        value: number;
        arrayIndex: number;
        elementIndex: number;
    }

    const minHeap = new MinHeap<HeapItem>(
        (a, b) => a.value - b.value
    );

    // Initialize heap with first element from each array
    for (let i = 0; i < arrays.length; i++) {
        if (arrays[i].length > 0) {
            minHeap.insert({
                value: arrays[i][0],
                arrayIndex: i,
                elementIndex: 0
            });
        }
    }

    const result: number[] = [];

    while (!minHeap.isEmpty()) {
        const item = minHeap.extractMin()!;
        result.push(item.value);

        // Add next element from same array
        const nextIndex = item.elementIndex + 1;
        if (nextIndex < arrays[item.arrayIndex].length) {
            minHeap.insert({
                value: arrays[item.arrayIndex][nextIndex],
                arrayIndex: item.arrayIndex,
                elementIndex: nextIndex
            });
        }
    }

    return result;
}

// Usage
const arrays = [
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9]
];
console.log(mergeKSortedArrays(arrays)); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

### Top K Frequent Elements

```typescript
function topKFrequent(nums: number[], k: number): number[] {
    // Count frequencies
    const freq = new Map<number, number>();
    for (const num of nums) {
        freq.set(num, (freq.get(num) || 0) + 1);
    }

    // Use min heap to keep k most frequent
    const minHeap = new MinHeap<[number, number]>(
        (a, b) => a[1] - b[1] // Compare by frequency
    );

    for (const [num, count] of freq) {
        minHeap.insert([num, count]);

        if (minHeap.size() > k) {
            minHeap.extractMin();
        }
    }

    // Extract numbers from heap
    return minHeap.toArray().map(([num]) => num);
}

// Usage
console.log(topKFrequent([1, 1, 1, 2, 2, 3], 2)); // [1, 2]
```

## Real-World Applications

### 1. Task Scheduler

```typescript
interface Task {
    id: string;
    priority: number;
    deadline: Date;
    execute: () => Promise<void>;
}

class TaskScheduler {
    private tasks: PriorityQueue<Task>;

    constructor() {
        this.tasks = new PriorityQueue<Task>();
    }

    scheduleTask(task: Task): void {
        this.tasks.enqueue(task, task.priority);
    }

    async runNext(): Promise<void> {
        const task = this.tasks.dequeue();
        if (task) {
            await task.execute();
        }
    }

    async runAll(): Promise<void> {
        while (!this.tasks.isEmpty()) {
            await this.runNext();
        }
    }

    peekNext(): Task | null {
        return this.tasks.peek();
    }
}

// Usage
const scheduler = new TaskScheduler();

scheduler.scheduleTask({
    id: 'backup',
    priority: 3,
    deadline: new Date('2025-12-31'),
    execute: async () => console.log('Running backup...')
});

scheduler.scheduleTask({
    id: 'critical-update',
    priority: 1,
    deadline: new Date('2025-12-30'),
    execute: async () => console.log('Running critical update...')
});

scheduler.runAll(); // Runs critical-update first
```

### 2. Dijkstra's Shortest Path

```typescript
interface GraphNode {
    id: string;
    distance: number;
}

function dijkstra(
    graph: Map<string, Map<string, number>>,
    start: string
): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const pq = new PriorityQueue<GraphNode>();

    // Initialize distances
    for (const node of graph.keys()) {
        distances.set(node, node === start ? 0 : Infinity);
    }

    pq.enqueue({ id: start, distance: 0 }, 0);

    while (!pq.isEmpty()) {
        const current = pq.dequeue()!;

        if (visited.has(current.id)) continue;
        visited.add(current.id);

        const neighbors = graph.get(current.id) || new Map();
        for (const [neighbor, weight] of neighbors) {
            const newDistance = distances.get(current.id)! + weight;

            if (newDistance < distances.get(neighbor)!) {
                distances.set(neighbor, newDistance);
                pq.enqueue({ id: neighbor, distance: newDistance }, newDistance);
            }
        }
    }

    return distances;
}
```

### 3. Event-Driven Simulation

```typescript
interface SimulationEvent {
    time: number;
    type: string;
    handler: () => void;
}

class DiscreteEventSimulator {
    private events: MinHeap<SimulationEvent>;
    private currentTime: number;

    constructor() {
        this.events = new MinHeap<SimulationEvent>(
            (a, b) => a.time - b.time
        );
        this.currentTime = 0;
    }

    scheduleEvent(event: SimulationEvent): void {
        this.events.insert(event);
    }

    run(): void {
        while (!this.events.isEmpty()) {
            const event = this.events.extractMin()!;
            this.currentTime = event.time;

            console.log(`[Time ${this.currentTime}] ${event.type}`);
            event.handler();
        }
    }
}

// Usage
const sim = new DiscreteEventSimulator();

sim.scheduleEvent({
    time: 5,
    type: 'Customer Arrival',
    handler: () => console.log('Customer enters store')
});

sim.scheduleEvent({
    time: 2,
    type: 'Store Opens',
    handler: () => console.log('Store opens for business')
});

sim.scheduleEvent({
    time: 10,
    type: 'Customer Departure',
    handler: () => console.log('Customer leaves store')
});

sim.run();
// Output (sorted by time):
// [Time 2] Store Opens
// [Time 5] Customer Arrival
// [Time 10] Customer Departure
```

### 4. Memory Pool Manager

```typescript
interface MemoryBlock {
    address: number;
    size: number;
}

class MemoryPoolManager {
    private freeBlocks: MaxHeap<MemoryBlock>;

    constructor() {
        // Max heap by size (largest blocks first)
        this.freeBlocks = new MaxHeap<MemoryBlock>(
            (a, b) => a.size - b.size
        );
    }

    addFreeBlock(block: MemoryBlock): void {
        this.freeBlocks.insert(block);
    }

    allocate(size: number): MemoryBlock | null {
        // Find largest available block
        const block = this.freeBlocks.peek();

        if (!block || block.size < size) {
            return null; // Not enough memory
        }

        this.freeBlocks.extractMax();

        // Split block if larger than needed
        if (block.size > size) {
            this.addFreeBlock({
                address: block.address + size,
                size: block.size - size
            });
        }

        return { address: block.address, size };
    }

    deallocate(block: MemoryBlock): void {
        this.addFreeBlock(block);
        // In real implementation, would merge adjacent free blocks
    }
}
```

## When to Use Heaps

### Use Heaps When:
- ✅ You need a **priority queue** with efficient insert/extract
- ✅ Finding **K largest/smallest** elements
- ✅ **Streaming data** with running min/max/median
- ✅ **Merge operations** on sorted sequences
- ✅ **Scheduling tasks** by priority
- ✅ Implementing **graph algorithms** (Dijkstra, Prim)
- ✅ **Top-K problems** (frequent elements, closest points)

### Don't Use Heaps When:
- ❌ You need **arbitrary search** → use Hash Table or BST
- ❌ You need **sorted iteration** → use BST (in-order traversal)
- ❌ You need **FIFO** order → use Queue
- ❌ You need to **access middle elements** → not supported efficiently
- ❌ All elements have **equal priority** → use Queue

## Common Pitfalls and How to Avoid Them

### 1. Incorrect Index Calculations

```typescript
// ❌ Wrong: Forgetting 0-based indexing
function parent(i: number): number {
    return i / 2; // Wrong for 0-based!
}

// ✅ Correct: Use proper formula
function parent(i: number): number {
    return Math.floor((i - 1) / 2);
}
```

### 2. Not Maintaining Complete Binary Tree

```typescript
// ❌ Wrong: Inserting at arbitrary position
heap[5] = newValue; // Breaks completeness!

// ✅ Correct: Always insert at end and bubble up
heap.push(newValue);
bubbleUp(heap.length - 1);
```

### 3. Forgetting to Heapify After Extraction

```typescript
// ❌ Wrong: Removing root without heapifying
function extractMin(): number {
    const min = heap[0];
    heap.shift(); // Just shifts, doesn't maintain heap property!
    return min;
}

// ✅ Correct: Replace root with last element and bubble down
function extractMin(): number {
    const min = heap[0];
    heap[0] = heap.pop()!;
    bubbleDown(0);
    return min;
}
```

### 4. Using Heap for Operations It's Not Designed For

```typescript
// ❌ Wrong: Searching in heap (O(n))
function contains(value: number): boolean {
    for (const item of heap) {
        if (item === value) return true;
    }
    return false; // Inefficient!
}

// ✅ Correct: Use hash set alongside heap if you need lookup
const heapSet = new Set<number>();

function insert(value: number): void {
    heap.insert(value);
    heapSet.add(value);
}

function contains(value: number): boolean {
    return heapSet.has(value); // O(1)
}
```

### 5. Building Heap Inefficiently

```typescript
// ❌ Wrong: Inserting one by one (O(n log n))
function buildHeap(arr: number[]): MinHeap<number> {
    const heap = new MinHeap<number>();
    for (const num of arr) {
        heap.insert(num); // O(log n) per insert
    }
    return heap;
}

// ✅ Correct: Build from bottom up (O(n))
function buildHeap(arr: number[]): MinHeap<number> {
    return MinHeap.fromArray(arr); // O(n) heapify
}
```

## Summary

**Heaps** are powerful tree-based structures that excel at priority-based operations:

1. **Heap Property**: Parent-child ordering (min or max)
2. **Complete Binary Tree**: Efficient array representation
3. **Time Complexity**: O(log n) insert/extract, O(1) peek, O(n) build
4. **Priority Queues**: Natural implementation for priority-based processing
5. **Applications**: Task scheduling, graph algorithms, top-K problems, streaming data
6. **Key Advantage**: Efficient access to min/max with dynamic insertions

Heaps are essential for:
- Understanding priority queue implementation
- Optimizing algorithms that need frequent min/max access
- Solving top-K and streaming data problems
- Implementing efficient graph algorithms

**Remember**: Heaps are not for searching arbitrary elements or maintaining sorted order for iteration. Use BSTs for sorted iteration, Hash Tables for arbitrary lookups, and Heaps specifically for priority-based operations.

---

**Next**: Explore [Tries](../02-trees/tries.md) for efficient string operations, or review [Binary Search Trees](./bst.md) for ordered data structures.
