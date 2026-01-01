# Hexagonal Architecture (Ports and Adapters)

## What is Hexagonal Architecture?

**Hexagonal Architecture** (also called **Ports and Adapters**) was introduced by Alistair Cockburn to create applications that can be equally driven by users, programs, automated tests, or batch scripts, and can be developed and tested in isolation from eventual runtime devices and databases.

The key insight: **The business logic should not depend on external concerns**.

### Visual Representation

```
                    ┌─────────────────┐
                    │  Web API (HTTP) │ ← Adapter
                    └────────┬────────┘
                             │
              ┌──────────────▼──────────────┐
              │        PORT (Input)         │
              ├─────────────────────────────┤
              │                             │
              │     HEXAGON (CORE)          │
              │   Business Logic Domain     │ ← Framework-independent
              │                             │
              ├─────────────────────────────┤
              │       PORT (Output)         │
              └──────────────┬──────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌──────▼──────┐    ┌──────▼──────┐
    │ Database │      │  Email SMTP │    │   Message   │
    │ Adapter  │      │   Adapter   │    │Queue Adapter│
    └──────────┘      └─────────────┘    └─────────────┘
```

## Core Concepts

### 1. The Hexagon (Core Domain)
- **Contains**: Business logic, domain entities, use cases
- **Dependencies**: NONE - completely isolated
- **Rules**: No framework dependencies, no infrastructure dependencies

### 2. Ports
- **Definition**: Interfaces that define how the outside world communicates with the core
- **Types**: 
  - **Input Ports** (Driving): How external actors use the application
  - **Output Ports** (Driven): How the application uses external resources
- **Purpose**: Create boundaries and contracts

### 3. Adapters
- **Definition**: Implementations that connect ports to specific technologies
- **Types**:
  - **Primary/Driving Adapters**: REST API, GraphQL, CLI, Web UI
  - **Secondary/Driven Adapters**: Database, Email, Message Queue, External API
- **Purpose**: Translate between external world and domain

## Why Hexagonal Architecture?

### Problems It Solves

1. **Tight Coupling**: Business logic tied to framework or database
2. **Hard to Test**: Can't test without database or HTTP server
3. **Technology Lock-in**: Changing database means rewriting business logic
4. **Parallel Development**: Can't develop frontend and backend independently

### Solutions It Provides

1. **Dependency Inversion**: Core doesn't depend on infrastructure
2. **Testability**: Test core with mock adapters
3. **Flexibility**: Swap adapters without touching core
4. **Isolation**: Develop and test core in isolation

## Implementation in TypeScript

### Step 1: Define the Core Domain

```typescript
// ============================================
// DOMAIN ENTITIES (inside hexagon)
// ============================================

class Order {
    constructor(
        public readonly id: string,
        public readonly customerId: string,
        public readonly items: OrderItem[],
        public readonly status: OrderStatus,
        public readonly total: number,
        public readonly createdAt: Date
    ) {}

    static create(customerId: string, items: OrderItem[]): Order {
        if (items.length === 0) {
            throw new DomainError('Order must have at least one item');
        }

        const total = items.reduce((sum, item) => sum + item.subtotal, 0);

        return new Order(
            generateId(),
            customerId,
            items,
            OrderStatus.Pending,
            total,
            new Date()
        );
    }

    canBeCancelled(): boolean {
        return this.status === OrderStatus.Pending || 
               this.status === OrderStatus.Confirmed;
    }
}

class OrderItem {
    constructor(
        public readonly productId: string,
        public readonly quantity: number,
        public readonly price: number,
        public readonly subtotal: number
    ) {}

    static create(productId: string, quantity: number, price: number): OrderItem {
        if (quantity <= 0) {
            throw new DomainError('Quantity must be positive');
        }
        if (price < 0) {
            throw new DomainError('Price cannot be negative');
        }

        return new OrderItem(productId, quantity, price, quantity * price);
    }
}

enum OrderStatus {
    Pending = 'PENDING',
    Confirmed = 'CONFIRMED',
    Shipped = 'SHIPPED',
    Delivered = 'DELIVERED',
    Cancelled = 'CANCELLED'
}

class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainError';
    }
}

function generateId(): string {
    return crypto.randomUUID();
}
```

