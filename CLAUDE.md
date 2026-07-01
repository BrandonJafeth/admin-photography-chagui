# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Admin dashboard (Next.js 16, App Router) for a photography business. Manages `services` and `paquetes` (packages) backed by Supabase (Postgres), with images hosted on Cloudinary. This is a standalone app — despite what `AGENTS.md` describes (a monorepo with a separate Astro public site, Prisma, tRPC, and a full test suite), none of that exists in this repo. `AGENTS.md` is an aspirational/outdated planning doc; trust the actual code over it, especially for architecture, testing, and tooling claims.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

There is no test suite configured (no vitest/playwright/jest in package.json), despite `AGENTS.md` referencing TDD and Vitest — don't assume test infra exists.

## Architecture

**Data flow pattern** — new features should follow this three-layer structure:
1. `services/*.service.ts` — static classes/functions wrapping raw Supabase queries (e.g. `ServicesService.getAll()`, `PackagesService`, `service-faqs.service.ts`). Throw on Supabase errors with a Spanish-language message.
2. `hooks/use*.ts` — TanStack Query wrappers around the service layer (`useServices`, `usePackages`, `useServiceFaqs`). Mutations invalidate the relevant query key on success.
3. Components in `components/features/{services,packages,service-faqs}/` consume the hooks. Forms use `react-hook-form` + `@hookform/resolvers/zod` against schemas in `lib/validations/*.ts`.

**Routing** — App Router with two route groups:
- `app/(auth)/login` — public login page.
- `app/(dashboard)/...` — everything else (`page.tsx` dashboard, `servicios/`, `servicios/[id]/faqs/`, `paquetes/`), wrapped by `app/(dashboard)/layout.tsx` which renders `Sidebar` + `Header` inside a `SidebarProvider`.

**Auth/route protection** — `proxy.ts` at the repo root, not `middleware.ts`. Next.js 16 renamed the middleware convention to "proxy" (exports a `proxy` function instead of `middleware`). It refreshes the Supabase session from cookies, redirects unauthenticated users to `/login` (or returns 401 JSON for `/api/*`), and redirects authenticated users away from `/login`.

**Supabase clients — two exist, pick correctly**:
- `lib/supabase/client.ts` (`createClient()`, uses `@supabase/ssr`'s `createBrowserClient`) — used by `services/services.service.ts`, `packages.service.ts`, `service-faqs.service.ts`. Prefer this for any new service.
- `lib/supabaseClient.ts` (singleton `supabaseClient`) — older duplicate, only used by `services/auth.service.ts` for sign-in/sign-out. Don't add new usages; it's a leftover, not a second intentional client.

**Cloudinary** — `lib/cloudinary.ts` uploads directly from the browser to Cloudinary using an unsigned upload preset (env: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`), compressing images client-side first via `lib/image-compression.ts`. Deletion needs a signed request (SHA-1 signature), which requires server-side `crypto` — so `deleteFromCloudinary()` calls `POST /api/cloudinary/delete` (`app/api/cloudinary/delete/route.ts`) when running in the browser, and only signs directly when called server-side. Both places duplicate the same `public_id`-extraction-from-URL logic — keep them in sync if you touch one.

**UI** — shadcn/ui (`components/ui/`, style "new-york", configured via `components.json`) plus a custom `components/animate-ui/` layer (e.g. the `Sidebar` primitives come from `components/animate-ui/components/radix/sidebar`, not shadcn's default). Toasts go through `sileo` — use the `toast` wrapper in `lib/toast.ts` (`toast.success/error/loading/dismiss`) rather than calling `sileo` directly.

**Path alias** — `@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/utils`, `@/services/services.service`.
