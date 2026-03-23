import open_clip
import torch
import numpy as np
from PIL import Image
from typing import Union
import io

MODEL_ID = "Marqo/marqo-fashionSigLIP"

class CLIPService:
    def __init__(self):
        from transformers import AutoProcessor
        print(f"Loading {MODEL_ID}...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            "hf-hub:Marqo/marqo-fashionSigLIP"
        )
        self.processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)
        self.model.eval()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = self.model.to(self.device)
        print(f"marqo-fashionSigLIP loaded on {self.device}")

    def embed_image(self, image: Union[Image.Image, bytes]) -> list:
        if isinstance(image, bytes):
            image = Image.open(io.BytesIO(image)).convert("RGB")
        image = image.convert("RGB")
        tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            emb = self.model.encode_image(tensor)
            emb = emb / emb.norm(dim=-1, keepdim=True)

        return emb.cpu().numpy().flatten().tolist()

    def embed_texts(self, texts: list) -> np.ndarray:
        """Embed multiple texts using the HuggingFace processor."""
        inputs = self.processor(text=texts, return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            embs = self.model.encode_text(inputs["input_ids"])
            embs = embs / embs.norm(dim=-1, keepdim=True)
        return embs.cpu().numpy()

    def embed_text(self, text: str) -> list:
        """Embed a single text string."""
        return self.embed_texts([text])[0].tolist()


_clip_service = None

def get_clip_service() -> CLIPService:
    global _clip_service
    if _clip_service is None:
        _clip_service = CLIPService()
    return _clip_service