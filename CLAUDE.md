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

---

## Clean Code 규칙 (Clean Code Guidelines)

클린 코딩 원칙은 소프트웨어 개발의 근본적인 가이드라인으로, 가독성, 유지보수성, 확장성을 보장하는 중요한 역할을 합니다. 본 프로젝트에서는 다음 원칙들을 준수하여 고품질의 소프트웨어를 개발합니다.

---
### 0. 언어 사용 규칙 (Language Conventions)

**IMPORTANT**: 본 프로젝트는 **한국어-영어 하이브리드 코딩** 규칙을 따릅니다.

| 요소 | 언어 | 예시 |
|------|------|------|
| 변수명/함수명/클래스명 | 영어 (camelCase) | `calculateTotal`, `UserService` |
| 코드 주석 | 한국어 | `// 사용자 인증 처리` |
| JSDoc 주석 | 한국어 | `@param {string} email - 사용자 이메일` |

**이유:**
- **코드 식별자는 영어**: 국제 표준 준수, 외부 라이브러리와 일관성
- **주석/메시지는 한국어**: 한국인 개발팀의 이해도 향상, 빠른 협업

**예시**:
```javascript
// Good - 영어 식별자 + 한국어 주석
const calculateTotal = (items) => {
  // 모든 아이템의 가격을 합산합니다
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Bad - 한글 식별자 (금지)
const 합계계산 = (항목들) => {
  // Calculate total price
  return 항목들.reduce((합, 항목) => 합 + 항목.가격, 0);
};

// Bad - 영어 주석 (금지)
const calculateTotal = (items) => {
  // Calculate the sum of all item prices
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

---

### 1. 하드코딩 금지 원칙 (No Hardcoding)

모든 설정 값, 상수, 메시지는 중앙화되어 관리되어야 하며, 코드 내에 직접 작성하지 않습니다.

#### 1.1 매직 넘버/문자열 사용 금지

숫자나 문자열을 직접 코드에 작성하지 않고 `constants.js`에 정의된 상수를 사용합니다.

```javascript
// Good
const code = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + constants.VERIFICATION_CODE_EXPIRY_MS);

if (password.length < constants.PASSWORD_MIN_LENGTH) {
  return res.status(400).json({ message: '비밀번호가 너무 짧습니다' });
}

// Bad - 매직 넘버
const code = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 300000);  // 300000이 무엇을 의미?

if (password.length < 8) {  // 8이 어디서 온 값?
  return res.status(400).json({ message: '비밀번호가 너무 짧습니다' });
}
```

#### 1.2 환경 변수 활용

모든 설정 값은 `.env` 파일에서 관리하고, `process.env`를 통해 접근합니다.

```javascript
// Good
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: constants.JWT_ACCESS_TOKEN_EXPIRY
});

// Bad - 하드코딩
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cemo_db',
  user: 'admin',
  password: 'password123'  // 절대 금지!
});

const token = jwt.sign(payload, 'my-secret-key-12345');  // 보안 취약
```

#### 1.3 HTTP 상태 코드 상수화

HTTP 상태 코드를 상수로 정의하여 가독성을 높입니다.

```javascript
// Good - constants.js에 정의
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500
};

// 사용
return res.status(HTTP_STATUS.UNAUTHORIZED).json({
  success: false,
  message: '인증이 필요합니다'
});

// Bad - 숫자 직접 사용
return res.status(401).json({
  success: false,
  message: '인증이 필요합니다'
});
```

#### 1.4 에러 메시지 상수화

반복되는 에러 메시지는 상수로 관리합니다.

```javascript
// Good - constants.js에 정의
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '사용자명/이메일 또는 비밀번호가 올바르지 않습니다',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다',
  EMAIL_IN_USE: '이미 사용중인 이메일입니다',
  USERNAME_IN_USE: '이미 사용중인 사용자명입니다',
  INVALID_TOKEN: '유효하지 않은 토큰입니다',
  TOKEN_EXPIRED: '토큰이 만료되었습니다'
};

// 사용
if (!user) {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: ERROR_MESSAGES.USER_NOT_FOUND
  });
}

