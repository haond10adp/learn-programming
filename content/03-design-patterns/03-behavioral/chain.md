# Chain of Responsibility Pattern

> *"Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request."*  
> — Gang of Four

## What is the Chain of Responsibility Pattern?

The **Chain of Responsibility** passes a request along a **chain of handlers**. Each handler decides whether to process the request or pass it to the next handler—like customer support where your issue goes through tiers (chatbot → agent → supervisor) until someone handles it.

```typescript
// Handler interface
interface Handler {
  setNext(handler: Handler): Handler;
  handle(request: string): string | null;
}

// Abstract handler
abstract class AbstractHandler implements Handler {
  private nextHandler?: Handler;
  
  setNext(handler: Handler): Handler {
    this.nextHandler = handler;
    return handler;
  }
  
  handle(request: string): string | null {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return null;
  }
}

// Concrete handlers
class MonkeyHandler extends AbstractHandler {
  handle(request: string): string | null {
    if (request === 'Banana') {
      return `Monkey: I'll eat the ${request}`;
    }
    return super.handle(request);
  }
}

class SquirrelHandler extends AbstractHandler {
  handle(request: string): string | null {
    if (request === 'Nut') {
      return `Squirrel: I'll eat the ${request}`;
    }
    return super.handle(request);
  }
}

class DogHandler extends AbstractHandler {
  handle(request: string): string | null {
    if (request === 'Bone') {
      return `Dog: I'll eat the ${request}`;
    }
    return super.handle(request);
  }
}

// Usage
const monkey = new MonkeyHandler();
const squirrel = new SquirrelHandler();
const dog = new DogHandler();

// Build chain: monkey → squirrel → dog
monkey.setNext(squirrel).setNext(dog);

// Test
console.log(monkey.handle('Nut'));     // Squirrel handles
console.log(monkey.handle('Banana'));  // Monkey handles
console.log(monkey.handle('Coffee'));  // No one handles → null
```

## Why This Matters

Chain of Responsibility is useful when:
- **Multiple handlers**: Several objects might handle request
- **Unknown handler**: Don't know which handler in advance
- **Dynamic chain**: Handlers can be added/removed at runtime
- **Avoid coupling**: Request sender doesn't know receiver

## The Philosophy

Think of Chain of Responsibility like **technical support escalation**: Level 1 support tries first, if they can't help, escalate to Level 2, then Level 3, and finally management. Each level has a chance to handle the issue, but if they can't, they pass it up the chain.

## Real-World Examples

### Authentication/Authorization Chain

```typescript
interface Request {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface AuthHandler {
  setNext(handler: AuthHandler): AuthHandler;
  handle(request: Request): boolean;
}

abstract class BaseAuthHandler implements AuthHandler {
  private nextHandler?: AuthHandler;
  
  setNext(handler: AuthHandler): AuthHandler {
    this.nextHandler = handler;
    return handler;
  }
  
  handle(request: Request): boolean {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    return true;  // End of chain, success
  }
}

class RateLimitHandler extends BaseAuthHandler {
  private attempts = new Map<string, number>();
  
  handle(request: Request): boolean {
    const count = this.attempts.get(request.username) || 0;
    
    if (count >= 5) {
      console.log('❌ Rate limit exceeded');
      return false;
    }
    
    this.attempts.set(request.username, count + 1);
    console.log('✅ Rate limit check passed');
    
    return super.handle(request);
  }
}

class AuthenticationHandler extends BaseAuthHandler {
  handle(request: Request): boolean {
    // Simulate authentication
    if (!request.username || !request.password) {
      console.log('❌ Invalid credentials');
      return false;
    }
    
    console.log('✅ Authentication passed');
    return super.handle(request);
  }
}

class AuthorizationHandler extends BaseAuthHandler {
  private allowedRoles: string[];
  
  constructor(allowedRoles: string[]) {
    super();
    this.allowedRoles = allowedRoles;
  }
  
  handle(request: Request): boolean {
    if (!this.allowedRoles.includes(request.role)) {
      console.log(`❌ Unauthorized: ${request.role} not allowed`);
      return false;
    }
    
    console.log('✅ Authorization passed');
    return super.handle(request);
  }
}

class EmailVerificationHandler extends BaseAuthHandler {
  handle(request: Request): boolean {
    if (!request.email.includes('@')) {
      console.log('❌ Invalid email');
      return false;
    }
    
    console.log('✅ Email verification passed');
    return super.handle(request);
  }
}

// Build authentication chain
const rateLimit = new RateLimitHandler();
const auth = new AuthenticationHandler();
const authz = new AuthorizationHandler(['admin', 'user']);
const emailVerif = new EmailVerificationHandler();

rateLimit.setNext(auth).setNext(emailVerif).setNext(authz);

// Test requests
const adminRequest: Request = {
  username: 'admin',
  password: 'secret',
  email: 'admin@example.com',
  role: 'admin'
};

console.log('\n=== Admin Request ===');
console.log('Result:', rateLimit.handle(adminRequest));

const guestRequest: Request = {
  username: 'guest',
  password: 'guest',
  email: 'guest@example.com',
  role: 'guest'
};

console.log('\n=== Guest Request ===');
console.log('Result:', rateLimit.handle(guestRequest));
```

### Middleware Chain (Express-style)

```typescript
type NextFunction = () => void;

interface Middleware {
  execute(request: any, response: any, next: NextFunction): void;
}

class LoggerMiddleware implements Middleware {
  execute(request: any, response: any, next: NextFunction): void {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
    next();
  }
}

class AuthMiddleware implements Middleware {
  execute(request: any, response: any, next: NextFunction): void {
    const token = request.headers.authorization;
    
    if (!token) {
      response.status = 401;
      response.body = { error: 'Unauthorized' };
      return;  // Stop chain
    }
    
    request.user = { id: '123', name: 'Alice' };
    next();
  }
}

class CorsMiddleware implements Middleware {
  execute(request: any, response: any, next: NextFunction): void {
    response.headers['Access-Control-Allow-Origin'] = '*';
    next();
  }
}

class BodyParserMiddleware implements Middleware {
  execute(request: any, response: any, next: NextFunction): void {
    if (request.body && typeof request.body === 'string') {
      try {
        request.body = JSON.parse(request.body);
      } catch (error) {
        response.status = 400;
        response.body = { error: 'Invalid JSON' };
        return;
      }
    }
    next();
  }
}

class App {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }
  
