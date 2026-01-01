# Single Responsibility Principle (SRP)

> *"A class should have one, and only one, reason to change."*  
> — Robert C. Martin

## What Is It?

The Single Responsibility Principle states that a class should have **one responsibility** and **one reason to change**. Each class should do one thing well, and changes to one aspect of the system shouldn't require changes to unrelated classes.

## Why This Is Beautiful

SRP creates **clarity**:
- Each class has a clear purpose
- The name tells you what it does
- Reading the code is like reading prose
- Changes are localized and predictable

When a class has a single responsibility, it becomes a **pure concept**—elegant and focused.

## What Is a "Responsibility"?

A responsibility is a **reason to change**. Ask:
- "Why would this class need to change?"
- "Who are the stakeholders that care about this?"

If you can identify multiple, unrelated reasons for a class to change, it violates SRP.

### Example: Multiple Responsibilities

```typescript
// ❌ BAD: Employee class has multiple responsibilities
class Employee {
  constructor(
    public name: string,
    public salary: number,
    public role: string
  ) {}

  // Responsibility 1: Business logic (calculating pay)
  calculatePay(): number {
    return this.salary * 1.1; // With bonus
  }

  // Responsibility 2: Persistence (saving to database)
  save(): void {
    database.save(this);
  }

  // Responsibility 3: Reporting (generating report)
  generateReport(): string {
    return `Employee: ${this.name}, Salary: ${this.salary}`;
  }
}
```

**Problems:**
- CFO cares about `calculatePay` → might need to change
- DBA cares about `save` → might need to change  
- COO cares about `generateReport` → might need to change

**Three stakeholders, three reasons to change!**

### Example: Single Responsibilities

```typescript
// ✅ GOOD: Separate classes, each with one responsibility

// Responsibility 1: Business logic
class Employee {
  constructor(
    public name: string,
    public salary: number,
    public role: string
  ) {}

  calculatePay(): number {
    return this.salary * 1.1;
  }
}

// Responsibility 2: Persistence
class EmployeeRepository {
  save(employee: Employee): void {
    database.save(employee);
  }

  findById(id: number): Employee | null {
    return database.findById(id);
  }
}

// Responsibility 3: Reporting
class EmployeeReporter {
  generateReport(employee: Employee): string {
    return `Employee: ${employee.name}, Salary: ${employee.salary}`;
  }
}
```

**Benefits:**
- Change pay calculation? Edit `Employee` only
- Change database? Edit `EmployeeRepository` only
- Change report format? Edit `EmployeeReporter` only

Each class has **one stakeholder** and **one reason to change**.

## Cohesion and Coupling

SRP maximizes **cohesion** and minimizes **coupling**:

- **High cohesion**: Everything in the class relates to its single purpose
- **Low coupling**: Classes don't depend on each other's internals

```typescript
// High cohesion: All methods relate to payment calculation
class PayCalculator {
  calculateBasePay(salary: number): number { /* ... */ }
  calculateBonus(salary: number): number { /* ... */ }
  calculateTax(salary: number): number { /* ... */ }
  calculateNetPay(salary: number): number {
    const base = this.calculateBasePay(salary);
    const bonus = this.calculateBonus(salary);
    const tax = this.calculateTax(salary);
    return base + bonus - tax;
  }
}
```

## How to Identify Responsibilities

### 1. Look for "and" in Descriptions

If you describe a class with "and", it likely has multiple responsibilities:
- ❌ "This class validates **and** saves users"
- ❌ "This class fetches data **and** transforms it **and** displays it"

### 2. Count Reasons to Change

Ask: "What could cause this class to change?"
- Changes to business rules?
- Changes to data storage?
- Changes to UI formatting?
- Changes to external APIs?

More than one? Multiple responsibilities.

### 3. Look at Method Groups

If methods naturally group into unrelated categories, split the class:

```typescript
// ❌ Methods group into different concerns
class UserManager {
  // Group 1: Validation
  validateEmail(email: string): boolean { }
  validatePassword(password: string): boolean { }
  
  // Group 2: Persistence
  saveToDatabase(user: User): void { }
  loadFromDatabase(id: number): User { }
  
  // Group 3: Authentication
  hashPassword(password: string): string { }
  verifyPassword(hash: string, password: string): boolean { }
}

// ✅ Split into focused classes
class UserValidator { }
class UserRepository { }
class PasswordService { }
```

## Common Violations

### 1. God Objects

Classes that do everything:

```typescript
// ❌ The "do everything" class
class ApplicationManager {
  initializeDatabase() { }
  loadConfiguration() { }
  startWebServer() { }
  scheduleBackgroundJobs() { }
  setupLogging() { }
  handleUserRequests() { }
  generateReports() { }
  sendEmails() { }
}
```

**Fix**: Split into focused classes for each concern.

### 2. Mixed Abstraction Levels

Combining high-level logic with low-level details:

```typescript
// ❌ Mixing abstraction levels
class OrderProcessor {
  processOrder(order: Order): void {
    // High-level: Business logic
    if (order.total > 100) {
      order.discount = 10;
    }
    
    // Low-level: SQL details
    const sql = `INSERT INTO orders VALUES (${order.id}, ${order.total})`;
    database.execute(sql);
    
    // High-level: Business logic
    this.notifyCustomer(order);
  }
}

// ✅ Separate concerns
class OrderProcessor {
  constructor(private repository: OrderRepository) {}
  
  processOrder(order: Order): void {
    this.applyDiscounts(order);
    this.repository.save(order);
    this.notifyCustomer(order);
  }
}

class OrderRepository {
  save(order: Order): void {
    // Low-level SQL details isolated here
  }
}
```

