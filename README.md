# Employee Monitor — Complete System

Production-ready employee monitoring system with desktop agent, backend API, and React admin dashboard.

## 🏗 Architecture

```
┌─────────────────────────┐
│   Admin Dashboard       │  React + TypeScript + Tailwind
│   (Netlify/Vercel)      │  • Employee list
└────────────┬────────────┘  • Screenshots timeline
             │                • Activity logs
             ▼                • Download center
       ┌──────────────┐
       │ Backend API  │        Node.js + Express
       │ (Render/AWS) │        • REST endpoints
       └──────┬───────┘        • Supabase PostgreSQL
              │                • Cloudinary storage
    ┌─────────┼─────────┐
    ▼         ▼         ▼
Supabase  Cloudinary   SMTP
  DB      Screenshots  (future)
```

## 📦 Project Structure

```
employee-monitor/
├── agent/                    # Desktop agent (Node.js)
│   ├── src/
│   │   ├── index.js         # Main agent loop
│   │   ├── activity.js      # Window tracking
│   │   ├── setup.js         # Interactive setup wizard
│   │   └── service.js       # Auto-start registration
│   ├── installers/          # One-liner install scripts
│   │   ├── install-macos.sh
│   │   ├── install-linux.sh
│   │   └── install-windows.ps1
│   ├── config.json          # Agent configuration
│   └── package.json
│
├── backend/                  # API server (Express)
│   ├── src/
│   │   ├── index.js         # Server entry
│   │   ├── config/          # Supabase & Cloudinary
│   │   ├── middleware/      # Auth & validation
│   │   └── routes/          # API endpoints
│   ├── .env                 # Environment (secrets)
│   ├── .env.example         # Template
│   └── package.json
│
├── dashboard/               # Admin UI (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── EmployeeList.tsx
│   │   │   ├── EmployeeDetail.tsx
│   │   │   └── Downloads.tsx
│   │   ├── components/      # Reusable UI
│   │   ├── api/             # API client
│   │   └── App.tsx
│   ├── netlify.toml         # Netlify config
│   └── package.json
│
└── README.md (this file)
```

## 🚀 Quick Start (Local)

### 1. Backend API

```bash
cd backend
npm install
# Edit .env with your Cloudinary credentials
npm run dev
# Runs on http://localhost:4000/api
```

### 2. Dashboard

```bash
cd dashboard
npm install
npm run dev
# Runs on http://localhost:5173
# Proxies /api to localhost:4000
```

### 3. Agent (Testing)

```bash
cd agent
npm install
npm run setup
# Follow interactive wizard
npm start
# Captures screenshots every 10 min, tracks activity
```

## 🌐 Production Deployment

### Backend (Render.com — Free Tier)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Render account** at https://render.com

3. **New Web Service**
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `node src/index.js`
   - Environment variables (from `.env.example`):
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_KEY`
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`
     - `ADMIN_USERNAME` (default: admin)
     - `ADMIN_PASSWORD` (default: monitor2026)
     - `AGENT_API_KEY` (default: agent-secret-key-2026)

4. **Deploy** — Render auto-deploys on git push
   - Your backend URL: `https://your-app-backend.onrender.com`

### Dashboard (Netlify — Free Tier)

1. **Create Netlify account** at https://netlify.com

2. **Connect GitHub repo**
   - Build command: `npm run build` (in `/dashboard`)
   - Publish directory: `dist`
   - Environment variables:
     - `VITE_API_URL=https://your-app-backend.onrender.com`

3. **Deploy** — auto-deploys on git push
   - Your dashboard URL: `https://your-app.netlify.app`

### Update Netlify Redirect

In `dashboard/netlify.toml`, replace:
```toml
to = "https://your-backend.onrender.com/api/:splat"
```
with your actual Render backend URL.

## 🔐 Configuration

### Backend (.env)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | 4000 | Server port |
| `SUPABASE_URL` | (required) | From Supabase project |
| `SUPABASE_SERVICE_KEY` | (required) | JWT token |
| `CLOUDINARY_CLOUD_NAME` | (required) | From Cloudinary |
| `CLOUDINARY_API_KEY` | (required) | From Cloudinary |
| `CLOUDINARY_API_SECRET` | (required) | From Cloudinary |
| `ADMIN_USERNAME` | `admin` | Dashboard login |
| `ADMIN_PASSWORD` | `monitor2026` | Dashboard login |
| `AGENT_API_KEY` | `agent-secret-key-2026` | Agent authentication |

### Agent (config.json)

Automatically generated by `npm run setup`. Includes:
- API server URL
- Employee ID (UUID)
- Screenshot interval (default: 10 min)
- Activity track interval (default: 10 sec)
- Idle detection threshold (default: 2 min)

