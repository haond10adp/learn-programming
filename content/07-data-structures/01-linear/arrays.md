# Arrays

> *"The array is the most fundamental data structure."*

## What is an Array?

An **array** is a contiguous block of memory storing elements of the same type, accessible by index in **O(1) time**. It's the foundation of all data structures—simple, fast, and ubiquitous.

```typescript
// Fixed-size array
const numbers: number[] = [1, 2, 3, 4, 5];
console.log(numbers[2]);  // 3 - O(1) access

// Dynamic array (JavaScript/TypeScript)
const dynamic: number[] = [];
dynamic.push(1);  // [1]
dynamic.push(2);  // [1, 2]
```

## Why This Matters

Arrays provide:
- **O(1) random access**: Instant lookup by index
- **Cache-friendly**: Contiguous memory improves performance
- **Simple**: Easy to understand and use
- **Foundation**: Basis for many other structures

## Time Complexity

| Operation | Time Complexity |
|-----------|----------------|
| Access | O(1) |
| Search | O(n) |
| Insert (end) | O(1) amortized |
| Insert (middle) | O(n) |
| Delete (end) | O(1) |
| Delete (middle) | O(n) |

## Basic Operations

### Creation and Access

```typescript
// Create array
const arr: number[] = [10, 20, 30, 40, 50];

// Access - O(1)
console.log(arr[0]);  // 10
console.log(arr[4]);  // 50

// Modify - O(1)
arr[2] = 99;
console.log(arr);  // [10, 20, 99, 40, 50]

// Length
console.log(arr.length);  // 5
```

### Insertion

```typescript
// Insert at end - O(1) amortized
arr.push(60);  // [10, 20, 99, 40, 50, 60]

// Insert at beginning - O(n)
arr.unshift(0);  // [0, 10, 20, 99, 40, 50, 60]

// Insert at index - O(n)
arr.splice(3, 0, 25);  // [0, 10, 20, 25, 99, 40, 50, 60]
//         index, delete count, items to insert
```

### Deletion

```typescript
// Remove from end - O(1)
const last = arr.pop();  // 60

// Remove from beginning - O(n)
const first = arr.shift();  // 0

// Remove at index - O(n)
const removed = arr.splice(2, 1);  // Removes element at index 2
```

### Searching

```typescript
// Linear search - O(n)
const index = arr.indexOf(40);
console.log(index);  // 5 (or -1 if not found)

// Check existence - O(n)
const exists = arr.includes(99);
console.log(exists);  // true

// Find with condition - O(n)
const found = arr.find(x => x > 50);
console.log(found);  // 99
```

## Common Patterns

### Two Pointers

```typescript
// Reverse array in-place
function reverse<T>(arr: T[]): void {
  let left = 0;
  let right = arr.length - 1;
  
  while (left < right) {
    [arr[left], arr[right]] = [arr[right], arr[left]];
    left++;
    right--;
  }
}

const nums = [1, 2, 3, 4, 5];
reverse(nums);
console.log(nums);  // [5, 4, 3, 2, 1]
```

### Sliding Window

```typescript
// Maximum sum of k consecutive elements
function maxSum(arr: number[], k: number): number {
  let maxSum = 0;
  let windowSum = 0;
  
  // First window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  maxSum = windowSum;
  
  // Slide window
  for (let i = k; i < arr.length; i++) {
    windowSum = windowSum - arr[i - k] + arr[i];
    maxSum = Math.max(maxSum, windowSum);
  }
  
  return maxSum;
}

console.log(maxSum([1, 4, 2, 10, 23, 3, 1, 0, 20], 4));  // 39
```

### Kadane's Algorithm (Maximum Subarray)

```typescript
function maxSubArray(arr: number[]): number {
  let maxSoFar = arr[0];
  let maxEndingHere = arr[0];
  
  for (let i = 1; i < arr.length; i++) {
    maxEndingHere = Math.max(arr[i], maxEndingHere + arr[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }
  
  return maxSoFar;
}

console.log(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]));  // 6
```

