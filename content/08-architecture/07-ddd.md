# Domain-Driven Design (DDD)

## What is Domain-Driven Design?

**Domain-Driven Design (DDD)** is an approach to software development by Eric Evans that centers complex designs on a model of the business domain. The focus is on understanding and modeling the core business problem, then expressing that model in code.

### Core Philosophy

> "The heart of software is its ability to solve domain-related problems for its users."

DDD provides patterns and principles for:
1. Understanding complex business domains
2. Creating a shared language between developers and domain experts
3. Designing software that reflects the business reality

## Key Concepts

### 1. Ubiquitous Language
A common, rigorous language shared by developers and domain experts, used everywhere (code, conversations, documentation).

```typescript
// ✅ Good: Uses ubiquitous language from domain
class Policy {
    underwrite(): void { }
    issue(): void { }
    renew(): void { }
}

// ❌ Bad: Generic technical terms
class Object {
    process(): void { }
    save(): void { }
}
```

### 2. Bounded Context
A boundary within which a particular model is defined and applicable. Different contexts can have different models.

```
┌─────────────────────┐    ┌─────────────────────┐
│  Sales Context      │    │  Shipping Context   │
│                     │    │                     │
│  Customer           │    │  Customer           │
│  - name             │    │  - name             │
│  - credit limit     │    │  - delivery address │
│  - payment terms    │    │  - shipping method  │
└─────────────────────┘    └─────────────────────┘
       Same concept, different models
```

### 3. Strategic Design
How to organize large systems into bounded contexts and define relationships between them.

### 4. Tactical Design
Patterns for modeling the domain within a bounded context (Entities, Value Objects, Aggregates, Services, etc.).

## Tactical Patterns

### 1. Entity
An object with identity that persists over time

```typescript
// ============================================
// ENTITY
// ============================================

class Order {
    constructor(
        public readonly id: OrderId,
        private customer: CustomerId,
        private items: OrderLine[],
        private status: OrderStatus,
        private createdAt: Date
    ) {}

    // Identity comparison
    equals(other: Order): boolean {
        return this.id.equals(other.id);
    }

    // Business methods
    addLine(line: OrderLine): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Cannot modify non-draft order');
        }
        this.items.push(line);
    }

    submit(): void {
        if (this.items.length === 0) {
            throw new DomainError('Cannot submit empty order');
        }
        this.status = OrderStatus.Submitted;
    }

    getTotal(): Money {
        return this.items.reduce(
            (sum, line) => sum.add(line.getSubtotal()),
            Money.zero()
        );
    }
}

// Value Object for identity
class OrderId {
    private constructor(private readonly value: string) {}

    static create(value: string): OrderId {
        if (!value) throw new Error('OrderId cannot be empty');
        return new OrderId(value);
    }

    static generate(): OrderId {
        return new OrderId(crypto.randomUUID());
    }

    equals(other: OrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
```

### 2. Value Object
An object defined by its attributes, not identity. Immutable.

```typescript
// ============================================
// VALUE OBJECT
// ============================================

class Money {
    private constructor(
        private readonly amount: number,
        private readonly currency: string
    ) {
        if (amount < 0) {
            throw new Error('Amount cannot be negative');
        }
    }

    static create(amount: number, currency: string): Money {
        return new Money(amount, currency);
    }

    static zero(): Money {
        return new Money(0, 'USD');
    }

    add(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot add different currencies');
        }
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other: Money): Money {
        if (this.currency !== other.currency) {
            throw new Error('Cannot subtract different currencies');
        }
        return new Money(this.amount - other.amount, this.currency);
    }

    multiply(multiplier: number): Money {
        return new Money(this.amount * multiplier, this.currency);
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currency === other.currency;
    }

    greaterThan(other: Money): boolean {
        if (this.currency !== other.currency) {
            throw new Error('Cannot compare different currencies');
        }
        return this.amount > other.amount;
    }

    getAmount(): number {
        return this.amount;
    }

    getCurrency(): string {
        return this.currency;
    }
}

// Email Value Object
class Email {
    private constructor(private readonly value: string) {}

    static create(value: string): Email {
        if (!Email.isValid(value)) {
            throw new Error('Invalid email format');
        }
        return new Email(value.toLowerCase());
    }

    private static isValid(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    equals(other: Email): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

// Address Value Object
class Address {
    private constructor(
        private readonly street: string,
        private readonly city: string,
        private readonly state: string,
        private readonly zipCode: string,
        private readonly country: string
    ) {}

    static create(street: string, city: string, state: string, zipCode: string, country: string): Address {
        if (!street || !city || !state || !zipCode || !country) {
            throw new Error('All address fields are required');
        }
        return new Address(street, city, state, zipCode, country);
    }

    equals(other: Address): boolean {
        return this.street === other.street &&
               this.city === other.city &&
               this.state === other.state &&
               this.zipCode === other.zipCode &&
               this.country === other.country;
    }

    toString(): string {
        return `${this.street}, ${this.city}, ${this.state} ${this.zipCode}, ${this.country}`;
    }
}
```

