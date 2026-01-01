# Async Iteration

> *"Iterate over async data as if it were synchronous."*

## What Is It?

**Async iteration** allows you to iterate over asynchronous data sources using `for await...of` loops. It's perfect for streaming data, paginated APIs, or any sequence of values that arrive over time.

```typescript
async function* generateNumbers() {
  yield 1;
  await delay(1000);
  yield 2;
  await delay(1000);
  yield 3;
}

for await (const num of generateNumbers()) {
  console.log(num); // 1... 2... 3... (with delays)
}
```

## Why This Is Beautiful

Async iteration creates **natural streaming**:
- Iterate over async sequences
- Backpressure handling built-in
- Clean syntax with for await
- Lazy evaluation

When async iteration is used, streaming data becomes as simple as iterating an array.

## Async Generators

Functions that use `async function*`:

```typescript
async function* fetchPages() {
  let page = 1;
  
  while (true) {
    const response = await fetch(`/api/data?page=${page}`);
    const data = await response.json();
    
    if (data.length === 0) break;
    
    yield data;
    page++;
  }
}

// Consume
for await (const page of fetchPages()) {
  console.log('Page:', page);
}
```

**Key**: Each `yield` produces one value, execution pauses until next iteration.

## for await...of

```typescript
async function processStream() {
  const stream = fetchDataStream();
  
  for await (const chunk of stream) {
    console.log('Received:', chunk);
    await processChunk(chunk);
  }
  
  console.log('Stream complete');
}
```

Works with:
- Async generators
- Objects with `Symbol.asyncIterator`
- Readable streams (Node.js, Browser)

## Async Iterable Interface

```typescript
interface AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

interface AsyncIterator<T> {
  next(): Promise<IteratorResult<T>>;
  return?(value?: any): Promise<IteratorResult<T>>;
  throw?(error: any): Promise<IteratorResult<T>>;
}

interface IteratorResult<T> {
  done: boolean;
  value: T;
}
```

## Custom Async Iterable

```typescript
class PaginatedAPI<T> implements AsyncIterable<T[]> {
  constructor(
    private baseUrl: string,
    private pageSize: number
  ) {}
  
  async *[Symbol.asyncIterator](): AsyncIterator<T[]> {
    let page = 1;
    
    while (true) {
      const response = await fetch(
        `${this.baseUrl}?page=${page}&size=${this.pageSize}`
      );
      const data: T[] = await response.json();
      
      if (data.length === 0) break;
      
      yield data;
      page++;
    }
  }
}

// Use it
const api = new PaginatedAPI<User>('/api/users', 10);

for await (const users of api) {
  console.log(`Batch of ${users.length} users`);
}
```

## Async Generator Functions

### Basic Example

```typescript
async function* countdown(from: number) {
  for (let i = from; i >= 0; i--) {
    await delay(1000);
    yield i;
  }
}

for await (const num of countdown(5)) {
  console.log(num); // 5... 4... 3... 2... 1... 0
}
```

### With Parameters

```typescript
async function* range(start: number, end: number, step: number = 1) {
  for (let i = start; i <= end; i += step) {
    await delay(100);
    yield i;
  }
}

for await (const num of range(0, 10, 2)) {
  console.log(num); // 0, 2, 4, 6, 8, 10
}
```

### Infinite Streams

```typescript
async function* ticker(interval: number) {
  let count = 0;
  
  while (true) {
    await delay(interval);
    yield count++;
  }
}

// Use with break to stop
for await (const tick of ticker(1000)) {
  console.log(tick);
  
  if (tick >= 5) break; // Stop after 5 ticks
}
```

## Real-World Example: File Processing

```typescript
async function* readFileLines(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  const reader = fileStream.getReader();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer) yield buffer;
        break;
      }
      
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        yield line;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Process large file line by line
for await (const line of readFileLines('huge-file.txt')) {
  await processLine(line);
}
```

## Node.js Streams

```typescript
import { Readable } from 'stream';

// Node.js streams are async iterables
const stream = fs.createReadStream('file.txt');

for await (const chunk of stream) {
  console.log('Chunk:', chunk.toString());
}
```

### Pipeline with Async Iteration

```typescript
async function* transformStream<T, R>(
  source: AsyncIterable<T>,
  transform: (item: T) => R
): AsyncGenerator<R> {
  for await (const item of source) {
    yield transform(item);
  }
}

async function* filterStream<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean
): AsyncGenerator<T> {
  for await (const item of source) {
    if (predicate(item)) {
      yield item;
    }
  }
}

// Use it
const numbers = asyncRange(1, 100);
const doubled = transformStream(numbers, x => x * 2);
const evens = filterStream(doubled, x => x % 2 === 0);

for await (const num of evens) {
  console.log(num);
}
```

## Async Iterators with AbortSignal

```typescript
async function* fetchWithCancel(
  urls: string[],
  signal: AbortSignal
): AsyncGenerator<Response> {
  for (const url of urls) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    
    const response = await fetch(url, { signal });
    yield response;
  }
}

// Use it
const controller = new AbortController();

try {
  for await (const response of fetchWithCancel(urls, controller.signal)) {
    console.log(response);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Cancelled');
  }
}

// Cancel
controller.abort();
```

## Error Handling

```typescript
async function* generateWithErrors() {
  yield 1;
  yield 2;
  throw new Error('Oops!');
  yield 3; // Never reached
}

try {
  for await (const num of generateWithErrors()) {
    console.log(num); // 1, 2
  }
} catch (error) {
  console.error('Caught:', error); // Error: Oops!
}
```

### Try-Catch Inside Generator

