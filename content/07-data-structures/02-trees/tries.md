# Tries (Prefix Trees)

## What is a Trie?

A **Trie** (pronounced "try"), also called a **prefix tree** or **digital tree**, is a tree-based data structure that stores strings in a way that enables fast prefix-based operations. Each path from the root to a node represents a string prefix, and words are typically marked at their ending nodes.

### Structure

```
         root
        /  |  \
       c   a   t
      /    |    \
     a     p    e
    /      |     \
   t      p      a
(cat)    / \      \
        l   y      m
       /     \      \
     e        (app) (tea)
    /
  (apple)

Words: cat, app, apple, tea, team
```

Each node contains:
- **Children**: Map or array of child nodes (26 for lowercase letters)
- **isEndOfWord**: Boolean marking if a word ends at this node
- **Optional**: Value/data associated with the word

## Why Tries Matter

Tries are crucial because they:

1. **Fast Prefix Operations**: O(m) where m is string length, regardless of dictionary size
2. **Autocomplete**: Efficiently find all words with a given prefix
3. **Spell Checking**: Quick word validation and suggestions
4. **IP Routing**: Longest prefix matching in network routers
5. **Text Prediction**: T9 predictive text, search suggestions
6. **Dictionary Operations**: Add, search, and prefix query in one structure

## Time Complexity

| Operation          | Time Complexity | Description                       |
|--------------------|-----------------|-----------------------------------|
| Insert             | O(m)            | m = length of string              |
| Search             | O(m)            | Check if word exists              |
| StartsWith (Prefix)| O(m)            | Check if prefix exists            |
| Delete             | O(m)            | Remove word from trie             |
| Auto-complete      | O(p + n)        | p = prefix length, n = results    |
| All Words          | O(n)            | n = total characters in all words |

**Space Complexity**: O(ALPHABET_SIZE × N × M) worst case, where N is number of keys and M is average length. In practice, much better due to shared prefixes.

## Basic Trie Implementation

### Trie Node

```typescript
class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    value?: any; // Optional: store associated data

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
    }
}
```

### Trie Class

```typescript
class Trie {
    private root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    // Insert a word
    insert(word: string, value?: any): void {
        let node = this.root;

        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }

        node.isEndOfWord = true;
        if (value !== undefined) {
            node.value = value;
        }
    }

    // Search for exact word
    search(word: string): boolean {
        const node = this.findNode(word);
        return node !== null && node.isEndOfWord;
    }

    // Check if any word starts with prefix
    startsWith(prefix: string): boolean {
        return this.findNode(prefix) !== null;
    }

    // Helper: find node for given string
    private findNode(str: string): TrieNode | null {
        let node = this.root;

        for (const char of str) {
            if (!node.children.has(char)) {
                return null;
            }
            node = node.children.get(char)!;
        }

        return node;
    }

    // Delete a word
    delete(word: string): boolean {
        return this.deleteHelper(this.root, word, 0);
    }

    private deleteHelper(node: TrieNode, word: string, index: number): boolean {
        if (index === word.length) {
            // Check if word exists
            if (!node.isEndOfWord) {
                return false;
            }

            node.isEndOfWord = false;

            // Delete node if it has no children
            return node.children.size === 0;
        }

        const char = word[index];
        const childNode = node.children.get(char);

        if (!childNode) {
            return false;
        }

        const shouldDeleteChild = this.deleteHelper(childNode, word, index + 1);

        if (shouldDeleteChild) {
            node.children.delete(char);
            // Delete current node if it's not end of another word and has no children
            return node.children.size === 0 && !node.isEndOfWord;
        }

        return false;
    }

    // Get all words in trie
    getAllWords(): string[] {
        const words: string[] = [];
        this.collectWords(this.root, '', words);
        return words;
    }

    private collectWords(node: TrieNode, prefix: string, words: string[]): void {
        if (node.isEndOfWord) {
            words.push(prefix);
        }

        for (const [char, childNode] of node.children) {
            this.collectWords(childNode, prefix + char, words);
        }
    }
}
```

### Usage Example

