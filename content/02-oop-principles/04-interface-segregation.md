# Interface Segregation Principle (ISP)

> *"No client should be forced to depend on methods it does not use."*  
> — Robert C. Martin

## What Is It?

The Interface Segregation Principle states that **clients should not be forced to implement interfaces they don't use**. Instead of one large, "fat" interface, create multiple small, focused interfaces.

In simpler terms: **Many specific interfaces are better than one general-purpose interface.**

## Why This Is Beautiful

ISP creates **freedom**:
- Classes implement only what they need
- Changes don't affect unrelated code
- Interfaces become focused and cohesive
- Coupling is minimized

When ISP is followed, interfaces become lightweight contracts that guide design without imposing unnecessary burdens.

## The Problem: Fat Interfaces

```typescript
// ❌ Fat interface that forces implementations to support everything
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  getSalary(): number;
  takeVacation(days: number): void;
}

// Human worker needs everything
class HumanWorker implements Worker {
  work(): void { console.log('Working'); }
  eat(): void { console.log('Eating'); }
  sleep(): void { console.log('Sleeping'); }
  getSalary(): number { return 50000; }
  takeVacation(days: number): void { console.log(`Vacation: ${days} days`); }
}

// ❌ Robot doesn't eat, sleep, or take vacation!
class RobotWorker implements Worker {
  work(): void { console.log('Working tirelessly'); }
  
  // Forced to implement these, even though they don't make sense
  eat(): void { throw new Error('Robots don\'t eat'); }
  sleep(): void { throw new Error('Robots don\'t sleep'); }
  getSalary(): number { return 0; }
  takeVacation(days: number): void { throw new Error('Robots don\'t vacation'); }
}
```

**Problems**:
1. RobotWorker must implement methods it doesn't need
2. If we add methods to Worker, ALL implementations must change
3. Throws exceptions at runtime (fragile)
4. Violates SRP (interface has multiple reasons to change)

## The Solution: Segregated Interfaces

```typescript
// ✅ Small, focused interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface Payable {
  getSalary(): number;
}

interface Vacationable {
  takeVacation(days: number): void;
}

// Human implements all
class HumanWorker implements Workable, Eatable, Sleepable, Payable, Vacationable {
  work(): void { console.log('Working'); }
  eat(): void { console.log('Eating'); }
  sleep(): void { console.log('Sleeping'); }
  getSalary(): number { return 50000; }
  takeVacation(days: number): void { console.log(`Vacation: ${days} days`); }
}

// Robot implements only what it needs
class RobotWorker implements Workable {
  work(): void { console.log('Working tirelessly'); }
}

// Contractor might work and get paid, but not take vacation
class ContractorWorker implements Workable, Payable {
  work(): void { console.log('Working on contract'); }
  getSalary(): number { return 75000; }
}
```

**Benefits**:
- Each class implements only what makes sense
- No forced methods
- No runtime exceptions
- Clear contracts

## Real-World Example: Multi-Function Printer

Classic ISP violation:

```typescript
// ❌ God interface
interface Machine {
  print(document: Document): void;
  scan(document: Document): void;
  fax(document: Document): void;
  staple(document: Document): void;
}

// Modern all-in-one printer can do everything
class AllInOnePrinter implements Machine {
  print(document: Document): void { /* ... */ }
  scan(document: Document): void { /* ... */ }
  fax(document: Document): void { /* ... */ }
  staple(document: Document): void { /* ... */ }
}

// ❌ Simple printer is forced to implement scan, fax, staple!
class SimplePrinter implements Machine {
  print(document: Document): void { /* Works */ }
  
  // Forced to implement these
  scan(document: Document): void {
    throw new Error('SimplePrinter cannot scan');
  }
  fax(document: Document): void {
    throw new Error('SimplePrinter cannot fax');
  }
  staple(document: Document): void {
    throw new Error('SimplePrinter cannot staple');
  }
}
```

**Better design:**

