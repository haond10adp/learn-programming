# Binary Search Trees (BST)

## What is a Binary Search Tree?

A **Binary Search Tree (BST)** is a binary tree with a specific ordering property: for every node, all values in its left subtree are smaller than the node's value, and all values in its right subtree are greater than the node's value. This property enables efficient searching, insertion, and deletion operations.

### BST Property
For every node in the tree:
- All nodes in the **left subtree** have values **< node.value**
- All nodes in the **right subtree** have values **> node.value**
- Both left and right subtrees are also BSTs (recursive property)

```
        8
       / \
      3   10
     / \    \
    1   6    14
       / \   /
      4   7 13

Valid BST: 1 < 3 < 4 < 6 < 7 < 8 < 10 < 13 < 14
```

## Why Binary Search Trees Matter

BSTs are fundamental because they:

1. **Enable Efficient Search**: O(log n) average case vs O(n) for unsorted arrays
2. **Maintain Sorted Order**: In-order traversal yields sorted sequence
3. **Support Dynamic Operations**: Efficient insertion and deletion while maintaining order
4. **Foundation for Advanced Structures**: AVL trees, Red-Black trees, B-trees build on BST concepts
5. **Database Indexing**: Many database indexes use BST variants
6. **Symbol Tables**: Compiler symbol tables often use BSTs

## Time Complexity

### Balanced BST
| Operation | Average Case | Best Case | Worst Case |
|-----------|-------------|-----------|------------|
| Search    | O(log n)    | O(1)      | O(log n)   |
| Insert    | O(log n)    | O(1)      | O(log n)   |
| Delete    | O(log n)    | O(1)      | O(log n)   |
| Min/Max   | O(log n)    | O(1)      | O(log n)   |
| Traversal | O(n)        | O(n)      | O(n)       |

### Unbalanced BST (Degenerates to Linked List)
| Operation | Worst Case |
|-----------|------------|
| Search    | O(n)       |
| Insert    | O(n)       |
| Delete    | O(n)       |

**Space Complexity**: O(n) to store n nodes, O(h) for recursive call stack where h is height.

## Basic BST Implementation

### Node Structure

```typescript
class BSTNode<T> {
    value: T;
    left: BSTNode<T> | null;
    right: BSTNode<T> | null;

    constructor(value: T) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}
```

### BST Class with Core Operations

```typescript
class BinarySearchTree<T> {
    root: BSTNode<T> | null;

    constructor() {
        this.root = null;
    }

    // Insert a value
    insert(value: T): void {
        this.root = this.insertNode(this.root, value);
    }

    private insertNode(node: BSTNode<T> | null, value: T): BSTNode<T> {
        // Base case: found the position
        if (node === null) {
            return new BSTNode(value);
        }

        // Recursive case: traverse to find position
        if (value < node.value) {
            node.left = this.insertNode(node.left, value);
        } else if (value > node.value) {
            node.right = this.insertNode(node.right, value);
        }
        // If value === node.value, we don't insert duplicates

        return node;
    }

    // Search for a value
    search(value: T): boolean {
        return this.searchNode(this.root, value);
    }

    private searchNode(node: BSTNode<T> | null, value: T): boolean {
        if (node === null) {
            return false;
        }

        if (value === node.value) {
            return true;
        }

        if (value < node.value) {
            return this.searchNode(node.left, value);
        } else {
            return this.searchNode(node.right, value);
        }
    }

    // Find minimum value
    findMin(): T | null {
        if (this.root === null) return null;
        return this.findMinNode(this.root).value;
    }

    private findMinNode(node: BSTNode<T>): BSTNode<T> {
        while (node.left !== null) {
            node = node.left;
        }
        return node;
    }

    // Find maximum value
    findMax(): T | null {
        if (this.root === null) return null;
        
        let current = this.root;
        while (current.right !== null) {
            current = current.right;
        }
        return current.value;
    }

    // Delete a value
    delete(value: T): void {
        this.root = this.deleteNode(this.root, value);
    }

    private deleteNode(node: BSTNode<T> | null, value: T): BSTNode<T> | null {
        if (node === null) {
            return null;
        }

        if (value < node.value) {
            node.left = this.deleteNode(node.left, value);
            return node;
        } else if (value > node.value) {
            node.right = this.deleteNode(node.right, value);
            return node;
        }

        // Found the node to delete
        
        // Case 1: Node has no children (leaf node)
        if (node.left === null && node.right === null) {
            return null;
        }

        // Case 2: Node has one child
        if (node.left === null) {
            return node.right;
        }
        if (node.right === null) {
            return node.left;
        }

        // Case 3: Node has two children
        // Find in-order successor (minimum in right subtree)
        const successor = this.findMinNode(node.right);
        node.value = successor.value;
        node.right = this.deleteNode(node.right, successor.value);
        return node;
    }

    // In-order traversal (returns sorted array)
    inOrder(): T[] {
        const result: T[] = [];
        this.inOrderTraversal(this.root, result);
        return result;
    }

    private inOrderTraversal(node: BSTNode<T> | null, result: T[]): void {
        if (node === null) return;
        
        this.inOrderTraversal(node.left, result);
        result.push(node.value);
        this.inOrderTraversal(node.right, result);
    }
}
```

