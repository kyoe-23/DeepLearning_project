# SkinAI 시스템 아키텍처

## 개요
이 문서는 SkinAI 피부 건강 관리 플랫폼의 전체 시스템 아키텍처를 설명합니다.

## 시스템 아키텍처 다이어그램

### 전체 시스템 구조
```mermaid
graph LR
    subgraph CLIENT["클라이언트 계층"]
        direction TB
        FE["<b>프론트엔드</b><br/>HTML/CSS/JS"]
        STORAGE["<b>Local Storage</b><br/>JWT Token<br/>User Info"]
        FE --- STORAGE
    end

    subgraph SERVER["서버 계층 (Express :3000)"]
        direction TB
        MW["<b>미들웨어</b><br/>JWT 인증<br/>Rate Limiter<br/>Validator"]
        API["<b>API 라우터</b><br/>/api/auth<br/>/api/board<br/>/api/ai"]
        LOGIC["<b>비즈니스 로직</b><br/>사용자 관리<br/>게시판 관리<br/>AI 분석"]
        MW --> API --> LOGIC
    end

    subgraph DATA["데이터 계층"]
        direction TB
        MEMORY["<b>In-Memory DB</b><br/>Users, Posts<br/>Comments, Analyses"]
        FILES["<b>파일 시스템</b><br/>uploads/"]
        MEMORY --- FILES
    end

    subgraph SECURITY["보안"]
        direction TB
        SEC["<b>JWT</b><br/><b>Bcrypt</b><br/><b>Multer</b>"]
    end

    CLIENT <-->|"HTTP Request/Response<br/>Authorization: Bearer Token"| SERVER
    SERVER <-->|"Read/Write"| DATA
    SERVER -.->|"사용"| SECURITY

    style CLIENT fill:#2196F3,stroke:#1565C0,stroke-width:3px,color:#fff
    style SERVER fill:#FF9800,stroke:#E65100,stroke-width:3px,color:#fff
    style DATA fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style SECURITY fill:#F44336,stroke:#C62828,stroke-width:3px,color:#fff
    
    style FE fill:#42A5F5,stroke:#1565C0,stroke-width:2px,color:#000
    style STORAGE fill:#42A5F5,stroke:#1565C0,stroke-width:2px,color:#000
    style MW fill:#FFB74D,stroke:#E65100,stroke-width:2px,color:#000
    style API fill:#FFB74D,stroke:#E65100,stroke-width:2px,color:#000
    style LOGIC fill:#FFB74D,stroke:#E65100,stroke-width:2px,color:#000
    style MEMORY fill:#66BB6A,stroke:#2E7D32,stroke-width:2px,color:#000
    style FILES fill:#66BB6A,stroke:#2E7D32,stroke-width:2px,color:#000
    style SEC fill:#EF5350,stroke:#C62828,stroke-width:2px,color:#000
```

### 상세 계층 구조

#### 1️⃣ 클라이언트 계층
```mermaid
graph TB
    subgraph PAGES["프론트엔드 페이지"]
        direction LR
        AUTH["<b>인증</b><br/>로그인<br/>회원가입"]
        BOARD["<b>게시판</b><br/>목록<br/>상세<br/>작성"]
        AI["<b>AI 분석</b><br/>업로드<br/>설문<br/>결과"]
        PROFILE["<b>프로필</b><br/>내정보<br/>내글<br/>내댓글"]
    end
    
    NAV["<b>공통 네비게이션</b><br/>common-nav.js"]
    STORAGE["<b>Local Storage</b><br/>JWT Token<br/>User Info"]
    
    NAV --> PAGES
    PAGES --> STORAGE

    style PAGES fill:#E3F2FD,stroke:#1976D2,stroke-width:2px,color:#000
    style AUTH fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#000
    style BOARD fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#000
    style AI fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#000
    style PROFILE fill:#BBDEFB,stroke:#1976D2,stroke-width:2px,color:#000
    style NAV fill:#90CAF9,stroke:#1976D2,stroke-width:2px,color:#000
    style STORAGE fill:#64B5F6,stroke:#1976D2,stroke-width:2px,color:#000
```