// Bad - 메시지 중복
if (!user) {
  return res.status(404).json({
    success: false,
    message: '사용자를 찾을 수 없습니다'  // 여러 곳에서 반복
  });
}
```

---

### 2. SOLID 원칙 (클린 코딩의 5대 원칙)

#### 2.1 단일 책임 원칙 (SRP - Single Responsibility Principle)

**개념:** 하나의 클래스/함수는 하나의 책임만 가져야 한다.

**적용 방법:** 라우트 핸들러는 요청/응답 처리만 담당하고, 비즈니스 로직은 서비스 레이어로 분리합니다.

```javascript
// Good - 책임 분리
// services/userService.js
class UserService {
  async createUser({ email, username, password, name }) {
    const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (email, username, password, name, is_verified)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, username, name, user_type`,
      [email, username, hashedPassword, name]
    );

    return result.rows[0];
  }

  async findUserByEmail(email) {
    const result = await db.query(
      'SELECT id, email, username FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0];
  }
}

// routes/auth.js - 라우트는 얇게
router.post('/signup', [...validators], async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    const token = generateToken(user.id, user.user_type);

    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Bad - 모든 로직이 라우트에
router.post('/signup', async (req, res) => {
  try {
    // 검증
    if (!req.body.email) { /* ... */ }

    // 중복 체크
    const existing = await db.query(/* ... */);

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(/* ... */);

    // 사용자 생성
    const user = await db.query(/* ... */);

    // 토큰 생성
    const token = jwt.sign(/* ... */);

    // 이메일 발송
    await emailService.send(/* ... */);

    res.json({ user, token });
  } catch (error) { /* ... */ }
});
```

#### 2.2 개방-폐쇄 원칙 (OCP - Open-Closed Principle)

**개념:** 소프트웨어 엔티티는 확장에는 열려 있어야 하지만, 변경에는 닫혀 있어야 한다.

**적용 방법:** 미들웨어 패턴을 사용하여 새로운 기능을 추가할 때 기존 코드를 수정하지 않습니다.

```javascript
// Good - 확장 가능한 구조
// middleware/auth.js
const authMiddleware = (req, res, next) => {
  // JWT 검증 로직
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: '관리자 권한 필요' });
  }
  next();
};

const expertOnly = (req, res, next) => {
  if (req.user.userType !== 'expert') {
    return res.status(403).json({ message: '전문가 권한 필요' });
  }
  next();
};

// 새로운 권한이 필요하면 새 미들웨어 추가 (기존 코드 수정 없음)
const premiumUserOnly = (req, res, next) => {
  if (!req.user.isPremium) {
    return res.status(403).json({ message: '프리미엄 권한 필요' });
  }
  next();
};

// 사용 - 미들웨어 조합
router.get('/admin/users', authMiddleware, adminOnly, getUsers);
router.post('/expert/apply', authMiddleware, expertOnly, applyExpert);
router.get('/premium/feature', authMiddleware, premiumUserOnly, getPremiumFeature);

// Bad - 하나의 미들웨어에 모든 로직
const authMiddleware = (req, res, next) => {
  // JWT 검증

  // 권한 체크 - 새 권한 추가 시 이 코드를 계속 수정해야 함
  if (req.path.includes('/admin') && req.user.userType !== 'admin') {
    return res.status(403).json({ message: '권한 없음' });
  }

  if (req.path.includes('/expert') && req.user.userType !== 'expert') {
    return res.status(403).json({ message: '권한 없음' });
  }

  // 계속 추가...
  next();
};
```

#### 2.3 리스코프 치환 원칙 (LSP - Liskov Substitution Principle)

**개념:** 하위 클래스는 상위 클래스를 대체할 수 있어야 한다.

**적용 방법:** 상속 관계에서 자식 클래스가 부모 클래스의 역할을 충분히 수행하도록 설계합니다.

```javascript
// Good - 일관된 인터페이스
class DatabaseClient {
  async query(text, params) {
    throw new Error('query() must be implemented');
  }

  async getClient() {
    throw new Error('getClient() must be implemented');
  }
}

class PostgresClient extends DatabaseClient {
  async query(text, params) {
    return await this.pool.query(text, params);
  }

  async getClient() {
    return await this.pool.connect();
  }
}

class MySQLClient extends DatabaseClient {
  async query(text, params) {
    // MySQL 파라미터 형식으로 변환
    const mysqlQuery = text.replace(/\$(\d+)/g, '?');
    return await this.connection.query(mysqlQuery, params);
  }

  async getClient() {
    return await this.connection.getConnection();
  }
}

// 사용 - 어떤 구현체든 동일하게 사용 가능
const db = new PostgresClient();  // 또는 new MySQLClient()
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

#### 2.4 인터페이스 분리 원칙 (ISP - Interface Segregation Principle)

**개념:** 인터페이스는 클라이언트가 필요로 하는 것들만 제공해야 한다.

**적용 방법:** 큰 라우터를 작고 구체적인 여러 개의 라우터로 분리합니다.

```javascript
// Good - 관심사별로 라우터 분리
// routes/auth.js - 인증 관련만
router.post('/signup', signupHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.post('/refresh-token', refreshTokenHandler);

// routes/profile.js - 프로필 관련만
router.get('/profile', getProfileHandler);
router.put('/profile', updateProfileHandler);
router.post('/profile/avatar', uploadAvatarHandler);

// routes/expert.js - 전문가 인증 관련만
router.post('/expert/apply', applyExpertHandler);
router.get('/expert/status', getExpertStatusHandler);
router.get('/expert/list', getExpertListHandler);

// server.js - 필요한 라우터만 조합
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/expert', expertRoutes);

// Bad - 모든 기능이 하나의 라우터에
// routes/user.js
router.post('/user/signup', signupHandler);
router.post('/user/login', loginHandler);
router.get('/user/profile', getProfileHandler);
router.put('/user/profile', updateProfileHandler);
router.post('/user/expert-apply', applyExpertHandler);
router.get('/user/expert-status', getExpertStatusHandler);
// 계속 추가... (관련 없는 기능들이 섞임)
```

#### 2.5 의존성 역전 원칙 (DIP - Dependency Inversion Principle)

**개념:** 고수준 모듈은 저수준 모듈에 의존하지 않고, 추상화에 의존해야 한다.

**적용 방법:** 의존성 주입 패턴을 통해 클래스 간의 결합도를 낮춥니다.

```javascript
// Good - 의존성 주입
const verifyUser = async (userId, dbClient = db) => {
  const result = await dbClient.query(
    'UPDATE users SET is_verified = true WHERE id = $1 RETURNING *',
    [userId]
  );
  return result.rows[0];
};

const sendWelcomeEmail = async (user, emailService = defaultEmailService) => {
  await emailService.send({
    to: user.email,
    subject: '가입을 환영합니다',
    template: 'welcome'
  });
};

// 테스트에서 mock 사용 가능
const mockDb = {
  query: jest.fn().mockResolvedValue({ rows: [{ id: 1, is_verified: true }] })
};
await verifyUser(123, mockDb);

// Bad - 직접 의존
const verifyUser = async (userId) => {
  // db에 직접 의존 - 테스트 어려움
  const result = await db.query(
    'UPDATE users SET is_verified = true WHERE id = $1 RETURNING *',
    [userId]
  );
  return result.rows[0];
};
```

---

### 3. 함수 작성 원칙 (작고 명확한 함수)

#### 3.1 함수는 하나의 작업만 수행

단일 책임 원칙을 함수 레벨에 적용합니다. 복잡한 함수는 작은 함수로 분리합니다.

```javascript
// Good - 각 함수가 하나의 작업만
const validateVerificationCode = async (client, email, code, type) => {
  const result = await client.query(
    `SELECT id, expires_at, is_used, attempts, max_attempts
     FROM verification_codes
     WHERE email = $1 AND code = $2 AND type = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code, type]
  );

  if (result.rows.length === 0) {
    throw new Error('잘못된 인증 코드입니다');
  }

  return result.rows[0];
};

const checkCodeExpiry = (verification) => {
  if (verification.is_used) {
    throw new Error('이미 사용된 인증 코드입니다');
  }

  if (new Date() > new Date(verification.expires_at)) {
    throw new Error('만료된 인증 코드입니다');
  }
};

const markCodeAsUsed = async (client, verificationId) => {
  await client.query(
    'UPDATE verification_codes SET is_used = true, used_at = NOW() WHERE id = $1',
    [verificationId]
  );
};

// 라우트에서 조합
router.post('/verify-code', async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const verification = await validateVerificationCode(client, email, code, type);
    checkCodeExpiry(verification);
    await markCodeAsUsed(client, verification.id);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    handleError(res, error);
  } finally {
    client.release();
  }
});

// Bad - 하나의 함수가 여러 작업 수행
const verifyCodeAndCreateUser = async (email, code, username, password) => {
  // 1. 코드 검증
  const verification = await db.query(/* ... */);

  if (!verification) throw new Error('잘못된 코드');
  if (verification.is_used) throw new Error('사용됨');
  if (new Date() > verification.expires_at) throw new Error('만료됨');

  // 2. 코드 사용 처리
  await db.query('UPDATE verification_codes SET is_used = true WHERE id = $1', [verification.id]);

  // 3. 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. 사용자 생성
  const user = await db.query('INSERT INTO users ...', [email, username, hashedPassword]);

  // 5. 토큰 생성
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

  return { user, token };
};
```

#### 3.2 함수 크기 제한

읽기 쉬운 크기로 함수를 유지합니다.

**권장 크기:**
- 라우트 핸들러: 최대 80줄
- 헬퍼 함수: 최대 30줄
- 유틸리티 함수: 최대 20줄

```javascript
// Good - 적절한 크기
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const calculateExpiryDate = (expiryMs = constants.VERIFICATION_CODE_EXPIRY_MS) => {
  return new Date(Date.now() + expiryMs);
};

// Bad - 너무 긴 함수 (150줄 이상)
router.post('/signup', async (req, res) => {
  // 검증 로직 30줄
  // 중복 체크 로직 20줄
  // 비밀번호 처리 15줄
  // 사용자 생성 25줄
  // 프로필 생성 20줄
  // 이메일 발송 20줄
  // 토큰 생성 10줄
  // 응답 처리 10줄
  // ... 너무 길어서 스크롤 필요
});
```

#### 3.3 명확하고 간결한 네이밍

> **언어 규칙**: 모든 변수명, 함수명, 클래스명은 **영어로 작성**합니다. ([0. 언어 사용 규칙](#0-언어-사용-규칙-language-conventions) 참조)

함수명은 기능과 목적을 정확히 반영해야 합니다.

```javascript
// Good - 명확한 함수명
const calculateTotal = (items) => items.reduce((sum, item) => sum + item.price, 0);
const isEmailVerified = (user) => user.is_verified === true;
const sendPasswordResetEmail = async (email, resetToken) => { /* ... */ };
const getUsersByRole = async (role) => { /* ... */ };
const validatePhoneNumber = (phone) => constants.PHONE_REGEX.test(phone);

// Bad - 불명확한 함수명
const calc = (items) => items.reduce((sum, item) => sum + item.price, 0);  // 무엇을 계산?
const check = (user) => user.is_verified === true;  // 무엇을 체크?
const send = async (email, token) => { /* ... */ };  // 무엇을 전송?
const get = async (role) => { /* ... */ };  // 무엇을 가져오기?
const validate = (phone) => /^[0-9]{10,11}$/.test(phone);  // 무엇을 검증?
```

#### 3.4 파라미터 개수 제한

함수 파라미터는 최대 3개를 권장하며, 4개 이상이면 객체로 전달합니다.

```javascript
// Good - 객체로 파라미터 전달
const createUser = async ({ email, username, password, name, userType = 'user' }) => {
  const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);

  const result = await db.query(
    `INSERT INTO users (email, username, password, name, user_type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, username, hashedPassword, name, userType]
  );

  return result.rows[0];
};

// 사용 - 파라미터 순서 신경 쓸 필요 없음
await createUser({
  email: 'user@example.com',
  username: 'user123',
  password: 'password',
  name: '홍길동'
});

// Bad - 파라미터가 너무 많음
const createUser = async (email, username, password, name, userType, phone, avatarUrl, isVerified) => {
  // 파라미터 순서를 기억해야 함
  // 일부 파라미터를 생략하기 어려움
};

// 사용 - 순서 헷갈림, null 전달 필요
await createUser('user@example.com', 'user123', 'password', '홍길동', 'user', null, null, false);
```

#### 3.5 Early Return 패턴

조건 검증은 먼저 처리하고 early return하여 중첩을 줄입니다.

```javascript
// Good - Early Return
const processPayment = async (userId, amount) => {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다');
  }

  if (amount <= 0) {
    throw new Error('결제 금액은 0보다 커야 합니다');
  }

  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

  if (!user.rows[0]) {
    throw new Error('사용자를 찾을 수 없습니다');
  }

  if (user.rows[0].balance < amount) {
    throw new Error('잔액이 부족합니다');
  }

  // 실제 결제 로직
  return await executePayment(user.rows[0], amount);
};

// Bad - 중첩된 if문
const processPayment = async (userId, amount) => {
  if (userId) {
    if (amount > 0) {
      const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

      if (user.rows[0]) {
        if (user.rows[0].balance >= amount) {
          // 실제 결제 로직 (너무 깊이 중첩됨)
          return await executePayment(user.rows[0], amount);
        } else {
          throw new Error('잔액 부족');
        }
      } else {
        throw new Error('사용자 없음');
      }
    } else {
      throw new Error('금액 오류');
    }
  } else {
    throw new Error('ID 필요');
  }
};
```

---

### 4. 중복 제거 원칙 (DRY - Don't Repeat Yourself)

#### 4.1 중복 코드를 피하라

같은 코드를 반복해서 작성하지 말고, 공통 로직은 함수나 서비스로 분리합니다.

```javascript
// Good - 공통 로직 추출
const checkDuplicateEmail = async (email, excludeUserId = null) => {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL'
    : 'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL';

  const params = excludeUserId ? [email, excludeUserId] : [email];
  const result = await db.query(query, params);

  if (result.rows.length > 0) {
    throw new Error(ERROR_MESSAGES.EMAIL_IN_USE);
  }
};

const checkDuplicateUsername = async (username, excludeUserId = null) => {
  const query = excludeUserId
    ? 'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2 AND deleted_at IS NULL'
    : 'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL';

  const params = excludeUserId ? [username, excludeUserId] : [username];
  const result = await db.query(query, params);

  if (result.rows.length > 0) {
    throw new Error(ERROR_MESSAGES.USERNAME_IN_USE);
  }
};

// 사용 - 여러 곳에서 재사용
router.post('/signup', async (req, res) => {
  await checkDuplicateEmail(req.body.email);
  await checkDuplicateUsername(req.body.username);
  // 사용자 생성...
});

router.put('/profile', async (req, res) => {
  if (req.body.email) {
    await checkDuplicateEmail(req.body.email, req.user.userId);
  }
  if (req.body.username) {
    await checkDuplicateUsername(req.body.username, req.user.userId);
  }
  // 프로필 업데이트...
});

// Bad - 중복 코드
router.post('/signup', async (req, res) => {
  // 이메일 중복 체크
  const existingEmail = await db.query(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [req.body.email]
  );
  if (existingEmail.rows.length > 0) {
    return res.status(400).json({ message: '이미 사용중인 이메일입니다' });
  }

  // 사용자명 중복 체크
  const existingUsername = await db.query(
    'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL',
    [req.body.username]
  );
  if (existingUsername.rows.length > 0) {
    return res.status(400).json({ message: '이미 사용중인 사용자명입니다' });
  }
});

router.put('/profile', async (req, res) => {
  // 동일한 코드 반복 (중복!)
  if (req.body.email) {
    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL',
      [req.body.email, req.user.userId]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: '이미 사용중인 이메일입니다' });
    }
  }

  if (req.body.username) {
    const existingUsername = await db.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2 AND deleted_at IS NULL',
      [req.body.username, req.user.userId]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ message: '이미 사용중인 사용자명입니다' });
    }
  }
});
```

#### 4.2 재사용 가능한 유틸리티 작성

자주 사용되는 로직은 유틸리티 함수로 만들어 재사용합니다.

```javascript
// Good - utils/responseHelper.js
const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development' && errors) {
    response.error = errors.message;
  }

  return res.status(statusCode).json(response);
};

