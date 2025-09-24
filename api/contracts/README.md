# API Contracts

The GuidoGerb stream orchestration platform exposes a small REST surface and
publishes lifecycle events to EventBridge. Contracts are defined in
`spec.py` and exercised by the unit tests in `api/tests/test_contracts.py`.

## REST operations

| Operation              | Method | Path       | Description                                                                               |
| ---------------------- | ------ | ---------- | ----------------------------------------------------------------------------------------- |
| `GetHealthStatus`      | GET    | `/health`  | Exposes readiness information for load balancers and observability checks.                |
| `CreateStreamWorkflow` | POST   | `/streams` | Validates provisioning requests and hands the payload to the Step Functions orchestrator. |
| `UpdateStreamStatus`   | PUT    | `/streams` | Accepts lifecycle updates emitted by orchestration tasks.                                 |

### Shared behaviours

- Lambda integrations return JSON responses with the `Content-Type` header set.
- Validation errors share a `message` plus an `issues[]` array describing
  missing or invalid fields.

## Event contracts

| Event name                  | Detail type                 | Description                                                                                                     |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `StreamProvisionRequested`  | `StreamProvisionRequested`  | Emitted as soon as a broadcaster submits a provisioning request. Includes stream metadata and ingest endpoints. |
| `StreamLifecycleProgressed` | `StreamLifecycleProgressed` | Broadcast lifecycle update emitted by orchestration tasks (e.g. `PROVISIONING`, `READY`, `LIVE`).               |

## Orchestration

- `StreamLifecycleOrchestrator` Step Functions state machine consumes the
  `CreateStreamWorkflow` payload and coordinates provisioning activities.
- Emitted events are documented in the `emits_events` field so dashboards and
  downstream services can subscribe confidently.

### `StreamLifecycleOrchestrator` states

| State                            | Type      | Integration                                              | Purpose                                                                                          | Transitions / Events                                                                                             |
| -------------------------------- | --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `ValidateProvisionRequest`       | `Task`    | `arn:aws:states:::lambda:invoke`                         | Validates required fields and normalizes metadata before the workflow progresses.                | `success → PersistProvisionRequest`, `failure → HandleProvisionFailure`                                          |
| `PersistProvisionRequest`        | `Task`    | `arn:aws:states:::dynamodb:putItem`                      | Stores the request for auditability and to unblock operator dashboards.                          | `success → EmitProvisionRequestedEvent`, `failure → HandleProvisionFailure`                                      |
| `EmitProvisionRequestedEvent`    | `Task`    | `arn:aws:states:::events:putEvents`                      | Publishes `StreamProvisionRequested` so ticketing and analytics systems can react immediately.   | `success → ProvisionEncoderInfrastructure`, `failure → HandleProvisionFailure`; emits `StreamProvisionRequested` |
| `ProvisionEncoderInfrastructure` | `Task`    | `arn:aws:states:::aws-sdk:medialive:startChannel`        | Allocates encoder inputs and transport flows handled by the media control plane.                 | `success → ConfigurePlaybackEndpoints`, `failure → HandleProvisionFailure`                                       |
| `ConfigurePlaybackEndpoints`     | `Task`    | `arn:aws:states:::aws-sdk:cloudfront:updateDistribution` | Configures playback origins, entitlements, and CDN distribution updates.                         | `success → AwaitLifecycleConfirmation`, `failure → HandleProvisionFailure`                                       |
| `AwaitLifecycleConfirmation`     | `Task`    | `arn:aws:states:::events:waitForEvent`                   | Waits up to 15 minutes for a `StreamLifecycleProgressed` event reporting READY or FAILED status. | `ready → PublishReadyNotification`, `failed → HandleProvisionFailure`, `timeout → HandleProvisionFailure`        |
| `PublishReadyNotification`       | `Task`    | `arn:aws:states:::events:putEvents`                      | Emits `StreamLifecycleProgressed` (READY) to fan out to the portal and monitoring tools.         | `success → RecordCompletion`, `failure → HandleProvisionFailure`; emits `StreamLifecycleProgressed`              |
| `RecordCompletion`               | `Task`    | `arn:aws:states:::dynamodb:updateItem`                   | Persists the READY timestamp and reconciles outstanding provisioning metadata.                   | `success → WorkflowSucceeded`, `failure → HandleProvisionFailure`                                                |
| `HandleProvisionFailure`         | `Task`    | `arn:aws:states:::lambda:invoke`                         | Captures failure context, emits a FAILED lifecycle event, and notifies on-call operators.        | `success → WorkflowFailed`; emits `StreamLifecycleProgressed`                                                    |
| `WorkflowSucceeded`              | `Succeed` | -                                                        | Terminal success node once playback configuration is confirmed.                                  | -                                                                                                                |
| `WorkflowFailed`                 | `Fail`    | -                                                        | Terminal failure path reached for validation, provisioning, or confirmation issues.              | -                                                                                                                |

Consult `build_openapi_document()` for an OpenAPI 3.1 representation of these
contracts.
