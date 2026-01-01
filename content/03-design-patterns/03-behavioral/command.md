# Command Pattern

> *"Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations."*  
> — Gang of Four

## What is the Command Pattern?

The **Command pattern** turns requests into **standalone objects** containing all information about the request. This lets you pass requests as method arguments, delay execution, queue operations, and implement undo/redo—like a remote control where each button is a command object.

```typescript
// Command interface
interface Command {
  execute(): void;
  undo(): void;
}

// Receiver
class Light {
  on() { console.log('Light is ON'); }
  off() { console.log('Light is OFF'); }
}

// Concrete commands
class LightOnCommand implements Command {
  constructor(private light: Light) {}
  
  execute() {
    this.light.on();
  }
  
  undo() {
    this.light.off();
  }
}

class LightOffCommand implements Command {
  constructor(private light: Light) {}
  
  execute() {
    this.light.off();
  }
  
  undo() {
    this.light.on();
  }
}

// Invoker
class RemoteControl {
  private history: Command[] = [];
  
  executeCommand(command: Command) {
    command.execute();
    this.history.push(command);
  }
  
  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
    }
  }
}

// Usage
const light = new Light();
const remote = new RemoteControl();

remote.executeCommand(new LightOnCommand(light));  // Light ON
remote.executeCommand(new LightOffCommand(light)); // Light OFF
remote.undo();  // Light ON (undo off)
remote.undo();  // Light OFF (undo on)
```

## Why This Matters

Command is useful for:
- **Undo/Redo**: Store command history
- **Queuing**: Execute commands later
- **Logging**: Record operations
- **Transactions**: Group commands
- **Parameterization**: Pass operations as objects

## The Philosophy

Think of Command like a **work order**: instead of telling a worker what to do verbally, you write it down (encapsulate). The work order can be queued, logged, reassigned, or cancelled. It's a reified request—a request that became an object.

## Real-World Examples

### Text Editor with Undo/Redo

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private content: string = '';
  
  getContent(): string {
    return this.content;
  }
  
  setContent(content: string): void {
    this.content = content;
  }
  
  insertText(text: string, position: number): void {
    this.content = this.content.slice(0, position) + text + this.content.slice(position);
  }
  
  deleteText(position: number, length: number): void {
    this.content = this.content.slice(0, position) + this.content.slice(position + length);
  }
}

class InsertTextCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string,
    private position: number
  ) {}
  
  execute(): void {
    this.editor.insertText(this.text, this.position);
  }
  
  undo(): void {
    this.editor.deleteText(this.position, this.text.length);
  }
}

class DeleteTextCommand implements Command {
  private deletedText: string = '';
  
  constructor(
    private editor: TextEditor,
    private position: number,
    private length: number
  ) {}
  
  execute(): void {
    const content = this.editor.getContent();
    this.deletedText = content.slice(this.position, this.position + this.length);
    this.editor.deleteText(this.position, this.length);
  }
  
  undo(): void {
    this.editor.insertText(this.deletedText, this.position);
  }
}

class CommandManager {
  private history: Command[] = [];
  private currentIndex: number = -1;
  
  executeCommand(command: Command): void {
    // Remove any commands after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    command.execute();
    this.history.push(command);
    this.currentIndex++;
  }
  
  undo(): void {
    if (this.currentIndex >= 0) {
      this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }
  
  redo(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.history[this.currentIndex].execute();
    }
  }
}

// Usage
const editor = new TextEditor();
const manager = new CommandManager();

manager.executeCommand(new InsertTextCommand(editor, 'Hello', 0));
console.log(editor.getContent());  // "Hello"

manager.executeCommand(new InsertTextCommand(editor, ' World', 5));
console.log(editor.getContent());  // "Hello World"

manager.undo();
console.log(editor.getContent());  // "Hello"

manager.redo();
console.log(editor.getContent());  // "Hello World"
```

### Task Queue

```typescript
interface Task {
  execute(): Promise<void>;
  getName(): string;
}

