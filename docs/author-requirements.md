# Author Dashboard & Blog Isolation Requirements

This document outlines the requirements and phased implementation plan for isolating guest authors and providing them with a dedicated dashboard.

## Overview
Guest authors on the platform need a secure, isolated environment where they can manage their own content without affecting the rest of the portfolio or other authors' content. They should have a unique dashboard experience tailored to their needs.

## Phase 1: Backend Blog Isolation (CRUD)
Currently, blogs are stored as markdown files in `content/blogs/` with no strong ownership guarantees. 
- **Ownership Tracking**: Update the markdown frontmatter generator to securely inject and track `authorId` (Firebase UID).
- **Update Protection**: Modify `POST /api/blogs` to verify ownership. Authors can only update files where the existing `authorId` matches their own UID. Admins retain global edit rights.
- **Delete Protection**: Modify `DELETE /api/blogs/:slug` to prevent authors from deleting files they do not own. Admins retain global delete rights.

## Phase 2: Author Dashboard UI
Authors require a dedicated layout distinct from the main system owner's CMS dashboard.
- **Component Creation**: Build `AuthorDashboard.tsx` to serve as the main layout for users with the `author` role.
- **Blog Management**: Integrate the existing `BlogManager` into this dashboard. Ensure authors only see edit/delete actions for their own blogs.
- **Profile Management**: Integrate `AuthorProfileEditor` so authors can update their display name, LinkedIn, and Avatar.
- **Settings & Security**: Create a Settings panel allowing authors to reset or change their password via Firebase Authentication.
- **Feature Restrictions**: Hide all irrelevant portfolio management tools (Resume, Kanban, Applications, etc.) from the author view.

## Phase 3: Routing and Access Control
Ensure the application securely routes users based on their role.
- **App Routing**: Update `App.tsx` so that navigating to the dashboard automatically serves `AuthorDashboard` for authors and `DashboardOverview` for admins.
- **Public Visibility**: Ensure authors can still freely view all public pages and that their blogs render correctly on the public blog lists.
- **Role Fallback Security**: Ensure that any orphaned Firebase accounts strictly default to the `author` role (completed) and cannot bypass these restrictions.
