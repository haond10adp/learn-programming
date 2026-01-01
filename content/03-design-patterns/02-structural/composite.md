# Composite Pattern

> *"Compose objects into tree structures to represent part-whole hierarchies."*  
> — Gang of Four

## What is the Composite Pattern?

The **Composite pattern** lets you treat **individual objects and compositions uniformly**. It creates tree structures where leaves and branches implement the same interface, so you can work with a single item or a collection the same way—like how you can move one file or a whole folder in the same way.

```typescript
// Component interface
interface FileSystemItem {
  getName(): string;
  getSize(): number;
  display(indent: string): void;
}

// Leaf
class File implements FileSystemItem {
  constructor(
    private name: string,
    private size: number
  ) {}
  
  getName() { return this.name; }
  getSize() { return this.size; }
  
  display(indent: string) {
    console.log(`${indent}📄 ${this.name} (${this.size} bytes)`);
  }
}

// Composite
class Folder implements FileSystemItem {
  private items: FileSystemItem[] = [];
  
  constructor(private name: string) {}
  
  add(item: FileSystemItem) {
    this.items.push(item);
  }
  
  getName() { return this.name; }
  
  getSize() {
    return this.items.reduce((sum, item) => sum + item.getSize(), 0);
  }
  
  display(indent: string) {
    console.log(`${indent}📁 ${this.name}`);
    this.items.forEach(item => item.display(indent + '  '));
  }
}

// Usage - treat individual and composite uniformly
const root = new Folder('root');
root.add(new File('readme.txt', 100));

const docs = new Folder('docs');
docs.add(new File('manual.pdf', 5000));
docs.add(new File('guide.md', 200));

root.add(docs);
root.display('');  // Display entire tree
console.log('Total size:', root.getSize());  // Works on whole tree
```

## Why This Matters

Composite is useful when:
- **Tree structures**: Files/folders, UI components, org charts
- **Uniform treatment**: Same operations on individual and group
- **Recursive structures**: Nested hierarchies
- **Part-whole relationships**: Components contain components

## The Philosophy

Think of Composite like a **Russian nesting doll (Matryoshka)**: whether you have one doll or a doll containing other dolls, you can paint them, weigh them, or move them the same way. The interface doesn't change whether it's a single object or a composition.

## Real-World Examples

### UI Component Hierarchy

```typescript
interface UIComponent {
  render(): void;
  onClick?: () => void;
}

// Leaf components
class Button implements UIComponent {
  constructor(private label: string) {}
  
  render() {
    console.log(`<button>${this.label}</button>`);
  }
  
  onClick = () => {
    console.log(`${this.label} clicked`);
  };
}

class Input implements UIComponent {
  constructor(private placeholder: string) {}
  
  render() {
    console.log(`<input placeholder="${this.placeholder}" />`);
  }
}

class Text implements UIComponent {
  constructor(private content: string) {}
  
  render() {
    console.log(`<span>${this.content}</span>`);
  }
}

// Composite component
class Container implements UIComponent {
  private children: UIComponent[] = [];
  
  constructor(private tag: string) {}
  
  add(component: UIComponent) {
    this.children.push(component);
  }
  
  render() {
    console.log(`<${this.tag}>`);
    this.children.forEach(child => child.render());
    console.log(`</${this.tag}>`);
  }
}

// Usage - build tree
const form = new Container('form');
form.add(new Text('Name:'));
form.add(new Input('Enter your name'));
form.add(new Button('Submit'));

const card = new Container('div');
card.add(new Text('User Card'));
card.add(form);

card.render();  // Renders entire tree
```

### Organization Hierarchy