### Remove Duplicates

```typescript
// Remove duplicates from sorted array
function removeDuplicates(arr: number[]): number {
  if (arr.length === 0) return 0;
  
  let i = 0;
  for (let j = 1; j < arr.length; j++) {
    if (arr[j] !== arr[i]) {
      i++;
      arr[i] = arr[j];
    }
  }
  
  return i + 1;  // New length
}

const sorted = [1, 1, 2, 2, 2, 3, 4, 4, 5];
const newLength = removeDuplicates(sorted);
console.log(sorted.slice(0, newLength));  // [1, 2, 3, 4, 5]
```

## Real-World Use Cases

### Dynamic Array Implementation

```typescript
class DynamicArray<T> {
  private items: T[] = [];
  private capacity: number = 4;
  private size: number = 0;
  
  push(item: T): void {
    if (this.size === this.capacity) {
      this.resize();
    }
    this.items[this.size++] = item;
  }
  
  pop(): T | undefined {
    if (this.size === 0) return undefined;
    return this.items[--this.size];
  }
  
  get(index: number): T {
    if (index < 0 || index >= this.size) {
      throw new Error('Index out of bounds');
    }
    return this.items[index];
  }
  
  private resize(): void {
    this.capacity *= 2;
    const newItems: T[] = new Array(this.capacity);
    for (let i = 0; i < this.size; i++) {
      newItems[i] = this.items[i];
    }
    this.items = newItems;
  }
  
  getSize(): number {
    return this.size;
  }
}
```

### Circular Buffer

```typescript
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  enqueue(item: T): boolean {
    if (this.isFull()) return false;
    
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
    return true;
  }
  
  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    
    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return item;
  }
  
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  isFull(): boolean {
    return this.size === this.capacity;
  }
}
```

## Common Pitfalls

### Off-by-One Errors

```typescript
// ❌ BAD: Loop goes too far
for (let i = 0; i <= arr.length; i++) {
  console.log(arr[i]);  // Undefined on last iteration!
}

// ✅ GOOD: Correct boundary
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
```

### Modifying While Iterating

```typescript
// ❌ BAD: Removing while iterating forward
for (let i = 0; i < arr.length; i++) {
  if (arr[i] % 2 === 0) {
    arr.splice(i, 1);  // Skips next element!
  }
}

// ✅ GOOD: Iterate backward when removing
for (let i = arr.length - 1; i >= 0; i--) {
  if (arr[i] % 2 === 0) {
    arr.splice(i, 1);
  }
}

// ✅ BETTER: Filter
const filtered = arr.filter(x => x % 2 !== 0);
```

### Copying References

```typescript
// ❌ BAD: Shallow copy with objects
const original = [{id: 1}, {id: 2}];
const copy = original;
copy[0].id = 99;
console.log(original[0].id);  // 99 - modified!

// ✅ GOOD: Deep copy
const deepCopy = original.map(obj => ({...obj}));
```

## When to Use Arrays

✅ **Use arrays when:**
- Need O(1) random access by index
- Mostly reading, not inserting/deleting
- Know size in advance or size grows at end
- Need cache-friendly data structure

❌ **Don't use arrays when:**
- Frequent insertions/deletions in middle
- Need O(1) insertion at beginning
- Size changes dramatically (use linked list)

## The Mind-Shift

**Before**: Just use arrays for everything  
**After**: Understand array strengths (O(1) access) and weaknesses (O(n) insertion)

## Summary

**Arrays**:
- Contiguous memory, O(1) access by index
- O(n) for insertion/deletion in middle
- Cache-friendly, simple, foundational
- Perfect for random access, problematic for frequent middle operations
- TypeScript arrays are dynamic (auto-resize)

**Key insight**: *Arrays excel at random access—when you need to look up elements by index quickly, arrays are unbeatable.*

---

**Next**: [Linked Lists](../linked-lists.md)
