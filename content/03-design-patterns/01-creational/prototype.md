# Prototype Pattern

> *"Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype."*  
> — Gang of Four

## What is the Prototype Pattern?

The **Prototype pattern** creates new objects by **cloning existing ones** instead of instantiating from scratch. It's useful when object creation is expensive or complex, and you need variations of a base object.

```typescript
// Without Prototype - create from scratch each time
const user1 = new User('Alice', 'alice@example.com', defaultSettings);
const user2 = new User('Bob', 'bob@example.com', defaultSettings);

// With Prototype - clone and customize
const template = new User('Template', 'template@...', defaultSettings);
const user1 = template.clone();
user1.name = 'Alice';
user1.email = 'alice@example.com';
```

## Why This Matters

Prototype is useful when:
- **Expensive creation**: Object initialization is costly
- **Similar objects**: Many objects with small differences
- **Dynamic types**: Create objects based on runtime prototype
- **Avoid subclassing**: Clone instead of creating inheritance hierarchy

## The Philosophy

Think of Prototype like **photocopying**: instead of rewriting a document from scratch, you photocopy it and make small edits. The copy is nearly identical but can be customized without affecting the original.

## Basic Implementation

### Simple Clone

```typescript
interface Cloneable<T> {
  clone(): T;
}

class User implements Cloneable<User> {
  constructor(
    public name: string,
    public email: string,
    public settings: UserSettings
  ) {}
  
  clone(): User {
    // Shallow clone
    return new User(this.name, this.email, this.settings);
  }
}

interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

// Usage
const template = new User('Template', 'template@example.com', {
  theme: 'light',
  notifications: true
});

const user1 = template.clone();
user1.name = 'Alice';
user1.email = 'alice@example.com';

const user2 = template.clone();
user2.name = 'Bob';
user2.email = 'bob@example.com';
```

### Deep Clone

```typescript
class Document implements Cloneable<Document> {
  constructor(
    public title: string,
    public content: string[],
    public metadata: Record<string, any>
  ) {}
  
  clone(): Document {
    // Deep clone - nested objects/arrays are copied
    return new Document(
      this.title,
      [...this.content],  // Clone array
      { ...this.metadata }  // Clone object
    );
  }
}

// Usage
const template = new Document('Template', ['Line 1', 'Line 2'], {
  author: 'System',
  created: Date.now()
});

const doc1 = template.clone();
doc1.title = 'Report';
doc1.content.push('Line 3');  // Doesn't affect template

const doc2 = template.clone();
doc2.title = 'Notes';

console.log(template.content.length);  // 2 - unaffected
console.log(doc1.content.length);      // 3
```

## Real-World Examples

### Configuration Prototype

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  poolSize: number;
  timeout: number;
}

class DatabaseConnection implements Cloneable<DatabaseConnection> {
  constructor(public config: DatabaseConfig) {}
  
  clone(): DatabaseConnection {
    return new DatabaseConnection({
      ...this.config
    });
  }
  
  connect(): void {
    console.log(`Connecting to ${this.config.host}:${this.config.port}`);
  }
}

// Base configuration
const baseConfig = new DatabaseConnection({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'admin',
  password: 'secret',
  poolSize: 10,
  timeout: 5000
});

// Clone for different environments
const devConfig = baseConfig.clone();
devConfig.config.database = 'myapp_dev';

const testConfig = baseConfig.clone();
testConfig.config.database = 'myapp_test';
testConfig.config.poolSize = 5;

const prodConfig = baseConfig.clone();
prodConfig.config.host = 'prod.example.com';
prodConfig.config.poolSize = 50;
```

### Graphics Shape Prototype

```typescript
abstract class Shape implements Cloneable<Shape> {
  constructor(
    public x: number,
    public y: number,
    public color: string
  ) {}
  
  abstract clone(): Shape;
  abstract draw(): void;
}

class Circle extends Shape {
  constructor(
    x: number,
    y: number,
    color: string,
    public radius: number
  ) {
    super(x, y, color);
  }
  
  clone(): Circle {
    return new Circle(this.x, this.y, this.color, this.radius);
  }
  
  draw(): void {
    console.log(`Drawing circle at (${this.x}, ${this.y}), r=${this.radius}, color=${this.color}`);
  }
}

class Rectangle extends Shape {
  constructor(
    x: number,
    y: number,
    color: string,
    public width: number,
    public height: number
  ) {
    super(x, y, color);
  }
  
  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.color, this.width, this.height);
  }
  
  draw(): void {
    console.log(`Drawing rectangle at (${this.x}, ${this.y}), ${this.width}x${this.height}, color=${this.color}`);
  }
}

