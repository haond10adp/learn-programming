# Binary Trees

> *"Hierarchical organization through parent-child relationships."*

## What is a Binary Tree?

A **binary tree** is a hierarchical data structure where each node has **at most two children** (left and right). It's the foundation for many advanced data structures and algorithms.

```typescript
class TreeNode<T> {
  constructor(
    public val: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null
  ) {}
}

// Example tree:
//       1
//      / \
//     2   3
//    / \
//   4   5

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.right = new TreeNode(3);
root.left.left = new TreeNode(4);
root.left.right = new TreeNode(5);
```

## Why This Matters

Binary trees are fundamental because:
- **Hierarchical relationships**: Naturally model parent-child structures
- **Logarithmic operations**: Balanced trees give O(log n) operations
- **Traversal patterns**: Three fundamental ways to explore (in/pre/post-order)
- **Foundation**: Base for BST, heaps, tries, expression trees

## Tree Terminology

- **Root**: Top node (no parent)
- **Leaf**: Node with no children
- **Height**: Longest path from node to leaf
- **Depth**: Distance from root to node
- **Level**: All nodes at same depth
- **Complete**: All levels filled except possibly last
- **Full**: Every node has 0 or 2 children
- **Perfect**: All leaves at same level

## Tree Traversals

### In-Order (Left, Root, Right)

```typescript
function inorder<T>(root: TreeNode<T> | null, result: T[] = []): T[] {
  if (!root) return result;
  
  inorder(root.left, result);   // Visit left
  result.push(root.val);         // Visit root
  inorder(root.right, result);   // Visit right
  
  return result;
}

// For BST, produces sorted order
```

### Pre-Order (Root, Left, Right)

```typescript
function preorder<T>(root: TreeNode<T> | null, result: T[] = []): T[] {
  if (!root) return result;
  
  result.push(root.val);         // Visit root
  preorder(root.left, result);   // Visit left
  preorder(root.right, result);  // Visit right
  
  return result;
}

// Useful for copying tree, prefix expressions
```

### Post-Order (Left, Right, Root)

```typescript
function postorder<T>(root: TreeNode<T> | null, result: T[] = []): T[] {
  if (!root) return result;
  
  postorder(root.left, result);   // Visit left
  postorder(root.right, result);  // Visit right
  result.push(root.val);          // Visit root
  
  return result;
}

// Useful for deletion, postfix expressions
```

### Level-Order (BFS)

```typescript
function levelOrder<T>(root: TreeNode<T> | null): T[][] {
  if (!root) return [];
  
  const result: T[][] = [];
  const queue: TreeNode<T>[] = [root];
  
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: T[] = [];
    
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.val);
      
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    
    result.push(currentLevel);
  }
  
  return result;
}
```

## Iterative Traversals

### Iterative In-Order

```typescript
function inorderIterative<T>(root: TreeNode<T> | null): T[] {
  const result: T[] = [];
  const stack: TreeNode<T>[] = [];
  let current = root;
  
  while (current || stack.length > 0) {
    // Go to leftmost node
    while (current) {
      stack.push(current);
      current = current.left;
    }
    
    // Process node
    current = stack.pop()!;
    result.push(current.val);
    
    // Move to right subtree
    current = current.right;
  }
  
  return result;
}
```

### Iterative Pre-Order

```typescript
function preorderIterative<T>(root: TreeNode<T> | null): T[] {
  if (!root) return [];
  
  const result: T[] = [];
  const stack = [root];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node.val);
    
    // Push right first so left is processed first
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }
  
  return result;
}
```

## Common Operations

### Height of Tree

```typescript
function height<T>(root: TreeNode<T> | null): number {
  if (!root) return 0;
  
  return 1 + Math.max(height(root.left), height(root.right));
}
```

### Count Nodes

```typescript
function countNodes<T>(root: TreeNode<T> | null): number {
  if (!root) return 0;
  
  return 1 + countNodes(root.left) + countNodes(root.right);
}
```

### Check if Balanced

