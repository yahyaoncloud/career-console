# API Roadmap And Production Readiness Notes

This document maps the current API and route surface, the missing API layer, and the work required to make the portfolio platform production-ready for a small group of authors, one or more admins, public readers, and future ecommerce/dashboard features.

## Product Goal

The site should evolve from a portfolio CMS into a production-grade publishing and portfolio platform where:

- Public visitors can read blogs, browse author profiles, view projects, sign the guestbook, and eventually buy digital products.
- Authors can log in, manage their profile, write posts, save drafts, submit for review, and publish only through the allowed workflow.
- Admins can manage the whole system: authors, blog review, portfolio, documents, products, orders, notifications, analytics, and system settings.
- Every private dashboard route is isolated by role and ownership.
- API responses are consistent, validated, logged, rate-limited, and production-safe.

## Current Route And API Inventory

### Existing API Routes

Current API routes registered in `app/routes.ts`:

- `POST /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/s3/presign`
- `GET /api/profile`
- `GET /api/portfolio`
- `GET /api/portfolio/:id`
- `GET /api/blogs`
- `GET /api/blogs/:slug`
- `GET/POST /api/notifications`

### Existing Public Routes

- `/`
- `/blog`
- `/blog/:slug`
- `/project/:id`
- `/author/:slug`
- `/authors/:slug`
- `/guestbook`

### Existing Admin Routes

- `/dashboard`
- `/portfolio-manager`
- `/kanban`
- `/applications`
- `/authors`
- `/blog-manager`
- `/companies`
- `/documents`
- `/notifications`
- `/settings`
- `/admin-management`
- store/calendar/analytics/messages routes exist mostly as coming-soon pages

### Existing Author Routes

- `/author/:id/dashboard`
- `/author/:id/blogs`
- `/author/:id/profile`

### Existing Server Helpers

- `jsonResponse()` and `errorResponse()` provide a shared API envelope.
- `requireUser()` checks session and returns a database user.
- `requireAdmin()` restricts admin routes.
- `authFetch()` sends Firebase ID tokens from the client.
- `checkRateLimit()` exists for auth and guestbook-type flows.
- `cache.server.ts` provides simple in-memory TTL cache.

## Current Strengths

- React Router v7 route modules are already in place.
- Firebase authentication is already wired to a server session endpoint.
- Prisma schema already has `User`, `Profile`, `Portfolio`, `Application`, `Company`, `Document`, `Notification`, and `Guestbook`.
- Roles already exist in the database: `USER`, `AUTHOR`, `ADMIN`.
- Author status already exists: `NONE`, `PENDING`, `ACTIVE`, `SUSPENDED`, `REVOKED`.
- Admin and author layouts already enforce basic role restrictions.
- Author blog creation has a first-pass ownership check using `authorId` in markdown frontmatter.
- Admin can manage authors and blog posts at a basic level.
- Public author pages exist.

## Main Problems To Fix

### 1. API Surface Is Incomplete

Many admin and author screens use route actions directly instead of a clear API layer. That works, but production systems need explicit service boundaries for:

- validation
- authorization
- reuse between pages
- audit logs
- tests
- future mobile/external clients
- webhook integrations

### 2. Blog Storage Is File-Based

Blogs currently live in `content/blogs/*.md`. That is okay for a simple portfolio, but it becomes fragile for multi-author production publishing.

Problems:

- ownership is stored in frontmatter, not enforced by database relations
- status transitions are text fields
- reviews and comments are hard to track
- concurrent edits can conflict
- search and pagination are limited
- audit history is difficult
- deleting or renaming files can orphan public links

Recommended direction:

- Move blog metadata and content into database tables.
- Keep markdown content as a database field.
- Optionally store exported markdown snapshots or media assets in object storage.

### 3. Role Isolation Needs To Be Centralized

`requireAdmin()` exists, and author layout checks ownership of `params.id`. But production isolation needs reusable helpers:

- `requireRole(request, roles)`
- `requireActiveAuthor(request)`
- `requireAuthorOwnerOrAdmin(request, ownerId)`
- `requireResourceOwner(request, resourceUserId)`
- `assertCanManageBlog(user, blog)`
- `assertCanPublishBlog(user)`

Authorization should not be scattered across route files.

### 4. Session Refresh Does Not Set Headers Everywhere

`requireUser()` refreshes session data internally, but route loaders do not automatically return the refreshed `Set-Cookie` header.

Production fix:

- return authenticated loader data through a helper that can attach refreshed cookies
- or avoid sliding refresh in every loader and use explicit session renewal

### 5. Admin And Author Dashboards Are Not End-To-End Yet

The dashboard shells exist, but not all workflows are complete:

