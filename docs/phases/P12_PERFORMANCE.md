# P12 - Performance

## 1. Purpose
Define the performance optimization strategy for the SaaS platform, ensuring fast load times, excellent Lighthouse scores, and optimal user experience across all devices.

## 2. Architecture
Performance is optimized at multiple layers:
- **Server-Side Rendering (SSR):** Initial HTML rendered on server
- **Streaming:** Progressive rendering with React Router streaming
- **Code Splitting:** Route-based code splitting
- **Asset Optimization:** Optimized images, fonts, and scripts
- **Caching:** Aggressive caching strategies
- **Database Optimization:** Indexed queries and connection pooling

### Performance Targets
- **Lighthouse Score:** 90+ across all categories
- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.9s
- **Cumulative Layout Shift (CLS):** < 0.1

## 3. Folder Structure Impact
Performance utilities in `/app/lib/performance.ts`. Images in `/public/`. Bundle analysis in `/scripts/analyze-bundle.ts`.

## 4. Best Practices
- **Route splitting:** Split code by route
- **Lazy loading:** Lazy load heavy components
- **Image optimization:** Use optimized image formats (WebP, AVIF)
- **Font optimization:** Use font-display: swap
- **Prefetching:** Prefetch likely next routes
- **Memoization:** Memoize expensive computations
- **Debouncing:** Debounce user inputs
- **Virtual scrolling:** Virtual scroll long lists

## 5. Anti-patterns
- **Large bundles:** Don't bundle everything together
- **Blocking renders:** Don't block on slow operations
- **Unnecessary re-renders:** Don't cause unnecessary re-renders
- **Large images:** Don't use unoptimized images
- **Blocking scripts:** Don't use blocking scripts
- **Missing caching:** Don't skip caching opportunities
- **N+1 queries:** Don't loop and query

## 6. Examples
*Route-Based Code Splitting:*
```typescript
// React Router automatically splits by route
// app/routes/_admin.applications.tsx
export default function Applications() {
  // This route is automatically code-split
}
```

*Lazy Loading Components:*
```typescript
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('~/components/shared/HeavyChart'))

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}
```

*Image Optimization:*
```typescript
// Use next/image or similar optimization
import { Image } from '~/components/ui/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={200}
  loading="lazy"
  formats={['avif', 'webp', 'png']}
/>
```

*Memoization:*
```typescript
import { useMemo } from 'react'

export default function ApplicationList({ applications }: { applications: Application[] }) {
  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => 
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
    )
  }, [applications])
  
  return (
    <div>
      {sortedApplications.map(app => <ApplicationCard key={app.id} application={app} />)}
    </div>
  )
}
```

*Virtual Scrolling:*
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export default function LongList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`
            }}
          >
            <ItemComponent item={items[item.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

*Deferred Loading:*
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  
  return defer({
    user: Promise.resolve(user),
    // Slow operation - deferred
    applications: prisma.application.findMany({ 
      where: { userId: user.id, deletedAt: null } 
    }),
    // External API call - deferred
    recommendations: fetchAIRecommendations(user.id)
  })
}
```

*Prefetching:*
```typescript
import { Link, PrefetchPageLinks } from '@react-router/react'

export default function ApplicationList() {
  return (
    <div>
      <Link 
        to="/applications/new"
        prefetch="intent"
      >
        Create Application
      </Link>
      
      {/* Prefetch page resources */}
      <PrefetchPageLinks page="/applications/new" />
    </div>
  )
}
```

## 7. Migration Strategy
1. Run Lighthouse audit on current application
2. Implement route-based code splitting
3. Optimize images and assets
4. Add lazy loading for heavy components
5. Implement virtual scrolling for long lists
6. Add memoization where appropriate
7. Configure caching headers
8. Monitor performance metrics

## 8. Acceptance Criteria
- [ ] Lighthouse score 90+ on all pages
- [ ] TTFB < 200ms on all routes
- [ ] LCP < 2.5s on all pages
- [ ] CLS < 0.1 on all pages
- [ ] All images optimized (WebP/AVIF)
- [ ] All fonts optimized with font-display: swap
- [ ] Bundle size < 200KB initial
- [ ] No layout shifts

## 9. Future Scalability
- **Edge caching:** Add CDN edge caching
- **Service workers:** Add offline support
- **Web workers:** Offload heavy computations
- **Streaming SSR:** Implement streaming SSR
- **Performance monitoring:** Add real user monitoring (RUM)
- **A/B testing:** Add performance A/B testing
