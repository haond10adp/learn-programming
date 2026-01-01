# AI Capabilities and Limitations

> *"AI writes code. Humans write specifications."*

## What AI Can Do

**AI coding assistants** like GitHub Copilot, ChatGPT, and Claude can generate code from natural language descriptions. They excel at certain tasks while struggling with others.

```typescript
// Prompt: "Create a function that validates email addresses"
// AI generates:
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Prompt: "Add a User class with validation"
// AI generates:
class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string
  ) {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email');
    }
    if (name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
  }
}
```

## Why This Matters

Understanding AI's capabilities helps you:
- **Leverage strengths**: Use AI for what it does well
- **Compensate for weaknesses**: Provide what AI can't
- **Review effectively**: Know where to look for problems
- **Design systems**: Make architectural decisions AI can't

## What AI Does Well

### 1. Boilerplate Code

```typescript
// Prompt: "Create CRUD repository for User"
// AI excels at standard patterns:

interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

class PostgresUserRepository implements UserRepository {
  constructor(private db: Database) {}
  
  async create(user: User): Promise<User> {
    const result = await this.db.query(
      'INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING *',
      [user.id, user.email, user.name]
    );
    return result.rows[0];
  }
  
  // ... AI generates all CRUD operations
}
```

### 2. Common Patterns

```typescript
// Prompt: "Implement singleton pattern"
class Database {
  private static instance: Database;
  
  private constructor() {}
  
  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

// Prompt: "Add builder pattern for User"
class UserBuilder {
  private id?: string;
  private email?: string;
  private name?: string;
  
  withId(id: string): this {
    this.id = id;
    return this;
  }
  
  withEmail(email: string): this {
    this.email = email;
    return this;
  }
  
  withName(name: string): this {
    this.name = name;
    return this;
  }
  
  build(): User {
    if (!this.id || !this.email || !this.name) {
      throw new Error('Missing required fields');
    }
    return new User(this.id, this.email, this.name);
  }
}
```

### 3. Type Conversions

```typescript
// Prompt: "Convert this API response to typed User"
interface ApiUserResponse {
  user_id: string;
  email_address: string;
  full_name: string;
  created_at: string;
}

function apiResponseToUser(response: ApiUserResponse): User {
  return {
    id: response.user_id,
    email: response.email_address,
    name: response.full_name,
    createdAt: new Date(response.created_at)
  };
}
```

### 4. Test Scaffolding

```typescript
// Prompt: "Write tests for User class"
describe('User', () => {
  test('creates user with valid data', () => {
    const user = new User('1', 'test@example.com', 'Test User');
    expect(user.email).toBe('test@example.com');
  });
  
  test('throws error for invalid email', () => {
    expect(() => new User('1', 'invalid', 'Test')).toThrow('Invalid email');
  });
  
  test('throws error for empty name', () => {
    expect(() => new User('1', 'test@example.com', '')).toThrow('Name cannot be empty');
  });
});
```

### 5. Documentation

```typescript
// Prompt: "Add JSDoc comments"
/**
 * Validates an email address format.
 * 
 * @param email - The email address to validate
 * @returns true if email is valid, false otherwise
 * 
 * @example
 * ```ts
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid') // false
 * ```
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### 6. Refactoring

```typescript
// Prompt: "Extract validation logic to separate functions"

// Before (AI sees this):
class User {
  constructor(email: string, password: string) {
    if (email.length < 3 || !email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (password.length < 8 || !/[A-Z]/.test(password)) {
      throw new Error('Weak password');
    }
  }
}

// After (AI generates):
function validateEmail(email: string): void {
  if (email.length < 3 || !email.includes('@')) {
    throw new Error('Invalid email');
  }
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error('Password too short');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain uppercase');
  }
}

class User {
  constructor(email: string, password: string) {
    validateEmail(email);
    validatePassword(password);
  }
}
```

## What AI Struggles With

### 1. System Architecture

AI can't decide:

```typescript
// You must decide:
// - Monolith or microservices?
// - REST or GraphQL?
// - SQL or NoSQL?
// - Event-driven or request-response?

// AI can implement AFTER you decide:
class EventBus {
  // AI generates implementation
}
```

### 2. Business Logic

```typescript
// Complex domain rules require YOUR understanding:

// Prompt: "Calculate shipping cost"
// AI might generate generic logic, but YOU must specify:
// - Free shipping over $50? $100?
// - International rates?
// - Weight vs. dimensional weight?
// - Hazmat surcharges?

function calculateShipping(order: Order): number {
  // AI needs YOUR business rules
}
```

### 3. Performance Optimization

```typescript
// AI might generate naive implementation:
function findUsers(query: string): User[] {
  return users.filter(u => 
    u.name.includes(query) || 
    u.email.includes(query)
  ); // Linear search!
}

