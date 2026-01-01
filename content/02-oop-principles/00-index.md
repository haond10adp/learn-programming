# Module 2: Object-Oriented Programming

> *"Tell, don't ask."*  
> — The Law of Demeter

## 🎯 Overview

Object-Oriented Programming (OOP) is not about classes and inheritance—it's about **modeling the world as interacting objects**. When done well, OOP creates code that mirrors reality so closely that it becomes self-documenting.

This module explores OOP from first principles: what makes a good object, how objects should interact, and why certain patterns emerge naturally from these principles.

## 🌟 Why This Module is Beautiful AND Lifechanging

### The Beauty
- **Objects model reality**: Your code mirrors the domain
- **Encapsulation hides complexity**: Interfaces are simple, implementations can be complex
- **Polymorphism enables extension**: New behavior without changing existing code
- **Composition creates emergence**: Simple objects combine into complex systems

### The Life-Changing Insight

Once you understand OOP principles, you'll never write "bag of functions" code again:

1. **Before**: "I need a function that does X"
2. **After**: "I need an object that knows how to X itself"

You shift from *procedural thinking* (what functions do I need?) to *object thinking* (what objects exist and how do they collaborate?).

This fundamentally changes how you design software—from bottom-up implementation to top-down modeling.

## 📚 What You'll Learn

1. **SOLID Principles** — The five pillars of good OOP design
2. **Encapsulation & Information Hiding** — What to expose, what to hide
3. **Inheritance vs Composition** — When to use each (spoiler: composition wins)
4. **Polymorphism** — The power of substitutability
5. **Domain Modeling** — Designing objects that match reality

## 🗺️ Topics

[01. Single Responsibility Principle](single-responsibility)
- What is a "responsibility"?
- Cohesion vs coupling
- How to identify responsibilities
- When to split classes

[02. Open/Closed Principle](open-closed)
- Open for extension, closed for modification
- The power of abstraction
- Strategy pattern naturally emerges
- Plugin architectures

[03. Liskov Substitution Principle](liskov-substitution)
- Subtypes must be substitutable
- Contravariance and covariance
- Design by contract
- When inheritance breaks

[04. Interface Segregation Principle](interface-segregation)
- Many specific interfaces > one general interface
- Role interfaces
- Fat interfaces are code smells
- Client-driven design

[05. Dependency Inversion Principle](dependency-inversion)
- Depend on abstractions, not concretions
- Inversion of Control (IoC)
- Dependency Injection patterns
- Testability and flexibility

[06. Composition Over Inheritance](composition)
- Why inheritance is overused
- The fragile base class problem
- Mixins and traits
- Building with components

[07. Encapsulation Deep Dive](encapsulation)
- Public vs private vs protected
- Law of Demeter
- Tell, don't ask
- Designing good interfaces

[08. Polymorphism Patterns](polymorphism)
- Runtime polymorphism (inheritance)
- Compile-time polymorphism (generics)
- Duck typing in TypeScript
- When to use which

## ⏱️ Time Estimate

- **Reading**: 6 hours
- **Examples**: 4 hours
- **Exercises**: 6 hours
- **Total**: ~16 hours

## 🎓 Prerequisites

- Module 1 (Type Systems) completed
- Understanding of classes and interfaces in TypeScript
- Basic JavaScript knowledge

## 🚀 Getting Started

1. Read topics in order—each builds on the previous
2. Run examples: `npx tsx 02-oop-principles/01-single-responsibility/examples.ts`
3. Complete exercises to internalize principles

## 💡 Key Takeaways

By the end of this module, you'll understand:

- ✅ SOLID principles are not rules—they're heuristics for good design
- ✅ Composition is almost always better than inheritance
- ✅ Good OOP makes code self-documenting
- ✅ Objects should model domain concepts, not technical concepts
- ✅ The best code is code that mirrors reality

## 🌍 AI-Era Relevance

### What AI Generates
- Basic class definitions
- Simple inheritance hierarchies
- Standard getters/setters
- Common patterns (singleton, factory)

### What You Need to Know
- **Review designs**: Does the AI-generated class have a single responsibility?
- **Refactor violations**: Is inheritance being misused? Should it be composition?
- **Design interfaces**: What should be public vs private?
- **Model domains**: What objects exist in your problem space?
- **Recognize smells**: Is the code violating SOLID principles?

AI can generate classes, but **YOU design the object model**. Understanding OOP principles is what separates good design from bad.

## The Eternal Question: When to Use OOP?

### Use OOP When:
- ✅ Modeling real-world entities (User, Order, Product)
- ✅ State and behavior are tightly coupled
- ✅ Polymorphism simplifies the design
- ✅ The domain is complex and needs structure

### Don't Force OOP When:
- ❌ Simple functions suffice
- ❌ Data transformation pipelines (use FP)
- ❌ Pure algorithms (use functions)
- ❌ The "objects" are just data bags

Remember: **OOP is a tool, not a religion**. Use it when it makes the code clearer, not because you're "supposed to".

## Historical Context

OOP emerged in the 1960s (Simula), popularized in the 1980s-90s (C++, Java), and has been evolving ever since:

- **1960s-70s**: Birth (Simula, Smalltalk)
- **1980s-90s**: Dominance (C++, Java, Design Patterns book)
- **2000s**: Enterprise Java, heavyweight frameworks
- **2010s**: Reaction—FP becomes popular again
- **2020s**: Pragmatism—use the right tool for the job

We're past the "OOP vs FP" wars. Modern developers understand both and use each appropriately.

## The Beauty of Well-Designed Objects

Consider this example:

```typescript
// ❌ Procedural, unclear
function calculateTotal(items: Item[], discountCode: string): number {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  
  if (discountCode === 'SAVE10') {
    total *= 0.9;
  }
  
  return total;
}

// ✅ OOP, clear domain model
class ShoppingCart {
  constructor(private items: Item[]) {}
  
  calculateTotal(discount: DiscountStrategy): Money {
    const subtotal = this.items
      .map(item => item.price.multiply(item.quantity))
      .reduce((a, b) => a.add(b), Money.zero());
    
    return discount.apply(subtotal);
  }
}

interface DiscountStrategy {
  apply(amount: Money): Money;
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private percent: number) {}
  
  apply(amount: Money): Money {
    return amount.multiply(1 - this.percent / 100);
  }
}
```

The OOP version:
- Models the domain (Cart, Item, Money, Discount)
- Extensible (add new discount types easily)
- Testable (mock discount strategy)
- Self-documenting (the code reads like prose)

This is beautiful.

## 📚 Further Reading

- *Design Patterns* by Gang of Four — The classic
- *Clean Code* by Robert C. Martin — Chapter on objects
- *Domain-Driven Design* by Eric Evans — Modeling complex domains
- *Practical Object-Oriented Design* by Sandi Metz — Ruby but principles apply

---

**Next**: [01. Single Responsibility Principle](01-single-responsibility.md)