class SendEmailTask implements Task {
  constructor(
    private to: string,
    private subject: string,
    private body: string
  ) {}
  
  getName(): string {
    return `Send email to ${this.to}`;
  }
  
  async execute(): Promise<void> {
    console.log(`Sending email to ${this.to}: ${this.subject}`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Email sent!');
  }
}

class ProcessPaymentTask implements Task {
  constructor(
    private amount: number,
    private cardToken: string
  ) {}
  
  getName(): string {
    return `Process payment of $${this.amount}`;
  }
  
  async execute(): Promise<void> {
    console.log(`Processing payment: $${this.amount}`);
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Payment processed!');
  }
}

class TaskQueue {
  private queue: Task[] = [];
  private isProcessing: boolean = false;
  
  addTask(task: Task): void {
    console.log(`Queued: ${task.getName()}`);
    this.queue.push(task);
    this.process();
  }
  
  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      console.log(`Executing: ${task.getName()}`);
      await task.execute();
    }
    
    this.isProcessing = false;
  }
}

// Usage
const queue = new TaskQueue();

queue.addTask(new SendEmailTask('user@example.com', 'Welcome', 'Welcome to our app!'));
queue.addTask(new ProcessPaymentTask(99.99, 'tok_visa'));
queue.addTask(new SendEmailTask('user@example.com', 'Receipt', 'Your payment receipt'));
```

### Macro Commands

```typescript
class MacroCommand implements Command {
  private commands: Command[] = [];
  
  add(command: Command): void {
    this.commands.push(command);
  }
  
  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }
  
  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

class Light {
  constructor(private name: string) {}
  
  on() { console.log(`${this.name} light ON`); }
  off() { console.log(`${this.name} light OFF`); }
}

class Thermostat {
  setTemperature(temp: number) {
    console.log(`Temperature set to ${temp}°F`);
  }
}

class LightOnCommand implements Command {
  constructor(private light: Light) {}
  execute() { this.light.on(); }
  undo() { this.light.off(); }
}

class SetTemperatureCommand implements Command {
  private previousTemp: number = 70;
  
  constructor(
    private thermostat: Thermostat,
    private temperature: number
  ) {}
  
  execute() {
    this.thermostat.setTemperature(this.temperature);
  }
  
  undo() {
    this.thermostat.setTemperature(this.previousTemp);
  }
}

// Macro: "Leave Home" mode
const leaveHomeMacro = new MacroCommand();
leaveHomeMacro.add(new LightOnCommand(new Light('Living Room')).undo as unknown as Command);
leaveHomeMacro.add(new LightOnCommand(new Light('Bedroom')).undo as unknown as Command);
leaveHomeMacro.add(new SetTemperatureCommand(new Thermostat(), 65));

leaveHomeMacro.execute();  // Turn off all lights, lower temperature
```

## Benefits

1. **Decoupling**: Invoker independent of receiver
2. **Undo/Redo**: Store command history
3. **Queuing**: Execute commands later
4. **Composability**: Combine commands (macros)
5. **Logging**: Record all operations

## When to Use

✅ **Use Command when:**
- Need undo/redo functionality
- Queue or schedule operations
- Log operations for audit trail
- Parameterize objects with operations
- Support transactions (execute all or none)

❌ **Don't use Command when:**
- Simple direct method calls suffice
- No need for undo/logging/queuing
- Adds unnecessary complexity

## Common Violations

```typescript
// ❌ BAD: Direct coupling
button.onClick(() => light.on());

// ✅ GOOD: Command pattern
button.onClick(() => invoker.execute(new LightOnCommand(light)));
```

## The Mind-Shift

**Before**: Call methods directly  
**After**: Encapsulate requests as objects

## Summary

**Command Pattern**:
- Encapsulates request as object
- Decouples invoker from receiver
- Enables undo/redo
- Supports queuing and logging
- Commands can be composed (macros)

**Key insight**: *The Command pattern reifies requests—when you need to treat operations as first-class objects that can be stored, queued, undone, or logged, use the command pattern.*

---

**Next**: [State Pattern](../state.md)
