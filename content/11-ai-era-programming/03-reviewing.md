# Reviewing AI-Generated Code

> *"Trust but verify—AI generates code, but you must review it."*

## What Is Code Review for AI?

**AI code review** means critically evaluating generated code for correctness, security, performance, maintainability, and alignment with your standards before accepting it.

```typescript
// AI generates this. What's wrong?
function getUserById(id: string) {
  const query = `SELECT * FROM users WHERE id = '${id}'`;
  return database.execute(query);
}

// Issues:
// 1. SQL injection vulnerability
// 2. Missing return type annotation
// 3. No error handling
// 4. Synchronous (should be async)
// 5. Returns raw database result (not typed User)

// After review and fixes:
async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await database.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw new DatabaseError('User fetch failed', { cause: error });
  }
}
```

## Why This Matters

AI makes mistakes:
- **Security vulnerabilities**: Injection, XSS, auth bypasses
- **Logic errors**: Off-by-one, edge cases missed
- **Performance issues**: Inefficient algorithms, memory leaks
- **Type safety**: Loose types, any abuse
- **Best practices**: Inconsistent patterns

You must catch these before they reach production.

## What to Check

### 1. Correctness

```typescript
// AI generates:
function calculateDiscount(price: number, percentage: number): number {
  return price - percentage;
}

// ❌ WRONG: Subtracts percentage value, not percentage of price!

// ✅ Correct:
function calculateDiscount(price: number, percentage: number): number {
  return price * (1 - percentage);
}

// Test to verify:
expect(calculateDiscount(100, 0.1)).toBe(90); // 10% off
```

### 2. Type Safety

```typescript
// AI generates:
function processData(data: any) {
  return data.map((item: any) => item.value);
}

// ❌ Uses `any`, no type safety!

// ✅ Proper types:
interface DataItem {
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### 3. Edge Cases

```typescript
// AI generates:
function getFirstElement<T>(arr: T[]): T {
  return arr[0];
}

// ❌ Doesn't handle empty array!

// ✅ Handle edge case:
function getFirstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Or throw:
function getFirstElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('Cannot get first element of empty array');
  }
  return arr[0];
}
```

### 4. Security

```typescript
// AI generates:
app.get('/user/:id', (req, res) => {
  const html = `<h1>User ${req.params.id}</h1>`;
  res.send(html);
});

// ❌ XSS vulnerability! User input directly in HTML

// ✅ Escape or use template engine:
app.get('/user/:id', (req, res) => {
  const safeId = escapeHtml(req.params.id);
  const html = `<h1>User ${safeId}</h1>`;
  res.send(html);
});

// Or better, use template engine with auto-escaping
```

### 5. Error Handling

```typescript
// AI generates:
async function fetchUserData(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;
}

// ❌ No error handling!