```typescript
const trie = new Trie();

// Insert words
trie.insert('cat');
trie.insert('cats');
trie.insert('dog');
trie.insert('dodge');
trie.insert('door');

// Search
console.log(trie.search('cat'));      // true
console.log(trie.search('ca'));       // false (not a complete word)

// Check prefix
console.log(trie.startsWith('ca'));   // true
console.log(trie.startsWith('do'));   // true
console.log(trie.startsWith('bird')); // false

// Get all words
console.log(trie.getAllWords());      
// ['cat', 'cats', 'dog', 'dodge', 'door']

// Delete
trie.delete('dog');
console.log(trie.search('dog'));      // false
console.log(trie.search('dodge'));    // true (still exists)
```

## Advanced Trie Operations

### Auto-Complete (Find Words with Prefix)

```typescript
class Trie {
    // ... previous methods ...

    autoComplete(prefix: string, limit: number = 10): string[] {
        const node = this.findNode(prefix);
        if (!node) {
            return [];
        }

        const results: string[] = [];
        this.collectWordsWithLimit(node, prefix, results, limit);
        return results;
    }

    private collectWordsWithLimit(
        node: TrieNode,
        prefix: string,
        results: string[],
        limit: number
    ): void {
        if (results.length >= limit) {
            return;
        }

        if (node.isEndOfWord) {
            results.push(prefix);
        }

        for (const [char, childNode] of node.children) {
            this.collectWordsWithLimit(childNode, prefix + char, results, limit);
            if (results.length >= limit) {
                break;
            }
        }
    }
}

// Usage
const trie = new Trie();
['apple', 'app', 'application', 'apply', 'ape', 'apex'].forEach(word => 
    trie.insert(word)
);

console.log(trie.autoComplete('app', 3));
// ['app', 'apple', 'application']
```

### Longest Common Prefix

```typescript
class Trie {
    // ... previous methods ...

    longestCommonPrefix(): string {
        let prefix = '';
        let node = this.root;

        while (node.children.size === 1 && !node.isEndOfWord) {
            const [char, childNode] = node.children.entries().next().value;
            prefix += char;
            node = childNode;
        }

        return prefix;
    }
}

// Usage
const trie = new Trie();
['flower', 'flow', 'flight'].forEach(word => trie.insert(word));
console.log(trie.longestCommonPrefix()); // 'fl'
```

### Word Search with Wildcards

```typescript
class Trie {
    // ... previous methods ...

    searchWithWildcard(pattern: string): boolean {
        return this.searchWildcardHelper(this.root, pattern, 0);
    }

    private searchWildcardHelper(
        node: TrieNode,
        pattern: string,
        index: number
    ): boolean {
        if (index === pattern.length) {
            return node.isEndOfWord;
        }

        const char = pattern[index];

        if (char === '.') {
            // Wildcard: try all children
            for (const childNode of node.children.values()) {
                if (this.searchWildcardHelper(childNode, pattern, index + 1)) {
                    return true;
                }
            }
            return false;
        } else {
            // Regular character
            const childNode = node.children.get(char);
            if (!childNode) {
                return false;
            }
            return this.searchWildcardHelper(childNode, pattern, index + 1);
        }
    }
}

// Usage
const trie = new Trie();
['bad', 'dad', 'mad'].forEach(word => trie.insert(word));

console.log(trie.searchWithWildcard('.ad')); // true (matches bad, dad, mad)
console.log(trie.searchWithWildcard('b.d')); // true (matches bad)
console.log(trie.searchWithWildcard('..d')); // true (matches bad, dad, mad)
```

### Count Words with Prefix

```typescript
class Trie {
    // ... previous methods ...

    countWordsWithPrefix(prefix: string): number {
        const node = this.findNode(prefix);
        if (!node) {
            return 0;
        }

        return this.countWords(node);
    }

    private countWords(node: TrieNode): number {
        let count = node.isEndOfWord ? 1 : 0;

        for (const childNode of node.children.values()) {
            count += this.countWords(childNode);
        }

        return count;
    }
}

// Usage
const trie = new Trie();
['app', 'apple', 'application', 'apply', 'banana'].forEach(word => 
    trie.insert(word)
);

console.log(trie.countWordsWithPrefix('app')); // 4
console.log(trie.countWordsWithPrefix('ba'));  // 1
```

