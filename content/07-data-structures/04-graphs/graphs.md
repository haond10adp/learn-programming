# Graphs

## What is a Graph?

A **Graph** is a non-linear data structure consisting of **vertices** (nodes) connected by **edges** (links). Graphs model relationships and connections between entities, making them fundamental for representing networks, relationships, dependencies, and pathways.

### Basic Concepts

```
Graph Components:
- Vertices/Nodes: Points (A, B, C, D)
- Edges: Connections between vertices

Example Graph:
    A --- B
    |     |
    |     |
    C --- D

Vertices: {A, B, C, D}
Edges: {(A,B), (A,C), (B,D), (C,D)}
```

### Graph Types

1. **Undirected Graph**: Edges have no direction (bidirectional)
2. **Directed Graph (Digraph)**: Edges have direction (one-way)
3. **Weighted Graph**: Edges have associated weights/costs
4. **Unweighted Graph**: All edges have equal weight
5. **Cyclic Graph**: Contains cycles (circular paths)
6. **Acyclic Graph**: No cycles (e.g., trees, DAGs)

```
Undirected:          Directed (Digraph):      Weighted:
A --- B              A → B                    A --5-- B
|     |              ↓   ↓                    |       |
C --- D              C → D                    3       2
                                              |       |
                                              C --4-- D
```

## Why Graphs Matter

Graphs are crucial because they:

1. **Model Real Networks**: Social networks, road maps, internet topology
2. **Represent Dependencies**: Task scheduling, build systems, package managers
3. **Find Optimal Paths**: Navigation, routing protocols, game AI
4. **Analyze Relationships**: Friend recommendations, influence propagation
5. **Detect Patterns**: Cycle detection, strongly connected components
6. **Optimize Flow**: Network flow, matching problems

## Time Complexity

| Operation          | Adjacency List | Adjacency Matrix | Description                    |
|--------------------|---------------|------------------|--------------------------------|
| Add Vertex         | O(1)          | O(V²)            | Add new node                   |
| Add Edge           | O(1)          | O(1)             | Connect two vertices           |
| Remove Vertex      | O(V + E)      | O(V²)            | Delete node and its edges      |
| Remove Edge        | O(E)          | O(1)             | Delete connection              |
| Check Adjacent     | O(V)          | O(1)             | Are two vertices connected?    |
| Get All Neighbors  | O(1)          | O(V)             | Get vertex neighbors           |
| Space              | O(V + E)      | O(V²)            | Total memory used              |

**Where**: V = number of vertices, E = number of edges

## Graph Representations

### 1. Adjacency List (Most Common)

```typescript
class Graph<T> {
    private adjacencyList: Map<T, Set<T>>;
    private directed: boolean;

    constructor(directed: boolean = false) {
        this.adjacencyList = new Map();
        this.directed = directed;
    }

    // Add vertex
    addVertex(vertex: T): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, new Set());
        }
    }

    // Add edge
    addEdge(source: T, destination: T): void {
        // Ensure vertices exist
        this.addVertex(source);
        this.addVertex(destination);

        // Add edge
        this.adjacencyList.get(source)!.add(destination);

        // If undirected, add reverse edge
        if (!this.directed) {
            this.adjacencyList.get(destination)!.add(source);
        }
    }

    // Remove vertex
    removeVertex(vertex: T): boolean {
        if (!this.adjacencyList.has(vertex)) {
            return false;
        }

        // Remove all edges to this vertex
        for (const neighbors of this.adjacencyList.values()) {
            neighbors.delete(vertex);
        }

        // Remove vertex itself
        this.adjacencyList.delete(vertex);
        return true;
    }

    // Remove edge
    removeEdge(source: T, destination: T): boolean {
        if (!this.adjacencyList.has(source)) {
            return false;
        }

        const removed = this.adjacencyList.get(source)!.delete(destination);

        if (!this.directed) {
            this.adjacencyList.get(destination)?.delete(source);
        }

        return removed;
    }

    // Check if edge exists
    hasEdge(source: T, destination: T): boolean {
        return this.adjacencyList.get(source)?.has(destination) || false;
    }

    // Get neighbors
    getNeighbors(vertex: T): T[] {
        return Array.from(this.adjacencyList.get(vertex) || []);
    }

    // Get all vertices
    getVertices(): T[] {
        return Array.from(this.adjacencyList.keys());
    }

    // Get number of vertices
    vertexCount(): number {
        return this.adjacencyList.size;
    }

    // Get number of edges
    edgeCount(): number {
        let count = 0;
        for (const neighbors of this.adjacencyList.values()) {
            count += neighbors.size;
        }
        return this.directed ? count : count / 2;
    }

    // Get degree of vertex
    degree(vertex: T): number {
        return this.adjacencyList.get(vertex)?.size || 0;
    }

    // Print graph
    print(): void {
        for (const [vertex, neighbors] of this.adjacencyList) {
            console.log(`${vertex} -> ${Array.from(neighbors).join(', ')}`);
        }
    }
}
```

