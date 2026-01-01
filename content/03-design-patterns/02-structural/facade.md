# Facade Pattern

> *"Provide a unified interface to a set of interfaces in a subsystem."*  
> — Gang of Four

## What is the Facade Pattern?

The **Facade pattern** provides a **simple interface** to a complex subsystem. It hides complexity behind a clean API—like a TV remote that gives you simple buttons (power, volume, channel) instead of exposing all the internal circuits.

```typescript
// Complex subsystem
class CPU {
  freeze() { console.log('CPU freezing'); }
  execute() { console.log('CPU executing'); }
}

class Memory {
  load() { console.log('Memory loading'); }
}

class HardDrive {
  read() { console.log('HardDrive reading'); return 'data'; }
}

// Facade - simple interface
class ComputerFacade {
  private cpu = new CPU();
  private memory = new Memory();
  private hardDrive = new HardDrive();
  
  start() {
    this.cpu.freeze();
    this.memory.load();
    this.hardDrive.read();
    this.cpu.execute();
    console.log('Computer started');
  }
}

// Usage
const computer = new ComputerFacade();
computer.start();  // One simple call instead of many
```

## Why This Matters

Facade is useful when:
- **Complex subsystem**: Many classes working together
- **Simple interface needed**: Hide complexity from clients
- **Layered architecture**: Provide entry point to layer
- **Easier to use**: Reduce learning curve

## The Philosophy

Think of Facade like a **hotel concierge**: instead of you figuring out transportation, restaurants, tours, and tickets, you tell the concierge what you want ("I'd like dinner and a show"), and they handle all the complex coordination.

## Real-World Examples

### Video Conversion Facade

```typescript
// Complex subsystem
class VideoFile {
  constructor(public filename: string) {}
}

class OggCompressionCodec {
  compress(video: VideoFile): Buffer {
    console.log('Compressing with Ogg codec');
    return Buffer.from('ogg-data');
  }
}

class MPEG4CompressionCodec {
  compress(video: VideoFile): Buffer {
    console.log('Compressing with MPEG4 codec');
    return Buffer.from('mpeg4-data');
  }
}

class CodecFactory {
  static getCodec(format: string) {
    if (format === 'ogg') return new OggCompressionCodec();
    if (format === 'mp4') return new MPEG4CompressionCodec();
    throw new Error('Unsupported format');
  }
}

class BitrateReader {
  read(file: VideoFile): string {
    console.log('Reading bitrate');
    return '44100';
  }
  
  convert(buffer: Buffer, format: string): Buffer {
    console.log(`Converting to ${format}`);
    return buffer;
  }
}

class AudioMixer {
  fix(video: VideoFile): VideoFile {
    console.log('Fixing audio');
    return video;
  }
}

// Facade - simple interface
class VideoConverter {
  convert(filename: string, format: string): Buffer {
    const file = new VideoFile(filename);
    
    // Complex orchestration hidden from client
    const codec = CodecFactory.getCodec(format);
    const bitrateReader = new BitrateReader();
    const audioMixer = new AudioMixer();
    
    const fixedVideo = audioMixer.fix(file);
    const compressed = codec.compress(fixedVideo);
    const result = bitrateReader.convert(compressed, format);
    
    console.log(`Conversion complete: ${filename} → ${format}`);
    return result;
  }
}

// Usage - simple!
const converter = new VideoConverter();
const result = converter.convert('video.avi', 'mp4');
```

### E-Commerce Order Facade

