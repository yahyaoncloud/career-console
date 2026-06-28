import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [

  route("api/auth/session", "routes/api.auth.session.ts"),
  route("api/auth/logout", "routes/api.auth.logout.ts"),
  route("api/s3/presign", "routes/api.s3.presign.ts"),
  
  layout("routes/_public/_layout.tsx", [
    index("routes/_public/home.tsx"),
    route("blog", "routes/_public/blog.tsx"),
    route("blog/:slug", "routes/_public/blog.$slug.tsx"),
    route("projects", "routes/_public/projects.tsx"),
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
  ]),

  layout("routes/_author/_layout.tsx", [
    route("author-blogs", "routes/_author/blogs.tsx"),
    route("author-profile", "routes/_author/profile.tsx"),
    route("settings", "routes/_author/settings.tsx"),
  ])
] satisfies RouteConfig;
