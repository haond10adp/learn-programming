# Domain Errors

> *"Errors are part of your domain model."*

## What Are They?

**Domain errors** are errors that represent business rule violations or domain-specific failure conditions. They're not technical errors (like network failures) but meaningful domain concepts.

```typescript
// ❌ Generic error
throw new Error('Cannot withdraw');

// ✅ Domain error
class InsufficientFundsError {
  constructor(
    public readonly balance: Money,
    public readonly requestedAmount: Money
  ) {}
}
```

## Why This Matters

Domain errors:
- Express business rules
- Provide meaningful context
- Enable different handling
- Document the domain

They're **part of the ubiquitous language**, not technical details.

## Domain vs Technical Errors

```typescript
// Technical errors: infrastructure concerns
class NetworkError extends Error {}
class DatabaseError extends Error {}
class FileSystemError extends Error {}

// Domain errors: business rules
class OrderAlreadyShippedError {
  constructor(public orderId: string) {}
}

class InvalidDiscountError {
  constructor(
    public discount: number,
    public maxDiscount: number
  ) {}
}

class ProductOutOfStockError {
  constructor(
    public productId: string,
    public requested: number,
    public available: number
  ) {}
}
```

## Modeling Domain Errors

### As Classes

```typescript
class InsufficientFunds {
  readonly type = 'InsufficientFunds';
  
  constructor(
    public readonly balance: number,
    public readonly requested: number
  ) {}
  
  get shortfall(): number {
    return this.requested - this.balance;
  }
}

class AccountLocked {
  readonly type = 'AccountLocked';
  
  constructor(
    public readonly reason: string,
    public readonly until?: Date
  ) {}
}

class DailyLimitExceeded {
  readonly type = 'DailyLimitExceeded';
  
  constructor(
    public readonly limit: number,
    public readonly attempted: number
  ) {}
}

type WithdrawalError =
  | InsufficientFunds
  | AccountLocked
  | DailyLimitExceeded;

function withdraw(
  account: Account,
  amount: number
): Result<Transaction, WithdrawalError> {
  if (account.isLocked) {
    return err(new AccountLocked(account.lockReason, account.lockedUntil));
  }
  
  if (amount > account.dailyLimit) {
    return err(new DailyLimitExceeded(account.dailyLimit, amount));
  }
  
  if (amount > account.balance) {
    return err(new InsufficientFunds(account.balance, amount));
  }
  
  return ok(processWithdrawal(account, amount));
}
```

### As Discriminated Unions

```typescript
type OrderError =
  | { type: 'OrderNotFound'; orderId: string }
  | { type: 'OrderAlreadyShipped'; orderId: string; shippedAt: Date }
  | { type: 'InvalidQuantity'; requested: number; max: number }
  | { type: 'ProductUnavailable'; productId: string }
  | { type: 'PaymentFailed'; reason: string };

function cancelOrder(orderId: string): Result<void, OrderError> {
  const order = findOrder(orderId);
  
  if (!order) {
    return err({ type: 'OrderNotFound', orderId });
  }
  
  if (order.status === 'shipped') {
    return err({
      type: 'OrderAlreadyShipped',
      orderId,
      shippedAt: order.shippedAt
    });
  }
  
  // Process cancellation
  return ok(undefined);
}
```

## Rich Error Information

```typescript
interface ValidationContext {
  field: string;
  value: unknown;
  constraints: Record<string, any>;
}

class ValidationError {
  readonly type = 'ValidationError';
  
  constructor(
    public readonly message: string,
    public readonly context: ValidationContext
  ) {}
  
  toUserMessage(): string {
    return `${this.context.field}: ${this.message}`;
  }
}

class EmailValidationError extends ValidationError {
  constructor(email: string) {
    super('Invalid email format', {
      field: 'email',
      value: email,
      constraints: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
    });
  }
}

class AgeValidationError extends ValidationError {
  constructor(age: number, min: number, max: number) {
    super(`Age must be between ${min} and ${max}`, {
      field: 'age',
      value: age,
      constraints: { min, max }
    });
  }
}
```

