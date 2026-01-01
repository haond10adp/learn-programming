# MVC and MVVM Patterns

## What are MVC and MVVM?

**Model-View-Controller (MVC)** and **Model-View-ViewModel (MVVM)** are architectural patterns for organizing code in applications with user interfaces. Both separate presentation logic from business logic, but they differ in how they handle user interactions and data flow.

### MVC vs MVVM

```
MVC (Model-View-Controller)

User ──► View ──► Controller ──► Model
          ▲         │              │
          └─────────┴──────────────┘
          
- Controller handles user input
- Updates model and view
- View knows about model


MVVM (Model-View-ViewModel)

User ──► View ◄──► ViewModel ──► Model
         (Data Binding)
         
- ViewModel exposes data for view
- Two-way data binding
- View knows nothing about model
```

## MVC (Model-View-Controller)

### Components

**Model**: Business logic and data
**View**: UI presentation
**Controller**: Handles user input, updates model and view

### Flow
1. User interacts with View
2. View notifies Controller
3. Controller updates Model
4. Model notifies View
5. View updates display

## MVC Implementation in TypeScript

### Server-Side MVC (Express.js)

```typescript
// ============================================
// MODEL (Business Logic & Data)
// ============================================

interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
}

class UserModel {
    private users = new Map<string, User>();

    async create(email: string, name: string): Promise<User> {
        const user: User = {
            id: crypto.randomUUID(),
            email,
            name,
            createdAt: new Date()
        };
        
        this.users.set(user.id, user);
        return user;
    }

    async findById(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    async findAll(): Promise<User[]> {
        return Array.from(this.users.values());
    }

    async update(id: string, updates: Partial<User>): Promise<User | null> {
        const user = this.users.get(id);
        if (!user) return null;
        
        const updated = { ...user, ...updates };
        this.users.set(id, updated);
        return updated;
    }

    async delete(id: string): Promise<boolean> {
        return this.users.delete(id);
    }
}

// ============================================
// VIEW (Presentation)
// ============================================

class UserView {
    // Render list of users as HTML
    renderUserList(users: User[]): string {
        const userItems = users.map(user => `
            <li>
                <strong>${user.name}</strong> (${user.email})
                <a href="/users/${user.id}">View</a>
                <a href="/users/${user.id}/edit">Edit</a>
            </li>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head><title>Users</title></head>
            <body>
                <h1>Users</h1>
                <ul>${userItems}</ul>
                <a href="/users/new">Create New User</a>
            </body>
            </html>
        `;
    }

    // Render single user details
    renderUserDetail(user: User): string {
        return `
            <!DOCTYPE html>
            <html>
            <head><title>${user.name}</title></head>
            <body>
                <h1>${user.name}</h1>
                <p>Email: ${user.email}</p>
                <p>Created: ${user.createdAt.toLocaleDateString()}</p>
                <a href="/users/${user.id}/edit">Edit</a>
                <a href="/users">Back to List</a>
            </body>
            </html>
        `;
    }

    // Render edit form
    renderEditForm(user: User): string {
        return `
            <!DOCTYPE html>
            <html>
            <head><title>Edit ${user.name}</title></head>
            <body>
                <h1>Edit User</h1>
                <form method="POST" action="/users/${user.id}">
                    <label>Name: <input name="name" value="${user.name}" /></label><br>
                    <label>Email: <input name="email" value="${user.email}" /></label><br>
                    <button type="submit">Save</button>
                </form>
                <a href="/users/${user.id}">Cancel</a>
            </body>
            </html>
        `;
    }

    // Render create form
    renderCreateForm(): string {
        return `
            <!DOCTYPE html>
            <html>
            <head><title>New User</title></head>
            <body>
                <h1>Create User</h1>
                <form method="POST" action="/users">
                    <label>Name: <input name="name" /></label><br>
                    <label>Email: <input name="email" /></label><br>
                    <button type="submit">Create</button>
                </form>
                <a href="/users">Cancel</a>
            </body>
            </html>
        `;
    }
}

// ============================================
// CONTROLLER (Request Handling)
// ============================================

import express from 'express';

class UserController {
    constructor(
        private model: UserModel,
        private view: UserView
    ) {}

    setupRoutes(app: express.Application): void {
        // List users
        app.get('/users', async (req, res) => {
            const users = await this.model.findAll();
            const html = this.view.renderUserList(users);
            res.send(html);
        });

        // Show single user
        app.get('/users/:id', async (req, res) => {
            const user = await this.model.findById(req.params.id);
            if (!user) {
                res.status(404).send('User not found');
                return;
            }
            const html = this.view.renderUserDetail(user);
            res.send(html);
        });

        // Show edit form
        app.get('/users/:id/edit', async (req, res) => {
            const user = await this.model.findById(req.params.id);
            if (!user) {
                res.status(404).send('User not found');
                return;
            }
            const html = this.view.renderEditForm(user);
            res.send(html);
        });

        // Show create form
        app.get('/users/new', async (req, res) => {
            const html = this.view.renderCreateForm();
            res.send(html);
        });

        // Create user
        app.post('/users', express.urlencoded({ extended: true }), async (req, res) => {
            const user = await this.model.create(req.body.email, req.body.name);
            res.redirect(`/users/${user.id}`);
        });

        // Update user
        app.post('/users/:id', express.urlencoded({ extended: true }), async (req, res) => {
            await this.model.update(req.params.id, {
                name: req.body.name,
                email: req.body.email
            });
            res.redirect(`/users/${req.params.id}`);
        });
    }
}

// Bootstrap
const app = express();
const userModel = new UserModel();
const userView = new UserView();
const userController = new UserController(userModel, userView);

userController.setupRoutes(app);

app.listen(3000, () => {
    console.log('MVC Server running on port 3000');
});
```