  handle(request: any, response: any): void {
    let index = 0;
    
    const next = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        middleware.execute(request, response, next);
      } else {
        // Final handler
        response.body = { message: 'Success', user: request.user };
      }
    };
    
    next();
  }
}

// Usage
const app = new App();
app.use(new LoggerMiddleware());
app.use(new CorsMiddleware());
app.use(new BodyParserMiddleware());
app.use(new AuthMiddleware());

const request = {
  method: 'POST',
  url: '/api/users',
  headers: { authorization: 'Bearer token123' },
  body: '{"name":"Alice"}'
};

const response = { headers: {}, status: 200, body: null };

app.handle(request, response);
console.log('Response:', response);
```

### Support Ticket Chain

```typescript
interface SupportTicket {
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface SupportHandler {
  setNext(handler: SupportHandler): SupportHandler;
  handle(ticket: SupportTicket): void;
}

abstract class BaseSupportHandler implements SupportHandler {
  protected nextHandler?: SupportHandler;
  
  setNext(handler: SupportHandler): SupportHandler {
    this.nextHandler = handler;
    return handler;
  }
  
  abstract canHandle(ticket: SupportTicket): boolean;
  abstract process(ticket: SupportTicket): void;
  
  handle(ticket: SupportTicket): void {
    if (this.canHandle(ticket)) {
      this.process(ticket);
    } else if (this.nextHandler) {
      console.log(`Escalating to next level...`);
      this.nextHandler.handle(ticket);
    } else {
      console.log('❌ No one can handle this ticket');
    }
  }
}

class Level1Support extends BaseSupportHandler {
  canHandle(ticket: SupportTicket): boolean {
    return ticket.priority === 'low';
  }
  
  process(ticket: SupportTicket): void {
    console.log(`Level 1: Handling low priority - "${ticket.issue}"`);
  }
}

class Level2Support extends BaseSupportHandler {
  canHandle(ticket: SupportTicket): boolean {
    return ticket.priority === 'medium';
  }
  
  process(ticket: SupportTicket): void {
    console.log(`Level 2: Handling medium priority - "${ticket.issue}"`);
  }
}

class Level3Support extends BaseSupportHandler {
  canHandle(ticket: SupportTicket): boolean {
    return ticket.priority === 'high';
  }
  
  process(ticket: SupportTicket): void {
    console.log(`Level 3: Handling high priority - "${ticket.issue}"`);
  }
}

class ManagerSupport extends BaseSupportHandler {
  canHandle(ticket: SupportTicket): boolean {
    return ticket.priority === 'critical';
  }
  
  process(ticket: SupportTicket): void {
    console.log(`🚨 Manager: Handling CRITICAL - "${ticket.issue}"`);
  }
}

// Build support chain
const level1 = new Level1Support();
const level2 = new Level2Support();
const level3 = new Level3Support();
const manager = new ManagerSupport();

level1.setNext(level2).setNext(level3).setNext(manager);

// Test tickets
level1.handle({ issue: 'Password reset', priority: 'low' });
level1.handle({ issue: 'Feature not working', priority: 'medium' });
level1.handle({ issue: 'Data loss', priority: 'critical' });
```

## Benefits

1. **Decoupling**: Sender doesn't know receiver
2. **Flexibility**: Easy to add/remove/reorder handlers
3. **Single Responsibility**: Each handler has one concern
4. **Dynamic chains**: Configure at runtime

## When to Use

✅ **Use Chain of Responsibility when:**
- Multiple objects might handle a request
- Don't know handler in advance
- Want to issue request without specifying receiver
- Set of handlers should be dynamic

❌ **Don't use Chain of Responsibility when:**
- Only one handler
- Order doesn't matter
- Every request must be handled (chain might drop it)

## Common Violations

```typescript
// ❌ BAD: Tightly coupled chain
class Handler1 {
  handle(request: any) {
    if (canHandle) {
      process();
    } else {
      new Handler2().handle(request);  // Tight coupling!
    }
  }
}

// ✅ GOOD: Loosely coupled
class Handler1 {
  private next?: Handler;
  
  handle(request: any) {
    if (canHandle) {
      process();
    } else if (this.next) {
      this.next.handle(request);
    }
  }
}
```

## The Mind-Shift

**Before**: Hardcode request routing  
**After**: Dynamic chain of handlers

## Summary

**Chain of Responsibility Pattern**:
- Pass request along chain of handlers
- Each handler decides to process or pass on
- Decouples sender from receivers
- Dynamic chain configuration
- Used for middleware, validation, support escalation

**Key insight**: *The Chain of Responsibility avoids coupling request sender to receiver—when multiple objects might handle a request, create a chain and let each decide whether to handle or pass it along.*

---

**Module 03 Complete!** All 15 design patterns covered. **Next**: Create Module 07 (Data Structures), Module 08 (Architecture), Module 10 (Performance).
