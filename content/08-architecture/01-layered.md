# Layered Architecture

## What is Layered Architecture?

**Layered Architecture** (also called **N-Tier Architecture**) is one of the most common architectural patterns. It organizes code into horizontal layers, where each layer has a specific responsibility and communicates only with adjacent layers. This creates clear separation of concerns and makes the system easier to understand, maintain, and test.

### Traditional Three-Layer Architecture

```
┌─────────────────────────────────┐
│   Presentation Layer (UI)       │  ← User interaction
├─────────────────────────────────┤
│   Business Logic Layer          │  ← Core functionality
├─────────────────────────────────┤
│   Data Access Layer             │  ← Database operations
└─────────────────────────────────┘
```

## Core Principles

1. **Separation of Concerns**: Each layer handles specific responsibilities
2. **Dependency Direction**: Layers depend only on layers below them
3. **Abstraction**: Each layer presents a simplified interface to the layer above
4. **Encapsulation**: Internal implementation details are hidden

## Common Layers

### 1. Presentation Layer (UI)
- **Responsibility**: User interface and user interaction
- **Contains**: Controllers, views, UI components, presentation logic
- **Dependencies**: Business logic layer only
- **Examples**: REST API controllers, React components, CLI interfaces

### 2. Business Logic Layer (Domain/Service Layer)
- **Responsibility**: Core business rules and workflows
- **Contains**: Services, domain models, business rules, validators
- **Dependencies**: Data access layer only
- **Examples**: Order processing, user authentication, business calculations

### 3. Data Access Layer (Persistence)
- **Responsibility**: Data storage and retrieval
- **Contains**: Repositories, data models, database queries, ORMs
- **Dependencies**: Database or external storage
- **Examples**: User repository, database connections, file storage

### 4. Cross-Cutting Concerns (Optional)
- **Responsibility**: Shared functionality across layers
- **Contains**: Logging, security, configuration, utilities
- **Dependencies**: Used by all layers
- **Examples**: Logger, error handler, authentication middleware

## Implementation in TypeScript

### Basic Three-Layer Structure

