# Graph Algorithms

## Introduction

**Graph algorithms** are procedures for solving problems on graph structures. They enable us to traverse graphs, find optimal paths, detect patterns, and analyze network properties. These algorithms are fundamental to computer science and have applications in routing, scheduling, social networks, and optimization problems.

## Why Graph Algorithms Matter

Graph algorithms are essential because they:

1. **Find Shortest Paths**: Navigation, routing, optimal solutions
2. **Traverse Networks**: Visit all nodes systematically
3. **Detect Patterns**: Cycles, connected components, clusters
4. **Optimize Flow**: Network flow, resource allocation
5. **Schedule Tasks**: Topological sorting for dependencies
6. **Analyze Relationships**: Community detection, influence

## Graph Traversal Algorithms

### Breadth-First Search (BFS)

**BFS** explores a graph level by level, visiting all neighbors before moving deeper. It uses a queue and finds the shortest path in unweighted graphs.

#### Time Complexity
- **Time**: O(V + E) where V = vertices, E = edges
- **Space**: O(V) for queue and visited set

#### Implementation

```typescript
function bfs<T>(graph: Graph<T>, start: T): T[] {
    const visited = new Set<T>();
    const queue: T[] = [start];
    const result: T[] = [];

    visited.add(start);

    while (queue.length > 0) {
        const vertex = queue.shift()!;
        result.push(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return result;
}

// Usage
const graph = new Graph<string>(false);
graph.addEdge('A', 'B');
graph.addEdge('A', 'C');
graph.addEdge('B', 'D');
graph.addEdge('C', 'E');
graph.addEdge('D', 'E');

console.log(bfs(graph, 'A')); // ['A', 'B', 'C', 'D', 'E']
```

#### BFS for Shortest Path

```typescript
function shortestPath<T>(
    graph: Graph<T>,
    start: T,
    target: T
): T[] | null {
    const visited = new Set<T>([start]);
    const queue: Array<{ vertex: T; path: T[] }> = [
        { vertex: start, path: [start] }
    ];

    while (queue.length > 0) {
        const { vertex, path } = queue.shift()!;

        if (vertex === target) {
            return path;
        }

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({
                    vertex: neighbor,
                    path: [...path, neighbor]
                });
            }
        }
    }

    return null; // No path found
}

// Usage
console.log(shortestPath(graph, 'A', 'E')); // ['A', 'C', 'E']
```

#### BFS Level Order

```typescript
function bfsLevelOrder<T>(graph: Graph<T>, start: T): T[][] {
    const visited = new Set<T>([start]);
    const queue: Array<{ vertex: T; level: number }> = [
        { vertex: start, level: 0 }
    ];
    const levels: T[][] = [];

    while (queue.length > 0) {
        const { vertex, level } = queue.shift()!;

        if (!levels[level]) {
            levels[level] = [];
        }
        levels[level].push(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ vertex: neighbor, level: level + 1 });
            }
        }
    }

    return levels;
}

// Usage
console.log(bfsLevelOrder(graph, 'A'));
// [[A], [B, C], [D, E]]
```

### Depth-First Search (DFS)

**DFS** explores a graph by going as deep as possible before backtracking. It uses a stack (or recursion) and is useful for detecting cycles, topological sorting, and path finding.

#### Time Complexity
- **Time**: O(V + E)
- **Space**: O(V) for recursion stack/visited set

#### Recursive Implementation

```typescript
function dfs<T>(
    graph: Graph<T>,
    start: T,
    visited: Set<T> = new Set(),
    result: T[] = []
): T[] {
    visited.add(start);
    result.push(start);

    for (const neighbor of graph.getNeighbors(start)) {
        if (!visited.has(neighbor)) {
            dfs(graph, neighbor, visited, result);
        }
    }

    return result;
}

// Traverse all components
function dfsAll<T>(graph: Graph<T>): T[] {
    const visited = new Set<T>();
    const result: T[] = [];

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            dfs(graph, vertex, visited, result);
        }
    }

    return result;
}

// Usage
console.log(dfs(graph, 'A')); // ['A', 'B', 'D', 'E', 'C']
```

#### Iterative Implementation

