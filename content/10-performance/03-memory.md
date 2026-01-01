# Memory Management and Optimization

## Understanding Memory in JavaScript

JavaScript uses **automatic memory management** (garbage collection), but understanding how it works helps you write more efficient code and avoid memory leaks.

### Memory Lifecycle

```
1. Allocation   → Memory is allocated when you create variables
2. Usage        → You read and write to allocated memory
3. Release      → Garbage collector frees unused memory
```

## Garbage Collection

### How It Works

JavaScript uses **Mark-and-Sweep** garbage collection:

1. **Mark Phase**: GC marks all reachable objects
2. **Sweep Phase**: GC frees unmarked (unreachable) objects

```typescript
// Object is reachable (referenced by variable)
let user = { name: 'John' }; // Allocated

// Object is unreachable (no references)
user = null; // Marked for garbage collection
```

### Generational Garbage Collection

Modern engines use generational GC:
- **Young Generation**: New objects (frequent, fast GC)
- **Old Generation**: Long-lived objects (infrequent, slower GC)

```typescript
// Short-lived object (young generation)
function processRequest() {
    const temp = { data: 'temporary' }; // Collected quickly
    return temp.data;
}

// Long-lived object (promoted to old generation)
const cache = new Map(); // Stays in memory
```

## Common Memory Leaks

### 1. Global Variables

```typescript
// ❌ Bad: Accidental global
function createLeak() {
    leak = { data: new Array(1000000) }; // No const/let/var
}

// ✅ Good: Properly scoped
function noLeak() {
    const data = { data: new Array(1000000) };
    // Automatically collected when function ends
}
```

### 2. Forgotten Timers

```typescript
// ❌ Bad: Timer never cleared
class Component {
    constructor() {
        setInterval(() => {
            console.log(this.data);
        }, 1000);
    }
}

// ✅ Good: Clear timer on cleanup
class Component {
    private timerId?: NodeJS.Timer;
    
    constructor() {
        this.timerId = setInterval(() => {
            console.log(this.data);
        }, 1000);
    }
    
    destroy() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }
    }
}
```

### 3. Event Listeners

```typescript
// ❌ Bad: Listener never removed
class Component {
    constructor() {
        window.addEventListener('resize', this.handleResize);
    }
    
    handleResize() {
        // Handle resize
    }
}

// ✅ Good: Remove listener
class Component {
    constructor() {
        window.addEventListener('resize', this.handleResize);
    }
    
    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
        // Handle resize (arrow function binds this)
    }
}
```

### 4. Closures

```typescript
// ❌ Bad: Closure holds large object
function createClosure() {
    const largeData = new Array(1000000).fill('data');
    
    return function() {
        console.log(largeData[0]); // Keeps entire array in memory
    };
}

// ✅ Good: Only capture what's needed
function createClosureOptimized() {
    const largeData = new Array(1000000).fill('data');
    const firstItem = largeData[0]; // Extract only what's needed
    
    return function() {
        console.log(firstItem); // Only keeps firstItem in memory
    };
}
```

### 5. Detached DOM Nodes

```typescript
// ❌ Bad: Keeping reference to removed DOM node
class ComponentWithLeak {
    private element: HTMLElement;
    
    constructor() {
        this.element = document.createElement('div');
        document.body.appendChild(this.element);
    }
    
    remove() {
        this.element.remove(); // Element removed from DOM but still referenced
        // this.element still holds reference!
    }
}

// ✅ Good: Clear reference
class ComponentNoLeak {
    private element: HTMLElement | null;
    
    constructor() {
        this.element = document.createElement('div');
        document.body.appendChild(this.element);
    }
    
    remove() {
        this.element?.remove();
        this.element = null; // Clear reference
    }
}
```

### 6. Caches Without Limits

```typescript
// ❌ Bad: Unbounded cache
class CacheWithLeak {
    private cache = new Map<string, any>();
    
    get(key: string): any {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        const value = expensiveOperation(key);
        this.cache.set(key, value); // Grows forever!
        return value;
    }
}

// ✅ Good: LRU Cache with size limit
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;
    
    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }
    
    get(key: K): V | undefined {
        const value = this.cache.get(key);
        
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        
        return value;
    }
    
    set(key: K, value: V): void {
        // Remove if exists
        this.cache.delete(key);
        
        // Add to end
        this.cache.set(key, value);
        
        // Remove oldest if over limit
        if (this.cache.size > this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
}
```

## Memory Optimization Techniques

### 1. Object Pooling

