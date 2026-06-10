# ARCHITECTURE.md
> Read this file completely before making any changes. This is the source of truth.
> Work on ONE step at a time. Do not implement future steps unless explicitly asked.

---

## Project Overview

A SaaS employee time-tracking platform — similar to Homebase — where companies
register themselves, manage employees, and use a tablet kiosk for face + PIN
based clock-in/out. This is a B2B SaaS product targeting US-based businesses.

**Design:** Homebase-inspired UI. Color theme: Blue (not purple).
**Target device for kiosk:** Android tablet (landscape orientation).
**Distribution:** APK side-load for Phase 1. Play Store in Phase 2.

---

## Monorepo Structure

```
/
├── Web/                      → Next.js web app (admin + company portal)
├── mobile/                   → React Native Expo (kiosk tablet app) — Phase 1 app steps
├── supabase/
│   ├── migrations/           → Supabase Postgres migrations only (app data)
│   └── seed.sql              → Dev seed data
└── ARCHITECTURE.md           → This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | Next.js (App Router) |
| Mobile | React Native + Expo |
| App database | Supabase PostgreSQL (companies, employees, attendance, etc.) |
| Auth database | Turso (LibSQL) — Better Auth users, sessions, passwords |
| Auth library | Better Auth (sessions via HTTP cookie; DB via Turso HTTPS) |
| App data access | `@supabase/supabase-js` over HTTPS only (anon + service role) |
| Email | Resend (transactional emails) |
| Face Storage | Supabase pgvector (vector(512)) |
| Face Detection | ML Kit (on-device, React Native) — framing only |
| Face Matching | InsightFace FastAPI service (`PYTHON_FACE_SERVICE_URL`) |
| File Storage | Supabase Storage |
| Styling (web) | Tailwind CSS |

**Do not** connect the Next.js app to Supabase Postgres on ports `5432` or `6543` for runtime auth or app logic. Use Turso + Supabase REST APIs instead.

---

## Data Architecture (Turso + Supabase)

Elitebase uses **two databases**. They are linked in **application code** by `companies.owner_uid` = Better Auth `user.id` (text). There is **no foreign key** from Supabase to Turso.

### What lives where

| Store | Technology | Contains | How the app connects |
|---|---|---|---|
| **Auth DB** | Turso (LibSQL) | `user`, `session`, `account`, `verification` | Better Auth + `@libsql/kysely-libsql` via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (**HTTPS**, works on restricted networks) |
| **App DB** | Supabase (PostgreSQL) | `companies`, `employees`, `employee_pins`, `kiosk_tablets`, `attendance`, `schedules` | `@supabase/supabase-js` via `NEXT_PUBLIC_SUPABASE_URL` + keys (**HTTPS only**) |

### Request flow (employer signup example)

```
Browser → POST /register/employer (server action)
  1. Better Auth signUpEmail → writes user + account + session in Turso
  2. Supabase service role → INSERT companies (name, owner_uid = Turso user.id)
  3. Redirect → /onboarding
