# DesiNetwork - Classifieds Application

A full-stack classifieds application with location-based filtering, user authentication, real-time WebSocket updates, and admin dashboard.

📖 **[Full Documentation](DOCUMENTATION.md)** – Setup, API, WebSocket, security, and more.

🚀 **[Deploy to Supabase + Render + Vercel](DEPLOY-SUPABASE.md)** – Step-by-step deployment guide.

🗄️ **[Supabase Storage for Images](SUPABASE-STORAGE-SETUP.md)** – Persistent image storage (required for production).

## Tech Stack

- **Backend:** Express.js, PostgreSQL, JWT authentication, bcrypt, Socket.io, Multer, Supabase Storage (images)
- **Frontend:** React, Vite, React Router, Tailwind CSS, React Hook Form, Axios, TanStack Query, Socket.io-client
- **Database:** PostgreSQL with raw SQL

## Features

- **Public browsing:** Anyone can view published classifieds without logging in
- **Location filtering:** Filter classifieds by city
- **User auth:** Register/Login required only for posting ads
- **CRUD for classifieds:** Create, read, update, delete your own ads
- **Image uploads:** Optional images per ad (up to 10, max 10MB each; Supabase Storage in production)
- **Publishing criteria:** Choose "All cities" or "Selected cities" for each ad
- **Admin dashboard:** Full portal management (users, classifieds, cities, stats)
- **Draft/Published:** Ads start as draft; users can publish when ready
- **Real-time updates:** WebSocket sync across tabs and devices
- **Email verification:** OTP sent via Resend; unverified users prompted to verify

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Create PostgreSQL database

```bash
createdb desinetwork
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

Example `.env`:

```
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/desinetwork
SUPABASE_URL=https://your-project.supabase.co        # For image storage (see SUPABASE-STORAGE-SETUP.md)
SUPABASE_SERVICE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
RESEND_API_KEY=your-resend-key                       # For email verification
```

### 3. Install dependencies and setup database

```bash
# From project root
npm run install:all

# Setup database schema
npm run db:setup

# Seed sample data (admin user + test user + cities + sample classifieds)
npm run db:seed
```

> **Existing databases:** Run `npm run db:migrate-classified-images` once to add image support. Run `cd backend && npm run db:migrate-email-verification` to add email verification columns.

### 4. Run the application

```bash
# Run both backend and frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@desinetwork.com | admin123 |
| User | user@desinetwork.com | user123 |

## API Endpoints

### Public
- `GET /api/classifieds` - List published classifieds (query: cityId, category, search)
- `GET /api/classifieds/:id` - Get single classified
- `GET /api/cities` - List all cities
- `GET /api/uploads/*` - Static file serving (local dev only; production uses Supabase Storage URLs)

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (requires auth)
- `POST /api/auth/verify-email` - Verify email with OTP code
- `POST /api/auth/resend-verification` - Resend verification email

### Protected (requires login)
- `GET /api/classifieds/my` - My classifieds
- `POST /api/classifieds` - Create classified (multipart: title, description, etc.; optional `images`)
- `PUT /api/classifieds/:id` - Update own classified (multipart; optional `images`, `removeImageIds`)
- `DELETE /api/classifieds/:id` - Delete own classified

### Admin only
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - All users
- `GET /api/admin/classifieds` - All classifieds
- `PUT /api/admin/classifieds/:id/status` - Update status
- `DELETE /api/admin/classifieds/:id` - Delete any classified
- `POST /api/admin/cities` - Add city
- `DELETE /api/admin/cities/:id` - Delete city
- `PUT /api/admin/users/:id/role` - Change user role

## Project Structure

```
desinetwork/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/ (auth.js, upload.js)
│   │   ├── routes/
│   │   ├── db/ (schema.sql, setup.js, seed.js, migrations)
│   │   ├── services/email.js
│   │   ├── services/storage.js    # Supabase Storage for images
│   │   ├── app.js
│   │   ├── server.js
│   │   └── socket.js
│   └── package.json
├── frontend/
│   ├── vercel.json                # Proxies /api and /socket.io to Render
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/ (including VerifyEmail.jsx)
│   │   └── App.jsx
│   └── package.json
├── package.json
├── DOCUMENTATION.md
├── DEPLOY-SUPABASE.md
├── SUPABASE-STORAGE-SETUP.md
└── README.md
```
