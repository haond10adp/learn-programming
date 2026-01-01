# Microservices Architecture

## What is Microservices Architecture?

**Microservices Architecture** is a design approach where an application is composed of small, independent services that communicate over a network. Each service is self-contained, owns its data, and can be developed, deployed, and scaled independently.

### Monolith vs Microservices

```
MONOLITH                          MICROSERVICES
┌──────────────────────┐         ┌────────┐  ┌─────────┐  ┌────────┐
│                      │         │ User   │  │ Order   │  │Product │
│   Single             │         │Service │  │Service  │  │Service │
│   Application        │  ───►   └───┬────┘  └────┬────┘  └───┬────┘
│                      │             │            │           │
│   Shared Database    │             ▼            ▼           ▼
└──────────────────────┘         ┌────┐      ┌─────┐     ┌──────┐
                                 │User│      │Order│     │Product│
                                 │ DB │      │ DB  │     │  DB  │
                                 └────┘      └─────┘     └──────┘
```

## Core Principles

### 1. Single Responsibility
Each service does one thing well and owns one business capability

### 2. Independence
Services can be developed, deployed, and scaled independently

### 3. Decentralization
Distributed data management and decentralized governance

### 4. Failure Isolation
Failure in one service doesn't cascade to others

### 5. Technology Diversity
Each service can use different tech stack

## Key Characteristics

### Service Boundaries
- **Organized around business capabilities**: User service, Order service, Payment service
- **Own their data**: Each service has its own database
- **Communicate via APIs**: HTTP/REST, gRPC, message queues

### Communication Patterns

#### Synchronous (Request/Response)
```
┌──────────┐                 ┌──────────┐
│  Order   │  HTTP Request   │ Payment  │
│ Service  │ ───────────►    │ Service  │
│          │  ◄───────────   │          │
└──────────┘  HTTP Response  └──────────┘
```

#### Asynchronous (Event-Driven)
```
┌──────────┐                      ┌──────────┐
│  Order   │  OrderCreated Event  │Inventory │
│ Service  │ ─────────────────►   │ Service  │
└──────────┘  (Message Queue)     └──────────┘
```

## Implementation in TypeScript

### Service 1: User Service

```typescript
// ============================================
// USER SERVICE
// ============================================

import express from 'express';
import { createClient } from 'redis';

// Domain
interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

// Repository
class UserRepository {
    private users = new Map<string, User>();

    async save(user: User): Promise<void> {
        this.users.set(user.id, user);
    }

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
}

// Service
class UserService {
    constructor(
        private userRepo: UserRepository,
        private eventPublisher: EventPublisher
    ) {}

    async createUser(email: string, name: string): Promise<User> {
        // Check if exists
        const existing = await this.userRepo.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        // Create user
        const user: User = {
            id: crypto.randomUUID(),
            email,
            name,
            createdAt: new Date()
        };

        await this.userRepo.save(user);

        // Publish event
        await this.eventPublisher.publish('user.created', {
            userId: user.id,
            email: user.email,
            name: user.name
        });

        return user;
    }

    async getUser(id: string): Promise<User> {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

// Event Publisher
interface EventPublisher {
    publish(eventType: string, data: any): Promise<void>;
}

class RedisEventPublisher implements EventPublisher {
    constructor(private redis: any) {}

    async publish(eventType: string, data: any): Promise<void> {
        await this.redis.publish(eventType, JSON.stringify(data));
    }
}

// API
class UserController {
    constructor(private userService: UserService) {}

    setupRoutes(app: express.Application): void {
        app.post('/users', async (req, res) => {
            try {
                const user = await this.userService.createUser(
                    req.body.email,
                    req.body.name
                );
                res.status(201).json(user);
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        });

        app.get('/users/:id', async (req, res) => {
            try {
                const user = await this.userService.getUser(req.params.id);
                res.json(user);
            } catch (error: any) {
                res.status(404).json({ error: error.message });
            }
        });
    }
}

// Bootstrap
async function startUserService() {
    const app = express();
    app.use(express.json());

    const redis = createClient();
    await redis.connect();

    const eventPublisher = new RedisEventPublisher(redis);
    const userRepo = new UserRepository();
    const userService = new UserService(userRepo, eventPublisher);
    const controller = new UserController(userService);

    controller.setupRoutes(app);

    app.listen(3001, () => {
        console.log('User Service running on port 3001');
    });
}
```

