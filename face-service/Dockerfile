FROM python:3.10-slim

WORKDIR /app

ARG INSIGHTFACE_MODEL=buffalo_sc
ENV INSIGHTFACE_MODEL=${INSIGHTFACE_MODEL}
ENV INSIGHTFACE_DET_SIZE=480

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download model weights into the image (size depends on model pack).
RUN python -c "\
import os; \
from insightface.app import FaceAnalysis; \
name = os.environ.get('INSIGHTFACE_MODEL', 'buffalo_sc'); \
det = int(os.environ.get('INSIGHTFACE_DET_SIZE', '480')); \
m = FaceAnalysis(name=name, providers=['CPUExecutionProvider']); \
m.prepare(ctx_id=0, det_size=(det, det)); \
print(f'{name} model cached in image (det_size={det})')"

COPY main.py start.sh ./
RUN chmod +x start.sh

ENV PORT=8000
ENV USE_GUNICORN=0
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT','8000') + '/health')" || exit 1

CMD ["./start.sh"]
