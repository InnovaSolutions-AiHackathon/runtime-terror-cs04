import open_clip
import torch
import numpy as np
from PIL import Image
from typing import Union
import io

class CLIPService:
    def __init__(self, model_name: str = "ViT-B-32", pretrained: str = "openai"):
        print(f"Loading CLIP model {model_name}...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            model_name, pretrained=pretrained
        )
        self.model.eval()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = self.model.to(self.device)
        print(f"CLIP loaded on {self.device}")

    def embed_image(self, image: Union[Image.Image, bytes]) -> np.ndarray:
        """Convert a PIL image or bytes into a CLIP embedding vector."""
        if isinstance(image, bytes):
            image = Image.open(io.BytesIO(image)).convert("RGB")
        elif not isinstance(image, Image.Image):
            raise ValueError("Input must be PIL Image or bytes")

        image = image.convert("RGB")
        tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            embedding = self.model.encode_image(tensor)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)  # normalize

        return embedding.cpu().numpy().flatten().tolist()

    def embed_text(self, text: str) -> np.ndarray:
        """Convert text into a CLIP embedding vector."""
        tokenizer = open_clip.get_tokenizer("ViT-B-32")
        tokens = tokenizer([text]).to(self.device)

        with torch.no_grad():
            embedding = self.model.encode_text(tokens)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)

        return embedding.cpu().numpy().flatten().tolist()

# Singleton instance
_clip_service = None

def get_clip_service() -> CLIPService:
    global _clip_service
    if _clip_service is None:
        _clip_service = CLIPService()
    return _clip_service
