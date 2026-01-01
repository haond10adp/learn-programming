# Module 9: Testing

> *"Code without tests is legacy code."*  
> — Michael Feathers

## 🎯 Overview

Testing is not about finding bugs—it's about **confidence**. Tests give you confidence to refactor, confidence to deploy, confidence that your code does what you think it does. Good tests are a safety net that lets you move fast without breaking things.

This module explores testing from unit tests to integration tests, revealing patterns that make tests maintainable, reliable, and valuable.

## 🌟 Why This Module is Beautiful AND Lifechanging

### The Beauty
- **Tests as specifications**: Tests document what code should do
- **Refactoring fearlessly**: Change anything, tests catch regressions
- **Fast feedback**: Know immediately if something breaks
- **Type-guided testing**: TypeScript reduces the tests you need

### The Life-Changing Insight

Once you master testing, development transforms:

1. **Before**: "I hope this change didn't break anything"
2. **After**: "Tests pass—I know this change is safe"

You shift from *fear of change* to *confidence in change*. This is the difference between legacy code and maintainable code.

## 📚 What You'll Learn

1. **Testing Fundamentals** — Why test, what to test, test pyramid
2. **Unit Testing** — Testing functions and classes in isolation
3. **Integration Testing** — Testing components working together
4. **Mocking & Stubbing** — Isolating code under test
5. **Test-Driven Development** — Writing tests first
6. **Testing Patterns** — Arrange-Act-Assert, Given-When-Then
7. **Property-Based Testing** — Generating test cases automatically
8. **Testing Async Code** — Promises, timeouts, and event loops

## 🗺️ Topics

[01. Testing Fundamentals](fundamentals)
- Why test?
- The testing pyramid
- Unit vs integration vs E2E
- What makes a good test?
- Test coverage myths

[02. Unit Testing Basics](unit-testing)
- Vitest fundamentals
- Assertions and matchers
- Arrange-Act-Assert pattern
- Testing pure functions
- Test organization

