# Builder Pattern

> *"Separate the construction of a complex object from its representation."*  
> — Gang of Four

## What is the Builder Pattern?

The **Builder pattern** constructs complex objects step by step. Instead of a massive constructor with many parameters, you build the object gradually, setting only the properties you need.

```typescript
// Without Builder - constructor hell
const user = new User('Alice', 'alice@example.com', '123-456-7890', '123 Main St', 25, true, 'premium');

// With Builder - fluent and clear
const user = new UserBuilder()
  .setName('Alice')
  .setEmail('alice@example.com')
  .setPhone('123-456-7890')
  .setAge(25)
  .build();
```

## Why This Matters

Builder is useful when:
- **Many parameters**: Constructor with 5+ parameters
- **Optional parameters**: Not all properties required
- **Complex construction**: Multi-step process
- **Immutability**: Build once, then freeze
- **Validation**: Check before creating

## The Philosophy

Think of Builder like **ordering a custom sandwich**: "I want whole wheat bread, turkey, lettuce, tomato, mayo—hold the onions." You specify what you want step by step, and the sandwich maker assembles it. The menu (constructor) would be overwhelming if it listed every possible combination.

## Basic Implementation

### Simple Builder

```typescript
interface User {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  age?: number;
  isActive: boolean;
}

class UserBuilder {
  private user: Partial<User> = {
    isActive: true  // Default value
  };
  
  setName(name: string): this {
    this.user.name = name;
    return this;
  }
  
  setEmail(email: string): this {
    this.user.email = email;
    return this;
  }
  
  setPhone(phone: string): this {
    this.user.phone = phone;
    return this;
  }
  
  setAddress(address: string): this {
    this.user.address = address;
    return this;
  }
  
  setAge(age: number): this {
    this.user.age = age;
    return this;
  }
  
  setActive(isActive: boolean): this {
    this.user.isActive = isActive;
    return this;
  }
  
  build(): User {
    // Validate required fields
    if (!this.user.name) {
      throw new Error('Name is required');
    }
    if (!this.user.email) {
      throw new Error('Email is required');
    }
    
    return this.user as User;
  }
}

// Usage
const user = new UserBuilder()
  .setName('Alice')
  .setEmail('alice@example.com')
  .setPhone('123-456-7890')
  .build();

console.log(user);
```

### Type-Safe Builder (TypeScript)

```typescript
// Ensure required fields are set
type RequiredFields = 'name' | 'email';
type OptionalFields = 'phone' | 'address' | 'age';

class TypeSafeUserBuilder {
  private data: Partial<User> = { isActive: true };
  
  name(value: string): Omit<TypeSafeUserBuilder, 'name'> & { email(v: string): TypeSafeUserBuilder } {
    this.data.name = value;
    return this as any;
  }
  
  email(value: string): TypeSafeUserBuilder {
    this.data.email = value;
    return this;
  }
  
  phone(value: string): this {
    this.data.phone = value;
    return this;
  }
  
  age(value: number): this {
    this.data.age = value;
    return this;
  }
  
  build(): User {
    return this.data as User;
  }
}

// TypeScript enforces calling name() and email()
const user = new TypeSafeUserBuilder()
  .name('Alice')      // Must call
  .email('alice@...')  // Must call
  .phone('123...')     // Optional
  .build();
```

## Real-World Examples

### Query Builder

```typescript
interface Query {
  table: string;
  select?: string[];
  where?: Record<string, any>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;
  offset?: number;
}

class QueryBuilder {
  private query: Partial<Query> = {};
  
  from(table: string): this {
    this.query.table = table;
    return this;
  }
  
  select(...fields: string[]): this {
    this.query.select = fields;
    return this;
  }
  
  where(conditions: Record<string, any>): this {
    this.query.where = { ...this.query.where, ...conditions };
    return this;
  }
  
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.orderBy = { field, direction };
    return this;
  }
  
  limit(limit: number): this {
    this.query.limit = limit;
    return this;
  }
  
  offset(offset: number): this {
    this.query.offset = offset;
    return this;
  }
  
  build(): Query {
    if (!this.query.table) {
      throw new Error('Table is required');
    }
    return this.query as Query;
  }
  
  toSQL(): string {
    const q = this.build();
    let sql = `SELECT ${q.select?.join(', ') || '*'} FROM ${q.table}`;
    
    if (q.where) {
      const conditions = Object.entries(q.where)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ');
      sql += ` WHERE ${conditions}`;
    }
    
    if (q.orderBy) {
      sql += ` ORDER BY ${q.orderBy.field} ${q.orderBy.direction}`;
    }
    
    if (q.limit) {
      sql += ` LIMIT ${q.limit}`;
    }
    
    if (q.offset) {
      sql += ` OFFSET ${q.offset}`;
    }
    
    return sql;
  }
}

// Usage
const query = new QueryBuilder()
  .from('users')
  .select('id', 'name', 'email')
  .where({ isActive: true, age: 25 })
  .orderBy('name', 'ASC')
  .limit(10)
  .toSQL();

console.log(query);
// SELECT id, name, email FROM users WHERE isActive = 'true' AND age = '25' ORDER BY name ASC LIMIT 10
```