### Step 2: Define Output Ports (What Core Needs)

```typescript
// ============================================
// OUTPUT PORTS (interfaces defined by core)
// ============================================

// Port for persisting orders
interface OrderRepository {
    save(order: Order): Promise<void>;
    findById(id: string): Promise<Order | null>;
    findByCustomerId(customerId: string): Promise<Order[]>;
    delete(id: string): Promise<void>;
}

// Port for sending notifications
interface NotificationService {
    sendOrderConfirmation(order: Order): Promise<void>;
    sendOrderCancellation(order: Order): Promise<void>;
    sendOrderShipped(order: Order): Promise<void>;
}

// Port for payment processing
interface PaymentService {
    processPayment(orderId: string, amount: number): Promise<PaymentResult>;
    refund(orderId: string, amount: number): Promise<void>;
}

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
}

// Port for inventory management
interface InventoryService {
    checkAvailability(productId: string, quantity: number): Promise<boolean>;
    reserve(productId: string, quantity: number): Promise<void>;
    release(productId: string, quantity: number): Promise<void>;
}
```

### Step 3: Define Input Ports (Use Cases)

```typescript
// ============================================
// INPUT PORTS (use cases)
// ============================================

interface CreateOrderUseCase {
    execute(command: CreateOrderCommand): Promise<CreateOrderResult>;
}

interface CreateOrderCommand {
    customerId: string;
    items: Array<{
        productId: string;
        quantity: number;
        price: number;
    }>;
}

interface CreateOrderResult {
    orderId: string;
    total: number;
    status: OrderStatus;
}

interface CancelOrderUseCase {
    execute(orderId: string): Promise<void>;
}

interface GetOrderUseCase {
    execute(orderId: string): Promise<Order>;
}
```

### Step 4: Implement Use Cases (Application Services)

```typescript
// ============================================
// USE CASE IMPLEMENTATIONS (inside hexagon)
// ============================================

class CreateOrderService implements CreateOrderUseCase {
    constructor(
        private orderRepository: OrderRepository,
        private inventoryService: InventoryService,
        private paymentService: PaymentService,
        private notificationService: NotificationService
    ) {}

    async execute(command: CreateOrderCommand): Promise<CreateOrderResult> {
        // 1. Validate inventory availability
        for (const item of command.items) {
            const available = await this.inventoryService.checkAvailability(
                item.productId,
                item.quantity
            );
            
            if (!available) {
                throw new DomainError(`Product ${item.productId} not available`);
            }
        }

        // 2. Create order entity
        const orderItems = command.items.map(item =>
            OrderItem.create(item.productId, item.quantity, item.price)
        );
        
        const order = Order.create(command.customerId, orderItems);

        // 3. Reserve inventory
        for (const item of command.items) {
            await this.inventoryService.reserve(item.productId, item.quantity);
        }

        // 4. Process payment
        const paymentResult = await this.paymentService.processPayment(
            order.id,
            order.total
        );

        if (!paymentResult.success) {
            // Rollback inventory
            for (const item of command.items) {
                await this.inventoryService.release(item.productId, item.quantity);
            }
            throw new DomainError(`Payment failed: ${paymentResult.errorMessage}`);
        }

        // 5. Save order
        await this.orderRepository.save(order);

        // 6. Send notification
        await this.notificationService.sendOrderConfirmation(order);

        return {
            orderId: order.id,
            total: order.total,
            status: order.status
        };
    }
}

class CancelOrderService implements CancelOrderUseCase {
    constructor(
        private orderRepository: OrderRepository,
        private paymentService: PaymentService,
        private inventoryService: InventoryService,
        private notificationService: NotificationService
    ) {}

    async execute(orderId: string): Promise<void> {
        // 1. Find order
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new DomainError('Order not found');
        }

        // 2. Check if can be cancelled
        if (!order.canBeCancelled()) {
            throw new DomainError(`Order cannot be cancelled (status: ${order.status})`);
        }

        // 3. Refund payment
        await this.paymentService.refund(order.id, order.total);

        // 4. Release inventory
        for (const item of order.items) {
            await this.inventoryService.release(item.productId, item.quantity);
        }

        // 5. Update order status
        const cancelledOrder = new Order(
            order.id,
            order.customerId,
            order.items,
            OrderStatus.Cancelled,
            order.total,
            order.createdAt
        );

        await this.orderRepository.save(cancelledOrder);

        // 6. Send notification
        await this.notificationService.sendOrderCancellation(cancelledOrder);
    }
}

class GetOrderService implements GetOrderUseCase {
    constructor(private orderRepository: OrderRepository) {}

    async execute(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new DomainError('Order not found');
        }
        return order;
    }
}
```

