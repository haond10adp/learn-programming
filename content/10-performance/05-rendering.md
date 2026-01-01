# Rendering Performance Optimization

## Understanding Rendering Pipeline

Browser rendering follows this pipeline:

```
JavaScript → Style → Layout → Paint → Composite
```

**Goal**: Minimize reflows (layout) and repaints (paint).

### Critical Rendering Path

```
HTML → DOM Tree
CSS  → CSSOM Tree
         ↓
    Render Tree
         ↓
      Layout
         ↓
       Paint
         ↓
    Composite
```

## React Performance Optimization

### 1. Memoization with React.memo

```typescript
// ============================================
// REACT.MEMO
// ============================================

interface UserCardProps {
    user: User;
    onClick: (id: string) => void;
}

// ❌ Bad: Re-renders on every parent update
function UserCard({ user, onClick }: UserCardProps) {
    console.log('Rendering UserCard:', user.id);
    
    return (
        <div onClick={() => onClick(user.id)}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
        </div>
    );
}

// ✅ Good: Only re-renders when props change
const UserCard = React.memo(({ user, onClick }: UserCardProps) => {
    console.log('Rendering UserCard:', user.id);
    
    return (
        <div onClick={() => onClick(user.id)}>
            <h3>{user.name}</h3>
            <p>{user.email}</p>
        </div>
    );
});

// ✅ Even better: Custom comparison
const UserCard = React.memo(
    ({ user, onClick }: UserCardProps) => {
        return (
            <div onClick={() => onClick(user.id)}>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Return true if props are equal (skip re-render)
        return prevProps.user.id === nextProps.user.id &&
               prevProps.user.name === nextProps.user.name;
    }
);
```

### 2. useMemo for Expensive Calculations

```typescript
// ============================================
// USEMEMO
// ============================================

import { useMemo } from 'react';

// ❌ Bad: Recalculates on every render
function ExpensiveComponent({ items }: { items: Item[] }) {
    // This runs on EVERY render!
    const sortedItems = items
        .sort((a, b) => a.price - b.price)
        .slice(0, 10);
    
    return <List items={sortedItems} />;
}

// ✅ Good: Only recalculates when items change
function ExpensiveComponent({ items }: { items: Item[] }) {
    const sortedItems = useMemo(() => {
        console.log('Sorting items...');
        return items
            .sort((a, b) => a.price - b.price)
            .slice(0, 10);
    }, [items]); // Only recompute when items change
    
    return <List items={sortedItems} />;
}

// Real-world example
function DataDashboard({ data }: { data: DataPoint[] }) {
    const statistics = useMemo(() => {
        console.log('Calculating statistics...');
        
        return {
            mean: calculateMean(data),
            median: calculateMedian(data),
            stdDev: calculateStdDev(data),
            percentiles: calculatePercentiles(data)
        };
    }, [data]);
    
    return (
        <div>
            <Chart data={data} />
            <Stats {...statistics} />
        </div>
    );
}
```

### 3. useCallback for Stable Function References

```typescript
// ============================================
// USECALLBACK
// ============================================

import { useCallback } from 'react';

// ❌ Bad: New function on every render
function Parent() {
    const handleClick = (id: string) => {
        console.log('Clicked:', id);
    };
    
    // Child re-renders even if its props haven't changed
    // because handleClick is a new function each time
    return <Child onClick={handleClick} />;
}

// ✅ Good: Stable function reference
function Parent() {
    const handleClick = useCallback((id: string) => {
        console.log('Clicked:', id);
    }, []); // Empty deps = function never changes
    
    return <Child onClick={handleClick} />;
}

// Real-world example with dependencies
function SearchComponent() {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState<Filters>({});
    
    const handleSearch = useCallback((newQuery: string) => {
        console.log('Searching:', newQuery, filters);
        // Search with current filters
        searchAPI(newQuery, filters);
    }, [filters]); // Recreate only when filters change
    
    return (
        <div>
            <SearchInput onSearch={handleSearch} />
            <Filters onChange={setFilters} />
        </div>
    );
}
```

