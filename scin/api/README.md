# Flask AI Service - SCIN 피부 질환 분류 API

PyTorch 기반 피부 질환 이미지 분류 마이크로서비스

## 개요

- **모델**: ResNet50 또는 EfficientNet-B3
- **데이터셋**: SCIN (Skin Condition Image Network) - 50개 피부 질환
- **프레임워크**: PyTorch 2.0+, Flask 3.0+
- **디바이스**: GPU/MPS/CPU 자동 감지

## 설치

### 1. Python 가상환경 생성

```bash
cd scin/api
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 의존성 설치

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 체크포인트 파일 확인

모델 체크포인트 파일이 다음 경로에 있어야 합니다:
```
scin/checkpoints/checkpoint_best.pth
```

파일이 없는 경우 먼저 모델 학습을 수행하세요:
```bash
cd scin/model
python train.py --model resnet50 --epochs 100
```

## 실행

### 개발 모드

```bash
cd scin/api
./start.sh
```

Flask 개발 서버가 `http://localhost:5001`에서 실행됩니다.

### 프로덕션 모드 (Gunicorn)

```bash
cd scin/api
./start_prod.sh
```

환경 변수로 설정 변경 가능:
```bash
FLASK_PORT=8000 WORKERS=4 ./start_prod.sh
```

## API 엔드포인트

### 1. Health Check

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "service": "SCIN AI Prediction Service",
  "version": "1.0.0"
}
```

### 2. 이미지 분류 (Predict)

**Endpoint**: `POST /predict`

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `image`: 이미지 파일 (JPG/PNG, 최대 5MB)

**Response** (성공):
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "disease": "Acne",
        "confidence": 0.85,
        "confidence_percent": "85.0%",
        "recommendations": [
          "피부과 전문의 상담을 권장합니다",
          "유분기 적은 화장품을 사용하세요",
          "정기적인 클렌징이 중요합니다"
        ]
      },
      ...
    ],
    "summary": "Acne 가능성이 높습니다. 정확한 진단을 위해 피부과 전문의 상담을 권장합니다.",
    "top_disease": "Acne",
    "overall_confidence": 0.85
  }
}
```

**Response** (실패):
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 (DEBUG 모드에서만)"
}
```

## 테스트

### 1. Health Check 테스트

```bash
curl http://localhost:5001/health
```

### 2. 이미지 분류 테스트

```bash
curl -X POST http://localhost:5001/predict \
  -F "image=@/path/to/skin_image.jpg"
```

### 3. Python 스크립트로 테스트

```python
import requests

url = 'http://localhost:5001/predict'
files = {'image': open('skin_image.jpg', 'rb')}

response = requests.post(url, files=files)
print(response.json())
```

## 설정

모든 설정은 [config.py](config.py)에서 관리됩니다:

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `MODEL_TYPE` | `resnet50` | 모델 타입 (`resnet50` 또는 `efficientnet-b3`) |
| `NUM_CLASSES` | `50` | 분류 클래스 수 |
| `IMAGE_SIZE` | `224` | 입력 이미지 크기 (ResNet50: 224, EfficientNet-B3: 300) |
| `TOP_K_PREDICTIONS` | `5` | 반환할 상위 예측 개수 |
| `CONFIDENCE_THRESHOLD` | `0.3` | 최소 신뢰도 임계값 |
| `MAX_CONTENT_LENGTH` | `5MB` | 최대 업로드 파일 크기 |

## 디렉토리 구조

```
scin/api/
├── app.py              # Flask 메인 애플리케이션
├── inference.py        # 모델 추론 로직
├── config.py           # 설정 파일
├── requirements.txt    # Python 의존성
├── start.sh            # 개발 서버 실행 스크립트
├── start_prod.sh       # 프로덕션 서버 실행 스크립트
├── uploads/            # 임시 업로드 폴더 (자동 생성)
└── README.md           # 이 파일
```

## Node.js 백엔드 통합

Node.js 백엔드는 자동으로 Flask AI 서비스를 호출합니다:

```javascript
// backend/src/routes/ai.js
const FLASK_AI_SERVICE_URL = process.env.FLASK_AI_SERVICE_URL || 'http://localhost:5001';

// POST /api/ai/survey 엔드포인트에서 Flask API 호출
const response = await axios.post(`${FLASK_AI_SERVICE_URL}/predict`, formData);
```

**환경 변수** (`backend/.env`):
```bash
FLASK_AI_SERVICE_URL=http://localhost:5001
FLASK_API_TIMEOUT=30000  # 30초
```

## Fallback 전략

Flask AI 서비스가 다운된 경우, Node.js 백엔드는 자동으로 폴백 분석을 사용합니다:
- 설문 기반 규칙 분석
- 기본 추천 사항 제공
- 사용자에게 경고 메시지 표시

## 트러블슈팅

### 1. 모델 로드 실패

**에러**: `FileNotFoundError: 모델 체크포인트 파일 없음`

**해결**:
```bash
# 체크포인트 파일 위치 확인
ls -lh scin/checkpoints/checkpoint_best.pth

# 없으면 모델 학습
cd scin/model
python train.py --model resnet50 --epochs 100
```

### 2. CUDA/MPS 에러

**에러**: `RuntimeError: CUDA out of memory` 또는 MPS 관련 에러

**해결**:
- CPU 모드로 강제 실행: `config.py`에서 `DEVICE = 'cpu'` 설정
- 배치 크기 줄이기 (추론은 배치 크기 1 사용)

### 3. 포트 충돌

**에러**: `Address already in use`

**해결**:
```bash
# 포트 변경
FLASK_PORT=8000 ./start.sh

# 또는 기존 프로세스 종료
lsof -ti:5000 | xargs kill -9
```

### 4. 의존성 설치 실패

**에러**: PyTorch 설치 실패

**해결**:
```bash
# PyTorch 공식 사이트에서 올바른 명령 확인
# https://pytorch.org/get-started/locally/

# 예: CPU 버전
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 예: CUDA 11.8
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## 성능 최적화

### 1. Gunicorn Workers 조정

```bash
# CPU 코어 수의 2배 + 1
WORKERS=9 ./start_prod.sh
```

### 2. 모델 캐싱

모델은 서버 시작 시 1회만 로드되며 메모리에 유지됩니다 (`inference.py`의 싱글톤 패턴).

### 3. GPU 가속

CUDA 또는 Apple MPS가 자동으로 감지되어 사용됩니다.

## 라이센스

이 프로젝트는 교육 및 연구 목적으로 제공됩니다.

## 문의

문제가 발생하면 이슈를 등록하거나 개발팀에 문의하세요.
