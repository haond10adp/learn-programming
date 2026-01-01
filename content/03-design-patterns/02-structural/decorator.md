# Decorator Pattern

> *"Attach additional responsibilities to an object dynamically."*  
> — Gang of Four

## What is the Decorator Pattern?

The **Decorator pattern** adds new functionality to objects **without modifying** their structure. It wraps an object in decorator classes that add behaviors, like wrapping a gift—the gift stays the same, but you add layers around it.

```typescript
// Base component
interface Coffee {
  cost(): number;
  description(): string;
}

class SimpleCoffee implements Coffee {
  cost() { return 2; }
  description() { return 'Simple coffee'; }
}

// Decorators add functionality
class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}
  
  cost() {
    return this.coffee.cost() + 0.5;
  }
  
  description() {
    return `${this.coffee.description()}, milk`;
  }
}

// Usage - stack decorators
let coffee: Coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
console.log(coffee.description());  // "Simple coffee, milk, sugar"
console.log(coffee.cost());          // 3.0
```

## Why This Matters

Decorator is useful when:
- **Add responsibilities**: Without changing class
- **Flexible combinations**: Mix and match features
- **Open/Closed Principle**: Open for extension, closed for modification
- **Runtime enhancement**: Add features dynamically

## The Philosophy

Think of Decorator like **dressing**: you start with basic clothes (t-shirt), then add layers (jacket, scarf, hat) as needed. Each layer adds functionality (warmth) without changing what's underneath.

## Real-World Examples

### Logger Decorators

```typescript
interface Logger {
  log(message: string): void;
}

class BasicLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

// Decorator: Add timestamp
class TimestampDecorator implements Logger {
  constructor(private logger: Logger) {}
  
  log(message: string): void {
    const timestamp = new Date().toISOString();
    this.logger.log(`[${timestamp}] ${message}`);
  }
}

// Decorator: Add log level
class LevelDecorator implements Logger {
  constructor(
    private logger: Logger,
    private level: string
  ) {}
  
  log(message: string): void {
    this.logger.log(`[${this.level}] ${message}`);
  }
}

// Decorator: Add colors
class ColorDecorator implements Logger {
  constructor(
    private logger: Logger,
    private color: string
  ) {}
  
  log(message: string): void {
    this.logger.log(`\x1b[${this.color}m${message}\x1b[0m`);
  }
}

// Usage - stack decorators
let logger: Logger = new BasicLogger();
logger = new TimestampDecorator(logger);
logger = new LevelDecorator(logger, 'INFO');
logger = new ColorDecorator(logger, '32');  // Green

logger.log('Application started');
// Output: [2024-01-15T10:30:00.000Z] [INFO] Application started (in green)
```

### Data Stream Decorators

```typescript
interface DataStream {
  write(data: string): void;
  read(): string;
}

class FileStream implements DataStream {
  private data: string = '';
  
  write(data: string): void {
    this.data = data;
    console.log('Writing to file:', data);
  }
  
  read(): string {
    return this.data;
  }
}

// Decorator: Compression
class CompressionDecorator implements DataStream {
  constructor(private stream: DataStream) {}
  
  write(data: string): void {
    const compressed = this.compress(data);
    this.stream.write(compressed);
  }
  
  read(): string {
    const data = this.stream.read();
    return this.decompress(data);
  }
  
  private compress(data: string): string {
    return `compressed(${data})`;
  }
  
  private decompress(data: string): string {
    return data.replace('compressed(', '').replace(')', '');
  }
}

// Decorator: Encryption
class EncryptionDecorator implements DataStream {
  constructor(private stream: DataStream) {}
  
  write(data: string): void {
    const encrypted = this.encrypt(data);
    this.stream.write(encrypted);
  }
  
  read(): string {
    const data = this.stream.read();
    return this.decrypt(data);
  }
  
  private encrypt(data: string): string {
    return Buffer.from(data).toString('base64');
  }
  
  private decrypt(data: string): string {
    return Buffer.from(data, 'base64').toString('utf-8');
  }
}

// Usage
let stream: DataStream = new FileStream();
stream = new CompressionDecorator(stream);
stream = new EncryptionDecorator(stream);

stream.write('Secret message');
// Data is encrypted, then compressed, then written to file
```

### Caching Decorator

```typescript
interface DataRepository {
  getData(id: string): Promise<any>;
}

class DatabaseRepository implements DataRepository {
  async getData(id: string): Promise<any> {
    console.log('Fetching from database:', id);
    // Simulate database query
    return { id, name: 'Data' };
  }
}

class CacheDecorator implements DataRepository {
  private cache = new Map<string, any>();
  
  constructor(private repository: DataRepository) {}
  
  async getData(id: string): Promise<any> {
    if (this.cache.has(id)) {
      console.log('Cache hit:', id);
      return this.cache.get(id);
    }
    
    console.log('Cache miss:', id);
    const data = await this.repository.getData(id);
    this.cache.set(id, data);
    return data;
  }
}

class LoggingDecorator implements DataRepository {
  constructor(private repository: DataRepository) {}
  
  async getData(id: string): Promise<any> {
    console.log('Getting data for:', id);
    const start = Date.now();
    
    const data = await this.repository.getData(id);
    
    const duration = Date.now() - start;
    console.log(`Got data in ${duration}ms`);
    
    return data;
  }
}

// Usage
let repo: DataRepository = new DatabaseRepository();
repo = new CacheDecorator(repo);
repo = new LoggingDecorator(repo);

await repo.getData('123');  // Logs, cache miss, fetches from DB
await repo.getData('123');  // Logs, cache hit
```

## Benefits

1. **Flexibility**: Add/remove responsibilities at runtime
2. **Single Responsibility**: Each decorator has one purpose
3. **Open/Closed**: Extend without modifying
4. **Composition**: Stack multiple decorators

## When to Use

✅ **Use Decorator when:**
- Add responsibilities to individual objects
- Responsibilities should be reversible
- Extension by subclassing is impractical
- Need flexible combinations of features

❌ **Don't use Decorator when:**
- Need to change object's interface (use Adapter)
- Simple behavior addition (might be overkill)
- Order of decorators matters critically (can be confusing)

## Common Violations

```typescript
// ❌ BAD: Inheritance explosion
class BasicLogger {}
class TimestampLogger extends BasicLogger {}
class LevelLogger extends BasicLogger {}
class TimestampLevelLogger extends TimestampLogger {}
// Combinatorial explosion!

// ✅ GOOD: Composable decorators
let logger = new BasicLogger();
logger = new TimestampDecorator(logger);
logger = new LevelDecorator(logger);
```

## The Mind-Shift

**Before**: Modify class or create subclasses  
**After**: Wrap with decorators, compose behaviors

## Summary

**Decorator Pattern**:
- Adds responsibilities to objects dynamically
- Wraps original object
- Maintains same interface
- Compose multiple decorators
- Follows Open/Closed Principle

**Key insight**: *The Decorator pattern enables flexible extension—when you need to add features to objects without changing them, wrap them in decorators that enhance behavior.*

---

**Next**: [Facade Pattern](../facade.md)
