# Elitebase — Production Deployment Checklist
> Senior Developer Grade. Complete every item before go-live.
> Stack: Next.js (Vercel) · Python FastAPI (Oracle Cloud) · Supabase · Expo APK

---

## PHASE 1 — SECURITY (Do this first, non-negotiable)

### 1.1 Environment Variables
- [ ] No `.env` files committed to git — verify with `git log --all --full-history -- "**/.env*"`
- [ ] Add `.env*` to `.gitignore` in ALL folders (web, mobile, face-service)
- [ ] Rotate ALL keys that were ever in git history (Supabase, Turso, Better Auth secret)
- [ ] Supabase service role key — only in server-side code, NEVER in mobile app
- [ ] `PYTHON_FACE_SERVICE_URL` — change from `http://127.0.0.1:8000` to production URL
- [ ] `BETTER_AUTH_SECRET` — minimum 32 chars, truly random (`openssl rand -base64 32`)

### 1.2 API Security — Next.js
- [ ] Install: `npm install @upstash/ratelimit @upstash/redis` (or use middleware)
- [ ] Rate limit ALL `/api/kiosk/*` routes:
  - `/api/kiosk/get-employee` → max 10 req/min per tablet_token
  - `/api/kiosk/verify-face` → max 5 req/min per tablet_token
  - `/api/kiosk/register-face` → max 3 req/min per tablet_token
  - `/api/kiosk/clock-action` → max 20 req/min per tablet_token
- [ ] Validate `x-tablet-token` on EVERY kiosk route (not just some)
- [ ] Add request size limit to `/api/kiosk/register-face` (max 10MB):
  ```ts
  export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }
  ```
- [ ] Add security headers in `next.config.ts`:
  ```ts
  headers: [{ 
    key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
  ]
  ```
- [ ] Remove ALL `console.log` with sensitive data (employee PINs, tokens)
- [ ] PIN stored hashed in DB? If plain text → hash with bcrypt NOW

### 1.3 Supabase Security
- [ ] RLS enabled on ALL tables — verify in Supabase dashboard
- [ ] Test RLS: log in as different company → should see ZERO other company data
- [ ] `face_descriptor` column — ensure only service role can read/write
- [ ] Add index on `employee_pins(pin, company_id)` — stops slow PIN lookup
- [ ] Add index on `kiosk_tablets(tablet_token)` — every request hits this
- [ ] Add index on `attendance(employee_id, timestamp)` — reports will need this
- [ ] Enable Supabase Point-in-time Recovery (PITR) — paid plan, worth it
- [ ] Set up Supabase automated backups

### 1.4 Python Face Service Security
- [ ] Add API key authentication to face-service (Next.js sends secret header):
  ```python
  INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY")
  
  @app.middleware("http")
  async def verify_api_key(request: Request, call_next):
      if request.url.path == "/health":
          return await call_next(request)
      key = request.headers.get("X-Internal-Key")
      if key != INTERNAL_API_KEY:
          return JSONResponse({"error": "Unauthorized"}, status_code=401)
      return await call_next(request)
  ```
- [ ] Face service NOT publicly accessible — firewall allows only Vercel IPs (or use private network)
- [ ] Rate limit face service: max 100 req/min globally
- [ ] File upload validation: check file is actually an image (not just extension)
  ```python
  from PIL import Image
  import io
  try:
      img = Image.open(io.BytesIO(contents))
      img.verify()
  except Exception:
      raise HTTPException(400, "Invalid image file")
  ```
- [ ] Max file size check in Python: reject if > 15MB
- [ ] Do NOT log face images or embeddings to disk/console

### 1.5 Biometric Data (US Law — BIPA/CCPA)
- [ ] Privacy Policy page live at `/privacy-policy` with biometric section
- [ ] Consent stored in DB with timestamp (`face_consent`, `face_consent_at`)
- [ ] Data deletion endpoint working (`DELETE /api/employee/[id]/face-data`)
- [ ] Face descriptors encrypted at rest (Supabase encryption ON)
- [ ] Documented data retention policy (1 year max after termination)