```typescript
// ✅ Segregated interfaces
interface Printer {
  print(document: Document): void;
}

interface Scanner {
  scan(document: Document): void;
}

interface Fax {
  fax(document: Document): void;
}

interface Stapler {
  staple(document: Document): void;
}

// Simple printer implements only what it can do
class SimplePrinter implements Printer {
  print(document: Document): void {
    console.log('Printing...');
  }
}

// All-in-one implements multiple interfaces
class AllInOnePrinter implements Printer, Scanner, Fax, Stapler {
  print(document: Document): void { /* ... */ }
  scan(document: Document): void { /* ... */ }
  fax(document: Document): void { /* ... */ }
  staple(document: Document): void { /* ... */ }
}

// Scanner-printer implements two interfaces
class ScannerPrinter implements Printer, Scanner {
  print(document: Document): void { /* ... */ }
  scan(document: Document): void { /* ... */ }
}
```

Now clients can depend on exactly what they need:

```typescript
// Only needs printing
function printDocument(printer: Printer, doc: Document): void {
  printer.print(doc);
}

// Needs both printing and scanning
function copyDocument(device: Printer & Scanner, doc: Document): void {
  const scanned = device.scan(doc);
  device.print(scanned);
}
```

## Role Interfaces

ISP encourages **role-based interfaces**: design interfaces based on how clients will use them, not on what objects *are*.

```typescript
// ❌ Data-centric (what object IS)
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
  billingInfo: BillingInfo;
  
  authenticate(password: string): boolean;
  updateProfile(data: ProfileData): void;
  updateBilling(data: BillingInfo): void;
  changePassword(newPassword: string): void;
}

// All clients see everything!
class UserService {
  displayUserProfile(user: User): void {
    // Only needs name and email, but sees password, billing, etc.
    console.log(`${user.name} (${user.email})`);
  }
}
```

**Better: Role interfaces**

```typescript
// ✅ Behavior-centric (what client NEEDS)
interface Authenticatable {
  authenticate(password: string): boolean;
}

interface ProfileReadable {
  id: string;
  name: string;
  email: string;
}

interface ProfileUpdatable {
  updateProfile(data: ProfileData): void;
}

interface BillingManageable {
  billingInfo: BillingInfo;
  updateBilling(data: BillingInfo): void;
}

// Full user implements all roles
class User implements 
  Authenticatable, 
  ProfileReadable, 
  ProfileUpdatable, 
  BillingManageable 
{
  // Full implementation
}

// Services depend on specific roles
class ProfileDisplayService {
  displayProfile(user: ProfileReadable): void {
    console.log(`${user.name} (${user.email})`);
    // Cannot access password, billing, etc.
  }
}

class AuthenticationService {
  login(user: Authenticatable, password: string): boolean {
    return user.authenticate(password);
    // Cannot access profile, billing, etc.
  }
}
```

