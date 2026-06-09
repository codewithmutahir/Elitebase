import json

import cv2
import insightface
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "buffalo_l"
model = None

VERIFY_THRESHOLD = 0.45


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


@app.on_event("startup")
async def startup():
    global model
    print(
        f"[startup] Loading InsightFace model '{MODEL_NAME}' "
        f"(~300MB download on first run — may take a few minutes)..."
    )
    model = insightface.app.FaceAnalysis(
        name=MODEL_NAME,
        providers=["CPUExecutionProvider"],
    )
    model.prepare(ctx_id=0, det_size=(640, 640))
    print(f"[startup] Model '{MODEL_NAME}' ready.")


def _decode_upload(contents: bytes) -> np.ndarray:
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
    return img


def _get_single_face(img: np.ndarray):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

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
        contents = await upload.read()
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
    contents = await file.read()
    img = _decode_upload(contents)

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

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
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": MODEL_NAME,
        "verify_threshold": VERIFY_THRESHOLD,
    }