---

## PHASE 2 — PERFORMANCE

### 2.1 Next.js / Vercel
- [ ] Run `npm run build` — fix ALL errors AND warnings
- [ ] Check bundle size: `npx @next/bundle-analyzer` — no chunk > 500KB
- [ ] Enable Next.js Image optimization for all company logos
- [ ] Add `export const revalidate = 60` to dashboard pages (not kiosk APIs)
- [ ] Kiosk API routes — set `export const runtime = 'nodejs'` (not edge)
- [ ] Remove unused packages: `npx depcheck`
- [ ] Enable compression in next.config.ts: `compress: true`

### 2.2 Database Performance
- [ ] Run `EXPLAIN ANALYZE` on top 5 queries in Supabase SQL editor
- [ ] `attendance` table — add partition by month if > 100k rows expected
- [ ] `kiosk_face_similarity` RPC — test with 100+ employees, time it
- [ ] Connection pooling: use Supabase `pgbouncer` URL for server-side
- [ ] pgvector index on `face_descriptor`:
  ```sql
  CREATE INDEX ON employees 
  USING ivfflat (face_descriptor vector_cosine_ops)
  WITH (lists = 100);
  ```

### 2.3 Python Face Service Performance
- [ ] Model loaded ONCE on startup — verify (not per request)
- [ ] buffalo_l model warm-up request on startup:
  ```python
  @app.on_event("startup")
  async def startup():
      global model
      model = insightface.app.FaceAnalysis(name='buffalo_l', ...)
      model.prepare(ctx_id=0, det_size=(640, 640))
      # Warm up with blank image
      blank = np.zeros((640, 640, 3), dtype=np.uint8)
      model.get(blank)
      print("[startup] Model warmed up and ready")
  ```
- [ ] Add `/health` endpoint that also checks model is loaded
- [ ] Response time target: `/verify-face` < 1.5s (test with real faces)
- [ ] Use `gunicorn` with `uvicorn` workers in production (not just uvicorn):
  ```bash
  gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --timeout 60
  ```

---

## PHASE 3 — ORACLE CLOUD DEPLOYMENT (Python Face Service)

### 3.1 Oracle Cloud Setup (Free Tier — Always Free VM)
- [ ] Create Oracle Cloud account (free forever tier)
- [ ] Create VM: **VM.Standard.A1.Flex** (ARM, 4 OCPU + 24GB RAM — FREE)
  - Shape: VM.Standard.A1.Flex
  - OCPUs: 4, RAM: 24GB (all free)
  - OS: Ubuntu 22.04
  - This is enough for buffalo_l model
- [ ] Open ports in Oracle Security List:
  - Port 22 (SSH) — your IP only
  - Port 8000 (face service) — Vercel IPs only (or use Cloudflare Tunnel)
  - Port 443 (HTTPS if using nginx)
- [ ] SSH key setup — download private key securely

### 3.2 Server Setup
```bash
# On Oracle VM
sudo apt update && sudo apt upgrade -y

# Python 3.10
sudo apt install python3.10 python3.10-pip python3-venv -y

# OpenCV dependencies
sudo apt install libgl1-mesa-glx libglib2.0-0 -y

# Create app user (don't run as root)
sudo useradd -m -s /bin/bash faceservice
sudo su - faceservice

# Clone/upload face-service code
mkdir ~/app && cd ~/app
# Upload your face-service/ folder here

# Virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# This downloads buffalo_l model (~300MB) first run
```

### 3.3 Nginx + SSL (HTTPS)
```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# /etc/nginx/sites-available/faceservice
server {
    listen 80;
    server_name your-domain.com;  # or use IP with Cloudflare Tunnel
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        client_max_body_size 20M;
        proxy_read_timeout 30s;
    }
}

# SSL (if using domain)
sudo certbot --nginx -d your-domain.com
```

