"""CloudFormation template generation for the GuidoGerb API."""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Set, Tuple

from ..contracts import REST_OPERATIONS


def build_cloudformation_template() -> Dict[str, object]:
  """Create a CloudFormation template describing the API infrastructure."""

  template: Dict[str, object] = {
    'AWSTemplateFormatVersion': '2010-09-09',
    'Description': 'GuidoGerb API Gateway, Lambda, and Step Functions scaffold.',
    'Parameters': {
      'DeploymentArtifactsBucket': {
        'Type': 'String',
        'Description': 'S3 bucket containing zipped Lambda deployment packages.',
      },
      'DeploymentArtifactsPrefix': {
        'Type': 'String',
        'Default': 'guidogerb/api',
        'Description': 'Prefix inside the artifacts bucket where Lambda zips are stored.',
      },
      'LambdaExecutionRoleArn': {
        'Type': 'String',
        'Description': 'IAM role assumed by Lambda functions.',
      },
      'StateMachineRoleArn': {
        'Type': 'String',
        'Description': 'IAM role assumed by the Step Functions state machine.',
      },
    },
    'Resources': {},
    'Outputs': {},
  }

  resources: Dict[str, object] = template['Resources']

  resources['RestApi'] = {
    'Type': 'AWS::ApiGateway::RestApi',
    'Properties': {
      'Name': 'GuidogerbCoreApi',
      'EndpointConfiguration': {'Types': ['REGIONAL']},
    },
  }

  resources['StreamLifecycleEventBus'] = {
    'Type': 'AWS::Events::EventBus',
    'Properties': {
      'Name': {'Fn::Sub': '${AWS::StackName}-stream-lifecycle'},
    },
  }

  lambda_modules: Set[str] = {operation.lambda_module for operation in REST_OPERATIONS}
  method_logical_ids: List[str] = []

  for module in sorted(lambda_modules):
    function_id = _lambda_function_logical_id(module)
    resources[function_id] = {
      'Type': 'AWS::Lambda::Function',
      'Properties': {
        'FunctionName': {
          'Fn::Sub': f'${{AWS::StackName}}-{module.replace("_", "-")}',
        },
        'Handler': f'{module}.lambda_handler',
        'Runtime': 'python3.12',
        'Timeout': 30,
        'MemorySize': 256,
        'Role': {'Ref': 'LambdaExecutionRoleArn'},
        'Code': {
          'S3Bucket': {'Ref': 'DeploymentArtifactsBucket'},
          'S3Key': f'${{DeploymentArtifactsPrefix}}/lambdas/{module}.zip',
        },
      },
    }

    if module == 'streams':
      resources[function_id]['Properties']['Environment'] = {
        'Variables': {
          'STATE_MACHINE_ARN': {'Ref': 'StreamLifecycleStateMachine'},
        },
      }

    permission_id = _lambda_permission_logical_id(module)
    resources[permission_id] = {
      'Type': 'AWS::Lambda::Permission',
      'Properties': {
        'Action': 'lambda:InvokeFunction',
        'FunctionName': {'Ref': function_id},
        'Principal': 'apigateway.amazonaws.com',
        'SourceArn': {
          'Fn::Sub': [
            'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApiId}/*',
            {'RestApiId': {'Ref': 'RestApi'}},
          ],
        },
      },
    }

  for operation in REST_OPERATIONS:
    target_resource, resource_id = _ensure_resource_for_path(resources, operation.path)
    method_id = _method_logical_id(operation.name)
    method_logical_ids.append(method_id)

    lambda_id = _lambda_function_logical_id(operation.lambda_module)
    resources[method_id] = {
      'Type': 'AWS::ApiGateway::Method',
      'Properties': {
        'RestApiId': {'Ref': 'RestApi'},
        'ResourceId': resource_id,
        'HttpMethod': operation.method,
        'AuthorizationType': 'NONE',
        'Integration': {
          'IntegrationHttpMethod': 'POST',
          'Type': 'AWS_PROXY',
          'Uri': {
            'Fn::Sub': [
              'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaArn}/invocations',
              {'LambdaArn': {'Fn::GetAtt': [lambda_id, 'Arn']}},
            ],
          },
        },
      },
    }

    if target_resource:
      resources[target_resource] = resources[target_resource]

  resources['StreamLifecycleStateMachine'] = {
    'Type': 'AWS::StepFunctions::StateMachine',
    'Properties': {
      'RoleArn': {'Ref': 'StateMachineRoleArn'},
      'StateMachineName': {'Fn::Sub': '${AWS::StackName}-stream-lifecycle'},
      'Definition': {
        'Comment': 'Initial stream lifecycle orchestrator scaffold.',
        'StartAt': 'InitializeRequest',
        'States': {
          'InitializeRequest': {
            'Type': 'Pass',
            'Parameters': {
              'stream.$': '$.streamId',
              'startTime.$': '$.startTime',
            },
            'ResultPath': '$.context',
            'Next': 'PublishRequestedEvent',
          },
          'PublishRequestedEvent': {
            'Type': 'Pass',
            'Result': {
              'detailType': 'StreamLifecycleProgressed',
              'status': 'PROVISIONING',
            },
            'End': True,
          },
        },
      },
    },
  }

  resources['Deployment'] = {
    'Type': 'AWS::ApiGateway::Deployment',
    'DependsOn': sorted(method_logical_ids),
    'Properties': {
      'RestApiId': {'Ref': 'RestApi'},
      'Description': 'Deployed by build_cloudformation_template()',
    },
  }

  resources['Stage'] = {
    'Type': 'AWS::ApiGateway::Stage',
    'Properties': {
      'RestApiId': {'Ref': 'RestApi'},
      'DeploymentId': {'Ref': 'Deployment'},
      'StageName': 'prod',
      'Description': 'Production stage for GuidoGerb API.',
    },
  }

  template['Outputs'] = {
    'RestApiId': {'Value': {'Ref': 'RestApi'}},
    'RestApiInvokeUrl': {
      'Value': {
        'Fn::Sub': [
          'https://${RestApiId}.execute-api.${AWS::Region}.amazonaws.com/prod',
          {'RestApiId': {'Ref': 'RestApi'}},
        ],
      },
    },
    'StateMachineArn': {'Value': {'Ref': 'StreamLifecycleStateMachine'}},
    'EventBusName': {'Value': {'Ref': 'StreamLifecycleEventBus'}},
  }

  return template


