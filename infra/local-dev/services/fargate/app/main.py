from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Fargate Service", version="0.1.0")

_SAMPLE_ORDERS: List[Dict[str, Any]] = [
    {
        "id": "ord_1001",
        "status": "processing",
        "total": 48.95,
        "currency": "USD",
        "updated_at": datetime(2024, 7, 21, 10, 15, tzinfo=timezone.utc).isoformat(),
    },
    {
        "id": "ord_1002",
        "status": "fulfilled",
        "total": 12.0,
        "currency": "USD",
        "updated_at": datetime(2024, 8, 2, 8, 45, tzinfo=timezone.utc).isoformat(),
    },
]


def _context(request: Request) -> Dict[str, Any]:
    return {
        "tenant": request.headers.get("x-guidogerb-tenant", "unknown"),
        "username": request.headers.get("x-guidogerb-username", "anonymous"),
        "target": request.headers.get("x-guidogerb-target", "fargate"),
    }


@app.get("/healthz")
async def health() -> dict:
    return {"status": "ok", "service": "fargate"}


@app.get("/orders")
async def list_orders(request: Request) -> dict:
    context = _context(request)
    return {
        "orders": _SAMPLE_ORDERS,
        **context,
        "count": len(_SAMPLE_ORDERS),
    }


@app.post("/orders")
async def create_order(request: Request) -> JSONResponse:
    context = _context(request)
    payload = await request.json()
    payload.setdefault("id", "ord-dev-" + datetime.now(tz=timezone.utc).strftime("%H%M%S"))
    payload.setdefault("status", "created")
    payload.setdefault("currency", "USD")
    payload.setdefault("created_at", datetime.now(tz=timezone.utc).isoformat())
    return JSONResponse({"result": "accepted", **context, "order": payload})


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def fallback(path: str, request: Request) -> JSONResponse:
    context = _context(request)
    try:
        payload = await request.json()
    except Exception:  # noqa: BLE001 - propagate non JSON bodies as-is
        payload = (await request.body()).decode() or None
    return JSONResponse(
        {
            "source": "fargate",
            **context,
            "path": path,
            "method": request.method,
            "payload": payload,
            "query": dict(request.query_params),
        }
    )