### Usage Example

```typescript
const graph = new Graph<string>(false); // Undirected

// Add vertices
graph.addVertex('A');
graph.addVertex('B');
graph.addVertex('C');
graph.addVertex('D');

// Add edges
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('C', 'D');

// Print
graph.print();
// A -> B, C
// B -> A, D
// C -> A, D
// D -> B, C

// Query
console.log(graph.hasEdge('A', 'B'));      // true
console.log(graph.getNeighbors('A'));      // ['B', 'C']
console.log(graph.degree('D'));            // 2
```

### 2. Adjacency Matrix

```typescript
class GraphMatrix {
    private matrix: number[][];
    private vertices: Map<string, number>;
    private indexToVertex: Map<number, string>;
    private directed: boolean;

    constructor(directed: boolean = false) {
        this.matrix = [];
        this.vertices = new Map();
        this.indexToVertex = new Map();
        this.directed = directed;
    }

    addVertex(vertex: string): void {
        if (this.vertices.has(vertex)) {
            return;
        }

        const index = this.vertices.size;
        this.vertices.set(vertex, index);
        this.indexToVertex.set(index, vertex);

        // Expand matrix
        for (const row of this.matrix) {
            row.push(0);
        }
        this.matrix.push(new Array(this.vertices.size).fill(0));
    }

    addEdge(source: string, destination: string, weight: number = 1): void {
        this.addVertex(source);
        this.addVertex(destination);

        const sourceIdx = this.vertices.get(source)!;
        const destIdx = this.vertices.get(destination)!;

        this.matrix[sourceIdx][destIdx] = weight;

        if (!this.directed) {
            this.matrix[destIdx][sourceIdx] = weight;
        }
    }

    hasEdge(source: string, destination: string): boolean {
        const sourceIdx = this.vertices.get(source);
        const destIdx = this.vertices.get(destination);

        if (sourceIdx === undefined || destIdx === undefined) {
            return false;
        }

        return this.matrix[sourceIdx][destIdx] !== 0;
    }

    getNeighbors(vertex: string): string[] {
        const idx = this.vertices.get(vertex);
        if (idx === undefined) {
            return [];
        }

        const neighbors: string[] = [];
        for (let i = 0; i < this.matrix[idx].length; i++) {
            if (this.matrix[idx][i] !== 0) {
                neighbors.push(this.indexToVertex.get(i)!);
            }
        }

        return neighbors;
    }

    getWeight(source: string, destination: string): number | null {
        const sourceIdx = this.vertices.get(source);
        const destIdx = this.vertices.get(destination);

        if (sourceIdx === undefined || destIdx === undefined) {
            return null;
        }

        return this.matrix[sourceIdx][destIdx] || null;
    }

    print(): void {
        console.log('  ', Array.from(this.vertices.keys()).join(' '));
        for (const [vertex, idx] of this.vertices) {
            console.log(vertex, this.matrix[idx].join(' '));
        }
    }
}
```

### 3. Edge List

```typescript
interface Edge<T> {
    source: T;
    destination: T;
    weight?: number;
}

class GraphEdgeList<T> {
    private edges: Edge<T>[];
    private vertices: Set<T>;
    private directed: boolean;

    constructor(directed: boolean = false) {
        this.edges = [];
        this.vertices = new Set();
        this.directed = directed;
    }

    addVertex(vertex: T): void {
        this.vertices.add(vertex);
    }

    addEdge(source: T, destination: T, weight?: number): void {
        this.vertices.add(source);
        this.vertices.add(destination);
        this.edges.push({ source, destination, weight });
    }

    getEdges(): Edge<T>[] {
        return [...this.edges];
    }

    getVertices(): T[] {
        return Array.from(this.vertices);
    }

    edgeCount(): number {
        return this.edges.length;
    }
}
```