// Shape registry
class ShapeRegistry {
  private shapes = new Map<string, Shape>();
  
  register(key: string, shape: Shape): void {
    this.shapes.set(key, shape);
  }
  
  create(key: string): Shape {
    const prototype = this.shapes.get(key);
    if (!prototype) {
      throw new Error(`Shape not found: ${key}`);
    }
    return prototype.clone();
  }
}

// Usage
const registry = new ShapeRegistry();

// Register prototypes
registry.register('red-circle', new Circle(0, 0, 'red', 50));
registry.register('blue-rect', new Rectangle(0, 0, 'blue', 100, 50));

// Clone and position
const circle1 = registry.create('red-circle');
circle1.x = 100;
circle1.y = 100;
circle1.draw();

const circle2 = registry.create('red-circle');
circle2.x = 200;
circle2.y = 200;
circle2.draw();

const rect = registry.create('blue-rect');
rect.x = 150;
rect.y = 150;
rect.draw();
```

### Game Entity Prototype

```typescript
interface EntityStats {
  health: number;
  attack: number;
  defense: number;
}

class GameEntity implements Cloneable<GameEntity> {
  constructor(
    public name: string,
    public stats: EntityStats,
    public equipment: string[]
  ) {}
  
  clone(): GameEntity {
    return new GameEntity(
      this.name,
      { ...this.stats },      // Clone stats
      [...this.equipment]      // Clone equipment array
    );
  }
  
  display(): void {
    console.log(`${this.name}: HP=${this.stats.health}, ATK=${this.stats.attack}, DEF=${this.stats.defense}`);
    console.log(`Equipment: ${this.equipment.join(', ')}`);
  }
}

// Create prototypes
const goblinPrototype = new GameEntity('Goblin', {
  health: 50,
  attack: 10,
  defense: 5
}, ['Dagger']);

const orcPrototype = new GameEntity('Orc', {
  health: 100,
  attack: 20,
  defense: 10
}, ['Axe', 'Shield']);

// Spawn entities
function spawnGoblins(count: number): GameEntity[] {
  return Array.from({ length: count }, (_, i) => {
    const goblin = goblinPrototype.clone();
    goblin.name = `Goblin ${i + 1}`;
    return goblin;
  });
}

const goblins = spawnGoblins(5);
goblins.forEach(g => g.display());

// Create variant
const eliteOrc = orcPrototype.clone();
eliteOrc.name = 'Elite Orc';
eliteOrc.stats.health = 150;
eliteOrc.stats.attack = 30;
eliteOrc.equipment.push('Helmet');
eliteOrc.display();
```

## Benefits

1. **Performance**: Avoid expensive initialization
2. **Simplicity**: Clone instead of complex constructors
3. **Flexibility**: Create variants easily
4. **Runtime types**: Don't need to know concrete class

## When to Use

✅ **Use Prototype when:**
- Object creation is expensive
- Need many similar objects
- Want to avoid explosion of subclasses
- Runtime object types
- Object has complex initialization

❌ **Don't use Prototype when:**
- Simple objects easy to create
- Don't need variations
- Deep cloning is complex

## Common Violations

### Shallow vs Deep Clone

```typescript
// ❌ BAD: Shallow clone with nested objects
class User {
  clone(): User {
    return new User(this.name, this.settings);  // Settings object shared!
  }
}

const user1 = template.clone();
user1.settings.theme = 'dark';  // Changes template too!

// ✅ GOOD: Deep clone nested objects
class User {
  clone(): User {
    return new User(this.name, { ...this.settings });  // New settings object
  }
}
```

### Not Implementing Clone Properly

```typescript
// ❌ BAD: Clone returns same object
clone(): this {
  return this;  // Not a clone!
}

// ✅ GOOD: Create new instance
clone(): this {
  return new (this.constructor as any)(...args);
}
```

## The Mind-Shift

**Before**: Create objects from scratch every time  
**After**: Clone and customize variations

## Summary

**Prototype Pattern**:
- Clone existing objects instead of creating new ones
- Useful when creation is expensive
- Deep clone vs shallow clone
- Registry can store prototypes
- Avoids complex inheritance hierarchies

**Key insight**: *The Prototype pattern is about reusing existing objects—when you need many similar objects, clone a prototype and customize instead of creating from scratch.*

---

**Next**: [Structural Patterns - Adapter](../../02-structural/adapter.md)