// 사용 - 일관된 응답 형식
router.get('/users/:id', async (req, res) => {
  const user = await findUserById(req.params.id);

  if (!user) {
    return sendError(res, ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return sendSuccess(res, { user });
});
```

#### 4.3 서비스 레이어 활용

비즈니스 로직을 서비스로 분리하여 재사용성을 높입니다.

```javascript
// Good - services/authService.js
class AuthService {
  async validateCredentials(identifier, password) {
    const isEmail = constants.EMAIL_REGEX.test(identifier);
    const query = isEmail
      ? 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL'
      : 'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND deleted_at IS NULL';

    const result = await db.query(query, [identifier]);

    if (result.rows.length === 0) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    return user;
  }

  generateTokens(userId, userType) {
    const accessToken = jwt.sign(
      { userId, userType },
      process.env.JWT_SECRET,
      { expiresIn: constants.JWT_ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: constants.JWT_REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();

// routes/auth.js - 서비스 재사용
router.post('/login', async (req, res) => {
  try {
    const user = await authService.validateCredentials(
      req.body.identifier,
      req.body.password
    );

    const tokens = authService.generateTokens(user.id, user.user_type);

    return sendSuccess(res, { user, tokens });
  } catch (error) {
    return sendError(res, error.message, HTTP_STATUS.UNAUTHORIZED);
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    // 리프레시 토큰 검증 후
    const tokens = authService.generateTokens(userId, userType);  // 재사용!

    return sendSuccess(res, { tokens });
  } catch (error) {
    return sendError(res, error.message, HTTP_STATUS.UNAUTHORIZED);
  }
});
```

---

### 5. 에러 핸들링 (Error Handling)

#### 5.1 일관된 에러 응답 형식

모든 API는 동일한 에러 응답 구조를 반환해야 합니다.

```javascript
// Good - 일관된 형식
{
  "success": false,
  "message": "사용자를 찾을 수 없습니다",
  "errors": [  // 선택적
    {
      "field": "email",
      "message": "유효한 이메일을 입력해주세요"
    }
  ],
  "error": "Detailed error for development"  // 개발 환경에서만
}

// 에러 핸들러 유틸리티
const handleError = (res, error, statusCode = 500) => {
  console.error('[ERROR]', error);

  return res.status(statusCode).json({
    success: false,
    message: error.message || '서버 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Bad - 일관성 없는 형식
// 에러 1
{ "error": "User not found" }

// 에러 2
{ "message": "오류 발생", "code": 400 }

// 에러 3
{ "success": false, "msg": "에러", "data": null }
```

#### 5.2 트랜잭션 에러 처리

트랜잭션을 사용할 때는 반드시 try-catch-finally 패턴을 사용합니다.

```javascript
// Good - 완전한 트랜잭션 패턴
router.post('/signup', async (req, res) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. 인증 코드 사용 처리
    await client.query(
      'UPDATE verification_codes SET is_used = true, used_at = NOW() WHERE id = $1',
      [verificationId]
    );

    // 2. 사용자 생성
    const userResult = await client.query(
      'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, username, hashedPassword, name]
    );

    // 3. 알림 설정 초기화
    await client.query(
      'INSERT INTO notification_settings (user_id) VALUES ($1)',
      [userResult.rows[0].id]
    );

    await client.query('COMMIT');

    return sendSuccess(res, { user: userResult.rows[0] }, HTTP_STATUS.CREATED);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[ERROR] 회원가입 실패:', error);
    return handleError(res, error, HTTP_STATUS.INTERNAL_ERROR);

  } finally {
    client.release();  // 반드시 연결 해제
  }
});

// Bad - 불완전한 에러 처리
router.post('/signup', async (req, res) => {
  const client = await db.getClient();

  await client.query('BEGIN');

  // 에러 발생 시 ROLLBACK 없음
  const user = await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO notification_settings ...');

  await client.query('COMMIT');

  // client.release() 누락 - 연결 누수!
  res.json({ user });
});
```

#### 5.3 로깅 규칙

일관된 로깅 형식을 사용하여 디버깅을 용이하게 합니다.

```javascript
// Good - 일관된 로깅
console.log('[INFO] 서버 시작:', { port: PORT, env: process.env.NODE_ENV });
console.log('[INFO] 사용자 로그인 성공:', { userId: user.id, username: user.username });

console.warn('[WARNING] JWT_REFRESH_SECRET이 설정되지 않았습니다. JWT_SECRET을 사용합니다.');

console.error('[ERROR] 데이터베이스 연결 실패:', error.message);
console.error('[ERROR] 이메일 발송 실패:', { email, error: error.message });

// 개발 환경에서만 쿼리 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('[QUERY] 쿼리 실행:', {
    text: query.substring(0, 100),
    duration: `${duration}ms`,
    rows: result.rowCount
  });
}

// Bad - 불일치한 로깅
console.log('Server started');  // 접두사 없음
console.log('Login:', user);  // 민감 정보 포함 가능
console.error(error);  // 상세 정보 없음
```

#### 5.4 민감 정보 로깅 금지

비밀번호, 토큰 등 민감한 정보는 절대 로깅하지 않습니다.

```javascript
// Good - 민감 정보 제외
const { password, ...userWithoutPassword } = user;
console.log('[INFO] 사용자 생성:', userWithoutPassword);

console.log('[INFO] 토큰 갱신:', { userId: user.id });  // 토큰 자체는 로깅 안 함

// Bad - 민감 정보 로깅
console.log('[INFO] 사용자 생성:', user);  // password 필드 포함!
console.log('[INFO] 로그인 성공:', { user, token });  // JWT 토큰 노출!
console.log('[INFO] 비밀번호 확인:', { input: password, stored: user.password });  // 절대 금지!
```

---

### 6. Express.js 라우트 패턴

#### 6.1 미들웨어 체이닝 순서

미들웨어는 인증 → 검증 → 비즈니스 로직 순서로 체이닝합니다.

```javascript
// Good - 올바른 순서
router.put('/profile', [
  authMiddleware,  // 1. 인증 확인
  body('name').optional().trim().isLength({ min: 2, max: 50 }),  // 2. 입력 검증
  body('phone').optional().matches(constants.PHONE_REGEX),
  validateUsername  // 3. 추가 검증
], async (req, res) => {
  // 4. 비즈니스 로직
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, '입력값 검증 실패', HTTP_STATUS.BAD_REQUEST, errors.array());
  }

  // 프로필 업데이트 로직...
});

// Bad - 순서가 뒤죽박죽
router.put('/profile', [
  body('name').optional().trim(),  // 검증이 먼저
  async (req, res) => {
    // 핸들러에서 인증 체크 (미들웨어로 해야 함)
    if (!req.user) {
      return res.status(401).json({ message: '인증 필요' });
    }

    // 비즈니스 로직...
  }
]);
```

#### 6.2 검증과 비즈니스 로직 분리

express-validator를 사용하여 검증 로직을 미들웨어로 분리합니다.

```javascript
// Good - 검증 미들웨어 분리
const signupValidation = [
  body('email')
    .isEmail().withMessage('유효한 이메일을 입력해주세요')
    .normalizeEmail(),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('사용자명은 3-20자여야 합니다')
    .matches(constants.USERNAME_REGEX).withMessage('사용자명은 영문, 숫자, 밑줄만 가능합니다'),
  body('password')
    .isLength({ min: 8 }).withMessage('비밀번호는 최소 8자 이상이어야 합니다'),
  body('name')
    .trim()
    .notEmpty().withMessage('이름을 입력해주세요')
];

router.post('/signup', signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, '입력값 검증 실패', HTTP_STATUS.BAD_REQUEST, errors.array());
  }

  // 비즈니스 로직만 집중
  try {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, { user }, HTTP_STATUS.CREATED);
  } catch (error) {
    return handleError(res, error);
  }
});