### Service 2: Order Service

```typescript
// ============================================
// ORDER SERVICE
// ============================================

import express from 'express';
import axios from 'axios';

// Domain
interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: OrderStatus;
    createdAt: Date;
}

interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

enum OrderStatus {
    Pending = 'PENDING',
    Confirmed = 'CONFIRMED',
    Cancelled = 'CANCELLED'
}

// Repository
class OrderRepository {
    private orders = new Map<string, Order>();

    async save(order: Order): Promise<void> {
        this.orders.set(order.id, order);
    }

    async findById(id: string): Promise<Order | null> {
        return this.orders.get(id) || null;
    }

    async findByUserId(userId: string): Promise<Order[]> {
        return Array.from(this.orders.values())
            .filter(order => order.userId === userId);
    }
}

// Service
class OrderService {
    constructor(
        private orderRepo: OrderRepository,
        private userServiceClient: UserServiceClient,
        private productServiceClient: ProductServiceClient,
        private eventPublisher: EventPublisher
    ) {}

    async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
        // 1. Validate user exists (call User Service)
        const userExists = await this.userServiceClient.userExists(userId);
        if (!userExists) {
            throw new Error('User not found');
        }

        // 2. Validate products and get prices (call Product Service)
        for (const item of items) {
            const product = await this.productServiceClient.getProduct(item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            if (!product.inStock) {
                throw new Error(`Product ${item.productId} out of stock`);
            }
        }

        // 3. Create order
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        const order: Order = {
            id: crypto.randomUUID(),
            userId,
            items,
            total,
            status: OrderStatus.Pending,
            createdAt: new Date()
        };

        await this.orderRepo.save(order);

        // 4. Publish event
        await this.eventPublisher.publish('order.created', {
            orderId: order.id,
            userId: order.userId,
            items: order.items,
            total: order.total
        });

        return order;
    }

    async getOrder(id: string): Promise<Order> {
        const order = await this.orderRepo.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    async confirmOrder(id: string): Promise<Order> {
        const order = await this.orderRepo.findById(id);
        if (!order) {
            throw new Error('Order not found');
        }

        order.status = OrderStatus.Confirmed;
        await this.orderRepo.save(order);

        await this.eventPublisher.publish('order.confirmed', {
            orderId: order.id,
            userId: order.userId
        });

        return order;
    }
}

// Service Clients (for inter-service communication)
interface UserServiceClient {
    userExists(userId: string): Promise<boolean>;
}

class HttpUserServiceClient implements UserServiceClient {
    private baseUrl = 'http://localhost:3001';

    async userExists(userId: string): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/users/${userId}`);
            return true;
        } catch (error) {
            return false;
        }
    }
}

interface ProductServiceClient {
    getProduct(productId: string): Promise<Product | null>;
}

interface Product {
    id: string;
    name: string;
    price: number;
    inStock: boolean;
}

class HttpProductServiceClient implements ProductServiceClient {
    private baseUrl = 'http://localhost:3003';

    async getProduct(productId: string): Promise<Product | null> {
        try {
            const response = await axios.get(`${this.baseUrl}/products/${productId}`);
            return response.data;
        } catch (error) {
            return null;
        }
    }
}

// API
class OrderController {
    constructor(private orderService: OrderService) {}

