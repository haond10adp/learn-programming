# Validation

> *"Validate at the boundaries, trust internally."*

## What Is Validation?

**Validation** is the process of checking that data meets your requirements before using it. It's about making illegal states unrepresentable.

```typescript
interface User {
  email: string;    // What if it's not a valid email?
  age: number;      // What if it's negative?
  username: string; // What if it's too short?
}

// Better: Validate and enforce constraints
type Email = string & { readonly __brand: 'Email' };
type Age = number & { readonly __brand: 'Age' };

function createEmail(input: string): Result<Email, string> {
  if (!input.includes('@')) {
    return err('Invalid email format');
  }
  return ok(input as Email);
}

function createAge(input: number): Result<Age, string> {
  if (input < 0 || input > 150) {
    return err('Age must be between 0 and 150');
  }
  return ok(input as Age);
}
```

## Why This Matters

Validation establishes **invariants** - conditions that are always true:
- Invalid data never enters the system
- Internal code can trust data
- Bugs are caught early
- Clear error messages

## Validation Strategies

### 1. Parse, Don't Validate

```typescript
// ❌ Bad: Validation without types
function processUser(email: string, age: number) {
  if (!email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (age < 0) {
    throw new Error('Invalid age');
  }
  // Later code still uses string and number
  // Can pass invalid data again!
}

// ✅ Good: Parse into validated types
type ValidEmail = string & { __brand: 'ValidEmail' };
type ValidAge = number & { __brand: 'ValidAge' };

interface ValidatedUser {
  email: ValidEmail;
  age: ValidAge;
}

function parseUser(
  email: string,
  age: number
): Result<ValidatedUser, string[]> {
  const errors: string[] = [];
  
  const validEmail = parseEmail(email);
  if (validEmail.isErr()) {
    errors.push(validEmail.unwrapErr());
  }
  
  const validAge = parseAge(age);
  if (validAge.isErr()) {
    errors.push(validAge.unwrapErr());
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok({
    email: validEmail.unwrap(),
    age: validAge.unwrap()
  });
}

// Now internal code knows data is valid
function sendEmail(user: ValidatedUser) {
  // No need to check - email is guaranteed valid
  smtp.send(user.email, 'Welcome!');
}
```

### 2. Fail Fast

```typescript
function createUser(data: unknown): Result<User, string> {
  // Validate immediately at the boundary
  if (!isObject(data)) {
    return err('User data must be an object');
  }
  
  if (!('email' in data) || typeof data.email !== 'string') {
    return err('Email is required and must be a string');
  }
  
  if (!('age' in data) || typeof data.age !== 'number') {
    return err('Age is required and must be a number');
  }
  
  return parseUser(data.email, data.age);
}
```

### 3. Accumulate Errors

```typescript
type ValidationErrors = string[];

function validateUserForm(data: FormData): Result<User, ValidationErrors> {
  const errors: string[] = [];
  
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Email format is invalid');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!data.username) {
    errors.push('Username is required');
  } else if (data.username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok({
    email: data.email,
    password: data.password,
    username: data.username
  });
}
```

## Branded Types

Create types that can't be constructed without validation:

```typescript
// The brand
type Brand<K, T> = K & { __brand: T };

// Specific branded types
type Email = Brand<string, 'Email'>;
type PositiveNumber = Brand<number, 'PositiveNumber'>;
type NonEmptyString = Brand<string, 'NonEmptyString'>;

// Smart constructors
function createEmail(input: string): Result<Email, string> {
  const trimmed = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return err('Invalid email format');
  }
  return ok(trimmed as Email);
}

function createPositive(input: number): Result<PositiveNumber, string> {
  if (input <= 0) {
    return err('Number must be positive');
  }
  return ok(input as PositiveNumber);
}

function createNonEmpty(input: string): Result<NonEmptyString, string> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return err('String cannot be empty');
  }
  return ok(trimmed as NonEmptyString);
}

// Usage
interface User {
  email: Email;              // Can't create without validation
  age: PositiveNumber;       // Guaranteed positive
  name: NonEmptyString;      // Guaranteed non-empty
}
```

## Validation Rules

```typescript
type ValidationRule<T> = (value: T) => Result<T, string>;

const required: ValidationRule<string> = (value) =>
  value.trim().length > 0
    ? ok(value)
    : err('This field is required');

const minLength = (min: number): ValidationRule<string> => (value) =>
  value.length >= min
    ? ok(value)
    : err(`Must be at least ${min} characters`);

const maxLength = (max: number): ValidationRule<string> => (value) =>
  value.length <= max
    ? ok(value)
    : err(`Must be at most ${max} characters`);

const pattern = (regex: RegExp, message: string): ValidationRule<string> =>
  (value) => regex.test(value) ? ok(value) : err(message);

// Compose rules
function validate<T>(
  value: T,
  ...rules: ValidationRule<T>[]
): Result<T, string[]> {
  const errors: string[] = [];
  
  for (const rule of rules) {
    const result = rule(value);
    if (result.isErr()) {
      errors.push(result.unwrapErr());
    }
  }
  
  return errors.length > 0 ? err(errors) : ok(value);
}

// Use it
const usernameRules = [
  required,
  minLength(3),
  maxLength(20),
  pattern(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscore allowed')
];

const result = validate('john_doe', ...usernameRules);
```

## Schema Validation

### Manual Schema