// Bad - 검증과 로직이 섞임
router.post('/signup', async (req, res) => {
  // 수동 검증
  if (!req.body.email || !req.body.email.includes('@')) {
    return res.status(400).json({ message: '유효한 이메일을 입력해주세요' });
  }

  if (!req.body.username || req.body.username.length < 3) {
    return res.status(400).json({ message: '사용자명은 3자 이상이어야 합니다' });
  }

  // 비즈니스 로직
  const user = await userService.createUser(req.body);
  res.json({ user });
});
```

#### 6.3 RESTful 라우트 구조

라우트는 RESTful 원칙을 따르며, GET → POST → PUT → DELETE 순서로 정의합니다.

```javascript
// Good - RESTful 구조
// GET routes
router.get('/users', authMiddleware, adminOnly, listUsers);
router.get('/users/:id', authMiddleware, getUser);

// POST routes
router.post('/users', authMiddleware, adminOnly, createUser);

// PUT routes
router.put('/users/:id', authMiddleware, updateUser);

// DELETE routes
router.delete('/users/:id', authMiddleware, deleteUser);

// Bad - 순서 없이 섞여있음
router.post('/users', createUser);
router.get('/users/:id', getUser);
router.delete('/users/:id', deleteUser);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
```

---

### 7. 코드 구조 및 조직화

#### 7.1 파일 구조 일관성

모든 라우트 파일은 동일한 구조를 따릅니다.

```javascript
// 표준 파일 구조
// 1. 의존성 임포트
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const constants = require('../config/constants');

