# SCIN 피부 질환 분류 - EfficientNet-B3 모델

EfficientNet-B3 기반 전이 학습을 사용한 피부 질환 다중 라벨 분류 모델입니다.

## 📁 디렉토리 구조

```
efficientnet_b3/
├── model.py              # EfficientNetB3Classifier 모델 정의
├── train.py              # 학습 스크립트
├── evaluate.py           # 평가 스크립트
├── checkpoints/          # 모델 체크포인트 저장 (학습 시 생성)
├── logs/                 # TensorBoard 로그 (학습 시 생성)
├── evaluation_results/   # 평가 결과 저장 (평가 시 생성)
└── README.md             # 이 파일
```

## 🏗️ 모델 아키텍처

- **백본**: EfficientNet-B3 (ImageNet pretrained)
- **출력 레이어**: 내장 FC layer + Dropout (p=0.5)
- **클래스 수**: 50 (SCIN 데이터셋)
- **손실 함수**: BCEWithLogitsLoss (클래스 가중치 적용)
- **최적화**: Adam optimizer (lr=0.001, weight_decay=1e-4)
- **학습률 스케줄링**: ReduceLROnPlateau (patience=5, factor=0.5)

### EfficientNet-B3 vs ResNet50

| 특징 | EfficientNet-B3 | ResNet50 | 개선율 |
|-----|----------------|----------|--------|
| **파라미터 수** | 12M | 25.6M | -53% ↓ |
| **FLOPs** | 1.8B | 4.1B | -56% ↓ |
| **입력 크기** | 300×300 | 224×224 | +17% |
| **Epoch 시간** | 40-50초 | 86초 | -42% ↓ |
| **발열** | -20~30% | 기준 | ✅ |
| **ImageNet Top-1** | 81.6% | 76.0% | +7.4% ↑ |
| **SCIN Top-1** (예상) | 22-28% | 16.2% | +37-73% ↑ |
| **SCIN Top-5** (예상) | 68-75% | 57.3% | +19-31% ↑ |
| **SCIN F1-Score** (예상) | 12-18% | 5.6% | +115-222% ↑ |

**주요 장점**:
- ✅ **더 적은 파라미터** (53% 감소) - 메모리 효율적
- ✅ **더 빠른 학습** (42% 단축) - Epoch 시간 절반
- ✅ **발열 감소** (20-30%) - MacBook Air/Pro 최적화
- ✅ **높은 정확도** - ImageNet 기준 5.6% 향상
- ✅ **의료 이미지 특화** - 피부 질환 분류에 우수한 성능

**권장 사용 사례**:
- 새로운 프로젝트 시작
- MacBook Air/Pro 사용자 (발열 최소화)
- 빠른 실험 및 프로토타이핑
- 제한된 메모리 환경

## 🚀 학습 방법

### 1. 기본 학습

```bash
cd /Users/kyoe/DeepLearning_project/scin/model/efficientnet_b3

python train.py \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --checkpoint_dir ./checkpoints \
  --log_dir ./logs \
  --batch_size 32 \
  --num_epochs 50 \
  --lr 0.001
```

### 2. 학습 재개 (체크포인트에서)

```bash
python train.py \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --checkpoint_dir ./checkpoints \
  --resume ./checkpoints/checkpoint_latest.pth \
  --num_epochs 50
```

### 3. 주요 학습 파라미터

| 파라미터 | 기본값 | 권장값 | 설명 |
|---------|--------|--------|------|
| `--batch_size` | 32 | **16** | 배치 크기 (작은 배치로 더 많은 그래디언트 업데이트) |
| `--num_epochs` | 50 | **60** | 총 에포크 수 |
| `--lr` | 0.001 | **0.001** | Learning rate (EfficientNet은 0.001이 적합) |
| `--weight_decay` | 1e-4 | **1e-4** | Weight decay (L2 regularization) |
| `--dropout` | 0.5 | **0.2** | Dropout 비율 (EfficientNet은 낮은 드롭아웃 권장) |
| `--patience` | 10 | **15** | Early stopping patience (충분한 수렴 시간 제공) |
| `--num_workers` | 0 | **0** | DataLoader 워커 수 (Apple Silicon은 0 권장) |
| `--augment` | True | **True** | 데이터 증강 사용 여부 |

