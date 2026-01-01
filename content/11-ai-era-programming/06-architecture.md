# Architecture and System Design

> *"AI builds components. You design the system."*

## What AI Can't Do

**AI excels at implementing components** but struggles with high-level architecture. It can write a database repository or API endpoint, but it can't decide whether your system should be a monolith or microservices, or choose between event-driven and request-response.

```typescript
// AI can implement this:
class UserRepository {
  async findById(id: string): Promise<User> {
    return await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// But AI CAN'T decide:
// - Should we use repository pattern or active record?
// - SQL or NoSQL database?
// - Monolithic repo or microservices?
// - Synchronous or event-driven?
// - REST or GraphQL API?
```

## Why This Matters

Architecture decisions require:
- **Understanding business requirements**: What problem are we solving?
- **Knowing trade-offs**: Performance vs. simplicity, cost vs. scalability
- **Long-term thinking**: How will this evolve?
- **Team context**: What does the team know?
- **Infrastructure constraints**: What do we have available?

AI lacks this context and judgment.

## Architectural Decisions YOU Make

### 1. System Structure

```typescript
// YOU decide: Layered architecture

// Presentation Layer
class UserController {
  constructor(private service: UserService) {}
  
  async getUser(req: Request, res: Response) {
    const user = await this.service.getUser(req.params.id);
    res.json(user);
  }
}

// Business Logic Layer
class UserService {
  constructor(private repository: UserRepository) {}
  
  async getUser(id: string): Promise<User> {
    return await this.repository.findById(id);
  }
}

// Data Access Layer
class UserRepository {
  async findById(id: string): Promise<User> {
    return await this.db.query(/*...*/);
  }
}

// AI can implement each layer AFTER you design the structure
```

### 2. Communication Patterns

```typescript
// YOU decide: Event-driven architecture

// Event Bus (you design)
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}

// Components communicate via events
class OrderService {
  constructor(private eventBus: EventBus) {}
  
  async createOrder(order: Order): Promise<void> {
    await this.repository.save(order);
    
    // Publish event
    await this.eventBus.publish({
      type: 'OrderCreated',
      data: { orderId: order.id, userId: order.userId }
    });
  }
}

// Other services react to events
class InventoryService {
  constructor(eventBus: EventBus) {
    eventBus.subscribe('OrderCreated', this.handleOrderCreated);
  }
  
  private async handleOrderCreated(event: OrderCreatedEvent) {
    await this.reserveItems(event.data.orderId);
  }
}

// AI implements handlers AFTER you design event flow
```

### 3. Data Flow

```typescript
// YOU decide: CQRS (Command Query Responsibility Segregation)

// Commands (writes)
interface CreateUserCommand {
  email: string;
  name: string;
}

class UserCommandHandler {
  async handle(command: CreateUserCommand): Promise<void> {
    const user = new User(command.email, command.name);
    await this.writeRepository.save(user);
    await this.eventStore.append('UserCreated', user);
  }
}

// Queries (reads)
interface UserQuery {
  id: string;
}

class UserQueryHandler {
  async handle(query: UserQuery): Promise<UserReadModel> {
    // Read from optimized read model
    return await this.readRepository.findById(query.id);
  }
}

// AI implements handlers AFTER you design CQRS boundaries
```

### 4. Module Boundaries

```typescript
// YOU decide module structure:

// /src
//   /modules
//     /users
//       /domain       - User, UserAggregate
//       /application  - UserService, Commands
//       /infrastructure - UserRepository, UserController
//     /orders
//       /domain
//       /application
//       /infrastructure
//     /payments
//       /domain
//       /application
//       /infrastructure

// Each module is self-contained
// AI generates code within YOUR structure
```

## Trade-Off Analysis

### Example: Choosing Database

```typescript
// YOU analyze trade-offs:

// SQL (PostgreSQL):
// ✅ ACID transactions
// ✅ Complex queries
// ✅ Data integrity
// ❌ Harder to scale horizontally
// ❌ Schema migrations

// NoSQL (MongoDB):
// ✅ Flexible schema
// ✅ Horizontal scaling
// ✅ Fast reads
// ❌ Limited transactions
// ❌ No joins

// YOU decide based on:
// - Data structure (relational vs document)
// - Query patterns
// - Scale requirements
// - Team expertise

// THEN AI implements:
interface UserRepository {
  // AI generates PostgreSQL or MongoDB implementation
}
```

### Example: Monolith vs Microservices

```typescript
// YOU decide:

// Monolith:
// ✅ Simpler deployment
// ✅ Easier development
// ✅ Better for small teams
// ❌ Harder to scale parts independently
// ❌ Tighter coupling

class Application {
  private userService: UserService;
  private orderService: OrderService;
  private paymentService: PaymentService;
  // All in one process
}

// Microservices:
// ✅ Independent scaling
// ✅ Technology freedom
// ✅ Team autonomy
// ❌ Operational complexity
// ❌ Network latency
// ❌ Distributed transactions

// User Service (separate process)
// Order Service (separate process)
// Payment Service (separate process)

// AI can't make this call - YOU understand:
// - Team size
// - Traffic patterns
// - Operational capability
```

## Guiding AI with Architecture

### Provide Architectural Context

