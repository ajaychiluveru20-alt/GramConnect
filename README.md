# GramConnect – Smart Village Problem Solver

**GramConnect** is a full-stack civic-tech web application built with **React 19, TypeScript, Java 21, Spring Boot 3.5, and PostgreSQL**. It enables villagers to report local infrastructure grievances (water, electricity, roads, drainage, garbage, streetlights) and allows Gram Panchayat administrators and field workers to manage resolution lifecycles in real-time.

---

## Three Role-Based Portals & Demo Accounts

GramConnect features three completely separated role-based portals with Spring Security + JWT authentication and BCrypt password encryption:

| Portal | URL Route | Demo Email | Demo Password | Role & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Portal** | `/login/admin` → `/admin` | `admin@gramconnect.gov.in` | `Admin@123` | **ADMIN**: Full village complaints oversight, worker assignment, worker provisioning & activation, citizen registry, civic analytics. |
| **Worker Portal** | `/login/worker` → `/worker` | `worker@gramconnect.gov.in` | `Worker@123` | **WORKER**: Access only complaints assigned to this worker, start field repairs (`IN_PROGRESS`), submit resolution notes & verification, mark `RESOLVED`. |
| **Villager Portal** | `/login/user` → `/my-complaints` | `villager@gramconnect.gov.in` | `User@123` | **VILLAGER**: Public self-registration (`/register`), submit complaints, track live lifecycle (`PENDING` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`), view worker notes. |

> **Login Hub**: Visit `/login` to view the three cards with direct links and 1-click **Auto-Fill Demo Credentials** buttons.  
> **Security Guardrails**: Unauthorized role access is blocked at the Spring Boot REST API level with HTTP 403 Forbidden.

---

## Production Deployment Architecture

```
┌─────────────────────────────────┐
│         Vercel (Frontend)       │
│   React 19 + TypeScript + Vite  │
│   https://<app>.vercel.app      │
└────────────────┬────────────────┘
                 │ HTTPS REST API
                 ▼
┌─────────────────────────────────┐
│         Render (Backend)        │
│    Java 21 + Spring Boot 3.5    │
│  https://<api>.onrender.com/api │
└────────────────┬────────────────┘
                 │ JDBC (SSL)
                 ▼
┌─────────────────────────────────┐
│          Neon (Database)        │
│       PostgreSQL 16 Engine      │
│   Hosted Managed Cloud Database │
└─────────────────────────────────┘
```

---

## Project Structure

```
Gram Connect/
├── frontend/              # React 19 + TypeScript + Vite frontend
│   ├── src/               # AuthContext, Navbar, ProtectedRoute, role dashboards
│   │   ├── context/       # AuthContext with JWT & role persistence
│   │   ├── components/    # Navbar, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── public/    # Home, About, Services, Emergency, Login, Register
│   │   │   ├── admin/     # Admin Dashboard (Complaints, Workers, Villagers, Reports)
│   │   │   ├── worker/    # Worker Dashboard (Assigned tasks, Resolution modal)
│   │   │   └── villager/  # ReportProblem, MyComplaints (Lifecycle tracking)
│   │   ├── services/      # api.ts, authService.ts, complaintService.ts, userService.ts
│   │   └── types/         # auth.ts, complaint.ts, user.ts
│   ├── vercel.json        # Single Page Application (SPA) routing rewrite configuration
│   ├── .env.example       # Example production environment variables
│   └── package.json       # Frontend scripts and dependencies
├── backend/               # Spring Boot 3.5 Java 21 REST API
│   ├── src/               # SecurityConfig, JwtUtils, Controllers, Entities, Repositories
│   ├── Dockerfile         # Multi-stage production container build for Render
│   ├── .dockerignore      # Docker build exclusion rules
│   └── pom.xml            # Maven build with Spring Security & JJWT
├── database/              # PostgreSQL SQL scripts & cloud DB instructions
│   ├── schema.sql         # Production database schema (users & complaints)
│   ├── sample_data.sql    # Optional initial sample records
│   └── README.md          # Cloud database setup guide
├── package.json           # Root convenience commands
├── .gitignore             # Comprehensive secrets & build artifact exclusion
└── README.md              # Project and deployment documentation
```

---

## Beginner-Friendly Deployment Guide (Step-by-Step)

Follow these steps to deploy GramConnect live on the internet for free.

---

### Step 1: Push Project to GitHub

1. Ensure Git is installed on your computer.
2. In your terminal at `C:\Gram Connect`:
   ```cmd
   git init
   git add .
   git commit -m "GramConnect initial full-stack production release"
   ```
3. Go to [github.com](https://github.com) and click **New Repository**.
   - Repository name: `gramconnect`
   - Set to **Public** or **Private**.
   - Do **not** initialize with README or .gitignore (we already have them).
4. Copy the repository URL and run:
   ```cmd
   git branch -M main
   git remote add origin https://github.com/<your-username>/gramconnect.git
   git push -u origin main
   ```

---

### Step 2: Create Managed PostgreSQL Database on Neon (Free)

1. Sign up for a free account at [neon.tech](https://neon.tech).
2. Click **Create Project**:
   - Name: `gramconnect-db`
   - Region: Select the region closest to you.
3. On the Neon dashboard, navigate to **SQL Editor**:
   - Open [`database/schema.sql`](./database/schema.sql), copy its SQL contents, paste into the Neon SQL Editor, and click **Run**.
   - *(Optional)* Open [`database/sample_data.sql`](./database/sample_data.sql), paste and run to insert starter records.
4. On the Neon dashboard, find your **Connection Details**:
   - Switch the connection dropdown from `psql` to **Connection string** or **Parameters**.
   - Note down:
     - **Host**: e.g. `ep-cool-snowflake-123456.us-east-2.aws.neon.tech`
     - **Database**: `neondb`
     - **Username**: `neondb_owner`
     - **Password**: `[your-password]`

---

### Step 3: Deploy Spring Boot Backend on Render (Free)

1. Sign up or log in at [render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository (`gramconnect`).
4. Configure the service:
   - **Name**: `gramconnect-backend`
   - **Region**: Choose the same or closest region as your Neon database.
   - **Root Directory**: `backend`
   - **Runtime**:
     - *Option A (Docker - Recommended)*: Select **Docker** (Render uses `backend/Dockerfile` automatically).
     - *Option B (Native)*: Select **Java**, Build Command: `mvn clean package -DskipTests`, Start Command: `java -jar target/gramconnect-backend-0.0.1-SNAPSHOT.jar`.
   - **Instance Type**: **Free**.
5. Scroll down to **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<neon-host>/neondb?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `<neon-username>` |
   | `SPRING_DATASOURCE_PASSWORD` | `<neon-password>` |
   | `PORT` | `8080` |
6. Click **Create Web Service**.
7. Wait 2-3 minutes for the build to complete. Once live, Render provides your public URL:
   `https://gramconnect-backend.onrender.com`
8. Verify backend health in your browser:
   `https://gramconnect-backend.onrender.com/api/health`
   *(Should return `{"application":"GramConnect","status":"ok"}`)*

---

### Step 4: Deploy Frontend on Vercel (Free)

1. Sign up or log in at [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`gramconnect`).
4. Configure Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://gramconnect-backend.onrender.com/api` |
   *(Use your actual Render backend URL followed by `/api`)*
6. Click **Deploy**.
7. In ~30 seconds, Vercel gives you your live frontend URL:
   `https://gramconnect.vercel.app`

---

### Step 5: Configure Backend CORS for Vercel

The backend is pre-configured to automatically allow all `https://*.vercel.app` domains out of the box!  
If you use a custom domain (e.g. `https://myvillage.org`), go to **Render > gramconnect-backend > Environment**:
- Add `ALLOWED_ORIGINS` = `https://myvillage.org,https://gramconnect.vercel.app`
- Render will automatically restart with the new domain allowed.

---

### Step 6: Verify Complete Live Website

1. Visit your live Vercel URL in your browser.
2. Go to `/login` to explore the 3 portal selection cards.
3. Test Admin Login (`admin@gramconnect.gov.in` / `Admin@123`): Assign workers, update status, view users and analytics.
4. Test Worker Login (`worker@gramconnect.gov.in` / `Worker@123`): Accept jobs, mark as in progress, submit resolution notes.
5. Test Citizen Registration (`/register`) and Villager Login: Report problem and view live tracking!

---

## Local Development Commands

- Run Backend: `cd backend && mvn spring-boot:run`
- Run Frontend: `cd frontend && npm run dev`
- Build Frontend: `cd frontend && npm run build`
- Package Backend JAR: `cd backend && mvn clean package -DskipTests`
