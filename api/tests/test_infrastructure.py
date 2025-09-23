from __future__ import annotations

import unittest

import re

from api.contracts import REST_OPERATIONS
from api.infra import build_cloudformation_template


class InfrastructureTemplateTestCase(unittest.TestCase):
  def setUp(self) -> None:
    self.template = build_cloudformation_template()
    self.resources = self.template['Resources']

  def test_parameters_defined(self) -> None:
    parameters = self.template['Parameters']
    for key in ['DeploymentArtifactsBucket', 'DeploymentArtifactsPrefix', 'LambdaExecutionRoleArn', 'StateMachineRoleArn']:
      self.assertIn(key, parameters)

  def test_lambda_functions_exist_for_contracts(self) -> None:
    handlers = {
      resource['Properties']['Handler']
      for resource in self.resources.values()
      if resource['Type'] == 'AWS::Lambda::Function'
    }

    expected_handlers = {f'{operation.lambda_module}.lambda_handler' for operation in REST_OPERATIONS}
    self.assertTrue(expected_handlers.issubset(handlers))

  def test_method_resources_match_contracts(self) -> None:
    methods = [
      resource
      for resource in self.resources.values()
      if resource['Type'] == 'AWS::ApiGateway::Method'
    ]

    self.assertEqual(len(methods), len(REST_OPERATIONS))

    for method, operation in zip(sorted(methods, key=lambda r: r['Properties']['HttpMethod']), sorted(REST_OPERATIONS, key=lambda o: o.method)):
      self.assertEqual(method['Properties']['HttpMethod'], operation.method)
      integration = method['Properties']['Integration']
      self.assertEqual(integration['Type'], 'AWS_PROXY')

  def test_deployment_depends_on_methods(self) -> None:
    deployment = self.resources['Deployment']
    depends_on = deployment['DependsOn']
    self.assertEqual(sorted(depends_on), sorted({_method_logical_id(operation.name) for operation in REST_OPERATIONS}))

  def test_stage_references_deployment(self) -> None:
    stage = self.resources['Stage']
    self.assertEqual(stage['Properties']['DeploymentId'], {'Ref': 'Deployment'})
    self.assertEqual(stage['Properties']['StageName'], 'prod')

  def test_streams_lambda_receives_state_machine_env(self) -> None:
    streams_lambda = next(
      resource
      for resource in self.resources.values()
      if resource['Type'] == 'AWS::Lambda::Function' and resource['Properties']['Handler'] == 'streams.lambda_handler'
    )
    env = streams_lambda['Properties']['Environment']['Variables']
    self.assertEqual(env['STATE_MACHINE_ARN'], {'Ref': 'StreamLifecycleStateMachine'})

  def test_outputs_expose_core_resources(self) -> None:
    outputs = self.template['Outputs']
    for key in ['RestApiId', 'RestApiInvokeUrl', 'StateMachineArn', 'EventBusName']:
      self.assertIn(key, outputs)


def _method_logical_id(name: str) -> str:
  parts = re.split(r'[^A-Za-z0-9]+', name)
  return ''.join(part.capitalize() for part in parts if part) + 'Method'


if __name__ == '__main__':
  unittest.main()
