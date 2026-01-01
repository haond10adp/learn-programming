# Clean Architecture

## What is Clean Architecture?

**Clean Architecture** is a software design philosophy by Robert C. Martin (Uncle Bob) that emphasizes separation of concerns through layers, with dependencies pointing inward toward the business logic. The core principle: **Business logic should not depend on frameworks, UI, databases, or any external agency**.

### The Dependency Rule

```
              ┌─────────────────────────────────────┐
              │   Frameworks & Drivers (UI, DB)    │  ← Outer layer
              │   ┌─────────────────────────────┐   │
              │   │  Interface Adapters         │   │  ← Controllers, Presenters
              │   │  ┌───────────────────────┐  │   │
              │   │  │  Use Cases            │  │   │  ← Application logic
              │   │  │  ┌─────────────────┐  │  │   │
              │   │  │  │   Entities      │  │  │   │  ← Business rules
              │   │  │  │    (Core)       │  │  │   │
              │   │  │  └─────────────────┘  │  │   │
              │   │  └───────────────────────┘  │   │
              │   └─────────────────────────────┘   │
              └─────────────────────────────────────┘
              
              Dependencies point INWARD ───►
```

**The Rule**: Source code dependencies can only point inward. Inner layers know nothing about outer layers.

## The Four Layers

### 1. Entities (Enterprise Business Rules)
- **What**: Core business objects and rules
- **Depends on**: Nothing
- **Examples**: Order, User, Product domain models with business logic
- **Changes when**: Fundamental business rules change (rare)

### 2. Use Cases (Application Business Rules)
- **What**: Application-specific business rules and workflows
- **Depends on**: Entities only
- **Examples**: CreateOrder, UpdateUserProfile, ProcessPayment
- **Changes when**: Application behavior changes

### 3. Interface Adapters
- **What**: Convert data between use cases and external world
- **Depends on**: Use Cases and Entities
- **Examples**: Controllers, Presenters, Gateways
- **Changes when**: External interfaces change

### 4. Frameworks & Drivers
- **What**: External tools and frameworks
- **Depends on**: Interface Adapters
- **Examples**: Web frameworks, databases, UI frameworks
- **Changes when**: Technology choices change

## Implementation in TypeScript

### Layer 1: Entities (Core Domain)

```typescript
// ============================================
// ENTITIES LAYER (Core Business Rules)
// ============================================

// Domain Entity with business logic
class Order {
    private constructor(
        public readonly id: string,
        public readonly customerId: string,
        private items: OrderItem[],
        private status: OrderStatus,
        public readonly createdAt: Date,
        private updatedAt: Date
    ) {}

    // Factory method
    static create(customerId: string, items: OrderItem[]): Order {
        this.validateItems(items);

        return new Order(
            generateId(),
            customerId,
            items,
            OrderStatus.Draft,
            new Date(),
            new Date()
        );
    }

    // Business rules
    addItem(item: OrderItem): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Cannot modify order that is not in draft status');
        }

        this.items.push(item);
        this.updatedAt = new Date();
    }

    removeItem(productId: string): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Cannot modify order that is not in draft status');
        }

        this.items = this.items.filter(item => item.productId !== productId);
        this.updatedAt = new Date();
    }

    submit(): void {
        if (this.status !== OrderStatus.Draft) {
            throw new DomainError('Can only submit draft orders');
        }
        if (this.items.length === 0) {
            throw new DomainError('Cannot submit empty order');
        }

        this.status = OrderStatus.Pending;
        this.updatedAt = new Date();
    }

    confirm(): void {
        if (this.status !== OrderStatus.Pending) {
            throw new DomainError('Can only confirm pending orders');
        }

        this.status = OrderStatus.Confirmed;
        this.updatedAt = new Date();
    }

    cancel(reason: string): void {
        if (this.status === OrderStatus.Delivered || this.status === OrderStatus.Cancelled) {
            throw new DomainError(`Cannot cancel order with status ${this.status}`);
        }

        this.status = OrderStatus.Cancelled;
        this.updatedAt = new Date();
    }

    // Calculations (business logic)
    getTotalAmount(): number {
        return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
    }

    getItemCount(): number {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    canBeCancelled(): boolean {
        return this.status === OrderStatus.Draft || 
               this.status === OrderStatus.Pending ||
               this.status === OrderStatus.Confirmed;
    }

    // Getters
    getItems(): readonly OrderItem[] {
        return [...this.items];
    }

    getStatus(): OrderStatus {
        return this.status;
    }

    // Private validation
    private static validateItems(items: OrderItem[]): void {
        if (items.length === 0) {
            throw new DomainError('Order must have at least one item');
        }
    }
}

// Value Object
class OrderItem {
    constructor(
        public readonly productId: string,
        public readonly productName: string,
        public readonly quantity: number,
        public readonly unitPrice: number
    ) {
        if (quantity <= 0) {
            throw new DomainError('Quantity must be positive');
        }
        if (unitPrice < 0) {
            throw new DomainError('Price cannot be negative');
        }
    }

    getSubtotal(): number {
        return this.quantity * this.unitPrice;
    }

    equals(other: OrderItem): boolean {
        return this.productId === other.productId &&
               this.quantity === other.quantity &&
               this.unitPrice === other.unitPrice;
    }
}

enum OrderStatus {
    Draft = 'DRAFT',
    Pending = 'PENDING',
    Confirmed = 'CONFIRMED',
    Shipped = 'SHIPPED',
    Delivered = 'DELIVERED',
    Cancelled = 'CANCELLED'
}

// Domain Error
class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

// Helper
function generateId(): string {
    return crypto.randomUUID();
}
```