### HTTP Request Builder

```typescript
interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}

class RequestBuilder {
  private request: Partial<HttpRequest> = {
    method: 'GET',
    headers: {}
  };
  
  get(url: string): this {
    this.request.method = 'GET';
    this.request.url = url;
    return this;
  }
  
  post(url: string): this {
    this.request.method = 'POST';
    this.request.url = url;
    return this;
  }
  
  put(url: string): this {
    this.request.method = 'PUT';
    this.request.url = url;
    return this;
  }
  
  delete(url: string): this {
    this.request.method = 'DELETE';
    this.request.url = url;
    return this;
  }
  
  header(key: string, value: string): this {
    this.request.headers![key] = value;
    return this;
  }
  
  headers(headers: Record<string, string>): this {
    this.request.headers = { ...this.request.headers, ...headers };
    return this;
  }
  
  json(body: any): this {
    this.request.body = JSON.stringify(body);
    this.request.headers!['Content-Type'] = 'application/json';
    return this;
  }
  
  timeout(ms: number): this {
    this.request.timeout = ms;
    return this;
  }
  
  build(): HttpRequest {
    if (!this.request.url) {
      throw new Error('URL is required');
    }
    return this.request as HttpRequest;
  }
  
  async send(): Promise<Response> {
    const req = this.build();
    return await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      signal: req.timeout ? AbortSignal.timeout(req.timeout) : undefined
    });
  }
}

// Usage
const response = await new RequestBuilder()
  .post('https://api.example.com/users')
  .header('Authorization', 'Bearer token123')
  .json({ name: 'Alice', email: 'alice@example.com' })
  .timeout(5000)
  .send();
```

### Email Builder

```typescript
interface Email {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHTML: boolean;
  attachments?: string[];
}

class EmailBuilder {
  private email: Partial<Email> = {
    to: [],
    isHTML: false
  };
  
  from(address: string): this {
    this.email.from = address;
    return this;
  }
  
  to(...addresses: string[]): this {
    this.email.to = [...(this.email.to || []), ...addresses];
    return this;
  }
  
  cc(...addresses: string[]): this {
    this.email.cc = [...(this.email.cc || []), ...addresses];
    return this;
  }
  
  bcc(...addresses: string[]): this {
    this.email.bcc = [...(this.email.bcc || []), ...addresses];
    return this;
  }
  
  subject(subject: string): this {
    this.email.subject = subject;
    return this;
  }
  
  body(body: string): this {
    this.email.body = body;
    return this;
  }
  
  html(html: string): this {
    this.email.body = html;
    this.email.isHTML = true;
    return this;
  }
  
  attach(filename: string): this {
    this.email.attachments = [...(this.email.attachments || []), filename];
    return this;
  }
  
  build(): Email {
    if (!this.email.from) throw new Error('From address required');
    if (!this.email.to?.length) throw new Error('At least one recipient required');
    if (!this.email.subject) throw new Error('Subject required');
    if (!this.email.body) throw new Error('Body required');
    
    return this.email as Email;
  }
  
  async send(): Promise<void> {
    const email = this.build();
    console.log('Sending email:', email);
    // In real app, send via email service
  }
}

// Usage
await new EmailBuilder()
  .from('sender@example.com')
  .to('alice@example.com', 'bob@example.com')
  .cc('manager@example.com')
  .subject('Meeting Tomorrow')
  .html('<h1>Don\'t forget!</h1><p>Meeting at 10 AM</p>')
  .attach('agenda.pdf')
  .send();
```

## Benefits

1. **Readability**: Clear what's being set
2. **Flexibility**: Set only what you need
3. **Validation**: Check constraints before building
4. **Immutability**: Object built once
5. **Default values**: Easy to provide

## When to Use

✅ **Use Builder when:**
- Constructor has many parameters (5+)
- Many optional parameters
- Complex construction process
- Want immutable objects
- Need validation before creation

❌ **Don't use Builder when:**
- Simple objects (2-3 required fields)
- No optional parameters
- Adds unnecessary complexity

## Common Violations

```typescript
// ❌ BAD: Constructor with too many parameters
new User('Alice', 'alice@...', '123...', '123 Main', 25, true, 'premium', 'US', 'enabled');

// ✅ GOOD: Builder with clear property names
new UserBuilder()
  .setName('Alice')
  .setEmail('alice@...')
  .setCountry('US')
  .build();
```

## The Mind-Shift

**Before**: Overwhelming constructors  
**After**: Step-by-step, clear construction

## Summary

**Builder Pattern**:
- Constructs complex objects step by step
- Fluent API with method chaining
- Validates before building
- Clear and readable
- Handles optional parameters elegantly

**Key insight**: *The Builder pattern makes complex object creation manageable—when constructors become unwieldy, use a builder for clear, flexible construction.*

---

**Next**: [Prototype Pattern](../prototype.md)