    setupRoutes(app: express.Application): void {
        app.post('/orders', async (req, res) => {
            try {
                const order = await this.orderService.createOrder(
                    req.body.userId,
                    req.body.items
                );
                res.status(201).json(order);
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        });

        app.get('/orders/:id', async (req, res) => {
            try {
                const order = await this.orderService.getOrder(req.params.id);
                res.json(order);
            } catch (error: any) {
                res.status(404).json({ error: error.message });
            }
        });

        app.post('/orders/:id/confirm', async (req, res) => {
            try {
                const order = await this.orderService.confirmOrder(req.params.id);
                res.json(order);
            } catch (error: any) {
                res.status(400).json({ error: error.message });
            }
        });
    }
}

// Bootstrap
async function startOrderService() {
    const app = express();
    app.use(express.json());

    const redis = createClient();
    await redis.connect();

    const eventPublisher = new RedisEventPublisher(redis);
    const orderRepo = new OrderRepository();
    const userServiceClient = new HttpUserServiceClient();
    const productServiceClient = new HttpProductServiceClient();
    
    const orderService = new OrderService(
        orderRepo,
        userServiceClient,
        productServiceClient,
        eventPublisher
    );
    
    const controller = new OrderController(orderService);
    controller.setupRoutes(app);

    app.listen(3002, () => {
        console.log('Order Service running on port 3002');
    });
}
```

### Service 3: Notification Service (Event-Driven)

```typescript
// ============================================
// NOTIFICATION SERVICE (Event Consumer)
// ============================================

import { createClient } from 'redis';

// Service
class NotificationService {
    async sendOrderConfirmation(orderId: string, userId: string): Promise<void> {
        console.log(`📧 Sending order confirmation for ${orderId} to user ${userId}`);
        // Send email via SMTP
    }

    async sendWelcomeEmail(userId: string, email: string): Promise<void> {
        console.log(`📧 Sending welcome email to ${email}`);
        // Send email via SMTP
    }
}

// Event Handler
class NotificationEventHandler {
    constructor(private notificationService: NotificationService) {}

    async handleUserCreated(event: any): Promise<void> {
        const { userId, email } = event;
        await this.notificationService.sendWelcomeEmail(userId, email);
    }

    async handleOrderConfirmed(event: any): Promise<void> {
        const { orderId, userId } = event;
        await this.notificationService.sendOrderConfirmation(orderId, userId);
    }
}

// Event Consumer
class RedisEventConsumer {
    constructor(
        private redis: any,
        private eventHandler: NotificationEventHandler
    ) {}

    async subscribe(): Promise<void> {
        const subscriber = this.redis.duplicate();
        await subscriber.connect();

        await subscriber.subscribe('user.created', (message: string) => {
            const event = JSON.parse(message);
            this.eventHandler.handleUserCreated(event);
        });

        await subscriber.subscribe('order.confirmed', (message: string) => {
            const event = JSON.parse(message);
            this.eventHandler.handleOrderConfirmed(event);
        });

        console.log('Notification Service subscribed to events');
    }
}

// Bootstrap
async function startNotificationService() {
    const redis = createClient();
    await redis.connect();

    const notificationService = new NotificationService();
    const eventHandler = new NotificationEventHandler(notificationService);
    const eventConsumer = new RedisEventConsumer(redis, eventHandler);

    await eventConsumer.subscribe();

    console.log('Notification Service running');
}
```

## Communication Patterns

### 1. Synchronous Communication (REST)

```typescript
// Service A calls Service B directly
class OrderService {
    async createOrder(userId: string): Promise<Order> {
        // Synchronous call to User Service
        const response = await fetch(`http://user-service/users/${userId}`);
        
        if (!response.ok) {
            throw new Error('User not found');
        }

        const user = await response.json();
        // Continue creating order...
    }
}
```

**Pros**: Simple, immediate response
**Cons**: Tight coupling, cascading failures

### 2. Asynchronous Communication (Events)

```typescript
// Service A publishes event, Service B subscribes
class OrderService {
    async createOrder(userId: string): Promise<Order> {
        const order = /* create order */;

        // Publish event (fire and forget)
        await this.eventBus.publish('order.created', {
            orderId: order.id,
            userId
        });

        return order;
    }
}

// In another service
class InventoryService {
    async handleOrderCreated(event: any): Promise<void> {
        const { orderId, items } = event;
        // Reserve inventory
        await this.reserveItems(items);
    }
}
```

**Pros**: Loose coupling, resilience
**Cons**: Eventual consistency, complex debugging

### 3. API Gateway Pattern

```typescript
// ============================================
// API GATEWAY
// ============================================

import express from 'express';
import axios from 'axios';

class ApiGateway {
    private app = express();

