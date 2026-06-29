import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [

  route("api/auth/session", "routes/api.auth.session.ts"),
  route("api/auth/logout", "routes/api.auth.logout.ts"),
  route("api/s3/presign", "routes/api.s3.presign.ts"),
  route("api/portfolio", "routes/api.portfolio.ts"),
  route("api/portfolio/:id", "routes/api.portfolio.$id.ts"),

  route("api/profile", "routes/api.profile.ts"),
  route("api/blogs", "routes/api.blogs.ts"),
  route("api/blogs/:slug", "routes/api.blogs.$slug.ts"),
  route("api/notifications", "routes/api.notifications.ts"),
  route("login", "routes/login.tsx"),

  layout("routes/_public/_layout.tsx", [
    index("routes/_public/home.tsx"),
    route("blog", "routes/_public/blog.tsx"),
    route("blog/:slug", "routes/_public/blog.$slug.tsx"),
    route("project/:id", "routes/_public/project.$id.tsx"),
    route("author/:slug", "routes/_public/author.$slug.tsx"),
    route("guestbook", "routes/_public/guestbook.tsx"),
  ]),

  layout("routes/_admin/_layout.tsx", [
    route("dashboard", "routes/_admin/dashboard.tsx"),
    route("portfolio-manager", "routes/_admin/portfolio-manager.tsx"),
    route("kanban", "routes/_admin/kanban.tsx"),
    route("applications", "routes/_admin/applications.tsx"),
    route("authors", "routes/_admin/authors.tsx"),
    route("blog-manager", "routes/_admin/blog-manager.tsx"),
    route("companies", "routes/_admin/companies.tsx"),
    route("documents", "routes/_admin/documents.tsx"),
    route("notifications", "routes/_admin/notifications.tsx"),
    route("settings", "routes/_admin/settings.tsx"),
    
    // Coming Soon Routes
    route("calendar", "routes/_admin/coming-soon.tsx"),
    route("store/products", "routes/_admin/coming-soon.tsx"),
    route("store/orders", "routes/_admin/coming-soon.tsx"),
    route("store/inventory", "routes/_admin/coming-soon.tsx"),
    route("store/coupons", "routes/_admin/coming-soon.tsx"),
    route("analytics", "routes/_admin/coming-soon.tsx"),
    route("messages", "routes/_admin/coming-soon.tsx"),
  ]),

  layout("routes/_author/_layout.tsx", [
    route("author/:id/dashboard", "routes/_author/author-dashboard.tsx"),
    route("author/:id/blogs", "routes/_author/blogs.tsx"),
    route("author/:id/profile", "routes/_author/profile.tsx"),
  ]),
] satisfies RouteConfig;