// 2. 라우터 생성
const router = express.Router();

// 3. 헬퍼 함수 정의
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: constants.JWT_ACCESS_TOKEN_EXPIRY }
  );
};

// 4. 검증 미들웨어 정의
const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

// 5. 라우트 정의 (GET → POST → PUT → DELETE)
router.get('/resource', getHandler);
router.post('/resource', postHandler);
router.put('/resource/:id', putHandler);
router.delete('/resource/:id', deleteHandler);

// 6. 모듈 익스포트
module.exports = router;
```

#### 7.2 서비스 레이어 분리

비즈니스 로직은 서비스 레이어로 분리하여 라우트를 얇게 유지합니다.

```javascript
// Good - 라우트는 얇게, 서비스는 두껍게

// services/userService.js
class UserService {
  async createUser({ email, username, password, name }) {
    // 비즈니스 로직
    const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (email, username, password, name, is_verified)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, username, name, user_type`,
      [email, username, hashedPassword, name]
    );

    return result.rows[0];
  }

  async updateUser(userId, updates) {
    // 동적 쿼리 빌드
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }

    if (updates.phone) {
      fields.push(`phone = $${paramCount}`);
      values.push(updates.phone);
      paramCount++;
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }
}

module.exports = new UserService();

// routes/profile.js - 라우트는 얇게
router.put('/profile', authMiddleware, profileValidation, async (req, res) => {
  try {
    const user = await userService.updateUser(req.user.userId, req.body);
    return sendSuccess(res, { user });
  } catch (error) {
    return handleError(res, error);
  }
});

// Bad - 모든 로직이 라우트에
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    // 비즈니스 로직이 라우트에 (서비스로 분리해야 함)
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (req.body.name) {
      fields.push(`name = $${paramCount}`);
      values.push(req.body.name);
      paramCount++;
    }

    // ... 더 많은 로직

    const result = await db.query(/* ... */);
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 7.3 상수 중앙 집중화

모든 설정 값과 상수는 `constants.js`에 중앙화합니다.

```javascript
// Good - constants.js
module.exports = {
  // 비밀번호 관련
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  PASSWORD_MIN_LENGTH: 8,

  // 인증 코드 관련
  VERIFICATION_CODE_LENGTH: 6,
  VERIFICATION_CODE_EXPIRY_MS: 5 * 60 * 1000,
  VERIFICATION_COOLDOWN_MS: 60 * 1000,

  // JWT 관련
  JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRE || '24h',
  JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRE || '7d',

  // HTTP 상태 코드
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  },

  // 에러 메시지
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: '사용자명/이메일 또는 비밀번호가 올바르지 않습니다',
    USER_NOT_FOUND: '사용자를 찾을 수 없습니다',
    EMAIL_IN_USE: '이미 사용중인 이메일입니다',
    USERNAME_IN_USE: '이미 사용중인 사용자명입니다'
  },

