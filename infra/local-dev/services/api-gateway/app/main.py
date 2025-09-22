from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Dict

import httpx
import jwt
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from jwt import PyJWKClient

app = FastAPI(title="GuidoGerb API Gateway", version="0.1.0")

JWKS_URL = os.getenv("COGNITO_JWKS_URL", "http://cognito-mock:8000/.well-known/jwks.json")
ISSUER = os.getenv("COGNITO_ISSUER", "http://cognito-mock:8000")
LAMBDA_URL = os.getenv("LAMBDA_URL", "http://lambda-service:9000")
FARGATE_URL = os.getenv("FARGATE_URL", "http://fargate-service:9001")
LAMBDA_AUDIENCE = os.getenv("LAMBDA_AUDIENCE", "guidogerb-api")
FARGATE_AUDIENCE = os.getenv("FARGATE_AUDIENCE", "guidogerb-app")
REQUEST_TIMEOUT = float(os.getenv("UPSTREAM_TIMEOUT", "10"))

_jwks_client = PyJWKClient(JWKS_URL)


@dataclass
class BackendContext:
    tenant: str
    audience: str
    base_url: str
    target: str


def resolve_context(host_header: str) -> BackendContext:
    host = host_header.split(":", 1)[0].lower()
    if host.startswith("api.local."):
        tenant = host.removeprefix("api.local.")
        return BackendContext(tenant=tenant, audience=LAMBDA_AUDIENCE, base_url=LAMBDA_URL, target="lambda")
    if host.startswith("app.local."):
        tenant = host.removeprefix("app.local.")
        return BackendContext(tenant=tenant, audience=FARGATE_AUDIENCE, base_url=FARGATE_URL, target="fargate")
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unknown API host '{host_header}'")


def decode_jwt(token: str, expected_audience: str) -> Dict:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to resolve signing key") from exc

    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=expected_audience,
            issuer=ISSUER,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@app.get("/healthz")
async def healthz() -> dict:
    return {
        "status": "ok",
        "jwks": JWKS_URL,
        "lambda_url": LAMBDA_URL,
        "fargate_url": FARGATE_URL,
    }


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy(path: str, request: Request) -> Response:
    if path == "healthz":
        return await healthz()

    host_header = request.headers.get("host")
    if not host_header:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Host header is required")

    context = resolve_context(host_header)

    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token is required")

    token = auth_header.split(" ", 1)[1]
    claims = decode_jwt(token, context.audience)

    body = await request.body()

    forward_headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length", "connection"}
    }
    forward_headers.update(
        {
            "x-forwarded-host": host_header,
            "x-guidogerb-tenant": context.tenant,
            "x-guidogerb-username": claims.get("username") or claims.get("sub", ""),
            "x-guidogerb-target": context.target,
        }
    )

    target_url = f"{context.base_url}{request.url.path}"

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            upstream_response = await client.request(
                request.method,
                target_url,
                params=dict(request.query_params),
                headers=forward_headers,
                content=body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    excluded = {"content-length", "connection", "transfer-encoding"}
    response_headers = {
        key: value for key, value in upstream_response.headers.items() if key.lower() not in excluded
    }

    return Response(
        content=upstream_response.content,
        status_code=upstream_response.status_code,
        headers=response_headers,
        media_type=upstream_response.headers.get("content-type"),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    headers = exc.headers or {}
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        headers.setdefault("www-authenticate", "Bearer")
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail}, headers=headers)