- author onboarding
- author profile setup
- blog draft/review/publish workflow
- admin review queue
- admin moderation
- analytics
- messages
- ecommerce
- product/order management
- system health

## Missing API Roadmap

### Auth And Session APIs

Existing:

- `POST /api/auth/session`
- `POST /api/auth/logout`

Missing:

- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/revoke-sessions`
- `POST /api/auth/request-password-reset`
- `POST /api/auth/verify-email`

Recommended behavior:

- `GET /api/auth/me` returns current user, role, author status, profile completeness, and dashboard redirect path.
- suspended/revoked authors should authenticate but be blocked from author actions.
- admins should be able to revoke author sessions.

### User And Author APIs

Existing:

- admin authors page has route actions
- author profile route has direct loader/action

Missing:

- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/authors`
- `GET /api/authors/:id`
- `POST /api/authors/invite`
- `POST /api/authors/:id/activate`
- `POST /api/authors/:id/suspend`
- `POST /api/authors/:id/revoke`
- `PATCH /api/authors/:id/profile`

Production rules:

- only admins can list all users
- authors can read/update only their own profile
- admins can update author status
- users should be soft-deleted where possible
- author slug must be unique and immutable or redirectable

### Profile APIs

Existing:

- `GET /api/profile`

Missing:

- `GET /api/profiles/:slug`
- `PATCH /api/profile`
- `POST /api/profile/avatar`
- `DELETE /api/profile/avatar`
- `PATCH /api/profile/preferences`

Required fields:

- display name
- slug
- bio
- avatar
- cover image
- website
- social links
- theme preferences
- guestbook enabled
- analytics enabled

### Blog APIs

Existing:

- `GET /api/blogs`
- `GET /api/blogs/:slug`
- admin blog manager route action
- author blog manager route action

Missing:

- `POST /api/blogs`
- `PATCH /api/blogs/:id`
- `DELETE /api/blogs/:id`
- `POST /api/blogs/:id/submit`
- `POST /api/blogs/:id/approve`
- `POST /api/blogs/:id/reject`
- `POST /api/blogs/:id/publish`
- `POST /api/blogs/:id/unpublish`
- `GET /api/admin/blog-review`
- `GET /api/author/blogs`
- `POST /api/blogs/:id/media`
- `GET /api/blogs/:id/revisions`
- `POST /api/blogs/:id/restore`

Recommended blog statuses:

- `DRAFT`
- `PENDING_REVIEW`
- `CHANGES_REQUESTED`
- `APPROVED`
- `PUBLISHED`
- `ARCHIVED`

Rules:

- authors can create drafts
- authors can edit their own drafts and rejected posts
- authors cannot publish directly unless explicitly allowed
- admins can approve, reject, publish, archive, and edit any post
- public APIs only return published posts
- author dashboards should show the author's own posts only
- admin dashboard should show all posts with filters

### Blog Data Model Needed

Add models similar to:

```prisma
model BlogPost {
  id              String      @id @default(cuid())
  authorId        String
  author          User        @relation(fields: [authorId], references: [id])
  title           String
  slug            String      @unique
  excerpt         String
  content         String
  coverImage      String?
  tags            String[]
  status          BlogStatus  @default(DRAFT)
  publishedAt     DateTime?
  submittedAt     DateTime?
  reviewedAt      DateTime?
  reviewedBy      String?
  rejectionReason String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deletedAt       DateTime?

  @@index([authorId])
  @@index([status])
  @@index([publishedAt])
}

enum BlogStatus {
  DRAFT
  PENDING_REVIEW
  CHANGES_REQUESTED
  APPROVED
  PUBLISHED
  ARCHIVED
}
```

Recommended additional model:

```prisma
model BlogRevision {
  id        String   @id @default(cuid())
  blogId    String
  userId    String
  snapshot  Json
  message   String?
  createdAt DateTime @default(now())
}
```

### Portfolio APIs

Existing:

- `GET /api/portfolio`
- `GET /api/portfolio/:id`
- admin portfolio manager route action

Missing:

- `POST /api/portfolio`
- `PATCH /api/portfolio/:id`
- `DELETE /api/portfolio/:id`
- `POST /api/portfolio/:id/media`
- `POST /api/portfolio/:id/publish`
- `POST /api/portfolio/:id/archive`

Rules:

- public only sees non-deleted published projects
- admin can manage all portfolio projects
- if authors are allowed portfolios later, authors should only manage their own projects

Current schema lacks a `status` field for portfolio. Add:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

### Guestbook APIs

Existing:

- public guestbook route loader/action

Missing:

- `GET /api/guestbook`
- `POST /api/guestbook`
- `PATCH /api/guestbook/:id/moderate`
- `DELETE /api/guestbook/:id`
- `POST /api/guestbook/:id/report`

Production rules:

