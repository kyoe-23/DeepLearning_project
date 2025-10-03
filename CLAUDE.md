# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack user authentication and board system with Node.js/Express backend and vanilla JavaScript frontend. JWT-based authentication (signup, login, logout, account deletion) and free board with post CRUD, comments, and likes.

## Development Commands

### Setup
```bash
# Install backend dependencies (from project root)
npm run install:backend
# OR: cd backend && npm install

# ⚠️ IMPORTANT: .env.example does not exist yet - create .env manually
# Create backend/.env with:
JWT_SECRET=your-very-secure-random-string-here-minimum-32-characters
JWT_EXPIRE=24h
```

### Running
```bash
# From project root
npm start

# Or from backend directory
cd backend && npm start
```

Server runs on `http://localhost:3000` serving both API and static frontend files.

### Quick Testing
```bash
# Test server connectivity
curl http://localhost:3000/api/auth/test

# View all users (dev only)
curl http://localhost:3000/api/auth/users

# View all posts
curl http://localhost:3000/api/board/free/posts
```

### Frontend Pages
- `/` - Login (redirects to board if logged in)
- `/signup.html` - Signup
- `/board.html` - Board main page (login required)
- `/post-detail.html?id=1` - Post detail
- `/post-write.html` - Create post (`?id=1` for edit mode)

## Architecture

### Backend Structure
```
backend/src/
├── server.js          # Express entry point, serves frontend/src/ as static files
├── routes/
│   ├── auth.js       # Auth endpoints: /api/auth/*
│   └── board.js      # Board endpoints: /api/board/*
```

**Critical**: `dotenv` must be loaded FIRST in [server.js:1-3](backend/src/server.js#L1-L3) before any other imports, otherwise JWT_SECRET won't be available.

### Authentication Flow
1. **In-memory storage**: `users` array in [auth.js:9](backend/src/routes/auth.js#L9) - data clears on server restart
2. **Password hashing**: bcryptjs with 10 salt rounds ([auth.js:50-51](backend/src/routes/auth.js#L50-L51))
3. **JWT generation**: Uses `JWT_SECRET` and `JWT_EXPIRE` from `backend/.env` ([auth.js:12-18](backend/src/routes/auth.js#L12-L18))
4. **Token storage**: Browser localStorage (`token` and `user` keys)
5. **⚠️ Missing**: JWT auth middleware not implemented yet ([auth.js:164](backend/src/routes/auth.js#L164)) - all board endpoints unprotected

### Board System Architecture
**Data structures** (all in-memory):
- Posts: Array in [board.js:7-8](backend/src/routes/board.js#L7-L8)
- Comments: Object mapping `{postId: [comments]}` ([board.js:11](backend/src/routes/board.js#L11))
- Likes: Object mapping `{postId: Set(userIds)}` ([board.js:14](backend/src/routes/board.js#L14))

**Authorization**: Request body `authorId` compared against stored data - no JWT verification yet

### Frontend Architecture
- **Vanilla JS** - No framework, uses Fetch API for all requests
- **Shared pattern**: Each page has `apiRequest()` helper returning JSON with `{success, message, data/errors}`
- **Login state**: Managed via localStorage; redirects happen client-side
- **Auto-redirect**: Login/signup pages check localStorage and redirect to `/board.html` if logged in

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/signup` | `{email, password, name}` | Email validated, password min 6 chars, returns JWT |
| POST | `/login` | `{email, password}` | Returns JWT on success |
| POST | `/logout` | - | Client-side only (JWT is stateless) |
| DELETE | `/delete` | `{email, password}` | Password re-confirmation required |
| GET | `/me` | - | Placeholder (needs auth middleware) |
| GET | `/users` | - | Dev only, returns users without passwords |
| GET | `/test` | - | Connectivity test |

### Board (`/api/board/free`)
| Method | Path | Body | Auth |
|--------|------|------|------|
| GET | `/posts` | - | None (should require auth) |
| POST | `/posts` | `{title, content, authorId, authorName}` | None (should verify JWT) |
| GET | `/posts/:id` | - | None, increments view count |
| PUT | `/posts/:id` | `{title, content, authorId}` | Checks `authorId` match only |
| DELETE | `/posts/:id` | `{authorId}` | Checks `authorId` match only |
| POST | `/posts/:id/like` | `{userId}` | One like per user |
| POST | `/posts/:id/comments` | `{content, authorId, authorName}` | None |
| DELETE | `/posts/:postId/comments/:commentId` | `{authorId}` | Checks `authorId` match only |

**Response format**: All endpoints return `{success: boolean, message: string, data?: any, errors?: array}`

## Environment Setup

**Required in `backend/.env`** (create manually):
- `JWT_SECRET` - Must be secure random string, minimum 32 characters
- `JWT_EXPIRE` - Token expiration (e.g., "24h", "7d")

**Note**: `.env.example` template does not exist in the project yet.

## Key Patterns & Constraints

### Validation
- Uses `express-validator` middleware on all POST/PUT/DELETE routes
- Validation errors returned as array in `errors` field

### View Count Side Effect
**Important**: `GET /api/board/free/posts/:id` increments `post.views` ([board.js:106](backend/src/routes/board.js#L106)) - calling it repeatedly increases count

### ID Generation
- User IDs: `users.length + 1` ([auth.js:55](backend/src/routes/auth.js#L55)) - **breaks on deletion**
- Post IDs: Global counter `postIdCounter++` ([board.js:66](backend/src/routes/board.js#L66))
- Comment IDs: Per-post counter `comments[postId].length + 1` ([board.js:332](backend/src/routes/board.js#L332)) - **breaks on deletion**

### Cascade Deletion
Post deletion removes associated comments and likes ([board.js:223-224](backend/src/routes/board.js#L223-L224))

## Known Issues & Limitations

1. **No JWT verification** - Board endpoints check `authorId` in request body, easily spoofed
2. **In-memory storage** - All data lost on server restart
3. **ID collision risk** - User/comment IDs reuse after deletion
4. **No pagination** - All posts/comments fetched at once
5. **Duplicate like prevention** - Uses Set but no user verification
6. **No rate limiting** - Vulnerable to abuse