### 3. Aggregate
A cluster of entities and value objects with a root entity. Ensures consistency.

```typescript
// ============================================
// AGGREGATE ROOT
// ============================================

enum OrderStatus {
    Draft = 'DRAFT',
    Submitted = 'SUBMITTED',
    Confirmed = 'CONFIRMED',
    Shipped = 'SHIPPED',
    Delivered = 'DELIVERED'
}

class OrderLine {
    constructor(
        public readonly productId: ProductId,
        public readonly productName: string,
        public readonly quantity: number,
        public readonly unitPrice: Money
    ) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
    }

    getSubtotal(): Money {
        return this.unitPrice.multiply(this.quantity);
    }
}

// Aggregate Root
class Order {
    private lines: OrderLine[] = [];
    private status: OrderStatus = OrderStatus.Draft;
    private submittedAt?: Date;
    private confirmedAt?: Date;

    private constructor(
        public readonly id: OrderId,
        private customerId: CustomerId,
        private shippingAddress: Address,
        private readonly createdAt: Date
    ) {}

    // Factory method
    static create(customerId: CustomerId, shippingAddress: Address): Order {
        return new Order(
            OrderId.generate(),
            customerId,
            shippingAddress,
            new Date()
        );
    }

    // Business logic - maintain invariants
    addLine(productId: ProductId, productName: string, quantity: number, unitPrice: Money): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Cannot modify order after submission');
        }

        // Check if product already exists
        const existing = this.lines.find(line => line.productId.equals(productId));
        if (existing) {
            // Remove old line and add new one with updated quantity
            this.lines = this.lines.filter(line => !line.productId.equals(productId));
        }

        this.lines.push(new OrderLine(productId, productName, quantity, unitPrice));
    }

    removeLine(productId: ProductId): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Cannot modify order after submission');
        }

        this.lines = this.lines.filter(line => !line.productId.equals(productId));
    }

    updateShippingAddress(address: Address): void {
        if (this.status !== OrderStatus.Draft && this.status !== OrderStatus.Submitted) {
            throw new DomainError('Cannot update shipping address after confirmation');
        }

        this.shippingAddress = address;
    }

    submit(): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Order already submitted');
        }

        if (this.lines.length === 0) {
            throw new DomainError('Cannot submit empty order');
        }

        if (this.getTotal().equals(Money.zero())) {
            throw new DomainError('Cannot submit order with zero total');
        }

        this.status = OrderStatus.Submitted;
        this.submittedAt = new Date();
    }

    confirm(): void {
        if (this.status !== OrderStatus.Submitted) {
            throw new DomainError('Can only confirm submitted orders');
        }

        this.status = OrderStatus.Confirmed;
        this.confirmedAt = new Date();
    }

    ship(): void {
        if (this.status !== OrderStatus.Confirmed) {
            throw new DomainError('Can only ship confirmed orders');
        }

        this.status = OrderStatus.Shipped;
    }

    deliver(): void {
        if (this.status !== OrderStatus.Shipped) {
            throw new DomainError('Can only deliver shipped orders');
        }

        this.status = OrderStatus.Delivered;
    }

    // Queries
    getTotal(): Money {
        return this.lines.reduce(
            (sum, line) => sum.add(line.getSubtotal()),
            Money.zero()
        );
    }

    getLineCount(): number {
        return this.lines.length;
    }

    getLines(): readonly OrderLine[] {
        return [...this.lines];
    }

    getStatus(): OrderStatus {
        return this.status;
    }

    getCustomerId(): CustomerId {
        return this.customerId;
    }

    getShippingAddress(): Address {
        return this.shippingAddress;
    }
}

class ProductId {
    private constructor(private readonly value: string) {}

    static create(value: string): ProductId {
        if (!value) throw new Error('ProductId cannot be empty');
        return new ProductId(value);
    }

    equals(other: ProductId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

class CustomerId {
    private constructor(private readonly value: string) {}

    static create(value: string): CustomerId {
        if (!value) throw new Error('CustomerId cannot be empty');
        return new CustomerId(value);
    }

    equals(other: CustomerId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}
```

