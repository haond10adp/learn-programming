# Encapsulation

> *"Hide what varies."*  
> — Gang of Four

## What Is It?

**Encapsulation** is the bundling of data and methods that operate on that data within a single unit (class), and **restricting direct access** to some of the object's components.

In simpler terms: **Hide internal details, expose only what's necessary.**

Core ideas:
1. **Information Hiding**: Internal state is private
2. **Interface**: Public methods provide controlled access
3. **Abstraction**: Clients use the interface, not implementation

## Why This Is Beautiful

Encapsulation creates **safety**:
- Internal state cannot be corrupted
- Changes to internals don't break clients
- Clear boundaries between public and private
- Easier to reason about code

When encapsulation is strong, objects become **black boxes** with well-defined interfaces—safe to use, easy to change internally.

## Without Encapsulation

```typescript
// ❌ No encapsulation: Everything public
class BankAccount {
  balance: number = 0; // Public!

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }
}

// Direct access allows corruption
const account = new BankAccount(1000);
account.balance = -500; // ❌ Negative balance!
account.balance = 999999999; // ❌ Arbitrary amount!
```

**Problems**:
1. No validation
2. No control over state changes
3. Clients depend on internal structure
4. Can't change implementation without breaking clients

## With Encapsulation

```typescript
// ✅ Encapsulation: Private state, public interface
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

// Safe to use
const account = new BankAccount(1000);
account.deposit(500);    // ✅ 1500
account.withdraw(200);   // ✅ 1300
// account.balance = -500; // ❌ Compile error!
```

**Benefits**:
- Validation at all entry points
- Impossible to create invalid state
- Can change internal implementation freely
- Clear, safe interface

## Access Modifiers

TypeScript provides three access modifiers:

### `public` (default)
```typescript
class Example {
  public name: string; // Accessible everywhere
  
  public greet(): void {
    console.log(`Hello, ${this.name}`);
  }
}
```

### `private`
```typescript
class Example {
  private secret: string = 'hidden'; // Only accessible within this class
  
  public revealSecret(): string {
    return this.secret; // OK: within same class
  }
}

const ex = new Example();
// ex.secret; // ❌ Compile error
```

### `protected`
```typescript
class Parent {
  protected value: number = 42; // Accessible in this class and subclasses
}

class Child extends Parent {
  showValue(): number {
    return this.value; // ✅ OK: subclass can access
  }
}

const child = new Child();
// child.value; // ❌ Compile error
```

### `#` (Private Fields - ES2022)
```typescript
class Example {
  #reallyPrivate: string = 'hidden'; // True private (runtime)
  
  showPrivate(): string {
    return this.#reallyPrivate;
  }
}

// Enforced at runtime, not just compile-time
```

**Difference**:
- `private`: TypeScript compile-time only
- `#`: JavaScript runtime enforcement

## Information Hiding

The goal is to **minimize the exposed surface area**:

```typescript
// ❌ Too much exposure
class User {
  public firstName: string;
  public lastName: string;
  public age: number;
  public email: string;
  public passwordHash: string; // Exposed!
  
  constructor(/* ... */) {
    // ...
  }
}

// Client code depends on internal structure
function displayUser(user: User): string {
  return `${user.firstName} ${user.lastName} (${user.email})`;
}

// ✅ Hide implementation details
class User {
  private firstName: string;
  private lastName: string;
  private age: number;
  private email: string;
  private passwordHash: string;

  constructor(
    firstName: string,
    lastName: string,
    age: number,
    email: string,
    password: string
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.email = email;
    this.passwordHash = this.hashPassword(password);
  }

  private hashPassword(password: string): string {
    // Hashing logic
    return `hashed_${password}`;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getEmail(): string {
    return this.email;
  }

  verifyPassword(password: string): boolean {
    return this.hashPassword(password) === this.passwordHash;
  }
}

// Client depends on interface, not structure
function displayUser(user: User): string {
  return `${user.getFullName()} (${user.getEmail()})`;
}
```

Now you can change internal representation (e.g., store name as single string) without breaking clients.

## Invariants

Encapsulation protects **invariants**: conditions that must always be true.

```typescript
class Rectangle {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    // Invariant: width and height must be positive
    if (width <= 0 || height <= 0) {
      throw new Error('Dimensions must be positive');
    }
    this.width = width;
    this.height = height;
  }

  setWidth(width: number): void {
    if (width <= 0) {
      throw new Error('Width must be positive');
    }
    this.width = width; // Invariant maintained
  }

  setHeight(height: number): void {
    if (height <= 0) {
      throw new Error('Height must be positive');
    }
    this.height = height; // Invariant maintained
  }

  area(): number {
    // Can trust that width and height are positive
    return this.width * this.height;
  }
}
```