  // 정규식
  USERNAME_REGEX: /^[a-zA-Z0-9_]{3,20}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[0-9]{10,11}$/
};
```

---

### 8. 주석 작성 규칙 (의미 있는 주석)

#### 8.1 주석은 필요한 곳에만

> **언어 규칙**: 모든 주석은 **한국어로 작성**합니다. ([0. 언어 사용 규칙](#0-언어-사용-규칙-language-conventions) 참조)

코드로 충분히 설명 가능한 경우 주석이 필요 없습니다. 주석은 "왜"를 설명할 때만 사용합니다.

```javascript
// Good - 의미있는 주석
/**
 * 이메일 인증 코드를 생성하고 발송합니다.
 *
 * @param {string} email - 수신자 이메일 주소
 * @param {string} type - 인증 타입 (email_verification, password_reset, email_change)
 * @returns {Promise<{success: boolean, messageId: string}>}
 * @throws {Error} 이메일 발송 실패 시
 */
const sendVerificationCode = async (email, type) => {
  // 기존 미사용 코드 무효화 (중복 발송 방지)
  await invalidateOldCodes(email, type);

  const code = generateVerificationCode();

  // TODO: Redis로 코드 저장 이동 예정 (DB 부하 감소 목적)
  await saveCodeToDatabase(email, code, type);

  return await emailService.sendVerificationEmail(email, code);
};

// Bad - 불필요한 주석
// 사용자 이메일 가져오기
const email = user.email;  // 코드가 이미 명확함

// i를 1씩 증가
i++;  // 당연한 내용

// 함수 호출
const result = await db.query(query, params);  // 보면 알 수 있음
```

#### 8.2 JSDoc 형식 사용

공개 API 함수는 JSDoc 주석을 작성합니다.

```javascript
// Good - JSDoc 주석
/**
 * 사용자 인증 정보를 검증합니다.
 *
 * @param {string} identifier - 이메일 또는 사용자명
 * @param {string} password - 비밀번호 (평문)
 * @returns {Promise<Object>} 검증된 사용자 객체
 * @throws {Error} 인증 실패 시 에러 발생
 *
 * @example
 * const user = await validateCredentials('user@example.com', 'password123');
 * console.log(user.id, user.email);
 */
const validateCredentials = async (identifier, password) => {
  // 구현...
};
```

#### 8.3 TODO/FIXME 형식

임시 해결책이나 개선 사항은 일관된 태그를 사용합니다.

```javascript
// TODO: 캐싱 로직 추가 필요 (Redis 도입 후)
const getExpertList = async () => {
  return await db.query('SELECT * FROM expert_profiles WHERE verification_status = $1', ['approved']);
};

// FIXME: 대용량 파일 업로드 시 메모리 이슈 있음
const uploadDocument = async (file) => {
  // 임시로 multer 메모리 스토리지 사용
  // 추후 스트리밍 방식으로 변경 필요
};

// HACK: 임시 해결책, 추후 리팩토링 필요
const calculateTotal = (items) => {
  // 성능 이슈로 임시로 이 방식 사용
  return items.reduce((sum, item) => sum + item.price, 0);
};

// NOTE: 이 함수는 트랜잭션 내에서만 호출해야 함
const markCodeAsUsed = async (client, verificationId) => {
  await client.query(
    'UPDATE verification_codes SET is_used = true WHERE id = $1',
    [verificationId]
  );
};
```

#### 8.4 주석 업데이트

코드를 수정할 때는 관련 주석도 함께 업데이트합니다.

```javascript
// Good - 코드와 주석이 일치
/**
 * 사용자 프로필을 업데이트합니다.
 * name, phone, username 필드를 업데이트할 수 있습니다.
 */
const updateProfile = async (userId, { name, phone, username }) => {
  // 구현...
};

// Bad - 주석이 오래됨 (코드에는 username이 있지만 주석에는 없음)
/**
 * 사용자 프로필을 업데이트합니다.
 * name, phone 필드를 업데이트할 수 있습니다.
 */
const updateProfile = async (userId, { name, phone, username }) => {
  // 구현...
};
```

---

### 9. 코드 일관성 유지

#### 9.1 팀 코딩 스타일 준수

ESLint와 Prettier를 사용하여 일관된 코드 스타일을 유지합니다.

```javascript
// .eslintrc.js 예시
module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: 'eslint:recommended',
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
};

// .prettierrc 예시
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 9.2 들여쓰기 및 공백

JavaScript 표준인 2 spaces를 사용합니다.

