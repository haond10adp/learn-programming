# Integration Testing

> *"Unit tests tell you what's broken. Integration tests tell you if it works."*

## What Is Integration Testing?

**Integration testing** verifies that multiple components work together correctly. Unlike unit tests that isolate individual pieces, integration tests check real interactions between modules, services, databases, and external APIs.

```typescript
// Unit test - isolated
test('user service creates user', () => {
  const mockDb = { save: vi.fn() };
  const service = new UserService(mockDb);
  
  service.createUser({ name: 'Alice' });
  
  expect(mockDb.save).toHaveBeenCalled();
});

// Integration test - real database
test('user service saves to database', async () => {
  const db = await connectTestDatabase();
  const service = new UserService(db);
  
  await service.createUser({ name: 'Alice' });
  
  const users = await db.query('SELECT * FROM users');
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe('Alice');
  
  await db.close();
});
```

## Why This Matters

Integration tests:
- **Verify connections**: Components interact correctly
- **Catch interface issues**: Mismatched contracts
- **Test real scenarios**: Actual database/API behavior
- **Validate configuration**: Settings work in practice
- **Build confidence**: System works end-to-end

## Testing with Databases

### Setup and Teardown

```typescript
import { Database } from './database';

describe('UserRepository Integration', () => {
  let db: Database;
  let repository: UserRepository;
  
  beforeAll(async () => {
    // Connect once for all tests
    db = await Database.connect(process.env.TEST_DB_URL);
    await db.migrate();
  });
  
  beforeEach(async () => {
    // Clean data before each test
    await db.query('DELETE FROM users');
    repository = new UserRepository(db);
  });
  
  afterAll(async () => {
    // Cleanup after all tests
    await db.close();
  });
  
  test('saves and retrieves user', async () => {
    const user = { name: 'Alice', email: 'alice@example.com' };
    
    const saved = await repository.save(user);
    const found = await repository.findById(saved.id);
    
    expect(found).toEqual(expect.objectContaining({
      name: 'Alice',
      email: 'alice@example.com'
    }));
  });
});
```

### Transaction Testing

```typescript
test('rolls back on error', async () => {
  const account1 = await createAccount('A', 100);
  const account2 = await createAccount('B', 100);
  
  try {
    await transferMoney(account1.id, account2.id, 150); // More than balance!
    fail('Should have thrown');
  } catch (error) {
    expect(error.message).toContain('Insufficient funds');
  }
  
  // Verify no change
  const a1 = await findAccount(account1.id);
  const a2 = await findAccount(account2.id);
  
  expect(a1.balance).toBe(100);
  expect(a2.balance).toBe(100);
});
```

### Using Test Containers

```typescript
import { GenericContainer, StartedTestContainer } from 'testcontainers';

describe('Database Integration', () => {
  let container: StartedTestContainer;
  let db: Database;
  
  beforeAll(async () => {
    // Start real Postgres in Docker
    container = await new GenericContainer('postgres:16')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb'
      })
      .withExposedPorts(5432)
      .start();
    
    const connectionString = `postgresql://test:test@localhost:${container.getMappedPort(5432)}/testdb`;
    db = await Database.connect(connectionString);
  });
  
  afterAll(async () => {
    await db.close();
    await container.stop();
  });
  
  test('full database integration', async () => {
    // Test with real Postgres
  });
});
```

## Testing API Integration

### HTTP Client Integration

```typescript
import axios from 'axios';

class ApiClient {
  constructor(private baseUrl: string) {}
  
  async getUser(id: string): Promise<User> {
    const response = await axios.get(`${this.baseUrl}/users/${id}`);
    return response.data;
  }
  
  async createUser(user: CreateUserDto): Promise<User> {
    const response = await axios.post(`${this.baseUrl}/users`, user);
    return response.data;
  }
}

describe('ApiClient Integration', () => {
  let client: ApiClient;
  
  beforeAll(() => {
    // Point to test API server
    client = new ApiClient('http://localhost:3001');
  });
  
  test('creates and retrieves user', async () => {
    const created = await client.createUser({
      name: 'Alice',
      email: 'alice@example.com'
    });
    
    expect(created.id).toBeDefined();
    
    const retrieved = await client.getUser(created.id);
    
    expect(retrieved.name).toBe('Alice');
    expect(retrieved.email).toBe('alice@example.com');
  });
  
  test('handles 404 error', async () => {
    await expect(client.getUser('nonexistent'))
      .rejects
      .toThrow('Request failed with status code 404');
  });
});
```

### Mock Server for External APIs

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.external.com/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches data from external API', async () => {
  const result = await fetchExternalData();
  expect(result.data).toBe('mocked');
});

test('handles API error', async () => {
  server.use(
    rest.get('https://api.external.com/data', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );
  
  await expect(fetchExternalData()).rejects.toThrow();
});
```