### 4. Domain Service
Stateless operations that don't belong to any entity

```typescript
// ============================================
// DOMAIN SERVICE
// ============================================

// When business logic doesn't fit in an entity
class OrderPricingService {
    calculateDiscount(order: Order, customer: Customer): Money {
        const total = order.getTotal();
        
        // Premium customers get 10% discount
        if (customer.isPremium()) {
            return total.multiply(0.1);
        }

        // Large orders (>$1000) get 5% discount
        if (total.greaterThan(Money.create(1000, 'USD'))) {
            return total.multiply(0.05);
        }

        return Money.zero();
    }

    calculateTax(order: Order, taxRate: number): Money {
        return order.getTotal().multiply(taxRate);
    }

    calculateFinalTotal(order: Order, customer: Customer, taxRate: number): Money {
        const subtotal = order.getTotal();
        const discount = this.calculateDiscount(order, customer);
        const tax = this.calculateTax(order, taxRate);

        return subtotal.subtract(discount).add(tax);
    }
}

// Domain service for complex business rules
class OrderFulfillmentService {
    constructor(
        private inventoryRepository: InventoryRepository,
        private warehouseService: WarehouseService
    ) {}

    async canFulfillOrder(order: Order): Promise<boolean> {
        // Check inventory for all items
        for (const line of order.getLines()) {
            const available = await this.inventoryRepository.getAvailableQuantity(
                line.productId
            );
            
            if (available < line.quantity) {
                return false;
            }
        }

        // Check if warehouse can handle the order
        const warehouse = await this.warehouseService.findNearestWarehouse(
            order.getShippingAddress()
        );

        return warehouse !== null;
    }

    async reserveInventory(order: Order): Promise<void> {
        for (const line of order.getLines()) {
            await this.inventoryRepository.reserve(line.productId, line.quantity);
        }
    }

    async releaseInventory(order: Order): Promise<void> {
        for (const line of order.getLines()) {
            await this.inventoryRepository.release(line.productId, line.quantity);
        }
    }
}

// Supporting interfaces
interface Customer {
    isPremium(): boolean;
}

interface InventoryRepository {
    getAvailableQuantity(productId: ProductId): Promise<number>;
    reserve(productId: ProductId, quantity: number): Promise<void>;
    release(productId: ProductId, quantity: number): Promise<void>;
}

interface WarehouseService {
    findNearestWarehouse(address: Address): Promise<Warehouse | null>;
}

interface Warehouse {
    id: string;
    location: Address;
}
```

### 5. Repository
Abstracts persistence of aggregates