#### 2️⃣ 서버 계층
```mermaid
graph TB
    subgraph MW["미들웨어"]
        direction LR
        AUTH_MW["<b>JWT 인증</b><br/>auth.js"]
        RATE["<b>Rate Limiter</b><br/>분당 100회"]
        VALID["<b>Validator</b><br/>입력값 검증"]
    end

    subgraph API["API 라우터"]
        direction LR
        AUTH_API["<b>인증 API</b><br/>/api/auth/*"]
        BOARD_API["<b>게시판 API</b><br/>/api/board/*"]
        AI_API["<b>AI API</b><br/>/api/ai/*"]
    end

    subgraph LOGIC["비즈니스 로직"]
        direction LR
        USER_LOGIC["<b>사용자 관리</b><br/>회원가입<br/>로그인<br/>프로필"]
        BOARD_LOGIC["<b>게시판 관리</b><br/>CRUD<br/>좋아요<br/>댓글"]
        AI_LOGIC["<b>AI 분석</b><br/>이미지 업로드<br/>설문조사<br/>분석 엔진"]
    end

    MW --> API --> LOGIC

    style MW fill:#FFF3E0,stroke:#F57C00,stroke-width:2px,color:#000
    style API fill:#FFE0B2,stroke:#F57C00,stroke-width:2px,color:#000
    style LOGIC fill:#FFCC80,stroke:#F57C00,stroke-width:2px,color:#000
    
    style AUTH_MW fill:#FFE082,stroke:#F57C00,stroke-width:2px,color:#000
    style RATE fill:#FFE082,stroke:#F57C00,stroke-width:2px,color:#000
    style VALID fill:#FFE082,stroke:#F57C00,stroke-width:2px,color:#000
    style AUTH_API fill:#FFCA28,stroke:#F57C00,stroke-width:2px,color:#000
    style BOARD_API fill:#FFCA28,stroke:#F57C00,stroke-width:2px,color:#000
    style AI_API fill:#FFCA28,stroke:#F57C00,stroke-width:2px,color:#000
    style USER_LOGIC fill:#FFB300,stroke:#F57C00,stroke-width:2px,color:#000
    style BOARD_LOGIC fill:#FFB300,stroke:#F57C00,stroke-width:2px,color:#000
    style AI_LOGIC fill:#FFB300,stroke:#F57C00,stroke-width:2px,color:#000
```

#### 3️⃣ 데이터 계층
```mermaid
graph TB
    subgraph STORAGE["데이터 저장소"]
        direction LR
        MEMORY["<b>In-Memory DB</b><br/>⚠️ 서버 재시작시 초기화"]
        FILES["<b>파일 시스템</b><br/>/backend/uploads/"]
    end

    subgraph MODELS["데이터 모델"]
        direction LR
        USERS["<b>Users</b><br/>id, email<br/>password, name"]
        POSTS["<b>Posts</b><br/>id, title<br/>content, likes"]
        COMMENTS["<b>Comments</b><br/>id, postId<br/>content"]
        ANALYSES["<b>Analyses</b><br/>id, userId<br/>score, results"]
    end

    MODELS --> STORAGE

    style STORAGE fill:#E8F5E9,stroke:#388E3C,stroke-width:2px,color:#000
    style MODELS fill:#C8E6C9,stroke:#388E3C,stroke-width:2px,color:#000
    style MEMORY fill:#A5D6A7,stroke:#388E3C,stroke-width:2px,color:#000
    style FILES fill:#A5D6A7,stroke:#388E3C,stroke-width:2px,color:#000
    style USERS fill:#81C784,stroke:#388E3C,stroke-width:2px,color:#000
    style POSTS fill:#81C784,stroke:#388E3C,stroke-width:2px,color:#000
    style COMMENTS fill:#81C784,stroke:#388E3C,stroke-width:2px,color:#000
    style ANALYSES fill:#81C784,stroke:#388E3C,stroke-width:2px,color:#000
```