### Layer 2: Use Cases (Application Logic)

```typescript
// ============================================
// USE CASES LAYER (Application Business Rules)
// ============================================

// Use Case Input/Output DTOs
interface CreateOrderInput {
    customerId: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
    }>;
}

interface CreateOrderOutput {
    orderId: string;
    totalAmount: number;
    status: string;
}

// Port (interface) - defined by use case
interface OrderRepository {
    save(order: Order): Promise<void>;
    findById(id: string): Promise<Order | null>;
    findByCustomerId(customerId: string): Promise<Order[]>;
}

interface NotificationService {
    sendOrderConfirmation(customerId: string, orderId: string): Promise<void>;
}

// Use Case
class CreateOrderUseCase {
    constructor(
        private orderRepository: OrderRepository,
        private notificationService: NotificationService
    ) {}

    async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
        // 1. Create domain entity
        const orderItems = input.items.map(item =>
            new OrderItem(
                item.productId,
                item.productName,
                item.quantity,
                item.unitPrice
            )
        );

        const order = Order.create(input.customerId, orderItems);

        // 2. Submit order (business rule)
        order.submit();

        // 3. Save via repository
        await this.orderRepository.save(order);

        // 4. Send notification
        await this.notificationService.sendOrderConfirmation(
            input.customerId,
            order.id
        );

        // 5. Return output DTO
        return {
            orderId: order.id,
            totalAmount: order.getTotalAmount(),
            status: order.getStatus()
        };
    }
}

// More use cases
interface ConfirmOrderInput {
    orderId: string;
}

interface ConfirmOrderOutput {
    orderId: string;
    status: string;
}

class ConfirmOrderUseCase {
    constructor(
        private orderRepository: OrderRepository,
        private notificationService: NotificationService
    ) {}

    async execute(input: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
        // 1. Load order
        const order = await this.orderRepository.findById(input.orderId);
        if (!order) {
            throw new UseCaseError('Order not found', 'ORDER_NOT_FOUND');
        }

        // 2. Apply business rule
        order.confirm();

        // 3. Save
        await this.orderRepository.save(order);

        // 4. Notify
        await this.notificationService.sendOrderConfirmation(
            order.customerId,
            order.id
        );

        return {
            orderId: order.id,
            status: order.getStatus()
        };
    }
}

interface GetOrderInput {
    orderId: string;
}

interface GetOrderOutput {
    orderId: string;
    customerId: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
    totalAmount: number;
    status: string;
    createdAt: Date;
}

class GetOrderUseCase {
    constructor(private orderRepository: OrderRepository) {}

    async execute(input: GetOrderInput): Promise<GetOrderOutput> {
        const order = await this.orderRepository.findById(input.orderId);
        if (!order) {
            throw new UseCaseError('Order not found', 'ORDER_NOT_FOUND');
        }

        return {
            orderId: order.id,
            customerId: order.customerId,
            items: order.getItems().map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.getSubtotal()
            })),
            totalAmount: order.getTotalAmount(),
            status: order.getStatus(),
            createdAt: order.createdAt
        };
    }
}

// Use Case Error
class UseCaseError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'UseCaseError';
    }
}
```

### Layer 3: Interface Adapters (Controllers, Presenters, Gateways)

