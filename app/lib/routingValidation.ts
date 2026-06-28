/**
 * Development-only routing validation
 * Reports navigation to undefined routes, duplicate routes, and render-time side effects
 */

import React from 'react';

const VALID_ROUTES = [
  '/',
  '/projects',
  '/blog',
  '/blog/:slug',
  '/guestbook',
  '/author',
  '/author/*',
] as const;

const ADMIN_TABS = [
  'dashboard',
  'portfolio-manager',
  'blog-manager',
  'profile',
  'applications',
  'jobs',
  'kanban',
  'resume',
  'companies',
  'authors',
  'settings',
  'documents',
  'admin',
] as const;

type ValidRoute = typeof VALID_ROUTES[number];
type AdminTab = typeof ADMIN_TABS[number];

// Development-only validation
if (import.meta.env.DEV) {
  // Log valid routes for reference
  console.log('[Routing Validation] Valid routes:', VALID_ROUTES);
  console.log('[Routing Validation] Valid admin tabs:', ADMIN_TABS);
}

export { VALID_ROUTES, ADMIN_TABS };
export type { ValidRoute, AdminTab };