```typescript
// ============================================
// REPOSITORY
// ============================================

interface OrderRepository {
    save(order: Order): Promise<void>;
    findById(id: OrderId): Promise<Order | null>;
    findByCustomer(customerId: CustomerId): Promise<Order[]>;
    delete(id: OrderId): Promise<void>;
}

class InMemoryOrderRepository implements OrderRepository {
    private orders = new Map<string, Order>();

    async save(order: Order): Promise<void> {
        this.orders.set(order.id.toString(), order);
    }

    async findById(id: OrderId): Promise<Order | null> {
        return this.orders.get(id.toString()) || null;
    }

    async findByCustomer(customerId: CustomerId): Promise<Order[]> {
        return Array.from(this.orders.values())
            .filter(order => order.getCustomerId().equals(customerId));
    }

    async delete(id: OrderId): Promise<void> {
        this.orders.delete(id.toString());
    }
}

// PostgreSQL implementation
class PostgresOrderRepository implements OrderRepository {
    constructor(private db: any) {}

    async save(order: Order): Promise<void> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // Save aggregate root
            await client.query(`
                INSERT INTO orders (id, customer_id, shipping_address, status, created_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO UPDATE
                SET status = $4
            `, [
                order.id.toString(),
                order.getCustomerId().toString(),
                JSON.stringify(order.getShippingAddress()),
                order.getStatus(),
                new Date()
            ]);

            // Delete existing lines
            await client.query('DELETE FROM order_lines WHERE order_id = $1', [
                order.id.toString()
            ]);

            // Save lines
            for (const line of order.getLines()) {
                await client.query(`
                    INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    order.id.toString(),
                    line.productId.toString(),
                    line.productName,
                    line.quantity,
                    line.unitPrice.getAmount()
                ]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async findById(id: OrderId): Promise<Order | null> {
        const result = await this.db.query(
            'SELECT * FROM orders WHERE id = $1',
            [id.toString()]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToAggregate(result.rows[0]);
    }

    async findByCustomer(customerId: CustomerId): Promise<Order[]> {
        const result = await this.db.query(
            'SELECT * FROM orders WHERE customer_id = $1',
            [customerId.toString()]
        );

        return Promise.all(
            result.rows.map((row: any) => this.mapToAggregate(row))
        );
    }

    async delete(id: OrderId): Promise<void> {
        await this.db.query('DELETE FROM orders WHERE id = $1', [id.toString()]);
    }

    private async mapToAggregate(row: any): Promise<Order> {
        // Load order lines
        const linesResult = await this.db.query(
            'SELECT * FROM order_lines WHERE order_id = $1',
            [row.id]
        );

        // Reconstruct aggregate
        // Note: This is simplified. Real implementation would use memento pattern
        // or create a separate factory method
        const order = Order.create(
            CustomerId.create(row.customer_id),
            JSON.parse(row.shipping_address) as Address
        );

        // Restore state...
        return order;
    }
}
```

### 6. Domain Events
Capture important business occurrences

```typescript
// ============================================
// DOMAIN EVENTS
// ============================================

interface DomainEvent {
    occurredAt: Date;
    aggregateId: string;
}

class OrderSubmittedEvent implements DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly customerId: CustomerId,
        public readonly total: Money,
        public readonly occurredAt: Date = new Date()
    ) {}

    get aggregateId(): string {
        return this.orderId.toString();
    }
}

class OrderConfirmedEvent implements DomainEvent {
    constructor(
        public readonly orderId: OrderId,
        public readonly occurredAt: Date = new Date()
    ) {}

    get aggregateId(): string {
        return this.orderId.toString();
    }
}

// Enhanced aggregate with events
class OrderWithEvents extends Order {
    private domainEvents: DomainEvent[] = [];

    submit(): void {
        super.submit();
        
        this.domainEvents.push(new OrderSubmittedEvent(
            this.id,
            this.getCustomerId(),
            this.getTotal()
        ));
    }

    confirm(): void {
        super.confirm();
        
        this.domainEvents.push(new OrderConfirmedEvent(this.id));
    }

    getDomainEvents(): DomainEvent[] {
        return [...this.domainEvents];
    }

    clearDomainEvents(): void {
        this.domainEvents = [];
    }
}

// Event handlers
class OrderSubmittedEventHandler {
    async handle(event: OrderSubmittedEvent): Promise<void> {
        console.log(`Order ${event.orderId} submitted with total ${event.total}`);
        // Send confirmation email
        // Reserve inventory
        // Notify warehouse
    }
}

class OrderConfirmedEventHandler {
    async handle(event: OrderConfirmedEvent): Promise<void> {
        console.log(`Order ${event.orderId} confirmed`);
        // Process payment
        // Update inventory
        // Schedule shipment
    }
}
```

## Complete DDD Example

```typescript
// ============================================
// APPLICATION SERVICE (Use Case)
// ============================================

class CreateOrderService {
    constructor(
        private orderRepository: OrderRepository,
        private pricingService: OrderPricingService,
        private fulfillmentService: OrderFulfillmentService,
        private eventPublisher: EventPublisher
    ) {}

    async execute(command: CreateOrderCommand): Promise<OrderId> {
        // 1. Create aggregate
        const order = Order.create(
            CustomerId.create(command.customerId),
            Address.create(
                command.shippingAddress.street,
                command.shippingAddress.city,
                command.shippingAddress.state,
                command.shippingAddress.zipCode,
                command.shippingAddress.country
            )
        );

        // 2. Add lines
        for (const item of command.items) {
            order.addLine(
                ProductId.create(item.productId),
                item.productName,
                item.quantity,
                Money.create(item.unitPrice, 'USD')
            );
        }

        // 3. Check if can fulfill
        const canFulfill = await this.fulfillmentService.canFulfillOrder(order);
        if (!canFulfill) {
            throw new DomainError('Cannot fulfill order - insufficient inventory');
        }

        // 4. Submit order
        order.submit();

        // 5. Reserve inventory
        await this.fulfillmentService.reserveInventory(order);

        // 6. Save aggregate
        await this.orderRepository.save(order);

        // 7. Publish events
        for (const event of order.getDomainEvents()) {
            await this.eventPublisher.publish(event);
        }
        order.clearDomainEvents();

        return order.id;
    }
}