```typescript
// ============================================
// DATA ACCESS LAYER
// ============================================

// Database entity
interface UserEntity {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
}

// Repository interface
interface IUserRepository {
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    create(user: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity>;
    update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
    delete(id: string): Promise<boolean>;
}

// Repository implementation
class UserRepository implements IUserRepository {
    private users: Map<string, UserEntity> = new Map();

    async findById(id: string): Promise<UserEntity | null> {
        return this.users.get(id) || null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }

    async create(userData: Omit<UserEntity, 'id' | 'createdAt'>): Promise<UserEntity> {
        const user: UserEntity = {
            id: crypto.randomUUID(),
            ...userData,
            createdAt: new Date()
        };
        this.users.set(user.id, user);
        return user;
    }

    async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
        const user = await this.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        const updated = { ...user, ...updates };
        this.users.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        return this.users.delete(id);
    }
}

// ============================================
// BUSINESS LOGIC LAYER
// ============================================

// Domain model (different from database entity)
interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

// Business logic errors
class BusinessError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'BusinessError';
    }
}

// Service interface
interface IUserService {
    registerUser(email: string, password: string, name: string): Promise<User>;
    authenticateUser(email: string, password: string): Promise<User>;
    getUserById(id: string): Promise<User>;
    updateUserProfile(id: string, name: string): Promise<User>;
}

// Service implementation
class UserService implements IUserService {
    constructor(private userRepository: IUserRepository) {}

    async registerUser(email: string, password: string, name: string): Promise<User> {
        // Validate input
        this.validateEmail(email);
        this.validatePassword(password);
        this.validateName(name);

        // Check if user exists
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new BusinessError('Email already registered', 'EMAIL_EXISTS');
        }

        // Hash password
        const passwordHash = await this.hashPassword(password);

        // Create user
        const userEntity = await this.userRepository.create({
            email,
            passwordHash,
            name
        });

        // Return domain model (without password)
        return this.toDomainModel(userEntity);
    }

    async authenticateUser(email: string, password: string): Promise<User> {
        const userEntity = await this.userRepository.findByEmail(email);
        
        if (!userEntity) {
            throw new BusinessError('Invalid credentials', 'AUTH_FAILED');
        }

        const isValid = await this.verifyPassword(password, userEntity.passwordHash);
        if (!isValid) {
            throw new BusinessError('Invalid credentials', 'AUTH_FAILED');
        }

        return this.toDomainModel(userEntity);
    }

    async getUserById(id: string): Promise<User> {
        const userEntity = await this.userRepository.findById(id);
        
        if (!userEntity) {
            throw new BusinessError('User not found', 'USER_NOT_FOUND');
        }

        return this.toDomainModel(userEntity);
    }

    async updateUserProfile(id: string, name: string): Promise<User> {
        this.validateName(name);

        const updated = await this.userRepository.update(id, { name });
        return this.toDomainModel(updated);
    }

    // Private helper methods
    private validateEmail(email: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new BusinessError('Invalid email format', 'INVALID_EMAIL');
        }
    }

    private validatePassword(password: string): void {
        if (password.length < 8) {
            throw new BusinessError('Password must be at least 8 characters', 'WEAK_PASSWORD');
        }
    }

    private validateName(name: string): void {
        if (name.trim().length < 2) {
            throw new BusinessError('Name must be at least 2 characters', 'INVALID_NAME');
        }
    }

    private async hashPassword(password: string): Promise<string> {
        // In real app, use bcrypt
        return `hashed_${password}`;
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        return hash === `hashed_${password}`;
    }

    private toDomainModel(entity: UserEntity): User {
        return {
            id: entity.id,
            email: entity.email,
            name: entity.name,
            createdAt: entity.createdAt
        };
    }
}

// ============================================
// PRESENTATION LAYER
// ============================================

// DTOs (Data Transfer Objects)
interface RegisterUserDTO {
    email: string;
    password: string;
    name: string;
}

interface LoginDTO {
    email: string;
    password: string;
}

interface UserResponseDTO {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

// Controller
class UserController {
    constructor(private userService: IUserService) {}

    async register(dto: RegisterUserDTO): Promise<UserResponseDTO> {
        try {
            const user = await this.userService.registerUser(
                dto.email,
                dto.password,
                dto.name
            );
            return this.toResponseDTO(user);
        } catch (error) {
            if (error instanceof BusinessError) {
                throw new HttpError(400, error.message, error.code);
            }
            throw new HttpError(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    }

    async login(dto: LoginDTO): Promise<UserResponseDTO> {
        try {
            const user = await this.userService.authenticateUser(
                dto.email,
                dto.password
            );
            return this.toResponseDTO(user);
        } catch (error) {
            if (error instanceof BusinessError) {
                throw new HttpError(401, error.message, error.code);
            }
            throw new HttpError(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    }

    async getProfile(userId: string): Promise<UserResponseDTO> {
        try {
            const user = await this.userService.getUserById(userId);
            return this.toResponseDTO(user);
        } catch (error) {
            if (error instanceof BusinessError && error.code === 'USER_NOT_FOUND') {
                throw new HttpError(404, error.message, error.code);
            }
            throw new HttpError(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    }

    async updateProfile(userId: string, name: string): Promise<UserResponseDTO> {
        try {
            const user = await this.userService.updateUserProfile(userId, name);
            return this.toResponseDTO(user);
        } catch (error) {
            if (error instanceof BusinessError) {
                throw new HttpError(400, error.message, error.code);
            }
            throw new HttpError(500, 'Internal server error', 'INTERNAL_ERROR');
        }
    }

    private toResponseDTO(user: User): UserResponseDTO {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt.toISOString()
        };
    }
}

// HTTP error for presentation layer
class HttpError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code: string
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

// ============================================
// DEPENDENCY INJECTION / COMPOSITION ROOT
// ============================================

// Wire up dependencies
function createUserController(): UserController {
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);
    const userController = new UserController(userService);
    return userController;
}

// Usage
const controller = createUserController();

// Example requests
async function demo() {
    try {
        // Register
        const newUser = await controller.register({
            email: 'john@example.com',
            password: 'password123',
            name: 'John Doe'
        });
        console.log('Registered:', newUser);

        // Login
        const loggedInUser = await controller.login({
            email: 'john@example.com',
            password: 'password123'
        });
        console.log('Logged in:', loggedInUser);

        // Get profile
        const profile = await controller.getProfile(newUser.id);
        console.log('Profile:', profile);

        // Update profile
        const updated = await controller.updateProfile(newUser.id, 'John Smith');
        console.log('Updated:', updated);
    } catch (error) {
        if (error instanceof HttpError) {
            console.error(`HTTP ${error.statusCode}: ${error.message}`);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}
```

