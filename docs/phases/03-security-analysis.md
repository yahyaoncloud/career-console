# Security Analysis

This document outlines the comprehensive security architecture and assessment for the Career Console application. It aligns with the master AI implementation checklist and evaluates protections against the OWASP Top 10 vulnerabilities.

## 1. Authentication & Authorization
> [!IMPORTANT]
> The application utilizes a hybrid authentication approach combining Firebase on the client-side with secure, server-enforced session verification.

- **Authentication (Firebase):** Initial authentication is handled securely via Firebase SDK. Client-side ID Tokens are passed to the server via the `api.auth.session.ts` endpoint, where `firebase-admin` verifies the signature and mints a secure, HTTP-only, SameSite React Router session cookie.
- **Authorization (Prisma `Role` Enum):** The application *never* trusts client-supplied roles. All route loaders (e.g. `_admin/*`, `_author/*`) and server actions wrap requests in the `requireUser` or `requireAdmin` middlewares. These middlewares lookup the user's role securely from the database (`User.role`).

## 2. OWASP Top 10 Protections

### A01:2021 - Broken Access Control
- Access control is strictly enforced server-side.
- The `requireAdmin` middleware reliably protects all `_admin` layout sub-routes.
- S3 presigned URLs require a valid authenticated session before being generated.

### A03:2021 - Injection
- **SQL Injection:** Mitigated entirely by using Prisma ORM with parameterized queries across all database operations.
- **NoSQL Injection:** Legacy MongoDB code was previously identified and deprecated in favor of PostgreSQL/Prisma.

### A07:2021 - Identification and Authentication Failures
- Passwords and user identities are managed by Firebase (Google Identity Platform), eliminating local credential storage risks.
- Session endpoints enforce strict rate limits to deter brute-force and credential-stuffing attacks.

## 3. General Security Policies

### Cross-Site Scripting (XSS) & Content Security Policy (CSP)
- **CSP:** The application serves a Content Security Policy via `entry.server.tsx` limiting scripts, styles, and image origins to trusted domains (`'self'`, `https:`).
- **Sanitization:** All user-supplied HTML inputs (like Guestbook messages) are sanitized using server-side DOMPurify logic (`sanitizeString` in `lib/sanitize.ts`).

### Cross-Site Request Forgery (CSRF)
- The application relies heavily on `SameSite=Lax` cookies set by Remix/React Router.
- Sensitive state-changing requests inherently require an authenticated session context. Further token-based CSRF protection could be adopted if strict third-party API origin integration is required.

### Rate Limiting & Bot Protection
- Utilizing an LRU cache, `lib/rate-limit.server.ts` effectively limits aggressive actors.
- **Session API:** Capped at 10 requests per minute to prevent token abuse.
- **S3 Presign API:** Capped at 5 requests per minute to prevent quota depletion.

### File Upload Security
> [!WARNING]
> Presigned URLs bypass direct application payload transfer. Validation is critical.

- **Constraints:** The `api.s3.presign.ts` endpoint explicitly restricts uploads to predefined buckets (`career-assets`, `documents`, `authors`).
- **Extensions:** Strict Zod-based whitelisting allows only specific extensions (`.jpg`, `.pdf`, etc.).
- **Path Traversal:** Filenames containing `../` or `/` are actively rejected to prevent path traversal inside S3.

## 4. Infrastructure & Secrets
- **Secrets Management:** Environment variables are strictly maintained outside the repository. Vercel Secrets handle production credentials (e.g., `VITE_FIREBASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `DATABASE_URL`).
- **Headers:** `Strict-Transport-Security`, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff` are applied natively by `entry.server.tsx`.

---
*Status: SECURE*  
*Last Audited: June 2026*
