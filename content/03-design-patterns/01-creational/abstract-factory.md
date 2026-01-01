# Abstract Factory Pattern

> *"Provide an interface for creating families of related or dependent objects without specifying their concrete classes."*  
> — Gang of Four

## What is the Abstract Factory Pattern?

The **Abstract Factory pattern** creates **families of related objects** without specifying their concrete classes. It's a factory of factories—each factory creates a consistent set of objects that work together.

```typescript
// Without Abstract Factory
const button = new WindowsButton();
const checkbox = new MacCheckbox();  // Mixing platforms - inconsistent!

// With Abstract Factory
const factory = new WindowsUIFactory();
const button = factory.createButton();     // Windows button
const checkbox = factory.createCheckbox(); // Windows checkbox - consistent!
```

## Why This Matters

Abstract Factory is useful when:
- **Related products**: Button, checkbox, input work together
- **Platform variations**: Windows, Mac, Linux UIs
- **Consistency required**: All products from same family
- **Interchangeable families**: Switch entire set at once

## The Philosophy

Think of Abstract Factory like **furniture stores**: IKEA creates modern furniture (chair, table, lamp), while an antique store creates vintage furniture (chair, table, lamp). Each store (factory) produces a consistent style family, and you wouldn't mix IKEA chairs with antique tables—they wouldn't match.

## Basic Implementation

### UI Component Factory

```typescript
// Abstract products
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

interface Checkbox {
  render(): void;
  toggle(): void;
}

// Windows concrete products
class WindowsButton implements Button {
  render(): void {
    console.log('Rendering Windows-style button');
  }
  
  onClick(handler: () => void): void {
    console.log('Windows button clicked');
    handler();
  }
}

class WindowsCheckbox implements Checkbox {
  private checked = false;
  
  render(): void {
    console.log('Rendering Windows-style checkbox');
  }
  
  toggle(): void {
    this.checked = !this.checked;
    console.log(`Windows checkbox: ${this.checked ? 'checked' : 'unchecked'}`);
  }
}

// Mac concrete products
class MacButton implements Button {
  render(): void {
    console.log('Rendering Mac-style button');
  }
  
  onClick(handler: () => void): void {
    console.log('Mac button clicked');
    handler();
  }
}

class MacCheckbox implements Checkbox {
  private checked = false;
  
  render(): void {
    console.log('Rendering Mac-style checkbox');
  }
  
  toggle(): void {
    this.checked = !this.checked;
    console.log(`Mac checkbox: ${this.checked ? 'checked' : 'unchecked'}`);
  }
}

// Abstract Factory
interface UIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// Concrete Factories
class WindowsUIFactory implements UIFactory {
  createButton(): Button {
    return new WindowsButton();
  }
  
  createCheckbox(): Checkbox {
    return new WindowsCheckbox();
  }
}

class MacUIFactory implements UIFactory {
  createButton(): Button {
    return new MacButton();
  }
  
  createCheckbox(): Checkbox {
    return new MacCheckbox();
  }
}

// Client code
class Application {
  private button: Button;
  private checkbox: Checkbox;
  
  constructor(factory: UIFactory) {
    this.button = factory.createButton();
    this.checkbox = factory.createCheckbox();
  }
  
  render(): void {
    this.button.render();
    this.checkbox.render();
  }
}

// Usage
const platform = process.platform;
let factory: UIFactory;

if (platform === 'darwin') {
  factory = new MacUIFactory();
} else {
  factory = new WindowsUIFactory();
}

const app = new Application(factory);
app.render();
// All UI components match the platform
```

## Real-World Examples

### Database Access Factory

```typescript
// Abstract products
interface Connection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

interface Query {
  execute(sql: string): Promise<any[]>;
}

interface Transaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// PostgreSQL products
class PostgresConnection implements Connection {
  async connect(): Promise<void> {
    console.log('Connected to PostgreSQL');
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnected from PostgreSQL');
  }
}

class PostgresQuery implements Query {
  async execute(sql: string): Promise<any[]> {
    console.log('Executing Postgres query:', sql);
    return [];
  }
}

class PostgresTransaction implements Transaction {
  async begin(): Promise<void> {
    console.log('BEGIN (Postgres)');
  }
  
  async commit(): Promise<void> {
    console.log('COMMIT (Postgres)');
  }
  
  async rollback(): Promise<void> {
    console.log('ROLLBACK (Postgres)');
  }
}

// MongoDB products
class MongoConnection implements Connection {
  async connect(): Promise<void> {
    console.log('Connected to MongoDB');
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnected from MongoDB');
  }
}

class MongoQuery implements Query {
  async execute(query: string): Promise<any[]> {
    console.log('Executing Mongo query:', query);
    return [];
  }
}

class MongoTransaction implements Transaction {
  async begin(): Promise<void> {
    console.log('Start Session (MongoDB)');
  }
  
  async commit(): Promise<void> {
    console.log('Commit Transaction (MongoDB)');
  }
  
  async rollback(): Promise<void> {
    console.log('Abort Transaction (MongoDB)');
  }
}

// Abstract Factory
interface DatabaseFactory {
  createConnection(): Connection;
  createQuery(): Query;
  createTransaction(): Transaction;
}

// Concrete Factories
class PostgresFactory implements DatabaseFactory {
  createConnection(): Connection {
    return new PostgresConnection();
  }
  
  createQuery(): Query {
    return new PostgresQuery();
  }
  
  createTransaction(): Transaction {
    return new PostgresTransaction();
  }
}

class MongoFactory implements DatabaseFactory {
  createConnection(): Connection {
    return new MongoConnection();
  }
  
  createQuery(): Query {
    return new MongoQuery();
  }
  
  createTransaction(): Transaction {
    return new MongoTransaction();
  }
}

// Usage
class DataService {
  private connection: Connection;
  private query: Query;
  private transaction: Transaction;
  
  constructor(factory: DatabaseFactory) {
    this.connection = factory.createConnection();
    this.query = factory.createQuery();
    this.transaction = factory.createTransaction();
  }
  
  async performOperation(): Promise<void> {
    await this.connection.connect();
    await this.transaction.begin();
    
    try {
      await this.query.execute('SELECT * FROM users');
      await this.transaction.commit();
    } catch (error) {
      await this.transaction.rollback();
    }
    
    await this.connection.disconnect();
  }
}

const dbType = process.env.DB_TYPE || 'postgres';
const factory = dbType === 'mongo' 
  ? new MongoFactory() 
  : new PostgresFactory();

const service = new DataService(factory);
await service.performOperation();
```

