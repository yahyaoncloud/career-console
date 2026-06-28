# P11 - Security

## 1. Purpose
Define the security strategy for the SaaS platform, ensuring protection against common vulnerabilities, secure authentication, authorization, and compliance with OWASP recommendations.

## 2. Architecture
Security is implemented at multiple layers:
- **Authentication:** Supabase Auth with secure session management
- **Authorization:** RBAC with server-side permission checks
- **Input Validation:** Zod validation at all boundaries
- **Output Encoding:** Automatic XSS protection via React
- **CSRF Protection:** Built-in with React Router forms
- **Rate Limiting:** Per-IP and per-user rate limiting
- **Secrets Management:** Environment variables for secrets
- **Audit Logging:** All security events logged

### Security Layers
1. **Network Layer:** HTTPS, TLS 1.3
2. **Application Layer:** Auth, validation, rate limiting
3. **Data Layer:** Encryption at rest, row-level security
4. **Infrastructure Layer:** Secure headers, CSP

## 3. Folder Structure Impact
Security utilities live in `/app/lib/security.server.ts`. Auth logic in `/app/lib/auth.server.ts`. Middleware in `/app/middleware.ts`.

## 4. Best Practices
- **Defense in depth:** Multiple security layers
- **Least privilege:** Minimal permissions required
- **Secure defaults:** Default to secure settings
- **Input validation:** Validate all inputs
- **Output encoding:** Encode all outputs
- **Secrets management:** Never hardcode secrets
- **Audit logging:** Log all security events
- **Regular updates:** Keep dependencies updated

## 5. Anti-patterns
- **Hardcoded secrets:** Never hardcode API keys or passwords
- **Client-side auth:** Never trust client-side auth checks
- **SQL injection:** Never concatenate SQL strings
- **XSS vulnerabilities:** Never render untrusted HTML
- **CSRF vulnerabilities:** Never skip CSRF protection
- **Missing validation:** Never trust user input
- **Weak passwords:** Never allow weak passwords

## 6. Examples
*Secure Headers Middleware:*
```typescript
// app/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-react-router'

export async function middleware({ request }: { request: Request }) {
  const response = new Response()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;"
  )
  
  return response
}
```

*Rate Limiting:*
```typescript
// app/lib/rate-limit.server.ts
import { LRUCache } from 'lru-cache'

const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000 // 1 minute
})

export async function checkRateLimit(
  identifier: string,
  limit: number = 100
): Promise<{ allowed: boolean; remaining: number }> {
  const current = (rateLimitCache.get(identifier) || 0) + 1
  rateLimitCache.set(identifier, current)
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current)
  }
}

// Usage in loader/action
export async function action({ request }: ActionFunctionArgs) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, remaining } = await checkRateLimit(ip, 10)
  
  if (!allowed) {
    return json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': String(remaining) }
      }
    )
  }
  
  // ... rest of action
}
```

*Input Sanitization:*
```typescript
// app/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target']
  })
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
```

*SQL Injection Prevention (Prisma):*
```typescript
// Good: Prisma automatically prevents SQL injection
const applications = await prisma.application.findMany({
  where: {
    company: {
      contains: searchTerm, // Prisma handles this safely
      mode: 'insensitive'
    }
  }
})

// Bad: Never concatenate strings
const query = `SELECT * FROM applications WHERE company = '${searchTerm}'`
```

*XSS Prevention:*
```typescript
// Good: React automatically escapes
<div>{userInput}</div>

// Bad: Never render untrusted HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// If you must render HTML, sanitize first
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
```

*Secrets Management:*
```typescript
// app/lib/env.server.ts
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(32)
})

export const env = EnvSchema.parse(process.env)
```

## 7. Migration Strategy
1. Audit current security vulnerabilities
2. Implement secure headers middleware
3. Add rate limiting to all public endpoints
4. Implement input sanitization
5. Add audit logging for security events
6. Enable Supabase RLS for data isolation
7. Configure CSP headers
8. Remove any hardcoded secrets

## 8. Acceptance Criteria
- [ ] All secrets stored in environment variables
- [ ] Rate limiting implemented on all public endpoints
- [ ] Security headers configured
- [ ] CSP headers configured
- [ ] All inputs validated and sanitized
- [ ] Audit logging for all security events
- [ ] No hardcoded secrets in code
- [ ] Regular dependency updates

## 9. Future Scalability
- **MFA:** Add multi-factor authentication
- **SSO:** Add SAML/OIDC for enterprise customers
- **IP whitelisting:** Add IP-based access control
- **Device fingerprinting:** Add device tracking
- **Anomaly detection:** Add behavioral analysis
- **Compliance:** Add SOC2, HIPAA compliance features