```typescript
interface Employee {
  getName(): string;
  getSalary(): number;
  display(indent: string): void;
}

// Leaf - individual contributor
class IndividualContributor implements Employee {
  constructor(
    private name: string,
    private position: string,
    private salary: number
  ) {}
  
  getName() { return this.name; }
  getSalary() { return this.salary; }
  
  display(indent: string) {
    console.log(`${indent}👤 ${this.name} (${this.position}) - $${this.salary}`);
  }
}

// Composite - manager with team
class Manager implements Employee {
  private team: Employee[] = [];
  
  constructor(
    private name: string,
    private position: string,
    private salary: number
  ) {}
  
  addReport(employee: Employee) {
    this.team.push(employee);
  }
  
  getName() { return this.name; }
  
  getSalary() {
    // Manager's salary + all reports
    const teamSalary = this.team.reduce((sum, emp) => sum + emp.getSalary(), 0);
    return this.salary + teamSalary;
  }
  
  display(indent: string) {
    console.log(`${indent}👔 ${this.name} (${this.position}) - $${this.salary}`);
    console.log(`${indent}  Team:`);
    this.team.forEach(emp => emp.display(indent + '    '));
  }
}

// Usage
const ceo = new Manager('Alice', 'CEO', 200000);

const cto = new Manager('Bob', 'CTO', 150000);
cto.addReport(new IndividualContributor('Charlie', 'Senior Dev', 120000));
cto.addReport(new IndividualContributor('Diana', 'Dev', 90000));

const cfo = new Manager('Eve', 'CFO', 150000);
cfo.addReport(new IndividualContributor('Frank', 'Accountant', 70000));

ceo.addReport(cto);
ceo.addReport(cfo);

ceo.display('');
console.log('Total salary budget:', ceo.getSalary());
```

### Graphic Shapes

```typescript
interface Graphic {
  draw(): void;
  move(x: number, y: number): void;
  getBounds(): { x: number; y: number; width: number; height: number };
}

// Leaf shapes
class Circle implements Graphic {
  constructor(
    private x: number,
    private y: number,
    private radius: number
  ) {}
  
  draw() {
    console.log(`Drawing circle at (${this.x}, ${this.y}), r=${this.radius}`);
  }
  
  move(x: number, y: number) {
    this.x += x;
    this.y += y;
  }
  
  getBounds() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}

class Rectangle implements Graphic {
  constructor(
    private x: number,
    private y: number,
    private width: number,
    private height: number
  ) {}
  
  draw() {
    console.log(`Drawing rectangle at (${this.x}, ${this.y}), ${this.width}x${this.height}`);
  }
  
  move(x: number, y: number) {
    this.x += x;
    this.y += y;
  }
  
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

// Composite group
class GraphicGroup implements Graphic {
  private graphics: Graphic[] = [];
  
  add(graphic: Graphic) {
    this.graphics.push(graphic);
  }
  
  remove(graphic: Graphic) {
    const index = this.graphics.indexOf(graphic);
    if (index !== -1) {
      this.graphics.splice(index, 1);
    }
  }
  
  draw() {
    console.log('Drawing group:');
    this.graphics.forEach(g => g.draw());
  }
  
  move(x: number, y: number) {
    this.graphics.forEach(g => g.move(x, y));
  }
  
  getBounds() {
    if (this.graphics.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const bounds = this.graphics.map(g => g.getBounds());
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}

// Usage - treat individual and group uniformly
const circle = new Circle(10, 10, 5);
const rect = new Rectangle(20, 20, 30, 15);

const group = new GraphicGroup();
group.add(circle);
group.add(rect);

// Group another group
const nested = new GraphicGroup();
nested.add(new Circle(50, 50, 10));
group.add(nested);

group.draw();       // Draw all
group.move(100, 0); // Move all
console.log(group.getBounds());  // Bounds of all
```

## Benefits

1. **Uniform treatment**: Same interface for leaf and composite
2. **Flexible hierarchies**: Easy to add new component types
3. **Recursive operations**: Operations propagate through tree
4. **Simplicity**: Client code doesn't distinguish types

## When to Use

✅ **Use Composite when:**
- Represent part-whole hierarchies
- Need tree structures
- Treat individual and group objects uniformly
- Recursive structures (menus, file systems, UI)

❌ **Don't use Composite when:**
- Flat structure (no hierarchy)
- Operations differ significantly between leaf and composite
- Performance critical (recursive operations can be slow)

## Common Violations

```typescript
// ❌ BAD: Different interfaces
class File {
  getSize() {}
}

class Folder {
  getTotalSize() {}  // Different method!
}

// ✅ GOOD: Same interface
interface Item {
  getSize(): number;
}

class File implements Item {
  getSize() {}
}

class Folder implements Item {
  getSize() {}  // Same method name
}
```

## The Mind-Shift

**Before**: Treat individuals and groups differently  
**After**: Uniform interface, recursive operations

## Summary

**Composite Pattern**:
- Composes objects into tree structures
- Uniform treatment of individual and composite
- Same interface for leaf and composite
- Recursive operations propagate through tree
- Used for hierarchies like files, UI, organizations

**Key insight**: *The Composite pattern enables uniform treatment—when you have tree structures, use composite to treat individual objects and compositions the same way.*

---

**Next**: [Behavioral Patterns - Observer](../../03-behavioral/observer.md)
