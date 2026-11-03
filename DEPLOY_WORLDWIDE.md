# Deploy MediCare for public access

MediCare is a browser app, so patients can use it from current iPhone/iPad,
Android, Windows, macOS, and Linux browsers. Speech input, camera access, and
autoplay require an HTTPS page and the user's browser permission. This guide
deploys the existing app and its actual server-side models; the models do not
run on every patient's phone or laptop.

## Hosting requirements

- A Linux GPU server with NVIDIA drivers and NVIDIA Container Toolkit.
  Reserve at least 24 GB VRAM for MuseTalk plus the local 3B LLM; more headroom
  is useful for concurrent consultations.
- A domain you control, pointed with an A/AAAA record at the server.
- Inbound TCP ports 80 and 443 open. Caddy obtains and renews HTTPS
  certificates and routes API and WebSocket traffic on the same domain.
- Persistent disk for PostgreSQL, Ollama weights, doctor animation weights,
  uploads, and conversation data. A single GPU node supports worldwide access,
  but it is not a multi-region deployment; distance from the server affects
  response latency.

## First deployment

1. Clone the repository onto the GPU host. Install Docker Compose v2.24+ and the
   NVIDIA Container Toolkit, then verify `docker run --rm --gpus all
   nvidia/cuda:12.1.1-base-ubuntu22.04 nvidia-smi` works.
2. Copy `.env.prod.example` to `.env.prod`. Set `DOMAIN`, `FRONTEND_URL`,
   `BACKEND_URL`, `WS_URL`, and `CORS_ORIGINS` to the real HTTPS domain. Set
   unique secrets and a strong database password; for example, generate the
   two application secrets with `openssl rand -hex 32`. Keep `.env.prod` off
   GitHub.
3. Provision the MuseTalk checkout and pretrained weights on the GPU host.
   Create the setup environment and run the existing installer:

   ```sh
   python3 -m venv backend/venv
   SKIP_MUSETALK_REQUIREMENTS=1 bash scripts/setup_musetalk.sh
   ```

   The installer downloads about 8.8 GB of weights into
   `backend/models/MuseTalk`, which stays outside Git and is mounted into the
   GPU containers.
4. Build and start the production stack:

   ```sh
   docker compose --env-file .env.prod \
     -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

5. Download the configured local LLM once:
   `docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml exec ollama ollama pull qwen2.5:3b`.
6. Check `https://$DOMAIN/health` for API and database status. Then run a real
   English and Kannada consultation from an HTTPS browser, confirming the
   actual generated reply, voice, and model-produced video before sharing the
   link.

The production profile builds a CUDA-enabled backend image, runs Ollama and
MuseTalk on the server GPU, uses Edge neural TTS with the existing male/female
voice selection, and serves HTTPS through Caddy. PostgreSQL, Redis, Ollama,
the API, and the web UI are not exposed directly to the public internet.
Only Caddy publishes ports 80 and 443.

## Model and data notes

The current live synchronized animation engine is MuseTalk. The other cloned
research checkouts are not automatically chained into consultations. Model
weights are large, have their own licenses, and are excluded from GitHub; the
GPU host must provision the selected model's weights. The public site can load
on any modern device, but real-time video generation happens on the server.

The medical reference index is included in `database/rag_store`. The source
XML corpus in `medicus-ai-data` is local-only, so production read/query works
from the committed index, while the admin reindex action requires separately
provisioning that source corpus on the server.

For multiple GPU regions or high concurrency, replace the single-node local
volumes with managed PostgreSQL/object storage, shared queues, and a GPU worker
pool. That requires capacity, DNS, and cloud account configuration and is not
created by this repository alone.