```typescript
function isBalanced<T>(root: TreeNode<T> | null): boolean {
  function checkHeight(node: TreeNode<T> | null): number {
    if (!node) return 0;
    
    const leftHeight = checkHeight(node.left);
    if (leftHeight === -1) return -1;
    
    const rightHeight = checkHeight(node.right);
    if (rightHeight === -1) return -1;
    
    if (Math.abs(leftHeight - rightHeight) > 1) {
      return -1;  // Not balanced
    }
    
    return 1 + Math.max(leftHeight, rightHeight);
  }
  
  return checkHeight(root) !== -1;
}
```

### Diameter of Tree

```typescript
function diameter<T>(root: TreeNode<T> | null): number {
  let maxDiameter = 0;
  
  function height(node: TreeNode<T> | null): number {
    if (!node) return 0;
    
    const leftHeight = height(node.left);
    const rightHeight = height(node.right);
    
    // Update diameter (longest path through this node)
    maxDiameter = Math.max(maxDiameter, leftHeight + rightHeight);
    
    return 1 + Math.max(leftHeight, rightHeight);
  }
  
  height(root);
  return maxDiameter;
}
```

### Lowest Common Ancestor

```typescript
function lowestCommonAncestor<T>(
  root: TreeNode<T> | null,
  p: TreeNode<T>,
  q: TreeNode<T>
): TreeNode<T> | null {
  if (!root || root === p || root === q) {
    return root;
  }
  
  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);
  
  if (left && right) return root;  // Split
  return left || right;            // Both in one subtree
}
```

### Serialize and Deserialize

```typescript
class TreeCodec {
  serialize(root: TreeNode<number> | null): string {
    if (!root) return 'null';
    
    return `${root.val},${this.serialize(root.left)},${this.serialize(root.right)}`;
  }
  
  deserialize(data: string): TreeNode<number> | null {
    const values = data.split(',');
    let index = 0;
    
    const build = (): TreeNode<number> | null => {
      const val = values[index++];
      if (val === 'null') return null;
      
      const node = new TreeNode(parseInt(val));
      node.left = build();
      node.right = build();
      return node;
    };
    
    return build();
  }
}
```

## Path Problems

### All Paths from Root to Leaves

```typescript
function allPaths<T>(root: TreeNode<T> | null): T[][] {
  const paths: T[][] = [];
  
  function dfs(node: TreeNode<T> | null, path: T[]): void {
    if (!node) return;
    
    path.push(node.val);
    
    if (!node.left && !node.right) {
      // Leaf node - save path
      paths.push([...path]);
    } else {
      dfs(node.left, path);
      dfs(node.right, path);
    }
    
    path.pop();  // Backtrack
  }
  
  dfs(root, []);
  return paths;
}
```

### Path Sum

```typescript
function hasPathSum(root: TreeNode<number> | null, targetSum: number): boolean {
  if (!root) return false;
  
  if (!root.left && !root.right) {
    return root.val === targetSum;
  }
  
  return hasPathSum(root.left, targetSum - root.val) ||
         hasPathSum(root.right, targetSum - root.val);
}
```

## Tree Construction

### From Inorder and Preorder

```typescript
function buildTree(preorder: number[], inorder: number[]): TreeNode<number> | null {
  if (preorder.length === 0) return null;
  
  const rootVal = preorder[0];
  const root = new TreeNode(rootVal);
  
  const rootIndex = inorder.indexOf(rootVal);
  
  root.left = buildTree(
    preorder.slice(1, rootIndex + 1),
    inorder.slice(0, rootIndex)
  );
  
  root.right = buildTree(
    preorder.slice(rootIndex + 1),
    inorder.slice(rootIndex + 1)
  );
  
  return root;
}
```

## When to Use Binary Trees

✅ **Use binary trees when:**
- Hierarchical relationships
- Need efficient search (BST)
- Expression trees
- Decision trees
- File systems

❌ **Don't use binary trees when:**
- Need flat structure → Use array
- Need O(1) lookup → Use hash table
- Simple list → Use array or linked list

## The Mind-Shift

**Before**: Data in flat lists  
**After**: Hierarchical organization enables logarithmic operations

## Summary

**Binary Trees**:
- Each node has ≤2 children
- Three traversals: In/Pre/Post-order, plus level-order
- Height determines performance
- Foundation for BST, heaps, tries
- Recursive algorithms natural fit

**Key insight**: *Binary trees organize data hierarchically—when relationships are parent-child, trees provide natural structure and logarithmic efficiency.*

---

**Next**: [Binary Search Trees](../bst.md)
