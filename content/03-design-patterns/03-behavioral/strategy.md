# Strategy Pattern

> *"Define a family of algorithms, encapsulate each one, and make them interchangeable."*  
> — Gang of Four

## What is the Strategy Pattern?

The **Strategy pattern** makes **algorithms interchangeable**. Instead of hardcoding behavior, you define a family of algorithms, put each in a separate class, and make them interchangeable—like choosing different routes to the same destination based on traffic, distance, or scenic views.

```typescript
// Strategy interface
interface SortStrategy {
  sort(data: number[]): number[];
}

// Concrete strategies
class QuickSort implements SortStrategy {
  sort(data: number[]): number[] {
    console.log('Using QuickSort');
    return [...data].sort((a, b) => a - b);
  }
}

class BubbleSort implements SortStrategy {
  sort(data: number[]): number[] {
    console.log('Using BubbleSort');
    const arr = [...data];
    // Bubble sort implementation
    return arr;
  }
}

// Context
class Sorter {
  constructor(private strategy: SortStrategy) {}
  
  setStrategy(strategy: SortStrategy): void {
    this.strategy = strategy;
  }
  
  sort(data: number[]): number[] {
    return this.strategy.sort(data);
  }
}

// Usage
const sorter = new Sorter(new QuickSort());
sorter.sort([3, 1, 4, 1, 5]);

sorter.setStrategy(new BubbleSort());
sorter.sort([3, 1, 4, 1, 5]);
```

## Why This Matters

Strategy is useful when:
- **Multiple algorithms**: Different ways to do the same thing
- **Runtime selection**: Choose algorithm dynamically
- **Avoid conditionals**: Replace if/else or switch with strategy objects
- **Open/Closed**: Add algorithms without changing client code

## The Philosophy

Think of Strategy like **payment methods**: whether you pay with cash, credit card, PayPal, or cryptocurrency, the result is the same (you pay), but the mechanism differs. The cashier doesn't need to know how each method works—they just process the payment strategy you choose.

## Real-World Examples

### Payment Strategy

```typescript
interface PaymentStrategy {
  pay(amount: number): Promise<void>;
}

class CreditCardPayment implements PaymentStrategy {
  constructor(
    private cardNumber: string,
    private cvv: string
  ) {}
  
  async pay(amount: number): Promise<void> {
    console.log(`Processing credit card payment of $${amount}`);
    console.log(`Card: ****${this.cardNumber.slice(-4)}`);
    // Process credit card
  }
}

class PayPalPayment implements PaymentStrategy {
  constructor(private email: string) {}
  
  async pay(amount: number): Promise<void> {
    console.log(`Processing PayPal payment of $${amount}`);
    console.log(`Account: ${this.email}`);
    // Process PayPal
  }
}

class CryptoPayment implements PaymentStrategy {
  constructor(private walletAddress: string) {}
  
  async pay(amount: number): Promise<void> {
    console.log(`Processing crypto payment of $${amount}`);
    console.log(`Wallet: ${this.walletAddress}`);
    // Process crypto
  }
}

class ShoppingCart {
  private items: Array<{ name: string; price: number }> = [];
  private paymentStrategy?: PaymentStrategy;
  
  addItem(name: string, price: number): void {
    this.items.push({ name, price });
  }
  
  setPaymentStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy;
  }
  
  async checkout(): Promise<void> {
    if (!this.paymentStrategy) {
      throw new Error('Payment method not selected');
    }
    
    const total = this.items.reduce((sum, item) => sum + item.price, 0);
    await this.paymentStrategy.pay(total);
    console.log('Order complete!');
  }
}

// Usage
const cart = new ShoppingCart();
cart.addItem('Book', 29.99);
cart.addItem('Pen', 4.99);

// Customer chooses payment method
cart.setPaymentStrategy(new CreditCardPayment('1234567812345678', '123'));
await cart.checkout();

// Or switch to different method
cart.setPaymentStrategy(new PayPalPayment('user@example.com'));
await cart.checkout();
```

### Compression Strategy

