# Queues

> *"First In, First Out—like a line at a store."*

## What is a Queue?

A **queue** is a FIFO (First In, First Out) data structure where elements are added at the rear and removed from the front. Think of a line at a store—first person in line is first to be served.

```typescript
class Queue<T> {
  private items: T[] = [];
  
  enqueue(item: T): void {
    this.items.push(item);
  }
  
  dequeue(): T | undefined {
    return this.items.shift();
  }
  
  front(): T | undefined {
    return this.items[0];
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  size(): number {
    return this.items.length;
  }
}

// Usage
const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);
console.log(queue.dequeue());  // 1 (first in, first out)
console.log(queue.front());    // 2
```

## Why This Matters

Queues are fundamental because:
- **Fair ordering**: First-come, first-served
- **BFS traversal**: Level-order tree/graph traversal
- **Task scheduling**: Job queues, message queues
- **Buffering**: Streaming data, event loops

## Time Complexity

| Operation | Array Implementation | Linked List Implementation |
|-----------|---------------------|---------------------------|
| Enqueue | O(1) | O(1) |
| Dequeue | O(n) - shift() is slow | O(1) |
| Front/Peek | O(1) | O(1) |
| isEmpty | O(1) | O(1) |

## Implementation Variants

### Circular Queue (Array-Based)

```typescript
class CircularQueue<T> {
  private items: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private capacity: number;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.items = new Array(capacity);
  }
  
  enqueue(item: T): boolean {
    if (this.isFull()) {
      return false;
    }
    
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.count++;
    return true;
  }
  
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    
    const item = this.items[this.head];
    this.items[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }
  
  front(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }
  
  isEmpty(): boolean {
    return this.count === 0;
  }
  
  isFull(): boolean {
    return this.count === this.capacity;
  }
  
  size(): number {
    return this.count;
  }
}
```

### Linked Queue (Linked List-Based)

```typescript
class QueueNode<T> {
  constructor(
    public data: T,
    public next: QueueNode<T> | null = null
  ) {}
}

class LinkedQueue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private count: number = 0;
  
  enqueue(item: T): void {
    const newNode = new QueueNode(item);
    
    if (this.tail) {
      this.tail.next = newNode;
    }
    
    this.tail = newNode;
    
    if (!this.head) {
      this.head = newNode;
    }
    
    this.count++;
  }
  
  dequeue(): T | undefined {
    if (!this.head) {
      return undefined;
    }
    
    const data = this.head.data;
    this.head = this.head.next;
    
    if (!this.head) {
      this.tail = null;
    }
    
    this.count--;
    return data;
  }
  
  front(): T | undefined {
    return this.head?.data;
  }
  
  isEmpty(): boolean {
    return this.head === null;
  }
  
  size(): number {
    return this.count;
  }
}
```

## Real-World Applications

### 1. Task Queue

```typescript
interface Task {
  id: string;
  execute(): Promise<void>;
}

class TaskQueue {
  private queue = new Queue<Task>();
  private running = false;
  
  addTask(task: Task): void {
    this.queue.enqueue(task);
    if (!this.running) {
      this.processQueue();
    }
  }
  
  private async processQueue(): Promise<void> {
    this.running = true;
    
    while (!this.queue.isEmpty()) {
      const task = this.queue.dequeue()!;
      console.log(`Processing task ${task.id}`);
      await task.execute();
    }
    
    this.running = false;
  }
}

// Usage
const taskQueue = new TaskQueue();
taskQueue.addTask({
  id: '1',
  execute: async () => console.log('Task 1 done')
});
taskQueue.addTask({
  id: '2',
  execute: async () => console.log('Task 2 done')
});
```

### 2. BFS (Breadth-First Search)

```typescript
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null
  ) {}
}

function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  
  const result: number[][] = [];
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);
  
  while (!queue.isEmpty()) {
    const levelSize = queue.size();
    const currentLevel: number[] = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.dequeue()!;
      currentLevel.push(node.val);
      
      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
    }
    
    result.push(currentLevel);
  }
  
  return result;
}
```

### 3. Sliding Window Maximum

