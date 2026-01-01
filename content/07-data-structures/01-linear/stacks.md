# Stacks

> *"Last In, First Out—like a stack of plates."*

## What is a Stack?

A **stack** is a LIFO (Last In, First Out) data structure where elements are added and removed from the same end (the "top"). Think of a stack of plates—you add to the top and remove from the top.

```typescript
class Stack<T> {
  private items: T[] = [];
  
  push(item: T): void {
    this.items.push(item);
  }
  
  pop(): T | undefined {
    return this.items.pop();
  }
  
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  size(): number {
    return this.items.length;
  }
}

// Usage
const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack.pop());   // 3 (last in, first out)
console.log(stack.peek());  // 2
```

## Why This Matters

Stacks are fundamental because:
- **Function call stack**: How programming languages work
- **Undo/Redo**: Browser history, text editors
- **Expression evaluation**: Parsing, calculators
- **Depth-First Search**: Graph/tree traversal

## Time Complexity

| Operation | Time |
|-----------|------|
| Push | O(1) |
| Pop | O(1) |
| Peek | O(1) |
| Search | O(n) |
| isEmpty | O(1) |

## Implementation Variants

### Array-Based Stack

```typescript
class ArrayStack<T> {
  private items: T[] = [];
  
  push(item: T): void {
    this.items.push(item);
  }
  
  pop(): T | undefined {
    if (this.isEmpty()) {
      throw new Error('Stack underflow');
    }
    return this.items.pop();
  }
  
  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[this.items.length - 1];
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  size(): number {
    return this.items.length;
  }
  
  clear(): void {
    this.items = [];
  }
}
```

### Linked List-Based Stack

```typescript
class ListNode<T> {
  constructor(
    public data: T,
    public next: ListNode<T> | null = null
  ) {}
}

class LinkedStack<T> {
  private top: ListNode<T> | null = null;
  private count: number = 0;
  
  push(item: T): void {
    const newNode = new ListNode(item, this.top);
    this.top = newNode;
    this.count++;
  }
  
  pop(): T | undefined {
    if (!this.top) {
      return undefined;
    }
    
    const data = this.top.data;
    this.top = this.top.next;
    this.count--;
    return data;
  }
  
  peek(): T | undefined {
    return this.top?.data;
  }
  
  isEmpty(): boolean {
    return this.top === null;
  }
  
  size(): number {
    return this.count;
  }
}
```

## Real-World Applications

### 1. Balanced Parentheses

```typescript
function isBalanced(str: string): boolean {
  const stack = new Stack<string>();
  const pairs: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };
  
  for (const char of str) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (char === ')' || char === '}' || char === ']') {
      if (stack.isEmpty() || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }
  
  return stack.isEmpty();
}

console.log(isBalanced('()')); // true
console.log(isBalanced('({[]})')); // true
console.log(isBalanced('({[})')); // false
console.log(isBalanced('(((')); // false
```

### 2. Reverse Polish Notation (RPN) Calculator

```typescript
function evalRPN(tokens: string[]): number {
  const stack = new Stack<number>();
  
  for (const token of tokens) {
    if (['+', '-', '*', '/'].includes(token)) {
      const b = stack.pop()!;
      const a = stack.pop()!;
      
      switch (token) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(Math.floor(a / b)); break;
      }
    } else {
      stack.push(parseInt(token));
    }
  }
  
  return stack.pop()!;
}

console.log(evalRPN(['2', '1', '+', '3', '*'])); // (2 + 1) * 3 = 9
console.log(evalRPN(['4', '13', '5', '/', '+'])); // 4 + (13 / 5) = 6
```

### 3. Browser History

```typescript
class BrowserHistory {
  private backStack = new Stack<string>();
  private forwardStack = new Stack<string>();
  private currentPage: string;
  
  constructor(homepage: string) {
    this.currentPage = homepage;
  }
  
  visit(url: string): void {
    this.backStack.push(this.currentPage);
    this.currentPage = url;
    this.forwardStack.clear();  // Clear forward history
  }
  
  back(): string {
    if (this.backStack.isEmpty()) {
      return this.currentPage;
    }
    
    this.forwardStack.push(this.currentPage);
    this.currentPage = this.backStack.pop()!;
    return this.currentPage;
  }
  
  forward(): string {
    if (this.forwardStack.isEmpty()) {
      return this.currentPage;
    }
    
    this.backStack.push(this.currentPage);
    this.currentPage = this.forwardStack.pop()!;
    return this.currentPage;
  }
}

const browser = new BrowserHistory('google.com');
browser.visit('youtube.com');
browser.visit('facebook.com');
console.log(browser.back());     // youtube.com
console.log(browser.back());     // google.com
console.log(browser.forward());  // youtube.com
```

