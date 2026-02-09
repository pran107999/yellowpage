# Yellow Page - Classifieds Application

A full-stack Yellow Pages-style classifieds application with location-based filtering, user authentication, real-time WebSocket updates, and admin dashboard.

📖 **[Full Documentation](DOCUMENTATION.md)** – Setup, API, WebSocket, security, and more.

## Tech Stack

- **Backend:** Express.js, PostgreSQL, JWT authentication, bcrypt, Socket.io
- **Frontend:** React, Vite, React Router, Tailwind CSS, React Hook Form, Axios, TanStack Query, Socket.io-client
- **Database:** PostgreSQL with raw SQL

## Features

- **Public browsing:** Anyone can view published classifieds without logging in
- **Location filtering:** Filter classifieds by city
- **User auth:** Register/Login required only for posting ads
- **CRUD for classifieds:** Create, read, update, delete your own ads
- **Publishing criteria:** Choose "All cities" or "Selected cities" for each ad
- **Admin dashboard:** Full portal management (users, classifieds, cities, stats)
- **Draft/Published:** Ads start as draft; users can publish when ready
- **Real-time updates:** WebSocket sync across tabs and devices

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Create PostgreSQL database

```bash
createdb yellowpage
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
DATABASE_URL=postgresql://postgres:password@localhost:5432/yellowpage
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
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
| Admin | admin@yellowpage.com | admin123 |
| User | user@yellowpage.com | user123 |

## API Endpoints

### Public
- `GET /api/classifieds` - List published classifieds (query: cityId, category, search)
- `GET /api/classifieds/:id` - Get single classified
- `GET /api/cities` - List all cities

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (requires auth)

### Protected (requires login)
- `GET /api/classifieds/my` - My classifieds
- `POST /api/classifieds` - Create classified
- `PUT /api/classifieds/:id` - Update own classified
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
yellowpage/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/auth.js
│   │   ├── routes/
│   │   ├── db/schema.sql, setup.js, seed.js
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/api.js
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
├── package.json
└── README.md
```
