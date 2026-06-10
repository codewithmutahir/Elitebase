import io
import json
import os
import threading
import time
from collections import defaultdict
from typing import List

import cv2
import insightface
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# buffalo_l (~326MB) cannot run on Render free tier (512MB).
# Use buffalo_sc (~16MB) or buffalo_s (~159MB). Set buffalo_l on Oracle Cloud / 2GB+ RAM.
MODEL_NAME = os.environ.get("INSIGHTFACE_MODEL", "buffalo_sc").strip() or "buffalo_sc"
DET_SIZE = int(os.environ.get("INSIGHTFACE_DET_SIZE", "320"))
model = None
_model_lock = threading.Lock()

VERIFY_THRESHOLD = 0.45
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "").strip()
GLOBAL_RATE_LIMIT = 100
GLOBAL_RATE_WINDOW_SECONDS = 60

_rate_limit_buckets: dict[str, list[float]] = defaultdict(list)


def _confidence_level(similarity: float) -> str:
    if similarity >= 0.55:
        return "high"
    if similarity >= VERIFY_THRESHOLD:
        return "medium"
    return "low"


def _normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(embedding))
    if norm == 0:
        raise HTTPException(status_code=400, detail="Invalid embedding")
    return (embedding / norm).astype(np.float32)


def _average_embeddings(embeddings: list[np.ndarray]) -> np.ndarray:
    stacked = np.mean(np.stack(embeddings, axis=0), axis=0)
    return _normalize_embedding(stacked.astype(np.float32))


def _check_global_rate_limit() -> None:
    now = time.time()
    window_start = now - GLOBAL_RATE_WINDOW_SECONDS
    bucket = _rate_limit_buckets["global"]
    _rate_limit_buckets["global"] = [ts for ts in bucket if ts > window_start]

    if len(_rate_limit_buckets["global"]) >= GLOBAL_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    _rate_limit_buckets["global"].append(now)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    if request.url.path == "/health" :
        return await call_next(request)

    if INTERNAL_API_KEY:
        key = request.headers.get("X-Internal-Key", "")
        if key != INTERNAL_API_KEY:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)

    try:
        _check_global_rate_limit()
    except HTTPException as exc:
        return JSONResponse({"error": exc.detail}, status_code=exc.status_code)

    return await call_next(request)


def _ensure_model() -> None:
    """Lazy-load model on first request so the server binds port within 512MB."""
    global model
    if model is not None:
        return

    with _model_lock:
        if model is not None:
            return

        print(
            f"[model] Loading InsightFace '{MODEL_NAME}' "
            f"(det_size={DET_SIZE})..."
        )
        loaded = insightface.app.FaceAnalysis(
            name=MODEL_NAME,
            providers=["CPUExecutionProvider"],
        )
        loaded.prepare(ctx_id=0, det_size=(DET_SIZE, DET_SIZE))
        model = loaded
        print(f"[model] '{MODEL_NAME}' ready.")


async def _read_and_validate_upload(upload: UploadFile) -> bytes:
    contents = await upload.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024 * 1024)}MB.",
        )

    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file") from exc

    return contents


def _decode_upload(contents: bytes) -> np.ndarray:
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    return img


def _get_single_face(img: np.ndarray):
    _ensure_model()
    faces = model.get(img)

    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected")

    if len(faces) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected")

    face = faces[0]

    if face.det_score < 0.5:
        raise HTTPException(status_code=400, detail="Face not clear enough")

    return face


def _collect_uploads(
    files: List[UploadFile] | None,
    file: UploadFile | None,
) -> list[UploadFile]:
    uploads: list[UploadFile] = []
    if files:
        uploads.extend(files)
    if file is not None:
        uploads.append(file)
    return [item for item in uploads if item.filename or item.size]


@app.post("/extract-embedding")
async def extract_embedding(
    files: List[UploadFile] | None = File(None),
    file: UploadFile | None = File(None),
):
    uploads = _collect_uploads(files, file)
    if not uploads:
        raise HTTPException(
            status_code=400,
            detail="At least one image file is required (field: file or files).",
        )

    embeddings: list[np.ndarray] = []
    det_scores: list[float] = []
    first_bbox: list[float] | None = None

    for index, upload in enumerate(uploads):
        contents = await _read_and_validate_upload(upload)
        img = _decode_upload(contents)
        try:
            face = _get_single_face(img)
        except HTTPException as exc:
            print(
                f"[extract-embedding] sample={index + 1}/{len(uploads)} "
                f"{exc.status_code}: {exc.detail} "
                f"(bytes={len(contents)}, shape={img.shape})"
            )
            raise

        embeddings.append(face.embedding.astype(np.float32))
        det_scores.append(float(face.det_score))
        if first_bbox is None:
            first_bbox = face.bbox.tolist()

    averaged = _average_embeddings(embeddings)
    samples_used = len(embeddings)

    print(
        f"[extract-embedding] samples_used={samples_used} "
        f"avg_det_score={float(np.mean(det_scores)):.4f}"
    )

    return {
        "embedding": averaged.tolist(),
        "confidence": float(np.mean(det_scores)),
        "bbox": first_bbox,
        "samples_used": samples_used,
    }


@app.post("/verify-face")
async def verify_face(
    file: UploadFile = File(...),
    stored_embedding: str = Form(...),
):
    contents = await _read_and_validate_upload(file)
    img = _decode_upload(contents)

    _ensure_model()
    faces = model.get(img)

    if len(faces) == 0:
        return {
            "verified": False,
            "reason": "no_face",
            "confidence": 0.0,
            "confidence_level": "low",
            "threshold": VERIFY_THRESHOLD,
        }

    if len(faces) > 1:
        return {
            "verified": False,
            "reason": "multiple_faces",
            "confidence": 0.0,
            "confidence_level": "low",
            "threshold": VERIFY_THRESHOLD,
        }

    live_face = faces[0]
    if live_face.det_score < 0.5:
        return {
            "verified": False,
            "reason": "face_not_clear",
            "confidence": float(live_face.det_score),
            "confidence_level": "low",
            "threshold": VERIFY_THRESHOLD,
        }

    live_embedding = live_face.embedding

    try:
        stored = np.array(json.loads(stored_embedding), dtype=np.float32)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid stored_embedding JSON: {exc}"
        ) from exc

    if stored.shape != live_embedding.shape:
        raise HTTPException(
            status_code=400,
            detail=f"Embedding size mismatch: expected {live_embedding.shape}, got {stored.shape}",
        )

    norm_live = np.linalg.norm(live_embedding)
    norm_stored = np.linalg.norm(stored)
    if norm_live == 0 or norm_stored == 0:
        return {
            "verified": False,
            "reason": "invalid_embedding",
            "confidence": 0.0,
            "confidence_level": "low",
            "threshold": VERIFY_THRESHOLD,
        }

    similarity = float(
        np.dot(live_embedding, stored) / (norm_live * norm_stored)
    )
    verified = bool(similarity >= VERIFY_THRESHOLD)
    level = _confidence_level(similarity)

    print(
        f"[verify] similarity={similarity:.4f} "
        f"threshold={VERIFY_THRESHOLD} "
        f"level={level} "
        f"result={'PASS' if verified else 'FAIL'}"
    )

    return {
        "verified": verified,
        "confidence": similarity,
        "confidence_level": level,
        "threshold": VERIFY_THRESHOLD,
    }


@app.get("/health")
async def health():
    # Always return ok so Render health checks pass before first face request.
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": MODEL_NAME,
        "det_size": DET_SIZE,
        "verify_threshold": VERIFY_THRESHOLD,
    }