### Trie with Frequency

```typescript
class TrieNodeWithFreq {
    children: Map<string, TrieNodeWithFreq>;
    frequency: number;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map();
        this.frequency = 0;
        this.isEndOfWord = false;
    }
}

class TrieWithFrequency {
    private root: TrieNodeWithFreq;

    constructor() {
        this.root = new TrieNodeWithFreq();
    }

    insert(word: string): void {
        let node = this.root;

        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNodeWithFreq());
            }
            node = node.children.get(char)!;
        }

        node.isEndOfWord = true;
        node.frequency++;
    }

    getMostFrequent(prefix: string, limit: number = 5): string[] {
        const node = this.findNode(prefix);
        if (!node) {
            return [];
        }

        const words: Array<{ word: string; freq: number }> = [];
        this.collectWordsWithFreq(node, prefix, words);

        // Sort by frequency (descending) and return top results
        return words
            .sort((a, b) => b.freq - a.freq)
            .slice(0, limit)
            .map(item => item.word);
    }

    private findNode(str: string): TrieNodeWithFreq | null {
        let node = this.root;

        for (const char of str) {
            if (!node.children.has(char)) {
                return null;
            }
            node = node.children.get(char)!;
        }

        return node;
    }

    private collectWordsWithFreq(
        node: TrieNodeWithFreq,
        prefix: string,
        words: Array<{ word: string; freq: number }>
    ): void {
        if (node.isEndOfWord) {
            words.push({ word: prefix, freq: node.frequency });
        }

        for (const [char, childNode] of node.children) {
            this.collectWordsWithFreq(childNode, prefix + char, words);
        }
    }
}

// Usage
const freqTrie = new TrieWithFrequency();
freqTrie.insert('app');
freqTrie.insert('app');
freqTrie.insert('apple');
freqTrie.insert('apple');
freqTrie.insert('apple');
freqTrie.insert('application');

console.log(freqTrie.getMostFrequent('app', 3));
// ['apple', 'app', 'application'] (sorted by frequency)
```

## Trie Variants

### Compressed Trie (Radix Tree/Patricia Trie)

```typescript
class RadixNode {
    children: Map<string, RadixNode>;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
    }
}

class RadixTree {
    private root: RadixNode;

    constructor() {
        this.root = new RadixNode();
    }

    insert(word: string): void {
        this.insertHelper(this.root, word, 0);
    }

    private insertHelper(node: RadixNode, word: string, start: number): void {
        if (start === word.length) {
            node.isEndOfWord = true;
            return;
        }

        // Find matching edge
        for (const [edge, childNode] of node.children) {
            const commonLength = this.getCommonPrefixLength(
                word.substring(start),
                edge
            );

            if (commonLength > 0) {
                if (commonLength === edge.length) {
                    // Full edge match, continue down
                    this.insertHelper(childNode, word, start + commonLength);
                } else {
                    // Partial match, split edge
                    this.splitEdge(node, edge, childNode, commonLength, word, start);
                }
                return;
            }
        }

        // No match, create new edge
        const newNode = new RadixNode();
        node.children.set(word.substring(start), newNode);
        newNode.isEndOfWord = true;
    }

    private getCommonPrefixLength(str1: string, str2: string): number {
        let i = 0;
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
            i++;
        }
        return i;
    }

    private splitEdge(
        parent: RadixNode,
        edge: string,
        child: RadixNode,
        commonLength: number,
        word: string,
        start: number
    ): void {
        // Create intermediate node
        const intermediateNode = new RadixNode();
        const commonPrefix = edge.substring(0, commonLength);
        const remainingEdge = edge.substring(commonLength);
        const remainingWord = word.substring(start + commonLength);

        // Update parent
        parent.children.delete(edge);
        parent.children.set(commonPrefix, intermediateNode);

        // Add original child
        intermediateNode.children.set(remainingEdge, child);

        // Add new word branch
        if (remainingWord.length > 0) {
            const newNode = new RadixNode();
            newNode.isEndOfWord = true;
            intermediateNode.children.set(remainingWord, newNode);
        } else {
            intermediateNode.isEndOfWord = true;
        }
    }

    search(word: string): boolean {
        return this.searchHelper(this.root, word, 0);
    }

    private searchHelper(node: RadixNode, word: string, start: number): boolean {
        if (start === word.length) {
            return node.isEndOfWord;
        }

        for (const [edge, childNode] of node.children) {
            if (word.substring(start).startsWith(edge)) {
                return this.searchHelper(childNode, word, start + edge.length);
            }
        }

        return false;
    }
}

// Usage: More space-efficient for long common prefixes
const radix = new RadixTree();
radix.insert('romane');
radix.insert('romanus');
radix.insert('romulus');
radix.insert('rubens');
radix.insert('ruber');
radix.insert('rubicon');
radix.insert('rubicundus');
```