```

### Why two databases?

1. **Better Auth requires its own SQL store** for users, password hashes, and sessions.
2. **Product data stays in Supabase** for pgvector, Storage, RLS (future), and one migration path for business tables.
3. **Dev network constraint:** many local networks block outbound Postgres (`5432`/`6543`) to Supabase. Turso and Supabase **REST/libsql over HTTPS** still work. That is why Turso was chosen for auth instead of pointing Better Auth at Supabase Postgres from a laptop.

### Dev vs production

| | **Local dev** | **Production** (recommended) |
|---|---|---|
| Turso | Dev Turso DB (or shared staging DB) | **Production Turso DB** (separate from dev) |
| Supabase | Dev/staging Supabase project | **Production Supabase project** |
| Env files | `Web/.env.local` | Host secrets (Vercel, Render, etc.) |
| Postgres ports | **Not required** on developer machine | App servers typically **can** reach Supabase pooler, but we **still use HTTPS** for app data for consistency |
| Email verification | **Off** (`requireEmailVerification: false`) unless product asks to enable | Same unless compliance requires verification |

**Production default:** keep **Turso (auth) + Supabase (data)** in all environments so dev and prod behave the same. Optional later: run Better Auth on Supabase Postgres in production only — **not recommended** because it splits dev/prod behavior.

### Linking users to companies

- `companies.owner_uid` is `text`, storing the Better Auth user id from Turso (e.g. `vsgB2Al4OaKH0cl3lUyQDxrVRKXVpy9W`).
- **No** `REFERENCES public."user"` in Supabase (that table was for an abandoned Supabase-hosted Better Auth setup).
- Server actions that need the current user: read session from **Better Auth** (`auth.api.getSession`), then query Supabase with `owner_uid = session.user.id` (service role or RLS once wired).

### RLS note (Phase 1)

RLS policies in migrations still reference `auth.uid()` (Supabase Auth shape). Until the dashboard uses Supabase JWTs from Better Auth, **server routes use the service role** for writes and scoped reads. A later step will align RLS with Better Auth sessions or custom JWT claims.

### Turso tables (created by Better Auth CLI migrate)

Run once per Turso database: `npx @better-auth/cli@latest migrate` (with `lib/auth.ts` configured).

- `user` — id, email, name, `emailVerified`, image, timestamps  
  - **`emailVerified` is required by Better Auth** (SQLite stores it as 0/1). Elitebase does **not** run an email verification flow; `lib/auth.ts` sets it to `true` on every signup via `databaseHooks`.
- `session` — tokens, userId, expiresAt, …
- `account` — providerId, password hash, userId, …
- `verification` — used for **password reset** tokens only (not signup email verify)

**No `/verify-email` route.** No verification emails on signup. Password reset still uses Resend + `verification` table.

### Supabase tables (migrations in `supabase/migrations/`)

- `companies`, `employees`, `employee_pins`, `kiosk_tablets`, `attendance`, `schedules`
- Do **not** create Better Auth tables in Supabase for new work (legacy `public.user` may exist from earlier experiments — ignore for auth).

---

## User Roles

```
1. super_admin   → Internal (us). Manages all companies via /super-admin.
2. company_admin → Company owner/manager. Self-registers on landing page.
3. employee      → Added by company_admin. Uses kiosk tablet only (Phase 1).
```

---

## Onboarding & Registration Flow

### Landing Page → "Get Started"
```
Who are you?

[I'm an Employer]          [I'm an Employee]
      ↓                           ↓
EMPLOYER FLOW              EMPLOYEE FLOW
```

### Employer Flow:
```
Step 1: /register?role=employer
        Form: Company Name, Your Name, Email, Password
        Checkbox (REQUIRED):
        "I acknowledge my company must obtain written biometric
         consent from employees before enrolling them in face
         recognition, per BIPA (IL), CUBI (TX), CCPA (CA)."

Step 2: Better Auth creates user (Turso)
        → companies row created in Supabase with owner_uid = Better Auth user.id
        → Email verification OFF in Phase 1 (Resend available if enabled later)

Step 3: /onboarding (protected; session required)
        → Company timezone (dropdown)
        → Company logo upload (optional, skippable)
        → "Let's go!" → /dashboard
```

### Employee Flow (web):
```
/register?role=employee
→ Show info screen:
  "Your employer manages your account.
   Your manager will add you and give you a PIN.
   You'll use that PIN on your workplace tablet to clock in.

   Already have an account? [Sign In]"

Note: Employees do NOT self-register in Phase 1.
      Admin adds them. Employee uses tablet kiosk only.
```

---

## Database Schema (Supabase PostgreSQL)

### companies
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
logo_url        text
owner_uid       text NOT NULL   -- Better Auth user.id from Turso (no Supabase FK)
timezone        text DEFAULT 'America/New_York'
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### employees
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
company_id          uuid REFERENCES companies(id) ON DELETE CASCADE
full_name           text NOT NULL
email               text
role                text DEFAULT 'employee'
department          text
position            text
hire_date           date
face_descriptor     vector(512)
face_registered_at  timestamptz
face_consent        boolean DEFAULT false
face_consent_at     timestamptz
is_active           boolean DEFAULT true
created_at          timestamptz DEFAULT now()
```