### Step 5: Implement Adapters (Infrastructure)

```typescript
// ============================================
// OUTPUT ADAPTERS (infrastructure implementations)
// ============================================

// Database adapter
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

    async delete(id: string): Promise<void> {
        this.orders.delete(id);
    }
}

// Real database adapter (PostgreSQL)
class PostgresOrderRepository implements OrderRepository {
    constructor(private db: any) {} // e.g., pg Pool

    async save(order: Order): Promise<void> {
        await this.db.query(
            `INSERT INTO orders (id, customer_id, status, total, created_at) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE 
             SET status = $3`,
            [order.id, order.customerId, order.status, order.total, order.createdAt]
        );

        // Save order items...
    }

    async findById(id: string): Promise<Order | null> {
        const result = await this.db.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) return null;
        
        // Map database row to domain entity
        return this.toDomainModel(result.rows[0]);
    }

    async findByCustomerId(customerId: string): Promise<Order[]> {
        const result = await this.db.query(
            'SELECT * FROM orders WHERE customer_id = $1',
            [customerId]
        );
        
        return result.rows.map(row => this.toDomainModel(row));
    }

    async delete(id: string): Promise<void> {
        await this.db.query('DELETE FROM orders WHERE id = $1', [id]);
    }

    private toDomainModel(row: any): Order {
        // Map database row to domain entity
        return new Order(
            row.id,
            row.customer_id,
            [], // Load items separately
            row.status,
            row.total,
            row.created_at
        );
    }
}

// Email notification adapter
class SmtpNotificationService implements NotificationService {
    constructor(private smtpConfig: any) {}

    async sendOrderConfirmation(order: Order): Promise<void> {
        console.log(`[SMTP] Sending order confirmation for ${order.id}`);
        // Send email via SMTP
    }

    async sendOrderCancellation(order: Order): Promise<void> {
        console.log(`[SMTP] Sending order cancellation for ${order.id}`);
        // Send email via SMTP
    }

    async sendOrderShipped(order: Order): Promise<void> {
        console.log(`[SMTP] Sending shipment notification for ${order.id}`);
        // Send email via SMTP
    }
}

// Console notification adapter (for testing)
class ConsoleNotificationService implements NotificationService {
    async sendOrderConfirmation(order: Order): Promise<void> {
        console.log(`✉️  Order ${order.id} confirmed`);
    }

    async sendOrderCancellation(order: Order): Promise<void> {
        console.log(`✉️  Order ${order.id} cancelled`);
    }

    async sendOrderShipped(order: Order): Promise<void> {
        console.log(`✉️  Order ${order.id} shipped`);
    }
}

// Stripe payment adapter
class StripePaymentService implements PaymentService {
    constructor(private stripeClient: any) {}

    async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
        try {
            const charge = await this.stripeClient.charges.create({
                amount: amount * 100, // Stripe uses cents
                currency: 'usd',
                description: `Order ${orderId}`
            });

            return {
                success: true,
                transactionId: charge.id
            };
        } catch (error: any) {
            return {
                success: false,
                errorMessage: error.message
            };
        }
    }

    async refund(orderId: string, amount: number): Promise<void> {
        console.log(`[Stripe] Refunding ${amount} for order ${orderId}`);
        // Implement refund via Stripe
    }
}

// Mock payment adapter (for testing)
class MockPaymentService implements PaymentService {
    private shouldSucceed: boolean = true;

    setShouldSucceed(value: boolean): void {
        this.shouldSucceed = value;
    }

    async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
        if (this.shouldSucceed) {
            return {
                success: true,
                transactionId: `mock-txn-${Date.now()}`
            };
        } else {
            return {
                success: false,
                errorMessage: 'Insufficient funds'
            };
        }
    }

    async refund(orderId: string, amount: number): Promise<void> {
        console.log(`[Mock] Refunded ${amount} for order ${orderId}`);
    }
}

// Inventory adapter
class InMemoryInventoryService implements InventoryService {
    private inventory = new Map<string, number>([
        ['product-1', 100],
        ['product-2', 50],
        ['product-3', 200]
    ]);

    async checkAvailability(productId: string, quantity: number): Promise<boolean> {
        const available = this.inventory.get(productId) || 0;
        return available >= quantity;
    }

    async reserve(productId: string, quantity: number): Promise<void> {
        const available = this.inventory.get(productId) || 0;
        this.inventory.set(productId, available - quantity);
    }

    async release(productId: string, quantity: number): Promise<void> {
        const available = this.inventory.get(productId) || 0;
        this.inventory.set(productId, available + quantity);
    }
}
```