**Benefits**:
- Principle of Least Privilege
- Clear boundaries
- Easy to test (mock only what's needed)
- Changes to billing don't affect profile display

## ISP and Dependency Inversion

ISP works hand-in-hand with DIP:

```typescript
// ❌ High-level code depends on concrete details
class OrderProcessor {
  constructor(
    private database: MySQLDatabase // Concrete!
  ) {}

  processOrder(order: Order): void {
    // Uses only save(), but depends on entire MySQLDatabase
    this.database.save(order);
  }
}
```

**With ISP + DIP:**

```typescript
// ✅ Define minimal interface needed
interface OrderRepository {
  save(order: Order): void;
}

class OrderProcessor {
  constructor(
    private repository: OrderRepository // Abstract + minimal!
  ) {}

  processOrder(order: Order): void {
    this.repository.save(order);
  }
}

// MySQLDatabase implements the role
class MySQLOrderRepository implements OrderRepository {
  save(order: Order): void {
    // MySQL-specific implementation
  }
}
```

## When to Split Interfaces

Split when:
1. **Different clients use different methods**
2. **Methods change for different reasons**
3. **Implementing all methods doesn't make sense**
4. **Interface has multiple cohesive groups**

```typescript
// ❌ Should be split
interface Database {
  // User management
  createUser(user: User): void;
  updateUser(user: User): void;
  deleteUser(id: string): void;
  
  // Product management
  createProduct(product: Product): void;
  updateProduct(product: Product): void;
  deleteProduct(id: string): void;
  
  // Order management
  createOrder(order: Order): void;
  updateOrder(order: Order): void;
  deleteOrder(id: string): void;
}

// ✅ Split by domain
interface UserRepository {
  createUser(user: User): void;
  updateUser(user: User): void;
  deleteUser(id: string): void;
}

interface ProductRepository {
  createProduct(product: Product): void;
  updateProduct(product: Product): void;
  deleteProduct(id: string): void;
}

interface OrderRepository {
  createOrder(order: Order): void;
  updateOrder(order: Order): void;
  deleteOrder(id: string): void;
}
```

## TypeScript Specific: Interface Composition

TypeScript makes ISP beautiful with intersection types:

```typescript
// Small, focused interfaces
interface Identifiable {
  id: string;
}

interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface Deletable {
  isDeleted: boolean;
  deletedAt?: Date;
}

// Compose as needed
type User = Identifiable & Timestamped & Deletable & {
  name: string;
  email: string;
};

type Product = Identifiable & Timestamped & {
  name: string;
  price: number;
};

// Functions depend on minimal interfaces
function logId(entity: Identifiable): void {
  console.log(entity.id);
}

function trackTimestamp(entity: Timestamped): void {
  console.log(`Created: ${entity.createdAt}`);
}

// Works with any matching type
const user: User = {
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false
};

logId(user); // ✅
trackTimestamp(user); // ✅
```

## Common Violations

### 1. Marker Interfaces With Behavior

```typescript
// ❌ Interface is both marker and behavior
interface Serializable {
  toJSON(): string;
  toXML(): string;
  toCSV(): string;
  toYAML(): string;
}

// Most classes only need one format!
class User implements Serializable {
  toJSON(): string { return JSON.stringify(this); }
  toXML(): string { throw new Error('Not implemented'); }
  toCSV(): string { throw new Error('Not implemented'); }
  toYAML(): string { throw new Error('Not implemented'); }
}

// ✅ Better
interface JSONSerializable {
  toJSON(): string;
}

interface XMLSerializable {
  toXML(): string;
}

class User implements JSONSerializable {
  toJSON(): string {
    return JSON.stringify(this);
  }
}
```

### 2. God Interfaces in Frameworks

```typescript
// ❌ Framework forces you to implement everything
interface Component {
  onInit(): void;
  onMount(): void;
  onUpdate(): void;
  onUnmount(): void;
  onError(error: Error): void;
  shouldUpdate(): boolean;
  render(): HTML;
}

// Most components don't need all lifecycle methods!

// ✅ Better: Optional or separate interfaces
interface Component {
  render(): HTML;
}

interface Initializable {
  onInit(): void;
}

interface Mountable {
  onMount(): void;
  onUnmount(): void;
}

interface Updatable {
  onUpdate(): void;
  shouldUpdate(): boolean;
}
```

## The Mind-Shift

**Before ISP:**
- "Create comprehensive interfaces"
- "Put all related methods together"
- "One interface per entity"

**After ISP:**
- "Create minimal interfaces based on client needs"
- "Split by usage patterns"
- "Many small interfaces > one large interface"
- "Design from client's perspective"

This is lifechanging because you start thinking about **how code will be used** rather than **what objects contain**.

## Testing Benefits

ISP makes testing easier:

```typescript
// With ISP
interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

class UserRegistration {
  constructor(private emailSender: EmailSender) {}
  
  async register(user: User): Promise<void> {
    // Register logic...
    await this.emailSender.send(user.email, 'Welcome!', 'Thanks for joining!');
  }
}

// Test: Only mock what's needed
class MockEmailSender implements EmailSender {
  async send(to: string, subject: string, body: string): Promise<void> {
    console.log(`Mock sent to ${to}`);
  }
}

// Easy to test with minimal mock
const registration = new UserRegistration(new MockEmailSender());
```

## Benefits

1. **Focused**: Interfaces have single, clear purpose
2. **Flexible**: Implementations choose what to support
3. **Decoupled**: Changes don't ripple through unrelated code
4. **Testable**: Easy to mock minimal interfaces
5. **Discoverable**: Clear what each interface does

## AI-Era Relevance

### What AI Does
- Creates monolithic interfaces
- Copies all methods from examples
- Doesn't think about client needs

### What You Must Do
- **Review**: Does client need all methods?
- **Split**: Break fat interfaces into focused ones
- **Guide**: Prompt for minimal interfaces
- **Refactor**: Replace god interfaces with role interfaces

## Summary

**Interface Segregation Principle** means:
- Many specific interfaces > one general interface
- Clients depend only on what they use
- Design interfaces based on client needs
- Split interfaces by usage patterns

**Key question**: *"Does every client need every method in this interface?"*

If the answer is no, split the interface.

---

**Next**: [Dependency Inversion Principle](../05-dependency-inversion.md)
