from __future__ import annotations

import base64
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

app = FastAPI(title="Cognito Mock", version="0.1.0")

COGNITO_ISSUER = os.getenv("COGNITO_ISSUER", "http://cognito-mock:8000")
COGNITO_KEY_ID = os.getenv("COGNITO_KEY_ID", "local-dev-key")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "local-dev-client")
DEFAULT_AUDIENCES = [
    audience.strip()
    for audience in os.getenv("COGNITO_DEFAULT_AUDIENCES", "guidogerb-api,guidogerb-app").split(",")
    if audience.strip()
]
TOKEN_TTL_SECONDS = int(os.getenv("COGNITO_TOKEN_TTL", "3600"))

_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public_key = _private_key.public_key()

_private_pem = _private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)
_public_pem = _public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
)


def _b64(number: int) -> str:
    return base64.urlsafe_b64encode(number.to_bytes((number.bit_length() + 7) // 8, "big")).rstrip(b"=").decode()


def _jwks_document() -> dict:
    numbers = _public_key.public_numbers()
    return {
        "keys": [
            {
                "kty": "RSA",
                "kid": COGNITO_KEY_ID,
                "use": "sig",
                "alg": "RS256",
                "e": _b64(numbers.e),
                "n": _b64(numbers.n),
            }
        ]
    }


class TokenRequest(BaseModel):
    username: str = Field(default="demo-user")
    audience: Optional[str] = None
    ttl_seconds: Optional[int] = Field(default=None, ge=60, le=86400)
    client_id: Optional[str] = None
    groups: Optional[List[str]] = Field(default_factory=list)


@app.get("/healthz")
async def health() -> dict:
    return {"status": "ok", "issuer": COGNITO_ISSUER}


@app.get("/.well-known/jwks.json")
async def jwks() -> dict:
    return _jwks_document()


@app.get("/.well-known/openid-configuration")
async def openid_configuration() -> dict:
    return {
        "issuer": COGNITO_ISSUER,
        "jwks_uri": f"{COGNITO_ISSUER}/.well-known/jwks.json",
        "token_endpoint": f"{COGNITO_ISSUER}/token",
        "response_types_supported": ["code", "token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "claims_supported": ["sub", "email", "username", "cognito:groups"],
    }


@app.post("/token")
async def issue_token(request: TokenRequest) -> dict:
    audience = request.audience or (DEFAULT_AUDIENCES[0] if DEFAULT_AUDIENCES else None)
    if not audience:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audience is required")

    if DEFAULT_AUDIENCES and audience not in DEFAULT_AUDIENCES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audience '{audience}' is not registered for this mock pool",
        )

    ttl = request.ttl_seconds or TOKEN_TTL_SECONDS
    now = datetime.now(tz=timezone.utc)
    expires_at = now + timedelta(seconds=ttl)

    payload = {
        "sub": str(uuid.uuid4()),
        "iss": COGNITO_ISSUER,
        "token_use": "id",
        "aud": audience,
        "client_id": request.client_id or COGNITO_APP_CLIENT_ID,
        "username": request.username,
        "email": f"{request.username}@example.com",
        "cognito:groups": request.groups or ["local-dev"],
        "auth_time": int(time.mktime(now.timetuple())),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(payload, _private_pem, algorithm="RS256", headers={"kid": COGNITO_KEY_ID})
    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": ttl,
        "issued_token_type": "urn:ietf:params:oauth:token-type:access_token",
    }


@app.get("/public-key.pem")
async def public_key() -> dict:
    return {"public_key": _public_pem.decode()}
