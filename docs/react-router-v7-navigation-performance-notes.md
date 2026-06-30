# React Router v7 Navigation And Page Performance Notes

These notes summarize the navigation debugging work done on the public portfolio routes and document best practices for building smooth React Router v7 pages.

## What Was Happening

The public pages had two related problems:

- Pages were visually revealing twice during navigation.
- Navbar clicks felt extremely slow, sometimes appearing to take minutes before the destination page settled.

The double reveal came from multiple transition systems trying to own the same route change. The public layout had route-level animation, a black cover overlay, and a held `useOutlet()` render. Some pages also had their own initial animations. That made the destination page appear, get covered, and then reveal again.

The slow navigation was not caused by the click handler itself. Direct client-side browser testing showed the navbar could route in roughly 0.5-2 seconds after fixes. The worst delays came from route loaders and the local dev SSR server doing full document work, especially when route data or filesystem/database reads were slow.

## What Was Changed

### Public Layout

File:
`app/routes/_public/_layout.tsx`

Changes:

- Removed the stale `useOutlet()` page-holding transition.
- Removed the black full-screen cover overlay.
- Removed `prefetch="intent"` from public navbar links.
- Kept a single enter-only `motion.div` transition around `<Outlet />`.
- Kept mobile menu animation separate from page navigation.

Why:

- React Router route data is tied to the active route match. Holding an old outlet after the match changes can make `useLoaderData()` undefined or stale.
- Exit animations plus overlay animations can create stacked reveals.
- `prefetch="intent"` can start loaders on hover/focus, which may feel like the navbar is doing hidden work before the user commits.

### Home Loader

File:
`app/routes/_public/home.tsx`

Changes:

- Added a reusable fallback user object.
- Added a timeout wrapper around profile and portfolio loader calls.
- Added a defensive fallback for `useLoaderData()` being temporarily undefined.

Why:

- Public landing pages should not block forever on a profile or portfolio query.
- If a backend read is slow in development, the page should still render useful fallback content.
- Defensive loader data handling avoids runtime crashes during HMR or interrupted navigation.

### Blog Loader

Files:
`app/routes/api.blogs.ts`
`app/routes/_public/blog.tsx`

Changes:

- Added in-memory caching for the blog index.
- Added a 2 second timeout around the blog route loader call.

Why:

- Blog index generation reads markdown files from disk. Even small file reads can become slow on OneDrive-backed folders or during dev-server churn.
- The public blog list should show an empty/fallback state instead of holding navigation open indefinitely.

### Guestbook Loader

File:
`app/routes/_public/guestbook.tsx`

Changes:

- Added in-memory caching for guestbook entries.
- Added a 2.5 second timeout around the database read.
- Cleared the cache after a successful guestbook submission.

Why:

- Guestbook reads do not need to block navigation forever.
- Short caching makes repeat visits fast while still allowing fresh entries after writes.

## React Router v7 Page Transition Best Practices

### Use One Transition Owner

Pick one place to animate route changes.

Good:

- Animate only in the layout around `<Outlet />`.
- Use enter-only animations for simple public pages.
- Keep modals and mobile menus as separate animations.

Avoid:

- Layout exit animation plus page enter animation plus black overlay.
- Holding old route elements manually with `useOutlet()`.
- Animating both parent layout and child route with competing first-paint effects.

### Prefer Direct `<Outlet />`

Use React Router's normal route rendering unless there is a strong reason not to.

Avoid holding old route elements manually:

```tsx
const outlet = useOutlet();
const [renderedOutlet, setRenderedOutlet] = useState(outlet);
```

That pattern can break route data assumptions because `useLoaderData()` belongs to the current active route match.

Preferred:

```tsx
<motion.div key={location.pathname}>
  <Outlet />
</motion.div>
```

### Avoid Exit Animations When Data Must Change Fast

`AnimatePresence mode="wait"` waits for the old route to exit before showing the new one. That can make navigation feel slower.

For content sites, prefer:

```tsx
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.18 }}
>
  <Outlet />
</motion.div>
```

This gives a single smooth reveal without delaying route commits.

### Respect Reduced Motion

Use `useReducedMotion()` and disable motion for users who request it.

```tsx
const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
>
  <Outlet />
</motion.div>
```

## Loader Best Practices