## Four-Layer Architecture

For larger applications, add a **Domain Layer**:

```
┌─────────────────────────────────┐
│   Presentation Layer            │
├─────────────────────────────────┤
│   Application/Service Layer     │  ← Use cases, workflows
├─────────────────────────────────┤
│   Domain Layer                  │  ← Business entities, rules
├─────────────────────────────────┤
│   Infrastructure/Data Layer     │  ← Technical concerns
└─────────────────────────────────┘
```

### Implementation with Domain Layer

```typescript
// ============================================
// DOMAIN LAYER
// ============================================

// Domain entity with business logic
class Order {
    private constructor(
        public readonly id: string,
        public readonly customerId: string,
        private items: OrderItem[],
        private status: OrderStatus,
        public readonly createdAt: Date
    ) {}

    static create(customerId: string, items: OrderItem[]): Order {
        if (items.length === 0) {
            throw new Error('Order must have at least one item');
        }

        return new Order(
            crypto.randomUUID(),
            customerId,
            items,
            OrderStatus.Pending,
            new Date()
        );
    }

    addItem(item: OrderItem): void {
        if (this.status !== OrderStatus.Pending) {
            throw new Error('Cannot modify order after it is confirmed');
        }
        this.items.push(item);
    }

    removeItem(productId: string): void {
        if (this.status !== OrderStatus.Pending) {
            throw new Error('Cannot modify order after it is confirmed');
        }
        this.items = this.items.filter(item => item.productId !== productId);
    }

    confirm(): void {
        if (this.items.length === 0) {
            throw new Error('Cannot confirm empty order');
        }
        if (this.status !== OrderStatus.Pending) {
            throw new Error('Order is already confirmed or cancelled');
        }
        this.status = OrderStatus.Confirmed;
    }

    cancel(): void {
        if (this.status === OrderStatus.Shipped || this.status === OrderStatus.Delivered) {
            throw new Error('Cannot cancel order that is shipped or delivered');
        }
        this.status = OrderStatus.Cancelled;
    }

    ship(): void {
        if (this.status !== OrderStatus.Confirmed) {
            throw new Error('Can only ship confirmed orders');
        }
        this.status = OrderStatus.Shipped;
    }

    deliver(): void {
        if (this.status !== OrderStatus.Shipped) {
            throw new Error('Can only deliver shipped orders');
        }
        this.status = OrderStatus.Delivered;
    }

    getTotalAmount(): number {
        return this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
    }

    getItems(): readonly OrderItem[] {
        return [...this.items];
    }

    getStatus(): OrderStatus {
        return this.status;
    }
}

// Value object
class OrderItem {
    constructor(
        public readonly productId: string,
        public readonly productName: string,
        public readonly quantity: number,
        public readonly price: number
    ) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }
        if (price < 0) {
            throw new Error('Price cannot be negative');
        }
    }

    getTotalPrice(): number {
        return this.quantity * this.price;
    }
}

enum OrderStatus {
    Pending = 'PENDING',
    Confirmed = 'CONFIRMED',
    Shipped = 'SHIPPED',
    Delivered = 'DELIVERED',
    Cancelled = 'CANCELLED'
}

// ============================================
// APPLICATION/SERVICE LAYER
// ============================================

interface IOrderService {
    createOrder(customerId: string, items: OrderItem[]): Promise<Order>;
    confirmOrder(orderId: string): Promise<Order>;
    cancelOrder(orderId: string): Promise<Order>;
    getOrderById(orderId: string): Promise<Order>;
}

class OrderService implements IOrderService {
    constructor(private orderRepository: IOrderRepository) {}

    async createOrder(customerId: string, items: OrderItem[]): Promise<Order> {
        const order = Order.create(customerId, items);
        return await this.orderRepository.save(order);
    }

    async confirmOrder(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        order.confirm();
        return await this.orderRepository.save(order);
    }

    async cancelOrder(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        order.cancel();
        return await this.orderRepository.save(order);
    }

    async getOrderById(orderId: string): Promise<Order> {
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }
}

// ============================================
// INFRASTRUCTURE LAYER
// ============================================

interface IOrderRepository {
    save(order: Order): Promise<Order>;
    findById(id: string): Promise<Order | null>;
    findByCustomerId(customerId: string): Promise<Order[]>;
}

class OrderRepository implements IOrderRepository {
    private orders: Map<string, Order> = new Map();

    async save(order: Order): Promise<Order> {
        this.orders.set(order.id, order);
        return order;
    }

    async findById(id: string): Promise<Order | null> {
        return this.orders.get(id) || null;
    }

    async findByCustomerId(customerId: string): Promise<Order[]> {
        return Array.from(this.orders.values())
            .filter(order => order.customerId === customerId);
    }
}
```