### 3.4 Systemd Service (auto-restart, survives reboots)
```bash
# /etc/systemd/system/faceservice.service
[Unit]
Description=Elitebase Face Service
After=network.target

[Service]
User=faceservice
WorkingDirectory=/home/faceservice/app
Environment="INTERNAL_API_KEY=your-secret-key"
ExecStart=/home/faceservice/app/venv/bin/gunicorn main:app \
    -w 2 -k uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 --timeout 60
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable:
sudo systemctl enable faceservice
sudo systemctl start faceservice
sudo systemctl status faceservice
```

### 3.5 Alternative: Cloudflare Tunnel (No port opening needed)
```bash
# Easiest way — no firewall rules needed
# Install cloudflared on Oracle VM
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Create tunnel (free on Cloudflare)
cloudflared tunnel create elitebase-face
cloudflared tunnel route dns elitebase-face face.yourdomain.com
cloudflared tunnel run elitebase-face

# Now face service accessible at https://face.yourdomain.com
# No ports open on Oracle = more secure
```

---

## PHASE 4 — NEXT.JS DEPLOYMENT (Vercel)

- [ ] Connect GitHub repo to Vercel
- [ ] Set ALL env vars in Vercel dashboard (Settings → Environment Variables):
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  PYTHON_FACE_SERVICE_URL=https://face.yourdomain.com
  INTERNAL_API_KEY=same-secret-as-python-service
  TURSO_DATABASE_URL
  TURSO_AUTH_TOKEN
  BETTER_AUTH_SECRET
  BETTER_AUTH_URL=https://yourdomain.com
  RESEND_API_KEY
  RESEND_FROM_EMAIL
  ```
- [ ] Set Node.js version in Vercel: 20.x
- [ ] Custom domain setup in Vercel
- [ ] Enable Vercel Analytics (free)
- [ ] Enable Vercel Speed Insights
- [ ] Test production build locally first: `npm run build && npm run start`

---

## PHASE 5 — MONITORING & ALERTS

### 5.1 Error Tracking
- [ ] Install Sentry in Next.js:
  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] Install Sentry in Python face service:
  ```bash
  pip install sentry-sdk[fastapi]
  ```
  ```python
  import sentry_sdk
  sentry_sdk.init(dsn="your-dsn", traces_sample_rate=0.1)
  ```
- [ ] Test Sentry: trigger a fake error, verify it appears in dashboard

### 5.2 Uptime Monitoring (Free)
- [ ] Sign up at **UptimeRobot** (free)
- [ ] Add monitors:
  - `https://yourdomain.com/api/kiosk/validate-tablet` (POST)
  - `https://face.yourdomain.com/health` (GET)
  - `https://yourdomain.com/dashboard` (GET)
- [ ] Set alert email — get notified if down > 5 mins

### 5.3 Oracle VM Monitoring
```bash
# Install htop for manual checks
sudo apt install htop -y

# Set up simple disk/memory alert
cat > /home/faceservice/check_health.sh << 'EOF'
#!/bin/bash
DISK=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ $DISK -gt 85 ]; then
  curl -X POST "https://yourdomain.com/api/internal/alert" \
    -d '{"message":"Oracle disk > 85%"}'
fi
EOF

# Cron: check every hour
(crontab -l; echo "0 * * * * /home/faceservice/check_health.sh") | crontab -
```

---

## PHASE 6 — RATE LIMITING (Kiosk Specific)

### 6.1 PIN Brute Force Protection
```typescript
// In PinScreen.tsx (mobile)
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 30

// Track failed attempts in SecureStore
// After 5 wrong PINs → lock tablet for 30 mins
// Show countdown timer on screen
```

### 6.2 Face Verification Throttle
```typescript
// In /api/kiosk/verify-face/route.ts
// Max 3 face attempts per employee per minute
// If exceeded → force PIN + manager approval
```

### 6.3 API Rate Limiting (Upstash Redis — free tier)
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
})