### Step 6: Implement Input Adapters (API/UI)

```typescript
// ============================================
// INPUT ADAPTERS (API layer)
// ============================================

// REST API adapter
class OrderRestController {
    constructor(
        private createOrderUseCase: CreateOrderUseCase,
        private cancelOrderUseCase: CancelOrderUseCase,
        private getOrderUseCase: GetOrderUseCase
    ) {}

    async createOrder(req: any, res: any): Promise<void> {
        try {
            const result = await this.createOrderUseCase.execute({
                customerId: req.body.customerId,
                items: req.body.items
            });

            res.status(201).json({
                orderId: result.orderId,
                total: result.total,
                status: result.status
            });
        } catch (error) {
            if (error instanceof DomainError) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    async getOrder(req: any, res: any): Promise<void> {
        try {
            const order = await this.getOrderUseCase.execute(req.params.id);
            
            res.json({
                id: order.id,
                customerId: order.customerId,
                items: order.items,
                status: order.status,
                total: order.total,
                createdAt: order.createdAt
            });
        } catch (error) {
            if (error instanceof DomainError) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    async cancelOrder(req: any, res: any): Promise<void> {
        try {
            await this.cancelOrderUseCase.execute(req.params.id);
            res.status(204).send();
        } catch (error) {
            if (error instanceof DomainError) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
}

// GraphQL adapter
class OrderGraphQLResolver {
    constructor(
        private createOrderUseCase: CreateOrderUseCase,
        private getOrderUseCase: GetOrderUseCase
    ) {}

    async createOrder(parent: any, args: any, context: any): Promise<any> {
        const result = await this.createOrderUseCase.execute({
            customerId: args.customerId,
            items: args.items
        });

        return {
            orderId: result.orderId,
            total: result.total,
            status: result.status
        };
    }

    async order(parent: any, args: any, context: any): Promise<any> {
        const order = await this.getOrderUseCase.execute(args.id);
        
        return {
            id: order.id,
            customerId: order.customerId,
            items: order.items,
            status: order.status,
            total: order.total
        };
    }
}

// CLI adapter
class OrderCLI {
    constructor(
        private createOrderUseCase: CreateOrderUseCase,
        private getOrderUseCase: GetOrderUseCase
    ) {}

    async handleCommand(command: string, args: string[]): Promise<void> {
        switch (command) {
            case 'create':
                await this.createOrderCommand(args);
                break;
            case 'get':
                await this.getOrderCommand(args);
                break;
            default:
                console.log('Unknown command');
        }
    }

    private async createOrderCommand(args: string[]): Promise<void> {
        const result = await this.createOrderUseCase.execute({
            customerId: args[0],
            items: JSON.parse(args[1])
        });

        console.log(`Order created: ${result.orderId}`);
        console.log(`Total: $${result.total}`);
    }

    private async getOrderCommand(args: string[]): Promise<void> {
        const order = await this.getOrderUseCase.execute(args[0]);
        
        console.log(`Order: ${order.id}`);
        console.log(`Customer: ${order.customerId}`);
        console.log(`Status: ${order.status}`);
        console.log(`Total: $${order.total}`);
    }
}
```