```typescript
// ============================================
// INTERFACE ADAPTERS LAYER
// ============================================

// HTTP Controller (Adapter)
class OrderController {
    constructor(
        private createOrderUseCase: CreateOrderUseCase,
        private confirmOrderUseCase: ConfirmOrderUseCase,
        private getOrderUseCase: GetOrderUseCase
    ) {}

    async createOrder(httpRequest: any): Promise<any> {
        try {
            // Convert HTTP request to use case input
            const input: CreateOrderInput = {
                customerId: httpRequest.body.customerId,
                items: httpRequest.body.items
            };

            // Execute use case
            const output = await this.createOrderUseCase.execute(input);

            // Convert use case output to HTTP response
            return {
                statusCode: 201,
                body: {
                    orderId: output.orderId,
                    totalAmount: output.totalAmount,
                    status: output.status
                }
            };
        } catch (error) {
            if (error instanceof DomainError) {
                return {
                    statusCode: 400,
                    body: { error: error.message }
                };
            }
            if (error instanceof UseCaseError) {
                return {
                    statusCode: error.code === 'ORDER_NOT_FOUND' ? 404 : 400,
                    body: { error: error.message, code: error.code }
                };
            }
            return {
                statusCode: 500,
                body: { error: 'Internal server error' }
            };
        }
    }

    async confirmOrder(httpRequest: any): Promise<any> {
        try {
            const input: ConfirmOrderInput = {
                orderId: httpRequest.params.orderId
            };

            const output = await this.confirmOrderUseCase.execute(input);

            return {
                statusCode: 200,
                body: {
                    orderId: output.orderId,
                    status: output.status
                }
            };
        } catch (error) {
            if (error instanceof DomainError || error instanceof UseCaseError) {
                return {
                    statusCode: 400,
                    body: { error: error.message }
                };
            }
            return {
                statusCode: 500,
                body: { error: 'Internal server error' }
            };
        }
    }

    async getOrder(httpRequest: any): Promise<any> {
        try {
            const input: GetOrderInput = {
                orderId: httpRequest.params.orderId
            };

            const output = await this.getOrderUseCase.execute(input);

            return {
                statusCode: 200,
                body: output
            };
        } catch (error) {
            if (error instanceof UseCaseError && error.code === 'ORDER_NOT_FOUND') {
                return {
                    statusCode: 404,
                    body: { error: error.message }
                };
            }
            return {
                statusCode: 500,
                body: { error: 'Internal server error' }
            };
        }
    }
}

// Repository Adapter (implements port from use case layer)
class InMemoryOrderRepository implements OrderRepository {
    private orders = new Map<string, Order>();

    async save(order: Order): Promise<void> {
        this.orders.set(order.id, order);
    }

    async findById(id: string): Promise<Order | null> {
        return this.orders.get(id) || null;
    }

    async findByCustomerId(customerId: string): Promise<Order[]> {
        return Array.from(this.orders.values())
            .filter(order => order.customerId === customerId);
    }
}

// Notification Service Adapter
class ConsoleNotificationService implements NotificationService {
    async sendOrderConfirmation(customerId: string, orderId: string): Promise<void> {
        console.log(`📧 Order confirmation sent to customer ${customerId} for order ${orderId}`);
    }
}

class EmailNotificationService implements NotificationService {
    constructor(private emailClient: any) {}

    async sendOrderConfirmation(customerId: string, orderId: string): Promise<void> {
        // Get customer email (would call another service/repository)
        const customerEmail = `customer-${customerId}@example.com`;

        await this.emailClient.sendEmail({
            to: customerEmail,
            subject: 'Order Confirmation',
            body: `Your order ${orderId} has been confirmed.`
        });
    }
}
```

### Layer 4: Frameworks & Drivers (External Tools)

