# GuidoGerb API workspace

Infrastructure and application code powering the GuidoGerb stream orchestration
API lives in this workspace. The implementation is intentionally lightweight so
local development can exercise contracts, Lambda handlers, and infrastructure
scaffolding without deploying to AWS.

## Directory layout

- `contracts/` — Source of truth for REST, Step Functions, and EventBridge
  contracts. The `build_openapi_document()` helper produces an OpenAPI 3.1
  document consumed by internal tooling.
- `lambdas/` — Python Lambda handlers. All request validation and orchestration
  hooks live here.
- `infra/` — CloudFormation template builder that wires API Gateway resources,
  Lambda functions, the Step Functions orchestrator, and the event bus.
- `tests/` — Python unit tests executed via `python -m unittest`.

Lambda functions remain Python-only to align with the production deployment
strategy.

## Local development

```bash
python -m unittest discover api/tests
```

The test suite validates contract exports, Lambda behaviour, and the generated
CloudFormation template.