### Step 7: Wire Everything Together (Composition Root)

```typescript
// ============================================
// COMPOSITION ROOT
// ============================================

// Development configuration (in-memory)
function createDevelopmentApp() {
    // Create adapters
    const orderRepository = new InMemoryOrderRepository();
    const inventoryService = new InMemoryInventoryService();
    const paymentService = new MockPaymentService();
    const notificationService = new ConsoleNotificationService();

    // Create use cases
    const createOrderUseCase = new CreateOrderService(
        orderRepository,
        inventoryService,
        paymentService,
        notificationService
    );

    const cancelOrderUseCase = new CancelOrderService(
        orderRepository,
        paymentService,
        inventoryService,
        notificationService
    );

    const getOrderUseCase = new GetOrderService(orderRepository);

    // Create input adapters
    const restController = new OrderRestController(
        createOrderUseCase,
        cancelOrderUseCase,
        getOrderUseCase
    );

    return { restController };
}

// Production configuration (real services)
function createProductionApp() {
    // Create adapters
    const orderRepository = new PostgresOrderRepository(createDbPool());
    const inventoryService = new InMemoryInventoryService(); // Replace with real service
    const paymentService = new StripePaymentService(createStripeClient());
    const notificationService = new SmtpNotificationService(createSmtpConfig());

    // Create use cases
    const createOrderUseCase = new CreateOrderService(
        orderRepository,
        inventoryService,
        paymentService,
        notificationService
    );

    const cancelOrderUseCase = new CancelOrderService(
        orderRepository,
        paymentService,
        inventoryService,
        notificationService
    );

    const getOrderUseCase = new GetOrderService(orderRepository);

    // Create input adapters
    const restController = new OrderRestController(
        createOrderUseCase,
        cancelOrderUseCase,
        getOrderUseCase
    );

    return { restController };
}

// Usage
const app = createDevelopmentApp();

// Example: Create order via REST
async function demo() {
    const mockReq = {
        body: {
            customerId: 'customer-1',
            items: [
                { productId: 'product-1', quantity: 2, price: 29.99 },
                { productId: 'product-2', quantity: 1, price: 49.99 }
            ]
        }
    };

    const mockRes = {
        status: (code: number) => ({
            json: (data: any) => console.log(`Response ${code}:`, data),
            send: () => console.log(`Response ${code}`)
        }),
        json: (data: any) => console.log('Response:', data)
    };

    await app.restController.createOrder(mockReq, mockRes);
}
```

## Benefits of Hexagonal Architecture

### ✅ Advantages

1. **Testability**: Test business logic without infrastructure
2. **Flexibility**: Swap adapters easily (e.g., database, email provider)
3. **Parallel Development**: Develop core and adapters independently
4. **Technology Independence**: Core is framework-agnostic
5. **Clear Boundaries**: Explicit contracts via ports
6. **Maintainability**: Changes isolated to specific adapters

### ❌ Disadvantages

1. **Complexity**: More files and abstractions
2. **Over-engineering**: Overkill for simple CRUD apps
3. **Learning Curve**: Requires understanding of dependency inversion
4. **Boilerplate**: More interfaces and implementations

## Testing Hexagonal Architecture

