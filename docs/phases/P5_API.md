# P5 - API Design

## 1. Purpose
Define the API design strategy for the serverless architecture, establishing patterns for loaders, actions, and resource routes. This document ensures consistent, type-safe, and performant data access patterns.

## 2. Architecture
The API is not a separate REST layer but is integrated into **React Router route modules** via loaders and actions. This eliminates the network waterfall between client and API server.

### API Types
1. **Loaders:** Server-side data fetching executed before route render
2. **Actions:** Server-side data mutations triggered by form submissions
3. **Resource Routes:** Non-UI endpoints (webhooks, PDFs, SSE)
4. **Client Fetchers:** Optimistic UI updates using `useFetcher`

### Response Envelopes
Standardize all responses for consistency:

**Success Response:**
```typescript
{
  success: true,
  message?: string,
  data: T,
  meta?: {
    requestId: string,
    timestamp: string,
    pagination?: {
      page: number,
      limit: number,
      total: number
    }
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: string,
  code: string,
  details?: Record<string, any>,
  requestId: string
}
```

### HTTP Status Codes
- `200 OK`: Successful GET/PUT/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (duplicate, version mismatch)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limited
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Maintenance

## 3. Folder Structure Impact
API logic lives within route modules in `/app/routes/`. Shared API utilities are in `/app/lib/api.server.ts`. Resource routes are in `/app/routes/api/`.

## 4. Best Practices
- **Use loaders for data fetching:** Never use `useEffect` for primary data
- **Use actions for mutations:** Never use client-side fetch for writes
- **Validate with Zod:** Validate all inputs at the boundary
- **Return typed responses:** Use `json()` helper with TypeScript types
- **Handle errors gracefully:** Use try/catch and return error responses
- **Include request IDs:** Generate and return request IDs for tracing
- **Use defer for slow data:** Use `defer()` for parallel slow operations
- **Stream responses:** Use `stream()` for large datasets

## 5. Anti-patterns
- **Separate REST API:** Don't build a `/api` folder for your own frontend
- **Client-side data fetching:** Don't use `useEffect` + `fetch` for data
- **Implicit validation:** Don't skip Zod validation
- **Inconsistent responses:** Don't return different response shapes
- **Silent failures:** Don't swallow errors without logging
- **N+1 queries:** Don't loop and query inside loaders

## 6. Examples
*Loader with Validation:*
```typescript
// app/routes/_admin.applications.tsx
import { json, type LoaderFunctionArgs } from '@react-router/node'
import { z } from 'zod'
import { requireUser } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

const QuerySchema = z.object({
  status: z.enum(['WISHLIST', 'APPLIED', 'HR_SCREENING', 'TECHNICAL', 'OFFER', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const url = new URL(request.url)
  const query = QuerySchema.parse(Object.fromEntries(url.searchParams))
  
  const requestId = crypto.randomUUID()
  
  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        ...(query.status && { status: query.status }),
        ...(query.priority && { priority: query.priority })
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
        ...(query.priority && { priority: query.priority })
      }
    })
  ])
  
  return json({
    success: true,
    data: applications,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      pagination: {
        page: query.page,
        limit: query.limit,
        total
      }
    }
  })
}
```

*Action with Validation:*
```typescript
import { json, type ActionFunctionArgs, redirect } from '@react-router/node'
import { z } from 'zod'
import { requireUser } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

const CreateApplicationSchema = z.object({
  company: z.string().min(1).max(100),
  position: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  salary: z.string().max(50).optional(),
  employmentType: z.string().max(50).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['WISHLIST', 'APPLIED']).default('APPLIED'),
  appliedDate: z.string().datetime(),
  deadline: z.string().datetime().optional(),
  notes: z.string().max(5000).optional()
})

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request)
  const requestId = crypto.randomUUID()
  
  try {
    const formData = await request.formData()
    const rawData = Object.fromEntries(formData)
    const data = CreateApplicationSchema.parse(rawData)
    
    const application = await prisma.application.create({
      data: {
        ...data,
        userId: user.id,
        appliedDate: new Date(data.appliedDate),
        deadline: data.deadline ? new Date(data.deadline) : null
      }
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
    
    console.error('[API] Error creating application:', error)
    return json({
      success: false,
      error: 'Failed to create application',
      code: 'INTERNAL_ERROR',
      requestId
    }, { status: 500 })
  }
}
```

