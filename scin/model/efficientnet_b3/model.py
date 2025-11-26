"""
SCIN 피부 질환 분류 - EfficientNet-B3 모델

EfficientNet-B3 기반 전이 학습 모델
"""

import torch.nn as nn
from efficientnet_pytorch import EfficientNet


class EfficientNetB3Classifier(nn.Module):
    """EfficientNet-B3 기반 다중 라벨 분류기"""

    def __init__(self, num_classes, pretrained=True, dropout=0.5):
        """
        Args:
            num_classes: 출력 클래스 수
            pretrained: ImageNet pretrained 가중치 사용 여부
            dropout: Dropout 비율
        """
        super(EfficientNetB3Classifier, self).__init__()

        # EfficientNet-B3 백본
        if pretrained:
            self.backbone = EfficientNet.from_pretrained('efficientnet-b3', num_classes=num_classes)
        else:
            self.backbone = EfficientNet.from_name('efficientnet-b3', num_classes=num_classes)

        # Dropout 설정 (EfficientNet 내부 dropout 오버라이드)
        self.backbone._dropout = nn.Dropout(p=dropout)

    def forward(self, x):
        """
        Args:
            x: (B, 3, H, W) 이미지 텐서

        Returns:
            (B, num_classes) 로짓
        """
        return self.backbone(x)