### 4. Code Splitting and Lazy Loading

```typescript
// ============================================
// CODE SPLITTING
// ============================================

import { lazy, Suspense } from 'react';

// ❌ Bad: Load everything upfront
import HeavyComponent from './HeavyComponent';
import AdminPanel from './AdminPanel';
import Dashboard from './Dashboard';

function App() {
    return (
        <Router>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/heavy" component={HeavyComponent} />
        </Router>
    );
}

// ✅ Good: Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'));
const AdminPanel = lazy(() => import('./AdminPanel'));
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
    return (
        <Router>
            <Suspense fallback={<LoadingSpinner />}>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/admin" component={AdminPanel} />
                <Route path="/heavy" component={HeavyComponent} />
            </Suspense>
        </Router>
    );
}

// ✅ Conditional loading
function ConditionalComponent({ isAdmin }: { isAdmin: boolean }) {
    const AdminPanel = lazy(() => import('./AdminPanel'));
    
    if (!isAdmin) {
        return <div>Access denied</div>;
    }
    
    return (
        <Suspense fallback={<Loading />}>
            <AdminPanel />
        </Suspense>
    );
}
```

### 5. Virtualization for Long Lists

```typescript
// ============================================
// VIRTUALIZATION
// ============================================

// ❌ Bad: Render all 10,000 items
function HugeList({ items }: { items: Item[] }) {
    return (
        <div>
            {items.map(item => (
                <ItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}
// DOM nodes: 10,000 - Very slow!

// ✅ Good: Only render visible items
import { FixedSizeList } from 'react-window';

function VirtualizedList({ items }: { items: Item[] }) {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
        <div style={style}>
            <ItemCard item={items[index]} />
        </div>
    );
    
    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={80}
            width="100%"
        >
            {Row}
        </FixedSizeList>
    );
}
// DOM nodes: ~10 - Very fast!

// ✅ Variable size items
import { VariableSizeList } from 'react-window';

function VariableSizeVirtualList({ items }: { items: Item[] }) {
    const getItemSize = (index: number) => {
        // Calculate height based on content
        return items[index].lines * 20 + 40;
    };
    
    return (
        <VariableSizeList
            height={600}
            itemCount={items.length}
            itemSize={getItemSize}
            width="100%"
        >
            {Row}
        </VariableSizeList>
    );
}
```

### 6. Avoid Inline Functions and Objects

```typescript
// ============================================
// INLINE FUNCTIONS/OBJECTS
// ============================================

// ❌ Bad: New object/function on every render
function Parent() {
    return (
        <Child
            style={{ color: 'red' }}              // New object
            onClick={() => console.log('click')}   // New function
        />
    );
}
// Child re-renders unnecessarily

// ✅ Good: Define outside render
const CHILD_STYLE = { color: 'red' };

function Parent() {
    const handleClick = useCallback(() => {
        console.log('click');
    }, []);
    
    return (
        <Child
            style={CHILD_STYLE}
            onClick={handleClick}
        />
    );
}

// ✅ Alternative: useMemo for dynamic styles
function Parent({ color }: { color: string }) {
    const style = useMemo(() => ({
        color,
        fontSize: '16px',
        fontWeight: 'bold'
    }), [color]);
    
    return <Child style={style} />;
}
```

## DOM Manipulation Optimization

### 1. Batching DOM Updates

```typescript
// ============================================
// BATCH DOM UPDATES
// ============================================

// ❌ Bad: Multiple reflows
function updateListSlow(items: string[]) {
    const list = document.getElementById('list')!;
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li); // Reflow on each append!
    });
}

// ✅ Good: Single reflow
function updateListFast(items: string[]) {
    const list = document.getElementById('list')!;
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        fragment.appendChild(li); // No reflow
    });
    
    list.appendChild(fragment); // Single reflow
}

// ✅ Even better: innerHTML (if safe)
function updateListFastest(items: string[]) {
    const list = document.getElementById('list')!;
    list.innerHTML = items
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');
}
```

