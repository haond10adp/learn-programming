# Event-Driven Architecture

## What is Event-Driven Architecture?

**Event-Driven Architecture (EDA)** is a design pattern where components communicate by producing and consuming events. An event represents something that happened in the system (past tense), and components react to these events asynchronously.

### Traditional vs Event-Driven

```
TRADITIONAL (Request/Response)          EVENT-DRIVEN
┌────────┐                             ┌────────┐
│Service │  Call                       │Service │  Event
│   A    │ ────────►  ┌────────┐      │   A    │ ───────►  ┌──────────┐
│        │            │Service │      │        │           │  Event   │
│        │ ◄──────────│   B    │      └────────┘           │   Bus    │
└────────┘  Response  └────────┘                           └─────┬────┘
                                                                 │
Synchronous, blocking                                            ├─────► Service B
                                                                 ├─────► Service C
                                                                 └─────► Service D
                                                           
                                                           Asynchronous, non-blocking
```

## Core Concepts

### 1. Events
- **Definition**: Immutable facts about something that happened
- **Examples**: `UserRegistered`, `OrderPlaced`, `PaymentProcessed`
- **Characteristics**: Past tense, contains data, immutable

### 2. Event Producers
- **Role**: Generate and publish events
- **Examples**: Order Service publishes `OrderCreated`

### 3. Event Consumers
- **Role**: Listen to and react to events
- **Examples**: Notification Service listens to `OrderCreated`

### 4. Event Bus/Broker
- **Role**: Routes events from producers to consumers
- **Examples**: RabbitMQ, Kafka, Redis Pub/Sub, AWS EventBridge

## Event Types

### 1. Domain Events
Events that represent business occurrences

```typescript
interface UserRegisteredEvent {
    eventId: string;
    eventType: 'user.registered';
    timestamp: Date;
    data: {
        userId: string;
        email: string;
        name: string;
    };
}

interface OrderPlacedEvent {
    eventId: string;
    eventType: 'order.placed';
    timestamp: Date;
    data: {
        orderId: string;
        userId: string;
        items: Array<{ productId: string; quantity: number }>;
        total: number;
    };
}
```

### 2. Integration Events
Events for communication between bounded contexts or services

```typescript
interface PaymentProcessedEvent {
    eventId: string;
    eventType: 'payment.processed';
    timestamp: Date;
    data: {
        paymentId: string;
        orderId: string;
        amount: number;
        status: 'success' | 'failed';
    };
}
```

### 3. System Events
Technical events about system operations

```typescript
interface ServiceStartedEvent {
    eventId: string;
    eventType: 'system.service.started';
    timestamp: Date;
    data: {
        serviceName: string;
        version: string;
    };
}
```

## Implementation in TypeScript

### Event Bus Interface

```typescript
// ============================================
// EVENT BUS ABSTRACTION
// ============================================

interface Event {
    eventId: string;
    eventType: string;
    timestamp: Date;
    data: any;
}

interface EventHandler<T extends Event> {
    handle(event: T): Promise<void>;
}

interface EventBus {
    publish(event: Event): Promise<void>;
    subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void;
}
```

### In-Memory Event Bus

```typescript
// ============================================
// IN-MEMORY EVENT BUS (for development/testing)
// ============================================

class InMemoryEventBus implements EventBus {
    private handlers = new Map<string, EventHandler<any>[]>();

    async publish(event: Event): Promise<void> {
        const handlers = this.handlers.get(event.eventType) || [];
        
        // Execute handlers asynchronously
        await Promise.all(
            handlers.map(handler => 
                handler.handle(event).catch(error => {
                    console.error(`Error handling event ${event.eventType}:`, error);
                })
            )
        );
    }

    subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }
}
```

### Real Event Bus (Redis)