```javascript
// Good - 2 spaces
const getUserById = async (userId) => {
  try {
    const result = await db.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[ERROR] 사용자 조회 실패:', error);
    throw error;
  }
};

// Bad - 들여쓰기 불일치
const getUserById = async (userId) => {
try {
      const result = await db.query(
    'SELECT id, email, username FROM users WHERE id = $1',
          [userId]
      );

  if (result.rows.length === 0) {
        throw new Error('User not found');
    }

      return result.rows[0];
} catch (error) {
    console.error('[ERROR] 사용자 조회 실패:', error);
      throw error;
}
};
```

#### 9.3 변수 선언 규칙

`const`를 우선 사용하고, 재할당이 필요한 경우에만 `let`을 사용합니다. `var`는 사용하지 않습니다.

```javascript
// Good
const userId = req.user.userId;  // 변경 없음
const userName = user.name;

let totalCount = 0;  // 재할당 필요
for (const item of items) {
  totalCount += item.count;
}

// Bad
var userId = req.user.userId;  // var 사용 금지
let userName = user.name;  // const로 충분
```

#### 9.4 코드 일관성의 중요성

일관된 코드 스타일은 여러 사람이 협업할 때 혼란을 줄이고, 코드 리뷰 효율성을 높입니다.

**일관성 유지 체크리스트:**
- [ ] 들여쓰기 규칙 준수 (2 spaces)
- [ ] 변수 선언 규칙 (const/let)
- [ ] 함수 네이밍 규칙 (camelCase)
- [ ] 파일 구조 순서 (import → router → helpers → routes → export)
- [ ] 에러 응답 형식 일관성
- [ ] 로깅 형식 일관성

---

### 10. 보안 규칙

#### 10.1 비밀번호 처리

```javascript
// Good - 안전한 비밀번호 처리
const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);

// 비밀번호 비교
const isPasswordValid = await bcrypt.compare(inputPassword, user.password);

// 응답에서 비밀번호 제외
const { password: _, ...userWithoutPassword } = user;
res.json({ success: true, data: { user: userWithoutPassword } });

// Bad - 절대 금지!
console.log('User password:', password);  // 로깅 금지
res.json({ user });  // password 필드 포함될 수 있음

// 더 나쁜 예
const simpleHash = password.split('').reverse().join('');  // 취약한 해싱
```

#### 10.2 JWT 검증

```javascript
// Good - 환경 변수 사용
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET이 환경 변수에 설정되지 않았습니다');
}

const token = jwt.sign(
  { userId, userType },
  process.env.JWT_SECRET,
  { expiresIn: constants.JWT_ACCESS_TOKEN_EXPIRY }
);

// 토큰 검증
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Bad - 하드코딩 절대 금지
const token = jwt.sign({ userId }, 'my-secret-key-12345');  // 보안 취약!

// 더 나쁜 예
const token = jwt.sign({ userId }, 'secret');  // 단순한 시크릿
```

#### 10.3 입력 검증 및 XSS 방지

```javascript
// Good - express-validator 사용
router.post('/endpoint', [
  body('email')
    .isEmail().withMessage('유효한 이메일을 입력해주세요')
    .normalizeEmail(),
  body('username')
    .trim()
    .escape()  // XSS 방지
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/),
  body('content')
    .trim()
    .escape()  // HTML 태그 제거
    .isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  // 안전한 입력 사용
  const { email, username, content } = req.body;
});

// Bad - 검증 없이 사용
router.post('/endpoint', async (req, res) => {
  // 사용자 입력을 그대로 사용 (XSS, SQL Injection 위험)
  const content = req.body.content;
  await db.query(`INSERT INTO posts (content) VALUES ('${content}')`);  // SQL Injection!
});
```

#### 10.4 SQL 인젝션 방지

```javascript
// Good - 파라미터화된 쿼리
const result = await db.query(
  'SELECT * FROM users WHERE email = $1 AND username = $2',
  [email, username]
);

const searchResults = await db.query(
  'SELECT * FROM posts WHERE title ILIKE $1 LIMIT $2',
  [`%${searchTerm}%`, limit]
);

// Bad - 문자열 연결 (SQL Injection 취약)
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}' AND username = '${username}'`
);

// 공격 예시: email = "admin' OR '1'='1"
// 결과 쿼리: SELECT * FROM users WHERE email = 'admin' OR '1'='1' AND username = '...'
```

---

### 11. 테스트 가능한 코드 (테스트 코드 작성)

#### 11.1 순수 함수 우선

부작용이 없는 순수 함수는 테스트하기 쉽습니다.

```javascript
// Good - 순수 함수
const calculateExpiryDate = (currentDate, expiryMs) => {
  return new Date(currentDate.getTime() + expiryMs);
};

const formatUserResponse = (user) => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    userType: user.user_type,
    isVerified: user.is_verified,
    createdAt: user.created_at
  };
};

// 테스트
expect(calculateExpiryDate(new Date('2024-01-01'), 5000))
  .toEqual(new Date('2024-01-01T00:00:05.000Z'));

expect(formatUserResponse({ id: 1, email: 'test@test.com', user_type: 'user' }))
  .toMatchObject({ id: 1, email: 'test@test.com', userType: 'user' });

// Bad - 부작용이 있는 함수 (테스트 어려움)
const getExpiryDate = () => {
  return new Date(Date.now() + 5000);  // 현재 시간에 의존 - 테스트 어려움
};

let globalUser = null;
const setCurrentUser = (user) => {
  globalUser = user;  // 전역 상태 변경 - 테스트 격리 어려움
};
```

#### 11.2 의존성 주입

의존성을 파라미터로 받아 테스트에서 mock을 사용할 수 있게 합니다.

```javascript
// Good - 의존성 주입
const createUser = async (userData, dbClient = db, emailService = defaultEmailService) => {
  const hashedPassword = await bcrypt.hash(userData.password, constants.BCRYPT_ROUNDS);

  const result = await dbClient.query(
    'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
    [userData.email, userData.username, hashedPassword, userData.name]
  );

  const user = result.rows[0];

  await emailService.sendWelcomeEmail(user.email, user.name);

  return user;
};

// 테스트
const mockDb = {
  query: jest.fn().mockResolvedValue({
    rows: [{ id: 1, email: 'test@test.com' }]
  })
};

const mockEmailService = {
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true })
};

const user = await createUser(userData, mockDb, mockEmailService);