```typescript
interface UserSchema {
  email: string;
  age: number;
  isActive: boolean;
}

function validateUserSchema(data: unknown): Result<UserSchema, string[]> {
  const errors: string[] = [];
  
  if (!isObject(data)) {
    return err(['Data must be an object']);
  }
  
  if (!('email' in data) || typeof data.email !== 'string') {
    errors.push('email must be a string');
  }
  
  if (!('age' in data) || typeof data.age !== 'number') {
    errors.push('age must be a number');
  }
  
  if (!('isActive' in data) || typeof data.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }
  
  if (errors.length > 0) {
    return err(errors);
  }
  
  return ok(data as UserSchema);
}
```

### Using Zod

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  username: z.string().min(3).max(20),
  isActive: z.boolean().default(true)
});

type User = z.infer<typeof UserSchema>;

function parseUser(data: unknown): Result<User, string[]> {
  const result = UserSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => issue.message);
    return err(errors);
  }
  
  return ok(result.data);
}
```

## Domain Validation

```typescript
class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string
  ) {}
  
  static create(amount: number, currency: string): Result<Money, string> {
    if (amount < 0) {
      return err('Amount cannot be negative');
    }
    
    if (currency.length !== 3) {
      return err('Currency must be 3 characters (ISO 4217)');
    }
    
    return ok(new Money(amount, currency));
  }
  
  getAmount(): number {
    return this.amount;
  }
  
  getCurrency(): string {
    return this.currency;
  }
  
  add(other: Money): Result<Money, string> {
    if (this.currency !== other.currency) {
      return err('Cannot add money with different currencies');
    }
    
    return Money.create(
      this.amount + other.amount,
      this.currency
    );
  }
}

// Usage
const money1 = Money.create(100, 'USD');
const money2 = Money.create(50, 'USD');

if (money1.isOk() && money2.isOk()) {
  const sum = money1.unwrap().add(money2.unwrap());
}
```

## Custom Validators

```typescript
class Validator<T> {
  constructor(private rules: Array<(value: T) => Result<void, string>>) {}
  
  validate(value: T): Result<T, string[]> {
    const errors: string[] = [];
    
    for (const rule of this.rules) {
      const result = rule(value);
      if (result.isErr()) {
        errors.push(result.unwrapErr());
      }
    }
    
    return errors.length > 0 ? err(errors) : ok(value);
  }
  
  static string() {
    return new StringValidator();
  }
  
  static number() {
    return new NumberValidator();
  }
}

class StringValidator extends Validator<string> {
  constructor() {
    super([]);
  }
  
  minLength(min: number): this {
    this.rules.push(value =>
      value.length >= min
        ? ok(undefined)
        : err(`Must be at least ${min} characters`)
    );
    return this;
  }
  
  maxLength(max: number): this {
    this.rules.push(value =>
      value.length <= max
        ? ok(undefined)
        : err(`Must be at most ${max} characters`)
    );
    return this;
  }
  
  pattern(regex: RegExp, message: string): this {
    this.rules.push(value =>
      regex.test(value)
        ? ok(undefined)
        : err(message)
    );
    return this;
  }
}

// Use it
const usernameValidator = Validator.string()
  .minLength(3)
  .maxLength(20)
  .pattern(/^[a-zA-Z0-9_]+$/, 'Invalid characters');

const result = usernameValidator.validate('john_doe');
```

## Async Validation

```typescript
async function validateUniqueEmail(
  email: Email
): Promise<Result<Email, string>> {
  const exists = await database.userExists(email);
  
  if (exists) {
    return err('Email is already taken');
  }
  
  return ok(email);
}

async function createUser(
  email: string,
  password: string
): Promise<Result<User, string[]>> {
  // Synchronous validation
  const validEmail = createEmail(email);
  if (validEmail.isErr()) {
    return err([validEmail.unwrapErr()]);
  }
  
  const validPassword = createPassword(password);
  if (validPassword.isErr()) {
    return err([validPassword.unwrapErr()]);
  }
  
  // Asynchronous validation
  const uniqueEmail = await validateUniqueEmail(validEmail.unwrap());
  if (uniqueEmail.isErr()) {
    return err([uniqueEmail.unwrapErr()]);
  }
  
  return ok({
    email: uniqueEmail.unwrap(),
    password: validPassword.unwrap()
  });
}
```

## Best Practices

1. **Validate at boundaries**
```typescript
// Validate when data enters the system
app.post('/users', async (req, res) => {
  const validUser = parseUser(req.body);
  if (validUser.isErr()) {
    return res.status(400).json({ errors: validUser.unwrapErr() });
  }
  
  // Internal code trusts data
  const user = await createUser(validUser.unwrap());
});
```

2. **Use branded types**
```typescript
// Can't create Email without validation
type Email = string & { __brand: 'Email' };
```

3. **Accumulate errors**
```typescript
// Return all errors, not just first
validateForm(data); // Returns all validation errors
```

4. **Make illegal states unrepresentable**
```typescript
// ❌ Can create invalid state
interface User {
  age: number; // Can be negative!
}

// ✅ Can't create invalid state
interface User {
  age: PositiveNumber; // Guaranteed positive
}
```

## The Mind-Shift

**Before understanding validation:**
- Check conditions everywhere
- Trust nothing
- Defensive programming everywhere

**After:**
- Validate once at boundaries
- Trust internally
- Type system enforces correctness

## Summary

**Validation**:
- Check data at boundaries
- Use branded types
- Accumulate errors
- Make illegal states unrepresentable

**Key insight**: *Parse, don't validate. Transform untrusted data into trusted types, then internal code can trust it.*

---

**Next**: [Domain Errors](../05-domain-errors.md)
