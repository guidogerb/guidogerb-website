from __future__ import annotations

import unittest

from api.contracts import EVENT_CONTRACTS, REST_OPERATIONS, STATE_MACHINES, build_openapi_document


class ContractsTestCase(unittest.TestCase):
  def test_rest_operations_are_unique(self) -> None:
    combinations = {(operation.path, operation.method) for operation in REST_OPERATIONS}
    self.assertEqual(len(combinations), len(REST_OPERATIONS), 'Duplicate REST contract definitions found.')

    for operation in REST_OPERATIONS:
      self.assertTrue(operation.path.startswith('/'))
      self.assertIn(operation.method, {'GET', 'POST', 'PUT', 'PATCH', 'DELETE'})
      self.assertRegex(operation.name, r'^[A-Za-z0-9]+$')

  def test_openapi_document_contains_contracts(self) -> None:
    document = build_openapi_document()

    self.assertEqual(document['openapi'], '3.1.0')
    self.assertIn('paths', document)

    for operation in REST_OPERATIONS:
      path_entry = document['paths'][operation.path]
      method_entry = path_entry[operation.method.lower()]
      self.assertEqual(method_entry['operationId'], operation.name)

      for status_code, response in operation.responses.items():
        response_entry = method_entry['responses'][str(status_code)]
        self.assertEqual(response_entry['description'], response.description)
        if response.body_schema is not None:
          self.assertIn('application/json', response_entry['content'])

  def test_event_contracts_are_referenced_by_state_machine(self) -> None:
    detail_types = {event.detail_type for event in EVENT_CONTRACTS}
    for state_machine in STATE_MACHINES:
      self.assertTrue(detail_types.issuperset(set(state_machine.emits_events)))

  def test_event_schema_contains_status_enum(self) -> None:
    lifecycle_event = next(event for event in EVENT_CONTRACTS if event.name == 'StreamLifecycleProgressed')
    status_enum = lifecycle_event.detail_schema['properties']['status']['enum']

    update_operation = next(operation for operation in REST_OPERATIONS if operation.name == 'UpdateStreamStatus')
    response_schema = update_operation.responses[200].body_schema
    self.assertIsNotNone(response_schema)
    if response_schema is not None:
      self.assertIn('detailType', response_schema['properties'])
    self.assertGreaterEqual(len(status_enum), 3)


if __name__ == '__main__':
  unittest.main()
