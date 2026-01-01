# Effective Prompt Engineering

> *"The quality of AI-generated code depends on the quality of your prompts."*

## What Is Prompt Engineering?

**Prompt engineering** is the practice of writing clear, specific instructions to get useful code from AI. Good prompts provide context, constraints, and examples.

```typescript
// ❌ Bad prompt: "make a user class"

// ✅ Good prompt:
/*
Create a User class with:
- Properties: id (string), email (string), name (string), createdAt (Date)
- Constructor that validates:
  - Email must match standard regex
  - Name must not be empty
  - CreatedAt defaults to now if not provided
- Immutable properties (readonly)
- Throw descriptive errors for validation failures
*/

class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date()
  ) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    if (name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
  }
}
```

## Why This Matters

Good prompts:
- **Save time**: Get correct code faster
- **Reduce errors**: Specify constraints upfront
- **Match conventions**: Maintain code style
- **Teach patterns**: Show AI your standards

## Elements of Good Prompts

### 1. Be Specific

```typescript
// ❌ Vague
"Create a function to sort users"

// ✅ Specific
"Create a function sortUsersByName that:
- Takes an array of User objects
- Sorts by name property (case-insensitive, ascending)
- Returns a new array (doesn't mutate original)
- TypeScript with full type annotations"

function sortUsersByName(users: User[]): User[] {
  return [...users].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}
```

### 2. Provide Context

```typescript
// ❌ No context
"Add error handling"

// ✅ With context
"We're using a Result<T, E> pattern for error handling (no exceptions).
Update this function to return Result<User, ValidationError>:

function createUser(email: string, name: string): User {
  const user = new User(generateId(), email, name);
  return user;
}"

// AI generates:
function createUser(email: string, name: string): Result<User, ValidationError> {
  try {
    const user = new User(generateId(), email, name);
    return ok(user);
  } catch (error) {
    return err(new ValidationError(error.message));
  }
}
```

### 3. Show Examples

```typescript
// ❌ Just ask
"Create a validator"

// ✅ Show pattern
"Following this pattern:

function validateEmail(email: string): ValidationResult {
  if (email.length === 0) {
    return { valid: false, errors: ['Email is required'] };
  }
  if (!email.includes('@')) {
    return { valid: false, errors: ['Invalid email format'] };
  }
  return { valid: true };
}

Create validatePassword that checks:
- Minimum 8 characters
- At least one uppercase letter
- At least one number"

function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  
  return errors.length > 0
    ? { valid: false, errors }
    : { valid: true };
}
```

### 4. Specify Constraints

```typescript
// Prompt with constraints:
"Create a function findUsersByRole that:
- Uses the existing UserRepository interface (don't create new one)
- Returns Promise<User[]>
- Handles the case where no users are found (return empty array, not null)
- Add JSDoc documentation
- Use async/await (not .then())
- Maximum 10 lines of code"

/**
 * Finds all users with the specified role.
 * 
 * @param repository - The user repository to query
 * @param role - The role to filter by
 * @returns Promise resolving to array of matching users (empty if none found)
 */
async function findUsersByRole(
  repository: UserRepository,
  role: string
): Promise<User[]> {
  const allUsers = await repository.findAll();
  return allUsers.filter(user => user.role === role);
}
```

## Prompt Patterns

### Pattern 1: Incremental Building

```typescript
// Step 1: Basic structure
"Create a ShoppingCart class with an array to store items"

class ShoppingCart {
  private items: Item[] = [];
}

// Step 2: Add functionality
"Add methods: addItem, removeItem, getTotal"

class ShoppingCart {
  private items: Item[] = [];
  
  addItem(item: Item): void {
    this.items.push(item);
  }
  
  removeItem(itemId: string): void {
    this.items = this.items.filter(item => item.id !== itemId);
  }
  
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}

// Step 3: Refine
"Make addItem handle quantity, update if item exists"

class ShoppingCart {
  private items: Map<string, { item: Item; quantity: number }> = new Map();
  
  addItem(item: Item, quantity: number = 1): void {
    const existing = this.items.get(item.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(item.id, { item, quantity });
    }
  }
  
  // ...
}
```

### Pattern 2: "Following This Pattern"

```typescript
// Prompt:
"Following this repository pattern:

class UserRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User | null> {
    const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
}

Create ProductRepository with findById, findAll, and save methods"

// AI generates following the pattern:
class ProductRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  }
  
  async findAll(): Promise<Product[]> {
    const result = await this.db.query('SELECT * FROM products');
    return result.rows;
  }
  
  async save(product: Product): Promise<void> {
    await this.db.query(
      'INSERT INTO products (id, name, price) VALUES ($1, $2, $3)',
      [product.id, product.name, product.price]
    );
  }
}
```

### Pattern 3: "Fix This Code"

```typescript
// Prompt:
"This code has a bug. Fix it and explain what was wrong:

function calculateAverage(numbers: number[]): number {
  let sum = 0;
  for (let i = 0; i <= numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}"

// AI responds:
"Bug: Loop condition should be `i < numbers.length`, not `i <=`.
This causes an off-by-one error, accessing `numbers[numbers.length]` which is undefined.

Fixed:

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error('Cannot calculate average of empty array');
  }
  
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i];
  }
  return sum / numbers.length;
}

Also added validation for empty array."
```

### Pattern 4: "Convert From X to Y"

```typescript
// Prompt:
"Convert this callback-based code to async/await:

function getUserData(userId: string, callback: (error: Error | null, data?: UserData) => void) {
  fetchUser(userId, (err, user) => {
    if (err) return callback(err);
    fetchOrders(user.id, (err, orders) => {
      if (err) return callback(err);
      callback(null, { user, orders });
    });
  });
}"

// AI converts:
async function getUserData(userId: string): Promise<UserData> {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(user.id);
  return { user, orders };
}
```

