# Author Dashboard Implementation Plan

## Overview
This document outlines the complete implementation strategy for providing unique, isolated dashboards for guest authors while maintaining the existing admin dashboard for the portfolio owner (Yahya).

## Current State Analysis

### Existing Components
- **AuthorDashboard.tsx**: Already exists with isolated layout (blogs, profile, settings tabs)
- **BlogManager.tsx**: Has ownership-based edit/delete logic (line 269)
- **App.tsx**: Has `/author/*` routing that renders AuthorDashboard for authors
- **User Model**: Supports `role` field ('admin' | 'author')

### Current Issues
1. Authors are being routed to the shared admin dashboard instead of their isolated dashboard
2. Blog ownership tracking exists but may not be fully enforced in all CRUD operations
3. Admin author management interface is missing
4. Publish request workflow for authors is not implemented

## Implementation Phases

### Phase 1: Routing & Access Control (Priority: HIGH)
**Objective**: Ensure authors are automatically routed to their isolated dashboard

#### Tasks
1. **Verify Auth Redirect Logic**
   - Location: `src/App.tsx` lines 198-201
   - Current: Authors are redirected to 'author' tab on login
   - Action: Ensure this works correctly and authors see AuthorDashboard, not admin dashboard

2. **Fix Mobile Menu Navigation**
   - Location: `src/App.tsx` lines 492-501
   - Current: Author profile button exists but may not route correctly
   - Action: Ensure clicking "Author Profile" routes to `/author` route, not admin profile

3. **Fix Desktop Sidebar Navigation**
   - Location: `src/App.tsx` lines 642-654
   - Current: Author Profile button exists
   - Action: Ensure it routes to `/author` and not admin profile

4. **Remove Admin Features from Author View**
   - Location: `src/App.tsx` mobile menu and desktop sidebar
   - Action: Hide all admin-specific navigation items when `userRole === 'author'`

### Phase 2: Backend Blog Ownership Enforcement (Priority: HIGH)
**Objective**: Ensure authors can only CRUD their own blogs

#### Tasks
1. **Verify POST /api/blogs Ownership Injection**
   - Location: `server/routes/api.ts` (blog creation endpoint)
   - Current: Should inject authorId from Firebase UID
   - Action: Verify and ensure authorId is securely injected into blog frontmatter

2. **Verify PUT /api/blogs Ownership Check**
   - Location: `server/routes/api.ts` (blog update endpoint)
   - Current: Should check if authorId matches requester's UID
   - Action: Implement ownership validation - authors can only update their own blogs, admins can update any

3. **Verify DELETE /api/blogs Ownership Check**
   - Location: `server/routes/api.ts` (blog deletion endpoint)
   - Current: Should check if authorId matches requester's UID
   - Action: Implement ownership validation - authors can only delete their own blogs, admins can delete any

4. **Add authorId to Blog Metadata**
   - Location: Blog frontmatter schema
   - Action: Ensure authorId is consistently tracked in all blog metadata

### Phase 3: Admin Author Management Interface (Priority: MEDIUM)
**Objective**: Allow admin to manage authors and approve publish requests

#### Tasks
1. **Create Author Management Component**
   - File: `src/components/admin/AuthorManager.tsx`
   - Features:
     - List all registered authors
     - View author profiles (name, email, linkedin, avatar)
     - Approve/reject author accounts
     - View author's blog posts
     - Enable/disable author publishing rights
     - Delete author accounts

2. **Add Backend Author Management API**
   - Endpoints:
     - `GET /api/authors` - List all authors (admin only)
     - `PUT /api/authors/:id/approve` - Approve author (admin only)
     - `PUT /api/authors/:id/disable` - Disable author (admin only)
     - `DELETE /api/authors/:id` - Delete author (admin only)

3. **Add Author Management to Admin Navigation**
   - Location: `src/App.tsx` sidebar and mobile menu
   - Action: Add "Authors" button in admin navigation (between "Companies" and "Settings")

4. **Implement Publish Request Workflow**
   - Feature: Authors can request to publish (admin approval required)
   - Backend: Add `publishRequested: boolean` and `publishedAt: Date` fields to blog schema
   - Frontend: Add "Request Publish" button in AuthorDashboard BlogManager
   - Admin: Add "Publish Requests" queue in AuthorManager