- public submissions should be rate-limited
- admin should moderate/delete
- suspicious content should be hidden pending review
- store IP hash or abuse metadata if privacy policy allows

### Notifications APIs

Existing:

- `GET/POST /api/notifications`

Missing:

- `POST /api/notifications/broadcast`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `GET /api/admin/notifications`

Rules:

- authors see only their own notifications
- admins can broadcast system messages
- notification creation should be handled by service functions, not scattered route code

### Media And File APIs

Existing:

- `POST /api/s3/presign`

Missing:

- `POST /api/media/presign`
- `GET /api/media`
- `DELETE /api/media/:id`
- `POST /api/media/attach`
- `POST /api/media/cleanup`

Production rules:

- validate MIME type
- validate file size
- restrict upload folders by user
- store media metadata in database
- never expose private storage keys directly
- use signed URLs for private assets

### Admin Dashboard APIs

Missing:

- `GET /api/admin/overview`
- `GET /api/admin/health`
- `GET /api/admin/activity`
- `GET /api/admin/audit-logs`
- `GET /api/admin/content-stats`
- `GET /api/admin/author-stats`

Dashboard should show:

- pending blog reviews
- active authors
- suspended/revoked authors
- recent posts
- recent guestbook entries
- notification counts
- portfolio project counts
- store/order stats later
- system errors

### Author Dashboard APIs

Missing:

- `GET /api/author/overview`
- `GET /api/author/blogs`
- `GET /api/author/stats`
- `GET /api/author/notifications`
- `PATCH /api/author/profile`

Author dashboard should show:

- own draft count
- posts pending review
- published posts
- rejected/change-requested posts
- profile completeness
- recent notifications
- quick actions

### Ecommerce APIs

Planned from the digital product ecommerce guide.

Missing:

- `GET /api/products`
- `GET /api/products/:slug`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/checkout/session`
- `POST /api/webhooks/stripe`
- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/downloads/:token`
- `POST /api/downloads/recover`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `POST /api/admin/coupons`

Database models needed:

- Product
- ProductFile
- Order
- OrderItem
- DownloadGrant
- DownloadEvent
- Coupon

## Recommended API Folder Strategy

React Router route files can stay, but business logic should move into services.

Recommended structure:

```txt
app/
  models/
    user.server.ts
    author.server.ts
    profile.server.ts
    blog.server.ts
    portfolio.server.ts
    guestbook.server.ts
    notification.server.ts
    media.server.ts
    product.server.ts
    order.server.ts
  policies/
    authz.server.ts
  validators/
    blog.schema.ts
    profile.schema.ts
    product.schema.ts
  routes/
    api.blogs.ts
    api.blogs.$id.ts
```

Route files should:

- parse request
- call auth helper
- validate input
- call service/model function
- return `jsonResponse()` or `errorResponse()`

Route files should not:

- contain long business workflows
- duplicate authorization logic
- manually parse markdown frontmatter in several places
- directly scatter notification creation

## Role Isolation Rules

### Public Visitor

Can:

- read published blogs
- view public author profiles
- view published portfolio projects
- submit guestbook entries
- buy products later

Cannot:

- access dashboard routes
- see drafts
- see unpublished portfolio items
- access private media

### Author

Can:

- access own author dashboard
- edit own profile
- create blog drafts
- edit own drafts
- submit own posts for review
- view own notifications

Cannot:

- publish without admin approval
- edit another author's posts
- view admin-only dashboard modules
- manage products/orders unless explicitly granted later
- change own role

### Admin

Can:

- access admin dashboard
- manage all authors
- review and publish blogs
- manage portfolio
- manage documents
- manage notifications
- moderate guestbook
- manage products/orders later

Should be protected from:

- deleting the last admin
- accidentally demoting self without confirmation
- publishing invalid content

## Production Readiness Checklist

### Authentication

- Firebase Admin verification configured with real service account/project.
- Session cookies are secure in production.
- Session TTL and refresh behavior are clear.
- Logout clears cookie.
- Suspended/revoked authors are blocked from private actions.
- Admin setup invite code is removed or tightly controlled after bootstrap.

### Authorization

- Every dashboard loader/action calls an auth helper.
- Every mutating API checks role and ownership.
- Authors cannot access another author's dashboard by changing URL params.
- Public APIs never return drafts/private data.
- Admin-only APIs use `requireAdmin()`.

### Validation

- All actions and APIs use Zod schemas.
- Slugs are normalized and validated.
- File uploads validate size and MIME.
- Markdown/frontmatter input is sanitized or escaped.
- URLs are validated.

### API Consistency

- All API routes use `jsonResponse()` and `errorResponse()`.
- Errors include stable codes.
- Mutations return updated resource or clear success payload.
- List routes support pagination.
- List routes support filters and sort.