```typescript
// "This is a hexagonal architecture (ports and adapters).
// Create an OrderService in the domain core.
// It should depend on ports (interfaces), not adapters (implementations)."

// Domain (AI generates following YOUR architecture)
interface OrderRepository {  // Port
  save(order: Order): Promise<void>;
}

interface PaymentGateway {  // Port
  charge(amount: number): Promise<PaymentResult>;
}

class OrderService {  // Domain service
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway
  ) {}
  
  async placeOrder(order: Order): Promise<void> {
    const result = await this.paymentGateway.charge(order.total);
    if (result.success) {
      await this.orderRepo.save(order);
    }
  }
}

// Adapters (AI implements)
class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    // Database implementation
  }
}

class StripeGateway implements PaymentGateway {
  async charge(amount: number): Promise<PaymentResult> {
    // Stripe API call
  }
}
```

### Enforce Boundaries

```typescript
// "Users module can only access Orders module through its public interface.
// No direct database access between modules."

// orders/api.ts (public interface)
export interface OrdersAPI {
  createOrder(userId: string, items: Item[]): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;
}

// orders/service.ts (internal implementation)
class OrderService implements OrdersAPI {
  // AI implements
}

// users/service.ts
class UserService {
  constructor(private ordersAPI: OrdersAPI) {}  // Depends on interface, not implementation
  
  async getUserWithOrders(userId: string) {
    const orders = await this.ordersAPI.getOrders(userId);
    // ...
  }
}
```

## Architectural Patterns

### 1. Layered Architecture

```typescript
// YOU design layers and dependencies

// API Layer (depends on Service)
class UserController {
  constructor(private userService: UserService) {}
  
  async createUser(req: Request, res: Response) {
    const user = await this.userService.create(req.body);
    res.json(user);
  }
}

// Service Layer (depends on Repository)
class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async create(data: CreateUserDto): Promise<User> {
    // AI generates: validation, business logic
    return await this.userRepo.save(user);
  }
}

// Repository Layer (depends on Database)
class UserRepository {
  constructor(private db: Database) {}
  
  async save(user: User): Promise<User> {
    // AI generates: database operations
  }
}

// Rule: Each layer only depends on layer below
```

### 2. Event-Driven Architecture

```typescript
// YOU design event flow

// Command side
class CreateOrderHandler {
  async handle(command: CreateOrderCommand): Promise<void> {
    const order = Order.create(command);
    await this.repository.save(order);
    
    // Emit events
    await this.eventBus.publish('OrderCreated', order);
  }
}

// Event handlers (async, decoupled)
class EmailNotificationHandler {
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.emailService.sendConfirmation(event.data.customerEmail);
  }
}

class InventoryHandler {
  async handle(event: OrderCreatedEvent): Promise<void> {
    await this.inventory.reserve(event.data.items);
  }
}

// AI implements handlers AFTER you define event contracts
```

### 3. Domain-Driven Design

```typescript
// YOU identify aggregates and boundaries

// Order Aggregate
class Order {  // Aggregate root
  private items: OrderItem[] = [];
  private status: OrderStatus;
  
  addItem(item: OrderItem): void {
    // Business rules
    if (this.status !== 'draft') {
      throw new Error('Cannot modify confirmed order');
    }
    this.items.push(item);
  }
  
  confirm(): void {
    // Business rules
    if (this.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    this.status = 'confirmed';
  }
}

// AI implements methods AFTER you define aggregate boundaries
```

## Scaling Decisions

```typescript
// YOU decide scaling strategy:

// Horizontal Scaling
class LoadBalancer {
  private servers: Server[] = [];
  private currentIndex = 0;
  
  route(request: Request): Server {
    const server = this.servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.servers.length;
    return server;
  }
}

// Caching Layer
class CachedUserRepository {
  constructor(
    private cache: Cache,
    private repo: UserRepository
  ) {}
  
  async findById(id: string): Promise<User> {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;
    
    const user = await this.repo.findById(id);
    await this.cache.set(`user:${id}`, user, 3600);
    return user;
  }
}

// Read Replicas
class UserQueryService {
  constructor(
    private readReplica: Database,  // For queries
    private primary: Database       // For writes
  ) {}
}

// AI implements strategies AFTER you decide them
```

## Documentation for AI

```typescript
// Document architecture decisions:

/**
 * Architecture: Layered with Hexagonal (Ports & Adapters)
 * 
 * Layers:
 * 1. API (Express controllers)
 * 2. Application (Services, use cases)
 * 3. Domain (Entities, value objects, business rules)
 * 4. Infrastructure (Repositories, external APIs)
 * 
 * Rules:
 * - Inner layers don't depend on outer layers
 * - Dependencies point inward
 * - Domain has no external dependencies
 * - Use interfaces for infrastructure
 */

// AI can follow documented patterns
```

## The Mind-Shift

**Before understanding architecture:**
- Ask AI "create my app"
- No clear structure
- Inconsistent patterns
- Hard to scale/maintain

**After:**
- YOU design architecture
- AI implements within YOUR structure
- Consistent, maintainable system
- Clear boundaries

## Summary

**Architecture and AI**:
- YOU design system structure
- YOU make technology choices
- YOU define module boundaries
- YOU analyze trade-offs
- AI implements components within YOUR architecture

**Key insight**: *Architecture is about decisions, not code—AI can implement any architecture you design, but it can't make architectural decisions that require business context, trade-off analysis, and long-term thinking.*

---

**Next**: [Debugging AI Code](../07-debugging.md)
