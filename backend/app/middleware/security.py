"""
Cross-cutting middleware: security headers, request/response logging,
and per-request correlation IDs.

`request_id_var` is a context variable read by the logging layer so every
log line emitted while serving a request includes the same `request_id`,
which lets you trace a single user action through STT → LLM → TTS →
animation across log streams.
"""

import contextvars
import logging
import time
import uuid
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import settings

logger = logging.getLogger(__name__)

# ContextVar so async tasks spawned during the request (background TTS jobs,
# DB writes via to_thread, etc.) inherit the correlation id automatically.
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")


def current_request_id() -> str:
    """Return the request id of the currently-serving request, or '-'."""
    return request_id_var.get()


# Content Security Policy. Keep `'unsafe-inline'` on styles because Tailwind
# injects a runtime stylesheet; everything else is locked down to same-origin.
# `connect-src` allows WSS because the chat surface streams over WebSocket.
# When you move to a CDN for static assets or fonts, add it here explicitly.
_BASE_CSP = (
    "default-src 'self'; "
    "img-src 'self' data: blob: https:; "
    "media-src 'self' blob: https:; "
    "style-src 'self' 'unsafe-inline'; "
    "font-src 'self' data: https:; "
    "script-src 'self'; "
    "connect-src 'self' ws: wss: https:; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)


class SecurityHeadersMiddleware:
    """Apply hardening headers to every response.

    Written as a plain ASGI middleware rather than `BaseHTTPMiddleware`: the
    latter runs the downstream app in a separate task and re-streams every
    body through an in-memory queue, which costs measurable latency and
    throughput on every single request for no benefit here.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        # Built once: the values never change while the process is running.
        headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            # X-XSS-Protection is obsolete in modern browsers and a CSP is the
            # current defense, but legacy intermediaries still look for it.
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
            "Content-Security-Policy": _BASE_CSP,
            # Modern Spectre/XS-Leaks mitigations
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-site",
        }
        # HSTS only when actually behind TLS — Strict-Transport-Security on a
        # plain-HTTP response will pin a broken policy if the proxy is later
        # misconfigured. Production environments terminate TLS upstream.
        if settings.ENVIRONMENT == "production":
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        self._headers = tuple(headers.items())

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                out = MutableHeaders(scope=message)
                for name, value in self._headers:
                    out[name] = value
            await send(message)

        await self.app(scope, receive, send_with_headers)


class RequestLoggingMiddleware:
    """
    Assign each request a UUID, propagate it via contextvars so downstream
    logs include it, and log a single structured line on completion.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Honor an upstream-provided X-Request-ID (a load balancer or sidecar
        # may already have one); otherwise mint a fresh hex id. The token form
        # is short enough to be human-friendly in logs.
        incoming = None
        for name, value in scope["headers"]:
            if name == b"x-request-id":
                incoming = value.decode("latin-1")
                break
        request_id = incoming if incoming and len(incoming) <= 64 else uuid.uuid4().hex[:16]
        token = request_id_var.set(request_id)
        start = time.time()
        status_code = 0
        duration = 0.0

        async def send_with_ids(message: Message) -> None:
            nonlocal status_code, duration
            if message["type"] == "http.response.start":
                status_code = message["status"]
                duration = time.time() - start
                out = MutableHeaders(scope=message)
                out["X-Response-Time"] = f"{duration:.3f}s"
                out["X-Request-ID"] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_ids)
        finally:
            request_id_var.reset(token)

        client = scope.get("client")
        # logger.info with extras is consumed by the JSON formatter (see
        # app.logging_config) and emerges as a single structured record.
        if logger.isEnabledFor(logging.INFO):
            logger.info(
                "request_complete",
                extra={
                    "request_id": request_id,
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status_code,
                    "duration_ms": round(duration * 1000, 2),
                    "client": client[0] if client else "-",
                },
            )