### Usage Example

```typescript
const bst = new BinarySearchTree<number>();

// Insert values
bst.insert(8);
bst.insert(3);
bst.insert(10);
bst.insert(1);
bst.insert(6);
bst.insert(14);
bst.insert(4);
bst.insert(7);
bst.insert(13);

// Search
console.log(bst.search(6));    // true
console.log(bst.search(15));   // false

// Find min/max
console.log(bst.findMin());    // 1
console.log(bst.findMax());    // 14

// Get sorted array
console.log(bst.inOrder());    // [1, 3, 4, 6, 7, 8, 10, 13, 14]

// Delete
bst.delete(3);
console.log(bst.inOrder());    // [1, 4, 6, 7, 8, 10, 13, 14]
```

## Advanced BST Operations

### Height Calculation

```typescript
class BinarySearchTree<T> {
    // ... previous methods ...

    height(): number {
        return this.calculateHeight(this.root);
    }

    private calculateHeight(node: BSTNode<T> | null): number {
        if (node === null) return -1;

        const leftHeight = this.calculateHeight(node.left);
        const rightHeight = this.calculateHeight(node.right);

        return Math.max(leftHeight, rightHeight) + 1;
    }
}
```

### Validate BST

```typescript
class BinarySearchTree<T> {
    // ... previous methods ...

    isValidBST(): boolean {
        return this.validateBST(this.root, null, null);
    }

    private validateBST(
        node: BSTNode<T> | null,
        min: T | null,
        max: T | null
    ): boolean {
        if (node === null) return true;

        // Check if current value violates constraints
        if (min !== null && node.value <= min) return false;
        if (max !== null && node.value >= max) return false;

        // Recursively validate subtrees with updated constraints
        return (
            this.validateBST(node.left, min, node.value) &&
            this.validateBST(node.right, node.value, max)
        );
    }
}
```

### Kth Smallest Element

```typescript
class BinarySearchTree<T> {
    // ... previous methods ...

    kthSmallest(k: number): T | null {
        const result = { count: 0, value: null as T | null };
        this.findKthSmallest(this.root, k, result);
        return result.value;
    }

    private findKthSmallest(
        node: BSTNode<T> | null,
        k: number,
        result: { count: number; value: T | null }
    ): void {
        if (node === null || result.count >= k) return;

        // In-order traversal
        this.findKthSmallest(node.left, k, result);

        result.count++;
        if (result.count === k) {
            result.value = node.value;
            return;
        }

        this.findKthSmallest(node.right, k, result);
    }
}
```

### Range Query