### 2. Avoid Layout Thrashing

```typescript
// ============================================
// LAYOUT THRASHING
// ============================================

// ❌ Bad: Read-Write cycle causes multiple reflows
function layoutThrashing(elements: HTMLElement[]) {
    elements.forEach(el => {
        const height = el.offsetHeight;  // READ (forces layout)
        el.style.height = height + 10 + 'px'; // WRITE (invalidates layout)
    });
}
// Causes N reflows!

// ✅ Good: Batch reads, then batch writes
function noLayoutThrashing(elements: HTMLElement[]) {
    // Batch all reads first
    const heights = elements.map(el => el.offsetHeight);
    
    // Then batch all writes
    elements.forEach((el, i) => {
        el.style.height = heights[i] + 10 + 'px';
    });
}
// Causes only 1 reflow!

// ✅ Use requestAnimationFrame for visual updates
function smoothUpdate() {
    requestAnimationFrame(() => {
        // All DOM reads/writes here happen in same frame
        const width = element.offsetWidth;
        element.style.width = width + 10 + 'px';
    });
}
```

### 3. CSS Classes Over Inline Styles

```typescript
// ❌ Bad: Inline styles (multiple reflows)
function animateElementSlow(element: HTMLElement) {
    element.style.width = '100px';
    element.style.height = '100px';
    element.style.backgroundColor = 'red';
    element.style.transform = 'translateX(100px)';
}

// ✅ Good: CSS class (single reflow)
function animateElementFast(element: HTMLElement) {
    element.classList.add('animated-box');
}

// CSS
// .animated-box {
//     width: 100px;
//     height: 100px;
//     background-color: red;
//     transform: translateX(100px);
// }
```

## CSS Performance

### 1. Use Transform and Opacity

```css
/* ❌ Bad: Triggers layout and paint */
.box {
    transition: left 0.3s, top 0.3s, width 0.3s;
}

.box:hover {
    left: 100px;
    top: 100px;
    width: 200px;
}

/* ✅ Good: Only triggers composite (GPU accelerated) */
.box {
    transition: transform 0.3s, opacity 0.3s;
}

.box:hover {
    transform: translate(100px, 100px) scale(2);
    opacity: 0.8;
}
```

### 2. Will-Change for Animations

```css
/* ✅ Tell browser what will animate */
.animated-element {
    will-change: transform, opacity;
}

/* ⚠️  Remove after animation */
.animated-element.done {
    will-change: auto;
}
```

### 3. Avoid Expensive CSS Selectors

```css
/* ❌ Bad: Complex selectors are slow */
body div.container ul li a span.icon {
    color: red;
}

/* ✅ Good: Simple, specific selectors */
.nav-icon {
    color: red;
}
```

## Image Optimization

### 1. Lazy Loading Images

```typescript
// ============================================
// LAZY LOADING
// ============================================

// ✅ Native lazy loading
function ImageGallery({ images }: { images: Image[] }) {
    return (
        <div>
            {images.map(img => (
                <img
                    key={img.id}
                    src={img.url}
                    loading="lazy"  // Native lazy loading!
                    alt={img.alt}
                />
            ))}
        </div>
    );
}

// ✅ Intersection Observer for custom lazy loading
function LazyImage({ src, alt }: { src: string; alt: string }) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setImageSrc(src);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' } // Load 100px before visible
        );
        
        if (imgRef.current) {
            observer.observe(imgRef.current);
        }
        
        return () => observer.disconnect();
    }, [src]);
    
    return (
        <img
            ref={imgRef}
            src={imageSrc || 'placeholder.jpg'}
            alt={alt}
        />
    );
}
```

### 2. Responsive Images

