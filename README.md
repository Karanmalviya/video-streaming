# Video Upload, Sensitivity Processing & Streaming Platform

A full-stack application enabling video upload, simulated sensitivity analysis with real-time progress, role-based access, multi-tenant data isolation, and HTTP range-request streaming.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js, MongoDB, Mongoose |
| Frontend | React 18, Vite, Tailwind CSS |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Upload | Multer |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| Testing | Jest, Supertest |

## Project Structure

```
├── backend/
│   ├── config/          # DB connection, Multer config
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth, RBAC, validation, error handling
│   ├── models/          # Mongoose schemas (User, Video)
│   ├── routes/          # Express routers
│   ├── services/        # Socket.io & processing pipeline
│   ├── validators/      # Joi schemas
│   ├── tests/           # Jest test suites (auth, upload, streaming)
│   ├── uploads/         # Uploaded video files (auto-created)
│   ├── server.js        # Entry point
│   └── .env.example     # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, ProtectedRoute
│   │   ├── context/     # AuthContext, SocketContext
│   │   ├── pages/       # All page components
│   │   ├── services/    # Axios API client
│   │   ├── App.jsx      # Router & providers
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── .env.example     # Frontend env template
│   └── tailwind.config.js
└── README.md
```

## Prerequisites

- **Node.js** v18+ (LTS)
- **MongoDB** running locally on `mongodb://localhost:27017` (or MongoDB Atlas)

## Setup & Run

### 1. Backend

```bash
cd backend
cp .env.example .env       # Edit .env if needed
npm install
npm start                  # or: npm run dev (with --watch)
```

Server starts at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App opens at **http://localhost:5173**

### 3. Run Tests

```bash
cd backend
npm test
```

Tests cover: auth (register, login, profile), upload (auth, RBAC), video listing (filters, search, tenant isolation), and streaming (206 range, 200 full, access denied).

## Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGODB_URI` | `mongodb://localhost:27017/video-platform` | MongoDB connection string |
| `JWT_SECRET` | (set your own) | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `UPLOAD_DIR` | `uploads` | Directory for uploaded videos |
| `MAX_FILE_SIZE` | `104857600` | Max upload size in bytes (100 MB) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |

### Frontend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Backend API URL |

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Videos
| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/api/videos` | ✅ | any | List videos (`status`, `classification`, `search`, `sortBy`, `sortOrder`, `page`, `limit`) |
| POST | `/api/videos/upload` | ✅ | editor, admin | Upload video (multipart: `video` file + `title`) |
| GET | `/api/videos/:id` | ✅ | any | Get video metadata |
| DELETE | `/api/videos/:id` | ✅ | editor, admin | Delete video |
| PUT | `/api/videos/:id/assign` | ✅ | editor, admin | Assign video to users (`{ userIds: [...] }`) |
| PUT | `/api/videos/:id/unassign` | ✅ | editor, admin | Remove user assignments |
| GET | `/api/videos/:id/stream` | ✅ | any | Stream video (Range header → 206) |

### Admin
| Method | Route | Auth | Roles | Description |
|--------|-------|------|-------|-------------|
| GET | `/api/admin/users` | ✅ | admin | List all users |
| PUT | `/api/admin/users/:id/role` | ✅ | admin | Change user role |

## User Roles

| Role | Permissions |
|------|------------|
| **viewer** | View/stream only videos **assigned to them** |
| **editor** | Upload, manage, delete own videos, assign to viewers |
| **admin** | Full access + user management + org-wide video visibility |

## Features

- ✅ JWT authentication with bcrypt password hashing
- ✅ Role-based access control (viewer / editor / admin)
- ✅ Multi-tenant data isolation by `organizationId`
- ✅ Video upload with file type/size validation (Multer)
- ✅ Simulated sensitivity analysis pipeline (safe/flagged classification)
- ✅ Real-time progress updates via Socket.io
- ✅ HTTP range-request video streaming (206 Partial Content)
- ✅ Video library with search, status filtering, classification filtering, sort by date/size/title
- ✅ Video assignment — editors/admins assign videos to viewers
- ✅ Responsive dark-theme UI with glassmorphism design
- ✅ Comprehensive error handling (auth, validation, upload, streaming)
- ✅ Security: Helmet, CORS, rate limiting, Joi input validation
- ✅ Basic test suite for auth, upload, and streaming routes

## Sensitivity Processing Pipeline

The processing pipeline is **simulated** but architecturally ready for real FFmpeg/ML integration:

1. Upload triggers background processing
2. Progress updates at 10% → 25% → 50% → 75% → 100%
3. Random classification: **safe** (80%) or **flagged** (20%)
4. All progress emitted via Socket.io to the user's room
5. Replace `services/processingService.js` with real analysis logic when ready

## Architecture Overview

```
Client (React + Vite)
  ├── Axios → REST API (Express)
  └── Socket.io-client → Socket.io Server
       │
Backend (Express.js)
  ├── Middleware: Helmet, CORS, Rate Limit, JWT Auth, RBAC, Joi Validation
  ├── Routes: /api/auth, /api/videos, /api/admin
  ├── Controllers: Business logic
  ├── Models: User (bcrypt), Video (status/progress/classification)
  ├── Services: Socket.io rooms, Processing pipeline
  └── Multer: File upload to /uploads
       │
Storage
  ├── MongoDB: User + Video metadata
  └── File System: Video files (UUID-named)
```

## Assumptions & Design Decisions

1. **Simulated processing** — The sensitivity analysis uses random classification (80% safe / 20% flagged) with timed progress steps. The architecture supports plugging in real FFmpeg/ML analysis by modifying `processingService.js`.
2. **Local file storage** — Videos are stored on the server's file system. For production, swap to S3/GCS in `config/multer.js`.
3. **Token-based streaming** — HTML5 `<video>` elements cannot send Authorization headers, so the streaming endpoint accepts JWT via `?token=` query parameter.
4. **Tenant isolation** — Each user has an `organizationId`. Editors see only their own uploads. Admins see all within their org. Viewers see only assigned videos.
5. **Test database** — Tests use a separate MongoDB database (`-test` suffix) to avoid corrupting development data.

## Deployment

### Backend (Render - Recommended)

1.  **Create a New Web Service** on [Render](https://dashboard.render.com).
2.  Connect your GitHub repository.
3.  Select **Root Directory**: `backend`.
4.  Set **Build Command**: `npm install`.
5.  Set **Start Command**: `npm start`.
6.  **Add Environment Variables**:
    - `MONGODB_URI` (Atlas connection string)
    - `JWT_SECRET` (Random string)
    - `CLIENT_URL` (Your Vercel URL, e.g., `https://project.vercel.app`)
7.  **(Optional) Persistent Disk**: Add a "Disk" in Render settings with mount path `/opt/render/project/src/backend/uploads` to persist videos across redeploys.

### Frontend (Vercel)

1.  **Import Project** on [Vercel](https://vercel.com/new).
2.  Select the `frontend` folder as the **Root Directory** (or set it in project settings).
3.  **Framework Preset**: Vite.
4.  **Add Environment Variable**:
    - `VITE_API_URL` (Your Render URL, e.g., `https://backend.onrender.com`)

---

## License

MIT