## 🔗 API Endpoints

### Agent Endpoints (require `x-api-key` header)

- **POST** `/api/upload-screenshot` — Upload compressed screenshot
- **POST** `/api/log-activity` — Send activity logs (batch)

### Admin Endpoints (require Basic auth)

- **GET** `/api/employees` — List all employees
- **GET** `/api/employee/:id` — Get employee details
- **GET** `/api/employee/:id/screenshots` — Get screenshots (paginated, filterable by date)
- **GET** `/api/employee/:id/activity` — Get activity logs (paginated, filterable)

### Health

- **GET** `/api/health` — Server status

## 👨‍💼 Admin Dashboard

Access at `https://your-dashboard.com`

**Login:** `admin` / `monitor2026`

**Features:**
- **Employees page** — List all employees with live status badges
- **Employee detail** — View screenshots and activity logs
- **Screenshot timeline** — Grid view with lightbox, date filtering
- **Activity table** — App/window tracking, idle/active status, time range filtering
- **Downloads page** — Generate per-employee install commands

## 💻 Employee Installation

### For employees using your dashboard:

1. Admin goes to `/downloads` page
2. Select employee from dropdown
3. Copy pre-filled install command
4. Send to employee via email/Slack

**Employee runs:**

```bash
# macOS/Linux
curl -fsSL https://your-dashboard.com/install/macos.sh | bash

# Windows (PowerShell)
irm https://your-dashboard.com/install/windows.ps1 | iex
```

**What happens:**
- Checks for Node.js (installs if missing)
- Downloads agent files
- Runs interactive setup wizard
- Registers auto-start service (runs on boot)
- Starts monitoring silently

## 📊 Database Schema

### employees
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Employee name |
| email | VARCHAR | Unique |
| department | VARCHAR | Optional |
| created_at | TIMESTAMP | Auto |

### screenshots
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → employees.id |
| image_url | TEXT | Cloudinary URL |
| thumbnail_url | TEXT | Compressed version |
| timestamp | TIMESTAMP | Auto |

### activity_logs
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → employees.id |
| app_name | VARCHAR | Active application |
| window_title | TEXT | Window title |
| status | VARCHAR | 'active' or 'idle' |
| timestamp | TIMESTAMP | Auto |

## 🔒 Security

- **Agent authentication** — API key in request header
- **Admin authentication** — Basic auth (change password in production)
- **Database** — Row-level security enabled, service role only
- **Screenshots** — Private Cloudinary URLs
- **HTTPS** — Enforced in production

### Before Production:

1. ✅ Change `ADMIN_PASSWORD` in backend `.env`
2. ✅ Change `AGENT_API_KEY` and update all agent installers
3. ✅ Set up proper SSL/TLS certificates
4. ✅ Use environment-specific API URLs
5. ✅ Consider implementing OAuth for admin login

## 📝 Development Notes

- Agent uses `screenshot-desktop` and `sharp` (native modules) — can't be bundled into single binary
- Cloudinary used for image storage and optimization
- Supabase PostgreSQL for data storage
- Screenshots compressed to ~100KB before upload
- Activity logs batched (every 60s) to reduce API calls
- Agent stores config in `config.json` for easy updates

## 🛠 Troubleshooting

### Agent not capturing screenshots
```bash
cd agent
npm start  # Check console output
# If error: "Cannot find module 'sharp'"
npm install --build-from-source
```

### Dashboard can't reach backend
- Check `VITE_API_URL` env var in Netlify settings
- Verify Render backend is running
- Check CORS origin in backend

### Supabase connection error
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in backend `.env`
- Check Supabase project is active

### Cloudinary upload fails
- Verify credentials in `.env`
- Check image size < 10MB
- Ensure Cloudinary account is active

## 📦 Deployment Checklist

- [ ] GitHub repo created and code pushed
- [ ] Supabase project configured (done via MCP)
- [ ] Cloudinary account created and credentials added
- [ ] Backend deployed to Render
- [ ] Dashboard deployed to Netlify
- [ ] API URL updated in Netlify env vars
- [ ] Admin password changed from default
- [ ] Agent installer scripts updated with correct URLs
- [ ] Tested locally first
- [ ] Admin login verified
- [ ] Sample employee download tested

## 📞 Support

For issues:
1. Check `.env` files are configured
2. Verify backend is running (`curl http://localhost:4000/api/health`)
3. Check browser console for errors
4. Review backend logs for API errors
5. Ensure Supabase/Cloudinary credentials are valid

## 📄 License

Proprietary — Employee Monitoring System