## Benefits of Layered Architecture

### ✅ Advantages

1. **Clear Separation**: Each layer has distinct responsibility
2. **Easy to Understand**: Intuitive mental model
3. **Team Organization**: Teams can own specific layers
4. **Technology Independence**: Replace implementation without affecting other layers
5. **Testability**: Test layers in isolation
6. **Reusability**: Business logic independent of UI

### ❌ Disadvantages

1. **Performance Overhead**: Multiple layers add latency
2. **Cascading Changes**: Changes might need updates in all layers
3. **Database-Centric**: Can become too focused on data model
4. **Over-Engineering**: Simple apps don't need many layers
5. **Layer Leakage**: Temptation to bypass layers

## Best Practices

### 1. Keep Dependencies Downward

```typescript
// ✅ Good: Presentation depends on business, business depends on data
class UserController {
    constructor(private userService: IUserService) {} // Depends on service
}

class UserService {
    constructor(private userRepository: IUserRepository) {} // Depends on repository
}

// ❌ Bad: Business layer depends on presentation
class UserService {
    constructor(private controller: UserController) {} // Wrong direction!
}
```

### 2. Use Interfaces for Abstraction

```typescript
// ✅ Good: Depend on interfaces
interface IEmailService {
    sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class UserService {
    constructor(private emailService: IEmailService) {} // Interface dependency
}

// ❌ Bad: Depend on concrete implementations
class UserService {
    constructor(private emailService: SmtpEmailService) {} // Tight coupling
}
```

### 3. Keep DTOs Separate from Domain Models

```typescript
// ✅ Good: Separate concerns
interface UserDTO {
    email: string;
    name: string;
}

class User {
    constructor(
        public id: string,
        public email: string,
        public name: string,
        private passwordHash: string
    ) {}
}

// ❌ Bad: Using domain models as DTOs
// Exposes internal details like passwordHash to presentation layer
```

### 4. Validate at Layer Boundaries

```typescript
// ✅ Good: Validate at each layer
class UserController {
    async register(dto: RegisterDTO) {
        // Validate HTTP input format
        if (!dto.email || !dto.password) {
            throw new HttpError(400, 'Missing required fields');
        }
        return this.userService.register(dto.email, dto.password);
    }
}

class UserService {
    async register(email: string, password: string) {
        // Validate business rules
        if (password.length < 8) {
            throw new BusinessError('Password too weak');
        }
        // ...
    }
}
```

## Common Patterns

### Repository Pattern

```typescript
interface IRepository<T> {
    findById(id: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    save(entity: T): Promise<T>;
    delete(id: string): Promise<boolean>;
}

class UserRepository implements IRepository<User> {
    async findById(id: string): Promise<User | null> {
        // Database query
        return null;
    }

    async findAll(): Promise<User[]> {
        return [];
    }

    async save(user: User): Promise<User> {
        return user;
    }

    async delete(id: string): Promise<boolean> {
        return true;
    }
}
```

### Unit of Work Pattern

