"""Health check Lambda handler."""

from __future__ import annotations

from typing import Any, Dict, List

from .responses import iso_timestamp, json_response


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
  """Return service readiness information for load balancers and operators."""

  services: List[Dict[str, str]] = [
    {
      'name': 'api-gateway',
      'state': 'HEALTHY',
      'observedAt': iso_timestamp(),
    },
    {
      'name': 'streams-state-machine',
      'state': 'HEALTHY',
      'observedAt': iso_timestamp(),
    },
  ]

  return json_response(
    200,
    {
      'status': 'ok',
      'services': services,
    },
  )


__all__ = ['lambda_handler']
