# P10 - Server Loaders & Actions

## 1. Purpose
Define the patterns and best practices for React Router loaders and actions, ensuring consistent, performant, and secure server-side data fetching and mutations.

## 2. Architecture
Loaders and actions are the core of the React Router Framework, replacing traditional REST APIs. They run on the server and have direct access to databases and secrets.

### Loaders
- **Purpose:** Fetch data before route render
- **Execution:** Server-side, before component mount
- **Return:** JSON data via `json()` helper
- **Caching:** Automatic cache invalidation on actions

### Actions
- **Purpose:** Handle data mutations
- **Execution:** Server-side on form submission
- **Return:** JSON response or redirect
- **Side effects:** Invalidate all loaders automatically

### Resource Routes
- **Purpose:** Non-UI endpoints (webhooks, PDFs, SSE)
- **Execution:** Server-side without component
- **Return:** Custom responses (JSON, text, binary)

## 3. Folder Structure Impact
Loaders and actions are defined directly in route modules within `/app/routes/`. Shared server logic is in `/app/lib/*.server.ts`.

## 4. Best Practices
- **Server-only code:** Use `.server.ts` suffix for server-only files
- **Type safety:** Use TypeScript types for loader/action args and returns
- **Error handling:** Wrap in try/catch and return error responses
- **Validation:** Validate all inputs with Zod
- **Authentication:** Check auth at the start of every loader/action
- **Authorization:** Check permissions before data access
- **Performance:** Use `defer()` for parallel slow operations
- **Streaming:** Use `stream()` for large datasets
- **Request IDs:** Generate and return request IDs for tracing

## 5. Anti-patterns
- **Client-side data fetching:** Never use useEffect for data that should be in loaders
- **Leaking secrets:** Never import server-only code into client components
- **Missing auth:** Never skip auth checks in loaders/actions
- **N+1 queries:** Never loop and query inside loaders
- **Blocking operations:** Never block on slow operations without defer
- **Silent failures:** Never swallow errors without logging

## 6. Examples
*Loader with Auth, Validation, and Error Handling:*
```typescript
// app/routes/_admin.applications.tsx
import { json, type LoaderFunctionArgs, defer } from '@react-router/node'
import { z } from 'zod'
import { requireUser } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

const QuerySchema = z.object({
  status: z.enum(['WISHLIST', 'APPLIED', 'HR_SCREENING', 'TECHNICAL', 'OFFER', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional()
})

export async function loader({ request }: LoaderFunctionArgs) {
  const requestId = crypto.randomUUID()
  const user = await requireUser(request)
  const url = new URL(request.url)
  
  try {
    const query = QuerySchema.parse(Object.fromEntries(url.searchParams))
    
    const [applications, total, stats] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId: user.id,
          deletedAt: null,
          ...(query.status && { status: query.status }),
          ...(query.priority && { priority: query.priority }),
          ...(query.search && {
            OR: [
              { company: { contains: query.search, mode: 'insensitive' } },
              { position: { contains: query.search, mode: 'insensitive' } }
            ]
          })
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { appliedDate: 'desc' }
      }),
      prisma.application.count({
        where: {
          userId: user.id,
          deletedAt: null,
          ...(query.status && { status: query.status }),
          ...(query.priority && { priority: query.priority }),
          ...(query.search && {
            OR: [
              { company: { contains: query.search, mode: 'insensitive' } },
              { position: { contains: query.search, mode: 'insensitive' } }
            ]
          })
        }
      }),
      prisma.application.groupBy({
        by: ['status'],
        where: { userId: user.id, deletedAt: null },
        _count: true
      })
    ])
    
    return json({
      success: true,
      data: applications,
      meta: {
        requestId,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit)
        },
        stats
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: error.flatten().fieldErrors,
        requestId
      }, { status: 400 })
    }
    
    console.error('[Loader] Error:', error)
    return json({
      success: false,
      error: 'Failed to load applications',
      code: 'INTERNAL_ERROR',
      requestId
    }, { status: 500 })
  }
}
```

*Action with Transaction and Audit Log:*
```typescript
import { json, type ActionFunctionArgs, redirect } from '@react-router/node'
import { z } from 'zod'
import { requireUser } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

const CreateApplicationSchema = z.object({
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  // ... other fields
})

export async function action({ request }: ActionFunctionArgs) {
  const requestId = crypto.randomUUID()
  const user = await requireUser(request)
  
  try {
    const formData = await request.formData()
    const rawData = Object.fromEntries(formData)
    const data = CreateApplicationSchema.parse(rawData)
    
    // Use transaction for atomicity
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.application.create({
        data: {
          ...data,
          userId: user.id,
          appliedDate: new Date(data.appliedDate),
          deadline: data.deadline ? new Date(data.deadline) : null
        }
      })
      
      // Audit log
      await tx.log.create({
        data: {
          userId: user.id,
          event: 'Application created',
          status: 'SUCCESS',
          module: 'APPLICATIONS'
        }
      })
      
      return app
    })
    
    return json({
      success: true,
      message: 'Application created successfully',
      data: application,
      meta: { requestId }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.flatten().fieldErrors,
        requestId
      }, { status: 422 })
    }
    
    console.error('[Action] Error:', error)
    return json({
      success: false,
      error: 'Failed to create application',
      code: 'INTERNAL_ERROR',
      requestId
    }, { status: 500 })
  }
}
```

*Deferred Loading for Slow Operations:*
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  
  return defer({
    user: Promise.resolve(user),
    applications: prisma.application.findMany({ 
      where: { userId: user.id, deletedAt: null } 
    }),
    // Slow external API call
    aiRecommendation: fetchGeminiRecommendation(user.id),
    // Analytics query
    stats: prisma.application.groupBy({
      by: ['status'],
      where: { userId: user.id, deletedAt: null },
      _count: true
    })
  })
}

export default function Dashboard() {
  const { user, applications, aiRecommendation, stats } = useLoaderData<typeof loader>()
  
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <Await resolve={applications}>
          {(apps) => <ApplicationList applications={apps} />}
        </Await>
      </Suspense>
      
      <Suspense fallback={<Skeleton />}>
        <Await resolve={aiRecommendation}>
          {(rec) => <AIRecommendation recommendation={rec} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

*Resource Route (Webhook):*
```typescript
// app/routes/api.telegram.webhook.ts
import { json, type ActionFunctionArgs } from '@react-router/node'

export async function action({ request }: ActionFunctionArgs) {
  const requestId = crypto.randomUUID()
  
  try {
    const signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (signature !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }
    
    const body = await request.json()
    await handleTelegramUpdate(body)
    
    return json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

## 7. Migration Strategy
1. Audit all Express routes in `server.ts` and `server/routes/`
2. Map each GET route to a loader
3. Map each POST/PUT/DELETE route to an action
4. Add auth checks to all loaders/actions
5. Add Zod validation to all inputs
6. Replace client-side fetch calls with loader data
7. Remove Express server dependencies

## 8. Acceptance Criteria
- [ ] All data fetching uses loaders
- [ ] All mutations use actions
- [ ] All loaders/actions have auth checks
- [ ] All inputs validated with Zod
- [ ] All errors handled and logged
- [ ] No Express server remains
- [ ] Request IDs included in all responses

## 9. Future Scalability
- **Loader caching:** Implement custom caching strategies
- **Action queues:** Add background job queues for slow actions
- **Webhook system:** Build comprehensive webhook system
- **Streaming:** Add streaming for real-time updates
- **Batch operations:** Add batch loaders/actions
- **Rate limiting:** Implement per-user rate limiting