```typescript
async function* resilientGenerator() {
  for (let i = 0; i < 10; i++) {
    try {
      const data = await fetchData(i);
      yield data;
    } catch (error) {
      console.error(`Failed for ${i}:`, error);
      // Continue to next iteration
    }
  }
}
```

## Backpressure

Async iteration naturally handles backpressure:

```typescript
async function* produceData() {
  for (let i = 0; i < 1000; i++) {
    console.log('Producing:', i);
    yield i;
  }
}

// Consumer controls pace
for await (const data of produceData()) {
  console.log('Consuming:', data);
  await delay(100); // Slow consumer
  // Producer waits for consumer!
}
```

**Key**: Generator pauses at `yield` until next iteration requested.

## Combining Multiple Streams

```typescript
async function* merge<T>(...streams: AsyncIterable<T>[]): AsyncGenerator<T> {
  const iterators = streams.map(s => s[Symbol.asyncIterator]());
  const promises = iterators.map((it, index) => 
    it.next().then(result => ({ result, index }))
  );
  
  while (promises.length > 0) {
    const { result, index } = await Promise.race(promises);
    
    if (result.done) {
      promises.splice(index, 1);
      iterators.splice(index, 1);
    } else {
      yield result.value;
      promises[index] = iterators[index]
        .next()
        .then(result => ({ result, index }));
    }
  }
}

// Use it
const stream1 = asyncRange(0, 5);
const stream2 = asyncRange(10, 15);

for await (const num of merge(stream1, stream2)) {
  console.log(num); // Interleaved: 0, 10, 1, 11, ...
}
```

## Buffering

```typescript
async function* buffer<T>(
  source: AsyncIterable<T>,
  size: number
): AsyncGenerator<T[]> {
  let batch: T[] = [];
  
  for await (const item of source) {
    batch.push(item);
    
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }
  
  if (batch.length > 0) {
    yield batch; // Remaining items
  }
}

// Use it
const numbers = asyncRange(1, 100);
const batches = buffer(numbers, 10);

for await (const batch of batches) {
  console.log('Batch:', batch); // [1..10], [11..20], ...
}
```

## Async Iteration Helpers

### take

```typescript
async function* take<T>(
  source: AsyncIterable<T>,
  count: number
): AsyncGenerator<T> {
  let taken = 0;
  
  for await (const item of source) {
    if (taken >= count) break;
    yield item;
    taken++;
  }
}

// Take first 5 items
for await (const num of take(infiniteStream, 5)) {
  console.log(num);
}
```

### map

```typescript
async function* map<T, R>(
  source: AsyncIterable<T>,
  fn: (item: T) => R | Promise<R>
): AsyncGenerator<R> {
  for await (const item of source) {
    yield await fn(item);
  }
}

// Double all numbers
const doubled = map(numbers, x => x * 2);
```

### filter

```typescript
async function* filter<T>(
  source: AsyncIterable<T>,
  predicate: (item: T) => boolean | Promise<boolean>
): AsyncGenerator<T> {
  for await (const item of source) {
    if (await predicate(item)) {
      yield item;
    }
  }
}

// Only even numbers
const evens = filter(numbers, x => x % 2 === 0);
```

### reduce

```typescript
async function reduce<T, R>(
  source: AsyncIterable<T>,
  reducer: (acc: R, item: T) => R | Promise<R>,
  initial: R
): Promise<R> {
  let accumulator = initial;
  
  for await (const item of source) {
    accumulator = await reducer(accumulator, item);
  }
  
  return accumulator;
}

// Sum all numbers
const sum = await reduce(numbers, (acc, x) => acc + x, 0);
```

## Real-World: Event Stream

```typescript
async function* eventStream<T>(
  eventEmitter: EventEmitter,
  eventName: string
): AsyncGenerator<T> {
  const queue: T[] = [];
  const resolvers: Array<() => void> = [];
  let done = false;
  
  const onData = (data: T) => {
    if (resolvers.length > 0) {
      resolvers.shift()!();
    }
    queue.push(data);
  };
  
  const onEnd = () => {
    done = true;
    resolvers.forEach(resolve => resolve());
  };
  
  eventEmitter.on(eventName, onData);
  eventEmitter.on('end', onEnd);
  
  try {
    while (true) {
      while (queue.length > 0) {
        yield queue.shift()!;
      }
      
      if (done) break;
      
      await new Promise<void>(resolve => {
        resolvers.push(resolve);
      });
    }
  } finally {
    eventEmitter.off(eventName, onData);
    eventEmitter.off('end', onEnd);
  }
}

// Use it
const events = eventStream<Message>(socket, 'message');

for await (const message of events) {
  await handleMessage(message);
}
```

## The Mind-Shift

**Before async iteration:**
- Manual event handling
- Complex buffering logic
- Callback-based streaming

**After async iteration:**
- Natural loop syntax
- Built-in backpressure
- Composable stream operations

## Benefits

1. **Natural**: Loop syntax for async data
2. **Backpressure**: Automatic flow control
3. **Lazy**: Values generated on demand
4. **Composable**: Easy to chain operations
5. **Clean**: No callback spaghetti

## AI-Era Relevance

### What AI Does
- Uses callbacks for streaming
- Forgets backpressure
- Doesn't use async generators

### What You Must Do
- **Identify**: Streaming use cases
- **Use**: Async generators
- **Compose**: Chain transformations
- **Guide**: Prompt for async iteration

## Summary

**Async Iteration**:
- `async function*` creates generators
- `for await...of` consumes them
- Perfect for streaming, pagination
- Built-in backpressure handling
- Composable with helper functions

**Key insight**: *Treat asynchronous sequences like synchronous arrays with for await...of.*

---

**Next**: [Advanced Patterns](../08-advanced-patterns.md)
