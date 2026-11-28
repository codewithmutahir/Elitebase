# Elitebase

**Multi-tenant time tracking with face-verified kiosk clock-in.**

Employees walk up to a tablet, enter their PIN and verify their face to clock in or out. Managers and admins get a web portal for attendance, reports and policies. Each business (tenant) sees only its own data.

**Live:** [elitebase.elitesolutionusa.com](https://elitebase.elitesolutionusa.com)

<!-- Add screenshots here
![Admin dashboard](docs/screenshots/dashboard.png)
![Kiosk clock-in](docs/screenshots/kiosk.png)
-->

## How it works

```
Tablet (React Native / Expo)
   1. Employee enters PIN
   2. On-device face check (ML Kit)
   3. Photo sent to the API
          |
          v
Next.js API (Vercel)  --->  Supabase (Postgres + Auth)
          |
          v
Face service (FastAPI + InsightFace)
   compares the photo against the enrolled embedding
          |
          v
Clock-in recorded  /  after 3 failed attempts: "Please see your manager"
```

## Features

**Kiosk app (tablet)**
- PIN lookup followed by face verification
- On-device face detection before anything is sent to the server
- Fallback screen after repeated failed attempts, so a manager can step in
- Face enrollment per employee

**Admin portal (web)**
- Employee and kiosk management
- Attendance records and reports
- Configurable attendance policy (for example grace periods)
- Multi-tenant: every business has its own isolated data

**Privacy**
- Built with biometric consent in mind: face data is only captured for enrolled employees

## Tech stack

| Part | Technology |
|---|---|
| Web portal and API | Next.js, TypeScript, React, MUI |
| Database and auth | Supabase (PostgreSQL) |
| Kiosk app | React Native, Expo |
| Face recognition | Python, FastAPI, InsightFace |
| Hosting | Vercel (web), separate host for the face service |

## Repository structure

```
Web/            Next.js admin portal and API routes
mobile/         React Native (Expo) kiosk app
face-service/   FastAPI service for face embeddings and verification
supabase/       Database migrations
scripts/        Utility scripts
```

## Getting started

**Prerequisites:** Node.js, Python 3.10+, a Supabase project, Expo CLI.

```bash
# Web portal
cd Web
npm install
cp .env.example .env.local     # add your Supabase and face-service URLs
npm run dev

# Face service
cd face-service
pip install -r requirements.txt
uvicorn main:app --reload

# Kiosk app
cd mobile
npm install
npx expo start
```

Apply the SQL files in `supabase/` to your Supabase project before running the apps.

## Environment variables

Copy the `.env.example` files in each folder and fill in the values. Never commit real keys. At minimum you need:

- Supabase URL and keys
- The URL of the face service
- The API base URL for the kiosk app

## Author

Built by [Mutahir Hussain](https://github.com/codewithmutahir) at Elitesolution USA.