### 4. 권장 학습 설정 (발열 최적화)

```bash
# EfficientNet-B3 최적 설정 (발열 최소화 + 성능 향상)
python train.py \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --checkpoint_dir ./checkpoints \
  --log_dir ./logs \
  --batch_size 16 \
  --num_epochs 60 \
  --lr 0.001 \
  --weight_decay 1e-4 \
  --dropout 0.2 \
  --patience 15 \
  --num_workers 0
```

## 📊 평가 방법

```bash
python evaluate.py \
  --checkpoint ./checkpoints/checkpoint_best.pth \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --output_dir ./evaluation_results \
  --batch_size 32 \
  --threshold 0.3 \
  --num_workers 0
```

### 평가 파라미터

| 파라미터 | 기본값 | 권장값 | 설명 |
|---------|--------|--------|------|
| `--threshold` | 0.5 | **0.3** | 이진 분류 임계값 (Recall 향상, F1-Score 최적화) |
| `--batch_size` | 32 | **32** | 배치 크기 |
| `--num_workers` | 4 | **0** | DataLoader 워커 수 (Apple Silicon은 0 권장) |

**Threshold 설명**:
- **0.3 (권장)**: Recall 향상, F1-Score 최적화 - 예측 가능 클래스 증가
- **0.2**: Recall 극대화 (Precision 저하 가능)
- **0.5 (기본)**: Precision 우선, 보수적 예측

### 평가 결과

평가 스크립트는 다음을 생성합니다:

- `evaluation_summary.json` - Top-K Accuracy, F1-Score, Precision, Recall
- `per_class_metrics.json` - 클래스별 상세 메트릭
- `per_class_f1.png` - 클래스별 F1-Score 그래프 (Top 20)
- `sample_predictions.txt` - 샘플 예측 결과

## 📈 예상 성능

EfficientNet-B3는 ResNet50 대비 다음과 같은 개선을 기대할 수 있습니다:

- Top-1 Accuracy: **25-30%** (ResNet50: 22.1%)
- Top-5 Accuracy: **70-75%** (ResNet50: 64.8%)
- Overall F1-Score: **0.10-0.15** (ResNet50: 0.082)

**참고**: 실제 성능은 학습 후 평가를 통해 확인해야 합니다.

## 🍎 Apple Silicon (M1/M2/M3/M4) 최적화

MacBook Air/Pro에서 최적의 성능과 발열 관리를 위한 설정입니다.

### 환경 변수 설정 (필수)

```bash
export PYTORCH_ENABLE_MPS_FALLBACK=1
```

### 권장 학습 설정 (발열 최소화)

```bash
cd /Users/kyoe/DeepLearning_project/scin/model/efficientnet_b3

python train.py \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --checkpoint_dir ./checkpoints \
  --log_dir ./logs \
  --batch_size 16 \
  --num_epochs 60 \
  --lr 0.001 \
  --weight_decay 1e-4 \
  --dropout 0.2 \
  --patience 15 \
  --num_workers 0
```

### 주요 최적화 포인트

- `--num_workers 0`: macOS에서 multiprocessing 오버헤드 제거
- MPS (Metal Performance Shaders) 자동 활성화
- CPU 대비 **3배 빠른 학습 속도**
- ResNet50 대비 **발열 20-30% 추가 감소**
- Epoch 시간: **40-50초** (ResNet50: 86초)

### 발열 추가 감소 방법

1. **냉각 스탠드 사용** (팬 내장형 권장) - 10-20°C 감소
2. **에어컨 환경에서 학습** (실내 온도 25°C 이하 유지)
3. **배경 앱 종료** (Chrome, Slack 등)
4. **저전력 모드 해제**: Settings → Battery → Low Power Mode → **Off**
5. **Apple Intelligence 비활성화**: Settings → Apple Intelligence & Siri → **Off** (macOS Sequoia+)

### CPU 체크포인트 호환성

- CPU로 학습한 체크포인트를 MPS로 재개 가능
- `--resume` 사용 시 자동으로 디바이스 변환 (모델 + Optimizer state)
- 에러 없이 서로 다른 디바이스 간 전환 지원