### Database

- Add blog/product/order models.
- Add indexes for common filters.
- Use soft delete for user-generated content.
- Add status fields for portfolio and blog posts.
- Add audit log model for admin actions.
- Avoid using filesystem as source of truth for multi-author content.

### Performance

- Cache public read-heavy data.
- Avoid slow SSR loaders.
- Add timeout fallbacks for non-critical public data.
- Paginate large admin lists.
- Avoid reading all markdown files on every request.
- Move expensive analytics to background jobs.

### Security

- Rate-limit auth, guestbook, uploads, checkout, and recovery endpoints.
- Use CSRF protection for cookie-authenticated mutations if needed.
- Do not expose storage keys.
- Use signed URLs for private files.
- Validate webhook signatures.
- Log suspicious auth/download/admin activity.
- Do not leak stack traces in production.

### Observability

- Add structured logs for auth, publish, upload, checkout, and admin actions.
- Track API latency.
- Track loader latency.
- Track failed authorization attempts.
- Add health endpoint.
- Add admin activity feed.

### Testing

- Unit test policy helpers.
- Unit test validators.
- Integration test API mutations.
- E2E test author blog flow.
- E2E test admin approval flow.
- E2E test unauthorized access.
- E2E test public blog visibility.

## End-To-End Dashboard Plan

### Phase 1: Stabilize Auth And Roles

- Add `GET /api/auth/me`.
- Add `requireRole()` and author ownership helpers.
- Normalize redirects by role after login.
- Block suspended/revoked authors.
- Add tests for admin, author, and public access.

### Phase 2: Move Blogs To Database

- Add `BlogPost` and `BlogRevision`.
- Create migration.
- Write importer from `content/blogs/*.md`.
- Replace public blog loaders with database queries.
- Replace admin/author blog manager file writes with API/service calls.

### Phase 3: Author Dashboard

- Author overview stats.
- Profile editor.
- Blog editor.
- Draft save.
- Submit for review.
- Notifications.
- Account settings.

### Phase 4: Admin Dashboard

- Admin overview.
- Author management.
- Blog review queue.
- Publish/reject workflow.
- Portfolio manager.
- Guestbook moderation.
- Notifications broadcast.
- Audit logs.

### Phase 5: Portfolio Refinement

- Add portfolio status.
- Add featured ordering.
- Add media gallery.
- Add project metrics.
- Add case study editor.
- Add public SEO metadata.

### Phase 6: Ecommerce

- Product catalog.
- Product file management.
- Stripe checkout.
- Orders.
- Download grants.
- Coupons.
- Product analytics.

### Phase 7: Production Hardening

- Rate limits.
- Audit logs.
- Health checks.
- Error tracking.
- Backups.
- CI checks.
- E2E tests.
- Deployment runbook.

## Portfolio Website Refinement Ideas

### Public Site

- Add a `/projects` listing route instead of only featured projects on home.
- Add filters for projects by cloud, networking, automation, AI, and security.
- Add case-study pages with problem, architecture, implementation, tradeoffs, and results.
- Add author pages that only show each author's published posts.
- Add structured metadata for blog posts and projects.
- Add a public store route later for digital products.

### Content Quality

- Standardize blog frontmatter or database fields.
- Add cover images and reading time.
- Add tags and topic pages.
- Add related posts.
- Add canonical URLs.
- Add changelog for technical guides.

### Dashboard UX

- Separate admin and author sidebars clearly.
- Show only relevant modules per role.
- Add empty states that explain next actions.
- Add review badges and status chips.
- Add preview buttons before publishing.
- Add autosave for long blog drafts later.

## Priority API Build List

Build in this order:

1. `GET /api/auth/me`
2. role policy helpers
3. database-backed blog models
4. `GET /api/author/blogs`
5. `POST /api/blogs`
6. `PATCH /api/blogs/:id`
7. `POST /api/blogs/:id/submit`
8. `GET /api/admin/blog-review`
9. `POST /api/blogs/:id/approve`
10. `POST /api/blogs/:id/publish`
11. `PATCH /api/author/profile`
12. `GET /api/admin/overview`
13. `GET /api/author/overview`
14. guestbook moderation APIs
15. portfolio CRUD APIs
16. ecommerce product/order APIs

## Definition Of Production Ready

The platform is production-ready when:

- an author can sign in and only see their own dashboard
- an author can write, save, edit, and submit a blog
- an admin can review, reject, approve, and publish the blog
- public visitors only see published content
- suspended authors cannot write or submit
- all mutations validate input and check authorization
- all critical actions are logged
- public pages load quickly with cached data
- dashboard pages are paginated and scoped
- deployment uses real production environment variables
- tests cover auth, ownership, and publish workflows