```typescript
class BinarySearchTree<T> {
    // ... previous methods ...

    rangeQuery(min: T, max: T): T[] {
        const result: T[] = [];
        this.rangeSearch(this.root, min, max, result);
        return result;
    }

    private rangeSearch(
        node: BSTNode<T> | null,
        min: T,
        max: T,
        result: T[]
    ): void {
        if (node === null) return;

        // If current value is greater than min, explore left
        if (node.value > min) {
            this.rangeSearch(node.left, min, max, result);
        }

        // If current value is in range, add it
        if (node.value >= min && node.value <= max) {
            result.push(node.value);
        }

        // If current value is less than max, explore right
        if (node.value < max) {
            this.rangeSearch(node.right, min, max, result);
        }
    }
}
```

### Lowest Common Ancestor (LCA)

```typescript
class BinarySearchTree<T> {
    // ... previous methods ...

    lowestCommonAncestor(val1: T, val2: T): T | null {
        const node = this.findLCA(this.root, val1, val2);
        return node ? node.value : null;
    }

    private findLCA(
        node: BSTNode<T> | null,
        val1: T,
        val2: T
    ): BSTNode<T> | null {
        if (node === null) return null;

        // Both values are in left subtree
        if (val1 < node.value && val2 < node.value) {
            return this.findLCA(node.left, val1, val2);
        }

        // Both values are in right subtree
        if (val1 > node.value && val2 > node.value) {
            return this.findLCA(node.right, val1, val2);
        }

        // Values are on different sides (or one equals current node)
        return node;
    }
}
```

## Building BST from Array

### From Sorted Array (Balanced)

```typescript
function sortedArrayToBST<T>(arr: T[]): BinarySearchTree<T> {
    const bst = new BinarySearchTree<T>();
    bst.root = buildBalancedBST(arr, 0, arr.length - 1);
    return bst;
}

function buildBalancedBST<T>(
    arr: T[],
    start: number,
    end: number
): BSTNode<T> | null {
    if (start > end) return null;

    const mid = Math.floor((start + end) / 2);
    const node = new BSTNode(arr[mid]);

    node.left = buildBalancedBST(arr, start, mid - 1);
    node.right = buildBalancedBST(arr, mid + 1, end);

    return node;
}

// Usage
const sortedArray = [1, 3, 4, 6, 7, 8, 10, 13, 14];
const balancedBST = sortedArrayToBST(sortedArray);
```

### From Pre-order Traversal

```typescript
function bstFromPreorder<T>(preorder: T[]): BinarySearchTree<T> {
    const bst = new BinarySearchTree<T>();
    if (preorder.length === 0) return bst;

    bst.root = buildFromPreorder(preorder, 0, preorder.length - 1);
    return bst;
}

function buildFromPreorder<T>(
    preorder: T[],
    start: number,
    end: number
): BSTNode<T> | null {
    if (start > end) return null;

    const node = new BSTNode(preorder[start]);

    // Find first element greater than root
    let rightStart = start + 1;
    while (rightStart <= end && preorder[rightStart] < preorder[start]) {
        rightStart++;
    }

    node.left = buildFromPreorder(preorder, start + 1, rightStart - 1);
    node.right = buildFromPreorder(preorder, rightStart, end);

    return node;
}
```

## BST Iterator

```typescript
class BSTIterator<T> {
    private stack: BSTNode<T>[];

    constructor(root: BSTNode<T> | null) {
        this.stack = [];
        this.pushLeft(root);
    }

    private pushLeft(node: BSTNode<T> | null): void {
        while (node !== null) {
            this.stack.push(node);
            node = node.left;
        }
    }

    hasNext(): boolean {
        return this.stack.length > 0;
    }

    next(): T {
        const node = this.stack.pop()!;
        this.pushLeft(node.right);
        return node.value;
    }
}

// Usage
const bst = new BinarySearchTree<number>();
bst.insert(8);
bst.insert(3);
bst.insert(10);
bst.insert(1);
bst.insert(6);

const iterator = new BSTIterator(bst.root);
while (iterator.hasNext()) {
    console.log(iterator.next());
}
// Output: 1, 3, 6, 8, 10 (in-order)
```