```typescript
// ============================================
// REDIS EVENT BUS
// ============================================

import { createClient, RedisClientType } from 'redis';

class RedisEventBus implements EventBus {
    private publisher: RedisClientType;
    private subscriber: RedisClientType;
    private handlers = new Map<string, EventHandler<any>[]>();

    constructor() {
        this.publisher = createClient();
        this.subscriber = createClient();
    }

    async connect(): Promise<void> {
        await this.publisher.connect();
        await this.subscriber.connect();
    }

    async publish(event: Event): Promise<void> {
        await this.publisher.publish(
            event.eventType,
            JSON.stringify(event)
        );
    }

    subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): void {
        // Register handler
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);

        // Subscribe to Redis channel
        this.subscriber.subscribe(eventType, async (message) => {
            const event = JSON.parse(message) as T;
            const handlers = this.handlers.get(eventType) || [];
            
            await Promise.all(
                handlers.map(h => 
                    h.handle(event).catch(error => {
                        console.error(`Error handling ${eventType}:`, error);
                    })
                )
            );
        });
    }
}
```

### Event Sourcing Implementation

```typescript
// ============================================
// EVENT SOURCING
// ============================================

// Event Store
interface EventStore {
    append(streamId: string, event: Event): Promise<void>;
    getEvents(streamId: string): Promise<Event[]>;
}

class InMemoryEventStore implements EventStore {
    private events = new Map<string, Event[]>();

    async append(streamId: string, event: Event): Promise<void> {
        const stream = this.events.get(streamId) || [];
        stream.push(event);
        this.events.set(streamId, stream);
    }

    async getEvents(streamId: string): Promise<Event[]> {
        return this.events.get(streamId) || [];
    }
}

// Aggregate Root
abstract class AggregateRoot {
    protected id: string;
    protected version: number = 0;
    private uncommittedEvents: Event[] = [];

    constructor(id: string) {
        this.id = id;
    }

    protected addEvent(event: Event): void {
        this.uncommittedEvents.push(event);
        this.applyEvent(event);
        this.version++;
    }

    abstract applyEvent(event: Event): void;

    getUncommittedEvents(): Event[] {
        return [...this.uncommittedEvents];
    }

    markEventsAsCommitted(): void {
        this.uncommittedEvents = [];
    }

    loadFromHistory(events: Event[]): void {
        events.forEach(event => {
            this.applyEvent(event);
            this.version++;
        });
    }
}

// Order Aggregate
interface OrderCreatedEvent extends Event {
    eventType: 'order.created';
    data: {
        orderId: string;
        userId: string;
        items: Array<{ productId: string; quantity: number; price: number }>;
        total: number;
    };
}

interface OrderConfirmedEvent extends Event {
    eventType: 'order.confirmed';
    data: {
        orderId: string;
    };
}

interface OrderCancelledEvent extends Event {
    eventType: 'order.cancelled';
    data: {
        orderId: string;
        reason: string;
    };
}

enum OrderStatus {
    Pending = 'PENDING',
    Confirmed = 'CONFIRMED',
    Cancelled = 'CANCELLED'
}

class Order extends AggregateRoot {
    private userId: string = '';
    private items: Array<{ productId: string; quantity: number; price: number }> = [];
    private total: number = 0;
    private status: OrderStatus = OrderStatus.Pending;

    static create(
        userId: string,
        items: Array<{ productId: string; quantity: number; price: number }>
    ): Order {
        const orderId = crypto.randomUUID();
        const order = new Order(orderId);

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const event: OrderCreatedEvent = {
            eventId: crypto.randomUUID(),
            eventType: 'order.created',
            timestamp: new Date(),
            data: { orderId, userId, items, total }
        };

        order.addEvent(event);
        return order;
    }

    confirm(): void {
        if (this.status !== OrderStatus.Pending) {
            throw new Error('Can only confirm pending orders');
        }

        const event: OrderConfirmedEvent = {
            eventId: crypto.randomUUID(),
            eventType: 'order.confirmed',
            timestamp: new Date(),
            data: { orderId: this.id }
        };

        this.addEvent(event);
    }

    cancel(reason: string): void {
        if (this.status === OrderStatus.Cancelled) {
            throw new Error('Order already cancelled');
        }

        const event: OrderCancelledEvent = {
            eventId: crypto.randomUUID(),
            eventType: 'order.cancelled',
            timestamp: new Date(),
            data: { orderId: this.id, reason }
        };

        this.addEvent(event);
    }

    applyEvent(event: Event): void {
        switch (event.eventType) {
            case 'order.created':
                this.applyOrderCreated(event as OrderCreatedEvent);
                break;
            case 'order.confirmed':
                this.applyOrderConfirmed(event as OrderConfirmedEvent);
                break;
            case 'order.cancelled':
                this.applyOrderCancelled(event as OrderCancelledEvent);
                break;
        }
    }

    private applyOrderCreated(event: OrderCreatedEvent): void {
        this.userId = event.data.userId;
        this.items = event.data.items;
        this.total = event.data.total;
        this.status = OrderStatus.Pending;
    }

    private applyOrderConfirmed(event: OrderConfirmedEvent): void {
        this.status = OrderStatus.Confirmed;
    }

    private applyOrderCancelled(event: OrderCancelledEvent): void {
        this.status = OrderStatus.Cancelled;
    }

    // Getters
    getStatus(): OrderStatus {
        return this.status;
    }

    getTotal(): number {
        return this.total;
    }

    getUserId(): string {
        return this.userId;
    }
}

// Repository
class OrderRepository {
    constructor(
        private eventStore: EventStore,
        private eventBus: EventBus
    ) {}

    async save(order: Order): Promise<void> {
        const events = order.getUncommittedEvents();

        // Save events to store
        for (const event of events) {
            await this.eventStore.append(order['id'], event);
        }

        // Publish events to bus
        for (const event of events) {
            await this.eventBus.publish(event);
        }

        order.markEventsAsCommitted();
    }

    async load(orderId: string): Promise<Order> {
        const events = await this.eventStore.getEvents(orderId);
        
        if (events.length === 0) {
            throw new Error('Order not found');
        }

        const order = new Order(orderId);
        order.loadFromHistory(events);
        return order;
    }
}
```

