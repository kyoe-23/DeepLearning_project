# SCIN 피부 질환 예측 모델

Google Research의 SCIN 데이터셋을 활용한 피부 질환 다중 라벨 분류 모델입니다.

## 📋 프로젝트 구조

```
scin/
├── data/                     # 데이터 준비 스크립트
│   ├── download.py          # GCS 데이터 다운로드
│   └── preprocess.py        # 데이터 전처리 및 분할
├── model/                   # 모델 학습 및 평가
│   ├── dataset.py          # PyTorch Dataset 클래스
│   ├── train.py            # ResNet50 학습 스크립트
│   ├── evaluate.py         # 모델 평가 스크립트
│   └── requirements.txt    # Python 의존성
├── notebooks/              # Jupyter 노트북
│   └── scin_demo.ipynb     # SCIN 데이터셋 탐색
├── checkpoints/            # 학습된 모델 체크포인트
└── logs/                   # TensorBoard 로그
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# Python 가상환경 생성 (권장)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
cd scin/model
pip install -r requirements.txt
```

### 2. 데이터 다운로드 준비

#### 옵션 A: Public URL 다운로드 (권장)

**필수 요구사항**:
- Python 3.8+
- curl (macOS/Linux 기본 설치)

**추가 패키지 설치 불필요** - Public URL 방식은 인증 없이 바로 사용 가능합니다.

#### 옵션 B: Google Cloud SDK 사용 (선택적)

Google Cloud Storage API를 사용하려면:

```bash
# macOS
brew install google-cloud-sdk

# 인증
gcloud auth login
gcloud auth application-default login

# Python 패키지 설치
pip install google-cloud-storage
```

**Note**: Public URL 방식(`--use_public_url`)을 사용하면 위 단계를 건너뛸 수 있습니다.

### 3. 데이터 다운로드

#### 방법 A: Public URL 방식 (인증 불필요, 권장)

**특징**:
- Google Cloud SDK 설치 불필요
- 인증 불필요
- curl 기반으로 안정적
- 재시도 로직 내장 (최대 3회)

```bash
cd scin/data

# 전체 데이터셋 다운로드 (약 10GB, 10,380개 이미지)
python download.py --use_public_url --output_dir ./scin_dataset

# 일부만 다운로드 (테스트용)
python download.py --use_public_url --output_dir ./scin_dataset --max_images 1000
```

#### 방법 B: Google Cloud SDK 방식

**특징**:
- Google Cloud Storage API 사용
- 인증 필요: `gcloud auth login`
- 안정적인 다운로드 보장

```bash
cd scin/data

# GCS SDK 인증 후
gcloud auth login
gcloud auth application-default login

# 데이터셋 다운로드
python download.py --output_dir ./scin_dataset

# 일부만 다운로드 (테스트용)
python download.py --output_dir ./scin_dataset --max_images 1000
```

### 4. 데이터 전처리

```bash
cd scin/data

python preprocess.py \
    --data_dir ./scin_dataset \
    --output_dir ./scin_processed \
    --top_k_classes 50 \
    --train_ratio 0.7 \
    --val_ratio 0.15 \
    --test_ratio 0.15
```

**처리 과정**:
1. 데이터 로드 (scin_merged.csv)
2. **이미지 파일 존재 확인** (자동) - 누락된 이미지를 백업 이미지로 대체
3. 라벨 추출 및 인코딩 (상위 50개 질환)
4. 다중 라벨 이진 행렬 생성
5. 클래스 가중치 계산 (불균형 해결)
6. Train/Val/Test 분할 (70/15/15)

**출력 파일**:
- `scin_processed/metadata.json` - 라벨 매핑 및 메타데이터
- `scin_processed/train.csv`, `train_labels.npy` - 학습 데이터
- `scin_processed/val.csv`, `val_labels.npy` - 검증 데이터
- `scin_processed/test.csv`, `test_labels.npy` - 테스트 데이터

**주요 개선사항**:
- 이미지 검증 자동화: 누락/손상된 이미지를 자동으로 감지하고 백업 이미지로 대체
- 데이터 손실 최소화: 백업 이미지가 있는 경우 케이스 제외 없음

### 5. 모델 학습

#### 기본 학습 (처음부터 시작)