// ✅ Handle errors:
async function fetchUserData(id: string): Promise<Result<User, FetchError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      return err(new FetchError(
        `HTTP ${response.status}: ${response.statusText}`
      ));
    }
    
    const data = await response.json();
    return ok(data);
  } catch (error) {
    return err(new FetchError('Network error', { cause: error }));
  }
}
```

### 6. Performance

```typescript
// AI generates:
function findDuplicates(arr: number[]): number[] {
  const duplicates: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// ❌ O(n³) complexity! Nested loops + includes()

// ✅ O(n) with Set:
function findDuplicates(arr: number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  
  for (const num of arr) {
    if (seen.has(num)) {
      duplicates.add(num);
    } else {
      seen.add(num);
    }
  }
  
  return Array.from(duplicates);
}
```

## Common AI Mistakes

### Mistake 1: SQL Injection

```typescript
// AI often generates:
async function findUsersByName(name: string) {
  return await db.query(`SELECT * FROM users WHERE name = '${name}'`);
}

// ✅ Fix: Parameterized queries
async function findUsersByName(name: string): Promise<User[]> {
  return await db.query(
    'SELECT * FROM users WHERE name = $1',
    [name]
  );
}
```

### Mistake 2: Missing Validation

```typescript
// AI generates:
class BankAccount {
  withdraw(amount: number): void {
    this.balance -= amount;
  }
}

// ❌ No validation!

// ✅ Validate:
class BankAccount {
  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }
}
```

### Mistake 3: Mutation

```typescript
// AI generates:
function sortUsers(users: User[]): User[] {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

// ❌ Mutates original array!

// ✅ Don't mutate:
function sortUsers(users: User[]): User[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}
```

### Mistake 4: Resource Leaks

```typescript
// AI generates:
async function processFile(path: string) {
  const file = await fs.open(path, 'r');
  const content = await file.readFile();
  return content;
}

// ❌ File never closed!

// ✅ Always cleanup:
async function processFile(path: string): Promise<string> {
  const file = await fs.open(path, 'r');
  try {
    const content = await file.readFile('utf-8');
    return content;
  } finally {
    await file.close();
  }
}
```

### Mistake 5: Race Conditions

```typescript
// AI generates:
let counter = 0;

async function incrementCounter() {
  const current = counter;
  await someAsyncOperation();
  counter = current + 1;
}

// ❌ Race condition!

// ✅ Atomic operation or lock:
let counter = 0;

async function incrementCounter() {
  counter++; // Atomic
  await someAsyncOperation();
}
```

## Review Checklist

### Security
- [ ] No SQL injection (parameterized queries)
- [ ] No XSS (escape user input)
- [ ] No command injection
- [ ] Authentication/authorization checks
- [ ] Input validation
- [ ] No sensitive data in logs
- [ ] Proper error messages (don't leak internals)

### Correctness
- [ ] Logic is correct
- [ ] Edge cases handled
- [ ] Off-by-one errors checked
- [ ] Null/undefined checks
- [ ] Proper comparisons (=== not ==)

### Type Safety
- [ ] No `any` types (or justified)
- [ ] Proper return types
- [ ] Null safety
- [ ] Type guards where needed
- [ ] Generics properly constrained

### Error Handling
- [ ] Try/catch for async operations
- [ ] Errors are descriptive
- [ ] Resources cleaned up
- [ ] Errors propagated correctly
- [ ] No swallowed errors

### Performance
- [ ] Reasonable algorithm complexity
- [ ] No unnecessary iterations
- [ ] Efficient data structures
- [ ] No memory leaks
- [ ] Database queries optimized

### Maintainability
- [ ] Clear naming
- [ ] Appropriate comments
- [ ] Not too complex
- [ ] Follows team conventions
- [ ] Testable design

## Testing AI Code

```typescript
// Always write tests for AI-generated code:

// AI generates:
function isPalindrome(str: string): boolean {
  const reversed = str.split('').reverse().join('');
  return str === reversed;
}

// You write tests:
describe('isPalindrome', () => {
  test('detects palindromes', () => {
    expect(isPalindrome('racecar')).toBe(true);
    expect(isPalindrome('level')).toBe(true);
  });
  
  test('detects non-palindromes', () => {
    expect(isPalindrome('hello')).toBe(false);
  });
  
  test('handles empty string', () => {
    expect(isPalindrome('')).toBe(true);
  });
  
  test('handles single character', () => {
    expect(isPalindrome('a')).toBe(true);
  });
  
  test('is case-sensitive', () => {
    expect(isPalindrome('Racecar')).toBe(false); // If this fails, refine!
  });
});
```

## Refining AI Code

### Before

```typescript
// AI's first attempt:
function processOrder(order) {
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  if (total > 100) {
    total = total * 0.9;
  }
  return total;
}
```

### After Review and Refinement

```typescript
interface Order {
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
}

function calculateOrderTotal(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );
  
  // Apply 10% discount for orders over $100
  const discount = subtotal > 100 ? 0.1 : 0;
  return subtotal * (1 - discount);
}
```

## When to Accept vs. Reject

### ✅ Accept When:
- Logic is correct
- Types are proper
- Edge cases handled
- Security checked
- Performance adequate
- Matches conventions

### ❌ Reject When:
- Security vulnerabilities
- Incorrect logic
- Missing edge cases
- Performance issues
- Type safety problems
- Doesn't fit architecture

### 🔧 Refine When:
- Minor type improvements needed
- Better naming possible
- Missing comments
- Can be more efficient
- Doesn't match style

## Automated Checks

### Linting

```json
// .eslintrc.json
{
  "rules": {
    "no-any": "error",
    "no-explicit-any": "error",
    "@typescript-strict/no-unsafe-member-access": "error"
  }
}
```

### Type Checking

```bash
npx tsc --noEmit --strict
```

### Security Scanning

```bash
npm audit
npx snyk test
```

### Code Quality

```bash
npx sonarqube-scanner
```

## The Mind-Shift

**Before systematic review:**
- Accept AI code blindly
- Discover bugs in production
- Security incidents
- Technical debt accumulates

**After:**
- Critical evaluation
- Catch issues early
- Secure, correct code
- Maintainable codebase

## Summary

**Reviewing AI Code**:
- Check correctness, security, performance
- Look for common mistakes (SQL injection, XSS, validation)
- Test thoroughly
- Refine types and edge cases
- Use automated tools

**Key insight**: *AI-generated code is a first draft—your review transforms it from "works mostly" to "works correctly," catching security issues, logic errors, and design problems before they reach production.*

---

**Next**: [AI and Design Patterns](../04-patterns.md)
