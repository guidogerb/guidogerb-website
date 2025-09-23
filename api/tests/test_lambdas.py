from __future__ import annotations

import json
import os
from datetime import datetime
from typing import Any, Dict
import unittest

from api.lambdas import health, streams


def _parse_body(response: Dict[str, Any]) -> Dict[str, Any]:
  return json.loads(response['body'])


class HealthLambdaTestCase(unittest.TestCase):
  def test_health_handler_reports_ok(self) -> None:
    response = health.lambda_handler({}, None)
    self.assertEqual(response['statusCode'], 200)

    payload = _parse_body(response)
    self.assertEqual(payload['status'], 'ok')
    self.assertTrue(payload['services'])

    for service in payload['services']:
      datetime.fromisoformat(service['observedAt'])


class StreamsLambdaTestCase(unittest.TestCase):
  def setUp(self) -> None:
    self.original_env = os.environ.get('STATE_MACHINE_ARN')
    os.environ['STATE_MACHINE_ARN'] = 'arn:aws:states:us-east-1:123456789012:stateMachine:StreamLifecycleOrchestrator'

  def tearDown(self) -> None:
    if self.original_env is None:
      os.environ.pop('STATE_MACHINE_ARN', None)
    else:
      os.environ['STATE_MACHINE_ARN'] = self.original_env

  def test_create_stream_happy_path(self) -> None:
    event = {
      'httpMethod': 'POST',
      'body': json.dumps(
        {
          'streamId': 'launch-day',
          'title': 'Launch Day Broadcast',
          'startTime': '2025-03-01T18:00:00Z',
          'ingestEndpoints': [
            {'protocol': 'rtmps', 'url': 'rtmps://ingest.example.com/app'},
          ],
        }
      ),
    }

    response = streams.lambda_handler(event, None)
    self.assertEqual(response['statusCode'], 202)

    payload = _parse_body(response)
    self.assertEqual(payload['streamId'], 'launch-day')
    self.assertEqual(payload['detailType'], 'StreamProvisionRequested')
    self.assertIn('stateMachineArn', payload)
    datetime.fromisoformat(payload['acceptedAt'])

  def test_create_stream_rejects_invalid_payloads(self) -> None:
    event = {
      'httpMethod': 'POST',
      'body': json.dumps({'title': 'Missing required fields'}),
    }

    response = streams.lambda_handler(event, None)
    self.assertEqual(response['statusCode'], 400)
    payload = _parse_body(response)
    self.assertEqual(payload['message'], 'Validation failed.')
    self.assertGreaterEqual(len(payload['issues']), 1)

  def test_update_stream_accepts_valid_status(self) -> None:
    event = {
      'httpMethod': 'PUT',
      'body': json.dumps({'streamId': 'launch-day', 'status': 'READY'}),
    }

    response = streams.lambda_handler(event, None)
    self.assertEqual(response['statusCode'], 200)
    payload = _parse_body(response)
    self.assertEqual(payload['status'], 'READY')
    datetime.fromisoformat(payload['updatedAt'])

  def test_update_stream_rejects_unknown_status(self) -> None:
    event = {
      'httpMethod': 'PUT',
      'body': json.dumps({'streamId': 'launch-day', 'status': 'UNKNOWN'}),
    }

    response = streams.lambda_handler(event, None)
    self.assertEqual(response['statusCode'], 400)
    payload = _parse_body(response)
    self.assertIn('status must be one of', ' '.join(payload['issues']))

  def test_handler_returns_405_for_other_methods(self) -> None:
    response = streams.lambda_handler({'httpMethod': 'DELETE'}, None)
    self.assertEqual(response['statusCode'], 405)
    payload = _parse_body(response)
    self.assertIn('Expected POST, PUT', payload['message'])


if __name__ == '__main__':
  unittest.main()