### Suffix Trie

```typescript
class SuffixTrie {
    private trie: Trie;

    constructor(text: string) {
        this.trie = new Trie();
        this.buildSuffixTrie(text);
    }

    private buildSuffixTrie(text: string): void {
        for (let i = 0; i < text.length; i++) {
            this.trie.insert(text.substring(i));
        }
    }

    contains(pattern: string): boolean {
        return this.trie.startsWith(pattern);
    }

    findAllOccurrences(pattern: string): number[] {
        // Returns starting indices of all occurrences
        // Simplified implementation
        return [];
    }
}

// Usage: Efficient substring search
const suffixTrie = new SuffixTrie('banana');
console.log(suffixTrie.contains('ana'));    // true
console.log(suffixTrie.contains('nana'));   // true
console.log(suffixTrie.contains('apple'));  // false
```

## Real-World Applications

### 1. Search Autocomplete System

```typescript
class SearchAutocomplete {
    private trie: TrieWithFrequency;
    private maxSuggestions: number;

    constructor(maxSuggestions: number = 5) {
        this.trie = new TrieWithFrequency();
        this.maxSuggestions = maxSuggestions;
    }

    recordSearch(query: string): void {
        this.trie.insert(query.toLowerCase());
    }

    getSuggestions(prefix: string): string[] {
        return this.trie.getMostFrequent(
            prefix.toLowerCase(),
            this.maxSuggestions
        );
    }
}

// Usage
const autocomplete = new SearchAutocomplete(3);

// Simulate user searches
autocomplete.recordSearch('javascript');
autocomplete.recordSearch('javascript tutorial');
autocomplete.recordSearch('javascript');
autocomplete.recordSearch('java');
autocomplete.recordSearch('java programming');

console.log(autocomplete.getSuggestions('java'));
// ['javascript', 'java', 'javascript tutorial'] (by frequency)
```

### 2. Spell Checker

```typescript
class SpellChecker {
    private dictionary: Trie;

    constructor(words: string[]) {
        this.dictionary = new Trie();
        words.forEach(word => this.dictionary.insert(word.toLowerCase()));
    }

    isCorrect(word: string): boolean {
        return this.dictionary.search(word.toLowerCase());
    }

    getSuggestions(word: string): string[] {
        const lowerWord = word.toLowerCase();

        // First try: exact match
        if (this.isCorrect(lowerWord)) {
            return [lowerWord];
        }

        const suggestions: string[] = [];

        // Try single character edits
        suggestions.push(...this.getSingleEditSuggestions(lowerWord));

        return [...new Set(suggestions)].slice(0, 5);
    }

    private getSingleEditSuggestions(word: string): string[] {
        const suggestions: string[] = [];
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';

        // Insertions
        for (let i = 0; i <= word.length; i++) {
            for (const char of alphabet) {
                const newWord = word.slice(0, i) + char + word.slice(i);
                if (this.isCorrect(newWord)) {
                    suggestions.push(newWord);
                }
            }
        }

        // Deletions
        for (let i = 0; i < word.length; i++) {
            const newWord = word.slice(0, i) + word.slice(i + 1);
            if (this.isCorrect(newWord)) {
                suggestions.push(newWord);
            }
        }

        // Substitutions
        for (let i = 0; i < word.length; i++) {
            for (const char of alphabet) {
                const newWord = word.slice(0, i) + char + word.slice(i + 1);
                if (this.isCorrect(newWord)) {
                    suggestions.push(newWord);
                }
            }
        }

        return suggestions;
    }
}

// Usage
const checker = new SpellChecker(['hello', 'world', 'help', 'held', 'helm']);
console.log(checker.isCorrect('hello'));         // true
console.log(checker.isCorrect('helo'));          // false
console.log(checker.getSuggestions('helo'));     // ['hello', 'help', 'held']
```

