# Error Propagation

> *"Let errors bubble up, but with context."*

## What Is It?

**Error propagation** is the pattern of passing errors up through call stacks, allowing higher-level code to decide how to handle them while adding context at each layer.

```typescript
// Low-level: database layer
function queryDatabase(sql: string): Result<Row[], DatabaseError> {
  // Returns error with DB context
}

// Mid-level: repository layer
function findUser(id: string): Result<User, RepositoryError> {
  return queryDatabase(`SELECT * FROM users WHERE id = ${id}`)
    .mapError(dbError => new RepositoryError('User query failed', dbError));
}

// High-level: service layer
function getUserProfile(id: string): Result<Profile, ServiceError> {
  return findUser(id)
    .mapError(repoError => new ServiceError('Profile fetch failed', repoError))
    .map(user => buildProfile(user));
}
```

## Why This Matters

Proper error propagation provides:
- **Context**: Each layer adds information
- **Abstraction**: Higher layers don't see low-level details
- **Flexibility**: Caller decides how to handle

## Propagation Strategies

### 1. Immediate Propagation

```typescript
function processData(input: string): Result<Data, Error> {
  const parsed = parse(input);
  if (parsed.isErr()) {
    return parsed; // Propagate immediately
  }
  
  const validated = validate(parsed.unwrap());
  if (validated.isErr()) {
    return validated; // Propagate
  }
  
  return ok(transform(validated.unwrap()));
}
```

### 2. Early Return with Context

```typescript
function loadUserData(id: string): Result<UserData, string> {
  const user = findUser(id);
  if (user.isErr()) {
    return err(`Failed to load user ${id}: ${user.unwrapErr()}`);
  }
  
  const posts = loadPosts(user.unwrap().id);
  if (posts.isErr()) {
    return err(`Failed to load posts for ${id}: ${posts.unwrapErr()}`);
  }
  
  return ok({
    user: user.unwrap(),
    posts: posts.unwrap()
  });
}
```

### 3. Chaining with FlatMap

```typescript
function processUser(id: string): Result<ProcessedUser, Error> {
  return findUser(id)
    .flatMap(user => validateUser(user))
    .flatMap(user => enrichUser(user))
    .flatMap(user => saveUser(user));
}
```

## Error Context

### Adding Context at Each Layer

```typescript
class DatabaseError extends Error {
  constructor(message: string, public query: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class RepositoryError extends Error {
  constructor(
    message: string,
    public operation: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

class ServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Database layer
function query(sql: string): Result<Row[], DatabaseError> {
  try {
    const rows = db.execute(sql);
    return ok(rows);
  } catch (error) {
    return err(new DatabaseError('Query failed', sql));
  }
}

// Repository layer
function getUser(id: string): Result<User, RepositoryError> {
  return query(`SELECT * FROM users WHERE id = ${id}`)
    .mapError(dbError =>
      new RepositoryError('Failed to get user', 'getUser', dbError)
    )
    .flatMap(rows => {
      if (rows.length === 0) {
        return err(new RepositoryError('User not found', 'getUser'));
      }
      return ok(mapToUser(rows[0]));
    });
}

// Service layer
function loadUserProfile(id: string): Result<Profile, ServiceError> {
  return getUser(id)
    .mapError(repoError =>
      new ServiceError('Profile load failed', 'UserService', repoError)
    )
    .map(user => buildProfile(user));
}
```

## Handling at Different Levels

```typescript
// Low-level: specific errors
function readFile(path: string): Result<string, FileError> {
  if (!exists(path)) {
    return err({ type: 'NotFound', path });
  }
  if (!canRead(path)) {
    return err({ type: 'PermissionDenied', path });
  }
  return ok(fs.readFileSync(path, 'utf-8'));
}

// Mid-level: domain errors
function loadConfig(): Result<Config, ConfigError> {
  return readFile('config.json')
    .mapError(fileError => ({
      type: 'ConfigLoadFailed' as const,
      reason: fileError.type,
      path: fileError.path
    }))
    .flatMap(content => parseJSON(content))
    .flatMap(json => validateConfig(json));
}

// High-level: user-facing messages
function initialize(): Result<App, string> {
  return loadConfig()
    .mapError(configError => 
      'Failed to start: configuration error'
    )
    .flatMap(config => createApp(config));
}
```

## Propagation with Exceptions

### Try-Catch Propagation

```typescript
function processRequest(req: Request): Response {
  try {
    const user = authenticate(req); // Might throw
    const data = fetchData(user);    // Might throw
    return formatResponse(data);
  } catch (error) {
    // Handle all errors at once
    return handleError(error);
  }
}
```

### Wrapping Lower-Level Exceptions

```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

function processUser(id: string): User {
  try {
    return repository.getUser(id);
  } catch (error) {
    throw new ApplicationError(
      `Failed to process user ${id}`,
      'USER_PROCESSING_ERROR',
      error as Error
    );
  }
}
```