[03. Testing Classes and Objects](testing-classes)
- Testing state changes
- Testing interactions
- Spies and mocks
- Testing private methods (don't!)
- Testing constructors

[04. Mocking and Stubbing](mocking)
- Test doubles (mock, stub, spy, fake)
- When to mock
- Mocking modules
- Mocking timers and dates
- Mocking network requests

[05. Testing Async Code](async-testing)
- Testing Promises
- Testing async/await
- Testing callbacks
- Testing timeouts
- Testing event emitters

[06. Integration Testing](integration-testing)
- Testing multiple modules
- Database testing
- API testing
- Testing side effects
- Test databases and fixtures

[07. Test-Driven Development](tdd)
- Red-Green-Refactor cycle
- Writing tests first
- Emergent design
- TDD benefits and challenges
- When to use TDD

[08. Advanced Patterns](advanced-patterns)
- Property-based testing
- Parametrized tests
- Test builders and fixtures
- Testing edge cases
- Mutation testing

### [Mini-Project: Tested Library](project/)
Build a utility library using TDD with comprehensive unit and integration tests.

## ⏱️ Time Estimate

- **Reading**: 5 hours
- **Examples**: 5 hours
- **Exercises**: 7 hours
- **Project**: 5 hours
- **Total**: ~22 hours

## 🎓 Prerequisites

- All previous modules (especially types and OOP)
- Vitest basics (covered in setup)
- Understanding of async programming

## 🚀 Getting Started

1. Ensure Vitest is installed: `npm install`
2. Read topics in order
3. Run examples: `npm test 09-testing/02-unit-testing/examples.test.ts`
4. Complete exercises using TDD
5. Build the project with full test coverage

## 💡 Key Takeaways

By the end of this module, you'll understand:

- ✅ Tests are specifications, not just bug-finders
- ✅ The testing pyramid guides what to test
- ✅ Unit tests should be fast and isolated
- ✅ Mocking should be used sparingly
- ✅ TDD can improve design
- ✅ Good tests enable refactoring
- ✅ Test coverage is not a goal—confidence is

## 🌍 AI-Era Relevance

### What AI Generates
- Basic test scaffolding
- Simple test cases
- Common assertions
- Standard mocking patterns

### What You Need to Know
- **Review test quality**: Do tests actually verify behavior?
- **Design test cases**: What edge cases exist?
- **Choose test types**: Unit, integration, or E2E?
- **Evaluate coverage**: Are critical paths tested?
- **Refactor tests**: Are tests maintainable and clear?

AI can generate tests, but **YOU design the test strategy**.

## The Testing Pyramid

```
        /\
       /E2E\      <- Few: Slow, brittle, expensive
      /------\
     /Integra-\   <- Some: Medium speed, test interactions
    /----------\
   / Unit Tests \  <- Many: Fast, isolated, cheap
  /--------------\
```

### Unit Tests (Many)
- Test single functions/classes
- Fast (milliseconds)
- Isolated (no I/O)
- Easy to write and maintain

### Integration Tests (Some)
- Test modules working together
- Medium speed (seconds)
- Some I/O (database, filesystem)
- Test realistic scenarios

### E2E Tests (Few)
- Test entire system
- Slow (seconds to minutes)
- Full stack (UI, API, database)
- Test critical user flows

**Balance**: Most tests should be unit tests. Integration tests for key interactions. E2E tests for critical paths only.

## What Makes a Good Test?

### FIRST Principles

**F**ast — Runs in milliseconds  
**I**solated — Independent of other tests  
**R**epeatable — Same result every time  
**S**elf-validating — Pass/fail is clear  
**T**imely — Written with (or before) the code

### Good Test Properties

1. **Readable**: Test is clear documentation
2. **Single concept**: Tests one thing
3. **Resilient**: Doesn't break on refactoring
4. **Meaningful failures**: Failures point to the problem
5. **No logic**: Tests are simple assertions

## Arrange-Act-Assert Pattern

Every test should follow this structure:

```typescript
test('should calculate total with discount', () => {
  // Arrange: Set up test data
  const cart = new ShoppingCart();
  cart.add(new Item('Widget', 10));
  const discount = new PercentageDiscount(10);

  // Act: Execute the operation
  const total = cart.calculateTotal(discount);

  // Assert: Verify the result
  expect(total).toBe(9);
});
```

Clear separation makes tests easy to understand.

## Common Testing Anti-Patterns

### 1. Testing Implementation Details
```typescript
// ❌ Bad: Testing internals
test('should call helper method', () => {
  const spy = vi.spyOn(service, 'helperMethod');
  service.doSomething();
  expect(spy).toHaveBeenCalled();
});

// ✅ Good: Testing behavior
test('should return processed result', () => {
  const result = service.doSomething();
  expect(result).toBe('processed');
});
```

### 2. Overmocking
```typescript
// ❌ Bad: Mocking everything
test('should add numbers', () => {
  const mockAdd = vi.fn(() => 5);
  expect(mockAdd(2, 3)).toBe(5);
  // You're testing the mock, not the real code!
});

// ✅ Good: Test the real thing
test('should add numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

### 3. One Giant Test
```typescript
// ❌ Bad: Testing everything
test('user service works', () => {
  // 100 lines of setup and assertions...
});

// ✅ Good: Focused tests
test('should create user', () => { /* ... */ });
test('should update user', () => { /* ... */ });
test('should delete user', () => { /* ... */ });
```

### 4. Fragile Assertions
```typescript
// ❌ Bad: Brittle assertion
test('should return user', () => {
  const user = getUser(1);
  expect(user).toEqual({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    lastLogin: expect.any(Date),
    // ... 20 more fields
  });
});

// ✅ Good: Focused assertion
test('should return user with correct name', () => {
  const user = getUser(1);
  expect(user.name).toBe('Alice');
});
```

### 5. Test Interdependence
```typescript
// ❌ Bad: Tests depend on order
let sharedState: any;

test('first test', () => {
  sharedState = createThing();
});

test('second test', () => {
  expect(sharedState).toBeDefined(); // Breaks if run alone!
});

// ✅ Good: Independent tests
test('first test', () => {
  const state = createThing();
  expect(state).toBeDefined();
});

test('second test', () => {
  const state = createThing();
  expect(state).toBeDefined();
});
```

## Test-Driven Development (TDD)

### The Red-Green-Refactor Cycle

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

### Example

```typescript
// 1. RED: Write failing test
test('should reverse string', () => {
  expect(reverse('hello')).toBe('olleh');
});

// 2. GREEN: Simplest implementation
function reverse(str: string): string {
  return str.split('').reverse().join('');
}

// 3. REFACTOR: Improve (if needed)
function reverse(str: string): string {
  return [...str].reverse().join('');
}
```

### Benefits of TDD

- ✅ Tests guide design
- ✅ High test coverage naturally
- ✅ Prevents overengineering
- ✅ Tests are always up to date
- ✅ Reduces debugging time

### When Not to TDD

- ❌ Exploratory coding (prototyping)
- ❌ Trivial functions (getters/setters)
- ❌ Learning new tech (experiment first)
- ❌ Performance-critical code (profile first)

## TypeScript and Testing

TypeScript **reduces the need for some tests**:

```typescript
// Don't need tests for:
function add(a: number, b: number): number {
  return a + b;
}

// TypeScript ensures:
// ✅ Parameters are numbers
// ✅ Return type is number
// ✅ Can't pass strings accidentally

// Still need tests for:
// ✅ Logic correctness (does it actually add?)
// ✅ Edge cases (Infinity, NaN, large numbers)
// ✅ Business rules (should negative numbers be allowed?)
```

**Type checking ≠ Correctness testing**, but it eliminates whole classes of bugs.

## Coverage Myths

### Myth: 100% Coverage = Bug-Free Code

```typescript
function divide(a: number, b: number): number {
  return a / b; // 100% coverage, but doesn't handle division by zero!
}

test('should divide numbers', () => {
  expect(divide(10, 2)).toBe(5); // Covers the line, but not the edge case
});
```

**Truth**: Coverage measures what's **executed**, not what's **correct**.

### Myth: Low Coverage = Bad Code

Some code doesn't need tests:
- Type definitions
- Simple getters/setters
- Framework glue code
- Configuration files

**Truth**: Test what matters, not everything.

### The Right Approach

- Use coverage to find **untested areas**
- Focus on **critical paths**
- Test **business logic** thoroughly
- Accept gaps in trivial code

## The Beauty of Well-Tested Code

Consider this progression:

**No tests:**
```typescript
// Change anything = hope and pray
function processPayment(amount: number, userId: number) {
  // 50 lines of complex logic
}
```

**With tests:**
```typescript
describe('processPayment', () => {
  test('should process valid payment', () => { /* ... */ });
  test('should reject negative amounts', () => { /* ... */ });
  test('should handle insufficient funds', () => { /* ... */ });
  test('should retry on network failure', () => { /* ... */ });
  test('should log successful payments', () => { /* ... */ });
});

// Now you can refactor fearlessly!
```

Tests create a **safety net**. This is beautiful because it enables **sustainable development**.

## The Mind-Shift

**Before understanding testing:**
- "Tests slow me down"
- "I'll test manually"
- "Tests are boring"

**After understanding testing:**
- "Tests speed me up (by catching bugs early)"
- "Manual testing doesn't scale"
- "Tests are design tools"
- "I can refactor without fear"

This is lifechanging because tests transform how you approach development—from fear-driven to confidence-driven.

## 📚 Further Reading

- *Test-Driven Development* by Kent Beck — The TDD bible
- *Growing Object-Oriented Software, Guided by Tests* — Advanced TDD
- [Vitest Documentation](https://vitest.dev/) — Our testing framework
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**Next**: [01. Testing Fundamentals](01-fundamentals.md)
