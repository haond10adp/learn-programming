# Profiling and Performance Measurement

## Why Measure Performance?

> "You can't improve what you don't measure."

Before optimizing, you must identify bottlenecks. Profiling helps you understand:
- Which code paths are slow
- Where memory is being used
- What causes UI lag
- Where network delays occur

## Performance Measurement Fundamentals

### 1. Basic Timing

```typescript
// Simple timing with console.time
console.time('operation');
expensiveOperation();
console.timeEnd('operation');
// Output: operation: 1234.56ms

// Performance API (more accurate)
const start = performance.now();
expensiveOperation();
const end = performance.now();
console.log(`Took ${end - start}ms`);

// High-resolution timing
const start = process.hrtime.bigint();
expensiveOperation();
const end = process.hrtime.bigint();
console.log(`Took ${Number(end - start) / 1_000_000}ms`);
```

### 2. Performance Marks and Measures

```typescript
// Mark specific points
performance.mark('start-fetch');
await fetchData();
performance.mark('end-fetch');

// Measure between marks
performance.measure('fetch-duration', 'start-fetch', 'end-fetch');

// Get measurements
const measurements = performance.getEntriesByType('measure');
measurements.forEach(measure => {
    console.log(`${measure.name}: ${measure.duration}ms`);
});

// Clear marks
performance.clearMarks();
performance.clearMeasures();
```

### 3. Function Profiling

```typescript
// ============================================
// PROFILING DECORATOR
// ============================================

function profile(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
        const start = performance.now();
        try {
            return await original.apply(this, args);
        } finally {
            const end = performance.now();
            console.log(`${propertyKey} took ${end - start}ms`);
        }
    };
    
    return descriptor;
}

// Usage
class DataService {
    @profile
    async fetchUsers(): Promise<User[]> {
        return await fetch('/api/users').then(r => r.json());
    }
    
    @profile
    async processData(data: any[]): Promise<void> {
        // Process data
    }
}
```

### 4. Custom Performance Monitor

```typescript
// ============================================
// PERFORMANCE MONITOR
// ============================================

class PerformanceMonitor {
    private measurements = new Map<string, number[]>();
    
    start(label: string): () => void {
        const startTime = performance.now();
        
        return () => {
            const duration = performance.now() - startTime;
            this.record(label, duration);
        };
    }
    
    record(label: string, duration: number): void {
        const existing = this.measurements.get(label) || [];
        existing.push(duration);
        this.measurements.set(label, existing);
    }
    
    getStats(label: string): PerformanceStats | null {
        const measurements = this.measurements.get(label);
        if (!measurements || measurements.length === 0) return null;
        
        const sorted = [...measurements].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);
        
        return {
            count: sorted.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: sum / sorted.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
    
    report(): void {
        console.log('Performance Report:');
        console.log('===================');
        
        for (const [label, _] of this.measurements) {
            const stats = this.getStats(label);
            if (stats) {
                console.log(`\n${label}:`);
                console.log(`  Count: ${stats.count}`);
                console.log(`  Mean:  ${stats.mean.toFixed(2)}ms`);
                console.log(`  Median: ${stats.median.toFixed(2)}ms`);
                console.log(`  Min:   ${stats.min.toFixed(2)}ms`);
                console.log(`  Max:   ${stats.max.toFixed(2)}ms`);
                console.log(`  P95:   ${stats.p95.toFixed(2)}ms`);
                console.log(`  P99:   ${stats.p99.toFixed(2)}ms`);
            }
        }
    }
    
    clear(): void {
        this.measurements.clear();
    }
}

interface PerformanceStats {
    count: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
}

// Usage
const monitor = new PerformanceMonitor();

async function processRequest() {
    const end = monitor.start('processRequest');
    
    // Do work
    await doWork();
    
    end();
}

// After many requests
monitor.report();
```

## Browser Profiling

### 1. Chrome DevTools Performance Tab

```typescript
// Start recording programmatically
performance.mark('app-start');

// Your application code
initializeApp();
loadData();
renderUI();

performance.mark('app-ready');
performance.measure('app-startup', 'app-start', 'app-ready');

// View in DevTools Performance tab
console.log(performance.getEntriesByType('measure'));
```

### 2. Long Task API