```typescript
// ============================================
// OBJECT POOL
// ============================================

class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private reset: (obj: T) => void;
    
    constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10) {
        this.factory = factory;
        this.reset = reset;
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }
    
    acquire(): T {
        return this.pool.pop() || this.factory();
    }
    
    release(obj: T): void {
        this.reset(obj);
        this.pool.push(obj);
    }
}

// Example: Vector pool for game
interface Vector {
    x: number;
    y: number;
}

const vectorPool = new ObjectPool<Vector>(
    () => ({ x: 0, y: 0 }),
    (v) => { v.x = 0; v.y = 0; },
    100
);

// ❌ Bad: Creating many temporary objects
function calculatePositionsSlow(count: number) {
    const positions: Vector[] = [];
    
    for (let i = 0; i < count; i++) {
        const pos = { x: Math.random(), y: Math.random() }; // New allocation
        positions.push(pos);
    }
    
    return positions;
}

// ✅ Good: Reuse objects from pool
function calculatePositionsFast(count: number) {
    const positions: Vector[] = [];
    
    for (let i = 0; i < count; i++) {
        const pos = vectorPool.acquire(); // Reuse object
        pos.x = Math.random();
        pos.y = Math.random();
        positions.push(pos);
    }
    
    return positions;
}
```

### 2. Weak References

```typescript
// ============================================
// WEAKMAP AND WEAKSET
// ============================================

// ❌ Bad: Strong references prevent GC
class CacheStrong {
    private cache = new Map<object, any>();
    
    set(key: object, value: any): void {
        this.cache.set(key, value); // Keeps key alive
    }
}

// ✅ Good: WeakMap allows GC
class CacheWeak {
    private cache = new WeakMap<object, any>();
    
    set(key: object, value: any): void {
        this.cache.set(key, value); // Key can be GC'd
    }
}

// Example: Metadata without memory leaks
const metadata = new WeakMap<object, Metadata>();

function attachMetadata(obj: object, data: Metadata): void {
    metadata.set(obj, data);
}

// When obj is GC'd, metadata is automatically removed
```

### 3. Array Pre-allocation

```typescript
// ❌ Bad: Array grows dynamically
function createArraySlow(size: number): number[] {
    const arr: number[] = [];
    
    for (let i = 0; i < size; i++) {
        arr.push(i); // May cause reallocation
    }
    
    return arr;
}

// ✅ Good: Pre-allocate array
function createArrayFast(size: number): number[] {
    const arr = new Array(size);
    
    for (let i = 0; i < size; i++) {
        arr[i] = i; // No reallocation
    }
    
    return arr;
}

// ✅ Even better: Use Array.from
function createArrayBest(size: number): number[] {
    return Array.from({ length: size }, (_, i) => i);
}
```

### 4. String Interning

```typescript
// ============================================
// STRING INTERNING (manual)
// ============================================

class StringInterner {
    private pool = new Map<string, string>();
    
    intern(str: string): string {
        if (this.pool.has(str)) {
            return this.pool.get(str)!;
        }
        
        this.pool.set(str, str);
        return str;
    }
    
    size(): number {
        return this.pool.size;
    }
}

// Use when you have many duplicate strings
const interner = new StringInterner();

// Without interning: 1 million unique strings
const stringsWithout = Array.from({ length: 1000000 }, () => 'duplicate');
// Memory: ~50MB

// With interning: Only 1 unique string
const stringsWith = Array.from({ length: 1000000 }, () => interner.intern('duplicate'));
// Memory: ~0.5MB (100x less!)
```

### 5. Lazy Loading

```typescript
// ============================================
// LAZY LOADING
// ============================================

// ❌ Bad: Load everything upfront
class DataManagerEager {
    private data: LargeData;
    
    constructor() {
        this.data = loadLargeData(); // Loaded immediately
    }
}

// ✅ Good: Load only when needed
class DataManagerLazy {
    private data?: LargeData;
    
    getData(): LargeData {
        if (!this.data) {
            this.data = loadLargeData(); // Loaded on first access
        }
        return this.data;
    }
}

// ✅ Even better: Lazy property
class DataManagerLazyProp {
    private _data?: LargeData;
    
    get data(): LargeData {
        if (!this._data) {
            this._data = loadLargeData();
        }
        return this._data;
    }
}
```

## Memory Profiling

### 1. Heap Snapshot Analysis

```typescript
// Take heap snapshots to find memory leaks
// Chrome DevTools → Memory → Take heap snapshot

// Example: Finding leaked objects
class LeakDetector {
    private snapshots: any[] = [];
    
    takeSnapshot(label: string): void {
        if (typeof window !== 'undefined' && (window as any).gc) {
            (window as any).gc(); // Force GC (Chrome with --expose-gc)
        }
        
        const snapshot = {
            label,
            time: Date.now(),
            memory: process.memoryUsage()
        };
        
        this.snapshots.push(snapshot);
        console.log(`Snapshot "${label}":`, snapshot.memory);
    }
    
    compare(label1: string, label2: string): void {
        const snap1 = this.snapshots.find(s => s.label === label1);
        const snap2 = this.snapshots.find(s => s.label === label2);
        
        if (snap1 && snap2) {
            const diff = snap2.memory.heapUsed - snap1.memory.heapUsed;
            console.log(`Memory increase: ${(diff / 1024 / 1024).toFixed(2)} MB`);
        }
    }
}

// Usage
const detector = new LeakDetector();

detector.takeSnapshot('before');
// ... run operations
detector.takeSnapshot('after');
detector.compare('before', 'after');
```