### 3. IP Router (Longest Prefix Matching)

```typescript
interface Route {
    destination: string;
    nextHop: string;
}

class IPRouter {
    private trie: Trie;

    constructor() {
        this.trie = new Trie();
    }

    addRoute(ipPrefix: string, nextHop: string): void {
        this.trie.insert(ipPrefix, nextHop);
    }

    findRoute(ipAddress: string): string | null {
        let longestMatch: string | null = null;
        let node: any = (this.trie as any).root;

        for (const char of ipAddress) {
            if (!node.children.has(char)) {
                break;
            }

            node = node.children.get(char);

            if (node.isEndOfWord) {
                longestMatch = node.value;
            }
        }

        return longestMatch;
    }
}

// Usage
const router = new IPRouter();
router.addRoute('192.168', 'Gateway1');
router.addRoute('192.168.1', 'Gateway2');
router.addRoute('192.168.1.1', 'Gateway3');

console.log(router.findRoute('192.168.1.100'));   // 'Gateway2'
console.log(router.findRoute('192.168.1.1'));     // 'Gateway3'
console.log(router.findRoute('192.168.5.1'));     // 'Gateway1'
```

### 4. Contact Search (T9 Predictive Text)

```typescript
class T9Search {
    private trie: Trie;
    private keyMap: Map<string, string[]>;

    constructor() {
        this.trie = new Trie();
        this.keyMap = new Map([
            ['2', ['a', 'b', 'c']],
            ['3', ['d', 'e', 'f']],
            ['4', ['g', 'h', 'i']],
            ['5', ['j', 'k', 'l']],
            ['6', ['m', 'n', 'o']],
            ['7', ['p', 'q', 'r', 's']],
            ['8', ['t', 'u', 'v']],
            ['9', ['w', 'x', 'y', 'z']]
        ]);
    }

    addContact(name: string): void {
        const digitSequence = this.nameToDigits(name);
        this.trie.insert(digitSequence, name);
    }

    private nameToDigits(name: string): string {
        const digits: string[] = [];

        for (const char of name.toLowerCase()) {
            for (const [digit, letters] of this.keyMap) {
                if (letters.includes(char)) {
                    digits.push(digit);
                    break;
                }
            }
        }

        return digits.join('');
    }

    searchByDigits(digits: string): string[] {
        // Find all contacts matching digit sequence
        const results: string[] = [];
        const node = (this.trie as any).findNode(digits);

        if (node) {
            this.collectValues(node, results);
        }

        return results;
    }

    private collectValues(node: any, results: string[]): void {
        if (node.isEndOfWord && node.value) {
            results.push(node.value);
        }

        for (const childNode of node.children.values()) {
            this.collectValues(childNode, results);
        }
    }
}

// Usage
const t9 = new T9Search();
t9.addContact('alice');
t9.addContact('bob');
t9.addContact('charlie');

console.log(t9.searchByDigits('2'));     // ['alice']
console.log(t9.searchByDigits('24'));    // ['charlie']
```

## When to Use Tries

### Use Tries When:
- ✅ **Prefix-based search** is common (autocomplete, search suggestions)
- ✅ **Dictionary operations** with many words sharing prefixes
- ✅ **String matching** problems (spell check, pattern matching)
- ✅ **IP routing** or hierarchical key lookups
- ✅ **Word games** (Scrabble validators, Boggle solvers)
- ✅ You need **all words with prefix** efficiently

