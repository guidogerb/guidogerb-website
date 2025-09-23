# API Contracts

The GuidoGerb stream orchestration platform exposes a small REST surface and
publishes lifecycle events to EventBridge. Contracts are defined in
`spec.py` and exercised by the unit tests in `api/tests/test_contracts.py`.

## REST operations

| Operation                | Method | Path      | Description |
| ------------------------ | ------ | --------- | ----------- |
| `GetHealthStatus`        | GET    | `/health` | Exposes readiness information for load balancers and observability checks. |
| `CreateStreamWorkflow`   | POST   | `/streams` | Validates provisioning requests and hands the payload to the Step Functions orchestrator. |
| `UpdateStreamStatus`     | PUT    | `/streams` | Accepts lifecycle updates emitted by orchestration tasks. |

### Shared behaviours

- Lambda integrations return JSON responses with the `Content-Type` header set.
- Validation errors share a `message` plus an `issues[]` array describing
  missing or invalid fields.

## Event contracts

| Event name | Detail type | Description |
| ---------- | ----------- | ----------- |
| `StreamProvisionRequested` | `StreamProvisionRequested` | Emitted as soon as a broadcaster submits a provisioning request. Includes stream metadata and ingest endpoints. |
| `StreamLifecycleProgressed` | `StreamLifecycleProgressed` | Broadcast lifecycle update emitted by orchestration tasks (e.g. `PROVISIONING`, `READY`, `LIVE`). |

## Orchestration

- `StreamLifecycleOrchestrator` Step Functions state machine consumes the
  `CreateStreamWorkflow` payload and coordinates provisioning activities.
- Emitted events are documented in the `emits_events` field so dashboards and
  downstream services can subscribe confidently.

Consult `build_openapi_document()` for an OpenAPI 3.1 representation of these
contracts.