## Testing Multiple Layers

### Repository + Service Integration

```typescript
describe('User Management Integration', () => {
  let db: Database;
  let repository: UserRepository;
  let service: UserService;
  
  beforeEach(async () => {
    db = await createTestDatabase();
    repository = new UserRepository(db);
    service = new UserService(repository);
  });
  
  test('creates user through service layer', async () => {
    const user = await service.registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'SecurePass123'
    });
    
    expect(user.id).toBeDefined();
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe('SecurePass123'); // Hashed
    
    // Verify in database
    const found = await repository.findById(user.id);
    expect(found.name).toBe('Alice');
  });
  
  test('validates unique email', async () => {
    await service.registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'pass1'
    });
    
    await expect(
      service.registerUser({
        name: 'Bob',
        email: 'alice@example.com', // Duplicate!
        password: 'pass2'
      })
    ).rejects.toThrow('Email already exists');
  });
});
```

### Full Stack Integration

```typescript
describe('E-commerce Integration', () => {
  let app: Express;
  let db: Database;
  
  beforeAll(async () => {
    db = await createTestDatabase();
    app = createApp(db);
  });
  
  test('complete order flow', async () => {
    // Create user
    const userResponse = await request(app)
      .post('/api/users')
      .send({
        name: 'Alice',
        email: 'alice@example.com'
      });
    
    const userId = userResponse.body.id;
    
    // Add product
    const productResponse = await request(app)
      .post('/api/products')
      .send({
        name: 'Book',
        price: 10
      });
    
    const productId = productResponse.body.id;
    
    // Create order
    const orderResponse = await request(app)
      .post('/api/orders')
      .send({
        userId,
        items: [{ productId, quantity: 2 }]
      });
    
    expect(orderResponse.status).toBe(201);
    expect(orderResponse.body.total).toBe(20);
    
    // Verify in database
    const order = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderResponse.body.id]
    );
    
    expect(order[0].status).toBe('pending');
  });
});
```

## Testing Message Queues

```typescript
describe('Message Queue Integration', () => {
  let queue: Queue;
  let processor: OrderProcessor;
  
  beforeAll(async () => {
    queue = await connectQueue('amqp://localhost');
    processor = new OrderProcessor(queue);
  });
  
  afterAll(async () => {
    await queue.close();
  });
  
  test('processes order from queue', async () => {
    const order = { id: '1', amount: 100 };
    
    await queue.publish('orders', order);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const processed = await db.query(
      'SELECT * FROM processed_orders WHERE id = $1',
      [order.id]
    );
    
    expect(processed).toHaveLength(1);
  });
  
  test('handles processing errors', async () => {
    const invalidOrder = { id: '2' }; // Missing amount
    
    await queue.publish('orders', invalidOrder);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check dead letter queue
    const failed = await queue.getFromQueue('orders.failed');
    expect(failed).toHaveLength(1);
  });
});
```

## Testing File System Integration

```typescript
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('File Storage Integration', () => {
  let tempDir: string;
  let storage: FileStorage;
  
  beforeEach(async () => {
    // Create temp directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    storage = new FileStorage(tempDir);
  });
  
  afterEach(async () => {
    // Clean up
    await fs.rm(tempDir, { recursive: true });
  });
  
  test('saves and retrieves file', async () => {
    const content = 'Hello, World!';
    const filename = 'test.txt';
    
    await storage.save(filename, content);
    
    const retrieved = await storage.get(filename);
    expect(retrieved).toBe(content);
    
    // Verify actual file exists
    const filePath = path.join(tempDir, filename);
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
  
  test('handles subdirectories', async () => {
    await storage.save('sub/dir/file.txt', 'content');
    
    const retrieved = await storage.get('sub/dir/file.txt');
    expect(retrieved).toBe('content');
  });
});
```

## Testing Event-Driven Systems

```typescript
describe('Event System Integration', () => {
  let eventBus: EventBus;
  let orderService: OrderService;
  let emailService: EmailService;
  let inventoryService: InventoryService;
  
  beforeEach(() => {
    eventBus = new EventBus();
    orderService = new OrderService(eventBus);
    emailService = new EmailService(eventBus);
    inventoryService = new InventoryService(eventBus);
    
    // Subscribe services to events
    emailService.subscribe();
    inventoryService.subscribe();
  });
  
  test('order creation triggers email and inventory updates', async () => {
    const emailSpy = vi.spyOn(emailService, 'sendOrderConfirmation');
    const inventorySpy = vi.spyOn(inventoryService, 'reserveItems');
    
    await orderService.createOrder({
      userId: '1',
      items: [{ productId: '1', quantity: 2 }]
    });
    
    // Wait for async event processing
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(emailSpy).toHaveBeenCalled();
    expect(inventorySpy).toHaveBeenCalled();
  });
});
```

## Testing Configuration