### Don't Use Tries When:
- ❌ **Simple exact match** → use Hash Table for O(1)
- ❌ **Numeric keys** → not space-efficient
- ❌ **Few strings** → overhead not worth it
- ❌ **Memory is scarce** → tries can use significant memory
- ❌ **Range queries on numbers** → use BST or B-tree

## Common Pitfalls and How to Avoid Them

### 1. Not Marking End of Word

```typescript
// ❌ Wrong: Forgetting to mark word endings
function insert(word: string): void {
    let node = root;
    for (const char of word) {
        if (!node.children.has(char)) {
            node.children.set(char, new TrieNode());
        }
        node = node.children.get(char)!;
    }
    // Missing: node.isEndOfWord = true;
}

// ✅ Correct: Always mark end of word
function insert(word: string): void {
    let node = root;
    for (const char of word) {
        if (!node.children.has(char)) {
            node.children.set(char, new TrieNode());
        }
        node = node.children.get(char)!;
    }
    node.isEndOfWord = true; // Essential!
}
```

### 2. Confusing Search and StartsWith

```typescript
// These are different operations!
console.log(trie.search('app'));      // false (not a complete word)
console.log(trie.startsWith('app'));  // true (prefix exists)

console.log(trie.search('apple'));    // true (complete word)
console.log(trie.startsWith('apple'));// true (prefix exists)
```

### 3. Inefficient Auto-complete Collection

```typescript
// ❌ Wrong: Collecting all words then filtering
function autoComplete(prefix: string): string[] {
    const allWords = trie.getAllWords();
    return allWords.filter(word => word.startsWith(prefix));
    // O(n) where n is total words!
}

// ✅ Correct: Start from prefix node
function autoComplete(prefix: string): string[] {
    const node = trie.findNode(prefix);
    if (!node) return [];
    
    const results: string[] = [];
    collectWords(node, prefix, results);
    return results;
    // O(m) where m is words with prefix
}
```

### 4. Memory Waste with Fixed-Size Arrays

```typescript
// ❌ Wrong: Using fixed array for 26 letters
class TrieNode {
    children: TrieNode[]; // Array of 26

    constructor() {
        this.children = new Array(26).fill(null);
        // Wastes space when most nodes have few children
    }
}

// ✅ Correct: Use Map for sparse children
class TrieNode {
    children: Map<string, TrieNode>;

    constructor() {
        this.children = new Map();
        // Only stores actual children
    }
}
```

### 5. Not Handling Case Sensitivity

```typescript
// ❌ Wrong: Case-sensitive when it shouldn't be
trie.insert('Apple');
console.log(trie.search('apple')); // false

// ✅ Correct: Normalize case
insert(word: string): void {
    this.insertHelper(word.toLowerCase());
}

search(word: string): boolean {
    return this.searchHelper(word.toLowerCase());
}
```

## Summary

**Tries** are specialized tree structures optimized for string operations:

1. **Prefix Tree**: Nodes represent character paths, not individual strings
2. **Time Complexity**: O(m) for operations where m is string length
3. **Core Operations**: Insert, search, startsWith, delete, autocomplete
4. **Space Trade-off**: Uses more memory but enables fast prefix operations
5. **Applications**: Autocomplete, spell checking, IP routing, T9 text
6. **Key Advantage**: Efficient prefix-based queries regardless of dictionary size

Tries excel when:
- You have many strings with common prefixes
- Prefix-based search is frequent
- Autocomplete/suggestions are needed
- Memory is available for the tree structure

**Remember**: Tries trade space for time. They're perfect for prefix operations but overkill for simple exact-match lookups. Use Hash Tables for exact matches, Tries for prefix operations, and consider compressed variants (Radix Trees) when memory is a concern.

---

**Next**: Explore [Hash Tables](../03-hash/hash-tables.md) for O(1) lookups, or review [Binary Trees](../02-trees/binary-trees.md) for tree fundamentals.