```bash
cd scin/model

python train.py \
    --data_dir ../data/scin_processed \
    --image_root ../data/scin_dataset \
    --checkpoint_dir ../checkpoints \
    --log_dir ../logs \
    --batch_size 16 \
    --num_epochs 50 \
    --lr 0.0001 \
    --weight_decay 1e-3 \
    --dropout 0.6 \
    --patience 15
```

#### 체크포인트에서 학습 재개

```bash
cd scin/model

python train.py \
    --data_dir ../data/scin_processed \
    --image_root ../data/scin_dataset \
    --checkpoint_dir ../checkpoints \
    --log_dir ../logs \
    --resume ../checkpoints/checkpoint_latest.pth \
    --batch_size 16 \
    --num_epochs 50 \
    --lr 0.0001 \
    --weight_decay 1e-3 \
    --dropout 0.6 \
    --patience 15
```

**주요 학습 파라미터**:
- `--data_dir`: 전처리된 데이터 디렉토리
- `--image_root`: 원본 이미지 디렉토리 (dataset/images/)
- `--batch_size`: 배치 크기 (권장: 16, 기본값: 32)
- `--num_epochs`: 총 에포크 수 (기본값: 50)
- `--lr`: Learning rate (권장: 0.0001, 기본값: 0.001)
- `--weight_decay`: L2 정규화 강도 (권장: 1e-3, 기본값: 1e-4)
- `--dropout`: Dropout 비율 (권장: 0.6, 기본값: 0.5)
- `--patience`: Early stopping patience (권장: 15, 기본값: 10)
- `--num_workers`: DataLoader 워커 수 (기본값: 4)
- `--resume`: 체크포인트 경로 (학습 재개 시 사용)

**하이퍼파라미터 권장 설정** (과적합 방지 및 학습 안정성 향상):
- `--batch_size 16`: 작은 배치로 더 많은 그래디언트 업데이트
- `--lr 0.0001`: 낮은 학습률로 안정적인 학습
- `--weight_decay 1e-3`: 강한 L2 정규화로 과적합 방지
- `--dropout 0.6`: 높은 드롭아웃으로 일반화 성능 향상
- `--patience 15`: 충분한 수렴 시간 제공

**학습 모니터링 (TensorBoard)**:

```bash
# 새 터미널에서 실행
cd scin
python3 -m tensorboard.main --logdir logs
# 브라우저에서 http://localhost:6006 접속
```

**체크포인트 파일**:
- `checkpoint_latest.pth`: 매 에포크 자동 저장 (최신 상태)
- `checkpoint_best.pth`: 최고 성능 모델 (검증 손실 기준)
- `checkpoint_epoch_10.pth`, `checkpoint_epoch_20.pth`: 10 에포크마다 저장

### 6. 모델 평가

```bash
cd scin/model

python evaluate.py \
    --checkpoint ../checkpoints/checkpoint_best.pth \
    --data_dir ../data/scin_processed \
    --image_root ../data/scin_dataset \
    --output_dir ./evaluation_results \
    --batch_size 32 \
    --threshold 0.5
```

**평가 파라미터**:
- `--checkpoint`: 평가할 모델 체크포인트 경로
- `--data_dir`: 전처리된 데이터 디렉토리
- `--image_root`: 원본 이미지 디렉토리
- `--output_dir`: 평가 결과 저장 디렉토리 (기본값: ./evaluation_results)
- `--batch_size`: 배치 크기 (기본값: 32)
- `--threshold`: 이진 분류 임계값 (기본값: 0.5)
- `--num_workers`: DataLoader 워커 수 (기본값: 4)

**출력 파일**:
- `evaluation_summary.json` - Top-K Accuracy, Macro/Micro F1-Score 등
- `per_class_metrics.json` - 클래스별 Precision, Recall, F1-Score
- `per_class_f1.png` - 클래스별 F1-Score 시각화 그래프
- `sample_predictions.txt` - 샘플 예측 결과 (상위 5개)

## 📊 데이터셋 정보

### SCIN (Skin Condition Image Network)