**Without encapsulation**, anyone could set `width = -5`, breaking the invariant.

## Law of Demeter (LoD)

> *"Only talk to your immediate friends."*

Also called **Principle of Least Knowledge**: an object should only call methods on:
1. Itself
2. Objects passed as arguments
3. Objects it creates
4. Its direct components

```typescript
// ❌ Violates Law of Demeter
class Order {
  customer: Customer;
  
  constructor(customer: Customer) {
    this.customer = customer;
  }
  
  getCustomerCity(): string {
    // Reaches through multiple objects!
    return this.customer.address.city; // ❌ Tight coupling
  }
}

class Customer {
  address: Address;
  
  constructor(address: Address) {
    this.address = address;
  }
}

class Address {
  city: string;
  
  constructor(city: string) {
    this.city = city;
  }
}

// ✅ Follows Law of Demeter
class Order {
  private customer: Customer;
  
  constructor(customer: Customer) {
    this.customer = customer;
  }
  
  getCustomerCity(): string {
    return this.customer.getCity(); // ✅ Ask, don't reach
  }
}

class Customer {
  private address: Address;
  
  constructor(address: Address) {
    this.address = address;
  }
  
  getCity(): string {
    return this.address.getCity(); // Delegate
  }
}

class Address {
  private city: string;
  
  constructor(city: string) {
    this.city = city;
  }
  
  getCity(): string {
    return this.city;
  }
}
```

**Benefits**:
- Looser coupling
- Changes to Address don't affect Order
- Each class has clear responsibility

### Train Wrecks

Chains of calls violate LoD:

```typescript
// ❌ Train wreck
order.getCustomer().getAddress().getCity();

// ✅ Better
order.getCustomerCity();
```

## Tell, Don't Ask

Don't ask for data to make decisions—**tell the object what to do**.

```typescript
// ❌ Ask for data, make decision externally
class Order {
  items: Item[];
  
  constructor(items: Item[]) {
    this.items = items;
  }
}

// External code asks for data
const order = new Order(items);
let total = 0;
for (const item of order.items) { // ❌ Reaches into object
  total += item.price * item.quantity;
}
if (total > 100) {
  total *= 0.9; // Apply discount
}

// ✅ Tell object what to do
class Order {
  private items: Item[];
  
  constructor(items: Item[]) {
    this.items = items;
  }
  
  calculateTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }
  
  calculateTotalWithDiscount(): number {
    const total = this.calculateTotal();
    return total > 100 ? total * 0.9 : total;
  }
}

// External code tells what it wants
const order = new Order(items);
const total = order.calculateTotalWithDiscount(); // ✅ Tell, don't ask
```

**Benefits**:
- Business logic stays in the object
- External code doesn't need to know implementation
- Easier to change discount logic

## Getters and Setters

Use with caution—they can violate encapsulation if overused.

### Acceptable Use

```typescript
class User {
  private firstName: string;
  private lastName: string;
  
  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }
  
  // Computed property: no internal state exposed
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

const user = new User('Alice', 'Smith');
console.log(user.fullName); // "Alice Smith"
```

### Problematic Use

```typescript
// ❌ Getter/setter just exposes internal state
class User {
  private _age: number;
  
  get age(): number {
    return this._age; // Just exposes private field
  }
  
  set age(value: number) {
    this._age = value; // No validation!
  }
}

// Might as well be public!
// ✅ Better: Make it public or add meaningful behavior
class User {
  constructor(private age: number) {}
  
  incrementAge(): void {
    this.age++; // Controlled modification
  }
  
  getAge(): number {
    return this.age;
  }
}
```

**Rule of thumb**: If getter/setter just expose a field, consider making it public or adding real behavior.

## Immutability and Encapsulation

Immutability is the ultimate encapsulation:

```typescript
// ✅ Immutable class
class Point {
  constructor(
    private readonly x: number,
    private readonly y: number
  ) {}
  
  getX(): number {
    return this.x;
  }
  
  getY(): number {
    return this.y;
  }
  
  // Return new instance instead of modifying
  move(dx: number, dy: number): Point {
    return new Point(this.x + dx, this.y + dy);
  }
}

const point1 = new Point(0, 0);
const point2 = point1.move(5, 10);
// point1 unchanged: (0, 0)
// point2 is new: (5, 10)
```