### employee_pins
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
employee_id     uuid REFERENCES employees(id) ON DELETE CASCADE
company_id      uuid REFERENCES companies(id) ON DELETE CASCADE
pin             text NOT NULL        -- 4-6 digit, hashed bcrypt
created_at      timestamptz DEFAULT now()
UNIQUE(employee_id, company_id)      -- one PIN per employee per company
```

### kiosk_tablets
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
company_id      uuid REFERENCES companies(id) ON DELETE CASCADE
location_name   text DEFAULT 'Main Location'
setup_code      text UNIQUE          -- e.g. "ALPHA-7823"
tablet_token    text UNIQUE          -- stored in tablet SecureStore
is_active       boolean DEFAULT true
last_seen_at    timestamptz
created_at      timestamptz DEFAULT now()
```

### attendance
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
employee_id         uuid REFERENCES employees(id)
company_id          uuid REFERENCES companies(id)
tablet_id           uuid REFERENCES kiosk_tablets(id)
type                text CHECK (type IN ('clock_in','clock_out','break_start','break_end'))
timestamp           timestamptz DEFAULT now()
face_match_score    float
created_at          timestamptz DEFAULT now()
```

### schedules
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
company_id      uuid REFERENCES companies(id)
employee_id     uuid REFERENCES employees(id)
shift_date      date NOT NULL
start_time      time NOT NULL
end_time        time NOT NULL
created_at      timestamptz DEFAULT now()
```

---

## Row Level Security (RLS)

Every app table has RLS enabled. Company data must be fully isolated.
Kiosk API routes use service role key (server-side Next.js only).
Tablet never has direct Supabase access — always via Next.js API.

**Auth is not Supabase Auth.** RLS policies that use `auth.uid()` are placeholders until Better Auth is integrated with Supabase JWTs or policies are rewritten to use `owner_uid` from server-side checks.

---

## Face Recognition Flow

### Enrollment (first time on tablet):
```
Employee enters PIN
→ face_descriptor is null → registration triggered
→ Consent screen shown (LEGAL — must accept before camera opens)
→ Employee accepts → face_consent + face_consent_at saved
→ ML Kit detects face on device (crop/quality only)
→ POST /api/kiosk/register-face multipart { employee_id, file, consent }
→ Next.js forwards image to PYTHON_FACE_SERVICE_URL/extract-embedding
→ Stored as vector(512) in employees.face_descriptor
```

### Daily Verification:
```
Employee enters PIN
→ face_descriptor exists → scan triggered
→ Camera opens, ML Kit detects face
→ POST /api/kiosk/verify-face multipart { employee_id, file }
→ Next.js loads stored embedding, forwards to PYTHON_FACE_SERVICE_URL/verify-face
→ verified: true (cosine > 0.35) → MATCH → proceed
→ Show Clock In / Clock Out / Break
```

---

## Web App Routes (Next.js)

```
/                           → Landing page (marketing + get started)
/register                   → Role selector → employer or employee info
/register/employer          → Company registration form
/register/employee          → Employee info screen (no self-register)
/login                      → Company admin login
/onboarding                 → Post-registration setup (timezone, logo); no /verify-email
/dashboard                  → Admin home (attendance overview, who's in)
/employees                  → Employee list + add
/employees/[id]             → Employee detail + PIN display
/schedule                   → Weekly schedule (Phase 2 - stub only)
/timesheets                 → Attendance records table + export
/kiosk-setup                → Generate setup code for tablet
/settings                   → Company settings
/privacy-policy             → Publicly accessible (legal requirement)
/super-admin/companies      → All companies (internal use)
/super-admin/stats          → Usage metrics

/api/kiosk/register-tablet  → POST: validate setup_code → return tablet_token
/api/kiosk/get-employee     → POST: PIN + tablet_token → employee data
/api/kiosk/register-face    → POST: save descriptor + consent
/api/kiosk/verify-face      → POST: cosine similarity match
/api/kiosk/clock-action     → POST: insert attendance record
/api/kiosk/employee-status  → POST: is employee currently clocked in?
```