- **출처**: Google Research ([논문](https://arxiv.org/abs/2111.07067))
- **규모**: 5,033개 케이스, 10,407개 이미지
- **라벨**: 50개 주요 피부 질환 (다중 라벨 지원)
- **메타데이터**: 피츠패트릭 피부 타입, 인종, 나이, 증상 등

### 주요 질환 (Top 10)

1. Eczema (1,056건)
2. Allergic Contact Dermatitis (873건)
3. Insect Bite (403건)
4. Urticaria (332건)
5. Psoriasis (308건)
6. Folliculitis (268건)
7. Irritant Contact Dermatitis (249건)
8. Tinea (206건)
9. Drug Rash (148건)
10. Herpes Zoster (142건)

## 🔧 주요 기능

### 1. 다중 라벨 분류
- 하나의 케이스에 여러 질환 라벨 가능
- BCEWithLogitsLoss 사용
- 클래스 불균형 해결 (가중치 적용)

### 2. 데이터 증강
- RandomHorizontalFlip
- ColorJitter
- RandomRotation
- RandomCrop

### 3. 전이 학습
- ResNet50 백본 (ImageNet pretrained)
- Fine-tuning 가능

### 4. 평가 메트릭
- Top-1, Top-3, Top-5 Accuracy
- Per-class F1-Score, Precision, Recall
- Overall Macro F1-Score

## 📈 성능 목표

| Metric | Target |
|--------|--------|
| Top-1 Accuracy | > 60% |
| Top-3 Accuracy | > 80% |
| Top-5 Accuracy | > 90% |
| Macro F1-Score | > 0.5 |

## 🛠️ 고급 사용법

### 복수 이미지 사용

```python
from dataset import MultiImageSCINDataset, get_data_loaders

# 케이스당 최대 3개 이미지 사용
data_loaders = get_data_loaders(
    data_dir='./scin_processed',
    image_root='./scin_dataset',
    batch_size=32,
    multi_image=True  # 복수 이미지 모드
)
```

### 커스텀 Transform

```python
from torchvision import transforms
from dataset import SCINDataset

custom_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

dataset = SCINDataset(
    data_dir='./scin_processed',
    image_root='./scin_dataset',
    split='train',
    transform=custom_transform,
    augment=False
)
```

## 🐛 문제 해결

### 1. GCS 인증 오류

```bash
# 다음 명령어로 재인증
gcloud auth application-default login
```

### 2. Out of Memory (OOM)

```bash
# 배치 크기 줄이기
python train.py --batch_size 8  # 권장값 16에서 추가 감소

# 또는 이미지 크기 줄이기 (dataset.py 수정)
transforms.Resize((192, 192))  # 기본값: 224

# 또는 워커 수 감소
python train.py --num_workers 2  # 기본값: 4
```

### 3. 데이터 로드 느림

```bash
# DataLoader 워커 수 증가
python train.py --num_workers 8

# 또는 데이터를 SSD로 이동
```

### 4. 이미지 파일 누락 오류 (FileNotFoundError)

**자동 해결**: Phase 2 업데이트로 이미지 fallback 기능이 추가되어 자동으로 처리됩니다.

**동작 방식**:
- 전처리 단계에서 이미지 검증 자동 수행
- Dataset 클래스가 image_1 → image_2 → image_3 순으로 자동 fallback
- 백업 이미지가 있는 경우 학습 중단 없이 진행

**수동 재전처리 (선택)**:
```bash
cd scin/data
python preprocess.py --data_dir ./scin_dataset --output_dir ./scin_processed

# 출력 예시:
# [STEP] 이미지 파일 존재 확인
# 이미지 검증: 100%|████████| 2918/2918
# [INFO] 검증 완료:
#        경로 수정: 1건
#        제외된 케이스: 0건
```

## 📚 참고 자료

- [SCIN 논문](https://arxiv.org/abs/2111.07067)
- [SCIN GitHub](https://github.com/google-research-datasets/scin)
- [PyTorch 공식 문서](https://pytorch.org/docs/stable/index.html)
- [Transfer Learning 가이드](https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html)

## 📝 라이선스

이 프로젝트는 SCIN 데이터셋의 라이선스를 따릅니다.
- 데이터셋: [Apache License 2.0](https://github.com/google-research-datasets/scin/blob/main/LICENSE)

## 🤝 기여

버그 리포트, 기능 제안, Pull Request 환영합니다!

## 📧 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.

---

**변경 이력**:
- **2025-01-14**: 하이퍼파라미터 최적화 및 체크포인트 재개 기능 추가
  - 권장 하이퍼파라미터 업데이트 (과적합 방지)
  - `--resume` 플래그 추가 (학습 중단 후 재개 가능)
  - 학습 안정성 개선을 위한 설정 가이드 추가
- **2025-01-13**: Phase 2 - 이미지 검증 및 Fallback 기능 추가

**Last Updated**: 2025-01-14
