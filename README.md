# SkinAI - AI 피부 진단 플랫폼

PyTorch 기반 딥러닝 모델을 활용한 피부 질환 분석 웹 서비스입니다.

## 주요 기능

- **AI 피부 분석**: ResNet50 기반 50가지 피부 질환 진단 (SCIN 데이터셋)
- **사용자 인증**: JWT 기반 회원가입/로그인
- **커뮤니티**: 게시판, 댓글, 좋아요
- **분석 기록**: 과거 진단 결과 조회 및 관리

## 기술 스택

### 백엔드
- Node.js + Express
- PostgreSQL
- JWT 인증
- Multer (파일 업로드)

### AI 서비스
- Python 3.8+ + Flask
- PyTorch 2.0+
- ResNet50/EfficientNet-B3

### 프론트엔드
- Vanilla JavaScript
- HTML5/CSS3

## 프로젝트 구조

```
.
├── backend/                # Node.js 백엔드 서버
│   ├── src/
│   │   ├── routes/         # API 라우트 (auth, board, ai)
│   │   ├── middleware/     # JWT 인증, Rate Limiter
│   │   └── server.js
│   └── uploads/            # 업로드 이미지
├── frontend/src/           # 정적 파일 (HTML/CSS/JS)
├── scin/
│   ├── api/                # Flask AI 서비스 (Port 5000)
│   ├── model/              # PyTorch 모델 (ResNet50/EfficientNet)
│   ├── data/               # SCIN 데이터셋
│   └── checkpoints/        # 학습된 모델 체크포인트
└── README.md
```

## 빠른 시작

### 1. 백엔드 설치 및 실행

```bash
# 의존성 설치
cd backend
npm install

# 서버 실행
npm start
```

서버: http://localhost:3000

### 2. Flask AI 서비스 실행

```bash
cd scin/api

# Python 가상 환경 생성
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
./start.sh  # 개발 모드
# 또는: ./start_prod.sh  # 프로덕션 모드 (Gunicorn)
```

Flask 서버: http://localhost:5000

### 3. 브라우저 접속

| 페이지 | URL |
|--------|-----|
| 홈 | http://localhost:3000/ |
| 로그인 | http://localhost:3000/login.html |
| 회원가입 | http://localhost:3000/signup.html |
| AI 분석 | http://localhost:3000/ai-analysis.html |
| 커뮤니티 | http://localhost:3000/board.html |
| 프로필 | http://localhost:3000/profile.html |

## API 엔드포인트

### 인증 (`/api/auth`)

| 메소드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| POST | `/signup` | 회원가입 | X |
| POST | `/login` | 로그인 | X |
| GET | `/profile?userId=1` | 프로필 조회 | 필수 |
| PUT | `/profile` | 프로필 수정 | 필수 |
| DELETE | `/delete` | 회원탈퇴 | 필수 |

### 게시판 (`/api/board/free`)

| 메소드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| GET | `/posts` | 게시글 목록 | 필수 |
| POST | `/posts` | 게시글 작성 | 필수 |
| GET | `/posts/:id` | 게시글 상세 | 필수 |
| PUT | `/posts/:id` | 게시글 수정 | 필수 |
| DELETE | `/posts/:id` | 게시글 삭제 | 필수 |
| POST | `/posts/:id/like` | 좋아요 | 필수 |
| POST | `/posts/:id/comments` | 댓글 작성 | 필수 |
| DELETE | `/posts/:postId/comments/:commentId` | 댓글 삭제 | 필수 |

### AI 분석 (`/api/ai`)

| 메소드 | 엔드포인트 | 설명 | 인증 |
|--------|-----------|------|------|
| POST | `/image-upload` | 이미지 업로드 (최대 5MB) | 필수 |
| POST | `/survey` | 설문 제출 및 AI 분석 | 필수 |
| GET | `/analysis/:id` | 분석 결과 조회 | 필수 |
| GET | `/my-analyses` | 내 분석 기록 | 필수 |

**응답 형식**: `{success: boolean, message: string, data?: object, errors?: array}`

## AI 모델 학습

### ResNet50 모델 학습

```bash
cd scin/model/resnet50

# 새로운 학습 시작
./retrain_balanced.sh

# 기존 학습 재개 (patience 증가)
./resume_balanced.sh
```

### 모델 평가

```bash
cd scin/model/resnet50

python evaluate.py \
  --checkpoint ../../checkpoints_balanced/checkpoint_best.pth \
  --output_dir ./evaluation_results_balanced
```

## 보안 기능

- **JWT 인증**: 모든 API 엔드포인트 보호
- **Rate Limiting**: API 남용 방지 (일반 API: 100회/분, 인증: 5회/15분)
- **비밀번호 해싱**: bcrypt (10 salt rounds)
- **입력값 검증**: express-validator
- **파일 업로드 제한**: JPG/PNG만, 최대 5MB

## 데이터셋

**SCIN (Skin Condition Image Network)**
- 이미지 수: 10,407장
- 질환 종류: 50가지 피부 질환
- 구조: Multi-label classification
- 전처리: 크롭, 리사이즈, 정규화

## 제한사항

> **이 프로젝트는 학습/연구 목적입니다. 프로덕션 환경 배포 불가.**

- 페이지네이션 미구현 (전체 데이터 로드)
- 이미지 로컬 저장 (클라우드 스토리지 미사용)
- CORS, HTTPS 미설정
- 의료 진단 정확도 보장 불가 (참고용)

## 상세 문서

- [Architecture.md](Architecture.md) - 시스템 아키텍처 문서
- [scin/재학습_가이드.md](scin/재학습_가이드.md) - AI 모델 재학습 가이드

