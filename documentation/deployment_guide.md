# Medicus Care™ — Production Deployment & Self-Hosting Guide

> **Product:** Medicus Care (Your AI Healthcare Companion)  
> **Parent Brand:** Medicus Labs™  
> **Proposed Production Domain:** [care.medicuslabs.app](https://care.medicuslabs.app)  
> **Primary Website:** [medicuslabs.app](https://medicuslabs.app)  
> **Author:** Mallikarjun R / Medicus Labs™ Engineering  
> **Target Cloud Host:** AWS EC2 `g5.xlarge` (Ubuntu 22.04 LTS, NVIDIA A10G 24GB VRAM) or Apple Silicon Mac Studio

---

## 1. Prerequisites & System Requirements

### Hardware Requirements
* **Production GPU (Live Video & Lip-Sync)**:
  * Instance: AWS EC2 `g5.xlarge` (or `g6.xlarge` / `g4dn.xlarge`).
  * GPU: NVIDIA A10G (24 GB VRAM) with CUDA 11.8+ and cuDNN 8.6+.
  * Storage: ≥ 100 GB NVMe SSD (to host OS, Docker images, and model weights).
  * System RAM: 16 GB+ ECC RAM.
* **Development Mode (Apple Silicon Mac)**:
  * Apple Silicon Mac (M1/M2/M3/M4 with ≥ 16 GB Unified Memory).
  * macOS 14+ (Sonoma / Sequoia).
  * Runs in CPU/MPS fallback mode for video generation and local Ollama inference.

### Software Prerequisites
* **Docker & Docker Compose** (v24.0+) with `nvidia-container-toolkit`.
* **Python** 3.10+ and **Node.js** 20.9.0+.
* **Ollama** (v0.3.0+) for local/free LLM serving (`ollama pull qwen2.5:7b`).

---

## 2. Environment Configuration

Clone or navigate to the project directory:
```bash
cd /Users/malikarjunr/medicus-care
```

Create production configuration (`.env` or `.env.prod`):
```bash
# General
ENVIRONMENT=production
DEBUG=false
FRONTEND_URL=https://care.medicuslabs.app
BACKEND_URL=https://care.medicuslabs.app/api

# Database & Cache (Isolated from parent Medicus Labs DB)
DATABASE_URL=postgresql+asyncpg://care_admin:SecurePass2026!@postgres:5432/medicus_care_db
REDIS_URL=redis://redis:6379/0

# LLM Inference (Local Ollama / vLLM / Claude)
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:7b
OPENAI_BASE_URL=http://localhost:11434/v1

# Speech & Voice (AI4Bharat Indic / Whisper / Edge-TTS)
STT_PROVIDER=whisper
WHISPER_MODEL=large-v3-turbo
TTS_PROVIDER=edge-tts

# Avatar Engine
AVATAR_ENGINE=musetalk
AVATAR_RESOLUTION=512
AVATAR_FPS=25
MUSETALK_PATH=models/MuseTalk
FACE_RESTORE=off

# Security & Tokens
SECRET_KEY=<generate_with_python_secrets_token_hex_32>
JWT_SECRET_KEY=<generate_with_python_secrets_token_hex_32>
AUTH_COOKIE_SECURE=true
CORS_ORIGINS=https://care.medicuslabs.app,https://medicuslabs.app
```

---

## 3. Knowledge Base & RAG Ingestion Setup

Before launching the consultation suite, execute the RAG ingestion pass across certified medical and psychological repositories:

```bash
# Ingest MedQuAD (NIH Clinical Guides), ESConv (Emotional Support), and CACTUS (CBT)
cd backend
python -c "
from app.services.rag_service import rag_service
print('Ingesting MedQuAD medical knowledge...')
rag_service.ingest_medquad(max_records=500)
print('Ingesting ESConv mental wellness dialogues...')
rag_service.ingest_esconv(max_dialogues=200)
print('Ingesting CACTUS CBT protocols...')
rag_service.ingest_cactus_and_psy_insight()
print('Ingestion Complete:', rag_service.get_stats())
"
```

---

## 4. Local Development Startup (Apple Silicon macOS)

1. **Launch Local LLM (Ollama)**:
   ```bash
   ollama run qwen2.5:7b
   ```

2. **Launch Backend Service**:
   ```bash
   cd backend
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Launch Frontend Client**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` to consult with Dr. Smit, M.D.

---

## 5. Production Containerized Deployment (AWS EC2 GPU)

1. **Run Deployment Script**:
   ```bash
   bash scripts/deploy-aws.sh
   ```

2. **Or Launch with Docker Compose**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

3. **Verify GPU Passthrough & Container Health**:
   ```bash
   docker exec -it avatar-backend python -c "
   import torch
   print('CUDA Available:', torch.cuda.is_available())
   print('GPU Device:', torch.cuda.get_device_name(0))
   print('VRAM:', round(torch.cuda.get_device_properties(0).total_memory/1024**3, 1), 'GB')
   "
   ```

---

## 6. NGINX Reverse Proxy & DNS Routing

Configure DNS for `care.medicuslabs.app` pointing to the production server IP:

```nginx
server {
    server_name care.medicuslabs.app;

    # SSL Configuration (Certbot / Let's Encrypt)
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/care.medicuslabs.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/care.medicuslabs.app/privkey.pem;

    # Frontend Client
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Real-Time WebSocket Endpoint (Telemedicine Video & Audio)
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

---

## 7. Medical Safety & Telemedicine Compliance Checklist

- [x] Permanent AI Doctor credential badge and identity disclosure displayed on screen.
- [x] Deterministic 4-level triage classifier running inline on every user message.
- [x] One-touch emergency hotline dialing (**112**) active on Level 4 detection.
- [x] Autonomous pharmaceutical prescription patterns strictly blocked.
- [x] Ephemeral audio processing without unconsented storage of patient voice recordings.
- [x] Dedicated database schema completely isolated from parent Medicus Labs dermatology database.
