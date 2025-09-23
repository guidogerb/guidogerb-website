"""Utilities for building API Gateway compatible responses."""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def json_response(status_code: int, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
  """Serialize a payload into the shape expected by API Gateway."""

  base_headers = {'Content-Type': 'application/json'}
  if headers:
    base_headers.update(headers)

  return {
    'statusCode': status_code,
    'headers': base_headers,
    'body': json.dumps(payload),
  }


@dataclass
class ParsedBody:
  value: Optional[Dict[str, Any]]
  error: Optional[str] = None


def parse_json_body(event: Dict[str, Any]) -> ParsedBody:
  """Parse a JSON body from an API Gateway event."""

  body = event.get('body')
  if body is None or body == '':
    return ParsedBody(value={})

  if event.get('isBase64Encoded'):
    try:
      body = base64.b64decode(body)
    except (ValueError, TypeError) as exc:
      return ParsedBody(value=None, error=f'bodyDecodeError:{exc}')

  if isinstance(body, (bytes, bytearray)):
    body = body.decode('utf-8')

  if isinstance(body, str):
    body = body.strip()
    if body == '':
      return ParsedBody(value={})
    try:
      return ParsedBody(value=json.loads(body))
    except json.JSONDecodeError as exc:
      return ParsedBody(value=None, error=f'invalidJson:{exc.msg}')

  if isinstance(body, dict):
    return ParsedBody(value=body)

  return ParsedBody(value=None, error='unsupportedBodyType')


def iso_timestamp(now: Optional[datetime] = None) -> str:
  """Return an ISO-8601 timestamp with UTC timezone information."""

  moment = now or datetime.now(timezone.utc)
  return moment.replace(microsecond=0).isoformat()


__all__ = ['ParsedBody', 'iso_timestamp', 'json_response', 'parse_json_body']