### Client-Side MVC

```typescript
// ============================================
// CLIENT-SIDE MVC (Vanilla TypeScript)
// ============================================

// Model
class TodoModel {
    private todos: Todo[] = [];
    private listeners: Array<() => void> = [];

    addTodo(text: string): void {
        const todo: Todo = {
            id: Date.now().toString(),
            text,
            completed: false
        };
        this.todos.push(todo);
        this.notifyListeners();
    }

    toggleTodo(id: string): void {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.notifyListeners();
        }
    }

    deleteTodo(id: string): void {
        this.todos = this.todos.filter(t => t.id !== id);
        this.notifyListeners();
    }

    getTodos(): Todo[] {
        return [...this.todos];
    }

    subscribe(listener: () => void): void {
        this.listeners.push(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

// View
class TodoView {
    constructor(private rootElement: HTMLElement) {}

    render(todos: Todo[], onAdd: (text: string) => void, onToggle: (id: string) => void, onDelete: (id: string) => void): void {
        this.rootElement.innerHTML = `
            <div class="todo-app">
                <h1>Todo List</h1>
                <form id="todo-form">
                    <input id="todo-input" type="text" placeholder="Add todo..." />
                    <button type="submit">Add</button>
                </form>
                <ul id="todo-list">
                    ${todos.map(todo => `
                        <li>
                            <input type="checkbox" 
                                   data-id="${todo.id}" 
                                   class="todo-checkbox"
                                   ${todo.completed ? 'checked' : ''} />
                            <span style="${todo.completed ? 'text-decoration: line-through' : ''}">
                                ${todo.text}
                            </span>
                            <button class="delete-btn" data-id="${todo.id}">Delete</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        // Attach event listeners
        const form = this.rootElement.querySelector('#todo-form') as HTMLFormElement;
        const input = this.rootElement.querySelector('#todo-input') as HTMLInputElement;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value.trim()) {
                onAdd(input.value.trim());
                input.value = '';
            }
        });

        this.rootElement.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = (e.target as HTMLElement).getAttribute('data-id')!;
                onToggle(id);
            });
        });

        this.rootElement.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = (e.target as HTMLElement).getAttribute('data-id')!;
                onDelete(id);
            });
        });
    }
}

// Controller
class TodoController {
    constructor(
        private model: TodoModel,
        private view: TodoView
    ) {
        // Subscribe to model changes
        this.model.subscribe(() => this.updateView());
        this.updateView();
    }

    private updateView(): void {
        const todos = this.model.getTodos();
        this.view.render(
            todos,
            (text) => this.handleAddTodo(text),
            (id) => this.handleToggleTodo(id),
            (id) => this.handleDeleteTodo(id)
        );
    }

    private handleAddTodo(text: string): void {
        this.model.addTodo(text);
    }

    private handleToggleTodo(id: string): void {
        this.model.toggleTodo(id);
    }

    private handleDeleteTodo(id: string): void {
        this.model.deleteTodo(id);
    }
}

// Initialize
const rootElement = document.getElementById('app')!;
const todoModel = new TodoModel();
const todoView = new TodoView(rootElement);
const todoController = new TodoController(todoModel, todoView);
```

## MVVM (Model-View-ViewModel)

### Components

**Model**: Business logic and data
**View**: UI (HTML/templates)
**ViewModel**: Exposes data and commands for the view

### Key Difference
- **Data Binding**: View automatically updates when ViewModel changes
- **No Direct Reference**: View doesn't call ViewModel methods directly
- **Declarative**: View declares what to display, not how

## MVVM Implementation in TypeScript

### React-Style MVVM

```typescript
// ============================================
// MVVM WITH REACT
// ============================================

import React, { useState, useEffect } from 'react';

// Model
class TodoService {
    private todos: Todo[] = [];

    async getTodos(): Promise<Todo[]> {
        // Simulate API call
        return [...this.todos];
    }

    async addTodo(text: string): Promise<Todo> {
        const todo: Todo = {
            id: Date.now().toString(),
            text,
            completed: false
        };
        this.todos.push(todo);
        return todo;
    }

    async toggleTodo(id: string): Promise<void> {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
        }
    }

    async deleteTodo(id: string): Promise<void> {
        this.todos = this.todos.filter(t => t.id !== id);
    }
}

// ViewModel
class TodoViewModel {
    constructor(private service: TodoService) {}

    // State
    private _todos: Todo[] = [];
    private _loading: boolean = false;
    private _error: string | null = null;

    // Getters
    get todos() { return this._todos; }
    get loading() { return this._loading; }
    get error() { return this._error; }

    // Commands
    async loadTodos(): Promise<void> {
        this._loading = true;
        this._error = null;
        try {
            this._todos = await this.service.getTodos();
        } catch (error) {
            this._error = 'Failed to load todos';
        } finally {
            this._loading = false;
        }
    }

    async addTodo(text: string): Promise<void> {
        try {
            const newTodo = await this.service.addTodo(text);
            this._todos.push(newTodo);
        } catch (error) {
            this._error = 'Failed to add todo';
        }
    }

    async toggleTodo(id: string): Promise<void> {
        try {
            await this.service.toggleTodo(id);
            const todo = this._todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
            }
        } catch (error) {
            this._error = 'Failed to toggle todo';
        }
    }

    async deleteTodo(id: string): Promise<void> {
        try {
            await this.service.deleteTodo(id);
            this._todos = this._todos.filter(t => t.id !== id);
        } catch (error) {
            this._error = 'Failed to delete todo';
        }
    }
}

// View (React Component)
function TodoView() {
    const [service] = useState(() => new TodoService());
    const [viewModel] = useState(() => new TodoViewModel(service));
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');

    // Load todos on mount
    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        await viewModel.loadTodos();
        syncState();
    };

    const syncState = () => {
        setTodos(viewModel.todos);
        setLoading(viewModel.loading);
        setError(viewModel.error);
    };

    const handleAdd = async () => {
        if (inputText.trim()) {
            await viewModel.addTodo(inputText.trim());
            setInputText('');
            syncState();
        }
    };

    const handleToggle = async (id: string) => {
        await viewModel.toggleTodo(id);
        syncState();
    };

    const handleDelete = async (id: string) => {
        await viewModel.deleteTodo(id);
        syncState();
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="todo-app">
            <h1>Todo List (MVVM)</h1>
            
            <div className="todo-input">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Add todo..."
                />
                <button onClick={handleAdd}>Add</button>
            </div>

            <ul className="todo-list">
                {todos.map(todo => (
                    <li key={todo.id}>
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggle(todo.id)}
                        />
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                            {todo.text}
                        </span>
                        <button onClick={() => handleDelete(todo.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

### Observable MVVM (with MobX)

```typescript
// ============================================
// MVVM WITH MOBX (Observable Pattern)
// ============================================

import { makeObservable, observable, action, computed } from 'mobx';
import { observer } from 'mobx-react-lite';

// ViewModel with MobX
class ObservableTodoViewModel {
    todos: Todo[] = [];
    loading: boolean = false;
    error: string | null = null;

    constructor(private service: TodoService) {
        makeObservable(this, {
            todos: observable,
            loading: observable,
            error: observable,
            completedCount: computed,
            loadTodos: action,
            addTodo: action,
            toggleTodo: action,
            deleteTodo: action
        });
    }

    // Computed property
    get completedCount(): number {
        return this.todos.filter(t => t.completed).length;
    }

    async loadTodos(): Promise<void> {
        this.loading = true;
        this.error = null;
        try {
            this.todos = await this.service.getTodos();
        } catch (error) {
            this.error = 'Failed to load todos';
        } finally {
            this.loading = false;
        }
    }

    async addTodo(text: string): Promise<void> {
        try {
            const newTodo = await this.service.addTodo(text);
            this.todos.push(newTodo);
        } catch (error) {
            this.error = 'Failed to add todo';
        }
    }

    async toggleTodo(id: string): Promise<void> {
        try {
            await this.service.toggleTodo(id);
            const todo = this.todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
            }
        } catch (error) {
            this.error = 'Failed to toggle todo';
        }
    }

    async deleteTodo(id: string): Promise<void> {
        try {
            await this.service.deleteTodo(id);
            this.todos = this.todos.filter(t => t.id !== id);
        } catch (error) {
            this.error = 'Failed to delete todo';
        }
    }
}

// View (automatically re-renders when observable changes)
const TodoViewMobX = observer(({ viewModel }: { viewModel: ObservableTodoViewModel }) => {
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        viewModel.loadTodos();
    }, [viewModel]);

    if (viewModel.loading) return <div>Loading...</div>;
    if (viewModel.error) return <div>Error: {viewModel.error}</div>;

    return (
        <div className="todo-app">
            <h1>Todo List (MVVM with MobX)</h1>
            <p>Completed: {viewModel.completedCount} / {viewModel.todos.length}</p>
            
            <div className="todo-input">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Add todo..."
                />
                <button onClick={() => {
                    if (inputText.trim()) {
                        viewModel.addTodo(inputText.trim());
                        setInputText('');
                    }
                }}>Add</button>
            </div>

            <ul className="todo-list">
                {viewModel.todos.map(todo => (
                    <li key={todo.id}>
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => viewModel.toggleTodo(todo.id)}
                        />
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                            {todo.text}
                        </span>
                        <button onClick={() => viewModel.deleteTodo(todo.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
});

// Usage
const service = new TodoService();
const viewModel = new ObservableTodoViewModel(service);

function App() {
    return <TodoViewMobX viewModel={viewModel} />;
}
```

## MVC vs MVVM Comparison

### MVC
```typescript
// Controller actively manipulates view
class Controller {
    updateView(): void {
        const data = this.model.getData();
        this.view.render(data); // Controller tells view what to do
    }
}
```

### MVVM
```typescript
// ViewModel exposes data, view binds to it
class ViewModel {
    @observable data: Data;
    
    // View automatically updates when data changes
    // No manual view.render() needed
}
```

| Aspect | MVC | MVVM |
|--------|-----|------|
| **Controller/ViewModel** | Controller handles user input | ViewModel exposes data/commands |
| **View Updates** | Manual (controller → view) | Automatic (data binding) |
| **View Knowledge** | View may know about model | View only knows ViewModel |
| **Testing** | Need to test controller logic | Test ViewModel in isolation |
| **Best For** | Server-side apps, simple UIs | Rich client apps, complex UIs |

## When to Use Each

### Use MVC When:
- Building server-side web apps
- Simple request/response patterns
- Traditional form-based UIs
- SEO is important (server-rendered HTML)

### Use MVVM When:
- Building rich client-side apps
- Complex UI with lots of state
- Real-time updates
- Using frameworks with data binding (React, Vue, Angular)

## Best Practices

### MVC Best Practices

```typescript
// ✅ Good: Thin controllers
class UserController {
    async createUser(req, res) {
        const user = await this.model.create(req.body);
        res.json(user);
    }
}

// ❌ Bad: Fat controllers with business logic
class UserController {
    async createUser(req, res) {
        // Validation
        if (!req.body.email.includes('@')) {
            return res.status(400).send('Invalid email');
        }
        // Business logic
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        // Database logic
        await db.query('INSERT INTO users...');
        // ...too much responsibility
    }
}
```

### MVVM Best Practices

```typescript
// ✅ Good: ViewModel doesn't know about view
class TodoViewModel {
    todos: Todo[] = [];
    
    addTodo(text: string): void {
        this.todos.push({ id: generateId(), text, completed: false });
        // View updates automatically
    }
}

// ❌ Bad: ViewModel manipulates view
class TodoViewModel {
    constructor(private view: TodoView) {} // Bad!
    
    addTodo(text: string): void {
        this.todos.push({ id: generateId(), text, completed: false });
        this.view.render(this.todos); // ViewModel shouldn't touch view
    }
}
```

## Summary

**MVC and MVVM** organize UI-centric applications:

1. **MVC**: Model-View-Controller with explicit control flow
2. **MVVM**: Model-View-ViewModel with data binding
3. **MVC Use Cases**: Server-side apps, traditional web apps
4. **MVVM Use Cases**: Rich client apps, SPAs
5. **Key Difference**: Manual updates (MVC) vs automatic binding (MVVM)
6. **Testing**: Both enable separation for testability

**Key Takeaway**: Choose MVC for server-side or simple apps, MVVM for complex client-side apps with frameworks that support data binding.

---

**Next**: Explore [Domain-Driven Design](../07-ddd.md) for complex business domain modeling.