```typescript
function dfsIterative<T>(graph: Graph<T>, start: T): T[] {
    const visited = new Set<T>();
    const stack: T[] = [start];
    const result: T[] = [];

    while (stack.length > 0) {
        const vertex = stack.pop()!;

        if (visited.has(vertex)) {
            continue;
        }

        visited.add(vertex);
        result.push(vertex);

        // Add neighbors in reverse to maintain left-to-right order
        const neighbors = graph.getNeighbors(vertex);
        for (let i = neighbors.length - 1; i >= 0; i--) {
            if (!visited.has(neighbors[i])) {
                stack.push(neighbors[i]);
            }
        }
    }

    return result;
}
```

#### DFS for Path Finding

```typescript
function findPath<T>(
    graph: Graph<T>,
    start: T,
    target: T,
    visited: Set<T> = new Set(),
    path: T[] = []
): T[] | null {
    visited.add(start);
    path.push(start);

    if (start === target) {
        return path;
    }

    for (const neighbor of graph.getNeighbors(start)) {
        if (!visited.has(neighbor)) {
            const result = findPath(graph, neighbor, target, visited, [...path]);
            if (result) {
                return result;
            }
        }
    }

    return null;
}

// Usage
console.log(findPath(graph, 'A', 'E')); // ['A', 'B', 'D', 'E']
```

## Shortest Path Algorithms

### Dijkstra's Algorithm

**Dijkstra's** finds the shortest path from a source to all vertices in a weighted graph with non-negative weights.

#### Time Complexity
- **Time**: O((V + E) log V) with min-heap
- **Space**: O(V)

#### Implementation

```typescript
interface WeightedEdge<T> {
    destination: T;
    weight: number;
}

function dijkstra<T>(
    graph: Map<T, WeightedEdge<T>[]>,
    start: T
): Map<T, { distance: number; previous: T | null }> {
    const distances = new Map<T, { distance: number; previous: T | null }>();
    const visited = new Set<T>();
    
    // Priority queue: [vertex, distance]
    const pq: Array<[T, number]> = [[start, 0]];

    // Initialize distances
    for (const vertex of graph.keys()) {
        distances.set(vertex, {
            distance: vertex === start ? 0 : Infinity,
            previous: null
        });
    }

    while (pq.length > 0) {
        // Get vertex with minimum distance
        pq.sort((a, b) => a[1] - b[1]);
        const [currentVertex, currentDistance] = pq.shift()!;

        if (visited.has(currentVertex)) {
            continue;
        }

        visited.add(currentVertex);

        const neighbors = graph.get(currentVertex) || [];
        for (const { destination, weight } of neighbors) {
            if (visited.has(destination)) {
                continue;
            }

            const newDistance = currentDistance + weight;
            const currentInfo = distances.get(destination)!;

            if (newDistance < currentInfo.distance) {
                currentInfo.distance = newDistance;
                currentInfo.previous = currentVertex;
                pq.push([destination, newDistance]);
            }
        }
    }

    return distances;
}

// Reconstruct path
function getShortestPath<T>(
    distances: Map<T, { distance: number; previous: T | null }>,
    target: T
): T[] {
    const path: T[] = [];
    let current: T | null = target;

    while (current !== null) {
        path.unshift(current);
        current = distances.get(current)?.previous || null;
    }

    return path;
}

// Usage
const weightedGraph = new Map<string, WeightedEdge<string>[]>();
weightedGraph.set('A', [
    { destination: 'B', weight: 4 },
    { destination: 'C', weight: 2 }
]);
weightedGraph.set('B', [{ destination: 'D', weight: 3 }]);
weightedGraph.set('C', [
    { destination: 'B', weight: 1 },
    { destination: 'D', weight: 5 }
]);
weightedGraph.set('D', []);

const distances = dijkstra(weightedGraph, 'A');
console.log(distances.get('D')?.distance); // 6
console.log(getShortestPath(distances, 'D')); // ['A', 'C', 'B', 'D']
```

### Bellman-Ford Algorithm

**Bellman-Ford** finds shortest paths even with negative edge weights and can detect negative cycles.

#### Time Complexity
- **Time**: O(V × E)
- **Space**: O(V)

#### Implementation