## Weighted Graph Implementation

```typescript
interface WeightedEdge<T> {
    destination: T;
    weight: number;
}

class WeightedGraph<T> {
    private adjacencyList: Map<T, WeightedEdge<T>[]>;
    private directed: boolean;

    constructor(directed: boolean = false) {
        this.adjacencyList = new Map();
        this.directed = directed;
    }

    addVertex(vertex: T): void {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    addEdge(source: T, destination: T, weight: number): void {
        this.addVertex(source);
        this.addVertex(destination);

        this.adjacencyList.get(source)!.push({ destination, weight });

        if (!this.directed) {
            this.adjacencyList.get(destination)!.push({ 
                destination: source, 
                weight 
            });
        }
    }

    getNeighbors(vertex: T): WeightedEdge<T>[] {
        return this.adjacencyList.get(vertex) || [];
    }

    getWeight(source: T, destination: T): number | null {
        const neighbors = this.adjacencyList.get(source) || [];
        const edge = neighbors.find(e => e.destination === destination);
        return edge ? edge.weight : null;
    }

    print(): void {
        for (const [vertex, edges] of this.adjacencyList) {
            const edgesStr = edges
                .map(e => `${e.destination}(${e.weight})`)
                .join(', ');
            console.log(`${vertex} -> ${edgesStr}`);
        }
    }
}

// Usage
const weightedGraph = new WeightedGraph<string>(true);
weightedGraph.addEdge('A', 'B', 5);
weightedGraph.addEdge('A', 'C', 3);
weightedGraph.addEdge('B', 'D', 2);
weightedGraph.addEdge('C', 'D', 4);

weightedGraph.print();
// A -> B(5), C(3)
// B -> D(2)
// C -> D(4)
// D ->
```

## Graph Properties

### Check if Graph is Connected

```typescript
function isConnected<T>(graph: Graph<T>): boolean {
    const vertices = graph.getVertices();
    if (vertices.length === 0) return true;

    const visited = new Set<T>();
    const queue: T[] = [vertices[0]];

    while (queue.length > 0) {
        const vertex = queue.shift()!;
        
        if (visited.has(vertex)) continue;
        visited.add(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                queue.push(neighbor);
            }
        }
    }

    return visited.size === vertices.length;
}
```

### Detect Cycle

```typescript
// For undirected graph
function hasCycleUndirected<T>(graph: Graph<T>): boolean {
    const visited = new Set<T>();

    function dfs(vertex: T, parent: T | null): boolean {
        visited.add(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor, vertex)) {
                    return true;
                }
            } else if (neighbor !== parent) {
                return true; // Found cycle
            }
        }

        return false;
    }

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            if (dfs(vertex, null)) {
                return true;
            }
        }
    }

    return false;
}

// For directed graph
function hasCycleDirected<T>(graph: Graph<T>): boolean {
    const visited = new Set<T>();
    const recursionStack = new Set<T>();

    function dfs(vertex: T): boolean {
        visited.add(vertex);
        recursionStack.add(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor)) {
                    return true;
                }
            } else if (recursionStack.has(neighbor)) {
                return true; // Found cycle
            }
        }

        recursionStack.delete(vertex);
        return false;
    }

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            if (dfs(vertex)) {
                return true;
            }
        }
    }

    return false;
}
```

### Find Connected Components

```typescript
function findConnectedComponents<T>(graph: Graph<T>): T[][] {
    const visited = new Set<T>();
    const components: T[][] = [];

    function dfs(vertex: T, component: T[]): void {
        visited.add(vertex);
        component.push(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                dfs(neighbor, component);
            }
        }
    }

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            const component: T[] = [];
            dfs(vertex, component);
            components.push(component);
        }
    }

    return components;
}

// Usage
const graph = new Graph<string>(false);
graph.addEdge('A', 'B');
graph.addEdge('B', 'C');
graph.addEdge('D', 'E');

console.log(findConnectedComponents(graph));
// [['A', 'B', 'C'], ['D', 'E']]
```

## Real-World Applications

### 1. Social Network