## Balancing: Introduction to Self-Balancing Trees

While basic BSTs can degenerate to O(n) operations, **self-balancing BSTs** maintain O(log n) performance by automatically rebalancing during insertions and deletions.

### Common Self-Balancing BST Types

1. **AVL Trees**: Strict balancing, height difference ≤ 1
2. **Red-Black Trees**: Relaxed balancing, color-based rules
3. **Splay Trees**: Self-adjusting, recently accessed nodes move to root
4. **B-Trees**: Generalization for disk storage, used in databases

### AVL Tree Rotations

```typescript
class AVLNode<T> extends BSTNode<T> {
    height: number;

    constructor(value: T) {
        super(value);
        this.height = 1;
    }
}

class AVLTree<T> {
    root: AVLNode<T> | null;

    constructor() {
        this.root = null;
    }

    private getHeight(node: AVLNode<T> | null): number {
        return node ? node.height : 0;
    }

    private getBalance(node: AVLNode<T> | null): number {
        return node ? this.getHeight(node.left as AVLNode<T>) - this.getHeight(node.right as AVLNode<T>) : 0;
    }

    private updateHeight(node: AVLNode<T>): void {
        node.height = Math.max(
            this.getHeight(node.left as AVLNode<T>),
            this.getHeight(node.right as AVLNode<T>)
        ) + 1;
    }

    // Right rotation
    private rotateRight(y: AVLNode<T>): AVLNode<T> {
        const x = y.left as AVLNode<T>;
        const T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        this.updateHeight(y);
        this.updateHeight(x);

        return x;
    }

    // Left rotation
    private rotateLeft(x: AVLNode<T>): AVLNode<T> {
        const y = x.right as AVLNode<T>;
        const T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        this.updateHeight(x);
        this.updateHeight(y);

        return y;
    }

    insert(value: T): void {
        this.root = this.insertNode(this.root, value);
    }

    private insertNode(node: AVLNode<T> | null, value: T): AVLNode<T> {
        // Standard BST insertion
        if (node === null) {
            return new AVLNode(value);
        }

        if (value < node.value) {
            node.left = this.insertNode(node.left as AVLNode<T>, value);
        } else if (value > node.value) {
            node.right = this.insertNode(node.right as AVLNode<T>, value);
        } else {
            return node; // Duplicate values not allowed
        }

        // Update height
        this.updateHeight(node);

        // Get balance factor
        const balance = this.getBalance(node);

        // Left-Left case
        if (balance > 1 && value < (node.left as AVLNode<T>).value) {
            return this.rotateRight(node);
        }

        // Right-Right case
        if (balance < -1 && value > (node.right as AVLNode<T>).value) {
            return this.rotateLeft(node);
        }

        // Left-Right case
        if (balance > 1 && value > (node.left as AVLNode<T>).value) {
            node.left = this.rotateLeft(node.left as AVLNode<T>);
            return this.rotateRight(node);
        }

        // Right-Left case
        if (balance < -1 && value < (node.right as AVLNode<T>).value) {
            node.right = this.rotateRight(node.right as AVLNode<T>);
            return this.rotateLeft(node);
        }

        return node;
    }
}
```

## Real-World Applications

### 1. Database Indexing

```typescript
// Simplified database index using BST
class DatabaseIndex<K, V> {
    private bst: BinarySearchTree<{ key: K; value: V }>;

    constructor() {
        this.bst = new BinarySearchTree();
    }

    insert(key: K, value: V): void {
        this.bst.insert({ key, value });
    }

    find(key: K): V | null {
        // In real implementation, would use custom comparator
        // This is simplified
        return null; // Implementation detail omitted
    }

    rangeQuery(minKey: K, maxKey: K): V[] {
        // Return all values with keys in range [minKey, maxKey]
        return []; // Implementation detail omitted
    }
}
```

