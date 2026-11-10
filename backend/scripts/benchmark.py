"""Small HTTP load benchmark for the API.

Starts nothing itself: point it at a running server.

    uvicorn main:app --port 8765 &
    python scripts/benchmark.py --base http://127.0.0.1:8765 --out bench.json

Reports requests/second and latency percentiles per endpoint, at a fixed
concurrency, and prints a JSON summary that two runs can be compared with.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time

import httpx


async def hit(client: httpx.AsyncClient, method: str, url: str, headers=None, json_body=None):
    t0 = time.perf_counter()
    try:
        r = await client.request(method, url, headers=headers, json=json_body)
        ok = r.status_code < 400
    except Exception:
        ok = False
    return (time.perf_counter() - t0) * 1000, ok


async def run(client, name, method, url, total, concurrency, headers=None, json_body=None):
    sem = asyncio.Semaphore(concurrency)
    lat: list[float] = []
    errors = 0

    async def one():
        nonlocal errors
        async with sem:
            ms, ok = await hit(client, method, url, headers, json_body)
            lat.append(ms)
            if not ok:
                errors += 1

    # warm-up
    for _ in range(20):
        await hit(client, method, url, headers, json_body)
    t0 = time.perf_counter()
    await asyncio.gather(*(one() for _ in range(total)))
    wall = time.perf_counter() - t0
    lat.sort()
    q = lambda p: lat[min(len(lat) - 1, int(len(lat) * p))]
    return {
        "endpoint": name,
        "requests": total,
        "errors": errors,
        "rps": round(total / wall, 1),
        "p50_ms": round(q(0.50), 2),
        "p95_ms": round(q(0.95), 2),
        "p99_ms": round(q(0.99), 2),
        "mean_ms": round(statistics.fmean(lat), 2),
    }


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8765")
    ap.add_argument("--n", type=int, default=2000)
    ap.add_argument("--c", type=int, default=32)
    ap.add_argument("--out", default="")
    a = ap.parse_args()

    limits = httpx.Limits(max_connections=a.c * 2, max_keepalive_connections=a.c * 2)
    async with httpx.AsyncClient(base_url=a.base, limits=limits, timeout=30) as client:
        g = await client.post("/api/v1/users/guest")
        token = g.json().get("access_token", "") if g.status_code < 400 else ""
        auth = {"Authorization": f"Bearer {token}"}
        plan = [
            ("GET /", "GET", "/", None, None, a.n),
            ("GET /health", "GET", "/health", None, None, a.n),
            ("GET /api/v1/users/me (auth+DB)", "GET", "/api/v1/users/me", auth, None, a.n),
            ("GET /api/v1/avatars/ (auth+DB list)", "GET", "/api/v1/avatars/", auth, None, a.n),
            ("POST /api/v1/users/guest (DB write)", "POST", "/api/v1/users/guest", None, None, max(200, a.n // 10)),
        ]
        results = []
        for name, method, url, headers, body, n in plan:
            r = await run(client, name, method, url, n, a.c, headers, body)
            results.append(r)
            print(f"{r['endpoint']:<40} {r['rps']:>8} rps  p50 {r['p50_ms']:>7}  p95 {r['p95_ms']:>7}  p99 {r['p99_ms']:>7}  err {r['errors']}")
    if a.out:
        json.dump(results, open(a.out, "w"), indent=2)


if __name__ == "__main__":
    asyncio.run(main())