```typescript
// ============================================
// FRAMEWORKS & DRIVERS LAYER
// ============================================

import express from 'express';

// Express.js integration
function createExpressApp(controller: OrderController): express.Application {
    const app = express();
    app.use(express.json());

    app.post('/orders', async (req, res) => {
        const httpRequest = { body: req.body };
        const httpResponse = await controller.createOrder(httpRequest);
        res.status(httpResponse.statusCode).json(httpResponse.body);
    });

    app.post('/orders/:orderId/confirm', async (req, res) => {
        const httpRequest = { params: req.params };
        const httpResponse = await controller.confirmOrder(httpRequest);
        res.status(httpResponse.statusCode).json(httpResponse.body);
    });

    app.get('/orders/:orderId', async (req, res) => {
        const httpRequest = { params: req.params };
        const httpResponse = await controller.getOrder(httpRequest);
        res.status(httpResponse.statusCode).json(httpResponse.body);
    });

    return app;
}

// Database (PostgreSQL example)
import { Pool } from 'pg';

class PostgresOrderRepository implements OrderRepository {
    constructor(private db: Pool) {}

    async save(order: Order): Promise<void> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // Save order
            await client.query(
                `INSERT INTO orders (id, customer_id, status, total_amount, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (id) DO UPDATE
                 SET status = $3, updated_at = $6`,
                [
                    order.id,
                    order.customerId,
                    order.getStatus(),
                    order.getTotalAmount(),
                    order.createdAt,
                    new Date()
                ]
            );

            // Save order items
            for (const item of order.getItems()) {
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (order_id, product_id) DO UPDATE
                     SET quantity = $4, unit_price = $5`,
                    [order.id, item.productId, item.productName, item.quantity, item.unitPrice]
                );
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async findById(id: string): Promise<Order | null> {
        const result = await this.db.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const orderRow = result.rows[0];

        // Load items
        const itemsResult = await this.db.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [id]
        );

        const items = itemsResult.rows.map(row =>
            new OrderItem(
                row.product_id,
                row.product_name,
                row.quantity,
                row.unit_price
            )
        );

        // Reconstruct order (would need to make constructor public or use a factory)
        return Order.create(orderRow.customer_id, items);
    }

    async findByCustomerId(customerId: string): Promise<Order[]> {
        // Similar implementation
        return [];
    }
}

// CLI interface
class OrderCLI {
    constructor(
        private createOrderUseCase: CreateOrderUseCase,
        private getOrderUseCase: GetOrderUseCase
    ) {}

    async handleCommand(args: string[]): Promise<void> {
        const command = args[0];

        switch (command) {
            case 'create':
                await this.handleCreate(args.slice(1));
                break;
            case 'get':
                await this.handleGet(args.slice(1));
                break;
            default:
                console.log('Unknown command');
        }
    }

    private async handleCreate(args: string[]): Promise<void> {
        const input: CreateOrderInput = {
            customerId: args[0],
            items: JSON.parse(args[1])
        };

        const output = await this.createOrderUseCase.execute(input);
        console.log(`Order created: ${output.orderId}`);
        console.log(`Total: $${output.totalAmount}`);
    }

    private async handleGet(args: string[]): Promise<void> {
        const output = await this.getOrderUseCase.execute({ orderId: args[0] });
        console.log('Order:', JSON.stringify(output, null, 2));
    }
}
```

### Composition Root (Dependency Injection)

```typescript
// ============================================
// COMPOSITION ROOT
// ============================================

// Development configuration
function createDevelopmentApp(): express.Application {
    // Layer 3: Adapters
    const orderRepository = new InMemoryOrderRepository();
    const notificationService = new ConsoleNotificationService();

    // Layer 2: Use Cases
    const createOrderUseCase = new CreateOrderUseCase(
        orderRepository,
        notificationService
    );
    const confirmOrderUseCase = new ConfirmOrderUseCase(
        orderRepository,
        notificationService
    );
    const getOrderUseCase = new GetOrderUseCase(orderRepository);

    // Layer 3: Controllers
    const orderController = new OrderController(
        createOrderUseCase,
        confirmOrderUseCase,
        getOrderUseCase
    );

    // Layer 4: Framework
    return createExpressApp(orderController);
}