---

## Kiosk App Screens (React Native)

```
SetupScreen       → Enter setup code once → tablet registered
IdleScreen        → Always on. Company logo. "Enter your PIN". No back button.
PinScreen         → Large numpad. 4-6 digit PIN.
FaceRegisterScreen→ First time only. Consent text → Accept → Camera → Save.
FaceScanScreen    → Camera + face box. Auto-capture when centered.
ActionScreen      → Employee name + 3 big buttons: CLOCK IN | CLOCK OUT | BREAK
SuccessScreen     → "Clocked In! 9:02 AM" → auto-reset to IdleScreen after 3s
```

### Kiosk App Rules:
- No nav bar, no back gesture, status bar hidden, always landscape
- tablet_token in expo-secure-store
- No tablet_token → SetupScreen. Has token → IdleScreen.

---

## Design System

**Primary:** #2563EB (blue-600)
**Primary Dark:** #1D4ED8 (blue-700)
**Primary Light:** #DBEAFE (blue-100)
**Background:** #F8FAFC
**Surface:** #FFFFFF
**Text Primary:** #0F172A
**Text Secondary:** #64748B
**Border:** #E2E8F0
**Success:** #10B981
**Error:** #EF4444

Kiosk UI: min touch target 64px, min font 18px, high contrast, landscape always.

---

## Environment Variables

### Web (`Web/.env.local`):
```
# Turso — Better Auth only (HTTPS / libsql)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=

# Better Auth
BETTER_AUTH_SECRET=          # random 32+ char secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Supabase — app data only (HTTPS; do not use postgres ports in app code)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# InsightFace FastAPI (Railway or local)
PYTHON_FACE_SERVICE_URL=https://your-service.railway.app

# Optional — Prisma CLI / manual SQL only (not used by Better Auth at runtime)
DATABASE_URL=
DIRECT_URL=
```

### Mobile (.env):
```
EXPO_PUBLIC_API_URL=        ← Next.js web app URL
```

---

## Hard Rules

- Auth data in **Turso** only; app/business data in **Supabase** only — link via `companies.owner_uid` in code, not cross-DB foreign keys
- Never connect the Next.js app to Supabase Postgres ports `5432`/`6543` for runtime (use HTTPS clients + Turso libsql URL)
- Tablet never gets direct Supabase access
- Service role key never in mobile app
- Never skip biometric consent screen
- Never store raw face images — only vector(512) descriptor
- Never allow cross-company data access
- Never hardcode company_id — always from auth session or tablet_token

---

## Phase 1 Scope (10 days — WEB FIRST, then app)

```
✅ Supabase schema + RLS
✅ Landing page with employer/employee split
✅ Company self-registration (Better Auth + Supabase; email verify optional)
✅ Onboarding flow (timezone, logo)
✅ Admin dashboard
✅ Employee management (add, view, PIN display)
✅ Kiosk setup code generation
✅ All /api/kiosk/* endpoints
✅ Timesheets view
✅ Super admin (companies list)
✅ Privacy policy page
✅ Kiosk tablet app (all screens)
✅ Biometric consent screens

❌ Employee personal phone app (Phase 2)
❌ Play Store (Phase 2)
❌ Payroll / earnings (Phase 2)
❌ Messaging (Phase 2)
❌ Time-off requests (Phase 2)
```

---

## CURSOR STEP-BY-STEP EXECUTION GUIDE

> One step at a time. Complete and test each step before moving to next.
> Always start prompt with: "Read ARCHITECTURE.md, then complete only STEP X:"

---

### WEB STEPS

**STEP 1 — Supabase Schema**
```
Read ARCHITECTURE.md, then complete only STEP 1:
Create all Supabase migrations in supabase/migrations/.
Include: enable pgvector extension, then create all tables
(companies, employees, employee_pins, kiosk_tablets,
attendance, schedules) with all columns exactly as defined.
Add RLS enable on all tables. Add basic RLS policies for
company isolation. Do not create any Next.js code yet.
```

