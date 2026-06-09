FROM python:3.10-slim

WORKDIR /app

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

# Bake buffalo_l into the image (~300MB) so Render cold starts don't re-download.
RUN python -c "\
from insightface.app import FaceAnalysis; \
m = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
m.prepare(ctx_id=0, det_size=(640, 640)); \
print('buffalo_l model cached in image')"

COPY main.py start.sh ./
RUN chmod +x start.sh

ENV PORT=8000
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT','8000') + '/health')" || exit 1

CMD ["./start.sh"]