```typescript
interface Edge<T> {
    source: T;
    destination: T;
    weight: number;
}

function bellmanFord<T>(
    vertices: T[],
    edges: Edge<T>[],
    start: T
): Map<T, number> | null {
    const distances = new Map<T, number>();

    // Initialize distances
    for (const vertex of vertices) {
        distances.set(vertex, vertex === start ? 0 : Infinity);
    }

    // Relax edges V-1 times
    for (let i = 0; i < vertices.length - 1; i++) {
        for (const { source, destination, weight } of edges) {
            const sourceDistance = distances.get(source)!;
            const destDistance = distances.get(destination)!;

            if (sourceDistance + weight < destDistance) {
                distances.set(destination, sourceDistance + weight);
            }
        }
    }

    // Check for negative cycles
    for (const { source, destination, weight } of edges) {
        const sourceDistance = distances.get(source)!;
        const destDistance = distances.get(destination)!;

        if (sourceDistance + weight < destDistance) {
            return null; // Negative cycle detected
        }
    }

    return distances;
}
```

### Floyd-Warshall Algorithm

**Floyd-Warshall** finds shortest paths between all pairs of vertices.

#### Time Complexity
- **Time**: O(V³)
- **Space**: O(V²)

#### Implementation

```typescript
function floydWarshall(
    vertices: string[],
    edges: Array<[string, string, number]>
): Map<string, Map<string, number>> {
    const dist = new Map<string, Map<string, number>>();

    // Initialize distances
    for (const v1 of vertices) {
        dist.set(v1, new Map());
        for (const v2 of vertices) {
            dist.get(v1)!.set(v2, v1 === v2 ? 0 : Infinity);
        }
    }

    // Set edge weights
    for (const [source, dest, weight] of edges) {
        dist.get(source)!.set(dest, weight);
    }

    // Floyd-Warshall
    for (const k of vertices) {
        for (const i of vertices) {
            for (const j of vertices) {
                const throughK = dist.get(i)!.get(k)! + dist.get(k)!.get(j)!;
                const current = dist.get(i)!.get(j)!;

                if (throughK < current) {
                    dist.get(i)!.set(j, throughK);
                }
            }
        }
    }

    return dist;
}
```

## Topological Sort

**Topological sort** orders vertices in a Directed Acyclic Graph (DAG) such that for every edge (u, v), u comes before v.

#### Time Complexity
- **Time**: O(V + E)
- **Space**: O(V)

### Kahn's Algorithm (BFS-based)

```typescript
function topologicalSortKahn<T>(graph: Graph<T>): T[] | null {
    const inDegree = new Map<T, number>();
    const vertices = graph.getVertices();

    // Initialize in-degrees
    for (const vertex of vertices) {
        inDegree.set(vertex, 0);
    }

    // Calculate in-degrees
    for (const vertex of vertices) {
        for (const neighbor of graph.getNeighbors(vertex)) {
            inDegree.set(neighbor, inDegree.get(neighbor)! + 1);
        }
    }

    // Queue vertices with in-degree 0
    const queue: T[] = [];
    for (const [vertex, degree] of inDegree) {
        if (degree === 0) {
            queue.push(vertex);
        }
    }

    const result: T[] = [];

    while (queue.length > 0) {
        const vertex = queue.shift()!;
        result.push(vertex);

        // Reduce in-degree for neighbors
        for (const neighbor of graph.getNeighbors(vertex)) {
            const newDegree = inDegree.get(neighbor)! - 1;
            inDegree.set(neighbor, newDegree);

            if (newDegree === 0) {
                queue.push(neighbor);
            }
        }
    }

    // Check if all vertices processed (no cycles)
    return result.length === vertices.length ? result : null;
}

// Usage
const dag = new Graph<string>(true);
dag.addVertex('A');
dag.addVertex('B');
dag.addVertex('C');
dag.addVertex('D');
dag.addEdge('A', 'B');
dag.addEdge('A', 'C');
dag.addEdge('B', 'D');
dag.addEdge('C', 'D');

console.log(topologicalSortKahn(dag)); // ['A', 'B', 'C', 'D'] or ['A', 'C', 'B', 'D']
```

### DFS-based Topological Sort