## Async Error Propagation

### With Promises

```typescript
async function loadUserData(id: string): Promise<Result<UserData, Error>> {
  const user = await getUser(id);
  if (user.isErr()) {
    return user;
  }
  
  const posts = await getPosts(id);
  if (posts.isErr()) {
    return posts;
  }
  
  return ok({
    user: user.unwrap(),
    posts: posts.unwrap()
  });
}
```

### Promise Chain Propagation

```typescript
function processAsync(id: string): Promise<Result<Data, Error>> {
  return fetchUser(id)
    .then(result => result.flatMap(user => validateUser(user)))
    .then(result => result.flatMap(user => enrichUser(user)))
    .then(result => result.flatMap(user => saveUser(user)));
}
```

## Error Recovery

Sometimes errors can be recovered:

```typescript
function fetchWithFallback(url: string): Result<Data, Error> {
  const primary = fetch(url);
  if (primary.isOk()) {
    return primary;
  }
  
  // Try fallback
  console.warn('Primary failed, trying fallback');
  return fetch(FALLBACK_URL)
    .mapError(error => 
      new Error(`Both primary and fallback failed: ${error}`)
    );
}
```

### Retry Pattern

```typescript
function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Result<Data, Error> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    const result = fetch(url);
    if (result.isOk()) {
      return result;
    }
    lastError = result.unwrapErr();
    console.log(`Attempt ${i + 1} failed, retrying...`);
  }
  
  return err(new Error(`Failed after ${maxRetries} attempts: ${lastError}`));
}
```

## Collecting Multiple Errors

```typescript
type ValidationResult = Result<void, string[]>;

function validateUser(user: User): ValidationResult {
  const errors: string[] = [];
  
  if (!user.email.includes('@')) {
    errors.push('Invalid email');
  }
  
  if (user.age < 0) {
    errors.push('Age cannot be negative');
  }
  
  if (user.name.length === 0) {
    errors.push('Name is required');
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok(undefined);
}
```

## Layered Architecture Example

```typescript
// Database Layer
class DatabaseLayer {
  query(sql: string): Result<Row[], DatabaseError> {
    try {
      return ok(this.db.execute(sql));
    } catch (error) {
      return err(new DatabaseError(error.message, sql));
    }
  }
}

// Repository Layer
class UserRepository {
  constructor(private db: DatabaseLayer) {}
  
  findById(id: string): Result<User, RepositoryError> {
    return this.db
      .query(`SELECT * FROM users WHERE id = '${id}'`)
      .mapError(dbError => 
        new RepositoryError('Failed to find user', dbError)
      )
      .flatMap(rows => {
        if (rows.length === 0) {
          return err(new RepositoryError('User not found'));
        }
        return ok(this.mapRowToUser(rows[0]));
      });
  }
}

// Service Layer
class UserService {
  constructor(private repo: UserRepository) {}
  
  getProfile(id: string): Result<Profile, ServiceError> {
    return this.repo
      .findById(id)
      .mapError(repoError =>
        new ServiceError('Profile retrieval failed', repoError)
      )
      .flatMap(user => this.enrichProfile(user));
  }
  
  private enrichProfile(user: User): Result<Profile, ServiceError> {
    // Add additional data
    return ok({
      ...user,
      memberSince: this.calculateMemberSince(user.createdAt),
      badges: this.getBadges(user)
    });
  }
}

// Controller Layer
class UserController {
  constructor(private service: UserService) {}
  
  async getProfile(req: Request): Promise<Response> {
    const result = this.service.getProfile(req.params.id);
    
    return result.match({
      ok: profile => ({
        status: 200,
        body: profile
      }),
      err: error => ({
        status: error.httpStatus || 500,
        body: { error: error.message }
      })
    });
  }
}
```

## Best Practices

1. **Add context at each layer**
```typescript
return operation()
  .mapError(err => new LayerError('Operation failed', err));
```

2. **Don't swallow errors**
```typescript
// ❌ Bad
if (result.isErr()) {
  console.log('Error occurred');
  return ok(null); // Lost error info!
}

// ✅ Good
if (result.isErr()) {
  console.error('Error:', result.unwrapErr());
  return result; // Propagate
}
```

3. **Transform errors appropriately**
```typescript
// Transform low-level to high-level
return databaseError.map(dbErr => 
  new DomainError('Entity not found', dbErr)
);
```

4. **Use early returns**
```typescript
if (result.isErr()) {
  return result;
}
// Continue with success case
```

## The Mind-Shift

**Before understanding propagation:**
- Handle errors immediately
- Lose context
- Tight coupling

**After:**
- Let errors bubble up
- Add context at each layer
- Flexible handling

## Summary

**Error Propagation**:
- Pass errors up call stack
- Add context at each layer
- Transform between abstraction levels
- Let caller decide handling

**Key insight**: *Errors should flow upward with context, allowing flexible handling at the appropriate level.*

---

**Next**: [Validation](../04-validation.md)