### Keep Public Loaders Fast

Public navigation waits for route loaders. If a loader is slow, the click feels slow.

Targets:

- Ideal public route loader: under 300ms
- Acceptable database-backed route: under 1s
- Anything over 2s should return fallback data or stream/defer where possible

### Add Timeouts Around Non-Critical Data

Profile, portfolio cards, blog lists, and guestbook entries are useful but should not freeze navigation.

Pattern:

```ts
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    })
  ]);
}
```

Use this for public data that can degrade gracefully.

### Cache Read-Heavy Public Data

Good candidates:

- blog index
- public profile
- portfolio project lists
- guestbook entries
- product catalog

Use short TTLs for dynamic data and longer TTLs for mostly static content.

Suggested TTLs:

- Guestbook entries: 30 seconds
- Blog index: 1-5 minutes
- Profile: 5 minutes
- Product catalog: 1-5 minutes

Clear the relevant cache after writes.

### Avoid Calling Internal API Routes Through HTTP

Inside route loaders, prefer direct shared functions or direct data access over calling your own app through `fetch('/api/...')`.

Better:

```ts
const profile = await getPublicProfile();
```

Avoid:

```ts
const res = await fetch('/api/profile');
```

Direct calls avoid network overhead and SSR/dev-server complexity.

### Extract Shared Data Functions

For long-term maintainability, move data access out of route files.

Recommended structure:

```txt
app/
  models/
    profile.server.ts
    portfolio.server.ts
    blogs.server.ts
    guestbook.server.ts
```

Then route loaders become thin:

```ts
export async function loader() {
  const profile = await getPublicProfile();
  return { profile };
}
```

## Navbar Best Practices

### Be Careful With `prefetch="intent"`

`prefetch="intent"` starts loading route data when the user hovers or focuses a link.

Use it only when:

- loaders are fast
- data is cached
- hover/focus preloading will not overload the dev server

Avoid it when:

- loaders hit slow databases
- loaders read many files
- the user reports navigation feeling delayed or weird
- the same links are frequently hovered accidentally

### Keep Click Handlers Simple

Navbar click handlers should do only local UI cleanup.

Good:

```tsx
onClick={() => setIsMobileMenuOpen(false)}
```

Avoid:

```tsx
onClick={async () => {
  await loadData();
  setIsMobileMenuOpen(false);
}}
```

React Router should own navigation and data loading.

## Dev Server Notes

Full document requests in development can be much slower than client-side route transitions because Vite and React Router may compile, transform, and SSR modules.

When measuring navigation:

- Measure actual client-side link clicks in the browser.
- Do not rely only on `Invoke-WebRequest` to full document URLs.
- First request after edits may include HMR or SSR compilation cost.
- Restart the dev server after major dependency or route changes.

Useful checks:

- API route timing
- full document timing
- client-side click timing
- console errors
- network waterfall

## Debugging Checklist

When a page transition feels slow:

- Check whether the URL changes immediately.
- Check route loader timings.
- Check whether `prefetch="intent"` is triggering hidden loader work.
- Check for `AnimatePresence mode="wait"`.
- Check for black overlays, route covers, or held outlets.
- Check if child pages also animate on first paint.
- Check if the dev server is recompiling.
- Check if database queries are waiting on connection setup.
- Check if files are being read from a synced folder such as OneDrive.

When a page reveals twice:

- Search for multiple route-level animations.
- Search for overlays like `fixed inset-0`.
- Search for `useOutlet()` state holding.
- Search for child components with `initial` motion props.
- Make one component responsible for route reveal.
- Prefer enter-only animation.

## Recommended Public Page Pattern

```tsx
import { Outlet, useLocation } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';

export function PublicLayout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <Header />
      <main>
        <motion.div
          key={location.pathname}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
```

## Recommended Loader Pattern

```ts
export async function loader() {
  const [profile, projects] = await Promise.all([
    withTimeout(getPublicProfile(), 2000, null),
    withTimeout(getFeaturedProjects(), 2000, []),
  ]);

  return {
    profile: profile ?? FALLBACK_PROFILE,
    projects,
  };
}
```

## Final Rule Of Thumb

For public pages, navigation should never depend on perfect backend speed.

Render the page quickly, show cached or fallback content when needed, and let only one smooth animation own the route reveal.

