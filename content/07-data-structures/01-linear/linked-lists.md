# Linked Lists

> *"Pointers unlock dynamic structure."*

## What is a Linked List?

A **linked list** is a collection of nodes where each node contains **data and a pointer** to the next node. Unlike arrays, elements aren't stored contiguously—they're scattered in memory, connected by pointers.

```typescript
class ListNode<T> {
  data: T;
  next: ListNode<T> | null;
  
  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

// Creating a linked list: 1 → 2 → 3 → null
const head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);
```

## Why This Matters

Linked lists are important because:
- **O(1) insertion/deletion**: No shifting elements
- **Dynamic size**: Grows without reallocation
- **Flexible**: Can reorganize by changing pointers
- **Foundation**: Base for stacks, queues, graphs

## Time Complexity

| Operation | Linked List | Array |
|-----------|-------------|-------|
| Access by index | O(n) | O(1) |
| Search | O(n) | O(n) |
| Insert at beginning | O(1) | O(n) |
| Insert at end | O(n) or O(1)* | O(1) |
| Insert at position | O(n) | O(n) |
| Delete at beginning | O(1) | O(n) |
| Delete at end | O(n) | O(1) |
| Delete at position | O(n) | O(n) |

*O(1) if you maintain a tail pointer

## Types of Linked Lists

### Singly Linked List

```typescript
class SinglyLinkedList<T> {
  private head: ListNode<T> | null = null;
  private size: number = 0;
  
  // Add to beginning - O(1)
  prepend(data: T): void {
    const newNode = new ListNode(data);
    newNode.next = this.head;
    this.head = newNode;
    this.size++;
  }
  
  // Add to end - O(n)
  append(data: T): void {
    const newNode = new ListNode(data);
    
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    
    this.size++;
  }
  
  // Find - O(n)
  find(data: T): ListNode<T> | null {
    let current = this.head;
    
    while (current) {
      if (current.data === data) {
        return current;
      }
      current = current.next;
    }
    
    return null;
  }
  
  // Delete - O(n)
  delete(data: T): boolean {
    if (!this.head) return false;
    
    // Delete head
    if (this.head.data === data) {
      this.head = this.head.next;
      this.size--;
      return true;
    }
    
    let current = this.head;
    while (current.next) {
      if (current.next.data === data) {
        current.next = current.next.next;
        this.size--;
        return true;
      }
      current = current.next;
    }
    
    return false;
  }
  
  // Display
  print(): void {
    const values: T[] = [];
    let current = this.head;
    
    while (current) {
      values.push(current.data);
      current = current.next;
    }
    
    console.log(values.join(' → ') + ' → null');
  }
}
```

### Doubly Linked List

```typescript
class DoublyListNode<T> {
  data: T;
  next: DoublyListNode<T> | null;
  prev: DoublyListNode<T> | null;
  
  constructor(data: T) {
    this.data = data;
    this.next = null;
    this.prev = null;
  }
}

class DoublyLinkedList<T> {
  private head: DoublyListNode<T> | null = null;
  private tail: DoublyListNode<T> | null = null;
  private size: number = 0;
  
  // Add to end - O(1) with tail pointer
  append(data: T): void {
    const newNode = new DoublyListNode(data);
    
    if (!this.tail) {
      this.head = this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    
    this.size++;
  }
  
  // Add to beginning - O(1)
  prepend(data: T): void {
    const newNode = new DoublyListNode(data);
    
    if (!this.head) {
      this.head = this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    
    this.size++;
  }
  
  // Delete node - O(1) if you have reference to node
  deleteNode(node: DoublyListNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    
    this.size--;
  }
  
  // Iterate backwards
  printReverse(): void {
    const values: T[] = [];
    let current = this.tail;
    
    while (current) {
      values.push(current.data);
      current = current.prev;
    }
    
    console.log(values.join(' ← '));
  }
}
```

### Circular Linked List

