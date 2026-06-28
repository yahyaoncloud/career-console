# P0 - Project Vision & Core Strategy

## 1. Purpose
The purpose of this document is to establish the true north for the engineering team. It defines the overarching goal of transforming the existing React/Express prototype into a production-grade, enterprise-ready, serverless-native SaaS application capable of serving paying customers reliably over the next five years.

## 2. Architecture Philosophy
The architecture is fundamentally shifting from a "Modular Monolith" running in an Express container to a **Serverless-First Edge Architecture**.
- **Frontend/Backend Convergence:** Utilizing the React Router v7 Framework (formerly Remix) to collapse the network waterfall, bringing data fetching (loaders) and mutations (actions) natively into the route modules.
- **Strict Typing:** End-to-end type safety from the database (Prisma) to the client UI, validated by Zod at every boundary.
- **Database Scalability:** Moving to PostgreSQL via Supabase to handle relational constraints, Role-Based Access Control (RBAC), and connection pooling efficiently in a serverless environment.

## 3. Folder Structure impact
This vision mandates a complete reorganization of the codebase. See [P2_FOLDER_STRUCTURE.md](./P2_FOLDER_STRUCTURE.md) for details. The legacy `server/` and `src/` split will be deprecated in favor of a unified `/app` directory tailored for React Router.

## 4. Best Practices
- **Serverless Native:** Assume every function executes in an isolated, ephemeral environment. State must live in the database or client, never in server memory.
- **Single Source of Truth:** Zod schemas are the absolute source of truth for validation, form generation, and API types.
- **Fail Fast, Fail Safely:** Embrace Error Boundaries. A failure in one route should never crash the entire application.

## 5. Anti-patterns
- **God Files:** No file should exceed 300 lines without explicit justification. Break down massive files like `App.tsx` and `api.ts`.
- **Client-Side Data Waterfalls:** Avoid `useEffect` for data fetching. Data must be injected by loaders before the component mounts.
- **Implicit Schemas:** Do not define TypeScript interfaces manually if they represent database models. Generate them via Prisma or infer them from Zod.

## 6. Examples
*Current Anti-pattern:*
```typescript
// Client fetching data after mount
useEffect(() => { fetch('/api/data').then(...) }, [])
```
*Target Architecture:*
```typescript
// Server-side loader injected via React Router
export const loader = async () => { return await prisma.data.findMany(); };
export default function Route() { const data = useLoaderData<typeof loader>(); }
```

## 7. Migration Strategy
1. Freeze feature development on the Express architecture.
2. Initialize the React Router framework scaffolding.
3. Migrate pure UI components (Shadcn) to the new structure.
4. Port Express routes to React Router `actions`/`loaders` iteratively.

## 8. Acceptance Criteria
- [ ] No `useEffect` is used for primary data fetching.
- [ ] The application deploys seamlessly to Vercel without a custom Express server.
- [ ] All database queries execute via Prisma.

## 9. Future Scalability
The architecture must support multi-tenancy inherently. All database tables and loaders must be designed to accept and filter by `tenantId` (or `userId` initially), enabling smooth transitions to enterprise B2B models.