    constructor() {
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // User routes - proxy to User Service
        this.app.post('/api/users', async (req, res) => {
            try {
                const response = await axios.post('http://localhost:3001/users', req.body);
                res.status(response.status).json(response.data);
            } catch (error: any) {
                res.status(error.response?.status || 500).json(error.response?.data);
            }
        });

        // Order routes - proxy to Order Service
        this.app.post('/api/orders', async (req, res) => {
            try {
                const response = await axios.post('http://localhost:3002/orders', req.body);
                res.status(response.status).json(response.data);
            } catch (error: any) {
                res.status(error.response?.status || 500).json(error.response?.data);
            }
        });

        // Aggregation endpoint
        this.app.get('/api/users/:id/dashboard', async (req, res) => {
            try {
                const userId = req.params.id;

                // Call multiple services in parallel
                const [userResponse, ordersResponse] = await Promise.all([
                    axios.get(`http://localhost:3001/users/${userId}`),
                    axios.get(`http://localhost:3002/orders?userId=${userId}`)
                ]);

                res.json({
                    user: userResponse.data,
                    orders: ordersResponse.data
                });
            } catch (error: any) {
                res.status(500).json({ error: 'Failed to fetch dashboard' });
            }
        });
    }

    start(port: number): void {
        this.app.listen(port, () => {
            console.log(`API Gateway running on port ${port}`);
        });
    }
}

// Start gateway
const gateway = new ApiGateway();
gateway.start(3000);
```

## Service Discovery

### Static Configuration

```typescript
// config/services.ts
export const serviceConfig = {
    userService: 'http://localhost:3001',
    orderService: 'http://localhost:3002',
    productService: 'http://localhost:3003'
};

// Usage
const response = await fetch(`${serviceConfig.userService}/users/${id}`);
```

### Dynamic Discovery (Consul, Eureka)

```typescript
class ServiceDiscovery {
    private registry = new Map<string, string[]>();

    register(serviceName: string, url: string): void {
        const instances = this.registry.get(serviceName) || [];
        instances.push(url);
        this.registry.set(serviceName, instances);
    }

    discover(serviceName: string): string {
        const instances = this.registry.get(serviceName) || [];
        if (instances.length === 0) {
            throw new Error(`Service ${serviceName} not found`);
        }
        // Simple round-robin
        return instances[Math.floor(Math.random() * instances.length)];
    }
}

// Usage
const discovery = new ServiceDiscovery();
discovery.register('user-service', 'http://localhost:3001');
discovery.register('user-service', 'http://localhost:3011'); // Second instance

const serviceUrl = discovery.discover('user-service');
const response = await fetch(`${serviceUrl}/users/${id}`);
```

## Resilience Patterns

### Circuit Breaker

```typescript
class CircuitBreaker {
    private failureCount = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    constructor(
        private threshold: number = 5,
        private timeout: number = 60000 // 1 minute
    ) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }

    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.threshold) {
            this.state = 'OPEN';
        }
    }
}

// Usage
const circuitBreaker = new CircuitBreaker();

async function callUserService(userId: string): Promise<User> {
    return circuitBreaker.execute(async () => {
        const response = await fetch(`http://user-service/users/${userId}`);
        if (!response.ok) throw new Error('User service failed');
        return response.json();
    });
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Max retries exceeded');
}

// Usage
const user = await retryWithBackoff(() => 
    fetch('http://user-service/users/123').then(r => r.json())
);
```

## Data Management

### Database Per Service

```typescript
// User Service has its own database
class UserService {
    constructor(private userDb: Database) {}
    
    async getUser(id: string): Promise<User> {
        return await this.userDb.query('SELECT * FROM users WHERE id = ?', [id]);
    }
}

// Order Service has its own database
class OrderService {
    constructor(private orderDb: Database) {}
    
