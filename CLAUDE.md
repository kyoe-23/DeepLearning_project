# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack user authentication, board system, and AI skin analysis with Node.js/Express backend and vanilla JavaScript frontend. JWT-based authentication with middleware (signup, login, logout, account deletion, profile management), free board with post CRUD, comments, likes, search, and AI-powered skin analysis with image upload and surveys.

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
- `/profile.html` - User profile (login required)
- `/ai-analysis.html` - AI skin analysis (login required)
- `/ai-result.html?id=1` - AI analysis result (login required)
- `/post-detail.html?id=1` - Post detail
- `/post-write.html` - Create post (`?id=1` for edit mode)

## Architecture

### Backend Structure
```
backend/src/
├── server.js          # Express entry point, serves frontend/src/ as static files
├── middleware/
│   ├── auth.js       # JWT authentication middleware
│   └── rateLimiter.js # Rate limiting middleware
├── routes/
│   ├── auth.js       # Auth endpoints: /api/auth/*
│   ├── board.js      # Board endpoints: /api/board/*
│   └── ai.js         # AI analysis endpoints: /api/ai/*
└── uploads/          # Uploaded images storage
```

**Critical**: `dotenv` must be loaded FIRST in [server.js:1-3](backend/src/server.js#L1-L3) before any other imports, otherwise JWT_SECRET won't be available.

### Authentication Flow
1. **In-memory storage**: `users` array in [auth.js](backend/src/routes/auth.js) - data clears on server restart
2. **Password hashing**: bcryptjs with 10 salt rounds
3. **JWT generation**: Uses `JWT_SECRET` and `JWT_EXPIRE` from `backend/.env`
4. **Token storage**: Browser localStorage (`token` and `user` keys)
5. **JWT Middleware**: Implemented in [middleware/auth.js](backend/src/middleware/auth.js) - protects board and AI endpoints
6. **Rate Limiting**: Implemented in [middleware/rateLimiter.js](backend/src/middleware/rateLimiter.js)

### Board System Architecture
**Data structures** (all in-memory):
- Posts: Array in [board.js:7-8](backend/src/routes/board.js#L7-L8)
- Comments: Object mapping `{postId: [comments]}` ([board.js:11](backend/src/routes/board.js#L11))
- Likes: Object mapping `{postId: Set(userIds)}` ([board.js:14](backend/src/routes/board.js#L14))

**Authorization**: JWT-based authentication via middleware - `req.user.userId` extracted from token

### AI Analysis System Architecture
**Data structures** (all in-memory):
- Survey Questions: Array in [ai.js](backend/src/routes/ai.js) - dynamic management (CRUD)
- Surveys: Array storing submitted surveys
- Analyses: Array storing AI analysis results
- Images: Stored in `backend/uploads/` folder

**Flow**:
1. User uploads image (multer middleware)
2. User completes survey based on dynamic questions
3. AI analysis generated (currently rule-based, ready for real AI model integration)
4. Results stored and displayed with visual charts

### Frontend Architecture
- **Vanilla JS** - No framework, uses Fetch API for all requests
- **Shared pattern**: Each page has `apiRequest()` helper returning JSON with `{success, message, data/errors}`
- **Login state**: Managed via localStorage; redirects happen client-side
- **Auto-redirect**: Login/signup pages check localStorage and redirect to `/board.html` if logged in

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Body/Params | Notes |
|--------|------|------|-------|
| POST | `/signup` | `{email, password, name}` | Email validated, password min 6 chars, returns JWT |
| POST | `/login` | `{email, password}` | Returns JWT on success |
| POST | `/logout` | - | Client-side only (JWT is stateless) |
| DELETE | `/delete` | `{email, password}` | Password re-confirmation required |
| GET | `/profile` | `?userId=1` | Returns user profile (email, name, createdAt) |
| PUT | `/profile` | `{userId, name?, currentPassword?, newPassword?}` | Update name and/or password |
| GET | `/my-posts` | `?userId=1` | Returns all posts by user |
| GET | `/my-comments` | `?userId=1` | Returns all comments by user with post titles |
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

### AI Analysis (`/api/ai`)
| Method | Path | Body/Params | Auth | Notes |
|--------|------|------|------|-------|
| POST | `/image-upload` | `multipart/form-data (image)` | Required | Max 5MB, JPG/PNG only |
| POST | `/survey` | `{imageFilename, answers}` | Required | Triggers AI analysis |
| GET | `/survey/questions` | - | Optional | Returns dynamic question list |
| POST | `/survey/questions` | `{question, type, options, required}` | Required | Admin: add question |
| PUT | `/survey/questions/:id` | `{question?, type?, options?, required?}` | Required | Admin: update question |
| DELETE | `/survey/questions/:id` | - | Required | Admin: delete question |
| GET | `/analysis/:id` | - | Required | Own analysis only |
| GET | `/my-analyses` | - | Required | User's analysis history |

## Environment Setup

**Required in `backend/.env`** (create manually):
- `JWT_SECRET` - Must be secure random string, minimum 32 characters
- `JWT_EXPIRE` - Token expiration (e.g., "24h", "7d")

**Note**: `.env.example` template does not exist in the project yet.

## Key Patterns & Constraints

### Validation
- Uses `express-validator` middleware on all POST/PUT/DELETE routes
- GET routes with query parameters validate manually in handler
- Validation errors returned as array in `errors` field

### View Count Side Effect
**Important**: `GET /api/board/free/posts/:id` increments `post.views` ([board.js:106](backend/src/routes/board.js#L106)) - calling it repeatedly increases count

### ID Generation
- User IDs: `users.length + 1` ([auth.js:55](backend/src/routes/auth.js#L55)) - **breaks on deletion**
- Post IDs: Global counter `postIdCounter++` ([board.js:66](backend/src/routes/board.js#L66))
- Comment IDs: Per-post counter `comments[postId].length + 1` ([board.js:332](backend/src/routes/board.js#L332)) - **breaks on deletion**

### Cascade Deletion
Post deletion removes associated comments and likes ([board.js:223-224](backend/src/routes/board.js#L223-L224))

### Data Sharing Between Modules
- `board.js` exports `posts` and `comments` arrays for access by `auth.js`
- `auth.js` dynamically loads board data via `getBoardData()` to avoid circular dependencies
- Used for profile features: "my posts" and "my comments"

### Security Features
- **JWT Authentication**: All Board and AI endpoints protected via `authenticateToken` middleware
- **Rate Limiting**:
  - General API: 100 requests/minute
  - Auth endpoints (login/signup): 5 requests/15 minutes
  - Post creation: 3 requests/minute
- **File Upload**:
  - Max size: 5MB
  - Allowed types: JPG, PNG only
  - Stored in `backend/uploads/`

### Search Feature
- Board posts searchable by title, content, and author name
- Case-insensitive search
- GET `/api/board/free/posts?search=keyword`

## Known Issues & Limitations

1. **In-memory storage** - All data lost on server restart (users, posts, surveys, analyses)
2. **ID collision risk** - User/comment IDs reuse after deletion
3. **No pagination** - All posts/comments fetched at once
4. **AI Analysis** - Currently rule-based, ready for real AI model integration
5. **No admin role** - Survey question management lacks role-based access control
6. **File storage** - Images stored locally, not cloud storage
