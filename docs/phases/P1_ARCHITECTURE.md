# P1 - Architecture Design

## 1. Purpose
Define the high-level architecture of the modernized SaaS application, specifying how components interact, deploy, and scale. This serves as the technical blueprint for all subsequent implementation.

## 2. Architecture Overview
The system employs a **Serverless-First Edge Architecture** utilizing the **React Router Framework (v7)**. 
- **Client Tier:** React 19 rendering on the client with hydrated interactive components (Zustand for client state, React Hook Form for forms).
- **Edge / Server Tier:** React Router `loaders` and `actions` running as Serverless Functions on Vercel. This tier handles authentication checks, validation (Zod), and business logic.
- **Data Tier:** Prisma ORM connected to a managed PostgreSQL database (Supabase) via a connection pooler (e.g., Supavisor) to survive serverless function bursts.

### Component Interaction Flow
1. User navigates to `/dashboard`.
2. React Router executes the `loader` function on the server.
3. `loader` validates auth token via Supabase Auth.
4. `loader` queries PostgreSQL via Prisma.
5. Data is returned and UI is Server-Side Rendered (SSR) and streamed to the client.
6. Client hydrates and becomes interactive.

## 3. Folder Structure Impact
Architecture dictates the folder structure. Server-only code (loaders, actions, db queries) must be completely isolated from client code to prevent accidental leakage of secrets. See P2 for `/app/routes` and `/app/services` separation.

## 4. Best Practices
- **Server-Side Rendering (SSR):** Default to SSR for all public and authenticated routes to improve perceived performance and SEO.
- **Resource Routes:** For non-UI endpoints (e.g., webhooks, PDF generation), use React Router Resource Routes (routes that export a `loader` or `action` but no default component).
- **Data Mutation:** Use React Router's `<Form>` or `useSubmit()` which automatically trigger `actions` and invalidate all `loaders`, eliminating the need for manual cache management.

## 5. Anti-patterns
- **Building a separate REST API:** Do not build a `/api` folder with Express-like endpoints for your own frontend to consume. Loaders and Actions replace this.
- **Leaking Server Secrets:** Never import `server-only` libraries (like `prisma` or `crypto`) directly into a React component. 

## 6. Examples
*Standard Route Module Architecture:*
```tsx
import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@react-router/node";
import { useLoaderData, Form } from "@react-router/react";
import { prisma } from "~/lib/db.server";
import { requireUser } from "~/lib/auth.server";
import { z } from "zod";

// 1. Loader (Server-only data fetching)
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const data = await prisma.project.findMany({ where: { userId: user.id } });
  return json({ data });
}

// 2. Action (Server-only data mutation)
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  // Zod validation here...
  await prisma.project.create({ data: { /* ... */ } });
  return json({ success: true });
}

// 3. UI (Client & Server rendering)
export default function Dashboard() {
  const { data } = useLoaderData<typeof loader>();
  return (
    <div>
      {data.map(p => <div key={p.id}>{p.title}</div>)}
      <Form method="post"><button type="submit">Create</button></Form>
    </div>
  );
}
```

## 7. Migration Strategy
- Configure Vite with the React Router plugin.
- Create the Prisma schema mirroring the current Mongoose models.
- Map existing `server.ts` Express routes to new React Router route modules incrementally.

## 8. Acceptance Criteria
- [ ] No Express server is required to run the application in dev or production.
- [ ] All database reads occur inside a `loader`.
- [ ] All database writes occur inside an `action`.

## 9. Future Scalability
The serverless nature means the application can scale horizontally from zero to thousands of concurrent executions instantaneously. The primary bottleneck shifts from the Node server to the Database Connection Pool, which is mitigated by using Supavisor / Prisma Accelerate.
