# P8 - State Management

## 1. Purpose
Define the state management strategy for the application, establishing clear boundaries between server state (from loaders) and client state (UI interactions).

## 2. Architecture
The application uses a **hybrid state management approach**:
- **Server State:** Managed by React Router loaders and actions
- **Client UI State:** Managed by Zustand for transient UI state
- **Form State:** Managed by React Hook Form with Zod validation
- **URL State:** Managed by React Router search params

### State Hierarchy
1. **Server State (Primary):** Database data fetched via loaders
2. **URL State (Secondary):** Filters, pagination, sorting in URL
3. **Client State (Tertiary):** UI toggles, modals, temporary selections
4. **Form State (Local):** Form inputs and validation state

### State Flow
```
Database → Prisma → Loader → useLoaderData → Component
Component → Action → Prisma → Database
Component → Zustand → UI Update
Component → React Hook Form → Form State → Action
```

## 3. Folder Structure Impact
- `/app/lib/stores/`: Zustand stores for client state
- `/app/hooks/`: Custom React hooks for state logic
- Server state is managed in route loaders/actions

## 4. Best Practices
- **Server state first:** Use loaders for all data that comes from the database
- **Client state for UI only:** Use Zustand only for UI state (modals, toggles, selections)
- **URL state for filters:** Use URL search params for filters, pagination, sorting
- **Form state for forms:** Use React Hook Form for all form state
- **Avoid prop drilling:** Use Zustand or URL state instead of prop drilling
- **Keep state minimal:** Only store what's necessary
- **Clear state boundaries:** Never mix server and client state

## 5. Anti-patterns
- **Client fetching server data:** Never use Zustand for data that should come from loaders
- **Global state abuse:** Don't put everything in global state
- **Prop drilling:** Avoid passing state through many component levels
- **Duplicate state:** Never store the same data in multiple places
- **Context overuse:** Don't use Context for everything
- **Ignoring URL state:** Don't use client state for things that should be in URL

## 6. Examples
*Server State (Loader):*
```typescript
// app/routes/_admin.applications.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const url = new URL(request.url)
  
  const applications = await prisma.application.findMany({
    where: { userId: user.id, deletedAt: null }
  })
  
  return json({ applications })
}

export default function Applications() {
  const { applications } = useLoaderData<typeof loader>()
  return <ApplicationList applications={applications} />
}
```

*Client State (Zustand):*
```typescript
// app/lib/stores/ui-store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  selectedApplicationId: string | null
  setSidebarOpen: (open: boolean) => void
  setSelectedApplicationId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedApplicationId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedApplicationId: (id) => set({ selectedApplicationId: id })
}))
```

*URL State (Search Params):*
```typescript
// app/routes/_admin.applications.tsx
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const url = new URL(request.url)
  
  const status = url.searchParams.get('status')
  const page = Number(url.searchParams.get('page') || '1')
  
  const applications = await prisma.application.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
      ...(status && { status })
    },
    skip: (page - 1) * 20,
    take: 20
  })
  
  return json({ applications, page, status })
}

export default function Applications() {
  const { applications, page, status } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const handleStatusChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, page: '1' })
  }
  
  return (
    <div>
      <select value={status || ''} onChange={(e) => handleStatusChange(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="APPLIED">Applied</option>
        <option value="OFFER">Offer</option>
      </select>
      <ApplicationList applications={applications} />
    </div>
  )
}
```

*Form State (React Hook Form):*
```typescript
// app/routes/_admin.applications.new.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const ApplicationSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  status: z.enum(['WISHLIST', 'APPLIED'])
})

export default function NewApplication() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ApplicationSchema)
  })
  
  return (
    <Form method="post" onSubmit={handleSubmit}>
      <input {...register('company')} />
      {errors.company && <span>{errors.company.message}</span>}
      
      <input {...register('position')} />
      {errors.position && <span>{errors.position.message}</span>}
      
      <select {...register('status')}>
        <option value="WISHLIST">Wishlist</option>
        <option value="APPLIED">Applied</option>
      </select>
      
      <button type="submit">Create</button>
    </Form>
  )
}
```

## 7. Migration Strategy
1. Identify all client-side data fetching (useEffect + fetch)
2. Replace with React Router loaders
3. Identify UI state that should be in Zustand
4. Create Zustand stores for UI state
5. Move filters/pagination to URL search params
6. Remove any global Context that's not truly necessary
7. Remove Redux or other state management libraries

## 8. Acceptance Criteria
- [ ] No useEffect is used for primary data fetching
- [ ] All database data comes from loaders
- [ ] Zustand is only used for UI state
- [ ] Filters and pagination use URL search params
- [ ] Forms use React Hook Form
- [ ] No state duplication exists

## 9. Future Scalability
- **State persistence:** Add local storage persistence for UI preferences
- **State synchronization:** Add real-time sync via Supabase subscriptions
- **State devtools:** Add Zustand devtools for debugging
- **State normalization:** Normalize complex state structures if needed
- **State time travel:** Add undo/redo for critical actions
- **State analytics:** Track state changes for analytics