### 2. Memory Usage Monitoring

```typescript
// ============================================
// MEMORY MONITOR
// ============================================

class MemoryMonitor {
    private interval: NodeJS.Timer | null = null;
    private threshold: number;
    
    constructor(thresholdMB: number = 500) {
        this.threshold = thresholdMB * 1024 * 1024;
    }
    
    start(intervalMs: number = 5000): void {
        this.interval = setInterval(() => {
            const usage = process.memoryUsage();
            
            console.log('Memory Usage:');
            console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
            
            if (usage.heapUsed > this.threshold) {
                console.warn('⚠️  Memory threshold exceeded!');
            }
        }, intervalMs);
    }
    
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Usage
const monitor = new MemoryMonitor(500); // Alert if > 500MB
monitor.start(5000); // Check every 5 seconds
```

## Best Practices

### 1. Avoid Large Objects in Closures

```typescript
// ❌ Bad
function createHandler() {
    const largeData = new Array(1000000).fill(0);
    
    return function() {
        console.log(largeData.length); // Keeps entire array
    };
}

// ✅ Good
function createHandler() {
    const largeData = new Array(1000000).fill(0);
    const length = largeData.length; // Extract what you need
    
    return function() {
        console.log(length); // Only keeps number
    };
}
```

### 2. Use Primitives When Possible

```typescript
// ❌ Bad: Wrapper objects
const num = new Number(42); // Object
const str = new String('hello'); // Object

// ✅ Good: Primitives
const num = 42; // Primitive
const str = 'hello'; // Primitive
```

### 3. Clear Large Data Structures

```typescript
// ❌ Bad: Keep growing
class DataManager {
    private data = new Map<string, any>();
    
    add(key: string, value: any): void {
        this.data.set(key, value);
    }
}

// ✅ Good: Clear when done
class DataManager {
    private data = new Map<string, any>();
    
    add(key: string, value: any): void {
        this.data.set(key, value);
    }
    
    clear(): void {
        this.data.clear();
    }
    
    cleanup(): void {
        // Remove entries older than 1 hour
        const cutoff = Date.now() - 3600000;
        for (const [key, value] of this.data) {
            if (value.timestamp < cutoff) {
                this.data.delete(key);
            }
        }
    }
}
```

### 4. Nullify References

```typescript
// ✅ Good: Clear references when done
class Component {
    private data: LargeData | null = loadLargeData();
    
    destroy(): void {
        // Clear references
        this.data = null;
        
        // Clear event listeners
        this.removeEventListeners();
        
        // Clear timers
        this.clearTimers();
    }
}
```

## Memory Leak Detection

```typescript
// ============================================
// MEMORY LEAK DETECTOR
// ============================================

class LeakDetector {
    private initialHeap: number;
    
    constructor() {
        this.initialHeap = this.getHeapSize();
    }
    
    private getHeapSize(): number {
        if (typeof process !== 'undefined') {
            return process.memoryUsage().heapUsed;
        }
        return (performance as any).memory?.usedJSHeapSize || 0;
    }
    
    async detectLeak(operation: () => void, iterations: number = 10): Promise<boolean> {
        const samples: number[] = [];
        
        for (let i = 0; i < iterations; i++) {
            operation();
            
            // Force GC if available
            if (typeof global !== 'undefined' && (global as any).gc) {
                (global as any).gc();
            }
            
            await this.wait(100);
            samples.push(this.getHeapSize());
        }
        
        // Check if memory is consistently increasing
        let increasing = 0;
        for (let i = 1; i < samples.length; i++) {
            if (samples[i] > samples[i - 1]) {
                increasing++;
            }
        }
        
        const leakDetected = increasing > samples.length * 0.7;
        
        if (leakDetected) {
            console.warn('⚠️  Possible memory leak detected!');
            console.log('Memory samples:', samples.map(s => `${(s / 1024 / 1024).toFixed(2)} MB`));
        }
        
        return leakDetected;
    }
    
    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage
const detector = new LeakDetector();

await detector.detectLeak(() => {
    // Operation to test
    const arr = new Array(10000).fill(0);
    // If this leaks, detector will catch it
}, 10);
```

## Summary

**Memory management** is crucial for performance and stability:

1. **Garbage Collection**: Understanding how GC works helps avoid leaks
2. **Common Leaks**: Timers, listeners, closures, detached DOM, unbounded caches
3. **Optimization Techniques**: Object pooling, weak references, pre-allocation
4. **Profiling**: Use heap snapshots and monitoring to find leaks
5. **Best Practices**: Clear references, use primitives, nullify when done
6. **Prevention**: Always clean up resources in destroy/unmount methods

**Key Takeaway**: Memory leaks accumulate over time. Clean up resources properly, especially in long-running applications.

---

**Next**: Explore [Async Patterns](../04-async.md) for efficient asynchronous operations.