```typescript
// Detect long tasks (> 50ms) that block main thread
const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        console.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name
        });
    }
});

observer.observe({ entryTypes: ['longtask'] });
```

### 3. Layout Shift Tracking

```typescript
// Track Cumulative Layout Shift (CLS)
let clsScore = 0;

const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
            console.log('Layout shift:', {
                value: (entry as any).value,
                cumulative: clsScore
            });
        }
    }
});

observer.observe({ type: 'layout-shift', buffered: true });
```

### 4. Resource Timing

```typescript
// Monitor resource loading performance
function analyzeResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
        total: resources.length,
        totalSize: 0,
        totalDuration: 0,
        byType: {} as Record<string, { count: number; duration: number; size: number }>
    };
    
    resources.forEach(resource => {
        const type = getResourceType(resource.name);
        
        if (!analysis.byType[type]) {
            analysis.byType[type] = { count: 0, duration: 0, size: 0 };
        }
        
        analysis.byType[type].count++;
        analysis.byType[type].duration += resource.duration;
        analysis.byType[type].size += resource.transferSize || 0;
        
        analysis.totalDuration += resource.duration;
        analysis.totalSize += resource.transferSize || 0;
    });
    
    return analysis;
}

function getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'JavaScript';
    if (url.endsWith('.css')) return 'CSS';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'Image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'Font';
    return 'Other';
}

// Usage
console.table(analyzeResourceTiming());
```

## Node.js Profiling

### 1. CPU Profiling

```typescript
// Generate CPU profile
// Run: node --prof app.js
// Process: node --prof-process isolate-*.log > profile.txt

// Programmatic profiling
import { Session } from 'inspector';

function startProfiling(): () => Promise<any> {
    const session = new Session();
    session.connect();
    
    session.post('Profiler.enable');
    session.post('Profiler.start');
    
    return async () => {
        return new Promise((resolve) => {
            session.post('Profiler.stop', (err, { profile }) => {
                session.disconnect();
                resolve(profile);
            });
        });
    };
}

// Usage
const stopProfiling = startProfiling();

// Your code
await processData();

const profile = await stopProfiling();
console.log(JSON.stringify(profile, null, 2));
```

### 2. Memory Profiling

```typescript
// Take heap snapshot
import v8 from 'v8';
import fs from 'fs';

function takeHeapSnapshot(filename: string): void {
    const snapshot = v8.writeHeapSnapshot(filename);
    console.log(`Heap snapshot written to ${snapshot}`);
}

// Usage
takeHeapSnapshot('./heap-before.heapsnapshot');
await performOperation();
takeHeapSnapshot('./heap-after.heapsnapshot');

// Analyze in Chrome DevTools Memory tab
```

### 3. Event Loop Lag Monitoring

```typescript
// ============================================
// EVENT LOOP LAG MONITOR
// ============================================

class EventLoopMonitor {
    private interval: NodeJS.Timer | null = null;
    private lastCheck: number = Date.now();
    private lags: number[] = [];
    
    start(checkInterval: number = 1000): void {
        this.interval = setInterval(() => {
            const now = Date.now();
            const lag = now - this.lastCheck - checkInterval;
            
            if (lag > 10) { // More than 10ms lag
                this.lags.push(lag);
                console.warn(`Event loop lag: ${lag}ms`);
            }
            
            this.lastCheck = now;
        }, checkInterval);
    }
    
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    
    getStats(): { count: number; max: number; avg: number } {
        if (this.lags.length === 0) {
            return { count: 0, max: 0, avg: 0 };
        }
        
        return {
            count: this.lags.length,
            max: Math.max(...this.lags),
            avg: this.lags.reduce((a, b) => a + b, 0) / this.lags.length
        };
    }
}

// Usage
const monitor = new EventLoopMonitor();
monitor.start();

// Your application runs...

process.on('SIGINT', () => {
    monitor.stop();
    console.log('Event loop lag stats:', monitor.getStats());
    process.exit();
});
```

## Benchmarking

### 1. Simple Benchmark