```typescript
class SocialNetwork {
    private graph: Graph<string>;

    constructor() {
        this.graph = new Graph<string>(false); // Undirected (friendship is mutual)
    }

    addUser(username: string): void {
        this.graph.addVertex(username);
    }

    addFriendship(user1: string, user2: string): void {
        this.graph.addEdge(user1, user2);
    }

    getFriends(username: string): string[] {
        return this.graph.getNeighbors(username);
    }

    mutualFriends(user1: string, user2: string): string[] {
        const friends1 = new Set(this.graph.getNeighbors(user1));
        const friends2 = this.graph.getNeighbors(user2);

        return friends2.filter(friend => friends1.has(friend));
    }

    suggestFriends(username: string): string[] {
        const friends = new Set(this.graph.getNeighbors(username));
        const suggestions = new Map<string, number>();

        // Friends of friends who aren't already friends
        for (const friend of friends) {
            for (const fof of this.graph.getNeighbors(friend)) {
                if (fof !== username && !friends.has(fof)) {
                    suggestions.set(fof, (suggestions.get(fof) || 0) + 1);
                }
            }
        }

        // Sort by number of mutual friends
        return Array.from(suggestions.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([user]) => user);
    }

    degreesOfSeparation(user1: string, user2: string): number {
        const queue: [string, number][] = [[user1, 0]];
        const visited = new Set<string>([user1]);

        while (queue.length > 0) {
            const [current, distance] = queue.shift()!;

            if (current === user2) {
                return distance;
            }

            for (const neighbor of this.graph.getNeighbors(current)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, distance + 1]);
                }
            }
        }

        return -1; // Not connected
    }
}

// Usage
const social = new SocialNetwork();
social.addUser('Alice');
social.addUser('Bob');
social.addUser('Charlie');
social.addFriendship('Alice', 'Bob');
social.addFriendship('Bob', 'Charlie');

console.log(social.mutualFriends('Alice', 'Charlie')); // ['Bob']
console.log(social.degreesOfSeparation('Alice', 'Charlie')); // 2
```

### 2. Dependency Graph

```typescript
class DependencyGraph {
    private graph: Graph<string>;

    constructor() {
        this.graph = new Graph<string>(true); // Directed
    }

    addPackage(name: string): void {
        this.graph.addVertex(name);
    }

    addDependency(package_: string, dependency: string): void {
        this.graph.addEdge(package_, dependency);
    }

    getBuildOrder(): string[] | null {
        // Topological sort
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const result: string[] = [];

        const dfs = (vertex: string): boolean => {
            visited.add(vertex);
            recursionStack.add(vertex);

            for (const neighbor of this.graph.getNeighbors(vertex)) {
                if (!visited.has(neighbor)) {
                    if (!dfs(neighbor)) return false;
                } else if (recursionStack.has(neighbor)) {
                    return false; // Circular dependency
                }
            }

            recursionStack.delete(vertex);
            result.unshift(vertex); // Add to front
            return true;
        };

        for (const vertex of this.graph.getVertices()) {
            if (!visited.has(vertex)) {
                if (!dfs(vertex)) {
                    return null; // Circular dependency detected
                }
            }
        }

        return result;
    }

    hasCircularDependency(): boolean {
        return this.getBuildOrder() === null;
    }
}

// Usage
const deps = new DependencyGraph();
deps.addPackage('App');
deps.addPackage('Database');
deps.addPackage('Logger');
deps.addPackage('Config');

deps.addDependency('App', 'Database');
deps.addDependency('App', 'Logger');
deps.addDependency('Database', 'Config');
deps.addDependency('Logger', 'Config');

console.log(deps.getBuildOrder());
// ['Config', 'Logger', 'Database', 'App'] or ['Config', 'Database', 'Logger', 'App']
```

### 3. Course Prerequisites

```typescript
interface Course {
    id: string;
    name: string;
}

class CourseScheduler {
    private graph: Graph<string>;

    constructor() {
        this.graph = new Graph<string>(true);
    }

    addCourse(courseId: string): void {
        this.graph.addVertex(courseId);
    }

    addPrerequisite(courseId: string, prerequisiteId: string): void {
        this.graph.addEdge(courseId, prerequisiteId);
    }

    canComplete(courses: string[]): boolean {
        // Check for cycles
        return !hasCycleDirected(this.graph);
    }

    getCourseOrder(courses: string[]): string[] | null {
        // Similar to dependency graph's getBuildOrder
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const result: string[] = [];

        const dfs = (courseId: string): boolean => {
            visited.add(courseId);
            recursionStack.add(courseId);

            for (const prereq of this.graph.getNeighbors(courseId)) {
                if (!visited.has(prereq)) {
                    if (!dfs(prereq)) return false;
                } else if (recursionStack.has(prereq)) {
                    return false;
                }
            }

            recursionStack.delete(courseId);
            result.unshift(courseId);
            return true;
        };

        for (const course of courses) {
            if (!visited.has(course)) {
                if (!dfs(course)) {
                    return null;
                }
            }
        }

        return result;
    }
}
```