// Production configuration
function createProductionApp(): express.Application {
    // Layer 4: External services
    const dbPool = new Pool({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const emailClient = createEmailClient();

    // Layer 3: Adapters
    const orderRepository = new PostgresOrderRepository(dbPool);
    const notificationService = new EmailNotificationService(emailClient);

    // Layer 2: Use Cases
    const createOrderUseCase = new CreateOrderUseCase(
        orderRepository,
        notificationService
    );
    const confirmOrderUseCase = new ConfirmOrderUseCase(
        orderRepository,
        notificationService
    );
    const getOrderUseCase = new GetOrderUseCase(orderRepository);

    // Layer 3: Controllers
    const orderController = new OrderController(
        createOrderUseCase,
        confirmOrderUseCase,
        getOrderUseCase
    );

    // Layer 4: Framework
    return createExpressApp(orderController);
}

// Start server
const app = createDevelopmentApp();
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

## Testing in Clean Architecture

```typescript
// ============================================
// TESTING
// ============================================

// Test entities (no mocks needed)
describe('Order', () => {
    it('should create order with items', () => {
        const items = [
            new OrderItem('product-1', 'Product 1', 2, 10.00)
        ];
        
        const order = Order.create('customer-1', items);
        
        expect(order.getItems()).toHaveLength(1);
        expect(order.getTotalAmount()).toBe(20.00);
        expect(order.getStatus()).toBe(OrderStatus.Draft);
    });

    it('should not allow modifying confirmed order', () => {
        const order = Order.create('customer-1', [
            new OrderItem('product-1', 'Product 1', 1, 10.00)
        ]);
        
        order.submit();
        order.confirm();
        
        expect(() => {
            order.addItem(new OrderItem('product-2', 'Product 2', 1, 20.00));
        }).toThrow('Cannot modify order that is not in draft status');
    });
});

// Test use cases with mocks
describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;
    let mockRepository: jest.Mocked<OrderRepository>;
    let mockNotification: jest.Mocked<NotificationService>;

    beforeEach(() => {
        mockRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByCustomerId: jest.fn()
        };

        mockNotification = {
            sendOrderConfirmation: jest.fn()
        };

        useCase = new CreateOrderUseCase(mockRepository, mockNotification);
    });

    it('should create and save order', async () => {
        const input: CreateOrderInput = {
            customerId: 'customer-1',
            items: [
                { productId: 'product-1', productName: 'Product 1', quantity: 2, unitPrice: 10.00 }
            ]
        };

        const output = await useCase.execute(input);

        expect(output.orderId).toBeDefined();
        expect(output.totalAmount).toBe(20.00);
        expect(output.status).toBe(OrderStatus.Pending);
        expect(mockRepository.save).toHaveBeenCalled();
        expect(mockNotification.sendOrderConfirmation).toHaveBeenCalled();
    });
});
```

## Benefits of Clean Architecture

### ✅ Advantages

1. **Independence**: Business logic independent of frameworks
2. **Testability**: Easy to test without UI, database, or external services
3. **Flexibility**: Swap implementations without touching business logic
4. **Maintainability**: Clear separation makes changes easier
5. **Framework Agnostic**: Not locked into specific technologies
6. **Domain-Centric**: Focus on business rules, not technical details

### ❌ Disadvantages

1. **Complexity**: More layers and abstractions
2. **Boilerplate**: Many interfaces and DTOs
3. **Learning Curve**: Requires understanding of dependency inversion
4. **Over-engineering**: Overkill for simple applications

## Best Practices

### 1. Keep Entities Pure

```typescript
// ✅ Good: Pure business logic
class Order {
    confirm(): void {
        if (this.status !== OrderStatus.Pending) {
            throw new Error('Can only confirm pending orders');
        }
        this.status = OrderStatus.Confirmed;
    }
}

// ❌ Bad: Entity depends on infrastructure
class Order {
    async confirm(db: Database): Promise<void> {
        await db.query('UPDATE orders SET status = ?', ['CONFIRMED']);
    }
}
```

### 2. Use Interfaces for Boundaries

```typescript
// ✅ Good: Use case defines interface
interface OrderRepository {
    save(order: Order): Promise<void>;
}

class CreateOrderUseCase {
    constructor(private repo: OrderRepository) {}
}

// ❌ Bad: Use case depends on concrete implementation
import { PostgresRepository } from './postgres';

class CreateOrderUseCase {
    constructor(private repo: PostgresRepository) {}
}
```

### 3. Keep DTOs Simple

```typescript
// ✅ Good: Simple data transfer object
interface CreateOrderInput {
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
}

// ❌ Bad: DTOs with behavior
interface CreateOrderInput {
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
    validate(): boolean;  // Behavior in DTO
}
```

## Summary

**Clean Architecture** separates concerns through concentric layers:

1. **Entities**: Core business rules (innermost)
2. **Use Cases**: Application-specific business rules
3. **Interface Adapters**: Convert between use cases and external world
4. **Frameworks**: External tools (outermost)
5. **Dependency Rule**: Dependencies point inward only
6. **Benefits**: Testability, flexibility, maintainability
7. **When to Use**: Complex business logic, long-lived applications

**Key Takeaway**: Clean Architecture keeps business logic pure and independent by inverting dependencies. Perfect for applications with complex business rules that need to be maintained long-term.

---

**Next**: Explore [MVC/MVVM](../06-mvc-mvvm.md) for UI-focused architectural patterns.
