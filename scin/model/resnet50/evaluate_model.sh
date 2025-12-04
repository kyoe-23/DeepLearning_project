#!/bin/bash

# 기존 모델 평가 스크립트

echo "========================================"
echo "기존 모델 평가 (BCEWithLogitsLoss)"
echo "========================================"
echo ""

python evaluate.py \
  --checkpoint ../../checkpoints/checkpoint_best.pth \
  --data_dir ../../data/scin_processed \
  --image_root ../../data/scin_dataset \
  --output_dir ./evaluation_results_old \
  --batch_size 32 \
  --num_workers 0 \
  --threshold 0.15

echo ""
echo "평가 완료! 결과: ./evaluation_results_old"