### 4. Undo/Redo System

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private text: string = '';
  private undoStack = new Stack<Command>();
  private redoStack = new Stack<Command>();
  
  insertText(textToInsert: string): void {
    const command: Command = {
      execute: () => {
        this.text += textToInsert;
      },
      undo: () => {
        this.text = this.text.slice(0, -textToInsert.length);
      }
    };
    
    command.execute();
    this.undoStack.push(command);
    this.redoStack.clear();
  }
  
  undo(): void {
    if (this.undoStack.isEmpty()) return;
    
    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
  }
  
  redo(): void {
    if (this.redoStack.isEmpty()) return;
    
    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
  }
  
  getText(): string {
    return this.text;
  }
}

const editor = new TextEditor();
editor.insertText('Hello');
editor.insertText(' World');
console.log(editor.getText());  // "Hello World"
editor.undo();
console.log(editor.getText());  // "Hello"
editor.redo();
console.log(editor.getText());  // "Hello World"
```

### 5. Function Call Stack Simulation

```typescript
class CallStack {
  private stack = new Stack<{
    function: string;
    lineNumber: number;
    variables: Record<string, any>;
  }>();
  
  enterFunction(name: string, line: number, vars: Record<string, any>): void {
    this.stack.push({
      function: name,
      lineNumber: line,
      variables: vars
    });
    console.log(`Entering ${name} at line ${line}`);
  }
  
  exitFunction(): void {
    const frame = this.stack.pop();
    if (frame) {
      console.log(`Exiting ${frame.function}`);
    }
  }
  
  printStackTrace(): void {
    const frames: string[] = [];
    const tempStack = new Stack<any>();
    
    while (!this.stack.isEmpty()) {
      const frame = this.stack.pop()!;
      frames.push(`  at ${frame.function} (line ${frame.lineNumber})`);
      tempStack.push(frame);
    }
    
    // Restore stack
    while (!tempStack.isEmpty()) {
      this.stack.push(tempStack.pop()!);
    }
    
    console.log('Stack trace:');
    frames.reverse().forEach(f => console.log(f));
  }
}
```

### 6. Min Stack (O(1) getMin)

```typescript
class MinStack {
  private stack: number[] = [];
  private minStack: number[] = [];
  
  push(val: number): void {
    this.stack.push(val);
    
    const currentMin = this.minStack.length === 0
      ? val
      : Math.min(val, this.minStack[this.minStack.length - 1]);
    
    this.minStack.push(currentMin);
  }
  
  pop(): number | undefined {
    this.minStack.pop();
    return this.stack.pop();
  }
  
  top(): number | undefined {
    return this.stack[this.stack.length - 1];
  }
  
  getMin(): number | undefined {
    return this.minStack[this.minStack.length - 1];
  }
}

const minStack = new MinStack();
minStack.push(3);
minStack.push(5);
minStack.push(2);
minStack.push(1);
console.log(minStack.getMin());  // 1
minStack.pop();
console.log(minStack.getMin());  // 2
```

## Common Patterns

### Two Stacks as Queue

```typescript
class QueueUsingStacks<T> {
  private inStack = new Stack<T>();
  private outStack = new Stack<T>();
  
  enqueue(item: T): void {
    this.inStack.push(item);
  }
  
  dequeue(): T | undefined {
    if (this.outStack.isEmpty()) {
      while (!this.inStack.isEmpty()) {
        this.outStack.push(this.inStack.pop()!);
      }
    }
    return this.outStack.pop();
  }
}
```

## When to Use Stacks

✅ **Use stacks when:**
- LIFO behavior needed
- Undo/redo functionality
- Parsing expressions
- DFS traversal
- Backtracking algorithms

❌ **Don't use stacks when:**
- Need FIFO behavior → Use queue
- Need random access → Use array
- Need to access middle elements

## Common Pitfalls

```typescript
// ❌ BAD: Not checking if empty
const stack = new Stack<number>();
console.log(stack.pop());  // May return undefined unexpectedly

// ✅ GOOD: Check before popping
if (!stack.isEmpty()) {
  console.log(stack.pop());
}

// ❌ BAD: Modifying while iterating
// Can't easily iterate over stack without destroying it

// ✅ GOOD: Create temporary copy if needed
function printStack<T>(stack: Stack<T>): void {
  const temp = new Stack<T>();
  const items: T[] = [];
  
  while (!stack.isEmpty()) {
    const item = stack.pop()!;
    items.push(item);
    temp.push(item);
  }
  
  items.reverse();
  
  while (!temp.isEmpty()) {
    stack.push(temp.pop()!);
  }
  
  console.log(items);
}
```

## The Mind-Shift

**Before**: Just use an array  
**After**: LIFO behavior has specific applications—stacks model backtracking, recursion, and reversal

## Summary

**Stacks**:
- LIFO (Last In, First Out)
- O(1) push, pop, peek
- Used for: Recursion, undo/redo, parsing, DFS
- Array or linked list implementation
- Essential for function calls, expression evaluation

**Key insight**: *Stacks embody reversal—when you need to process things in reverse order or backtrack, stacks are the natural choice.*

---

**Next**: [Queues](../queues.md)