#### 4️⃣ 보안 계층
```mermaid
graph LR
    JWT["<b>JWT</b><br/>토큰 생성/검증<br/>만료시간: 24h"]
    BCRYPT["<b>Bcrypt</b><br/>비밀번호 해싱<br/>10 salt rounds"]
    MULTER["<b>Multer</b><br/>파일 업로드<br/>최대 5MB"]

    style JWT fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#000
    style BCRYPT fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#000
    style MULTER fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#000
```

## 주요 컴포넌트 설명

### 1. 클라이언트 계층 🎨

#### 프론트엔드 페이지
- **랜딩 페이지** (`index.html`): 서비스 소개 및 Hero 섹션
- **인증 페이지**: 로그인, 회원가입
- **게시판**: 메인 목록, 상세보기, 글쓰기/수정
- **프로필**: 사용자 정보 관리 (4개 탭 시스템)
- **AI 분석**: 피부 분석, 분석 기록, 결과 상세

#### 공통 기능
- **공통 네비게이션** (`common-nav.js`): 모든 페이지 통합 네비게이션
- **Local Storage**: JWT 토큰 및 사용자 정보 저장

### 2. 서버 계층 ⚙️

#### Express 서버 (포트 3000)
Node.js 기반의 백엔드 서버로 모든 API 요청을 처리합니다.

#### 미들웨어
- **JWT 인증** (`auth.js`): 토큰 검증 및 사용자 인증
- **Rate Limiter** (`rateLimiter.js`): API 남용 방지
  - 일반 API: 분당 100회
  - 인증 API: 15분당 5회
  - 게시글 작성: 분당 3회
- **Validator**: `express-validator`를 통한 입력값 검증

#### API 라우터
1. **인증 API** (`/api/auth/*`)
   - 회원가입, 로그인, 로그아웃
   - 프로필 조회/수정, 회원탈퇴
   - 내가 쓴 글/댓글 조회

2. **게시판 API** (`/api/board/free/*`)
   - 게시글 CRUD
   - 좋아요, 댓글 관리
   - 검색 및 카테고리 필터링

3. **AI 분석 API** (`/api/ai/*`)
   - 이미지 업로드
   - 설문조사 제출
   - 분석 결과 조회

### 3. 데이터 계층 💾

#### In-Memory Storage
⚠️ **주의**: 모든 데이터는 메모리에 저장되며, 서버 재시작 시 초기화됩니다.

#### 데이터 모델
- **Users**: 사용자 정보 (id, email, password, name, createdAt)
- **Posts**: 게시글 (id, category, title, content, authorId, likes)
- **Comments**: 댓글 (id, postId, content, authorId, createdAt)
- **AI Analyses**: AI 분석 결과 (id, userId, imageUrl, score, results)

#### 파일 시스템
- 업로드된 이미지는 `/backend/uploads/` 디렉토리에 저장

### 4. 보안 계층 🔒

- **JWT**: JSON Web Token 기반 인증 (만료시간: 24시간)
- **Bcrypt**: 비밀번호 해싱 (10 salt rounds)
- **Multer**: 파일 업로드 제한 (최대 5MB, JPG/PNG만 허용)

## 주요 데이터 흐름

### 인증 흐름
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant LocalStorage

    User->>Frontend: 회원가입/로그인
    Frontend->>Backend: POST /api/auth/signup or /login
    Backend->>Backend: 비밀번호 해싱 & JWT 생성
    Backend->>Frontend: {user, token}
    Frontend->>LocalStorage: token & user 저장
    Frontend->>User: 게시판으로 리다이렉트
