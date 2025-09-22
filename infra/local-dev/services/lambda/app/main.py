from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Lambda Simulation", version="0.1.0")


def _base_context(request: Request) -> Dict[str, Any]:
    return {
        "tenant": request.headers.get("x-guidogerb-tenant", "unknown"),
        "username": request.headers.get("x-guidogerb-username", "anonymous"),
        "target": request.headers.get("x-guidogerb-target", "lambda"),
    }


@app.get("/healthz")
async def health() -> dict:
    return {"status": "ok", "service": "lambda"}


@app.get("/hello")
async def hello(request: Request) -> dict:
    context = _base_context(request)
    return {
        "message": "Hello from the lambda function",
        **context,
        "path": str(request.url.path),
    }


@app.post("/echo")
async def echo(request: Request) -> JSONResponse:
    context = _base_context(request)
    try:
        payload = await request.json()
    except Exception:  # noqa: BLE001 - fallback to bytes when body is not JSON
        payload = await request.body()
    return JSONResponse({"source": "lambda", **context, "payload": payload})


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def catch_all(path: str, request: Request) -> JSONResponse:
    context = _base_context(request)
    body: Any
    try:
        body = await request.json()
    except Exception:  # noqa: BLE001 - non JSON bodies bubble through
        body = (await request.body()).decode() or None
    return JSONResponse(
        {
            "source": "lambda",
            **context,
            "path": path,
            "method": request.method,
            "query": dict(request.query_params),
            "body": body,
        }
    )