**Benefits**:
- No way to corrupt state
- Thread-safe
- Predictable
- Easy to reason about

## Real-World Example: Shopping Cart

```typescript
class ShoppingCart {
  private items: Map<string, CartItem> = new Map();
  
  addItem(productId: string, quantity: number, price: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    
    const existing = this.items.get(productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.set(productId, { productId, quantity, price });
    }
  }
  
  removeItem(productId: string): void {
    if (!this.items.has(productId)) {
      throw new Error('Item not in cart');
    }
    this.items.delete(productId);
  }
  
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    
    const item = this.items.get(productId);
    if (!item) {
      throw new Error('Item not in cart');
    }
    
    item.quantity = quantity;
  }
  
  getTotal(): number {
    let total = 0;
    for (const item of this.items.values()) {
      total += item.price * item.quantity;
    }
    return total;
  }
  
  getItemCount(): number {
    let count = 0;
    for (const item of this.items.values()) {
      count += item.quantity;
    }
    return count;
  }
  
  // Don't expose internal Map directly!
  getItems(): CartItem[] {
    return Array.from(this.items.values());
  }
}

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}
```

**Why encapsulated**:
- `items` Map is private
- All modifications go through validated methods
- Impossible to create invalid state
- Can change internal structure (Array → Map) without affecting clients

## Common Violations

### 1. Exposing Collections

```typescript
// ❌ Exposes internal collection
class Team {
  members: User[] = []; // Public array!
  
  addMember(user: User): void {
    this.members.push(user);
  }
}

const team = new Team();
team.members.push(invalidUser); // ❌ Bypasses validation!
team.members = []; // ❌ Clears team!

// ✅ Encapsulate collection
class Team {
  private members: User[] = [];
  
  addMember(user: User): void {
    // Validation
    this.members.push(user);
  }
  
  removeMember(user: User): void {
    const index = this.members.indexOf(user);
    if (index > -1) {
      this.members.splice(index, 1);
    }
  }
  
  getMembers(): readonly User[] {
    return [...this.members]; // Return copy
  }
}
```

### 2. Anemic Domain Models

```typescript
// ❌ Anemic: No behavior, just data
class Order {
  public items: Item[] = [];
  public total: number = 0;
  public status: string = 'pending';
}

// Business logic scattered everywhere
function processOrder(order: Order): void {
  order.total = order.items.reduce((sum, item) => sum + item.price, 0);
  order.status = 'processing';
  // ...
}

// ✅ Rich domain model: Data + behavior
class Order {
  private items: Item[] = [];
  private status: OrderStatus = OrderStatus.Pending;
  
  addItem(item: Item): void {
    this.items.push(item);
  }
  
  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
  
  process(): void {
    if (this.status !== OrderStatus.Pending) {
      throw new Error('Order already processed');
    }
    this.status = OrderStatus.Processing;
  }
  
  getStatus(): OrderStatus {
    return this.status;
  }
}
```

## The Mind-Shift

**Before understanding encapsulation:**
- "Make everything public for flexibility"
- "Getters and setters everywhere"
- "Objects are data containers"

**After understanding encapsulation:**
- "Hide by default, expose only what's necessary"
- "Behavior over data"
- "Objects protect their invariants"
- "Tell, don't ask"

This is lifechanging because you start thinking about **interfaces and contracts** rather than **data structures**.

## Benefits

1. **Safety**: Invalid state impossible
2. **Maintainability**: Change internals without breaking clients
3. **Clarity**: Clear public interface
4. **Testability**: Test through public interface
5. **Modularity**: Clear boundaries

## AI-Era Relevance

### What AI Does
- Makes everything public
- Creates getters/setters for all fields
- Doesn't think about invariants

### What You Must Do
- **Review**: What should be private?
- **Validate**: Add validation in setters
- **Hide**: Minimize exposed surface area
- **Guide**: Prompt for encapsulation and validation

## Summary

**Encapsulation** means:
- Hide internal state
- Expose minimal, well-defined interface
- Protect invariants
- Tell, don't ask
- Follow Law of Demeter

**Key questions**:
- *"Does this need to be public?"* → Make it private by default
- *"Am I exposing internal structure?"* → Hide it
- *"Can clients corrupt my state?"* → Add validation

---

**Next**: [Polymorphism](../08-polymorphism.md)