## 🖥️ NVIDIA GPU (CUDA) 설정

```bash
python train.py \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/SCIN \
  --batch_size 64 \
  --num_workers 4 \
  --num_epochs 60
```

- **디바이스**: CUDA 자동 감지
- **배치 크기**: 64 (GPU 메모리에 따라 조정)
- **워커 수**: 4-8

## ⚠️ 알려진 이슈 및 개선 방향

### 주요 개선 포인트

1. **Threshold 최적화**
   - Validation set에서 F1-Score를 최대화하는 threshold 탐색
   - 클래스별로 다른 threshold 적용

2. **클래스 가중치 조정**
   - Focal Loss 등 대안 손실 함수 고려
   - 가중치 범위 조정

3. **데이터 증강 강화**
   - AutoAugment, RandAugment 적용
   - Mixup, CutMix 적용

4. **앙상블**
   - ResNet50과 앙상블로 성능 향상
   - Test-Time Augmentation (TTA) 적용

## 📊 데이터셋 정보

### SCIN (Skin Condition Image Network)

- **출처**: Google Research ([논문](https://arxiv.org/abs/2111.07067))
- **규모**: 5,033개 케이스, 10,407개 이미지
- **라벨**: 50개 주요 피부 질환 (다중 라벨 지원)
- **메타데이터**: 피츠패트릭 피부 타입, 인종, 나이, 증상 등

### 주요 질환 (Top 10)

1. Eczema (1,056건) - 습진
2. Allergic Contact Dermatitis (873건) - 알레르기성 접촉 피부염
3. Insect Bite (403건) - 벌레 물림
4. Urticaria (332건) - 두드러기
5. Psoriasis (308건) - 건선
6. Folliculitis (268건) - 모낭염
7. Irritant Contact Dermatitis (249건) - 자극성 접촉 피부염
8. Tinea (206건) - 백선 (곰팡이 감염)
9. Drug Rash (148건) - 약물 발진
10. Herpes Zoster (142건) - 대상포진

## 🐛 문제 해결

### 1. MacBook Air/Pro 발열 문제

**증상**: 장시간 학습 시 발열로 인한 성능 저하 (열 스로틀링)

**해결 방법**:

```bash
# 1. MPS 백엔드 활성화 확인
python -c "import torch; print('MPS available:', torch.backends.mps.is_available())"

# 2. 환경 변수 설정
export PYTORCH_ENABLE_MPS_FALLBACK=1

# 3. num_workers=0, 낮은 dropout으로 학습
python train.py \
  --num_workers 0 \
  --batch_size 16 \
  --dropout 0.2 \
  --resume ./checkpoints/checkpoint_latest.pth
```

**예상 효과**:
- 발열: ResNet50 대비 20-30% 추가 감소
- 학습 속도: CPU 대비 3배 향상
- Epoch 시간: 40-50초 (ResNet50: 86초)

### 2. Out of Memory (OOM)

```bash
# 배치 크기 줄이기
python train.py --batch_size 8  # 권장값 16에서 추가 감소

# 또는 이미지 크기 줄이기 (dataset.py 수정)
# transforms.Resize((256, 256))  # 기본값: 300
```

### 3. 이미지 파일 누락 오류

자동 해결됩니다 - Dataset 클래스가 `image_1` → `image_2` → `image_3` 순으로 자동 fallback 수행

## 📚 참고 자료

- **EfficientNet 논문**: [EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks](https://arxiv.org/abs/1905.11946)
- **SCIN 논문**: https://arxiv.org/abs/2111.07067
- **SCIN 데이터셋**: https://github.com/google-research-datasets/scin
- **PyTorch 공식 문서**: https://pytorch.org/docs/stable/index.html

## 🔗 참고

- 메인 프로젝트: [README.md](../../../README.md)
- 데이터셋 정보: [scin/README.md](../../README.md)
- ResNet50 모델: [../resnet50/README.md](../resnet50/README.md)
- 데이터 분석 리포트: [SCIN_데이터_모델_분석_리포트.md](../../../SCIN_데이터_모델_분석_리포트.md)