```typescript
function topologicalSortDFS<T>(graph: Graph<T>): T[] | null {
    const visited = new Set<T>();
    const recursionStack = new Set<T>();
    const result: T[] = [];

    function dfs(vertex: T): boolean {
        visited.add(vertex);
        recursionStack.add(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                if (!dfs(neighbor)) {
                    return false; // Cycle detected
                }
            } else if (recursionStack.has(neighbor)) {
                return false; // Cycle detected
            }
        }

        recursionStack.delete(vertex);
        result.unshift(vertex); // Add to front
        return true;
    }

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            if (!dfs(vertex)) {
                return null; // Graph has cycle
            }
        }
    }

    return result;
}
```

## Cycle Detection

### Detect Cycle in Undirected Graph

```typescript
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
                return true; // Found back edge (cycle)
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
```

### Detect Cycle in Directed Graph

```typescript
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
                return true; // Back edge to ancestor (cycle)
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

## Connected Components

### Find All Connected Components

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
```

### Strongly Connected Components (Kosaraju's Algorithm)

```typescript
function stronglyConnectedComponents<T>(graph: Graph<T>): T[][] {
    const visited = new Set<T>();
    const stack: T[] = [];

    // First DFS to fill stack
    function dfs1(vertex: T): void {
        visited.add(vertex);

        for (const neighbor of graph.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                dfs1(neighbor);
            }
        }

        stack.push(vertex);
    }

    for (const vertex of graph.getVertices()) {
        if (!visited.has(vertex)) {
            dfs1(vertex);
        }
    }

    // Transpose graph
    const transposed = new Graph<T>(true);
    for (const vertex of graph.getVertices()) {
        transposed.addVertex(vertex);
    }
    for (const vertex of graph.getVertices()) {
        for (const neighbor of graph.getNeighbors(vertex)) {
            transposed.addEdge(neighbor, vertex); // Reverse edge
        }
    }

    // Second DFS on transposed graph
    visited.clear();
    const components: T[][] = [];

    function dfs2(vertex: T, component: T[]): void {
        visited.add(vertex);
        component.push(vertex);

        for (const neighbor of transposed.getNeighbors(vertex)) {
            if (!visited.has(neighbor)) {
                dfs2(neighbor, component);
            }
        }
    }

    while (stack.length > 0) {
        const vertex = stack.pop()!;
        if (!visited.has(vertex)) {
            const component: T[] = [];
            dfs2(vertex, component);
            components.push(component);
        }
    }

    return components;
}
```

## Minimum Spanning Tree

### Prim's Algorithm

```typescript
function primMST<T>(
    graph: Map<T, WeightedEdge<T>[]>,
    start: T
): Array<[T, T, number]> {
    const visited = new Set<T>([start]);
    const mst: Array<[T, T, number]> = [];
    const pq: Array<[T, T, number]> = []; // [from, to, weight]

    // Add all edges from start
    for (const { destination, weight } of graph.get(start) || []) {
        pq.push([start, destination, weight]);
    }

    while (pq.length > 0 && visited.size < graph.size) {
        // Get minimum weight edge
        pq.sort((a, b) => a[2] - b[2]);
        const [from, to, weight] = pq.shift()!;

        if (visited.has(to)) {
            continue;
        }

        visited.add(to);
        mst.push([from, to, weight]);

        // Add edges from newly added vertex
        for (const { destination, weight: w } of graph.get(to) || []) {
            if (!visited.has(destination)) {
                pq.push([to, destination, w]);
            }
        }
    }

    return mst;
}
```

### Kruskal's Algorithm