### CQRS (Command Query Responsibility Segregation)

```typescript
// ============================================
// CQRS PATTERN
// ============================================

// Commands (write operations)
interface Command {
    commandId: string;
    timestamp: Date;
}

interface CreateOrderCommand extends Command {
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
}

interface ConfirmOrderCommand extends Command {
    orderId: string;
}

// Command Handlers
interface CommandHandler<T extends Command> {
    handle(command: T): Promise<void>;
}

class CreateOrderCommandHandler implements CommandHandler<CreateOrderCommand> {
    constructor(private orderRepository: OrderRepository) {}

    async handle(command: CreateOrderCommand): Promise<void> {
        const order = Order.create(command.userId, command.items);
        await this.orderRepository.save(order);
    }
}

class ConfirmOrderCommandHandler implements CommandHandler<ConfirmOrderCommand> {
    constructor(private orderRepository: OrderRepository) {}

    async handle(command: ConfirmOrderCommand): Promise<void> {
        const order = await this.orderRepository.load(command.orderId);
        order.confirm();
        await this.orderRepository.save(order);
    }
}

// Queries (read operations)
interface OrderDTO {
    id: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    total: number;
    status: string;
    createdAt: Date;
}

interface OrderQuery {
    getOrderById(orderId: string): Promise<OrderDTO | null>;
    getOrdersByUserId(userId: string): Promise<OrderDTO[]>;
}

// Read Model (materialized view)
class OrderReadModel implements OrderQuery {
    private orders = new Map<string, OrderDTO>();
    private userOrders = new Map<string, Set<string>>();

    constructor(eventBus: EventBus) {
        // Subscribe to events to update read model
        eventBus.subscribe('order.created', {
            handle: async (event: OrderCreatedEvent) => {
                const order: OrderDTO = {
                    id: event.data.orderId,
                    userId: event.data.userId,
                    items: event.data.items,
                    total: event.data.total,
                    status: 'PENDING',
                    createdAt: event.timestamp
                };
                
                this.orders.set(order.id, order);
                
                const userOrderIds = this.userOrders.get(order.userId) || new Set();
                userOrderIds.add(order.id);
                this.userOrders.set(order.userId, userOrderIds);
            }
        });

        eventBus.subscribe('order.confirmed', {
            handle: async (event: OrderConfirmedEvent) => {
                const order = this.orders.get(event.data.orderId);
                if (order) {
                    order.status = 'CONFIRMED';
                }
            }
        });

        eventBus.subscribe('order.cancelled', {
            handle: async (event: OrderCancelledEvent) => {
                const order = this.orders.get(event.data.orderId);
                if (order) {
                    order.status = 'CANCELLED';
                }
            }
        });
    }

    async getOrderById(orderId: string): Promise<OrderDTO | null> {
        return this.orders.get(orderId) || null;
    }

    async getOrdersByUserId(userId: string): Promise<OrderDTO[]> {
        const orderIds = this.userOrders.get(userId) || new Set();
        return Array.from(orderIds)
            .map(id => this.orders.get(id))
            .filter((order): order is OrderDTO => order !== undefined);
    }
}
```