```typescript
// ============================================
// BENCHMARK UTILITY
// ============================================

async function benchmark(
    fn: () => any,
    iterations: number = 1000
): Promise<BenchmarkResult> {
    const times: number[] = [];
    
    // Warmup
    for (let i = 0; i < 10; i++) {
        await fn();
    }
    
    // Measure
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }
    
    const sorted = times.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
        iterations,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: sum / sorted.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        opsPerSecond: 1000 / (sum / sorted.length)
    };
}

interface BenchmarkResult {
    iterations: number;
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
    opsPerSecond: number;
}

// Usage
const result = await benchmark(() => {
    // Code to benchmark
    return expensiveOperation();
}, 1000);

console.log('Benchmark Results:');
console.log(`  Operations: ${result.iterations}`);
console.log(`  Mean: ${result.mean.toFixed(2)}ms`);
console.log(`  Median: ${result.median.toFixed(2)}ms`);
console.log(`  Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
```

### 2. Comparison Benchmark

```typescript
// ============================================
// COMPARE IMPLEMENTATIONS
// ============================================

async function compare(
    implementations: Record<string, () => any>,
    iterations: number = 1000
): Promise<void> {
    console.log(`Benchmarking ${Object.keys(implementations).length} implementations...`);
    console.log(`Iterations: ${iterations}\n`);
    
    const results: Record<string, BenchmarkResult> = {};
    
    for (const [name, fn] of Object.entries(implementations)) {
        console.log(`Running: ${name}...`);
        results[name] = await benchmark(fn, iterations);
    }
    
    // Sort by mean time
    const sorted = Object.entries(results).sort((a, b) => a[1].mean - b[1].mean);
    
    console.log('\nResults (fastest to slowest):');
    console.log('==============================');
    
    const fastest = sorted[0][1].mean;
    
    sorted.forEach(([name, result], index) => {
        const ratio = result.mean / fastest;
        console.log(`\n${index + 1}. ${name}`);
        console.log(`   Mean: ${result.mean.toFixed(2)}ms`);
        console.log(`   Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
        if (index > 0) {
            console.log(`   ${ratio.toFixed(2)}x slower than fastest`);
        }
    });
}

// Usage
await compare({
    'for-loop': () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
            sum += i;
        }
        return sum;
    },
    'reduce': () => {
        return Array.from({ length: 1000 }, (_, i) => i)
            .reduce((sum, i) => sum + i, 0);
    },
    'forEach': () => {
        let sum = 0;
        Array.from({ length: 1000 }, (_, i) => i)
            .forEach(i => sum += i);
        return sum;
    }
}, 10000);
```

## Memory Profiling

### 1. Memory Usage Tracking

```typescript
// ============================================
// MEMORY TRACKER
// ============================================

class MemoryTracker {
    private samples: MemorySample[] = [];
    private interval: NodeJS.Timer | null = null;
    
    start(sampleInterval: number = 1000): void {
        this.interval = setInterval(() => {
            this.takeSample();
        }, sampleInterval);
    }
    
    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    
    takeSample(): void {
        const usage = process.memoryUsage();
        this.samples.push({
            timestamp: Date.now(),
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            external: usage.external,
            rss: usage.rss
        });
    }
    
    getReport(): MemoryReport {
        if (this.samples.length === 0) {
            throw new Error('No samples collected');
        }
        
        const heapUsed = this.samples.map(s => s.heapUsed);
        const heapTotal = this.samples.map(s => s.heapTotal);
        
        return {
            duration: this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp,
            samples: this.samples.length,
            heapUsed: {
                min: Math.min(...heapUsed) / 1024 / 1024,
                max: Math.max(...heapUsed) / 1024 / 1024,
                avg: heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length / 1024 / 1024
            },
            heapTotal: {
                min: Math.min(...heapTotal) / 1024 / 1024,
                max: Math.max(...heapTotal) / 1024 / 1024,
                avg: heapTotal.reduce((a, b) => a + b, 0) / heapTotal.length / 1024 / 1024
            }
        };
    }
}

interface MemorySample {
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
}

interface MemoryReport {
    duration: number;
    samples: number;
    heapUsed: { min: number; max: number; avg: number };
    heapTotal: { min: number; max: number; avg: number };
}

// Usage
const tracker = new MemoryTracker();
tracker.start(1000);

// Run your application...

setTimeout(() => {
    tracker.stop();
    const report = tracker.getReport();
    console.log('Memory Report:');
    console.log(`  Duration: ${report.duration}ms`);
    console.log(`  Heap Used: ${report.heapUsed.avg.toFixed(2)} MB (avg)`);
    console.log(`  Heap Total: ${report.heapTotal.avg.toFixed(2)} MB (avg)`);
}, 60000);
```

## Real User Monitoring (RUM)

```typescript
// ============================================
// REAL USER MONITORING
// ============================================

class RUMTracker {
    private endpoint: string;
    
    constructor(endpoint: string) {
        this.endpoint = endpoint;
        this.init();
    }
    
    private init(): void {
        // Track page load
        window.addEventListener('load', () => {
            this.trackPageLoad();
        });
        
        // Track navigation timing
        this.trackNavigationTiming();
        
        // Track resource timing
        this.trackResourceTiming();
        
        // Track long tasks
        this.trackLongTasks();
    }
    
    private trackPageLoad(): void {
        const timing = performance.timing;
        
        const metrics = {
            type: 'page-load',
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            dom: timing.domComplete - timing.domLoading,
            load: timing.loadEventEnd - timing.loadEventStart,
            total: timing.loadEventEnd - timing.navigationStart
        };
        
        this.send(metrics);
    }
    
    private trackNavigationTiming(): void {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
            const metrics = {
                type: 'navigation',
                redirectTime: navigation.redirectEnd - navigation.redirectStart,
                dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                connectTime: navigation.connectEnd - navigation.connectStart,
                requestTime: navigation.responseStart - navigation.requestStart,
                responseTime: navigation.responseEnd - navigation.responseStart,
                domInteractive: navigation.domInteractive - navigation.fetchStart,
                domComplete: navigation.domComplete - navigation.fetchStart,
                loadComplete: navigation.loadEventEnd - navigation.fetchStart
            };
            
            this.send(metrics);
        }
    }
    
    private trackResourceTiming(): void {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        
        resources.forEach(resource => {
            this.send({
                type: 'resource',
                name: resource.name,
                duration: resource.duration,
                size: resource.transferSize,
                cached: resource.transferSize === 0
            });
        });
    }
    
    private trackLongTasks(): void {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.send({
                    type: 'long-task',
                    duration: entry.duration,
                    startTime: entry.startTime
                });
            }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
    }
    
    private send(data: any): void {
        // Send to analytics endpoint
        navigator.sendBeacon(this.endpoint, JSON.stringify(data));
    }
}

// Initialize
const rum = new RUMTracker('https://analytics.example.com/rum');
```

## Best Practices

### 1. Profile in Production-Like Environment

```typescript
// ✅ Good: Profile with realistic data
const realData = await loadProductionData();
const result = await benchmark(() => processData(realData), 1000);

// ❌ Bad: Profile with tiny test data
const testData = [1, 2, 3];
const result = await benchmark(() => processData(testData), 1000);
```

### 2. Measure Multiple Times

```typescript
// ✅ Good: Multiple iterations
const results = [];
for (let i = 0; i < 5; i++) {
    results.push(await benchmark(operation, 1000));
}
const avgMean = results.reduce((sum, r) => sum + r.mean, 0) / results.length;

// ❌ Bad: Single measurement
const result = await benchmark(operation, 1);
```

### 3. Include Warmup Phase

```typescript
// ✅ Good: Warmup before measuring
for (let i = 0; i < 100; i++) {
    operation(); // Warmup JIT
}

const result = await benchmark(operation, 1000);

// ❌ Bad: No warmup (includes JIT compilation time)
const result = await benchmark(operation, 1000);
```

## Summary

**Performance measurement and profiling** are essential for optimization:

1. **Measure First**: Identify bottlenecks before optimizing
2. **Use Appropriate Tools**: Browser DevTools, Node profiler, custom monitors
3. **Track Metrics**: CPU, memory, event loop, rendering
4. **Benchmark Consistently**: Multiple iterations, warmup, realistic data
5. **Monitor Production**: Real user monitoring provides real insights
6. **Analyze Results**: Look for patterns, outliers, trends

**Key Takeaway**: Accurate measurement is the foundation of effective optimization. Profile, measure, optimize, repeat.

---

**Next**: Explore [Algorithm Optimization](../02-algorithms.md) for better time and space complexity.