### 2. Auto-Complete System

```typescript
class AutoComplete {
    private suggestions: BinarySearchTree<string>;

    constructor() {
        this.suggestions = new BinarySearchTree();
    }

    addWord(word: string): void {
        this.suggestions.insert(word.toLowerCase());
    }

    getSuggestions(prefix: string): string[] {
        // Get all words in range [prefix, prefix + 'zzz')
        const lowerPrefix = prefix.toLowerCase();
        const upperBound = lowerPrefix + '\uffff'; // Unicode max char
        
        return this.suggestions.rangeQuery(lowerPrefix, upperBound);
    }
}

// Usage
const autocomplete = new AutoComplete();
autocomplete.addWord("apple");
autocomplete.addWord("application");
autocomplete.addWord("apply");
autocomplete.addWord("banana");

console.log(autocomplete.getSuggestions("app"));
// ["apple", "application", "apply"]
```

### 3. File System Directory Structure

```typescript
interface FileNode {
    name: string;
    isDirectory: boolean;
    size: number;
}

class FileSystem {
    private tree: BinarySearchTree<FileNode>;

    constructor() {
        this.tree = new BinarySearchTree();
    }

    addFile(name: string, size: number): void {
        this.tree.insert({ name, isDirectory: false, size });
    }

    addDirectory(name: string): void {
        this.tree.insert({ name, isDirectory: true, size: 0 });
    }

    findFile(name: string): FileNode | null {
        // Implementation would search for file by name
        return null;
    }

    listFilesInRange(startName: string, endName: string): FileNode[] {
        // List all files/directories in alphabetical range
        return [];
    }
}
```

### 4. Event Scheduling System

```typescript
interface Event {
    time: number;
    name: string;
    priority: number;
}

class EventScheduler {
    private events: BinarySearchTree<Event>;

    constructor() {
        this.events = new BinarySearchTree();
    }

    scheduleEvent(time: number, name: string, priority: number): void {
        this.events.insert({ time, name, priority });
    }

    getNextEvent(): Event | null {
        // Get event with minimum time
        return this.events.findMin();
    }

    getEventsInTimeRange(start: number, end: number): Event[] {
        return this.events.rangeQuery(
            { time: start, name: '', priority: 0 },
            { time: end, name: '\uffff', priority: Infinity }
        );
    }

    cancelNextEvent(): void {
        const next = this.events.findMin();
        if (next) {
            this.events.delete(next);
        }
    }
}
```

## When to Use BST

### Use BST When:
- ✅ You need **sorted data** with efficient insertions/deletions
- ✅ You need **range queries** (find all elements between x and y)
- ✅ You need to **maintain order** while data changes dynamically
- ✅ You need **O(log n) search** with dynamic data (vs sorted array with O(n) insertion)
- ✅ You need **predecessor/successor** operations
- ✅ Implementing **priority queues** with changing priorities

### Don't Use BST When:
- ❌ You only need **basic lookup** → use Hash Table for O(1)
- ❌ Data is **static/rarely changes** → use sorted array with binary search
- ❌ You need **FIFO/LIFO** → use Queue/Stack
- ❌ You can't **guarantee balancing** → performance degrades to O(n)
- ❌ Memory is **extremely limited** → array-based structures have less overhead

## Common Pitfalls and How to Avoid Them

### 1. Forgetting to Handle Null Nodes

```typescript
// ❌ Wrong: Assumes node exists
function search(node: BSTNode<number>, value: number): boolean {
    if (node.value === value) return true; // Crashes if node is null!
    // ...
}

// ✅ Correct: Always check for null first
function search(node: BSTNode<number> | null, value: number): boolean {
    if (node === null) return false;
    if (node.value === value) return true;
    // ...
}
```

### 2. Incorrect Deletion Implementation