*Resource Route (Webhook):*
```typescript
// app/routes/api.telegram.webhook.ts
import { json, type ActionFunctionArgs } from '@react-router/node'

export async function action({ request }: ActionFunctionArgs) {
  const requestId = crypto.randomUUID()
  
  try {
    const body = await request.json()
    
    // Verify webhook signature
    const signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (signature !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }
    
    // Process webhook
    await handleTelegramUpdate(body)
    
    return json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Webhook] Error:', error)
    return json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

*Deferred Loading:*
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  
  return defer({
    user: Promise.resolve(user),
    applications: prisma.application.findMany({
      where: { userId: user.id, deletedAt: null }
    }),
    stats: prisma.application.groupBy({
      by: ['status'],
      where: { userId: user.id, deletedAt: null },
      _count: true
    })
  })
}
```

*Author Analytics:*
```typescript
// app/routes/_admin.profile.analytics.tsx
import { json, type LoaderFunctionArgs } from '@react-router/node'
import { requireUser } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const requestId = crypto.randomUUID()
  
  if (user.authorStatus !== 'ACTIVE') {
    return json({
      success: false,
      error: 'Author account suspended',
      code: 'FORBIDDEN',
      requestId
    }, { status: 403 })
  }
  
  const [portfolioViews, guestbookMessages, applicationStats] = await Promise.all([
    prisma.portfolio.count({ where: { userId: user.id } }),
    prisma.guestbook.count({ where: { userId: user.id } }),
    prisma.application.groupBy({
      by: ['status'],
      where: { userId: user.id, deletedAt: null },
      _count: true
    })
  ])
  
  return json({
    success: true,
    data: {
      portfolioViews,
      guestbookMessages,
      applicationStats
    },
    meta: { requestId }
  })
}
```

*Suspend Author (Admin):*
```typescript
// app/routes/_admin.users.$userId.suspend.tsx
import { json, type ActionFunctionArgs } from '@react-router/node'
import { requireAdmin } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

export async function action({ request, params }: ActionFunctionArgs) {
  const admin = await requireAdmin(request)
  const requestId = crypto.randomUUID()
  
  await prisma.user.update({
    where: { id: params.userId },
    data: { authorStatus: 'SUSPENDED' }
  })
  
  return json({
    success: true,
    message: 'Author suspended',
    meta: { requestId }
  })
}
```

*Activate Author (Admin):*
```typescript
// app/routes/_admin.users.$userId.activate.tsx
import { json, type ActionFunctionArgs } from '@react-router/node'
import { requireAdmin } from '~/lib/auth.server'
import { prisma } from '~/lib/db.server'

export async function action({ request, params }: ActionFunctionArgs) {
  const admin = await requireAdmin(request)
  const requestId = crypto.randomUUID()
  
  await prisma.user.update({
    where: { id: params.userId },
    data: { authorStatus: 'ACTIVE' }
  })
  
  return json({
    success: true,
    message: 'Author activated',
    meta: { requestId }
  })
}
```

## 7. Migration Strategy
1. Analyze existing Express routes in `server.ts` and `server/routes/`
2. Map each route to a React Router loader or action
3. Convert response formats to standard envelope
4. Add Zod validation to all inputs
5. Replace client-side fetch calls with loader/action patterns
6. Remove Express server dependencies

## 8. Acceptance Criteria
- [ ] All data fetching uses loaders
- [ ] All mutations use actions
- [ ] All inputs validated with Zod
- [ ] All responses follow standard envelope
- [ ] All responses include request IDs
- [ ] No custom REST API exists for internal use

## 9. Future Scalability
- **API Versioning:** Add version prefix to resource routes if needed
- **GraphQL:** Consider GraphQL for complex queries if needed
- **Rate Limiting:** Implement per-user rate limiting
- **API Documentation:** Generate OpenAPI spec from loaders/actions
- **Webhooks:** Add webhook system for external integrations
- **Batch Operations:** Add batch endpoints for bulk operations