```typescript
class UnionFind<T> {
    private parent: Map<T, T>;
    private rank: Map<T, number>;

    constructor(vertices: T[]) {
        this.parent = new Map();
        this.rank = new Map();

        for (const v of vertices) {
            this.parent.set(v, v);
            this.rank.set(v, 0);
        }
    }

    find(x: T): T {
        if (this.parent.get(x) !== x) {
            this.parent.set(x, this.find(this.parent.get(x)!));
        }
        return this.parent.get(x)!;
    }

    union(x: T, y: T): boolean {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) {
            return false;
        }

        const rankX = this.rank.get(rootX)!;
        const rankY = this.rank.get(rootY)!;

        if (rankX < rankY) {
            this.parent.set(rootX, rootY);
        } else if (rankX > rankY) {
            this.parent.set(rootY, rootX);
        } else {
            this.parent.set(rootY, rootX);
            this.rank.set(rootX, rankX + 1);
        }

        return true;
    }
}

function kruskalMST<T>(
    vertices: T[],
    edges: Array<[T, T, number]>
): Array<[T, T, number]> {
    // Sort edges by weight
    edges.sort((a, b) => a[2] - b[2]);

    const uf = new UnionFind(vertices);
    const mst: Array<[T, T, number]> = [];

    for (const [from, to, weight] of edges) {
        if (uf.union(from, to)) {
            mst.push([from, to, weight]);
        }

        if (mst.length === vertices.length - 1) {
            break;
        }
    }

    return mst;
}
```

## Real-World Applications

### 1. Maze Solver

```typescript
function solveMaze(
    maze: number[][],
    start: [number, number],
    end: [number, number]
): [number, number][] | null {
    const rows = maze.length;
    const cols = maze[0].length;
    const visited = new Set<string>();
    
    const key = (r: number, c: number) => `${r},${c}`;
    const [startR, startC] = start;
    const [endR, endC] = end;

    const queue: Array<{ pos: [number, number]; path: [number, number][] }> = [
        { pos: start, path: [start] }
    ];
    visited.add(key(startR, startC));

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
        const { pos: [r, c], path } = queue.shift()!;

        if (r === endR && c === endC) {
            return path;
        }

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            if (
                nr >= 0 && nr < rows &&
                nc >= 0 && nc < cols &&
                maze[nr][nc] === 0 &&
                !visited.has(key(nr, nc))
            ) {
                visited.add(key(nr, nc));
                queue.push({
                    pos: [nr, nc],
                    path: [...path, [nr, nc]]
                });
            }
        }
    }

    return null;
}
```

### 2. Word Ladder

```typescript
function wordLadder(
    beginWord: string,
    endWord: string,
    wordList: string[]
): number {
    const wordSet = new Set(wordList);
    
    if (!wordSet.has(endWord)) {
        return 0;
    }

    const queue: Array<[string, number]> = [[beginWord, 1]];
    const visited = new Set<string>([beginWord]);

    while (queue.length > 0) {
        const [word, steps] = queue.shift()!;

        if (word === endWord) {
            return steps;
        }

        // Try changing each letter
        for (let i = 0; i < word.length; i++) {
            for (let c = 97; c <= 122; c++) { // a-z
                const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1);

                if (wordSet.has(newWord) && !visited.has(newWord)) {
                    visited.add(newWord);
                    queue.push([newWord, steps + 1]);
                }
            }
        }
    }

    return 0;
}
```

## Summary

**Graph algorithms** enable powerful operations on connected data:

1. **Traversal**: BFS (level-order, shortest path), DFS (deep exploration)
2. **Shortest Path**: Dijkstra (non-negative), Bellman-Ford (negative weights), Floyd-Warshall (all pairs)
3. **Topological Sort**: Order dependencies (Kahn's, DFS-based)
4. **Cycle Detection**: Undirected (parent tracking), Directed (recursion stack)
5. **Connected Components**: Find separate networks
6. **Minimum Spanning Tree**: Prim's, Kruskal's

**Algorithm Selection Guide**:
- **Shortest Path Unweighted** → BFS
- **Shortest Path Weighted** → Dijkstra (non-negative) or Bellman-Ford
- **All Pairs Shortest Path** → Floyd-Warshall
- **Find Path** → DFS or BFS
- **Detect Cycle** → DFS with tracking
- **Order Dependencies** → Topological Sort
- **Minimum Spanning Tree** → Prim's or Kruskal's

**Remember**: Choose the right algorithm based on graph properties (directed/undirected, weighted/unweighted, dense/sparse) and problem requirements. Understanding time complexity helps optimize for large graphs.

---

**Next**: Explore [Advanced Structures](../05-advanced.md) for bloom filters, union-find, and segment trees, or review [Graphs](./graphs.md) for representation fundamentals.