### Complete Example

```typescript
// ============================================
// COMPLETE EVENT-DRIVEN SYSTEM
// ============================================

// Event Handlers
class NotificationEventHandler implements EventHandler<OrderCreatedEvent> {
    async handle(event: OrderCreatedEvent): Promise<void> {
        console.log(`📧 Sending order confirmation for ${event.data.orderId}`);
        // Send email notification
    }
}

class InventoryEventHandler implements EventHandler<OrderCreatedEvent> {
    async handle(event: OrderCreatedEvent): Promise<void> {
        console.log(`📦 Reserving inventory for order ${event.data.orderId}`);
        // Reserve inventory
        for (const item of event.data.items) {
            console.log(`  - ${item.quantity}x ${item.productId}`);
        }
    }
}

class AnalyticsEventHandler implements EventHandler<OrderCreatedEvent> {
    async handle(event: OrderCreatedEvent): Promise<void> {
        console.log(`📊 Recording analytics for order ${event.data.orderId}`);
        // Send to analytics platform
    }
}

// Application Service
class OrderApplicationService {
    constructor(
        private createOrderHandler: CreateOrderCommandHandler,
        private confirmOrderHandler: ConfirmOrderCommandHandler,
        private orderQuery: OrderQuery
    ) {}

    // Write operations
    async createOrder(userId: string, items: any[]): Promise<void> {
        const command: CreateOrderCommand = {
            commandId: crypto.randomUUID(),
            timestamp: new Date(),
            userId,
            items
        };

        await this.createOrderHandler.handle(command);
    }

    async confirmOrder(orderId: string): Promise<void> {
        const command: ConfirmOrderCommand = {
            commandId: crypto.randomUUID(),
            timestamp: new Date(),
            orderId
        };

        await this.confirmOrderHandler.handle(command);
    }

    // Read operations
    async getOrder(orderId: string): Promise<OrderDTO | null> {
        return await this.orderQuery.getOrderById(orderId);
    }

    async getUserOrders(userId: string): Promise<OrderDTO[]> {
        return await this.orderQuery.getOrdersByUserId(userId);
    }
}

// Bootstrap
async function bootstrap() {
    // Create infrastructure
    const eventBus = new InMemoryEventBus();
    const eventStore = new InMemoryEventStore();

    // Create repository
    const orderRepository = new OrderRepository(eventStore, eventBus);

    // Create command handlers
    const createOrderHandler = new CreateOrderCommandHandler(orderRepository);
    const confirmOrderHandler = new ConfirmOrderCommandHandler(orderRepository);

    // Create read model
    const orderQuery = new OrderReadModel(eventBus);

    // Subscribe event handlers
    eventBus.subscribe('order.created', new NotificationEventHandler());
    eventBus.subscribe('order.created', new InventoryEventHandler());
    eventBus.subscribe('order.created', new AnalyticsEventHandler());

    // Create application service
    const orderService = new OrderApplicationService(
        createOrderHandler,
        confirmOrderHandler,
        orderQuery
    );

    return orderService;
}

// Usage
async function demo() {
    const orderService = await bootstrap();

    // Create order
    console.log('Creating order...');
    await orderService.createOrder('user-123', [
        { productId: 'product-1', quantity: 2, price: 29.99 },
        { productId: 'product-2', quantity: 1, price: 49.99 }
    ]);

    // Query orders
    const orders = await orderService.getUserOrders('user-123');
    console.log('\nUser orders:', orders);

    // Confirm order
    if (orders.length > 0) {
        console.log('\nConfirming order...');
        await orderService.confirmOrder(orders[0].id);
    }

    // Query again
    const confirmedOrders = await orderService.getUserOrders('user-123');
    console.log('\nUpdated orders:', confirmedOrders);
}
```

