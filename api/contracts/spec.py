"""Authoritative API contracts for the GuidoGerb backend platform."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

JsonSchema = Dict[str, object]


@dataclass(frozen=True)
class RestResponse:
  """Representation of an HTTP response returned by a Lambda integration."""

  status_code: int
  description: str
  body_schema: Optional[JsonSchema] = None


@dataclass(frozen=True)
class RestOperation:
  """REST contract exposed through API Gateway."""

  name: str
  path: str
  method: str
  summary: str
  description: str
  lambda_module: str
  lambda_handler: str
  request_schema: Optional[JsonSchema] = None
  responses: Dict[int, RestResponse] = field(default_factory=dict)


@dataclass(frozen=True)
class EventContract:
  """EventBridge contract emitted by the streaming orchestration flow."""

  name: str
  source: str
  detail_type: str
  description: str
  detail_schema: JsonSchema
  example: Dict[str, object]


@dataclass(frozen=True)
class StateMachineState:
  """State executed by the StreamLifecycleOrchestrator Step Function."""

  name: str
  state_type: str
  description: str
  integration: Optional[str] = None
  transitions: Dict[str, str] = field(default_factory=dict)
  emits_events: List[str] = field(default_factory=list)
  timeout_seconds: Optional[int] = None


@dataclass(frozen=True)
class StateMachineContract:
  """Step Functions orchestration flow used by the streaming platform."""

  name: str
  description: str
  input_schema: JsonSchema
  emits_events: List[str]
  states: List[StateMachineState] = field(default_factory=list)


CREATE_STREAM_REQUEST_SCHEMA: JsonSchema = {
  'type': 'object',
  'required': ['streamId', 'title', 'startTime', 'ingestEndpoints'],
  'additionalProperties': False,
  'properties': {
    'streamId': {
      'type': 'string',
      'pattern': '^[a-zA-Z0-9-]{3,64}$',
      'description': 'Identifier supplied by the broadcaster portal.',
    },
    'title': {
      'type': 'string',
      'minLength': 1,
      'maxLength': 140,
      'description': 'Marketing name displayed to operations and monetization teams.',
    },
    'startTime': {
      'type': 'string',
      'format': 'date-time',
      'description': 'Scheduled UTC kickoff time for the live stream.',
    },
    'ingestEndpoints': {
      'type': 'array',
      'minItems': 1,
      'items': {
        'type': 'object',
        'required': ['protocol', 'url'],
        'additionalProperties': False,
        'properties': {
          'protocol': {
            'type': 'string',
            'enum': ['rtmp', 'rtmps', 'srt'],
            'description': 'Media transport protocol supported by the encoder.',
          },
          'url': {
            'type': 'string',
            'format': 'uri',
            'description': 'Primary ingest URL provisioned for the encoder.',
          },
          'backupUrl': {
            'type': 'string',
            'format': 'uri',
            'description': 'Optional secondary ingest URL for failover scenarios.',
          },
        },
      },
      'description': 'List of ingest targets the control room will publish to.',
    },
    'metadata': {
      'type': 'object',
      'description': 'Optional metadata forwarded to the Step Functions orchestrator.',
      'additionalProperties': {'type': 'string'},
    },
  },
}


UPDATE_STREAM_REQUEST_SCHEMA: JsonSchema = {
  'type': 'object',
  'required': ['streamId', 'status'],
  'additionalProperties': False,
  'properties': {
    'streamId': {
      'type': 'string',
      'pattern': '^[a-zA-Z0-9-]{3,64}$',
      'description': 'Identifier of the stream whose lifecycle state is being updated.',
    },
    'status': {
      'type': 'string',
      'enum': ['PROVISIONING', 'READY', 'LIVE', 'FAILED', 'COMPLETE'],
      'description': 'Latest lifecycle state emitted by orchestration tasks.',
    },
    'reason': {
      'type': 'string',
      'maxLength': 280,
      'description': 'Optional operator facing reason that explains status changes.',
    },
  },
}


ACCEPTED_RESPONSE_SCHEMA: JsonSchema = {
  'type': 'object',
  'required': ['streamId', 'detailType', 'stateMachineArn'],
  'additionalProperties': False,
  'properties': {
    'streamId': {
      'type': 'string',
      'description': 'Identifier passed through to the orchestration workflow.',
    },
    'detailType': {
      'type': 'string',
      'enum': ['StreamProvisionRequested'],
      'description': 'EventBridge detail type emitted after the request is validated.',
    },
    'stateMachineArn': {
      'type': 'string',
      'description': 'ARN for the Step Functions state machine executing the workflow.',
    },
    'acceptedAt': {
      'type': 'string',
      'format': 'date-time',
      'description': 'Timestamp indicating when the request was queued for execution.',
    },
  },
}


ERROR_RESPONSE_SCHEMA: JsonSchema = {
  'type': 'object',
  'required': ['message'],
  'properties': {
    'message': {'type': 'string'},
    'issues': {
      'type': 'array',
      'items': {'type': 'string'},
      'description': 'List of validation errors encountered while processing the request.',
    },
  },
}


REST_OPERATIONS: List[RestOperation] = [
  RestOperation(
    name='GetHealthStatus',
    path='/health',
    method='GET',
    summary='Expose API service health.',
    description='Returns health and dependency readiness details used by load balancers.',
    lambda_module='health',
    lambda_handler='health.lambda_handler',
    responses={
      200: RestResponse(
        status_code=200,
        description='The API is reachable and downstream dependencies are healthy.',
        body_schema={
          'type': 'object',
          'required': ['status', 'services'],
          'properties': {
            'status': {
              'type': 'string',
              'enum': ['ok'],
            },
            'services': {
              'type': 'array',
              'items': {
                'type': 'object',
                'required': ['name', 'state'],
                'properties': {
                  'name': {'type': 'string'},
                  'state': {'type': 'string'},
                  'observedAt': {'type': 'string', 'format': 'date-time'},
                },
              },
            },
          },
        },
      )
    },
  ),
  RestOperation(
    name='CreateStreamWorkflow',
    path='/streams',
    method='POST',
    summary='Request orchestration for a new broadcast.',
    description=(
      'Validates broadcaster supplied ingest targets and forwards the payload to '
      'the StreamLifecycleOrchestrator Step Function. Emitted events allow '
      'operations dashboards to track provisioning progress.'
    ),
    lambda_module='streams',
    lambda_handler='streams.lambda_handler',
    request_schema=CREATE_STREAM_REQUEST_SCHEMA,
    responses={
      202: RestResponse(
        status_code=202,
        description='The request was accepted and handed off to the orchestrator.',
        body_schema=ACCEPTED_RESPONSE_SCHEMA,
      ),
      400: RestResponse(
        status_code=400,
        description='Validation failed for the provided stream definition.',
        body_schema=ERROR_RESPONSE_SCHEMA,
      ),
    },
  ),
  RestOperation(
    name='UpdateStreamStatus',
    path='/streams',
    method='PUT',
    summary='Update lifecycle status emitted by the orchestrator.',
    description=(
      'Allows orchestration tasks to publish status updates once provisioning '
      'completes, transitions to the live encoder, or encounters an error.'
    ),
    lambda_module='streams',
    lambda_handler='streams.lambda_handler',
    request_schema=UPDATE_STREAM_REQUEST_SCHEMA,
    responses={
      200: RestResponse(
        status_code=200,
        description='Lifecycle status updated and persisted for downstream subscribers.',
        body_schema={
          'type': 'object',
          'required': ['streamId', 'status', 'detailType'],
          'properties': {
            'streamId': {'type': 'string'},
            'status': {'type': 'string'},
            'detailType': {'type': 'string', 'enum': ['StreamLifecycleProgressed']},
            'updatedAt': {'type': 'string', 'format': 'date-time'},
          },
        },
      ),
      400: RestResponse(
        status_code=400,
        description='Status transitions were invalid or missing.',
        body_schema=ERROR_RESPONSE_SCHEMA,
      ),
    },
  ),
]


EVENT_CONTRACTS: List[EventContract] = [
  EventContract(
    name='StreamProvisionRequested',
    source='com.guidogerb.streams',
    detail_type='StreamProvisionRequested',
    description='Emitted after a broadcaster submits a provisioning request.',
    detail_schema={
      'type': 'object',
      'required': ['streamId', 'ingestEndpoints', 'title', 'startTime'],
      'properties': {
        'streamId': {'type': 'string'},
        'title': {'type': 'string'},
        'startTime': {'type': 'string', 'format': 'date-time'},
        'ingestEndpoints': CREATE_STREAM_REQUEST_SCHEMA['properties']['ingestEndpoints'],
        'metadata': {'type': 'object'},
      },
    },
    example={
      'detail-type': 'StreamProvisionRequested',
      'source': 'com.guidogerb.streams',
      'detail': {
        'streamId': 'spring-launch-2025',
        'title': 'Spring product launch',
        'startTime': '2025-03-01T18:00:00Z',
        'ingestEndpoints': [
          {'protocol': 'rtmps', 'url': 'rtmps://ingest.example.com/app', 'backupUrl': 'rtmps://backup.example.com/app'},
        ],
      },
    },
  ),
  EventContract(
    name='StreamLifecycleProgressed',
    source='com.guidogerb.streams',
    detail_type='StreamLifecycleProgressed',
    description='Broadcast orchestration milestone emitted by the Step Function.',
    detail_schema={
      'type': 'object',
      'required': ['streamId', 'status'],
      'properties': {
        'streamId': {'type': 'string'},
        'status': {'type': 'string', 'enum': UPDATE_STREAM_REQUEST_SCHEMA['properties']['status']['enum']},
        'reason': {'type': 'string'},
        'occurredAt': {'type': 'string', 'format': 'date-time'},
      },
    },
    example={
      'detail-type': 'StreamLifecycleProgressed',
      'source': 'com.guidogerb.streams',
      'detail': {
        'streamId': 'spring-launch-2025',
        'status': 'READY',
        'occurredAt': '2025-03-01T17:30:00Z',
      },
    },
  ),
]


STREAM_LIFECYCLE_ORCHESTRATOR_STATES: List[StateMachineState] = [
  StateMachineState(
    name='ValidateProvisionRequest',
    state_type='Task',
    description=(
      'Invoke the validation Lambda to ensure the payload includes ingest endpoints, '
      'title, and scheduling metadata before the workflow continues.'
    ),
    integration='arn:aws:states:::lambda:invoke',
    transitions={'success': 'PersistProvisionRequest', 'failure': 'HandleProvisionFailure'},
  ),
  StateMachineState(
    name='PersistProvisionRequest',
    state_type='Task',
    description='Store the normalized request so operations can audit provisioning attempts.',
    integration='arn:aws:states:::dynamodb:putItem',
    transitions={'success': 'EmitProvisionRequestedEvent', 'failure': 'HandleProvisionFailure'},
  ),
  StateMachineState(
    name='EmitProvisionRequestedEvent',
    state_type='Task',
    description='Publish the StreamProvisionRequested event for dashboards and ticketing hooks.',
    integration='arn:aws:states:::events:putEvents',
    transitions={'success': 'ProvisionEncoderInfrastructure', 'failure': 'HandleProvisionFailure'},
    emits_events=['StreamProvisionRequested'],
  ),
  StateMachineState(
    name='ProvisionEncoderInfrastructure',
    state_type='Task',
    description='Call the media control Lambda to allocate encoder inputs and media flows.',
    integration='arn:aws:states:::aws-sdk:medialive:startChannel',
    transitions={'success': 'ConfigurePlaybackEndpoints', 'failure': 'HandleProvisionFailure'},
  ),
  StateMachineState(
    name='ConfigurePlaybackEndpoints',
    state_type='Task',
    description='Update playback origins, CloudFront distributions, and entitlement metadata.',
    integration='arn:aws:states:::aws-sdk:cloudfront:updateDistribution',
    transitions={'success': 'AwaitLifecycleConfirmation', 'failure': 'HandleProvisionFailure'},
  ),
  StateMachineState(
    name='AwaitLifecycleConfirmation',
    state_type='Task',
    description=(
      'Pause execution until operations emit a StreamLifecycleProgressed event with READY '
      'or FAILED status, enforcing a 15 minute timeout.'
    ),
    integration='arn:aws:states:::events:waitForEvent',
    transitions={
      'ready': 'PublishReadyNotification',
      'failed': 'HandleProvisionFailure',
      'timeout': 'HandleProvisionFailure',
    },
    timeout_seconds=900,
  ),
  StateMachineState(
    name='PublishReadyNotification',
    state_type='Task',
    description='Inform downstream services that the stream is ready for rehearsal or go-live.',
    integration='arn:aws:states:::events:putEvents',
    transitions={'success': 'RecordCompletion', 'failure': 'HandleProvisionFailure'},
    emits_events=['StreamLifecycleProgressed'],
  ),
  StateMachineState(
    name='RecordCompletion',
    state_type='Task',
    description='Mark the workflow as complete and persist the READY timestamp in DynamoDB.',
    integration='arn:aws:states:::dynamodb:updateItem',
    transitions={'success': 'WorkflowSucceeded', 'failure': 'HandleProvisionFailure'},
  ),
  StateMachineState(
    name='HandleProvisionFailure',
    state_type='Task',
    description='Capture failure context, emit a FAILED lifecycle update, and notify operators.',
    integration='arn:aws:states:::lambda:invoke',
    transitions={'success': 'WorkflowFailed', 'failure': 'WorkflowFailed'},
    emits_events=['StreamLifecycleProgressed'],
  ),
  StateMachineState(
    name='WorkflowSucceeded',
    state_type='Succeed',
    description='Terminal state representing a successful provisioning run.',
  ),
  StateMachineState(
    name='WorkflowFailed',
    state_type='Fail',
    description='Terminal state reached whenever provisioning encounters unrecoverable errors.',
  ),
]


STATE_MACHINES: List[StateMachineContract] = [
  StateMachineContract(
    name='StreamLifecycleOrchestrator',
    description=(
      'Coordinates encoder provisioning, playback configuration, and monetization '
      'signals after a broadcaster submits a stream provisioning request.'
    ),
    input_schema={
      'type': 'object',
      'required': ['streamId', 'title', 'startTime', 'ingestEndpoints'],
      'properties': CREATE_STREAM_REQUEST_SCHEMA['properties'],
    },
    emits_events=[event.detail_type for event in EVENT_CONTRACTS],
    states=STREAM_LIFECYCLE_ORCHESTRATOR_STATES,
  ),
]


def build_openapi_document() -> Dict[str, object]:
  """Generate a minimal OpenAPI document describing the REST surface."""

  document: Dict[str, object] = {
    'openapi': '3.1.0',
    'info': {
      'title': 'GuidoGerb Stream Orchestration API',
      'version': '1.0.0',
      'description': (
        'API Gateway + Lambda surface that broadcasters use to provision live '
        'streams and monitor orchestration progress.'
      ),
    },
    'paths': {},
    'components': {'schemas': {}},
  }

  for operation in REST_OPERATIONS:
    path_item = document['paths'].setdefault(operation.path, {})
    responses: Dict[str, object] = {}
    for status_code, response in operation.responses.items():
      response_entry: Dict[str, object] = {'description': response.description}
      if response.body_schema is not None:
        response_entry['content'] = {
          'application/json': {'schema': response.body_schema},
        }
      responses[str(status_code)] = response_entry

    operation_entry: Dict[str, object] = {
      'summary': operation.summary,
      'description': operation.description,
      'operationId': operation.name,
      'responses': responses,
      'tags': [operation.path.strip('/').split('/')[0] or 'root'],
    }

    if operation.request_schema is not None:
      operation_entry['requestBody'] = {
        'required': True,
        'content': {
          'application/json': {'schema': operation.request_schema},
        },
      }

    path_item[operation.method.lower()] = operation_entry

  document['x-guidogerb-events'] = [
    {
      'name': event.name,
      'source': event.source,
      'detailType': event.detail_type,
      'description': event.description,
      'detailSchema': event.detail_schema,
      'example': event.example,
    }
    for event in EVENT_CONTRACTS
  ]

  state_machine_entries: List[Dict[str, object]] = []
  for state_machine in STATE_MACHINES:
    entry: Dict[str, object] = {
      'name': state_machine.name,
      'description': state_machine.description,
      'inputSchema': state_machine.input_schema,
      'emits': state_machine.emits_events,
    }

    if state_machine.states:
      states_payload: List[Dict[str, object]] = []
      for state in state_machine.states:
        state_entry: Dict[str, object] = {
          'name': state.name,
          'type': state.state_type,
          'description': state.description,
        }

        if state.integration is not None:
          state_entry['integration'] = state.integration
        if state.transitions:
          state_entry['transitions'] = state.transitions
        if state.emits_events:
          state_entry['emits'] = state.emits_events
        if state.timeout_seconds is not None:
          state_entry['timeoutSeconds'] = state.timeout_seconds

        states_payload.append(state_entry)

      entry['states'] = states_payload

    state_machine_entries.append(entry)

  document['x-guidogerb-stateMachines'] = state_machine_entries

  return document


__all__ = [
  'EVENT_CONTRACTS',
  'REST_OPERATIONS',
  'STATE_MACHINES',
  'build_openapi_document',
  'EventContract',
  'RestOperation',
  'RestResponse',
  'StateMachineContract',
  'StateMachineState',
]