```typescript
// Complex subsystem
class InventoryService {
  checkStock(productId: string, quantity: number): boolean {
    console.log(`Checking stock for ${productId}`);
    return true;
  }
  
  reserve(productId: string, quantity: number): void {
    console.log(`Reserving ${quantity} of ${productId}`);
  }
}

class PaymentService {
  charge(amount: number, cardToken: string): Promise<string> {
    console.log(`Charging $${amount}`);
    return Promise.resolve('payment_' + Date.now());
  }
}

class ShippingService {
  schedule(address: string, items: any[]): Promise<string> {
    console.log(`Scheduling shipping to ${address}`);
    return Promise.resolve('tracking_' + Date.now());
  }
}

class NotificationService {
  sendEmail(email: string, subject: string, body: string): void {
    console.log(`Sending email to ${email}: ${subject}`);
  }
}

class OrderRepository {
  save(order: any): Promise<string> {
    console.log('Saving order to database');
    return Promise.resolve('order_' + Date.now());
  }
}

// Facade
class OrderFacade {
  private inventory = new InventoryService();
  private payment = new PaymentService();
  private shipping = new ShippingService();
  private notification = new NotificationService();
  private repository = new OrderRepository();
  
  async placeOrder(orderData: {
    userId: string;
    email: string;
    items: Array<{ productId: string; quantity: number }>;
    address: string;
    cardToken: string;
    total: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      // Check inventory
      for (const item of orderData.items) {
        if (!this.inventory.checkStock(item.productId, item.quantity)) {
          return { success: false, error: 'Out of stock' };
        }
      }
      
      // Reserve items
      for (const item of orderData.items) {
        this.inventory.reserve(item.productId, item.quantity);
      }
      
      // Process payment
      const paymentId = await this.payment.charge(orderData.total, orderData.cardToken);
      
      // Schedule shipping
      const trackingNumber = await this.shipping.schedule(orderData.address, orderData.items);
      
      // Save order
      const orderId = await this.repository.save({
        ...orderData,
        paymentId,
        trackingNumber,
        status: 'confirmed'
      });
      
      // Send confirmation
      this.notification.sendEmail(
        orderData.email,
        'Order Confirmed',
        `Your order ${orderId} has been confirmed!`
      );
      
      return { success: true, orderId };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Usage - simple!
const orderService = new OrderFacade();
const result = await orderService.placeOrder({
  userId: '123',
  email: 'customer@example.com',
  items: [{ productId: 'ABC', quantity: 2 }],
  address: '123 Main St',
  cardToken: 'tok_visa',
  total: 99.99
});
```

### Home Automation Facade

```typescript
// Complex subsystem
class Light {
  on() { console.log('Lights on'); }
  off() { console.log('Lights off'); }
  dim(level: number) { console.log(`Lights dimmed to ${level}%`); }
}

class Thermostat {
  setTemperature(temp: number) { console.log(`Temperature set to ${temp}°F`); }
}

class SecuritySystem {
  arm() { console.log('Security armed'); }
  disarm() { console.log('Security disarmed'); }
}

class MusicSystem {
  play(playlist: string) { console.log(`Playing ${playlist}`); }
  stop() { console.log('Music stopped'); }
  setVolume(level: number) { console.log(`Volume: ${level}%`); }
}

class Blinds {
  open() { console.log('Blinds opened'); }
  close() { console.log('Blinds closed'); }
}

// Facade
class SmartHomeFacade {
  private lights = new Light();
  private thermostat = new Thermostat();
  private security = new SecuritySystem();
  private music = new MusicSystem();
  private blinds = new Blinds();
  
  leaveHome() {
    console.log('Activating "Leave Home" mode');
    this.lights.off();
    this.music.stop();
    this.thermostat.setTemperature(68);
    this.security.arm();
    this.blinds.close();
  }
  
  arriveHome() {
    console.log('Activating "Arrive Home" mode');
    this.security.disarm();
    this.lights.on();
    this.thermostat.setTemperature(72);
    this.blinds.open();
  }
  
  movieMode() {
    console.log('Activating "Movie Mode"');
    this.lights.dim(20);
    this.blinds.close();
    this.music.play('Movie Soundtrack');
    this.music.setVolume(70);
  }
  
  sleepMode() {
    console.log('Activating "Sleep Mode"');
    this.lights.off();
    this.music.stop();
    this.thermostat.setTemperature(68);
    this.security.arm();
  }
}

// Usage - simple scenes
const home = new SmartHomeFacade();
home.leaveHome();   // One call controls everything
home.arriveHome();
home.movieMode();
home.sleepMode();
```

## Benefits

1. **Simplicity**: Easy-to-use interface
2. **Decoupling**: Clients independent of subsystem
3. **Centralization**: One place for subsystem coordination
4. **Flexibility**: Can change subsystem without affecting clients

## When to Use

✅ **Use Facade when:**
- Complex subsystem with many classes
- Want to provide simple interface
- Need to decouple client from subsystem
- Layered architecture (facade for each layer)

❌ **Don't use Facade when:**
- Subsystem is already simple
- Clients need fine-grained control
- Adds unnecessary indirection

## Common Violations

```typescript
// ❌ BAD: Client knows about subsystem
const cpu = new CPU();
const memory = new Memory();
const hardDrive = new HardDrive();
cpu.freeze();
memory.load();
hardDrive.read();
cpu.execute();

// ✅ GOOD: Facade hides complexity
const computer = new ComputerFacade();
computer.start();
```

## The Mind-Shift

**Before**: Clients interact with many subsystem classes  
**After**: Clients use one simple facade

## Summary

**Facade Pattern**:
- Provides simple interface to complex subsystem
- Hides complexity
- One entry point for operations
- Decouples clients from subsystem details

**Key insight**: *The Facade pattern simplifies complexity—when a subsystem has many moving parts, create a facade that provides a simple, unified interface.*

---

**Next**: [Proxy Pattern](../proxy.md)
