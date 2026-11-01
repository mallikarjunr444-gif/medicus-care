FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# Install system dependencies (ffmpeg for video pipeline, curl for healthcheck)
RUN set -eux; \
    apt_ok=0; \
    for attempt in 1 2 3 4 5; do \
        if apt-get update -o Acquire::Retries=5 -o Acquire::http::Timeout=30 \
            && apt-get install -y \
                -o Acquire::Retries=5 \
                -o Acquire::http::Timeout=30 \
                ffmpeg \
                libsm6 \
                libxext6 \
                libxrender-dev \
                libgomp1 \
                git \
                wget \
                curl; \
        then apt_ok=1; break; fi; \
        echo "apt attempt ${attempt} failed; retrying in $((attempt * 15))s" >&2; \
        sleep $((attempt * 15)); \
    done; \
    [ "$apt_ok" = 1 ] || { echo "apt failed after 5 attempts" >&2; exit 1; }; \
    rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install CPU-only PyTorch (Apple Silicon Mac — no CUDA)
RUN pip install --no-cache-dir \
    torch \
    torchvision \
    torchaudio \
    --index-url https://download.pytorch.org/whl/cpu

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /tmp/avatars /tmp/videos /tmp/audio voice_profiles

# Entrypoint: run migrations then start server
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 8000

# Health check — longer start-period for model loading on first boot
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run application via entrypoint (handles migrations automatically)
CMD ["./entrypoint.sh"]