```typescript
// ✅ Use srcset for different screen sizes
function ResponsiveImage({ image }: { image: Image }) {
    return (
        <img
            src={image.url}
            srcSet={`
                ${image.small} 400w,
                ${image.medium} 800w,
                ${image.large} 1200w
            `}
            sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
            alt={image.alt}
        />
    );
}
```

## Web Vitals Optimization

### 1. First Contentful Paint (FCP)

```typescript
// ✅ Optimize FCP
// 1. Inline critical CSS
// 2. Defer non-critical JS
// 3. Preload key resources

// HTML
// <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
// <script defer src="/app.js"></script>
```

### 2. Largest Contentful Paint (LCP)

```typescript
// ✅ Optimize LCP
// 1. Optimize images (WebP, compression)
// 2. Preload LCP element
// 3. Use CDN for static assets

// HTML
// <link rel="preload" href="/hero-image.webp" as="image">
```

### 3. Cumulative Layout Shift (CLS)

```typescript
// ❌ Bad: No dimensions cause layout shift
function ImageWithShift() {
    return <img src="/image.jpg" alt="Image" />;
}

// ✅ Good: Reserve space with dimensions
function ImageNoShift() {
    return (
        <img
            src="/image.jpg"
            alt="Image"
            width={800}
            height={600}
            style={{ aspectRatio: '4/3' }}
        />
    );
}

// ✅ Reserve space for dynamic content
function DynamicContent() {
    const [data, setData] = useState(null);
    
    return (
        <div style={{ minHeight: '200px' }}>
            {data ? <Content data={data} /> : <Skeleton />}
        </div>
    );
}
```

## Debouncing Render Updates

```typescript
// ============================================
// DEBOUNCE RENDERS
// ============================================

function SearchInput() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query); // Only update after 300ms pause
        }, 300);
        
        return () => clearTimeout(timer);
    }, [query]);
    
    return (
        <div>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <SearchResults query={debouncedQuery} />
        </div>
    );
}
```

## Performance Monitoring

```typescript
// ============================================
// RENDER PERFORMANCE MONITOR
// ============================================

function useRenderMonitor(componentName: string) {
    const renderCount = useRef(0);
    const startTime = useRef(performance.now());
    
    useEffect(() => {
        renderCount.current++;
        
        const duration = performance.now() - startTime.current;
        
        if (duration > 16.67) { // Longer than one frame (60fps)
            console.warn(
                `${componentName} slow render:`,
                `${duration.toFixed(2)}ms`,
                `(render #${renderCount.current})`
            );
        }
        
        startTime.current = performance.now();
    });
}

// Usage
function MyComponent() {
    useRenderMonitor('MyComponent');
    
    // Component logic...
}
```

## Best Practices Summary

1. **Memoization**: Use React.memo, useMemo, useCallback appropriately
2. **Code Splitting**: Lazy load routes and heavy components
3. **Virtualization**: Use for long lists (1000+ items)
4. **Avoid Inline**: Don't create new objects/functions in render
5. **Batch DOM Updates**: Use fragments, minimize reflows
6. **CSS Animations**: Use transform/opacity over position/size
7. **Lazy Load Images**: Use native loading="lazy"
8. **Web Vitals**: Optimize FCP, LCP, CLS
9. **Debounce Updates**: For expensive operations
10. **Monitor Performance**: Track slow renders

## Summary

**Rendering performance** is critical for user experience:

1. **React Optimization**: Memoization, code splitting, virtualization
2. **DOM Efficiency**: Batch updates, avoid layout thrashing
3. **CSS Performance**: Use GPU-accelerated properties
4. **Image Optimization**: Lazy loading, responsive images
5. **Web Vitals**: Focus on FCP, LCP, CLS
6. **Monitoring**: Track render times and bottlenecks

**Key Takeaway**: The fastest render is one that doesn't happen. Prevent unnecessary re-renders with memoization, and optimize the renders that do happen with efficient DOM updates and CSS animations.

---

**Next**: Explore [Caching Strategies](../06-caching.md) for data and computation caching.
