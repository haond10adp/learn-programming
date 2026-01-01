# Singleton Pattern

> *"There can be only one."*  
> — Highlander (and the Singleton pattern)

## What is the Singleton Pattern?

The **Singleton pattern** ensures a class has **only one instance** and provides a global point of access to it. No matter how many times you try to create the object, you always get the same instance.

```typescript
// Without Singleton - multiple instances
const db1 = new Database();
const db2 = new Database();
console.log(db1 === db2);  // false - different instances!

// With Singleton - one instance
const db1 = Database.getInstance();
const db2 = Database.getInstance();
console.log(db1 === db2);  // true - same instance!
```

## Why This Matters

Singleton is useful when:
- **Shared resource**: Database connection, configuration, cache
- **Coordination**: Logger, event bus, application state
- **Expensive creation**: Object that's costly to instantiate
- **Global access**: Need the same instance everywhere

## The Philosophy

Think of Singleton like **the President**: there's only one at a time, everyone knows who it is, and you don't create a new one just because you need to talk to them.

## Basic Implementation

### Classic Singleton

```typescript
class Database {
  private static instance: Database;
  private connection: any;
  
  // Private constructor prevents direct instantiation
  private constructor() {
    this.connection = this.connect();
    console.log('Database connected');
  }
  
  // Public static method to get the instance
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
  
  private connect(): any {
    // Simulate database connection
    return { connected: true };
  }
  
  public query(sql: string): any {
    console.log('Executing:', sql);
    return this.connection;
  }
}

// Usage
const db1 = Database.getInstance();
db1.query('SELECT * FROM users');

const db2 = Database.getInstance();
db2.query('SELECT * FROM orders');

console.log(db1 === db2);  // true - same instance
// Constructor is called only once
```

### Thread-Safe Singleton (TypeScript)

```typescript
class Logger {
  private static instance: Logger;
  private logs: string[] = [];
  
  private constructor() {
    console.log('Logger initialized');
  }
  
  public static getInstance(): Logger {
    // Lazy initialization with nullish coalescing
    return Logger.instance ??= new Logger();
  }
  
  public log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
    console.log(`[${timestamp}] ${message}`);
  }
  
  public getLogs(): string[] {
    return [...this.logs];  // Return copy to preserve encapsulation
  }
  
  public clear(): void {
    this.logs = [];
  }
}

// Usage
const logger1 = Logger.getInstance();
logger1.log('Application started');

const logger2 = Logger.getInstance();
logger2.log('User logged in');

console.log(logger1 === logger2);  // true
console.log(logger1.getLogs());    // Both messages present
```

## Real-World Examples

### Configuration Manager

```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  environment: 'dev' | 'staging' | 'prod';
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  
  private constructor() {
    // Load configuration once
    this.config = this.loadConfig();
  }
  
  public static getInstance(): ConfigManager {
    return ConfigManager.instance ??= new ConfigManager();
  }
  
  private loadConfig(): AppConfig {
    // In real app, load from environment or config file
    return {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      timeout: Number(process.env.TIMEOUT) || 5000,
      retries: 3,
      environment: (process.env.NODE_ENV as any) || 'dev'
    };
  }
  
  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
  
  public getAll(): Readonly<AppConfig> {
    return { ...this.config };
  }
}

// Usage across application
const config = ConfigManager.getInstance();
const apiUrl = config.get('apiUrl');
const timeout = config.get('timeout');

// Somewhere else in the code
const config2 = ConfigManager.getInstance();
console.log(config === config2);  // true - same configuration
```

### Cache Manager

```typescript
class CacheManager<T = any> {
  private static instance: CacheManager;
  private cache = new Map<string, { value: T; expiry: number }>();
  
  private constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000);  // Every minute
  }
  
  public static getInstance<T = any>(): CacheManager<T> {
    return CacheManager.instance ??= new CacheManager<T>();
  }
  
  public set(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }
  
  public get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  public has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  public delete(key: string): void {
    this.cache.delete(key);
  }
  
  public clear(): void {
    this.cache.clear();
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Usage
const cache = CacheManager.getInstance<User>();
cache.set('user:123', { id: '123', name: 'Alice' }, 600);

const user = cache.get('user:123');
console.log(user);  // { id: '123', name: 'Alice' }
```

### Event Bus

