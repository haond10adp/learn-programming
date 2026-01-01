# Module 3: Design Patterns

> *"Each pattern describes a problem which occurs over and over again in our environment, and then describes the core of the solution to that problem, in such a way that you can use this solution a million times over, without ever doing it the same way twice."*  
> — Christopher Alexander

## 🎯 Overview

Design patterns are **recurring solutions to common problems** in software design. They're not finished code you can copy-paste; they're templates, philosophies, and ways of thinking about problems.

## 🌟 Why Patterns Are Beautiful AND Lifechanging

### The Beauty

Design patterns reveal **deep truths about software structure**:

- **Observer Pattern**: Change propagates automatically—data and views stay synchronized as if by magic
- **Strategy Pattern**: Algorithms become interchangeable parts—behavior becomes data
- **Decorator Pattern**: Responsibilities stack like mathematical composition—`f(g(h(x)))`
- **Iterator Pattern**: Abstraction over traversal—the "how" separates from the "what"

These aren't just coding tricks. They're **fundamental insights** about:
- How responsibilities should be divided
- How objects should relate to each other  
- How to make change easy
- How to build systems that grow gracefully

### The Lifechanging Insight

Once you learn patterns, you'll see them **everywhere**:
- In libraries you use daily (React Hooks = Observer, Express middleware = Chain of Responsibility)
- In the architecture of successful systems
- In nature and human organizations (patterns are universal!)

You'll stop thinking "how do I code this?" and start thinking "which pattern fits this problem?"

**The transformation**: You move from *inventing solutions* to *selecting proven patterns*, from *struggling* to *recognizing*.

## 📚 Patterns We'll Cover

### Creational Patterns (Object Creation)
- **[Singleton](creational/singleton)** — Ensure only one instance exists
- **[Factory Method](creational/factory)** — Delegate object creation to subclasses
- **[Abstract Factory](creational/abstract-factory)** — Create families of related objects
- **[Builder](creational/builder)** — Construct complex objects step by step
- **[Prototype](creational/prototype)** — Clone existing objects

### Structural Patterns (Object Composition)
- **[Adapter](structural/adapter)** — Make incompatible interfaces work together
- **[Decorator](structural/decorator)** — Add responsibilities dynamically
- **[Facade](structural/facade)** — Provide simple interface to complex system
- **[Proxy](structural/proxy)** — Control access to an object
- **[Composite](structural/composite)** — Treat individual objects and compositions uniformly

### Behavioral Patterns (Object Interaction)
- **[Observer](behavioral/observer)** — Notify multiple objects of state changes
- **[Strategy](behavioral/strategy)** — Make algorithms interchangeable
- **[Command](behavioral/command)** — Encapsulate requests as objects
- **[State](behavioral/state)** — Change behavior when internal state changes
- **[Chain of Responsibility](behavioral/chain)** — Pass requests along a chain of handlers

## 🎨 Pattern Structure

Each pattern includes:
1. **Intent**: What problem does it solve?
2. **Motivation**: Why would you use it?
3. **Structure**: What does it look like?
4. **Implementation**: TypeScript examples
5. **When to Use**: Guidelines and trade-offs
6. **Real-World Examples**: Where you've seen it
7. **Pitfalls**: Common mistakes
8. **AI-Era Considerations**: Reviewing generated patterns

## ⏱️ Time Estimate

- **Reading**: 8 hours
- **Examples**: 5 hours  
- **Exercises**: 5 hours
- **Project**: 2 hours
- **Total**: ~20 hours

## 💡 Why Patterns Matter (Especially Now)

### The Problem with "Vibe Coding"

AI can generate code, but **patterns require judgment**:
- Which pattern fits this problem?
- What are the trade-offs?
- How will this decision affect future changes?
- Is this over-engineered for the use case?

### What AI Generates
- Standard pattern implementations
- Common examples from training data
- Syntactically correct code

### What You Provide
- **Pattern selection**: Choosing the right abstraction
- **Context awareness**: Knowing when NOT to use a pattern
- **Trade-off evaluation**: Complexity vs flexibility vs performance
- **Architecture vision**: How patterns fit into the larger system

### The Synergy

```
Your Pattern Knowledge + AI Implementation = Elegant, Maintainable Systems
```

You're the architect who chooses patterns. AI is the builder who implements them.

## 🌍 Real-World Impact

**Before patterns**:
- Reinvent solutions to solved problems
- Create inconsistent architectures
- Struggle to communicate design intent
- Build systems hard to extend

**After patterns**:
- Recognize problems and apply proven solutions
- Build consistent, predictable systems
- Use shared vocabulary ("This is an Observer")
- Design for change from the start

## 🎯 Learning Approach

1. **Understand the problem** each pattern solves
2. **Study the structure** and relationships
3. **See implementations** in TypeScript
4. **Recognize patterns** in libraries you use
5. **Practice** applying them to new problems
6. **Learn when NOT to use** each pattern

**Critical**: Patterns are tools, not rules. Sometimes the simplest solution is best.

## 📖 Pattern Catalog Overview

### When to Use Each Category

**Creational** → Control object creation complexity
- Multiple ways to create objects
- Complex construction logic
- Need to abstract the creation process

**Structural** → Organize relationships between objects
- Compose objects into larger structures
- Provide alternative interfaces
- Control access or add functionality

**Behavioral** → Define communication between objects
- Distribute responsibilities
- Handle algorithms and interactions
- Manage state and behavior changes

## 🔑 Core Principles Behind Patterns

All patterns embody these principles:

1. **Program to interfaces, not implementations**
2. **Favor composition over inheritance**
3. **Encapsulate what varies**
4. **Depend on abstractions, not concretions**
5. **Open for extension, closed for modification**

These principles reappear across all patterns. Learn them once, apply them everywhere.

## 🚀 Getting Started

Start with these "essential five" that appear constantly:

1. **Factory Method** — Object creation
2. **Observer** — Event handling
3. **Strategy** — Algorithm swapping
4. **Decorator** — Adding features
5. **Adapter** — Interface compatibility

Once you master these, the others will feel familiar.

## 🎓 Mini-Project: Plugin System

At the end of this module, you'll build an **extensible plugin system** that combines multiple patterns:
- **Factory** for plugin creation
- **Observer** for event notifications
- **Strategy** for plugin behaviors
- **Decorator** for plugin composition
- **Facade** for simple API

This demonstrates how patterns work together in real systems.

## 📚 Further Reading

- *Design Patterns: Elements of Reusable Object-Oriented Software* (Gang of Four)
- *Head First Design Patterns*
- [Refactoring.Guru](https://refactoring.guru/design-patterns)

---

**Next**: [Creational Patterns](01-creational/) — Master object creation
