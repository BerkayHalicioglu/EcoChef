# ─────────────────────────────────────────────────────────────────────────────
# EcoChef Backend — FastAPI + YOLO + Llama
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim

# Sistem bağımlılıkları
# libgl1 + libglib2.0: OpenCV için
# build-essential + cmake: llama-cpp-python derleme için
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    build-essential \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Önce sadece requirements.txt kopyala → pip katmanı cache'lenir
COPY requirements.txt .

# PyTorch CPU-only (daha küçük image ~700MB, demo için yeterli)
RUN pip install --no-cache-dir \
    torch==2.5.1 \
    torchvision==0.20.1 \
    --extra-index-url https://download.pytorch.org/whl/cpu

# Diğer bağımlılıklar
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodu kopyala
COPY . .

# Model dizini (volume bağlama noktası)
RUN mkdir -p /app/models

# Ortam değişkeni varsayılanları (docker-compose / .env ile ezilir)
ENV YOLO_MODEL_PATH=/app/models/yolov8n.pt
ENV LLM_MODEL_PATH=/app/models/model.gguf

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