### 3. Utility Classes

"Helper" or "Util" classes often violate SRP:

```typescript
// ❌ Random collection of utilities
class Utils {
  formatDate(date: Date): string { }
  validateEmail(email: string): boolean { }
  calculateTax(amount: number): number { }
  sendEmail(to: string, body: string): void { }
}

// ✅ Focused utility classes
class DateFormatter { }
class EmailValidator { }
class TaxCalculator { }
class EmailService { }
```

## When to Split?

Don't split prematurely! Split when:

1. **Multiple stakeholders** care about different parts
2. **Changes happen frequently** and affect different parts
3. **Class is hard to understand** due to multiple concerns
4. **Testing is difficult** because of tangled dependencies

If a class is small and cohesive, even if it could theoretically be split, **don't**. Premature splitting creates unnecessary complexity.

## The Mind-Shift

**Before understanding SRP:**
- "This class should handle everything related to User"
- Classes are organized by **data** (User, Order, Product)

**After understanding SRP:**
- "Each class should have one job"
- Classes are organized by **behavior** (Validator, Repository, Calculator)

This is lifechanging because you stop thinking in terms of "objects that hold data" and start thinking in terms of "objects that do one thing well."

## Real-World Example: User Management

### Before (Violates SRP)

```typescript
class User {
  constructor(
    public id: number,
    public email: string,
    public passwordHash: string
  ) {}

  // Validation
  isValidEmail(): boolean {
    return this.email.includes('@');
  }

  // Authentication
  checkPassword(password: string): boolean {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Persistence
  save(): void {
    database.execute(`UPDATE users SET email = '${this.email}'`);
  }

  // Presentation
  toJSON(): object {
    return { id: this.id, email: this.email };
  }

  // Business logic
  canAccessAdmin(): boolean {
    return this.email.endsWith('@admin.com');
  }
}
```

### After (Follows SRP)

```typescript
// Data structure (just data)
interface User {
  id: number;
  email: string;
  passwordHash: string;
}

// Validation
class EmailValidator {
  isValid(email: string): boolean {
    return email.includes('@') && email.includes('.');
  }
}

// Authentication
class PasswordService {
  hash(password: string): string {
    return bcrypt.hash(password, 10);
  }

  verify(password: string, hash: string): boolean {
    return bcrypt.compare(password, hash);
  }
}

// Persistence
class UserRepository {
  save(user: User): void {
    database.execute('UPDATE users SET ...', [user]);
  }

  findById(id: number): User | null {
    return database.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// Presentation
class UserSerializer {
  toJSON(user: User): object {
    return { id: user.id, email: user.email };
  }
}

// Business logic
class UserPermissions {
  canAccessAdmin(user: User): boolean {
    return user.email.endsWith('@admin.com');
  }
}
```

Each class now has **one responsibility** and **one reason to change**.

## Benefits of SRP

1. **Easier to understand**: Each class is simple
2. **Easier to test**: Test one thing at a time
3. **Easier to change**: Changes are localized
4. **Better reusability**: Small, focused classes are reusable
5. **Reduced coupling**: Classes depend on less

## Pitfalls

### 1. Over-splitting

Don't create a class for every method:

```typescript
// ❌ Too granular
class EmailDomainExtractor { }
class EmailLocalPartExtractor { }
class EmailAtSymbolValidator { }

// ✅ Reasonable granularity
class EmailValidator { }
```

### 2. Wrong Abstraction

Sometimes what looks like one responsibility is actually two:

```typescript
// Looks like SRP, but...
class UserAuthenticator {
  authenticate(email: string, password: string): boolean {
    // Actually does: Validation + Authentication + Session creation
  }
}

// Better separation
class UserAuthenticator {
  constructor(
    private validator: CredentialValidator,
    private passwordService: PasswordService,
    private sessionManager: SessionManager
  ) {}
  
  authenticate(email: string, password: string): boolean {
    // Coordinates, but delegates each responsibility
  }
}
```

## AI-Era Relevance

### What AI Does
- Generates classes with multiple responsibilities
- Creates "convenient" all-in-one classes
- Mixes concerns without thinking

### What You Must Do
- **Review**: Does this class have one responsibility?
- **Refactor**: Split classes with multiple concerns
- **Guide**: Prompt AI to create focused classes
- **Recognize**: Identify SRP violations in generated code

## Exercises

1. **Identify responsibilities** in a UserController that handles validation, authentication, and response formatting
2. **Refactor** a Report class that fetches data, processes it, and generates PDF
3. **Design** a payment system following SRP
4. **Critique** AI-generated code for SRP violations

## Summary

**Single Responsibility Principle** means:
- One class = one responsibility
- One class = one reason to change
- High cohesion within classes
- Low coupling between classes

When in doubt, ask: **"Why would this class change?"**

If you find multiple unrelated answers, you've found multiple responsibilities.

---

**Next**: [Open/Closed Principle](../02-open-closed.md)