### Theme Factory (Light/Dark Mode)

```typescript
// Abstract products
interface Colors {
  primary: string;
  background: string;
  text: string;
}

interface Typography {
  fontFamily: string;
  fontSize: string;
}

interface Spacing {
  small: string;
  medium: string;
  large: string;
}

// Light theme products
class LightColors implements Colors {
  primary = '#007bff';
  background = '#ffffff';
  text = '#333333';
}

class LightTypography implements Typography {
  fontFamily = 'Arial, sans-serif';
  fontSize = '16px';
}

class LightSpacing implements Spacing {
  small = '8px';
  medium = '16px';
  large = '32px';
}

// Dark theme products
class DarkColors implements Colors {
  primary = '#0d6efd';
  background = '#1a1a1a';
  text = '#ffffff';
}

class DarkTypography implements Typography {
  fontFamily = 'Arial, sans-serif';
  fontSize = '16px';
}

class DarkSpacing implements Spacing {
  small = '8px';
  medium = '16px';
  large = '32px';
}

// Abstract Factory
interface ThemeFactory {
  createColors(): Colors;
  createTypography(): Typography;
  createSpacing(): Spacing;
}

// Concrete Factories
class LightThemeFactory implements ThemeFactory {
  createColors(): Colors {
    return new LightColors();
  }
  
  createTypography(): Typography {
    return new LightTypography();
  }
  
  createSpacing(): Spacing {
    return new LightSpacing();
  }
}

class DarkThemeFactory implements ThemeFactory {
  createColors(): Colors {
    return new DarkColors();
  }
  
  createTypography(): Typography {
    return new DarkTypography();
  }
  
  createSpacing(): Spacing {
    return new DarkSpacing();
  }
}

// Usage
class ThemeManager {
  private colors: Colors;
  private typography: Typography;
  private spacing: Spacing;
  
  constructor(factory: ThemeFactory) {
    this.colors = factory.createColors();
    this.typography = factory.createTypography();
    this.spacing = factory.createSpacing();
  }
  
  applyTheme(): void {
    console.log('Applying theme:');
    console.log('  Background:', this.colors.background);
    console.log('  Text:', this.colors.text);
    console.log('  Font:', this.typography.fontFamily);
    console.log('  Spacing:', this.spacing.medium);
  }
}

const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
const themeFactory = isDarkMode ? new DarkThemeFactory() : new LightThemeFactory();

const theme = new ThemeManager(themeFactory);
theme.applyTheme();
```

## Benefits

1. **Consistency**: All products from same family match
2. **Isolation**: Concrete classes isolated from client
3. **Flexibility**: Easy to switch families
4. **Single Responsibility**: Creation logic centralized

## When to Use

✅ **Use Abstract Factory when:**
- You have families of related products
- Products must be consistent (Windows button + Windows checkbox)
- You need to switch entire product families
- You want to enforce constraints (no mixing families)

❌ **Don't use Abstract Factory when:**
- Only one product type
- Products don't need to be related
- Adds unnecessary complexity

## Common Violations

```typescript
// ❌ BAD: Mixing factories
const button = windowsFactory.createButton();
const checkbox = macFactory.createCheckbox();  // Inconsistent!

// ✅ GOOD: Single factory for consistency
const factory = getFactory();
const button = factory.createButton();
const checkbox = factory.createCheckbox();
```

## The Mind-Shift

**Before**: Mix and match components randomly  
**After**: Create consistent product families

## Summary

**Abstract Factory Pattern**:
- Creates families of related objects
- Ensures consistency across products
- Easy to switch entire families
- Client depends on interfaces

**Key insight**: *Abstract Factory ensures products work together—when you need consistent families of objects, use an abstract factory to create matching sets.*

---

**Next**: [Builder Pattern](../builder.md)
