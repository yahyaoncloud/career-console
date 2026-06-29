# AI Implementation Master Checklist

At the root of the project, I'd also include a master implementation guide for your coding agent.

This document should instruct the AI to:

* Perform a complete production readiness audit before making changes.
* Analyze both Admin and Author dashboards feature-by-feature and identify duplication, missing capabilities, and shared components.
* Produce API documentation for every loader, action, and endpoint, and recommend new APIs where required.
* Create a comprehensive security assessment covering authentication, authorization, OWASP Top 10 risks, file uploads, Firebase, Supabase, Prisma, S3, and Vercel deployment.
* Verify all legacy pages, Mongoose code, and deprecated APIs are no longer referenced before removal.
* Migrate remaining data fetching to React Router v7 loaders/actions and standardize request/response patterns.
* Centralize routes, permissions, roles, string constants, toast messages, and configuration values.
* Build a unified toast and notification architecture suitable for future real-time notifications.
* Validate the project for production deployment on Vercel, including environment variables, caching, headers, observability, SEO, accessibility, and performance.
* Produce a final report categorizing findings into **Critical**, **High**, **Medium**, **Low**, and **Enhancement**, with concrete implementation recommendations and an execution order.

---

# Engineering Backlog

## Phase 1 — Production Readiness

### Complete application audit
* Feature inventory
* Route inventory
* API inventory
* Database inventory
* Storage inventory
* Environment variables
* Security review
* Dependencies
* Bundle analysis
* Performance analysis
* SEO review
* Accessibility review

---

## React Router v7 audit

Review every route in `app/routes/`. Ensure every page uses:
* loader
* action
* shouldRevalidate
* ErrorBoundary
* meta
* headers
* clientLoader only when appropriate

Remove legacy React fetching (e.g. `useEffect` or manual `fetch`).
Remove duplicated fetches.
Remove unnecessary client state (favor `useLoaderData` and `useActionData`).

---

## Dashboard review

### Admin Dashboard (`app/routes/_admin/*`)
Document:
* `applications.tsx` (Job Tracking)
* `authors.tsx`
* `blog-manager.tsx`
* `companies.tsx`
* `documents.tsx`
* `kanban.tsx`
* `notifications.tsx`
* `portfolio-manager.tsx`
* `settings.tsx`
* every action & permission in these files
* dead routes

Review UX consistency.
Review navigation.
Review permissions.
Review security.

### Author Dashboard (`app/routes/_author/*`)
Repeat the same audit for:
* `author-dashboard.tsx`
* `blogs.tsx`
* `profile.tsx`
Compare against admin.
Determine:
* duplicated pages
* missing pages
* inconsistent APIs
* reusable components (move to `app/components/shared/`)

---

## API Documentation

Generate `/docs/api` for every endpoint.
Document current API routes:
* `api.blogs.ts` / `api.blogs.$slug.ts`
* `api.portfolio.ts` / `api.portfolio.$id.ts`
* `api.profile.ts`
* `api.auth.*`
* `api.guestbook.ts`
* `api.notifications.ts`
* `api.s3.presign.ts`

For each, document:
* request
* response
* permissions
* validation
* Zod schema
* Prisma operation
* storage interaction
* cache
* errors

Also identify APIs that should be merged or converted entirely into Route Actions/Loaders.

---

# Authentication Review

Current issue:
> Admin determined by role in response.

This should become:
Firebase Authentication
↓
Session Verification (`api.auth.session.ts`)
↓
Server-side token verification
↓
Database role lookup (Prisma `User.role`)
↓
Permission middleware
↓
Route authorization

Never trust `role === "admin"` coming from the client.

Document:
RBAC
Permissions
Ownership
Policies
Session lifecycle
Refresh
Logout
Token expiry

---

# Security Analysis

Create `03-security-analysis.md`
Include:
Authentication (Firebase)
Authorization (Prisma `Role` Enum)
CSRF
XSS
CSP
Headers
Rate limiting (Express Rate Limit)
Bot protection
Spam protection
Admin protection
Author protection
File upload security
S3 policies (`@aws-sdk/client-s3`)
PostgreSQL / Prisma validation
Secrets
Environment variables
Cookie security
Session security
Audit logging (`Log` model)
Security headers
OWASP Top 10 review

---

# Legacy Code Removal

Inventory:
Old pages
Unused routes
Unused components
Unused APIs
Unused loaders
Unused actions
Unused contexts
Unused hooks
Unused constants
Unused icons
Unused CSS
Unused Prisma queries
Old Mongoose models
Mongo utilities
Mongo environment variables
Unused dependencies

Every deletion should verify:
> Feature still exists somewhere else.
No feature regression.

---

# Constants Standardization

Create `/constants` for:
Routes
API paths
Permissions
Roles
Toast messages
Storage buckets
Feature flags
Validation
Regex
Pagination
Sorting
Metadata

Avoid:
```ts
"/admin"
"published"
"draft"
"admin"
"success"
```
appearing everywhere.

---

# API Standardization

Standard response:
```ts
{
 success,
 data,
 message,
 error,
 metadata
}
```

Consistent error handling.
Consistent validation.
Consistent pagination.
Consistent sorting.
Consistent status codes.

---

# Toast System

Current goal:
One unified toast system.

Every action
↓
Server action
↓
returns `ActionResult`
↓
UI
↓
toast mapper

Never manually call toast everywhere.

---

# Notification System

Future-proof:
Notifications
Database
↓
Server Event
↓
WebSocket/SSE
↓
Notification Center
↓
Toast
↓
Email
↓
Push
↓
Audit Log

Single notification service.

---

# Vercel Deployment

Document:
Environment Variables
Build
Preview Deployments
Production
Image Optimization
Caching
ISR
Headers
Edge Functions
Node Functions
Middleware
Redirects
Security Headers
robots
sitemap
Analytics
Speed Insights
Monitoring
Rollback
CI/CD
GitHub Actions
Preview workflow
Production workflow

---

# Performance Audit

Review:
Images
Fonts
Route splitting
Lazy loading
Streaming
Suspense
Memoization
Database queries
Prisma indexes
Cache headers
CDN
Compression
Bundle size
Hydration
CLS
LCP
FID
INP

---

# E-commerce Foundation

Prepare architecture only.
Products
Categories
Inventory
Orders
Payments
Coupons
Reviews
Wishlist
Cart
Invoices
Digital downloads
Tax
Shipping
Stock
Admin management

No implementation yet. Only prepare architecture.

---

# Testing

Document:
Unit
Integration
Route tests
Loader tests
Action tests
Prisma tests
Firebase tests
Playwright
Accessibility
Performance
Regression

---

# Monitoring

Logging
Audit Logs
Error Tracking
Performance Monitoring
Analytics
Security Events
Authentication Events
API Metrics
Database Metrics
Storage Metrics
Vercel Monitoring
Health Checks