**STEP 2 — Auth Setup (Better Auth + Turso + Resend + Supabase HTTPS)**
```
Read ARCHITECTURE.md, then complete only STEP 2:
In Web/, install better-auth, @libsql/client, @libsql/kysely-libsql, resend,
@supabase/supabase-js. Create:
- lib/auth.ts — Better Auth with LibsqlDialect (TURSO_* env), email/password,
  requireEmailVerification false for Phase 1, Resend for reset/optional verify
- lib/auth-client.ts — createAuthClient (NEXT_PUBLIC_APP_URL)
- lib/email.ts — Resend helpers (password reset, welcome; no verification email)
- lib/supabase/client.ts — anon key, HTTPS only
- lib/supabase/server.ts — service role, HTTPS only
- app/api/auth/[...all]/route.ts — Better Auth handler
- middleware.ts — Better Auth session cookie; protect dashboard routes
Do NOT connect to Supabase Postgres ports 5432/6543 from the app.
Do not create any pages yet.
See "Data Architecture (Turso + Supabase)" in this file.
```

**STEP 3 — Landing Page**
```
Read ARCHITECTURE.md, then complete only STEP 3:
Create the landing page (app/page.tsx).
Hero section with app name, tagline, and a big
"Get Started" button that goes to /register.
Simple marketing layout. Use the blue design system
from ARCHITECTURE.md. Keep it clean, not too long.
```

**STEP 4 — Registration Flow**
```
Read ARCHITECTURE.md, then complete only STEP 4:
Create /register page with employer/employee role selector
(two cards, pick one). Then:
- /register/employer → full company registration form
  with the biometric consent checkbox (required).
  On submit: Better Auth signUp (Turso) + Supabase companies row (owner_uid).
- /register/employee → info screen only (no form),
  explain they need to get PIN from their manager.
After employer registration → redirect to /onboarding (session required).
Do not require email verification in Phase 1 unless product changes.
```

**STEP 5 — Onboarding**
```
Read ARCHITECTURE.md, then complete only STEP 5:
Create /onboarding page (protected, after registration / login).
Two fields: timezone selector + logo upload (to Supabase Storage).
Both skippable. "Let's go" → /dashboard.
Update companies row with these values.
```

**STEP 6 — Login + Auth**
```
Read ARCHITECTURE.md, then complete only STEP 6:
Create /login page with email/password form.
On success → /dashboard. Handle wrong credentials error.
Add forgot password flow → Better Auth + Resend reset email.
```

**STEP 7 — Dashboard**
```
Read ARCHITECTURE.md, then complete only STEP 7:
Create /dashboard (protected). Show:
- Total employees count
- Who is currently clocked in (live list from attendance table)
- Today's clock-ins count
- Recent attendance feed (last 10 records)
Use the blue design system. Sidebar nav with links to
Employees, Timesheets, Kiosk Setup, Settings.
```

**STEP 8 — Employee Management**
```
Read ARCHITECTURE.md, then complete only STEP 8:
Create /employees page:
- Table of all employees (name, department, position, status, PIN)
- "Add Employee" button → modal or drawer form
  (full_name, email optional, role, department, position, hire_date)
- On add: auto-generate random 4-digit PIN,
  save hashed to employee_pins, show plain PIN once in UI
- Employee row → click → /employees/[id] detail page
  showing all info + PIN + face registration status
- Edit and deactivate employee actions
```

**STEP 9 — Kiosk Setup**
```
Read ARCHITECTURE.md, then complete only STEP 9:
Create /kiosk-setup page:
- "Generate Setup Code" button
- Creates kiosk_tablets row with random setup_code (e.g. ALPHA-7823)
- Shows the code large on screen with instructions:
  "Open the kiosk app on your tablet and enter this code"
- List of registered tablets (location name, last seen, active/inactive)
- Option to deactivate a tablet
```

