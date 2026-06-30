export const ROUTES = {
  PUBLIC: {
    HOME: '/',
    BLOG: '/blog',
    GUESTBOOK: '/guestbook',
    AUTHOR: (slug: string) => `/authors/${slug}`,
  },
  ADMIN: {
    DASHBOARD: '/dashboard',
    APPLICATIONS: '/applications',
    AUTHORS: '/authors',
    BLOGS: '/blog-manager',
    COMPANIES: '/companies',
    DOCUMENTS: '/documents',
    KANBAN: '/kanban',
    ANALYTICS: '/analytics',
    MESSAGES: '/messages',
    CALENDAR: '/calendar',
    NOTIFICATIONS: '/notifications',
    PORTFOLIO: '/portfolio-manager',
    SETTINGS: '/settings',
    ADMIN_MANAGEMENT: '/admin-management',
    ECOMMERCE: {
      PRODUCTS: '/store/products',
      ORDERS: '/store/orders',
      INVENTORY: '/store/inventory',
      COUPONS: '/store/coupons',
    },
  },
  AUTHOR: {
    DASHBOARD: (id: string) => `/author/${id}/dashboard`,
    BLOGS: (id: string) => `/author/${id}/blogs`,
    PROFILE: (id: string) => `/author/${id}/profile`,
  },
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/api/auth/logout',
  }
} as const;