```typescript
// ❌ Wrong: Doesn't handle two-child case properly
function deleteNode(node: BSTNode<number> | null, value: number): BSTNode<number> | null {
    // ... find node ...
    
    // Wrong: just removes node without fixing tree structure
    if (node.left && node.right) {
        return null; // Loses subtrees!
    }
}

// ✅ Correct: Use in-order successor
function deleteNode(node: BSTNode<number> | null, value: number): BSTNode<number> | null {
    // ... find node ...
    
    if (node.left && node.right) {
        const successor = findMin(node.right);
        node.value = successor.value;
        node.right = deleteNode(node.right, successor.value);
        return node;
    }
}
```

### 3. Not Maintaining BST Property

```typescript
// ❌ Wrong: Allows duplicates or incorrect ordering
bst.root.left = new BSTNode(15); // Manually setting breaks BST property

// ✅ Correct: Always use insert method
bst.insert(15); // Maintains BST property
```

### 4. Ignoring Tree Balance

```typescript
// ❌ Wrong: Inserting sorted data creates skewed tree
const bst = new BinarySearchTree<number>();
for (let i = 1; i <= 1000; i++) {
    bst.insert(i); // Creates linked list: O(n) operations!
}

// ✅ Correct: Use balanced BST or insert from middle
const sorted = Array.from({ length: 1000 }, (_, i) => i + 1);
const balancedBST = sortedArrayToBST(sorted); // O(log n) operations

// Or use AVL/Red-Black tree for automatic balancing
const avl = new AVLTree<number>();
for (let i = 1; i <= 1000; i++) {
    avl.insert(i); // Automatically stays balanced
}
```

### 5. Inefficient Range Queries

```typescript
// ❌ Wrong: Traverses entire tree
function rangeQuery(node: BSTNode<number> | null, min: number, max: number): number[] {
    if (node === null) return [];
    
    // Always traverses both subtrees
    return [
        ...rangeQuery(node.left, min, max),
        node.value >= min && node.value <= max ? node.value : null,
        ...rangeQuery(node.right, min, max)
    ].filter(v => v !== null) as number[];
}

// ✅ Correct: Prune branches outside range
function rangeQuery(node: BSTNode<number> | null, min: number, max: number): number[] {
    if (node === null) return [];
    
    const result: number[] = [];
    
    // Only go left if there might be values >= min
    if (node.value > min) {
        result.push(...rangeQuery(node.left, min, max));
    }
    
    // Add current if in range
    if (node.value >= min && node.value <= max) {
        result.push(node.value);
    }
    
    // Only go right if there might be values <= max
    if (node.value < max) {
        result.push(...rangeQuery(node.right, min, max));
    }
    
    return result;
}
```

## Summary

**Binary Search Trees** provide an elegant solution for maintaining sorted, dynamic data with efficient operations:

1. **BST Property**: Left < Node < Right (recursive)
2. **Time Complexity**: O(log n) for balanced trees, O(n) worst case for skewed
3. **Core Operations**: Insert, Delete, Search, Min/Max, Range Query
4. **Balancing**: Self-balancing variants (AVL, Red-Black) guarantee O(log n)
5. **Applications**: Database indexes, auto-complete, file systems, schedulers
6. **Key Advantage**: Maintains sorted order with dynamic efficient operations

BSTs are fundamental to computer science—understanding them is essential for:
- Recognizing when to use ordered data structures
- Appreciating the importance of tree balancing
- Understanding more complex structures (B-trees, tries)
- Optimizing search-heavy applications

**Remember**: Always consider whether your BST will remain balanced. For production code with arbitrary insertions, use self-balancing variants like AVL or Red-Black trees, or consider alternative structures like Hash Tables (for unordered data) or sorted arrays (for static data).

---

**Next**: Explore [Heaps](../02-trees/heaps.md) for efficient priority queue operations, or review [Binary Trees](./binary-trees.md) for tree fundamentals.
