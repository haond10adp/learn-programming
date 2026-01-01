# Proxy Pattern

> *"Provide a surrogate or placeholder for another object to control access to it."*  
> — Gang of Four

## What is the Proxy Pattern?

The **Proxy pattern** provides a **substitute or placeholder** for another object. The proxy controls access to the real object, adding functionality like lazy loading, access control, caching, or logging—like a secretary who screens calls before connecting you to the CEO.

```typescript
interface Image {
  display(): void;
}

// Real object (expensive to create)
class RealImage implements Image {
  constructor(private filename: string) {
    this.loadFromDisk();
  }
  
  private loadFromDisk() {
    console.log(`Loading image: ${this.filename}`);
    // Expensive operation
  }
  
  display() {
    console.log(`Displaying: ${this.filename}`);
  }
}

// Proxy (controls access)
class ImageProxy implements Image {
  private realImage?: RealImage;
  
  constructor(private filename: string) {}
  
  display() {
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename);  // Lazy loading
    }
    this.realImage.display();
  }
}

// Usage
const image: Image = new ImageProxy('photo.jpg');
// Image not loaded yet
image.display();  // Now it's loaded and displayed
image.display();  // Uses already loaded image
```

## Why This Matters

Proxy is useful for:
- **Lazy initialization**: Create expensive objects only when needed
- **Access control**: Check permissions before accessing
- **Caching**: Store results to avoid repeated operations
- **Logging**: Record access to objects
- **Remote proxy**: Represent object in different address space

## The Philosophy

Think of Proxy like a **credit card**: it's a proxy for your bank account. You don't carry your actual money—the card controls access, adds security (PIN), logs transactions, and defers payment (lazy loading of actual money transfer).

## Types of Proxies

### 1. Virtual Proxy (Lazy Loading)

```typescript
interface VideoPlayer {
  play(): void;
}

class RealVideoPlayer implements VideoPlayer {
  constructor(private videoUrl: string) {
    this.download();
  }
  
  private download() {
    console.log(`Downloading video from ${this.videoUrl}...`);
    // Expensive download
  }
  
  play() {
    console.log('Playing video');
  }
}

class VideoPlayerProxy implements VideoPlayer {
  private player?: RealVideoPlayer;
  
  constructor(private videoUrl: string) {}
  
  play() {
    // Download only when play() is called
    if (!this.player) {
      this.player = new RealVideoPlayer(this.videoUrl);
    }
    this.player.play();
  }
}

// Usage
const video = new VideoPlayerProxy('https://example.com/video.mp4');
// No download yet
console.log('Video created');
video.play();  // Now downloads and plays
```

### 2. Protection Proxy (Access Control)

```typescript
interface Document {
  read(): string;
  write(content: string): void;
  delete(): void;
}

class RealDocument implements Document {
  constructor(private content: string = '') {}
  
  read() {
    return this.content;
  }
  
  write(content: string) {
    this.content = content;
  }
  
  delete() {
    this.content = '';
  }
}

class DocumentProxy implements Document {
  constructor(
    private document: RealDocument,
    private userRole: 'admin' | 'user' | 'guest'
  ) {}
  
  read() {
    // Everyone can read
    return this.document.read();
  }
  
  write(content: string) {
    if (this.userRole === 'admin' || this.userRole === 'user') {
      this.document.write(content);
    } else {
      throw new Error('Permission denied: Guests cannot write');
    }
  }
  
  delete() {
    if (this.userRole === 'admin') {
      this.document.delete();
    } else {
      throw new Error('Permission denied: Only admins can delete');
    }
  }
}

// Usage
const doc = new RealDocument('Secret content');

const adminProxy = new DocumentProxy(doc, 'admin');
adminProxy.write('Updated content');  // Allowed
adminProxy.delete();                   // Allowed

const guestProxy = new DocumentProxy(doc, 'guest');
console.log(guestProxy.read());       // Allowed
guestProxy.write('Hacked!');           // Error: Permission denied
```

### 3. Caching Proxy

```typescript
interface Database {
  query(sql: string): any[];
}

class RealDatabase implements Database {
  query(sql: string): any[] {
    console.log('Executing query:', sql);
    // Expensive database operation
    return [{ id: 1, name: 'Alice' }];
  }
}

class CachingDatabaseProxy implements Database {
  private cache = new Map<string, any[]>();
  
  constructor(private database: RealDatabase) {}
  
  query(sql: string): any[] {
    if (this.cache.has(sql)) {
      console.log('Cache hit:', sql);
      return this.cache.get(sql)!;
    }
    
    console.log('Cache miss:', sql);
    const result = this.database.query(sql);
    this.cache.set(sql, result);
    return result;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

// Usage
const db = new CachingDatabaseProxy(new RealDatabase());
db.query('SELECT * FROM users');  // Cache miss, queries DB
db.query('SELECT * FROM users');  // Cache hit, no DB query
```

### 4. Logging Proxy

```typescript
interface Service {
  operation(data: any): any;
}

class RealService implements Service {
  operation(data: any): any {
    console.log('Performing operation');
    return { result: 'success', data };
  }
}

class LoggingServiceProxy implements Service {
  constructor(private service: RealService) {}
  
  operation(data: any): any {
    const start = Date.now();
    
    console.log('Before operation:', data);
    
    try {
      const result = this.service.operation(data);
      
      const duration = Date.now() - start;
      console.log('After operation:', result);
      console.log(`Duration: ${duration}ms`);
      
      return result;
    } catch (error) {
      console.error('Operation failed:', error);
      throw error;
    }
  }
}

// Usage
const service = new LoggingServiceProxy(new RealService());
service.operation({ userId: '123' });
// Logs before, result, and duration
```

### 5. Remote Proxy (API Client)

```typescript
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Real service would be on remote server
class RemoteUserServiceProxy implements UserService {
  constructor(private apiUrl: string) {}
  
  async getUser(id: string): Promise<User> {
    const response = await fetch(`${this.apiUrl}/users/${id}`);
    return await response.json();
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${this.apiUrl}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
}

// Usage - feels like local object
const userService: UserService = new RemoteUserServiceProxy('https://api.example.com');
const user = await userService.getUser('123');
await userService.updateUser('123', { name: 'New Name' });
```

## Benefits

1. **Control**: Add logic before/after real object access
2. **Lazy loading**: Create expensive objects only when needed
3. **Security**: Check permissions
4. **Caching**: Improve performance
5. **Separation**: Proxy logic separate from real object

## When to Use

✅ **Use Proxy when:**
- Expensive object creation (lazy loading)
- Access control needed
- Logging/monitoring required
- Caching improves performance
- Remote object representation

❌ **Don't use Proxy when:**
- No need for access control
- Direct access is simpler
- Adds unnecessary indirection

## Common Violations

```typescript
// ❌ BAD: No interface - can't substitute
class RealObject {
  operation() {}
}

class Proxy {
  // Different interface!
  doOperation() {}
}

// ✅ GOOD: Same interface
interface Service {
  operation(): void;
}

class RealService implements Service {
  operation() {}
}

class ServiceProxy implements Service {
  operation() {}
}
```

## The Mind-Shift

**Before**: Direct access to objects  
**After**: Controlled access through proxy

## Summary

**Proxy Pattern**:
- Provides surrogate for another object
- Controls access to real object
- Same interface as real object
- Types: Virtual, Protection, Caching, Logging, Remote
- Adds functionality without changing real object

**Key insight**: *The Proxy pattern controls access—when you need to add control, logging, caching, or lazy loading around an object, use a proxy that stands in for it.*

---

**Next**: [Composite Pattern](../composite.md)