### Phase 4: Author Dashboard Enhancements (Priority: MEDIUM)
**Objective**: Improve author dashboard experience

#### Tasks
1. **Add Blog Statistics**
   - Show total posts, published posts, draft posts
   - Show view counts (if tracking is implemented)

2. **Add Draft/Publish Status**
   - Allow authors to save drafts without publishing
   - Show clear status indicators (Draft, Pending Approval, Published)

3. **Improve Profile Editor**
   - Location: `src/components/admin/AuthorProfileEditor.tsx`
   - Action: Ensure authors can update their display name, LinkedIn, and avatar

4. **Add Settings Panel**
   - Location: Already exists in AuthorDashboard.tsx (settings tab)
   - Action: Ensure password reset works correctly

### Phase 5: Security & Validation (Priority: HIGH)
**Objective**: Ensure security boundaries are enforced

#### Tasks
1. **Verify Role-Based Access Control (RBAC)**
   - All admin endpoints must verify `userRole === 'admin'`
   - All author endpoints must verify `userRole === 'author'` or ownership

2. **Add Middleware for Route Protection**
   - Location: `server/middleware/auth.ts`
   - Action: Ensure all API routes are properly protected

3. **Test Orphaned Account Fallback**
   - Current: Orphaned Firebase accounts default to 'author' role
   - Action: Verify this works correctly and cannot be bypassed

4. **Add Audit Logging**
   - Log all author management actions (approve, disable, delete)
   - Log all blog publish actions

## File Structure Changes

### New Files to Create
```
src/components/admin/
  └── AuthorManager.tsx          # Admin author management interface

server/routes/
  └── authors.ts                 # Author management API endpoints (or add to api.ts)
```

### Files to Modify
```
src/App.tsx                      # Fix routing, add author management nav
src/components/admin/BlogManager.tsx  # Add publish request workflow
server/routes/api.ts             # Add author management endpoints, verify ownership checks
server/middleware/auth.ts        # Enhance RBAC verification
```

## Testing Checklist

### Author Dashboard Access
- [ ] Authors login and see AuthorDashboard (not admin dashboard)
- [ ] Authors cannot access admin routes (redirected to author dashboard)
- [ ] Authors can access public pages (blog, projects, guestbook)

### Blog Ownership
- [ ] Authors can create blogs (authorId is injected)
- [ ] Authors can only edit their own blogs
- [ ] Authors can only delete their own blogs
- [ ] Admins can edit/delete any blog
- [ ] Blog ownership is enforced on all CRUD operations

### Admin Author Management
- [ ] Admin can view list of all authors
- [ ] Admin can approve/reject author accounts
- [ ] Admin can disable/enable author publishing rights
- [ ] Admin can delete author accounts
- [ ] Admin can view author's blog posts

### Publish Workflow
- [ ] Authors can request to publish blogs
- [ ] Admin sees publish requests in queue
- [ ] Admin can approve/reject publish requests
- [ ] Published blogs appear on public blog list
- [ ] Draft blogs do not appear on public blog list

### Security
- [ ] Authors cannot access admin API endpoints
- [ ] Admin-only routes are protected
- [ ] Ownership checks cannot be bypassed
- [ ] Orphaned accounts default to author role
- [ ] Audit logs are generated for management actions

## Deployment Notes

### Environment Variables
No new environment variables required.

### Database Changes
- Consider adding indexes to User model for faster author queries
- Consider adding `publishRequested` and `publishedAt` fields to blog schema if not present

### Rollback Plan
- If issues arise, can temporarily route all users to admin dashboard
- Can disable author management features via feature flags
- Blog ownership checks can be temporarily relaxed for debugging

## Success Criteria
1. Authors have a completely isolated dashboard experience
2. Authors can only manage their own content
3. Admin has full control over author accounts and publishing
4. Security boundaries are enforced at both frontend and backend levels
5. Publish workflow is clear and functional
6. No regression in existing admin functionality

## Next Steps
1. Review and approve this implementation plan
2. Begin with Phase 1 (Routing & Access Control) - highest priority
3. Test each phase before moving to the next
4. Update this document as implementation progresses