    async getOrder(id: string): Promise<Order> {
        return await this.orderDb.query('SELECT * FROM orders WHERE id = ?', [id]);
    }
}
```

### Saga Pattern (Distributed Transactions)

```typescript
// ============================================
// SAGA PATTERN
// ============================================

class OrderSaga {
    constructor(
        private orderService: OrderService,
        private paymentService: PaymentService,
        private inventoryService: InventoryService
    ) {}

    async executeCreateOrder(command: CreateOrderCommand): Promise<void> {
        let orderId: string;
        let paymentId: string;

        try {
            // Step 1: Create order
            orderId = await this.orderService.createOrder(command);

            // Step 2: Process payment
            paymentId = await this.paymentService.processPayment({
                orderId,
                amount: command.total
            });

            // Step 3: Reserve inventory
            await this.inventoryService.reserveItems(command.items);

            // Success - commit all
            await this.orderService.confirmOrder(orderId);

        } catch (error) {
            // Compensate (rollback)
            console.log('Saga failed, executing compensations');

            if (paymentId!) {
                await this.paymentService.refund(paymentId);
            }

            if (orderId!) {
                await this.orderService.cancelOrder(orderId);
            }

            throw error;
        }
    }
}
```

## Benefits and Challenges

### ✅ Advantages

1. **Independent Deployment**: Deploy services separately
2. **Technology Diversity**: Use best tool for each service
3. **Scalability**: Scale services independently
4. **Fault Isolation**: Failure doesn't affect all services
5. **Team Autonomy**: Teams own specific services
6. **Easier to Understand**: Small, focused codebases

### ❌ Challenges

1. **Complexity**: Distributed system complexity
2. **Data Consistency**: No ACID transactions across services
3. **Network Latency**: Remote calls slower than in-process
4. **Testing**: End-to-end testing difficult
5. **Deployment**: Managing many services
6. **Monitoring**: Need distributed tracing
7. **Development Setup**: Running multiple services locally

## When to Use Microservices

### ✅ Good Fit

- Large team (10+ developers)
- Complex business domain
- Need independent scalability
- Different parts change at different rates
- Need technology diversity

### ❌ Poor Fit

- Small team (<5 developers)
- Simple CRUD application
- Starting new product (use monolith first)
- Limited DevOps capability
- No clear service boundaries

## Best Practices

### 1. Design Around Business Capabilities

```typescript
// ✅ Good: Organized by business capability
// user-service/
// order-service/
// payment-service/
// notification-service/

// ❌ Bad: Organized by technical layer
// database-service/
// api-service/
// business-logic-service/
```

### 2. Decentralize Data Management

```typescript
// ✅ Good: Each service owns its data
class OrderService {
    private orderDb = new Database('orders');
}

class UserService {
    private userDb = new Database('users');
}

// ❌ Bad: Shared database
class OrderService {
    private db = new Database('shared');
}

class UserService {
    private db = new Database('shared'); // Same database!
}
```

### 3. Design for Failure

```typescript
// ✅ Good: Handle failures gracefully
async function getUser(id: string): Promise<User> {
    try {
        return await userServiceClient.getUser(id);
    } catch (error) {
        // Fallback or return cached data
        return getCachedUser(id);
    }
}

// ❌ Bad: No error handling
async function getUser(id: string): Promise<User> {
    return await userServiceClient.getUser(id); // What if it fails?
}
```

## Summary

**Microservices Architecture** decomposes applications into independent services:

1. **Structure**: Small, autonomous services with own data
2. **Communication**: REST, gRPC, or message queues
3. **Benefits**: Independence, scalability, fault isolation
4. **Challenges**: Complexity, consistency, testing
5. **When to Use**: Large teams, complex domains, need scalability
6. **Patterns**: API Gateway, Circuit Breaker, Saga, Service Discovery

**Key Takeaway**: Microservices provide flexibility and scalability but add significant complexity. Start with a monolith and migrate to microservices when team size and complexity justify it.

---

**Next**: Explore [Event-Driven Architecture](../04-event-driven.md) for asynchronous, reactive systems.