## Error Hierarchies

```typescript
// Base domain error
abstract class DomainError {
  abstract readonly type: string;
  abstract readonly message: string;
}

// Payment domain
abstract class PaymentError extends DomainError {}

class InsufficientFundsError extends PaymentError {
  readonly type = 'InsufficientFunds';
  readonly message: string;
  
  constructor(
    public readonly balance: number,
    public readonly required: number
  ) {
    super();
    this.message = `Insufficient funds: balance=${balance}, required=${required}`;
  }
}

class PaymentMethodExpiredError extends PaymentError {
  readonly type = 'PaymentMethodExpired';
  readonly message: string;
  
  constructor(public readonly expiryDate: Date) {
    super();
    this.message = `Payment method expired on ${expiryDate.toISOString()}`;
  }
}

// Shipping domain
abstract class ShippingError extends DomainError {}

class InvalidAddressError extends ShippingError {
  readonly type = 'InvalidAddress';
  readonly message: string;
  
  constructor(public readonly address: string) {
    super();
    this.message = `Invalid shipping address: ${address}`;
  }
}

class UnserviceableAreaError extends ShippingError {
  readonly type = 'UnserviceableArea';
  readonly message: string;
  
  constructor(
    public readonly zipCode: string,
    public readonly country: string
  ) {
    super();
    this.message = `Cannot ship to ${zipCode}, ${country}`;
  }
}
```

## Error Mapping

### From Technical to Domain

```typescript
class UserRepository {
  async findById(id: string): Promise<Result<User, DomainError>> {
    try {
      const user = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
      
      if (!user) {
        return err(new UserNotFoundError(id));
      }
      
      return ok(user);
    } catch (error) {
      if (error.code === 'CONNECTION_LOST') {
        return err(new DatabaseUnavailableError());
      }
      
      if (error.code === 'TIMEOUT') {
        return err(new DatabaseTimeoutError());
      }
      
      return err(new UnexpectedDatabaseError(error.message));
    }
  }
}
```

### Between Domains

```typescript
// Inventory domain error
class ProductNotAvailableError {
  constructor(public productId: string) {}
}

// Order domain error
class OrderItemUnavailableError {
  constructor(
    public orderId: string,
    public productId: string
  ) {}
}

// Map inventory error to order error
function addItemToOrder(
  order: Order,
  productId: string
): Result<Order, OrderItemUnavailableError> {
  const available = checkInventory(productId);
  
  if (available.isErr()) {
    // Map ProductNotAvailableError to OrderItemUnavailableError
    return err(new OrderItemUnavailableError(order.id, productId));
  }
  
  return ok(order.addItem(productId));
}
```

## Pattern Matching on Errors

```typescript
function handleWithdrawalError(error: WithdrawalError): UserMessage {
  switch (error.type) {
    case 'InsufficientFunds':
      return {
        title: 'Insufficient Funds',
        message: `You need $${error.shortfall} more to complete this withdrawal.`,
        severity: 'error'
      };
      
    case 'AccountLocked':
      return {
        title: 'Account Locked',
        message: error.until
          ? `Your account is locked until ${error.until.toLocaleDateString()}`
          : `Your account is locked: ${error.reason}`,
        severity: 'error'
      };
      
    case 'DailyLimitExceeded':
      return {
        title: 'Daily Limit Exceeded',
        message: `Your daily limit is $${error.limit}. You tried to withdraw $${error.attempted}.`,
        severity: 'warning'
      };
  }
}
```

## Error Recovery

```typescript
function processOrder(order: Order): Result<Receipt, OrderError> {
  // Try to charge card
  const payment = chargeCard(order.paymentMethod, order.total);
  
  if (payment.isErr()) {
    const error = payment.unwrapErr();
    
    // Can we recover?
    if (error.type === 'InsufficientFunds') {
      // Try alternative payment method
      const alternative = chargeAlternativePayment(order);
      if (alternative.isOk()) {
        return alternative;
      }
    }
    
    // Can't recover
    return err({
      type: 'PaymentFailed',
      reason: error.message
    });
  }
  
  return ok(generateReceipt(order, payment.unwrap()));
}
```