```

### 인증이 필요한 API 호출 흐름
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant LocalStorage
    participant AuthMiddleware

    Note over User,AuthMiddleware: 게시글 작성/좋아요/댓글 예시

    User->>Frontend: 게시글 작성/좋아요/댓글 작성
    Frontend->>LocalStorage: token 조회
    LocalStorage-->>Frontend: JWT token
    Frontend->>Backend: API 요청 + Authorization: Bearer {token}
    Backend->>AuthMiddleware: JWT 검증

    alt 토큰 유효
        AuthMiddleware->>Backend: req.user 설정 (userId 포함)
        Backend->>Backend: 비즈니스 로직 실행
        Backend-->>Frontend: {success: true, data}
        Frontend-->>User: 성공 메시지 표시
    else 토큰 없음/만료/유효하지 않음
        AuthMiddleware-->>Frontend: {success: false, message: "인증 토큰이 필요합니다"}
        Frontend-->>User: 에러 메시지 표시
    end
```

## 기술 스택

### 백엔드
- **Node.js**: 서버 런타임
- **Express**: 웹 프레임워크
- **bcryptjs**: 비밀번호 해싱
- **jsonwebtoken**: JWT 토큰 생성 및 검증
- **express-validator**: 입력값 검증
- **express-rate-limit**: Rate limiting
- **multer**: 파일 업로드
- **dotenv**: 환경 변수 관리

### 프론트엔드
- **Vanilla JavaScript**: 순수 자바스크립트
- **HTML5/CSS3**: 마크업 및 스타일링
- **Fetch API**: 서버 통신

## 보안 기능

### 구현됨 ✅
- JWT 인증 미들웨어
- 모든 Board API 및 AI API 인증 적용
- Rate Limiting (API 남용 방지)
- 비밀번호 bcrypt 해싱
- 입력값 검증 (express-validator)
- 중복 이메일 체크
- 에러 메시지 일반화
- 파일 업로드 제한 (5MB, JPG/PNG)

### 미구현 ⚠️
- CORS 설정
- HTTPS 지원
- 파일 업로드 악성코드 검사
- 세션 관리
- 비밀번호 재설정
- 이메일 인증

## 알려진 제한사항

> **경고**: 이 프로젝트는 학습/프로토타입 목적입니다. 프로덕션 환경에 배포하지 마세요.

1. **인메모리 데이터 저장**
   - 서버 재시작 시 모든 데이터 손실
   - 데이터베이스 미사용

2. **성능 이슈**
   - 페이지네이션 없음
   - 인덱싱 없음
   - 로컬 이미지 저장

3. **AI 분석 제한**
   - 규칙 기반 분석 (실제 AI 모델 미적용)

## 개선 로드맵

### Phase 1: 보안 강화 ✅ 완료
- [x] JWT 인증 미들웨어 구현
- [x] 모든 API 인증 적용
- [x] Rate limiting 추가

### Phase 2: UI/UX 개선 ✅ 완료
- [x] 현대적인 랜딩 페이지
- [x] 통합 네비게이션 시스템
- [x] 프로필 페이지 탭 시스템
- [x] 게시판 카테고리 시스템
- [x] 반응형 디자인

### Phase 3: 기능 확장 (일부 완료)
- [x] 게시글 검색
- [x] 이미지 업로드
- [x] AI 피부 분석 시스템
- [ ] 페이지네이션
- [ ] 비밀번호 재설정
- [ ] 이메일 인증
- [ ] 실제 AI 모델 통합

### Phase 4: 데이터베이스 연동
- [ ] MongoDB/PostgreSQL 연동
- [ ] 데이터 영속성 확보
- [ ] 인덱싱 추가
- [ ] 클라우드 이미지 스토리지

### Phase 5: 프로덕션 준비
- [ ] HTTPS & CORS 설정
- [ ] 로깅 & 모니터링
- [ ] 배포 자동화
- [ ] 성능 최적화

## 참고 문서
- [README.md](./README.md): 프로젝트 전체 문서
- [CLAUDE.md](./CLAUDE.md): Claude Code 가이드
