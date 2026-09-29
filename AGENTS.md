# Elitebase — Agent Instructions

## Product

Elitebase is a SaaS platform for employee time tracking and attendance: kiosk clock-in, optional face verification, schedules, timesheets, and a real-time employer dashboard.

Marketing site lives under `Web/` (Next.js App Router). Primary landing page: `Web/app/(public)/page.tsx` with components in `Web/components/landing/`.

---

## Landing redesign — active brief

### Goal

Replace the current generic light SaaS landing (blue pills, Inter, flat feature cards) with a premium dark-hero composition. Work **section by section**, starting with the **hero + nav**.

### Design reference (structure & craft — not brand)

- **Live URL:** [https://www.orchid.security/](https://www.orchid.security/)
- **What to follow:** layout rhythm, hero hierarchy, dark atmospheric background, centered copy → dual CTAs → large product UI mockup, rounded chrome, subtle glow, dense-but-clean dashboard density, glass-lite borders on elevated surfaces.
- **What NOT to copy:** Orchid purple brand, Aeonik licensing, identity-security copy, their exact dashboard content, logos, or wordmarks.

### Design read

Reading this as: **B2B SaaS marketing landing for employers**, with a **premium dark-product language** (Orchid-class craft), leaning toward **Tailwind + next/font + Motion**, Elitebase-owned color and content.

### Dials

| Dial | Value | Notes |
|------|-------|--------|
| `DESIGN_VARIANCE` | 6 | Disciplined, symmetric hero like Orchid — not artsy chaos |
| `MOTION_INTENSITY` | 5 | Soft entrance + glow presence; no noisy per-card fades |
| `VISUAL_DENSITY` | 5 | Airy marketing chrome; denser inside the product mockup |

---

## Design system (locked for this redesign)

### Color — Elitebase unique (do not use Orchid purple)

Orchid’s electric purple is the reference *role* (accent + CTA glow), not the hue. Elitebase uses **ink + signal teal**:

| Token | Hex / value | Role |
|-------|-------------|------|
| `--eb-ink` | `#060A12` | Page / hero base |
| `--eb-surface` | `#0E1524` | Elevated panels, mockup chrome |
| `--eb-elevated` | `#151D2E` | Cards inside mockup |
| `--eb-border` | `rgba(255,255,255,0.08)` | Hairline glass borders |
| `--eb-text` | `#ECEEF2` | Primary text on dark |
| `--eb-muted` | `#8B93A7` | Supporting copy |
| `--eb-accent` | `#2EC4B6` | Primary CTA, links, highlights |
| `--eb-accent-dark` | `#1FA89C` | CTA hover / pressed |
| `--eb-accent-glow` | `rgba(46, 196, 182, 0.35)` | Soft radial / button glow |
| `--eb-cta-secondary` | `#F4F5F7` | Secondary solid button (Orchid-style white CTA) |
| `--eb-cta-secondary-fg` | `#0B1220` | Text on secondary CTA |

Functional status colors inside mockups (Present / Late / Away) may stay green / amber / red — they are data, not brand.

**Forbidden for this landing:** Orchid purple/violet gradients, default Inter+blue-on-white SaaS kit, cream+terracotta, purple-on-white AI themes.

### Typography

Orchid uses commercial **Aeonik** (+ Inconsolata for data). We do **not** ship Aeonik.

| Role | Choice | How |
|------|--------|-----|
| UI / marketing sans | **Aeonik** (`Web/public/fonts/aeonik/`) with Satoshi fallback | `@font-face` in `globals.css` |
| Mockup / data mono | **JetBrains Mono** or **Inconsolata** | Small labels, table cells, kiosk PIN digits only |

Rules:

- Load via `next/font` only (no runtime Google Fonts `<link>` for production UI).
- Strong hierarchy: large calm headline (regular–semibold, tight leading), quieter body, no ALL-CAPS eyebrow clutter unless content truly needs a badge.
- Do **not** keep Inter as the landing/marketing face.

### Layout pattern (hero)

Match Orchid’s first-viewport composition:

1. Top nav: logo left · links center · Sign in (ghost/outline) + primary solid CTA right  
2. Centered headline (one job)  
3. One short supporting paragraph  
4. Dual CTAs (accent primary + light secondary)  
5. Full-width **product dashboard mockup** as the dominant visual plane under the CTAs  

Hero budget: brand, one headline, one sentence, CTA group, one mockup. No stat strips, trusted-by logos, or feature grids in the first viewport.

**Responsive (lg breakpoint, 1024px+):** Desktop/laptop keeps peek mockup + two-phase scroll zoom. Below `lg`: no dashboard mockup, single-viewport hero (centered copy + stacked full-width CTAs), no scroll-scrub hero track; mobile nav uses hamburger + full-screen link sheet (Orchid-style).

**Continuous dark canvas:** One fixed `LandingAtmosphere` (ink gradient, drifting blobs, cursor glow) behind all landing sections—no per-section white bands or duplicate hero-only backgrounds. Marketing sections use `--eb-*` tokens on transparent/`--eb-surface` panels.

### Components & surfaces

- Rounded corners consistently (~10–16px on panels; pill or near-pill on CTAs).
- Mockup: dark elevated frame, thin light border, soft shadow + optional accent glow behind — not a floating light “browser chrome” card on white.
- Prefer glass-lite borders over heavy multi-layer shadows.
- Cards on marketing sections only when they wrap a real interaction or a clear content unit; default is no card-for-card’s-sake.

### Motion

- **Root cause (normal browser “stuck”):** `prefers-reduced-motion: reduce` (Windows → Accessibility → Visual effects → Animation effects **Off**) made us collapse the hero track to `100dvh` and disable scrub. Result: no zoom, cramped first screen, white “Trusted by” cutting the mockup. Playwright defaults to `no-preference`, so it looked fine there.
- **Fix:** Hero scroll zoom **always runs** (essential product story). Soften intensity later if needed — do not collapse the track.
- Implementation: tall track (`~275vh`, synced to `innerHeight` in px) + **CSS `position: sticky`** stage + **GSAP ScrollTrigger scrub** (two phases, reversible). **No GSAP `pin`** (breaks with fixed nav).
- **Phase 1 (~38% of hero scroll):** mockup rises from peek; headline/CTAs fade; **scale stays 1**.
- **Phase 2 (~62%):** mockup **zooms** toward max scale and holds; scroll up reverses zoom then rise.
- First viewport matches Orchid: copy airy in the upper half; dashboard only **peeks** from ~72–74% viewport height (absolute), not `flex-1` filled.
- Copy sits **behind** mockup (`z-index`) so the panel covers text as it rises.
- **Nav clearance:** rise + zoom clamped so mockup never tucks under fixed navbar (`data-landing-navbar`); stage height uses `visualViewport` when available (real browser vs headless).
- `html.landing-scroll-lock` → `scroll-behavior: auto` while hero mounts.
- File: `Web/components/landing/landing-hero.tsx`.
- **Reload / restored scroll:** Hero entrance runs only when `scrollY < 48`. After load, `ScrollTrigger.refresh()` + `update()` run on a short delay chain so scrub matches browser scroll restoration (avoids mockup stuck at peek while viewport is mid-page).

---

## User-facing errors (Web)

- **Never surface** Next.js / Turbopack / stack traces / digest strings to employers in the UI.
- **Boundaries:** `Web/app/error.tsx`, `Web/app/global-error.tsx`, `Web/app/(dashboard)/error.tsx` + shared `Web/components/errors/error-fallback.tsx`. Map thrown errors through `Web/lib/errors/user-facing.ts` (`getUserFacingError`).
- **Server Actions:** Return `{ error: "…" }` for expected failures; wrap client `startTransition` calls in `try/catch` and use `getUserFacingError`. Log details with `console.error` only.
- **CSV import size:** `Web/lib/employees/csv-import-limits.ts` (5 MB) must match `serverActions.bodySizeLimit` in `Web/next.config.ts`. Validate file size **on the client** before calling preview/import actions so users see inline copy instead of a framework error overlay.
- **Dashboard dark/light:** Product UI lives under `.dashboard-shell--dark` / `--light` (`Web/app/globals.css`). Use `--eb-*` tokens and helpers in `Web/lib/dashboard/styles.ts` — no hardcoded `bg-white`, `text-slate-900`, or `border-slate-*` on dashboard pages. Native `<select>`: prefer `dashboardNativeSelectClass`; bare selects inside `.dashboard-shell` inherit shell styling from `globals.css`.
- **Portaled UI (dropdowns, tooltips):** Renders outside `.dashboard-shell` — use `dashboardDropdownContentClass` / `dashboardDropdownItemClass` and `.dashboard-dropdown` rules keyed off `html[data-dashboard-theme]` (set in `DashboardThemeProvider`). Do not rely on shell CSS variables alone on portaled nodes. Apply to **every** dashboard menu (header account, roster row actions, etc.).
- **Portaled sheets:** `dashboardSheetContentClass` + `dashboardSheetOverlayClass` on `SheetContent` (see `add-employee-drawer.tsx`). Form fields use `dashboardNativeSelectClass` / `dashboardFieldInputClass`.

---

## Auth abuse protection (Web)

- **Proxy (`Web/proxy.ts`):** session cookie gate on dashboard routes; kiosk + `POST /api/auth/*` rate limits.
- **Server actions:** login, employer register, forgot/reset password, onboarding — Upstash sliding windows (`Web/lib/auth/rate-limit.ts`), 5 attempts / 15 min per IP (onboarding 10 / 15 min).
- **Client:** 5 submit attempts per form then 15 min lockout (`Web/lib/auth/form-attempts.ts`); not a security boundary — pairs with server limits.
- **Production fail-closed (auth only):** if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing or Upstash errors, auth limits **block** in `NODE_ENV=production` (redirect `?error=rate_limit_unavailable` or HTTP 429/503 on `/api/auth`). **Development** stays fail-open so local work without Redis still runs. Kiosk limits remain fail-open so clock-in is not blocked by Redis outages.
- **Required in production:** configure the same Upstash env vars as kiosk rate limiting.

---

## HTTP API (versioning & boundaries)

- **Canonical public REST prefix:** `/api/v1/…` — kiosk + timesheets handlers live in `Web/lib/api/v1/`; Next routes under `Web/app/api/v1/`.
- **Legacy aliases:** unversioned `/api/kiosk/*` and `/api/timesheets/*` re-export the same v1 handlers via `Web/lib/api/define-route.ts` and send `Deprecation` + `Link: successor-version` headers. Do not remove legacy paths until all shipped clients use v1.
- **Path constants:** `Web/lib/api/paths.ts` (`API_V1`) for web; `mobile/src/lib/apiPaths.ts` (`MOBILE_API`) — keep in sync when adding endpoints.
- **Auth:** Better Auth stays at `/api/auth` (session cookies + `authClient`); not URL-versioned yet.
- **Internal ops:** Vercel Cron and similar stay under `/api/cron/*` (not part of the public v1 contract).
- **Rate limits / proxy:** `Web/proxy.ts` and `Web/lib/kiosk/rate-limit.ts` match both `/api/kiosk/…` and `/api/v1/kiosk/…` via `parseKioskRouteSegment`.

When adding a new HTTP endpoint: implement handler in `lib/api/v1/…`, wire `app/api/v1/…/route.ts`, add optional legacy alias, update `API_V1` + mobile paths, extend proxy matcher if needed.

---

## Implementation map

| Area | Path |
|------|------|
| Versioned API handlers | `Web/lib/api/v1/`, `Web/lib/api/paths.ts` |
| Landing page | `Web/app/(public)/page.tsx` |
| Navbar | `Web/components/landing/landing-navbar.tsx` |
| Footer | `Web/components/landing/landing-footer.tsx` |
| Dashboard mockup | `Web/components/landing/dashboard-mockup.tsx` |
| Brands marquee | `Web/components/landing/landing-brands.tsx` |
| Page atmosphere + cursor glow | `Web/components/landing/landing-atmosphere.tsx` (fixed full viewport; not hero-only) |
| Global tokens / fonts | `Web/app/globals.css`, `Web/app/layout.tsx` |
| Dashboard shell (ink/teal product UI) | `Web/components/layout/dashboard-shell.tsx`, `.dashboard-shell--dark` / `--light` in `globals.css`, toggle in header (`dashboard-theme-toggle.tsx`, `localStorage` key `elitebase-dashboard-theme`) |
| Main dashboard | `Web/app/(dashboard)/dashboard/page.tsx` |

Scope landing tokens carefully: do not break the authenticated dashboard (light product UI) unless deliberately theming shared primitives. Prefer landing-scoped wrappers / CSS variables over rewriting all shadcn product tokens at once.

---

## Build order

1. **AGENTS.md** (this file) — done when present  
2. **Hero + nav** — dark shell, fonts, dual CTAs, mockup restyle  
3. Remaining sections (trusted-by, features, stats, final CTA, footer) — same system, one section at a time  
4. Responsive pass + reduced-motion check  

When the user says to start, begin at step 2 only — do not redesign the whole page in one dump unless asked.

---

## Copy & brand voice

- Speaks to **employers / managers**, not security buyers.
- Concrete floor ops language: clock-in, shifts, kiosk, timesheets, locations.
- CTAs stay product-true: e.g. “Get started free”, “See how it works” / “Sign in” — not “Book a demo” unless product actually uses demos.

---

## Anti-slop checklist (before shipping a section)

- [ ] First viewport still reads as one composition after removing nav (brand + product visible)  
- [ ] No Orchid purple; teal tokens used consistently  
- [ ] No Inter as marketing face  
- [ ] Mockup shows Elitebase attendance UI, not a generic analytics collage  
- [ ] Mobile: stacked CTAs, mockup scales without horizontal page scroll  
- [ ] Does not look like default “AI SaaS template” light blue landing  

---

## Skills to apply

When editing the landing UI, prefer project skills:

- `.agents/skills/design-taste-frontend/SKILL.md`
- `.agents/skills/frontend-design/SKILL.md`
- `.agents/skills/ui-ux-pro-max/SKILL.md` (for token / UX checks)

User frontend rules in Cursor also apply: brand-first hero, no clutter in first viewport, expressive type, atmospheric background (gradient/glow — not flat white).
