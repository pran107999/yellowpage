# DesiNetwork - Complete Documentation

A full-stack classifieds application with real-time updates, modern UI, and secure WebSocket communication.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Database](#database)
6. [API Reference](#api-reference)
7. [Real-Time Updates (WebSocket)](#real-time-updates-websocket)
8. [Authentication](#authentication)
9. [UI & Design System](#ui--design-system)
10. [State Management (TanStack Query)](#state-management-tanstack-query)
11. [Environment Variables](#environment-variables)
12. [Scripts](#scripts)
13. [Image Uploads](#image-uploads)
14. [Security](#security)
15. [Deployment](#deployment)

---

## Overview

DesiNetwork is a classifieds platform where users can:

- **Browse** published ads without logging in (with city, category, and search filters)
- **Register/Login** to post and manage their own ads
- **Create ads** as drafts and publish when ready
- **Upload images** (optional, up to 10 images per ad, max 10MB each; Supabase Storage in production)
- **Choose visibility** per ad: All cities or Selected cities only
- **Admin dashboard** for managing users, classifieds, cities, and viewing stats
- **Real-time sync** across tabs and devices via WebSocket

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express, PostgreSQL, JWT, bcrypt, Socket.io, Multer, Supabase Storage |
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, React Hook Form, Axios, TanStack Query, Socket.io-client |
| **Database** | PostgreSQL (raw SQL) |
| **Real-time** | Socket.io (WebSocket) |

---

## Project Structure

```
desinetwork/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL connection
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── cityController.js
│   │   │   └── classifiedController.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT auth & admin check
│   │   │   └── upload.js         # Multer config (10MB limit, image types)
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── cities.js
│   │   │   └── classifieds.js
│   │   ├── db/
│   │   │   ├── schema.sql         # Table definitions
│   │   │   ├── setup.js           # Create tables
│   │   │   ├── seed.js            # Seed data (runs once)
│   │   │   ├── migrate-classified-images.js  # Add images table (existing DBs)
│   │   │   ├── migrate-email-verification.js # Add email verification columns
│   │   │   ├── fix-broken-images.js          # Fix broken image references
│   │   │   ├── remove-duplicate-classifieds.js
│   │   │   ├── seed-images-for-classifieds.js
│   │   │   └── sync-image-paths.js
│   │   ├── services/
│   │   │   ├── email.js           # Resend email service (OTP)
│   │   │   └── storage.js         # Supabase Storage for images
│   │   ├── app.js                 # Express app
│   │   ├── server.js              # HTTP/HTTPS server + Socket.io
│   │   └── socket.js              # WebSocket auth, limits, events
│   ├── uploads/                   # Local image storage (fallback when Supabase not configured)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClassifiedForm.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── WebSocketSync.jsx  # Listens for WS events, refetches queries
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   ├── api.js             # Axios instance
│   │   │   ├── queryKeys.js       # TanStack Query keys
│   │   │   └── socket.js          # Socket.io client
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ClassifiedDetail.jsx
│   │   │   ├── Classifieds.jsx
│   │   │   ├── CreateClassified.jsx
│   │   │   ├── EditClassified.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyClassifieds.jsx
│   │   │   ├── Register.jsx
│   │   │   └── VerifyEmail.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vercel.json                # Proxies /api and /socket.io to backend (production)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── DOCUMENTATION.md
├── README.md
└── package.json
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Create database

```bash
createdb desinetwork
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET
```

### 3. Install and run

```bash
# From project root
npm run install:all
npm run db:setup
npm run db:seed
npm run dev
```

**Existing databases:** If you ran `db:setup` before image support was added, run `npm run db:migrate-classified-images` once.

- **Backend:** http://localhost:3001  
- **Frontend:** http://localhost:5173  

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@desinetwork.com | admin123 |
| User | user@desinetwork.com | user123 |

---

## Database

### Schema

- **users** – id, email, password_hash, name, role (user/admin)
- **cities** – id, name, state
- **classifieds** – id, user_id, title, description, category, contact_email, contact_phone, visibility, status (draft/published)
- **classified_cities** – junction table for classifieds with selected cities
- **classified_images** – id, classified_id, file_path, sort_order; `file_path` is either a Supabase public URL or a relative path for local storage

### Seed behavior

- **Seed once:** Skips if sample classified "Plumber Services - Fast & Reliable" already exists
- Creates admin + test user, 12 cities, 2 sample classifieds

---

## API Reference

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classifieds` | List published classifieds (query: cityId, category, search); includes `images` array |
| GET | `/api/classifieds/:id` | Get single classified; includes `images` array |
| GET | `/api/cities` | List all cities |
| GET | `/api/uploads/*` | Static file serving for uploaded images |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, password) |
| POST | `/api/auth/login` | Login (email, password) |
| GET | `/api/auth/me` | Current user (Bearer token required) |
| POST | `/api/auth/verify-email` | Verify email with one-time code (body: `{ code: "123456" }`) |
| POST | `/api/auth/resend-verification` | Resend verification email (Bearer token required) |

### Protected (login required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classifieds/my` | My classifieds (includes `images`) |
| POST | `/api/classifieds` | Create classified (**multipart/form-data**; fields: title, description, category, etc.; optional `images` files) |
| PUT | `/api/classifieds/:id` | Update own classified (**multipart/form-data**; optional `images`; optional `removeImageIds` JSON array) |
| DELETE | `/api/classifieds/:id` | Delete own classified |

### Admin only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/classifieds` | All classifieds |
| PUT | `/api/admin/classifieds/:id/status` | Update status (draft/published) |
| DELETE | `/api/admin/classifieds/:id` | Delete any classified |
| POST | `/api/admin/cities` | Add city |
| DELETE | `/api/admin/cities/:id` | Delete city |
| PUT | `/api/admin/users/:id/role` | Change user role |

---

## Real-Time Updates (WebSocket)

### Overview

Socket.io provides real-time updates when classifieds or admin data changes. Changes propagate to all connected clients (including other tabs).

### Events

| Event | Trigger | Action |
|-------|---------|--------|
| `classifieds:changed` | Create/update/delete classified | Refetch classifieds, My Classifieds, admin classifieds |
| `admin:changed` | Add/delete city, change user role | Refetch admin stats, users, cities |

### Security

- **Auth (optional):** Logged-in users send JWT in `auth.token`; guests connect without auth
- **Connection limit:** 5 connections per authenticated user
- **Idle timeout:** 60s ping timeout; 25s ping interval
- **Message validation:** Incoming client events validated before processing
- **WSS:** Use `SSL_KEY` and `SSL_CERT` in `.env` for HTTPS/WSS

### Flow

1. Backend emits `classifieds:changed` or `admin:changed` after mutations
2. `WebSocketSync` listens and calls `queryClient.refetchQueries()` for relevant keys
3. TanStack Query refetches; UI updates automatically

---

## Authentication

- JWT stored in `localStorage`, sent as `Authorization: Bearer <token>`
- `AuthContext` handles login/logout and token persistence
- Socket reconnects with token on login; disconnects on logout
- Protected routes redirect to `/login` if unauthenticated
- Admin routes require `role === 'admin'`

### Email validation and verification

- **Validation:** Email format is validated on both frontend (Register form pattern) and backend (`express-validator` `isEmail()` on register/login).
- **Verification:** On register, a 6-digit one-time passcode (OTP) is sent to the user’s email via [Resend](https://resend.com). If `RESEND_API_KEY` is not set, the OTP is logged to the server console. The user enters the code on the `/verify-email` page. Login and `/auth/me` return `emailVerified: true/false`. Unverified users see a banner with “Enter code” and “Resend code”.
- **Database:** Run `npm run db:migrate-email-verification` in the backend once to add `email_verified_at`, `email_verification_token`, and `email_verification_expires_at` to the `users` table. New installs using `schema.sql` already include these columns.

---

## UI & Design System

### Theme

- Dark theme: slate backgrounds, amber accents
- Fonts: DM Serif Display (headings), Source Sans 3 (body)

### Tailwind utilities

- `btn-primary` – Primary amber button
- `btn-secondary` – Outlined secondary button
- `input-base` – Styled input with focus states
- `card` – Card with hover glow
- `card-static` – Card without hover

### Animations

- `animate-stagger` – Staggered entrance for children
- `animate-fade-in`, `animate-slide-up`, `animate-glow`

---

## State Management (TanStack Query)

### Query keys

- `['classifieds', filters]` – Public classifieds list
- `['classifieds', 'my']` – User's classifieds
- `['classifieds', id]` – Single classified
- `['cities']` – Cities list
- `['admin', 'stats']` – Admin stats
- `['admin', 'users']` – Admin users
- `['admin', 'classifieds']` – Admin classifieds

### Mutations

- Create, update, delete trigger WebSocket events
- WebSocketSync refetches queries when events are received
- Optimistic delete on My Classifieds (item removed from UI before API responds)

---

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 3001) |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for JWT signing |
| JWT_EXPIRES_IN | Token expiry (e.g. 7d) |
| FRONTEND_URL | CORS origin (default: http://localhost:5173) |
| SSL_KEY | Path to key.pem (optional, for HTTPS) |
| SSL_CERT | Path to cert.pem (optional, for HTTPS) |
| RESEND_API_KEY | [Resend](https://resend.com) API key for sending OTP emails (optional; if unset, OTP is logged to console) |
| EMAIL_FROM | From address (default: `onboarding@resend.dev`; use your domain after verifying in Resend) |
| APP_NAME | App name used in email body (default: DesiNetwork) |
| LOG_OTP_TO_CONSOLE | Set to `true` to always print verification code in server terminal (for testing) |
| SUPABASE_URL | Supabase project URL for image storage (optional; if unset, images stored locally) |
| SUPABASE_SERVICE_KEY | Supabase service_role key for uploads (see [SUPABASE-STORAGE-SETUP.md](SUPABASE-STORAGE-SETUP.md)) |

### Frontend

| Variable | Description |
|----------|-------------|
| (none required) | Production uses Vercel proxy; frontend calls `/api` (same origin) and `vercel.json` proxies to Render |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + frontend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm run install:all` | Install all dependencies |
| `npm run db:setup` | Create database tables |
| `npm run db:seed` | Seed data (skips if already seeded) |
| `npm run db:migrate-classified-images` | Add `classified_images` table (run once for existing DBs) |
| `npm run db:seed-images` | Seed sample images for existing classifieds |
| `npm run db:remove-duplicates` | Remove duplicate classifieds |
| `cd backend && npm run db:migrate-email-verification` | Add email verification columns to existing `users` table |
| `cd backend && npm run db:sync-image-paths` | Sync image file paths in database |

---

## Image Uploads

Classifieds support optional image attachments. Storage backend is configurable:

- **Production (Supabase):** When `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set, images are uploaded to Supabase Storage. URLs are public and persistent. See [SUPABASE-STORAGE-SETUP.md](SUPABASE-STORAGE-SETUP.md).
- **Local dev (fallback):** When Supabase is not configured, images are stored in `backend/uploads/classifieds/{classifiedId}/`.

### Constraints

- **Formats:** JPEG, PNG, GIF, WebP
- **Size limit:** 10MB per image
- **Quantity:** Up to 10 images per classified

### API

- **Create:** Send `multipart/form-data` with field `images` (one or more files)
- **Update:** Append new files to `images`; send `removeImageIds` (JSON array of UUIDs) to remove existing images
- **Response:** Each classified includes `images: [{ id, url }]` where `url` is either a Supabase public URL or `/api/uploads/classifieds/{id}/{filename}` for local storage

### Frontend

- `ClassifiedForm` includes file input with preview and client-side 10MB validation
- Images displayed in detail view (responsive grid) and list cards (thumbnail)

---

## Security

- Passwords hashed with bcrypt
- JWT for API auth
- WebSocket auth optional (guests allowed)
- Connection limits and idle timeouts on socket
- Input validation via express-validator
- CORS restricted to FRONTEND_URL

---

## Deployment

See **[DEPLOY-SUPABASE.md](DEPLOY-SUPABASE.md)** for step-by-step instructions to deploy:

- **Database:** Supabase (PostgreSQL)
- **Backend:** Render
- **Frontend:** Vercel (proxies `/api` and `/socket.io` to Render via `vercel.json`)
- **Images:** Supabase Storage (see [SUPABASE-STORAGE-SETUP.md](SUPABASE-STORAGE-SETUP.md))
- **Custom domain:** GoDaddy (optional)

**Important:** Configure Supabase Storage for images; otherwise uploads on Render will be lost when the app restarts (ephemeral disk).