```typescript
class MonotonicQueue {
  private deque: number[] = [];
  
  push(val: number): void {
    // Remove smaller elements from back
    while (this.deque.length > 0 && 
           this.deque[this.deque.length - 1] < val) {
      this.deque.pop();
    }
    this.deque.push(val);
  }
  
  pop(val: number): void {
    // Remove from front if it matches
    if (this.deque.length > 0 && this.deque[0] === val) {
      this.deque.shift();
    }
  }
  
  max(): number {
    return this.deque[0];
  }
}

function maxSlidingWindow(nums: number[], k: number): number[] {
  const result: number[] = [];
  const window = new MonotonicQueue();
  
  for (let i = 0; i < nums.length; i++) {
    window.push(nums[i]);
    
    if (i >= k - 1) {
      result.push(window.max());
      window.pop(nums[i - k + 1]);
    }
  }
  
  return result;
}
```

### 4. Rate Limiter

```typescript
class RateLimiter {
  private queue = new Queue<number>();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  allowRequest(): boolean {
    const now = Date.now();
    
    // Remove old timestamps
    while (!this.queue.isEmpty() && 
           now - this.queue.front()! > this.windowMs) {
      this.queue.dequeue();
    }
    
    if (this.queue.size() < this.maxRequests) {
      this.queue.enqueue(now);
      return true;
    }
    
    return false;
  }
}

// Allow 5 requests per second
const limiter = new RateLimiter(5, 1000);
```

### 5. Print Server Queue

```typescript
interface PrintJob {
  id: string;
  document: string;
  pages: number;
}

class PrinterQueue {
  private queue = new Queue<PrintJob>();
  
  submitJob(job: PrintJob): void {
    this.queue.enqueue(job);
    console.log(`Job ${job.id} queued (${job.pages} pages)`);
  }
  
  processNext(): void {
    if (this.queue.isEmpty()) {
      console.log('No jobs in queue');
      return;
    }
    
    const job = this.queue.dequeue()!;
    console.log(`Printing: ${job.document} (${job.pages} pages)`);
    console.log(`Jobs remaining: ${this.queue.size()}`);
  }
  
  processAll(): void {
    while (!this.queue.isEmpty()) {
      this.processNext();
    }
  }
}
```

## Priority Queue

```typescript
class PriorityQueue<T> {
  private items: Array<{ element: T; priority: number }> = [];
  
  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;
    
    for (let i = 0; i < this.items.length; i++) {
      if (item.priority < this.items[i].priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }
    
    if (!added) {
      this.items.push(item);
    }
  }
  
  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }
  
  front(): T | undefined {
    return this.items[0]?.element;
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// Usage
const pq = new PriorityQueue<string>();
pq.enqueue('Low priority', 5);
pq.enqueue('High priority', 1);
pq.enqueue('Medium priority', 3);

console.log(pq.dequeue());  // "High priority"
console.log(pq.dequeue());  // "Medium priority"
console.log(pq.dequeue());  // "Low priority"
```

## Deque (Double-Ended Queue)

```typescript
class Deque<T> {
  private items: T[] = [];
  
  addFront(item: T): void {
    this.items.unshift(item);
  }
  
  addRear(item: T): void {
    this.items.push(item);
  }
  
  removeFront(): T | undefined {
    return this.items.shift();
  }
  
  removeRear(): T | undefined {
    return this.items.pop();
  }
  
  front(): T | undefined {
    return this.items[0];
  }
  
  rear(): T | undefined {
    return this.items[this.items.length - 1];
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
```

## When to Use Queues

✅ **Use queues when:**
- FIFO ordering needed
- BFS traversal
- Task scheduling
- Event handling
- Message passing

❌ **Don't use queues when:**
- Need LIFO behavior → Use stack
- Need random access → Use array
- Need priority ordering → Use priority queue/heap

## Common Pitfalls

```typescript
// ❌ BAD: Using array shift() for queue (O(n))
class SlowQueue<T> {
  private items: T[] = [];
  
  dequeue() {
    return this.items.shift();  // O(n) - slow!
  }
}

// ✅ GOOD: Use circular queue or linked list (O(1))
class FastQueue<T> {
  private head = 0;
  private tail = 0;
  private items: T[] = [];
  
  dequeue() {
    if (this.head === this.tail) return undefined;
    return this.items[this.head++];  // O(1)
  }
}
```

## The Mind-Shift

**Before**: Process things randomly  
**After**: FIFO ordering ensures fairness and breadth-first exploration

## Summary

**Queues**:
- FIFO (First In, First Out)
- O(1) enqueue and dequeue (with proper implementation)
- Used for: BFS, task scheduling, buffering
- Variants: Circular queue, priority queue, deque
- Essential for fair ordering and level-by-level processing

**Key insight**: *Queues embody fairness—when you need to process things in the order they arrive or explore level-by-level, queues are the answer.*

---

**Next**: [Binary Trees](../../02-trees/binary-trees.md)