// YOU optimize:
function findUsers(query: string): User[] {
  return userIndex.search(query); // Use index
}
```

### 4. Security

```typescript
// AI might generate insecure code:
async function getUser(id: string) {
  const query = `SELECT * FROM users WHERE id = '${id}'`; // SQL injection!
  return await db.query(query);
}

// YOU fix:
async function getUser(id: string) {
  return await db.query(
    'SELECT * FROM users WHERE id = $1',
    [id] // Parameterized query
  );
}
```

### 5. Edge Cases

```typescript
// AI generates happy path:
function divide(a: number, b: number): number {
  return a / b;
}

// YOU add edge cases:
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Invalid input');
  }
  return a / b;
}
```

### 6. Cross-Cutting Concerns

```typescript
// AI generates feature code:
async function createUser(data: CreateUserDto): Promise<User> {
  const user = await db.save(data);
  return user;
}

// YOU add:
async function createUser(data: CreateUserDto): Promise<User> {
  logger.info('Creating user', { email: data.email }); // Logging
  
  const user = await db.save(data);
  
  await eventBus.publish('UserCreated', { userId: user.id }); // Events
  
  metrics.increment('users.created'); // Metrics
  
  return user;
}
```

## The Generation vs. Understanding Gap

### AI Generates

```typescript
// AI can write this:
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}
```

### You Understand

- Time complexity: O(n log n) average, O(n²) worst
- Space complexity: O(n) due to slicing
- When to use vs. merge sort
- Trade-offs with built-in `.sort()`
- How to optimize (in-place sorting)

## When to Use AI

### ✅ Use AI For:

- **Boilerplate**: CRUD operations, getters/setters
- **Standard patterns**: Singleton, Factory, Builder
- **Type definitions**: Converting schemas, API types
- **Test templates**: Basic test structure
- **Documentation**: JSDoc, README sections
- **Refactoring**: Extract method, rename
- **Learning**: "Explain this code"

### ❌ Don't Rely On AI For:

- **Architecture decisions**: System design, tech stack
- **Business logic**: Domain rules, calculations
- **Security**: Authentication, authorization, validation
- **Performance**: Optimization, caching strategies
- **Error handling**: Recovery strategies
- **Integration**: How systems connect
- **Trade-off analysis**: Cost, complexity, maintainability

## AI as a Tool, Not a Replacement

### The Carpenter Analogy

```typescript
// AI is like a power tool:
// - Nail gun vs hammer: Faster, not better judgment
// - You still decide: Where to place the nail
// - You still inspect: Is it secure?
// - You still design: The structure

// Human: Designs the house
// AI: Hammers the nails

// Prompt: "Create user authentication"
// AI generates login code
// YOU decide: JWT vs sessions, expiration, refresh tokens
// YOU verify: Security, edge cases, error handling
```

## Limitations in Context

### Context Window

AI has limited memory of conversation:

```typescript
// Earlier in conversation:
// "We're using a repository pattern with dependency injection"

// Later:
// "Add user creation"

// AI might forget the pattern and generate:
async function createUser(email: string) {
  const db = new Database(); // Forgot about DI!
  return await db.save({ email });
}

// YOU catch and correct:
class UserService {
  constructor(private repository: UserRepository) {}
  
  async createUser(email: string): Promise<User> {
    return await this.repository.save({ email });
  }
}
```

### Consistency

AI might generate inconsistent code:

```typescript
// First generation uses async/await:
async function getUser(id: string): Promise<User> {
  return await repository.findById(id);
}

// Second generation uses .then():
function deleteUser(id: string): Promise<void> {
  return repository.delete(id).then(() => {});
}

// YOU enforce consistency
```

### Latest APIs

AI training has a cutoff date:

```typescript
// AI might suggest old API:
fetch(url).then(res => res.json()).then(data => {
  // Handles data
});

// You use newer patterns:
const response = await fetch(url);
const data = await response.json();
```

## The Mind-Shift

**Before understanding AI limits:**
- "AI will write all my code!"
- Blindly accept generated code
- Skip learning fundamentals

**After:**
- "AI assists, I architect"
- Critically review generated code
- Learn deeply to guide AI

## Summary

**AI Capabilities**:
- Excels at: Boilerplate, patterns, refactoring
- Struggles with: Architecture, business logic, security
- Generates code, can't design systems
- Tool to amplify, not replace, your skills

**Key insight**: *AI is a powerful code generator, but it can't replace understanding—the programmers who thrive with AI are those who know what to ask for, what to accept, what to modify, and what to reject.*

---

**Next**: [Effective Prompt Engineering](../02-prompts.md)
