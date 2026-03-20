import os
import io
import sys
from PIL import Image
from typing import List, Tuple
from unittest.mock import MagicMock

# Mock cv2 to prevent import errors
sys.modules['cv2'] = MagicMock()

FALLBACK_LABEL = "product"

class YOLOService:
    def __init__(self, model_path: str = "yolov8n.pt"):
        print("YOLO service initialized (using PIL fallback mode)")

    def detect_and_crop(self, image_bytes: bytes) -> List[Tuple[str, float, Image.Image, List[float]]]:
        """
        Simplified detection using PIL only — no cv2 dependency.
        Returns the full image as a single product crop.
        """
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = image.size

        # Return full image as single crop — CLIP handles visual matching
        return [(FALLBACK_LABEL, 1.0, image, [0, 0, w, h])]

# Singleton
_yolo_service = None

def get_yolo_service() -> YOLOService:
    global _yolo_service
    if _yolo_service is None:
        _yolo_service = YOLOService()
    return _yolo_service