## When to Use Graphs

### Use Graphs When:
- ✅ Modeling **networks** (social, computer, transportation)
- ✅ Representing **dependencies** (build systems, courses)
- ✅ Finding **shortest paths** (navigation, routing)
- ✅ **Relationship analysis** (recommendations, influence)
- ✅ **State machines** (game AI, workflows)
- ✅ **Scheduling** tasks with dependencies

### Don't Use Graphs When:
- ❌ **Hierarchical structure** only → use Tree
- ❌ **Sequential data** → use Array or Linked List
- ❌ **Simple lookups** → use Hash Table
- ❌ **No relationships** between data → simpler structure

## Common Pitfalls and How to Avoid Them

### 1. Choosing Wrong Representation

```typescript
// ❌ Wrong: Adjacency matrix for sparse graph
// If V=1000 and E=100, matrix uses 1M spaces for 100 edges!
const matrix = new Array(1000).fill(0).map(() => new Array(1000).fill(0));

// ✅ Correct: Adjacency list for sparse graph
const list = new Map<number, Set<number>>(); // Only stores actual edges
```

### 2. Not Handling Disconnected Graphs

```typescript
// ❌ Wrong: Only traversing from one vertex
function traverse<T>(graph: Graph<T>, start: T): void {
    // Only visits component containing start
    dfs(start);
}

// ✅ Correct: Visit all components
function traverse<T>(graph: Graph<T>): void {
    const visited = new Set<T>();
    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            dfs(vertex, visited);
        }
    }
}
```

### 3. Forgetting Visited Set in Cyclic Graphs

```typescript
// ❌ Wrong: Infinite loop on cycles
function dfs<T>(vertex: T): void {
    for (const neighbor of graph.getNeighbors(vertex)) {
        dfs(neighbor); // Revisits vertices infinitely!
    }
}

// ✅ Correct: Track visited vertices
function dfs<T>(vertex: T, visited: Set<T>): void {
    visited.add(vertex);
    for (const neighbor of graph.getNeighbors(vertex)) {
        if (!visited.has(neighbor)) {
            dfs(neighbor, visited);
        }
    }
}
```

### 4. Directed vs Undirected Confusion

```typescript
// ❌ Wrong: Treating directed as undirected
graph.addEdge('A', 'B'); // A → B
// Assuming B → A exists

// ✅ Correct: Be explicit about direction
const directedGraph = new Graph<string>(true);
directedGraph.addEdge('A', 'B'); // Only A → B

const undirectedGraph = new Graph<string>(false);
undirectedGraph.addEdge('A', 'B'); // Both A ↔ B
```

### 5. Not Considering Weighted Edges

```typescript
// ❌ Wrong: Ignoring weights in weighted graph
const shortestPath = bfs(graph, 'A', 'B'); // BFS finds shortest by edge count

// ✅ Correct: Use Dijkstra for weighted graphs
const shortestPath = dijkstra(weightedGraph, 'A', 'B'); // Considers weights
```

## Summary

**Graphs** are versatile structures for modeling connected data:

1. **Components**: Vertices (nodes) connected by edges (links)
2. **Types**: Directed/undirected, weighted/unweighted, cyclic/acyclic
3. **Representations**: Adjacency list (space-efficient), adjacency matrix (fast lookup), edge list
4. **Properties**: Connectivity, cycles, components, paths
5. **Applications**: Networks, dependencies, routing, relationships, scheduling
6. **Key Advantage**: Model complex relationships and enable path-finding algorithms

Graphs excel when:
- Data has interconnected relationships
- Path finding is required
- Dependency analysis is needed
- Network modeling is necessary

**Remember**: Choose adjacency list for sparse graphs (most real-world cases), adjacency matrix for dense graphs or when frequent edge lookups are needed. Always consider whether your graph is directed or undirected, and whether edges have weights. These choices fundamentally affect which algorithms and approaches you should use.

---

**Next**: Explore [Graph Algorithms](./algorithms.md) for BFS, DFS, shortest path, and topological sort, or review [Sets](../03-hash/sets.md) for tracking visited nodes.
