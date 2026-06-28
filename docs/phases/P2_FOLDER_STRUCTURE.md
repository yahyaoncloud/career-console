# P2 - Folder Structure

## 1. Purpose
Define a robust, feature-driven, and scalable folder structure tailored for the React Router Framework. A well-designed structure prevents "God folders," enforces boundaries between client and server code, and enables a team to locate code intuitively.

## 2. Architecture
The folder structure adopts a **Feature-First** (or Domain-Driven) approach where appropriate, combined with React Router's convention-based routing.

## 3. Folder Structure
```text
/
├── prisma/                 # Database schema, migrations, and seed scripts
│   └── schema.prisma
├── public/                 # Static assets (favicons, manifest)
├── docs/                   # Architectural documentation (ADRs, phases)
├── app/                    # Main application code (React Router root)
│   ├── components/         # Global shared UI components
│   │   ├── ui/             # Shadcn UI primitives (Button, Card, Input)
│   │   └── shared/         # Shared complex components (Header, Footer, ErrorState)
│   ├── hooks/              # Global shared React hooks (client-side)
│   ├── lib/                # Shared utilities and configuration
│   │   ├── db.server.ts    # Prisma client singleton (SERVER ONLY)
│   │   ├── auth.server.ts  # Session/Auth logic (SERVER ONLY)
│   │   ├── env.server.ts   # Zod environment variable validation
│   │   └── utils.ts        # Tailwind/cn utilities
│   ├── models/             # Domain-specific logic, validations, and DTOs
│   │   ├── applications/   # e.g., Application schema, custom queries
│   │   ├── users/
│   │   └── profile/        # User profile management
│   ├── routes/             # React Router file-based routing
│   │   ├── _public/        # Pathless layout for public pages
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx   # Landing page
│   │   │   └── login.tsx
│   │   ├── _admin/         # Pathless layout for authenticated app
│   │   │   ├── _layout.tsx # Dashboard sidebar/nav
│   │   │   ├── dashboard.tsx
│   │   │   ├── profile.tsx # User profile management
│   │   │   ├── settings.tsx # User settings
│   │   │   └── applications/
│   │   │       ├── index.tsx
│   │   │       └── $appId.tsx # Dynamic route
│   │   └── api/            # Resource routes (webhooks, pure APIs)
│   ├── styles/             # Global CSS (Tailwind index)
│   ├── root.tsx            # Root layout and ErrorBoundary
│   └── entry.server.tsx    # SSR entry point
├── .env.example
├── package.json
└── vite.config.ts          # Configured for React Router plugin
```

## 4. Best Practices
- **`.server.ts` Convention:** Any file that imports Node APIs, accesses the database, or uses secrets MUST include `.server.` in its filename (e.g., `auth.server.ts`). React Router will explicitly prevent these files from being bundled into the client build.
- **Colocation:** If a component is only used by one specific route (e.g., `JobBoardFilters`), place it inside a folder alongside that route rather than bloating the global `app/components/` directory.
- **Flat Routes:** Use React Router's v7 flat-route conventions for better predictability.

## 5. Anti-patterns
- **Deep Nesting:** Avoid folders deeper than 4 levels.
- **Type Separation:** Do not create a global `types/` folder for every interface. Keep interfaces close to the domains they describe (e.g., `app/models/application/types.ts`).
- **Mixed Concerns:** Do not mix database query logic directly inside UI component files. Keep it in loaders, actions, or dedicated `models/` files.

## 6. Examples
*Colocated Route Example:*
```text
/app/routes/_admin.applications.$appId/
  ├── route.tsx           # The loader, action, and default export
  ├── ApplicationHeader.tsx # Component only used here
  └── StatusModal.tsx       # Component only used here
```

## 7. Migration Strategy
1. Create the new `/app` structure alongside the existing `/src` and `/server`.
2. Migrate `src/index.css` to `app/styles/index.css`.
3. Set up Shadcn UI in `app/components/ui/`.
4. Migrate the legacy `types/` into appropriate `models/` or colocate them.
5. Once all routes are ported, delete `/src` and `/server`.

## 8. Acceptance Criteria
- [ ] The `app/` folder is the sole source of application logic.
- [ ] No server code leaks into the client bundle (verified by build tools).
- [ ] Shadcn components are cleanly isolated in `app/components/ui`.

## 9. Future Scalability
This structure scales elegantly. If the application grows into a massive monolith, the `app/routes/` and `app/models/` directories can easily be extracted into monorepo packages (e.g., using Turborepo) based on domain boundaries (e.g., `@career-console/jobs`, `@career-console/auth`).
