# Adapter Pattern

> *"Convert the interface of a class into another interface clients expect."*  
> — Gang of Four

## What is the Adapter Pattern?

The **Adapter pattern** makes incompatible interfaces work together. It wraps an existing class with a new interface, translating calls between them—like a power adapter that lets you plug a US device into a European outlet.

```typescript
// Incompatible interfaces
class OldLogger {
  logMessage(msg: string): void {
    console.log(`[OLD] ${msg}`);
  }
}

// New interface expected by application
interface Logger {
  log(level: string, message: string): void;
}

// Adapter makes them compatible
class LoggerAdapter implements Logger {
  constructor(private oldLogger: OldLogger) {}
  
  log(level: string, message: string): void {
    this.oldLogger.logMessage(`[${level}] ${message}`);
  }
}

// Usage
const logger: Logger = new LoggerAdapter(new OldLogger());
logger.log('INFO', 'Application started');
```

## Why This Matters

Adapter is useful when:
- **Legacy code**: Integrate old systems with new interfaces
- **Third-party libraries**: Wrap external APIs
- **Interface mismatch**: Connect incompatible interfaces
- **Standardization**: Provide consistent interface to varied implementations

## The Philosophy

Think of Adapter like a **travel plug adapter**: your phone charger has US prongs, but you're in Europe with different outlets. The adapter doesn't change your charger or the outlet—it translates between them.

## Real-World Examples

### Payment Gateway Adapter

```typescript
// Your application's interface
interface PaymentGateway {
  charge(amount: number, cardToken: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<void>;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

// Third-party Stripe SDK (different interface)
class StripeSDK {
  async createCharge(amountCents: number, source: string, currency: string) {
    return {
      id: `ch_${Date.now()}`,
      status: 'succeeded',
      amount: amountCents
    };
  }
  
  async createRefund(chargeId: string, amountCents: number) {
    return {
      id: `re_${Date.now()}`,
      status: 'succeeded'
    };
  }
}

// Adapter
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: StripeSDK) {}
  
  async charge(amount: number, cardToken: string): Promise<PaymentResult> {
    try {
      const result = await this.stripe.createCharge(
        Math.round(amount * 100),  // Convert dollars to cents
        cardToken,
        'usd'
      );
      
      return {
        success: result.status === 'succeeded',
        transactionId: result.id,
        message: 'Payment successful'
      };
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        message: error.message
      };
    }
  }
  
  async refund(transactionId: string, amount: number): Promise<void> {
    await this.stripe.createRefund(
      transactionId,
      Math.round(amount * 100)
    );
  }
}

// Usage
const paymentGateway: PaymentGateway = new StripeAdapter(new StripeSDK());
const result = await paymentGateway.charge(99.99, 'tok_visa');
```

### File Storage Adapter

```typescript
// Your application's interface
interface FileStorage {
  upload(filename: string, data: Buffer): Promise<string>;
  download(url: string): Promise<Buffer>;
  delete(url: string): Promise<void>;
}

// AWS S3 SDK (different interface)
class S3Client {
  async putObject(params: { Bucket: string; Key: string; Body: Buffer }) {
    return { Location: `https://s3.amazonaws.com/${params.Bucket}/${params.Key}` };
  }
  
  async getObject(params: { Bucket: string; Key: string }) {
    return { Body: Buffer.from('file content') };
  }
  
  async deleteObject(params: { Bucket: string; Key: string }) {
    return {};
  }
}

// Adapter
class S3StorageAdapter implements FileStorage {
  constructor(
    private s3: S3Client,
    private bucket: string
  ) {}
  
  async upload(filename: string, data: Buffer): Promise<string> {
    const result = await this.s3.putObject({
      Bucket: this.bucket,
      Key: filename,
      Body: data
    });
    return result.Location;
  }
  
  async download(url: string): Promise<Buffer> {
    const key = url.split('/').pop()!;
    const result = await this.s3.getObject({
      Bucket: this.bucket,
      Key: key
    });
    return result.Body;
  }
  
  async delete(url: string): Promise<void> {
    const key = url.split('/').pop()!;
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key
    });
  }
}

// Usage
const storage: FileStorage = new S3StorageAdapter(new S3Client(), 'my-bucket');
const url = await storage.upload('photo.jpg', photoData);
```

### Database Adapter

```typescript
// Application interface
interface Database {
  query(sql: string, params: any[]): Promise<any[]>;
  execute(sql: string, params: any[]): Promise<number>;
}

// MongoDB driver (different interface)
class MongoDBDriver {
  async find(collection: string, query: object) {
    return [{ _id: '1', name: 'Alice' }];
  }
  
  async insertOne(collection: string, document: object) {
    return { insertedId: 'abc123' };
  }
}

// Adapter
class MongoAdapter implements Database {
  constructor(private mongo: MongoDBDriver) {}
  
  async query(sql: string, params: any[]): Promise<any[]> {
    // Parse SQL and convert to MongoDB query
    const collection = this.extractCollection(sql);
    const mongoQuery = this.sqlToMongoQuery(sql, params);
    return await this.mongo.find(collection, mongoQuery);
  }
  
  async execute(sql: string, params: any[]): Promise<number> {
    // Parse SQL and execute as MongoDB operation
    const collection = this.extractCollection(sql);
    if (sql.includes('INSERT')) {
      await this.mongo.insertOne(collection, this.paramsToDocument(params));
      return 1;
    }
    return 0;
  }
  
  private extractCollection(sql: string): string {
    // Simple parsing (real implementation would be more robust)
    const match = sql.match(/FROM (\w+)/i);
    return match ? match[1] : 'default';
  }
  
  private sqlToMongoQuery(sql: string, params: any[]): object {
    // Convert SQL WHERE to MongoDB query
    return {};  // Simplified
  }
  
  private paramsToDocument(params: any[]): object {
    return {};  // Simplified
  }
}
```

## Benefits

1. **Integration**: Connect incompatible interfaces
2. **Reusability**: Use existing classes without modification
3. **Decoupling**: Client doesn't know about adapted class
4. **Flexibility**: Easy to swap implementations

## When to Use

✅ **Use Adapter when:**
- Integrating legacy code
- Using third-party libraries with different interfaces
- Need to use multiple incompatible classes
- Want to provide consistent interface

❌ **Don't use Adapter when:**
- You can modify the original class
- Interfaces are already compatible
- Adds unnecessary complexity

## Common Violations

```typescript
// ❌ BAD: Client knows about both interfaces
const oldLogger = new OldLogger();
oldLogger.logMessage(msg);  // Direct usage

// ✅ GOOD: Client only knows standard interface
const logger: Logger = new LoggerAdapter(new OldLogger());
logger.log('INFO', msg);
```

## The Mind-Shift

**Before**: Rewrite code to match new interface  
**After**: Wrap with adapter, keep both unchanged

## Summary

**Adapter Pattern**:
- Makes incompatible interfaces compatible
- Wraps existing class
- Translates between interfaces
- Useful for legacy code and third-party libraries

**Key insight**: *The Adapter pattern bridges incompatibility—when you can't change an interface but need it to match another, create an adapter that translates between them.*

---

**Next**: [Decorator Pattern](../decorator.md)