```typescript
class UnitOfWork {
    private users: IUserRepository;
    private orders: IOrderRepository;
    private isDirty = false;

    constructor() {
        this.users = new UserRepository();
        this.orders = new OrderRepository();
    }

    getUsers(): IUserRepository {
        return this.users;
    }

    getOrders(): IOrderRepository {
        return this.orders;
    }

    async commit(): Promise<void> {
        if (!this.isDirty) return;
        
        // Start transaction
        // Save all changes
        // Commit transaction
        this.isDirty = false;
    }

    async rollback(): Promise<void> {
        // Rollback transaction
        this.isDirty = false;
    }
}
```

## Real-World Example: E-Commerce API

```typescript
// Data Layer
class ProductRepository {
    async findById(id: string): Promise<Product | null> { /* ... */ }
    async findByCategory(category: string): Promise<Product[]> { /* ... */ }
    async save(product: Product): Promise<Product> { /* ... */ }
}

// Business Layer
class ProductService {
    constructor(
        private productRepo: ProductRepository,
        private inventoryService: InventoryService
    ) {}

    async getProduct(id: string): Promise<Product> {
        const product = await this.productRepo.findById(id);
        if (!product) {
            throw new Error('Product not found');
        }

        // Check inventory
        const inStock = await this.inventoryService.checkStock(id);
        product.availability = inStock;

        return product;
    }

    async createProduct(data: CreateProductDTO): Promise<Product> {
        // Validate business rules
        this.validateProduct(data);

        // Create product
        const product = new Product(data);
        
        // Save to database
        return await this.productRepo.save(product);
    }

    private validateProduct(data: CreateProductDTO): void {
        if (data.price < 0) {
            throw new Error('Price must be positive');
        }
        // More validation...
    }
}

// Presentation Layer
class ProductController {
    constructor(private productService: ProductService) {}

    async getProduct(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id;
            const product = await this.productService.getProduct(id);
            res.json(this.toDTO(product));
        } catch (error) {
            res.status(404).json({ error: 'Product not found' });
        }
    }

    async createProduct(req: Request, res: Response): Promise<void> {
        try {
            const product = await this.productService.createProduct(req.body);
            res.status(201).json(this.toDTO(product));
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    private toDTO(product: Product): ProductDTO {
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            availability: product.availability
        };
    }
}
```

## Testing in Layered Architecture

```typescript
// Test business layer in isolation
describe('UserService', () => {
    let userService: UserService;
    let mockRepository: jest.Mocked<IUserRepository>;

    beforeEach(() => {
        mockRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            // ... other methods
        } as any;

        userService = new UserService(mockRepository);
    });

    it('should register new user', async () => {
        mockRepository.findByEmail.mockResolvedValue(null);
        mockRepository.create.mockResolvedValue({
            id: '1',
            email: 'test@example.com',
            name: 'Test',
            passwordHash: 'hash',
            createdAt: new Date()
        });

        const user = await userService.registerUser(
            'test@example.com',
            'password123',
            'Test'
        );

        expect(user.email).toBe('test@example.com');
        expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should throw error if email exists', async () => {
        mockRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@example.com',
            name: 'Existing',
            passwordHash: 'hash',
            createdAt: new Date()
        });

        await expect(
            userService.registerUser('test@example.com', 'password123', 'Test')
        ).rejects.toThrow('Email already registered');
    });
});
```

## Summary

**Layered Architecture** provides clear separation of concerns through horizontal layers:

1. **Structure**: Presentation → Business → Data (+ optional Domain)
2. **Benefits**: Easy to understand, test, and maintain
3. **Dependencies**: Always flow downward through layers
4. **Abstraction**: Use interfaces for layer communication
5. **When to Use**: Most applications benefit from at least 3 layers
6. **Avoid**: Layer leakage, bypassing layers, tight coupling

**Key Takeaway**: Layered architecture is a solid starting point for most applications. Start simple with 3 layers, and add more as complexity grows. Keep dependencies pointing downward and use interfaces for flexibility.

---

**Next**: Explore [Hexagonal Architecture](../02-hexagonal.md) for even better testability and flexibility through ports and adapters.