```typescript
interface CompressionStrategy {
  compress(data: string): string;
  decompress(data: string): string;
}

class ZipCompression implements CompressionStrategy {
  compress(data: string): string {
    console.log('Compressing with ZIP');
    return `zip(${data})`;
  }
  
  decompress(data: string): string {
    return data.replace('zip(', '').replace(')', '');
  }
}

class GzipCompression implements CompressionStrategy {
  compress(data: string): string {
    console.log('Compressing with GZIP');
    return `gzip(${data})`;
  }
  
  decompress(data: string): string {
    return data.replace('gzip(', '').replace(')', '');
  }
}

class NoCompression implements CompressionStrategy {
  compress(data: string): string {
    console.log('No compression');
    return data;
  }
  
  decompress(data: string): string {
    return data;
  }
}

class FileManager {
  constructor(private compressionStrategy: CompressionStrategy) {}
  
  setCompressionStrategy(strategy: CompressionStrategy): void {
    this.compressionStrategy = strategy;
  }
  
  save(filename: string, data: string): void {
    const compressed = this.compressionStrategy.compress(data);
    console.log(`Saving ${filename}: ${compressed.length} bytes`);
  }
  
  load(filename: string, compressedData: string): string {
    return this.compressionStrategy.decompress(compressedData);
  }
}

// Usage - choose compression based on file size
const fileManager = new FileManager(new NoCompression());

const smallFile = 'Hello';
if (smallFile.length < 100) {
  fileManager.setCompressionStrategy(new NoCompression());
} else if (smallFile.length < 10000) {
  fileManager.setCompressionStrategy(new ZipCompression());
} else {
  fileManager.setCompressionStrategy(new GzipCompression());
}

fileManager.save('small.txt', smallFile);
```

### Validation Strategy

```typescript
interface ValidationStrategy {
  validate(value: string): { valid: boolean; error?: string };
}

class EmailValidation implements ValidationStrategy {
  validate(value: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value)
      ? { valid: true }
      : { valid: false, error: 'Invalid email format' };
  }
}

class PhoneValidation implements ValidationStrategy {
  validate(value: string) {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(value)
      ? { valid: true }
      : { valid: false, error: 'Phone must be xxx-xxx-xxxx' };
  }
}

class PasswordValidation implements ValidationStrategy {
  validate(value: string) {
    if (value.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(value)) {
      return { valid: false, error: 'Password must contain uppercase letter' };
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, error: 'Password must contain number' };
    }
    return { valid: true };
  }
}

class FormField {
  constructor(
    private name: string,
    private value: string,
    private validator: ValidationStrategy
  ) {}
  
  validate() {
    const result = this.validator.validate(this.value);
    if (!result.valid) {
      console.log(`${this.name}: ❌ ${result.error}`);
    } else {
      console.log(`${this.name}: ✅ Valid`);
    }
    return result.valid;
  }
}

// Usage
const emailField = new FormField('Email', 'user@example.com', new EmailValidation());
const phoneField = new FormField('Phone', '123-456-7890', new PhoneValidation());
const passwordField = new FormField('Password', 'SecurePass123', new PasswordValidation());

emailField.validate();
phoneField.validate();
passwordField.validate();
```

## Benefits

1. **Interchangeable algorithms**: Easy to switch
2. **Open/Closed**: Add strategies without changing context
3. **Eliminates conditionals**: Replace if/else chains
4. **Runtime selection**: Choose algorithm dynamically
5. **Testability**: Test each strategy independently

## When to Use

✅ **Use Strategy when:**
- Multiple algorithms for same task
- Need to switch algorithms at runtime
- Have conditional logic choosing algorithms
- Want to hide algorithm implementation details

❌ **Don't use Strategy when:**
- Only one algorithm
- Algorithms rarely change
- Simple behavior that doesn't need abstraction

## Common Violations

```typescript
// ❌ BAD: Conditional logic in client
class Sorter {
  sort(data: number[], type: string) {
    if (type === 'quick') {
      // QuickSort logic
    } else if (type === 'bubble') {
      // BubbleSort logic
    }
  }
}

// ✅ GOOD: Strategy pattern
class Sorter {
  constructor(private strategy: SortStrategy) {}
  
  sort(data: number[]) {
    return this.strategy.sort(data);
  }
}
```

## The Mind-Shift

**Before**: if/else or switch to choose algorithm  
**After**: Inject strategy object, algorithm becomes data

## Summary

**Strategy Pattern**:
- Defines family of algorithms
- Encapsulates each algorithm
- Makes them interchangeable
- Context delegates to strategy
- Chosen at runtime
- Eliminates conditionals

**Key insight**: *The Strategy pattern makes behavior pluggable—when you have multiple ways to do something, encapsulate each way as a strategy and let the client choose.*

---

**Next**: [Command Pattern](../command.md)