```typescript
// ============================================
// TESTING
// ============================================

describe('CreateOrderService', () => {
    let createOrderService: CreateOrderService;
    let mockOrderRepo: jest.Mocked<OrderRepository>;
    let mockInventory: jest.Mocked<InventoryService>;
    let mockPayment: jest.Mocked<PaymentService>;
    let mockNotification: jest.Mocked<NotificationService>;

    beforeEach(() => {
        // Create mocks
        mockOrderRepo = {
            save: jest.fn(),
            findById: jest.fn(),
            findByCustomerId: jest.fn(),
            delete: jest.fn()
        };

        mockInventory = {
            checkAvailability: jest.fn(),
            reserve: jest.fn(),
            release: jest.fn()
        };

        mockPayment = {
            processPayment: jest.fn(),
            refund: jest.fn()
        };

        mockNotification = {
            sendOrderConfirmation: jest.fn(),
            sendOrderCancellation: jest.fn(),
            sendOrderShipped: jest.fn()
        };

        // Create service with mocks
        createOrderService = new CreateOrderService(
            mockOrderRepo,
            mockInventory,
            mockPayment,
            mockNotification
        );
    });

    it('should create order successfully', async () => {
        // Arrange
        mockInventory.checkAvailability.mockResolvedValue(true);
        mockPayment.processPayment.mockResolvedValue({
            success: true,
            transactionId: 'txn-123'
        });

        const command: CreateOrderCommand = {
            customerId: 'customer-1',
            items: [
                { productId: 'product-1', quantity: 2, price: 29.99 }
            ]
        };

        // Act
        const result = await createOrderService.execute(command);

        // Assert
        expect(result.orderId).toBeDefined();
        expect(result.total).toBe(59.98);
        expect(result.status).toBe(OrderStatus.Pending);
        
        expect(mockInventory.checkAvailability).toHaveBeenCalledWith('product-1', 2);
        expect(mockInventory.reserve).toHaveBeenCalledWith('product-1', 2);
        expect(mockPayment.processPayment).toHaveBeenCalled();
        expect(mockOrderRepo.save).toHaveBeenCalled();
        expect(mockNotification.sendOrderConfirmation).toHaveBeenCalled();
    });

    it('should rollback inventory if payment fails', async () => {
        // Arrange
        mockInventory.checkAvailability.mockResolvedValue(true);
        mockPayment.processPayment.mockResolvedValue({
            success: false,
            errorMessage: 'Insufficient funds'
        });

        const command: CreateOrderCommand = {
            customerId: 'customer-1',
            items: [
                { productId: 'product-1', quantity: 2, price: 29.99 }
            ]
        };

        // Act & Assert
        await expect(createOrderService.execute(command)).rejects.toThrow('Payment failed');
        
        expect(mockInventory.reserve).toHaveBeenCalled();
        expect(mockInventory.release).toHaveBeenCalled(); // Rollback
        expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
});
```

## Best Practices

### 1. Keep Core Pure

```typescript
// ✅ Good: Core has no dependencies
class Order {
    validate(): void {
        if (this.items.length === 0) {
            throw new DomainError('Order must have items');
        }
    }
}

// ❌ Bad: Core depends on framework
import { Entity } from 'typeorm';

@Entity()
class Order {
    // TypeORM decorators leak into domain
}
```

### 2. Define Ports in Core

```typescript
// ✅ Good: Core defines what it needs
interface OrderRepository {
    save(order: Order): Promise<void>;
}

// Core uses the interface
class OrderService {
    constructor(private repo: OrderRepository) {}
}

// ❌ Bad: Core imports adapter
import { PostgresRepository } from './infrastructure';

class OrderService {
    constructor(private repo: PostgresRepository) {} // Tight coupling
}
```

### 3. One Port, Multiple Adapters

```typescript
// Port
interface NotificationService {
    notify(message: string): Promise<void>;
}

// Adapters
class EmailAdapter implements NotificationService {
    async notify(message: string): Promise<void> {
        // Send email
    }
}

class SmsAdapter implements NotificationService {
    async notify(message: string): Promise<void> {
        // Send SMS
    }
}

class SlackAdapter implements NotificationService {
    async notify(message: string): Promise<void> {
        // Send Slack message
    }
}
```

## Summary

**Hexagonal Architecture** isolates business logic from infrastructure:

1. **Core**: Business logic with no dependencies
2. **Ports**: Interfaces defining contracts
3. **Adapters**: Implementations connecting to real world
4. **Benefits**: Testability, flexibility, independence
5. **When to Use**: Complex business logic, need for multiple interfaces
6. **Avoid**: Simple CRUD apps, prototypes

**Key Takeaway**: The hexagon (core) defines ports (interfaces), and adapters implement them. This inverts dependencies so the core never depends on infrastructure, making it highly testable and flexible.

---

**Next**: Explore [Microservices Architecture](../03-microservices.md) for distributed systems and service-oriented design.