expect(mockDb.query).toHaveBeenCalledWith(
  expect.stringContaining('INSERT INTO users'),
  expect.any(Array)
);

// Bad - 직접 의존 (테스트 어려움)
const createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // db에 직접 의존 - mock 불가능
  const result = await db.query(
    'INSERT INTO users (email, username, password, name) VALUES ($1, $2, $3, $4) RETURNING *',
    [userData.email, userData.username, hashedPassword, userData.name]
  );

  const user = result.rows[0];

  // emailService에 직접 의존 - mock 불가능
  await emailService.sendWelcomeEmail(user.email, user.name);

  return user;
};
```

#### 11.3 작은 함수 작성

작은 함수는 테스트하기 쉽고, 개별적으로 검증할 수 있습니다.

```javascript
// Good - 작은 함수들
const isValidEmail = (email) => constants.EMAIL_REGEX.test(email);
const isValidUsername = (username) => constants.USERNAME_REGEX.test(username);
const isPasswordStrong = (password) => password.length >= constants.PASSWORD_MIN_LENGTH;

// 테스트
test('이메일 검증', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
  expect(isValidEmail('invalid-email')).toBe(false);
});

test('사용자명 검증', () => {
  expect(isValidUsername('user123')).toBe(true);
  expect(isValidUsername('ab')).toBe(false);  // 너무 짧음
  expect(isValidUsername('user-name')).toBe(false);  // 하이픈 불가
});

// Bad - 큰 함수 (테스트 복잡)
const validateUserInput = (email, username, password) => {
  // 이메일 검증
  if (!email.includes('@')) return false;

  // 사용자명 검증
  if (username.length < 3 || username.length > 20) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;

  // 비밀번호 검증
  if (password.length < 8) return false;

  return true;
};

// 테스트 - 어떤 부분이 실패했는지 알기 어려움
test('사용자 입력 검증', () => {
  expect(validateUserInput('user@example.com', 'user123', 'password123')).toBe(true);
  expect(validateUserInput('invalid', 'user123', 'password123')).toBe(false);  // 왜 실패?
});
```

---

### 12. 성능 최적화

#### 12.1 N+1 쿼리 방지

반복문 안에서 쿼리를 실행하지 말고, JOIN 또는 배치 쿼리를 사용합니다.

```javascript
// Good - JOIN 사용
const getUsersWithProfiles = async () => {
  const result = await db.query(`
    SELECT
      u.id, u.email, u.username, u.name,
      ep.license_number, ep.verification_status, ep.office_name
    FROM users u
    LEFT JOIN expert_profiles ep ON u.id = ep.user_id
    WHERE u.user_type = 'expert'
    ORDER BY u.created_at DESC
  `);

  return result.rows;
};

// Bad - N+1 쿼리 문제
const getUsersWithProfiles = async () => {
  const users = await db.query('SELECT * FROM users WHERE user_type = $1', ['expert']);

  // N+1 문제: 각 사용자마다 쿼리 실행
  for (const user of users.rows) {
    const profile = await db.query(
      'SELECT * FROM expert_profiles WHERE user_id = $1',
      [user.id]
    );
    user.profile = profile.rows[0];
  }

  return users.rows;
};
```

#### 12.2 페이지네이션

대량 데이터는 LIMIT/OFFSET을 사용하여 페이지네이션 처리합니다.

```javascript
// Good - 페이지네이션
router.get('/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await db.query(
    `SELECT id, email, username, name, created_at
     FROM users
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'
  );

  res.json({
    success: true,
    data: {
      users: result.rows,
      pagination: {
        page,
        limit,
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    }
  });
});

// Bad - 모든 데이터 한 번에 로드
router.get('/users', async (req, res) => {
  const result = await db.query('SELECT * FROM users');  // 수천 개 반환 가능
  res.json({ users: result.rows });  // 메모리 문제, 느린 응답
});
```

#### 12.3 불필요한 연산 제거

중복 계산을 피하고 효율적인 알고리즘을 사용합니다.

```javascript
// Good - 효율적인 코드
const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const memoizedResults = new Map();
const expensiveCalculation = (input) => {
  if (memoizedResults.has(input)) {
    return memoizedResults.get(input);
  }

  const result = /* 복잡한 계산 */;
  memoizedResults.set(input, result);
  return result;
};

// Bad - 비효율적인 코드
const calculateOrderTotal = (items) => {
  let total = 0;

  // 불필요한 반복
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items[i].quantity; j++) {
      total += items[i].price;  // 곱셈으로 한 번에 가능
    }
  }

  return total;
};

const expensiveCalculation = (input) => {
  // 매번 계산 (캐싱 없음)
  return /* 복잡한 계산 */;
};
```

---

## Clean Code의 중요성

클린 코드는 소프트웨어의 **성공적인 확장**과 **장기적인 유지보수성**을 보장하는 중요한 원칙입니다.

### 주요 효과

- **코드 가독성 향상**: 다른 개발자가 코드를 쉽게 이해하고 수정할 수 있습니다
- **유지보수 비용 감소**: 버그 수정과 기능 추가가 빠르고 안전해집니다
- **버그 발생률 감소**: 명확한 코드는 실수를 줄이고 예측 가능성을 높입니다
- **팀 협업 효율성 증대**: 일관된 코드 스타일로 협업이 원활해집니다
- **코드 복잡성 감소**: 작고 명확한 함수로 복잡도를 관리할 수 있습니다

### 실천 방법

1. **작고 명확한 함수 작성**: 하나의 함수는 하나의 작업만 수행
2. **일관된 네이밍**: 의도를 명확히 드러내는 이름 사용
3. **테스트 코드 작성**: 순수 함수와 의존성 주입으로 테스트 용이하게
4. **중복 제거 (DRY)**: 공통 로직을 함수와 서비스로 분리
5. **의미있는 주석**: 필요한 곳에만 "왜"를 설명하는 주석 작성
6. **코드 일관성 유지**: 팀 코딩 스타일을 준수하고 도구 활용

위의 **SOLID 원칙**과 **실천 방법**을 적극적으로 적용하면, 클린 코드 작성에 한 걸음 더 다가갈 수 있으며, 그 과정에서 발생하는 코드의 복잡성을 줄이고 더 나은 품질의 소프트웨어를 만들 수 있습니다.