// Apply to all /api/kiosk/* routes
const identifier = request.headers.get('x-tablet-token') ?? 'anonymous'
const { success } = await ratelimit.limit(identifier)
if (!success) return new Response('Too Many Requests', { status: 429 })
```

---

## PHASE 7 — TESTING BEFORE GO-LIVE

### 7.1 Security Tests
- [ ] Try accessing `/api/kiosk/get-employee` without `x-tablet-token` → must get 401
- [ ] Try accessing Company A data with Company B tablet token → must get 0 results
- [ ] Try uploading 50MB file to register-face → must reject
- [ ] Try 10 wrong PINs rapidly → must rate limit
- [ ] Try brother's face after fix → must reject (< 0.45 similarity)
- [ ] Try photo-of-photo spoofing (print a face, hold to camera) → should reject

### 7.2 Flow Tests (complete end-to-end)
- [ ] New company registers → admin adds employee → tablet setup code works
- [ ] Employee first clock-in: PIN → Consent → Face Register → Action → Success
- [ ] Employee daily clock-in: PIN → Face Scan → Action → Success
- [ ] Employee clock-out: PIN → Face Scan → Clock Out → Success
- [ ] Wrong PIN → error shown → correct PIN works
- [ ] Face fails 3x → "Use PIN" option appears
- [ ] Terminated employee → cannot clock in

### 7.3 Performance Tests
- [ ] Load test kiosk API: 10 simultaneous clock-ins → all succeed < 3s
- [ ] Face service response time: < 1.5s for verify (measure 20 times, take P95)
- [ ] Dashboard loads with 50 employees, 500 attendance records → < 2s
- [ ] PIN lookup with 100 employees → < 500ms

### 7.4 Mobile App Tests
- [ ] Build production APK: `eas build --profile preview --platform android`
- [ ] Install on actual Android tablet (not phone)
- [ ] Test in airplane mode: proper "no connection" error shown
- [ ] Tablet restart → app resumes to correct screen
- [ ] Back button disabled in kiosk mode

---

## PHASE 8 — APK PRODUCTION BUILD

- [ ] Update `app.json`:
  ```json
  {
    "version": "1.0.0",
    "android": {
      "versionCode": 1,
      "package": "com.elitebase.kiosk"
    }
  }
  ```
- [ ] Update `EXPO_PUBLIC_API_URL` in `.env` to production Vercel URL
- [ ] Remove all `console.log` from mobile code
- [ ] Run: `eas build --profile production --platform android`
- [ ] Test production APK on tablet before distributing
- [ ] Keep signed APK + keystore backed up securely (if keystore lost = cannot update app)

---

## PHASE 9 — LAUNCH DAY SEQUENCE

```
Order matters — do this exactly:

1. Apply Supabase migration (pgvector index)
2. Deploy Python service to Oracle
3. Test: curl https://face.yourdomain.com/health
4. Set Vercel env vars (including PYTHON_FACE_SERVICE_URL)
5. Deploy Next.js to Vercel
6. Test: visit /dashboard → login → verify
7. Generate tablet setup code → enter in app
8. Register one employee face → verify → clock in
9. Check Sentry — no errors
10. Check UptimeRobot — all green
11. Distribute APK to tablets
12. Monitor for 24 hours
```

---

## QUICK REFERENCE — Things That WILL Break in Production

| Issue | Cause | Fix |
|---|---|---|
| Face service timeout | Oracle VM sleeping | Use systemd + gunicorn |
| "Invalid tablet token" | SecureStore cleared | Re-run setup screen |
| Slow face verify | Model not warmed up | Add warmup on startup |
| Company sees other data | RLS not enabled | Enable RLS on all tables |
| PIN brute force | No rate limiting | Add Upstash rate limit |
| App crashes on tablet | Production build bug | Test APK before deploy |
| Face passes for wrong person | Threshold too low | Keep threshold at 0.45 |
| Oracle VM out of disk | Logs filling up | Set up log rotation |

---

## DONE? Final Sign-off

- [ ] All Phase 1 security items complete
- [ ] All Phase 2 performance items complete  
- [ ] Oracle VM running + face service auto-restarts
- [ ] Vercel deployed + all env vars set
- [ ] UptimeRobot monitoring active
- [ ] Sentry error tracking active
- [ ] Production APK tested on tablet
- [ ] End-to-end flow tested with real employees
- [ ] Backup strategy in place

**You are now production ready. 🚀**