def _ensure_resource_for_path(resources: Dict[str, object], path: str) -> Tuple[Optional[str], object]:
  """Create intermediate API Gateway resources for a path."""

  path = path or '/'
  segments = [segment for segment in path.strip('/').split('/') if segment]
  parent_id: object = {'Fn::GetAtt': ['RestApi', 'RootResourceId']}
  parent_logical_id = 'Root'
  created_resource: Optional[str] = None

  for segment in segments:
    sanitized = _to_camel_case(segment.strip('{}'))
    logical_id = f'{parent_logical_id}{sanitized}Resource'
    if logical_id not in resources:
      resources[logical_id] = {
        'Type': 'AWS::ApiGateway::Resource',
        'Properties': {
          'RestApiId': {'Ref': 'RestApi'},
          'ParentId': parent_id,
          'PathPart': segment,
        },
      }
    parent_id = {'Ref': logical_id}
    parent_logical_id = logical_id
    created_resource = logical_id

  if not segments:
    return None, {'Fn::GetAtt': ['RestApi', 'RootResourceId']}

  return created_resource, {'Ref': parent_logical_id}


def _to_camel_case(value: str) -> str:
  parts = re.split(r'[^A-Za-z0-9]+', value)
  return ''.join(part.capitalize() for part in parts if part)


def _lambda_function_logical_id(module: str) -> str:
  return f'{_to_camel_case(module)}LambdaFunction'


def _lambda_permission_logical_id(module: str) -> str:
  return f'{_to_camel_case(module)}LambdaPermission'


def _method_logical_id(name: str) -> str:
  return f'{_to_camel_case(name)}Method'


__all__ = ['build_cloudformation_template']