```typescript
type EventHandler = (data: any) => void;

class EventBus {
  private static instance: EventBus;
  private listeners = new Map<string, EventHandler[]>();
  
  private constructor() {}
  
  public static getInstance(): EventBus {
    return EventBus.instance ??= new EventBus();
  }
  
  public on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => this.off(event, handler);
  }
  
  public off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  public emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    
    handlers.forEach(handler => handler(data));
  }
  
  public clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Usage
const eventBus = EventBus.getInstance();

// Component A subscribes
const unsubscribe = eventBus.on('user:login', (user) => {
  console.log('User logged in:', user.name);
});

// Component B emits
eventBus.emit('user:login', { name: 'Alice', id: '123' });

// Cleanup
unsubscribe();
```

## Common Violations

### Creating Multiple Instances

```typescript
// ❌ BAD: Not preventing multiple instances
class Database {
  constructor() {
    // Anyone can create new instances!
  }
}

const db1 = new Database();
const db2 = new Database();  // Second instance!

// ✅ GOOD: Private constructor
class Database {
  private static instance: Database;
  
  private constructor() {}  // Can't call from outside
  
  public static getInstance(): Database {
    return Database.instance ??= new Database();
  }
}
```

### Not Handling Reset for Tests

```typescript
// ❌ BAD: No way to reset for tests
class Logger {
  private static instance: Logger;
  private logs: string[] = [];
  
  private constructor() {}
  
  public static getInstance(): Logger {
    return Logger.instance ??= new Logger();
  }
}

// Tests will share state!

// ✅ GOOD: Add reset for testing
class Logger {
  private static instance: Logger;
  private logs: string[] = [];
  
  private constructor() {}
  
  public static getInstance(): Logger {
    return Logger.instance ??= new Logger();
  }
  
  // For testing only
  public static resetInstance(): void {
    Logger.instance = undefined as any;
  }
  
  public clear(): void {
    this.logs = [];
  }
}

// In tests:
afterEach(() => {
  Logger.resetInstance();
});
```

### Overusing Singleton

```typescript
// ❌ BAD: Everything is a Singleton
class UserService {
  private static instance: UserService;
  // This doesn't need to be a Singleton!
}

class ProductService {
  private static instance: ProductService;
  // Neither does this!
}

// ✅ GOOD: Only for shared resources
class Database {
  private static instance: Database;
  // Database connection SHOULD be a Singleton
}

// Regular services can be regular classes
class UserService {
  constructor(private db: Database) {}
}
```

## Benefits

1. **Single Instance**: Guaranteed one instance across application
2. **Global Access**: Available everywhere via `getInstance()`
3. **Lazy Initialization**: Created only when first needed
4. **Memory Efficient**: One instance instead of many
5. **Controlled Creation**: Constructor is private

## When to Use

✅ **Use Singleton when:**
- Database connection pool
- Configuration manager
- Logger
- Cache
- Event bus
- Thread pool
- Hardware interface access

❌ **Don't use Singleton when:**
- You need multiple instances (obviously!)
- Testing is difficult (consider dependency injection instead)
- It's just a namespace (use modules/namespaces)
- State could be passed as parameters

## Trade-offs

**Pros:**
- Guaranteed single instance
- Global access point
- Lazy initialization
- Thread-safe (in single-threaded JS)

**Cons:**
- Global state (can make testing hard)
- Tight coupling (everything depends on it)
- Hard to mock in tests
- Violates Single Responsibility (controls creation + behavior)
- Can hide dependencies

## Modern Alternatives

### Module Singleton (JavaScript/TypeScript)

```typescript
// cache.ts
class CacheImpl {
  private cache = new Map<string, any>();
  
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }
  
  get(key: string): any {
    return this.cache.get(key);
  }
}

// Export single instance
export const cache = new CacheImpl();

// Usage
import { cache } from './cache';
cache.set('key', 'value');
```

### Dependency Injection

```typescript
// Instead of Singleton:
class UserService {
  constructor(private db: Database) {}  // Inject dependency
}

// Container manages single instance
const db = new Database();
const userService = new UserService(db);
const orderService = new OrderService(db);
// All services share the same db instance
```

## The Mind-Shift

**Before understanding Singleton:**
- Create objects everywhere
- Pass instances through many layers
- Multiple connections to same resource

**After:**
- One instance for shared resources
- Global access when needed
- Cleaner code structure

## Summary

**Singleton Pattern**:
- Ensures only one instance of a class
- Provides global access point
- Private constructor prevents direct instantiation
- `getInstance()` returns the single instance
- Use for shared resources like database, cache, config
- Consider alternatives like module singletons or DI for testability

**Key insight**: *The Singleton pattern is about controlling object creation—when you need exactly one instance of something shared across your application, Singleton provides the structure.*

---

**Next**: [Factory Method Pattern](../factory.md)