## Message Queue Integration

### RabbitMQ Example

```typescript
import amqp from 'amqplib';

class RabbitMQEventBus implements EventBus {
    private connection?: amqp.Connection;
    private channel?: amqp.Channel;
    private handlers = new Map<string, EventHandler<any>[]>();

    async connect(): Promise<void> {
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange('events', 'topic', { durable: true });
    }

    async publish(event: Event): Promise<void> {
        if (!this.channel) throw new Error('Not connected');

        this.channel.publish(
            'events',
            event.eventType,
            Buffer.from(JSON.stringify(event)),
            { persistent: true }
        );
    }

    async subscribe<T extends Event>(eventType: string, handler: EventHandler<T>): Promise<void> {
        if (!this.channel) throw new Error('Not connected');

        const queue = await this.channel.assertQueue('', { exclusive: true });
        await this.channel.bindQueue(queue.queue, 'events', eventType);

        this.channel.consume(queue.queue, async (msg) => {
            if (msg) {
                const event = JSON.parse(msg.content.toString()) as T;
                await handler.handle(event);
                this.channel!.ack(msg);
            }
        });
    }
}
```

## Benefits and Challenges

### ✅ Advantages

1. **Loose Coupling**: Components don't know about each other
2. **Scalability**: Handle high throughput with message queues
3. **Flexibility**: Add new consumers without changing producers
4. **Resilience**: System continues if one component fails
5. **Auditability**: Event store provides complete history
6. **Temporal Decoupling**: Producer and consumer don't need to be online simultaneously

### ❌ Disadvantages

1. **Complexity**: More moving parts to manage
2. **Eventual Consistency**: Data not immediately consistent
3. **Debugging**: Harder to trace flow through system
4. **Event Versioning**: Managing schema changes
5. **Message Ordering**: Handling out-of-order events
6. **Duplicate Events**: Need idempotent handlers

## Best Practices

### 1. Make Events Immutable

```typescript
// ✅ Good: Immutable event
interface OrderCreatedEvent {
    readonly eventId: string;
    readonly eventType: 'order.created';
    readonly timestamp: Date;
    readonly data: Readonly<{
        orderId: string;
        userId: string;
    }>;
}

// ❌ Bad: Mutable event
interface OrderCreatedEvent {
    eventId: string;
    data: {
        orderId: string;
        status: string; // Can be modified
    };
}
```

### 2. Include Event Metadata

```typescript
interface Event {
    eventId: string;
    eventType: string;
    timestamp: Date;
    correlationId?: string;  // For tracing
    causationId?: string;    // What caused this event
    userId?: string;         // Who triggered it
    version: number;         // Schema version
    data: any;
}
```

### 3. Handle Idempotency

```typescript
class IdempotentEventHandler implements EventHandler<Event> {
    private processedEvents = new Set<string>();

    async handle(event: Event): Promise<void> {
        // Check if already processed
        if (this.processedEvents.has(event.eventId)) {
            console.log(`Event ${event.eventId} already processed`);
            return;
        }

        // Process event
        await this.processEvent(event);

        // Mark as processed
        this.processedEvents.add(event.eventId);
    }

    private async processEvent(event: Event): Promise<void> {
        // Business logic
    }
}
```

## Summary

**Event-Driven Architecture** enables asynchronous, loosely-coupled systems:

1. **Events**: Immutable facts about what happened
2. **Event Bus**: Routes events from producers to consumers
3. **Event Sourcing**: Store all changes as events
4. **CQRS**: Separate read and write models
5. **Benefits**: Scalability, flexibility, resilience
6. **Challenges**: Complexity, eventual consistency, debugging

**Key Takeaway**: Event-driven architecture excels for complex systems needing loose coupling and high scalability, but adds complexity. Use when benefits outweigh costs.

---

**Next**: Explore [Clean Architecture](../05-clean.md) for Uncle Bob's layered approach to software design.