### Pattern 5: "Add Tests For"

```typescript
// Prompt:
"Add comprehensive tests for this function:

function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}"

// AI generates:
describe('divide', () => {
  test('divides positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
    expect(divide(15, 3)).toBe(5);
  });
  
  test('divides negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
    expect(divide(10, -2)).toBe(-5);
    expect(divide(-10, -2)).toBe(5);
  });
  
  test('divides by 1', () => {
    expect(divide(10, 1)).toBe(10);
  });
  
  test('divides zero', () => {
    expect(divide(0, 5)).toBe(0);
  });
  
  test('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
  
  test('handles decimals', () => {
    expect(divide(5, 2)).toBe(2.5);
  });
});
```

## Iterative Refinement

### First Try

```typescript
// Prompt: "Create a user registration function"

async function register(email: string, password: string): Promise<User> {
  const user = new User(generateId(), email, password);
  await saveUser(user);
  return user;
}
```

### Refine: Add Validation

```typescript
// Prompt: "Add email and password validation"

async function register(email: string, password: string): Promise<User> {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  if (password.length < 8) {
    throw new Error('Password too short');
  }
  
  const user = new User(generateId(), email, password);
  await saveUser(user);
  return user;
}
```

### Refine: Check Duplicates

```typescript
// Prompt: "Check if email already exists before creating user"

async function register(email: string, password: string): Promise<User> {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email');
  }
  if (password.length < 8) {
    throw new Error('Password too short');
  }
  
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }
  
  const user = new User(generateId(), email, password);
  await saveUser(user);
  return user;
}
```

### Refine: Use Result Type

```typescript
// Prompt: "Convert to return Result<User, RegistrationError> instead of throwing"

async function register(
  email: string,
  password: string
): Promise<Result<User, RegistrationError>> {
  if (!isValidEmail(email)) {
    return err(new RegistrationError('Invalid email'));
  }
  if (password.length < 8) {
    return err(new RegistrationError('Password too short'));
  }
  
  const existing = await findUserByEmail(email);
  if (existing) {
    return err(new RegistrationError('Email already registered'));
  }
  
  const user = new User(generateId(), email, password);
  await saveUser(user);
  return ok(user);
}
```

## Domain-Specific Prompts

### For TypeScript

```typescript
// Specify TypeScript requirements:
"Create a generic function in TypeScript that:
- Uses strict type constraints
- Has proper type inference
- Uses readonly where appropriate
- Includes type guards if needed"

function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    return {
      ...groups,
      [key]: [...(groups[key] || []), item]
    };
  }, {} as Record<K, T[]>);
}
```

### For Testing

```typescript
// Prompt:
"Write tests using Vitest that:
- Use describe/test blocks
- Have descriptive test names
- Test happy path and edge cases
- Use beforeEach for setup if needed
- Mock external dependencies"
```

### For React Components

```typescript
// Prompt:
"Create a TypeScript React component that:
- Uses functional components with hooks
- Has proper TypeScript props interface
- Handles loading and error states
- Is accessible (proper aria labels)
- Follows React best practices"
```

## Common Pitfalls

### Pitfall 1: Assuming AI Understands Your Codebase

```typescript
// ❌ Vague reference
"Update the user service to use the new repository pattern"
// AI doesn't know what your repository pattern is

// ✅ Explicit
"Update UserService to accept UserRepository in constructor:

interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

Current code:
class UserService {
  async getUser(id: string): Promise<User> {
    const user = await database.query('SELECT...');
    return user;
  }
}"
```

### Pitfall 2: Over-Complicated Single Prompt

```typescript
// ❌ Too much at once
"Create a complete e-commerce system with products, cart, checkout, payment processing, order management, inventory, and shipping"

// ✅ Break down
"First, create a Product class with id, name, price, and quantity"
// Then iterate from there
```

### Pitfall 3: Accepting First Output

```typescript
// AI generates:
function processPayment(amount: number): boolean {
  // Process payment
  return true;
}

// ❌ Accept as-is

// ✅ Refine:
"This needs to:
- Be async (actual payment takes time)
- Return detailed result (success/failure with reason)
- Handle errors properly
- Validate amount > 0"
```

## Best Practices

### 1. Provide Type Definitions

```typescript
// Include relevant types in prompt:
"Given these types:

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

Create a function to fetch a user and return ApiResponse<User>"
```

### 2. Specify Error Handling

```typescript
"Create a function that:
- Returns Result<T, E> (our error handling pattern)
- Never throws exceptions
- Provides descriptive error messages
- Handles all failure cases"
```

### 3. Request Explanations

```typescript
"Create this function AND explain:
- Why you chose this approach
- What edge cases are handled
- Any performance considerations
- Possible improvements"
```

### 4. Ask for Alternatives

```typescript
"Provide 3 different implementations of a cache:
1. Simple in-memory Map
2. LRU cache with size limit
3. TTL-based cache
Explain trade-offs of each"
```

## The Mind-Shift

**Before learning prompt engineering:**
- Vague requests
- Accept first output
- Frustrated with results

**After:**
- Specific, contextual prompts
- Iterative refinement
- High-quality generated code

## Summary

**Effective Prompt Engineering**:
- Be specific with requirements
- Provide context and examples
- Specify constraints and patterns
- Iterate and refine
- Request explanations

**Key insight**: *AI generates code based on your instructions—the clearer and more specific your prompts, the better the generated code, making prompt engineering a crucial skill for AI-assisted development.*

---

**Next**: [Reviewing AI-Generated Code](../03-reviewing.md)