```typescript
class CircularLinkedList<T> {
  private head: ListNode<T> | null = null;
  private size: number = 0;
  
  append(data: T): void {
    const newNode = new ListNode(data);
    
    if (!this.head) {
      this.head = newNode;
      newNode.next = newNode;  // Points to itself
    } else {
      let current = this.head;
      while (current.next !== this.head) {
        current = current.next!;
      }
      current.next = newNode;
      newNode.next = this.head;  // Complete the circle
    }
    
    this.size++;
  }
  
  // Josephus problem example
  static josephus(n: number, k: number): number {
    const list = new CircularLinkedList<number>();
    
    for (let i = 1; i <= n; i++) {
      list.append(i);
    }
    
    let current = list.head!;
    
    while (list.size > 1) {
      // Move k-1 steps
      for (let i = 0; i < k - 1; i++) {
        current = current.next!;
      }
      
      // Delete next node
      const toDelete = current.next!;
      current.next = toDelete.next;
      
      if (toDelete === list.head) {
        list.head = current.next;
      }
      
      list.size--;
      current = current.next!;
    }
    
    return list.head!.data;
  }
}
```

## Common Operations

### Reverse Linked List

```typescript
function reverse<T>(head: ListNode<T> | null): ListNode<T> | null {
  let prev: ListNode<T> | null = null;
  let current = head;
  
  while (current) {
    const next = current.next;
    current.next = prev;
    prev = current;
    current = next;
  }
  
  return prev;
}
```

### Detect Cycle (Floyd's Algorithm)

```typescript
function hasCycle<T>(head: ListNode<T> | null): boolean {
  let slow = head;
  let fast = head;
  
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    
    if (slow === fast) {
      return true;
    }
  }
  
  return false;
}
```

### Find Middle Element

```typescript
function findMiddle<T>(head: ListNode<T> | null): ListNode<T> | null {
  let slow = head;
  let fast = head;
  
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
  }
  
  return slow;
}
```

### Merge Two Sorted Lists

```typescript
function mergeSorted<T>(
  l1: ListNode<T> | null,
  l2: ListNode<T> | null
): ListNode<T> | null {
  const dummy = new ListNode(null as any);
  let current = dummy;
  
  while (l1 && l2) {
    if (l1.data < l2.data) {
      current.next = l1;
      l1 = l1.next;
    } else {
      current.next = l2;
      l2 = l2.next;
    }
    current = current.next;
  }
  
  current.next = l1 || l2;
  return dummy.next;
}
```

## When to Use Linked Lists

✅ **Use linked lists when:**
- Frequent insertions/deletions at beginning or middle
- Don't need random access
- Size changes frequently
- Implementing stacks, queues, or adjacency lists

❌ **Don't use linked lists when:**
- Need random access → Use array
- Memory overhead matters (pointers take space)
- Cache performance critical → Arrays are more cache-friendly

## Common Pitfalls

```typescript
// ❌ BAD: Losing reference to rest of list
let head = new ListNode(1);
head.next = new ListNode(2);
head = head.next;  // Lost reference to node 1!

// ✅ GOOD: Keep head reference
let current = head;
current = current.next;  // Traverse without losing head

// ❌ BAD: Not handling null
function traverse(head: ListNode<any> | null) {
  while (head.next) {  // Crashes if head is null!
    head = head.next;
  }
}

// ✅ GOOD: Check for null
function traverse(head: ListNode<any> | null) {
  while (head && head.next) {
    head = head.next;
  }
}
```

## The Mind-Shift

**Before**: Data must be contiguous  
**After**: Pointers enable dynamic, flexible structures

## Summary

**Linked Lists**:
- Nodes connected by pointers
- O(1) insertion/deletion at known positions
- O(n) access by index
- Types: Singly, doubly, circular
- Best for: Dynamic data, frequent modifications
- Trade-off: No random access, extra memory for pointers

**Key insight**: *Linked lists trade random access for insertion/deletion efficiency—when you need to frequently add/remove elements, pointers beat arrays.*

---

**Next**: [Stacks](../stacks.md)
