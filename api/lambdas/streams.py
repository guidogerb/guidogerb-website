"""Lambda handler implementing the stream orchestration REST surface."""

from __future__ import annotations

import os
from typing import Any, Dict, Iterable, List

from .responses import ParsedBody, iso_timestamp, json_response, parse_json_body

STATE_MACHINE_ENV = 'STATE_MACHINE_ARN'
DEFAULT_STATE_MACHINE_ARN = (
  'arn:aws:states:us-east-1:000000000000:stateMachine:StreamLifecycleOrchestrator'
)
VALID_STATUSES = {'PROVISIONING', 'READY', 'LIVE', 'FAILED', 'COMPLETE'}


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
  """Dispatch incoming requests based on the HTTP method."""

  method = (event.get('httpMethod') or '').upper()
  if not method and isinstance(event.get('requestContext'), dict):
    method = (event['requestContext'].get('http', {}) or {}).get('method', '').upper()

  if method == 'POST':
    return _handle_create_stream(event)
  if method == 'PUT':
    return _handle_update_stream(event)

  allowed = 'POST, PUT'
  return json_response(405, {'message': f'{method or "Unknown"} not allowed. Expected {allowed}.'}, {
    'Allow': allowed,
  })


def _handle_create_stream(event: Dict[str, Any]) -> Dict[str, Any]:
  parsed = parse_json_body(event)
  if parsed.error:
    return json_response(400, {'message': 'Invalid request body.', 'issues': [parsed.error]})

  payload = parsed.value or {}
  issues: List[str] = []

  required_fields = ['streamId', 'title', 'startTime', 'ingestEndpoints']
  issues.extend(_missing_fields(payload, required_fields))

  ingest_endpoints = payload.get('ingestEndpoints')
  if not isinstance(ingest_endpoints, list) or not ingest_endpoints:
    issues.append('ingestEndpoints must be a non-empty list.')
  else:
    for index, endpoint in enumerate(ingest_endpoints):
      if not isinstance(endpoint, dict):
        issues.append(f'ingestEndpoints[{index}] must be an object.')
        continue
      for key in ('protocol', 'url'):
        if not endpoint.get(key):
          issues.append(f'ingestEndpoints[{index}].{key} is required.')

  if issues:
    return json_response(400, {'message': 'Validation failed.', 'issues': issues})

  state_machine_arn = os.environ.get(STATE_MACHINE_ENV, DEFAULT_STATE_MACHINE_ARN)
  response_payload: Dict[str, Any] = {
    'streamId': payload['streamId'],
    'detailType': 'StreamProvisionRequested',
    'stateMachineArn': state_machine_arn,
    'acceptedAt': iso_timestamp(),
  }

  return json_response(202, response_payload)


def _handle_update_stream(event: Dict[str, Any]) -> Dict[str, Any]:
  parsed: ParsedBody = parse_json_body(event)
  if parsed.error:
    return json_response(400, {'message': 'Invalid request body.', 'issues': [parsed.error]})

  payload = parsed.value or {}
  issues = _missing_fields(payload, ['streamId', 'status'])

  status = payload.get('status')
  if status and status not in VALID_STATUSES:
    issues.append(
      'status must be one of PROVISIONING, READY, LIVE, FAILED, COMPLETE.',
    )

  if issues:
    return json_response(400, {'message': 'Validation failed.', 'issues': issues})

  response_payload: Dict[str, Any] = {
    'streamId': payload['streamId'],
    'status': status,
    'detailType': 'StreamLifecycleProgressed',
    'updatedAt': iso_timestamp(),
  }
  if payload.get('reason'):
    response_payload['reason'] = payload['reason']

  return json_response(200, response_payload)


def _missing_fields(payload: Dict[str, Any], required_fields: Iterable[str]) -> List[str]:
  return [f'{field} is required.' for field in required_fields if not payload.get(field)]


__all__ = ['lambda_handler']
