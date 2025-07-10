"""
remote_vision.py
================
Local BLIP *captioning*  +  local CLIP *embedding / probing*

Public helpers
--------------
caption_image(path)  -> str
embed_image(path)    -> list[512]   – cosine‑normalised feature
clip_probe(img | Path | str) -> list[str] – top‑k tags from a vocabulary

Requirements (CPU **or** GPU)
-----------------------------
pip install torch torchvision pillow transformers open_clip_torch timm
"""
from __future__ import annotations

from pathlib import Path
from typing import List

import torch
from PIL import Image
from transformers import (
    BlipProcessor,
    BlipForConditionalGeneration,
    CLIPProcessor,
    CLIPModel,
)
import open_clip

# ─────────────────────────────────────────────────────────────────── Globals
_DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── BLIP caption model ──────────────────────────────────────────────────────
print(f"[BLIP] loading caption model on {_DEVICE} …")
_blip_proc: BlipProcessor = BlipProcessor.from_pretrained(
    "Salesforce/blip-image-captioning-base"
)
_blip: BlipForConditionalGeneration = (
    BlipForConditionalGeneration.from_pretrained(
        "Salesforce/blip-image-captioning-base"
    )
    .to(_DEVICE)
    .eval()
)
print("[BLIP] ready.")


def caption_image(img_path: str | Path) -> str:
    """Return a plain‑English caption for *img_path*."""
    img = Image.open(img_path).convert("RGB")
    batch = _blip_proc(images=img, return_tensors="pt").to(_DEVICE)
    with torch.inference_mode():
        ids = _blip.generate(**batch, max_new_tokens=20)
    return _blip_proc.decode(ids[0], skip_special_tokens=True)


# ── open_clip image‑embedding (512‑D) ───────────────────────────────────────
print("[CLIP] loading ViT‑B/32 weights (open_clip, “openai”) …")
_clip_model, _clip_pre, _ = open_clip.create_model_and_transforms(
    "ViT-B-32", pretrained="openai"
)
_clip_model = _clip_model.to(_DEVICE).eval()
print("[CLIP] ready.")


@torch.inference_mode()
def embed_image(img_path: str | Path) -> List[float]:
    """512‑D unit‑norm CLIP vector (float32 list)."""
    img = _clip_pre(Image.open(img_path).convert("RGB")).unsqueeze(0).to(_DEVICE)
    feat = _clip_model.encode_image(img).float()
    feat /= feat.norm(dim=-1, keepdim=True)
    return feat.squeeze(0).cpu().tolist()  # ≈5 KB


# ── lightweight “logo / size” probe (2nd CLIP via HF) ───────────────────────
print("[CLIP‑HF] loading second ViT‑B/32 for quick text‑vs‑image scoring …")
_clip_hf: CLIPModel = (
    CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(_DEVICE).eval()
)
_clip_processor: CLIPProcessor = CLIPProcessor.from_pretrained(
    "openai/clip-vit-base-patch32"
)
print("[CLIP‑HF] ready.")

# default fallback vocabulary (feel free to extend)
_BRANDS = [
    "Stanley",
    "Nalgene",
    "Rose Petal",
    "Kleenex",
    "Whiskas",
    "Nike",
    "Adidas",
    "Dell",
    "Lenovo",
]
_UNITS = [
    "250 ml",
    "400 ml",
    "500 ml",
    "750 ml",
    "1 litre",
    "10 pcs",
    "12 pcs",
    "24 pcs",
    "1 kg",
]


@torch.no_grad()
def clip_probe(
    image: Image.Image | Path | str,
    vocab: list[str] | tuple[str, ...] | set[str] | None = None,
    top_k: int = 3,
) -> list[str]:
    """
    Return *top_k* strings from *vocab* that CLIP judges most similar to *image*.

    • Accepts list / tuple / set – converts to a de‑duplicated list[str]
    • Silently ignores non‑string items
    • Always pads / truncates tokens, preventing shape errors
    """
    # 1) normalise vocabulary
    if vocab is None:
        vocab = _BRANDS + _UNITS
    vocab = [str(x) for x in vocab if isinstance(x, (str, bytes))]
    vocab = list(dict.fromkeys(vocab))  # de‑duplicate
    if not vocab:
        return []

    # 2) ensure we have a PIL image
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")

    # 3) encode (padding / truncation keeps tensors rectangular)
    batch = _clip_processor(
        text=vocab,
        images=image,
        return_tensors="pt",
        padding=True,
        truncation=True,
    ).to(_DEVICE)

    img_feat = _clip_hf.get_image_features(pixel_values=batch["pixel_values"])
    txt_feat = _clip_hf.get_text_features(input_ids=batch["input_ids"])
    img_feat /= img_feat.norm(dim=-1, keepdim=True)
    txt_feat /= txt_feat.norm(dim=-1, keepdim=True)

    sims = (img_feat @ txt_feat.T).squeeze(0)  # cosine similarity per vocab word
    best = sims.topk(min(top_k, len(vocab))).indices.tolist()
    return [vocab[i] for i in best]