## Documenting Domain Errors

```typescript
/**
 * Transfers money between accounts.
 * 
 * @returns Receipt on success
 * 
 * @errors
 * - InsufficientFunds: Source account doesn't have enough money
 * - AccountLocked: Source or destination account is locked
 * - DailyLimitExceeded: Transfer exceeds daily limit
 * - InvalidTransfer: Cannot transfer to same account
 */
function transfer(
  from: Account,
  to: Account,
  amount: Money
): Result<Receipt, TransferError> {
  // Implementation
}
```

## Real-World Example: E-commerce

```typescript
// Domain errors
type CheckoutError =
  | { type: 'CartEmpty' }
  | { type: 'InvalidShippingAddress'; address: Address }
  | { type: 'ItemOutOfStock'; productId: string; available: number }
  | { type: 'InvalidCoupon'; code: string }
  | { type: 'PaymentDeclined'; reason: string }
  | { type: 'ShippingUnavailable'; zipCode: string };

class CheckoutService {
  async checkout(cart: Cart, payment: PaymentMethod): Promise<Result<Order, CheckoutError>> {
    // Validate cart
    if (cart.items.length === 0) {
      return err({ type: 'CartEmpty' });
    }
    
    // Validate address
    if (!isValidAddress(cart.shippingAddress)) {
      return err({
        type: 'InvalidShippingAddress',
        address: cart.shippingAddress
      });
    }
    
    // Check inventory
    for (const item of cart.items) {
      const stock = await this.inventory.checkStock(item.productId);
      if (stock < item.quantity) {
        return err({
          type: 'ItemOutOfStock',
          productId: item.productId,
          available: stock
        });
      }
    }
    
    // Validate coupon
    if (cart.coupon) {
      const valid = await this.validateCoupon(cart.coupon);
      if (!valid) {
        return err({ type: 'InvalidCoupon', code: cart.coupon });
      }
    }
    
    // Check shipping
    const shipping = await this.shipping.canShipTo(cart.shippingAddress);
    if (!shipping) {
      return err({
        type: 'ShippingUnavailable',
        zipCode: cart.shippingAddress.zipCode
      });
    }
    
    // Process payment
    const paymentResult = await this.payment.charge(payment, cart.total);
    if (paymentResult.isErr()) {
      return err({
        type: 'PaymentDeclined',
        reason: paymentResult.unwrapErr().message
      });
    }
    
    // Create order
    return ok(await this.createOrder(cart, paymentResult.unwrap()));
  }
}
```

## Best Practices

1. **Express business rules**
```typescript
// Error communicates business concept
class CannotShipToPoBoxError {
  constructor(public address: string) {}
}
```

2. **Include relevant context**
```typescript
class InsufficientInventoryError {
  constructor(
    public productId: string,
    public requested: number,
    public available: number
  ) {}
}
```

3. **Use discriminated unions**
```typescript
type Error = { type: 'A' } | { type: 'B' } | { type: 'C' };
// TypeScript ensures exhaustive handling
```

4. **Keep errors serializable**
```typescript
// ✅ Can serialize
{ type: 'Error', message: 'Failed', code: 123 }

// ❌ Can't serialize
new Error() // Has stack, non-enumerable properties
```

## The Mind-Shift

**Before domain errors:**
- Generic Error objects
- String messages
- No structure

**After:**
- Errors are domain concepts
- Rich, structured information
- Type-safe handling

## Summary

**Domain Errors**:
- Express business rules
- Part of domain model
- Rich context
- Type-safe handling

**Key insight**: *Errors aren't just failure—they're meaningful domain concepts that communicate business rules.*

---

**Next**: [Error Recovery](../06-error-recovery.md)