```typescript
describe('Configuration Integration', () => {
  test('loads config from environment', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    process.env.API_KEY = 'secret-key';
    
    const config = loadConfig();
    
    expect(config.database.url).toBe('postgres://localhost/test');
    expect(config.api.key).toBe('secret-key');
  });
  
  test('validates required config', () => {
    delete process.env.DATABASE_URL;
    
    expect(() => loadConfig()).toThrow('DATABASE_URL is required');
  });
  
  test('applies defaults', () => {
    delete process.env.PORT;
    
    const config = loadConfig();
    
    expect(config.server.port).toBe(3000); // Default
  });
});
```

## Best Practices

### 1. Isolate Test Data

```typescript
// ✅ Good: Each test has own data
beforeEach(async () => {
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM orders');
});

test('test 1', async () => {
  const user = await createUser({ name: 'Alice' });
  // Test with Alice
});

test('test 2', async () => {
  const user = await createUser({ name: 'Bob' });
  // Test with Bob, no interference from test 1
});
```

### 2. Use Test-Specific Resources

```typescript
// ✅ Good: Separate test database
const TEST_DB = process.env.TEST_DATABASE_URL || 'postgres://localhost/myapp_test';

// ❌ Bad: Using production database
const PROD_DB = 'postgres://localhost/myapp';
```

### 3. Fast Enough, Not Too Fast

```typescript
// ✅ Good: Real database for integration
test('saves to database', async () => {
  await realDatabase.save(user);
  const found = await realDatabase.find(user.id);
  expect(found).toBeDefined();
});

// ❌ Bad: Mocking in integration test defeats purpose
test('saves to database', async () => {
  const mockDb = { save: vi.fn() };
  await mockDb.save(user);
  expect(mockDb.save).toHaveBeenCalled(); // Not testing real integration!
});
```

### 4. Test Failure Modes

```typescript
test('handles database connection failure', async () => {
  const db = await Database.connect('postgres://invalid');
  
  await expect(db.query('SELECT 1'))
    .rejects
    .toThrow('Connection failed');
});

test('retries on temporary failure', async () => {
  const mockDb = createUnreliableDb();
  const service = new ServiceWithRetry(mockDb);
  
  // Should succeed after retries
  const result = await service.operation();
  expect(result).toBeDefined();
});
```

### 5. Clean Up Resources

```typescript
afterEach(async () => {
  // Close connections
  await db.close();
  
  // Stop servers
  await server.close();
  
  // Clear queues
  await queue.purge();
  
  // Delete files
  await fs.rm(tempDir, { recursive: true });
});
```

## Integration vs Unit Tests

### When to Use Integration Tests

- ✅ Testing database queries
- ✅ API endpoint behavior
- ✅ File system operations
- ✅ Message queue processing
- ✅ External service integration
- ✅ Configuration loading

### When to Use Unit Tests

- ✅ Pure business logic
- ✅ Algorithms and calculations
- ✅ Validation rules
- ✅ Data transformations
- ✅ Edge cases and error handling

## Common Pitfalls

### Slow Test Suites

```typescript
// ❌ Bad: Connecting for every test
test('test 1', async () => {
  const db = await Database.connect(); // Slow!
  // ...
  await db.close();
});

// ✅ Good: Connect once, clean between tests
beforeAll(async () => {
  db = await Database.connect();
});

beforeEach(async () => {
  await db.clean();
});
```

### Flaky Tests

```typescript
// ❌ Bad: Race condition
test('async operation', async () => {
  asyncOperation();
  await new Promise(resolve => setTimeout(resolve, 100)); // Hope it's done!
  expect(result).toBeDefined();
});

// ✅ Good: Wait for actual completion
test('async operation', async () => {
  await asyncOperation();
  expect(result).toBeDefined();
});
```

### Test Pollution

```typescript
// ❌ Bad: Tests affect each other
test('creates user', async () => {
  await createUser({ email: 'test@example.com' });
});

test('creates another user', async () => {
  await createUser({ email: 'test@example.com' }); // Fails! Already exists
});

// ✅ Good: Clean state
beforeEach(async () => {
  await db.clear();
});
```

## The Mind-Shift

**Before integration testing:**
- "Unit tests pass, ship it!"
- Manual testing of integrations
- Production bugs from interface mismatches
- Unclear if components actually work together

**After:**
- Automated verification of component interactions
- Confident deployments
- Catch integration issues early
- Clear understanding of system behavior

## Summary

**Integration Testing Essentials**:
- Test real component interactions
- Use actual databases and services (in test environment)
- Clean up between tests
- Test both success and failure paths
- Balance with unit tests

**Key insight**: *Integration tests verify that your system's pieces fit together—they're slower than unit tests but catch issues that unit tests miss, providing essential confidence that your system works as a whole.*

---

**Next**: [Test-Driven Development](../07-tdd.md)