**STEP 10 — Kiosk API Routes**
```
Read ARCHITECTURE.md, then complete only STEP 10:
Create all API routes under /api/kiosk/:
- register-tablet: validate setup_code → generate tablet_token → return it
- get-employee: tablet_token + PIN → return employee (name, face status)
- register-face: save vector descriptor + consent fields
- verify-face: pgvector cosine similarity, return match score + verified bool
- clock-action: insert attendance record
- employee-status: return if employee is currently clocked in
All routes validate tablet_token from header. Use service role key.
```

**STEP 11 — Timesheets**
```
Read ARCHITECTURE.md, then complete only STEP 11:
Create /timesheets page:
- Date range filter (default: this week)
- Table: employee name, date, clock in, clock out, total hours, status
- Export to CSV button
- Pagination
```

**STEP 12 — Settings + Super Admin**
```
Read ARCHITECTURE.md, then complete only STEP 12:
Create /settings page: update company name, logo, timezone.
Create /super-admin/companies: list all companies (name, owner email,
employee count, created date, active status, suspend button).
Super admin access: hardcode your email as super_admin check.
```

**STEP 13 — Privacy Policy**
```
Read ARCHITECTURE.md, then complete only STEP 13:
Create /privacy-policy as a public static page.
Include: biometric data collection, purpose, retention (1 year),
no sale to third parties, deletion rights, contact info.
Required by BIPA/CCPA. Keep it real and professional.
```

---

### APP STEPS (After all web steps done and tested)

**STEP 14 — App Cleanup**
```
Read ARCHITECTURE.md, then complete only STEP 14:
In employee portal app/, remove all existing screens and navigation.
Keep only: app.json, package.json, assets folder, and base
App.tsx (just blank screen for now). Remove all old routes,
components, contexts. We are rebuilding from scratch.
```

**STEP 15 — App Foundation**
```
Read ARCHITECTURE.md, then complete only STEP 15:
Set up base navigation structure for kiosk app.
Install expo-secure-store. Create AppNavigator that checks:
- If no tablet_token in SecureStore → show SetupScreen
- If tablet_token exists → show IdleScreen
No other screens yet. Just this routing logic.
```

**STEP 16 — Setup Screen**
```
Read ARCHITECTURE.md, then complete only STEP 16:
Build SetupScreen. Landscape layout. Company branding area.
Input for setup code (e.g. ALPHA-7823). Submit button.
POST to EXPO_PUBLIC_API_URL/api/kiosk/register-tablet.
On success: save tablet_token to SecureStore → navigate to IdleScreen.
Show error if code invalid.
```

**STEP 17 — Idle Screen**
```
Read ARCHITECTURE.md, then complete only STEP 17:
Build IdleScreen. Full screen landscape. No back button.
Show app logo/company name. Large "Enter your PIN" text.
Big numpad with 4-6 digit entry. On PIN submit →
POST /api/kiosk/get-employee. If found → navigate to
FaceRegisterScreen (if no face) or FaceScanScreen (if face exists).
If not found → show "PIN not found" error, reset.
```

**STEP 18 — Face Register Screen**
```
Read ARCHITECTURE.md, then complete only STEP 18:
Build FaceRegisterScreen. Show employee name.
First: consent screen with full biometric consent text from
ARCHITECTURE.md. [I Agree] and [Decline] buttons.
If decline → go back to IdleScreen.
If agree → open camera, capture face, generate descriptor,
POST /api/kiosk/register-face. On success → FaceScanScreen.
```

**STEP 19 — Face Scan + Action + Success Screens**
```
Read ARCHITECTURE.md, then complete only STEP 19:
Build FaceScanScreen: camera + face box overlay, auto-capture.
POST /api/kiosk/verify-face. On match → ActionScreen.
Build ActionScreen: employee name, verified checkmark,
three large buttons CLOCK IN / CLOCK OUT / BREAK.
POST /api/kiosk/clock-action on tap.
Build SuccessScreen: confirmation message + time.
Auto-reset to IdleScreen after 3 seconds.
```

**STEP 20 — APK Build**
```
Read ARCHITECTURE.md, then complete only STEP 20:
Configure app.json for Android tablet:
- orientation: landscape
- minSdkVersion: 24
- package name
Build APK with: eas build --platform android --profile preview
If EAS not set up, configure eas.json with preview profile first.
```