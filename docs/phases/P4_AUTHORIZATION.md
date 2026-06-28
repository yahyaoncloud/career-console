# P4 - Authorization & Authentication

## 1. Purpose
Define the authentication and authorization strategy for the SaaS platform, ensuring secure access control, role-based permissions, and session management using Supabase Auth.

## 2. Architecture
The authentication system uses **Supabase Auth** as the identity provider, integrated with **React Router** loaders and actions for session management.

### Authentication Flow
1. User enters email/password or uses OAuth provider
2. Supabase Auth validates credentials
3. Session token is stored in HTTP-only cookie
4. Each request includes the cookie
5. Loaders/actions validate session via Supabase client
6. User context is injected into the request

### Authorization Model
- **Role-Based Access Control (RBAC):** Users have roles (USER, ADMIN)
- **Resource Ownership:** Users can only access their own data
- **Route Protection:** Layouts enforce authentication requirements
- **Action Protection:** Server-side checks before mutations

### Role Definitions
```typescript
enum Role {
  USER = 'USER',      // Can manage own applications, portfolio, guestbook, profile
  ADMIN = 'ADMIN'     // Full system access, can manage all users and config
}
```

### Author Status
All users are authors by default with enhanced capabilities:

**Author States:**
- **ACTIVE:** Author with full author privileges (default)
- **SUSPENDED:** Author temporarily suspended (violations)

**Author Capabilities:**
- Profile management (bio, avatar, social links)
- Content analytics (views, engagement metrics)
- Portfolio management with enhanced features
- Guestbook moderation
- Custom branding options

## 3. Folder Structure Impact
Authentication logic lives in `/app/lib/auth.server.ts`. Session utilities are in `/app/lib/session.server.ts`. Protected route layouts use pathless routes (e.g., `_admin/_layout.tsx`).

## 4. Best Practices
- **Server-side validation:** Always check auth on the server, never trust client state
- **HTTP-only cookies:** Store session tokens in HTTP-only, secure, same-site cookies
- **Short-lived tokens:** Use short-lived access tokens with refresh token rotation
- **Least privilege:** Default to denying access, explicitly grant permissions
- **Audit logging:** Log all authentication events (login, logout, role changes)
- **Secure redirects:** Validate redirect URLs to prevent open redirect attacks

## 5. Anti-patterns
- **Client-side auth only:** Never rely solely on client-side auth checks
- **Storing tokens in localStorage:** Never store sensitive tokens in browser storage
- **Hardcoded credentials:** Never hardcode API keys or credentials
- **Skipping auth checks:** Never skip auth checks for "internal" routes
- **Role escalation:** Never allow users to change their own role

## 6. Examples
*Protected Loader:*
```typescript
// app/lib/auth.server.ts
import { createServerClient } from '@supabase/auth-helpers-react-router'
import { redirect } from '@react-router/node'

export async function requireUser(request: Request) {
  const response = new Response()
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { request, response }
  )
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw redirect('/login', { headers: response.headers })
  }
  
  // Fetch user role from database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  
  return { ...user, role: dbUser?.role || 'USER' }
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request)
  if (user.role !== 'ADMIN') {
    throw redirect('/dashboard', { 
      status: 403,
      headers: { 'X-Reason': 'Insufficient permissions' }
    })
  }
  return user
}
```

*Protected Route Layout:*
```typescript
// app/routes/_admin._layout.tsx
import { Outlet, useLoaderData } from '@react-router/react'
import { requireUser } from '~/lib/auth.server'

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  return { user }
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>()
  return (
    <div className="admin-layout">
      <aside>{/* Sidebar */}</aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

*Resource Ownership Check:*
```typescript
// app/routes/_admin.applications.$appId.tsx
export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request)
  const application = await prisma.application.findFirst({
    where: {
      id: params.appId,
      userId: user.id,
      deletedAt: null
    }
  })
  
  if (!application) {
    throw new Response('Not found', { status: 404 })
  }
  
  return json({ application })
}
```

## 7. Migration Strategy
1. Set up Supabase project and enable Auth
2. Configure Supabase Auth providers (email/password, OAuth)
3. Create `/app/lib/auth.server.ts` with auth utilities
4. Implement login/logout routes
5. Add auth checks to existing loaders
6. Migrate session storage from custom JWT to Supabase
7. Remove custom auth middleware from Express

## 8. Acceptance Criteria
- [ ] All authenticated routes use `requireUser` or `requireAdmin`
- [ ] Session tokens stored in HTTP-only cookies
- [ ] Users can only access their own data
- [ ] Admin routes protected by role checks
- [ ] Authentication events logged to database
- [ ] Logout invalidates session on server

## 9. Future Scalability
- **Multi-tenancy:** Add tenant checks alongside user ownership
- **Fine-grained permissions:** Implement permission system (e.g., `applications:read`, `applications:write`)
- **SAML/SSO:** Add enterprise SSO via Supabase SAML
- **MFA:** Add multi-factor authentication for sensitive operations
- **Session revocation:** Implement session revocation for security events
- **Audit trails:** Expand audit logging for compliance requirements