interface CreateOrderCommand {
    customerId: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }>;
}

interface EventPublisher {
    publish(event: DomainEvent): Promise<void>;
}
```

## Strategic Design Patterns

### Bounded Contexts

```typescript
// ============================================
// SALES CONTEXT
// ============================================

namespace Sales {
    export class Customer {
        constructor(
            public readonly id: CustomerId,
            private name: string,
            private email: Email,
            private creditLimit: Money
        ) {}

        canPlaceOrder(orderTotal: Money): boolean {
            return this.creditLimit.greaterThan(orderTotal);
        }
    }
}

// ============================================
// SHIPPING CONTEXT
// ============================================

namespace Shipping {
    export class Customer {
        constructor(
            public readonly id: CustomerId,
            private name: string,
            private defaultAddress: Address,
            private preferredCarrier: string
        ) {}

        getShippingAddress(): Address {
            return this.defaultAddress;
        }
    }
}

// Different models in different contexts
```

## Benefits of DDD

### ✅ Advantages

1. **Clarity**: Code reflects business reality
2. **Communication**: Ubiquitous language improves team collaboration
3. **Flexibility**: Changes in business rules localized to domain
4. **Maintainability**: Clear boundaries and responsibilities
5. **Testability**: Business logic separated from infrastructure
6. **Alignment**: Technical and business models aligned

### ❌ Disadvantages

1. **Complexity**: Many concepts and patterns to learn
2. **Over-engineering**: Overkill for simple CRUD apps
3. **Learning Curve**: Requires significant investment
4. **Team Buy-in**: Needs domain experts' involvement
5. **Time**: Initial modeling takes time

## When to Use DDD

### ✅ Good Fit

- Complex business domain
- Long-lived application
- Domain experts available
- Business rules change frequently
- Multiple bounded contexts
- Team of 5+ developers

### ❌ Poor Fit

- Simple CRUD application
- Purely technical problem
- No domain experts
- Prototype or MVP
- Small team (<3 developers)
- Short-term project

## Best Practices

### 1. Use Ubiquitous Language Everywhere

```typescript
// ✅ Good: Domain language
class Policy {
    underwrite(): void { }
    issue(): void { }
    renew(): void { }
    cancel(): void { }
}

// ❌ Bad: Generic terms
class Record {
    process(): void { }
    save(): void { }
}
```

### 2. Keep Aggregates Small

```typescript
// ✅ Good: Small aggregate
class Order {
    private lines: OrderLine[];
    // Only order lines, not customer, products, etc.
}

// ❌ Bad: Large aggregate
class Order {
    private customer: Customer; // Should reference by ID
    private products: Product[]; // Should reference by ID
    private warehouse: Warehouse; // Should reference by ID
}
```

### 3. Use Value Objects for Concepts

```typescript
// ✅ Good: Value object
class Money {
    add(other: Money): Money { }
    equals(other: Money): boolean { }
}

// ❌ Bad: Primitive obsession
interface Order {
    amount: number;
    currency: string;
}
```

## Summary

**Domain-Driven Design** focuses on modeling complex business domains:

1. **Ubiquitous Language**: Shared vocabulary
2. **Bounded Context**: Clear boundaries
3. **Entities**: Objects with identity
4. **Value Objects**: Immutable attributes
5. **Aggregates**: Consistency boundaries
6. **Domain Services**: Stateless operations
7. **Repositories**: Persistence abstraction
8. **Domain Events**: Business occurrences
9. **When to Use**: Complex domains, long-lived systems
10. **Benefits**: Alignment, flexibility, maintainability

**Key Takeaway**: DDD is about understanding the business domain deeply and expressing that understanding in code. It's powerful for complex domains but overkill for simple applications.

---

This completes the Architecture module! You now understand 7 major architectural patterns: Layered, Hexagonal, Microservices, Event-Driven, Clean, MVC/MVVM, and DDD.
