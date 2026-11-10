"""
Per-identity rate limiter.

Identity key precedence:
  1. Authenticated JWT user → `user:<uuid>` (a botnet rotating IPs can't bypass)
  2. Client IP             → `ip:<addr>`     (fallback for anonymous traffic)

Storage backend precedence:
  1. Redis fixed-window counters (shared across replicas) when available
  2. In-process buckets (per-instance only) as a graceful fallback

The shared-Redis path is the production default — in-memory only kicks in
during dev when Redis isn't running, so a single replica still gets sane
limits without a hard dependency.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from typing import Optional

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import settings
from app.services.cache import cache_service
from app.tokens import subject_from_token

logger = logging.getLogger(__name__)

# Paths that should never be rate-limited (operational endpoints + static assets)
_EXEMPT_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/", "/metrics"}
_EXEMPT_PREFIXES = ("/uploads/",)


class _RateLimited(Exception):
    """Internal signal: limit hit. Carries the user-facing detail + headers.

    NOTE: this is deliberately NOT fastapi.HTTPException — an exception
    raised from a middleware never reaches FastAPI's exception handlers
    (they live inside the middleware stack), so it would surface as a 500
    "Internal server error" instead of a 429.
    """

    def __init__(self, detail: str, retry_after: int):
        super().__init__(detail)
        self.detail = detail
        self.retry_after = retry_after


def _extract_user_id(request: Request) -> Optional[str]:
    """Resolve the user_id (`sub`) from the bearer header or auth cookie."""
    token: Optional[str] = None
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(None, 1)[1].strip()
    if not token:
        # Browser sessions authenticate via the httpOnly cookie — without
        # this, every cookie-auth user shared one per-IP bucket (and NAT'd
        # offices starved each other).
        token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if not token or token == "guest":
        # "guest" is a stale sentinel some browsers may still hold from the
        # old shared-demo-user scheme; it was never a real token.
        return None
    return subject_from_token(token)


class RateLimitMiddleware:
    """Fixed-window rate limiter scoped per authenticated user (else per IP).

    Plain ASGI middleware (no `BaseHTTPMiddleware`) so a request does not pay
    for an extra task and body re-streaming just to be counted.
    """

    def __init__(
        self,
        app: Optional[ASGIApp],
        rate_per_minute: Optional[int] = None,
        rate_per_hour: Optional[int] = None,
    ):
        self.app = app
        self.rate_per_minute = rate_per_minute or settings.RATE_LIMIT_PER_MINUTE
        self.rate_per_hour = rate_per_hour or settings.RATE_LIMIT_PER_HOUR
        # Fallback in-process buckets (used only when Redis is unavailable).
        # Deques keep the oldest hit at the left so expiring old hits is
        # O(expired) instead of rebuilding a list of every hit on every request.
        self._minute_buckets: dict[str, deque[float]] = defaultdict(deque)
        self._hour_buckets: dict[str, deque[float]] = defaultdict(deque)
        self._last_prune = 0.0

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]
        if path in _EXEMPT_PATHS or path.startswith(_EXEMPT_PREFIXES):
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        identity = self._identity_key(request)
        try:
            minute_count, _hour_count = await self._consume(identity)
        except _RateLimited as exc:
            response = JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": exc.detail},
                headers={
                    "Retry-After": str(exc.retry_after),
                    "X-RateLimit-Limit": str(self.rate_per_minute),
                    "X-RateLimit-Remaining": "0",
                },
            )
            await response(scope, receive, send)
            return

        limit = str(self.rate_per_minute)
        remaining = str(max(0, self.rate_per_minute - minute_count))
        kind = identity.split(":", 1)[0]

        async def send_with_limits(message: Message) -> None:
            if message["type"] == "http.response.start":
                out = MutableHeaders(scope=message)
                out["X-RateLimit-Limit"] = limit
                out["X-RateLimit-Remaining"] = remaining
                out["X-RateLimit-Identity"] = kind
            await send(message)

        await self.app(scope, receive, send_with_limits)

    # ── identity ──────────────────────────────────────────────────────────────

    @staticmethod
    def _identity_key(request: Request) -> str:
        user_id = _extract_user_id(request)
        if user_id:
            return f"user:{user_id}"
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"

    # ── consumption ───────────────────────────────────────────────────────────

    async def _consume(self, identity: str) -> tuple[int, int]:
        """Returns (current minute count, current hour count) AFTER consuming this hit."""
        # Try Redis first — it's the source of truth in production
        if cache_service.redis is not None:
            try:
                return await self._consume_redis(identity)
            except _RateLimited:
                # A hit limit is the ANSWER, not a backend failure. This must
                # re-raise before the generic handler below: _RateLimited is an
                # Exception subclass, so `except Exception` used to swallow it
                # and fall through to the in-process buckets, whose counters
                # start empty. The effective limit became 2x the configured
                # rate (Redis allowed N, then local allowed another N) and
                # every rejection was mislogged as "Redis unavailable".
                raise
            except Exception as e:
                # If Redis genuinely hiccups, fall through to local — better
                # degraded than 500ing every request.
                logger.warning(f"Redis rate-limit unavailable, falling back to in-process: {e}")

        return self._consume_local(identity)

    async def _consume_redis(self, identity: str) -> tuple[int, int]:
        now = int(time.time())
        minute_window = now // 60
        hour_window = now // 3600
        minute_key = f"rl:m:{identity}:{minute_window}"
        hour_key = f"rl:h:{identity}:{hour_window}"

        # Pipeline so we incr+expire atomically and avoid a round-trip per command
        redis = cache_service.redis
        assert redis is not None
        async with redis.pipeline(transaction=False) as pipe:
            pipe.incr(minute_key, 1)
            pipe.expire(minute_key, 70)  # window + grace
            pipe.incr(hour_key, 1)
            pipe.expire(hour_key, 3700)
            results = await pipe.execute()

        minute_count = int(results[0] or 0)
        hour_count = int(results[2] or 0)

        if minute_count > self.rate_per_minute:
            logger.warning(f"Rate limit exceeded (minute) for {identity}")
            raise _RateLimited("Rate limit exceeded. Try again later.", 60 - (now % 60))
        if hour_count > self.rate_per_hour:
            logger.warning(f"Rate limit exceeded (hour) for {identity}")
            raise _RateLimited("Hourly rate limit exceeded.", 3600 - (now % 3600))
        return minute_count, hour_count

    def _consume_local(self, identity: str) -> tuple[int, int]:
        now = time.time()
        # Periodically drop identities whose window fully expired — without
        # this the dicts grow one entry per client IP forever (memory leak).
        if now - self._last_prune > 60:
            self._last_prune = now
            for buckets, window in ((self._minute_buckets, 60), (self._hour_buckets, 3600)):
                for key in [k for k, v in buckets.items() if not v or now - v[-1] >= window]:
                    del buckets[key]

        minute = self._minute_buckets[identity]
        hour = self._hour_buckets[identity]
        # Oldest hits are on the left; pop only the ones that have expired.
        while minute and now - minute[0] >= 60:
            minute.popleft()
        while hour and now - hour[0] >= 3600:
            hour.popleft()

        if len(minute) >= self.rate_per_minute:
            logger.warning(f"Rate limit exceeded (minute, local) for {identity}")
            raise _RateLimited("Rate limit exceeded. Try again later.", 60)
        if len(hour) >= self.rate_per_hour:
            logger.warning(f"Rate limit exceeded (hour, local) for {identity}")
            raise _RateLimited("Hourly rate limit exceeded.", 3600)

        minute.append(now)
        hour.append(now)
        return len(minute), len(hour)
