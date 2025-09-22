# Local AWS Edge Simulation

This directory provisions a Docker-based sandbox that mirrors the Phase 1
hosting plan (CloudFront → S3, API Gateway → Lambda, API Gateway → ECS
Fargate) without touching AWS. The goal is to exercise the multi-tenant
routing, JWT-protected APIs, and separation between serverless functions and
container workloads using the same hostnames as production.

## Topology

| Component | Local service | Purpose |
| --------- | ------------- | ------- |
| CloudFront | `guidogerb-cloudfront` (Nginx) | Acts as the edge distribution. Routes hostnames to the S3 origin or to the API Gateway container and forwards the `Host` header so per-tenant logic can run downstream. |
| S3 origin  | `guidogerb-s3` (Nginx) | Serves SPA builds from `infra/local-dev/data/s3/tenants/<host>` with an `_placeholder` fallback when no build has been synced. |
| Cognito    | `guidogerb-cognito` (FastAPI) | Issues RS256-signed JWT access tokens and exposes a JWKS endpoint. Mimics a Cognito user pool for local sign-in flows. |
| API Gateway | `guidogerb-api-gateway` (FastAPI) | Validates Cognito JWTs and forwards requests based on the host name: `api.local.<tenant>` → Lambda, `app.local.<tenant>` → Fargate. |
| Lambda     | `guidogerb-lambda` (FastAPI) | Sample Python handler that echoes requests and includes tenant metadata injected by the API gateway. |
| ECS Fargate | `guidogerb-fargate` (FastAPI) | Simulated container service with a sample `/orders` API. |

All services share the `guidogerb` Docker network to emulate VPC-internal DNS
(`*.service.local`).

## Prerequisites

- Docker Desktop or Docker Engine 24+
- `pnpm` to build website assets that will be copied into the S3 emulation
- Hostname mappings so the CloudFront container can distinguish each tenant.
  Append the following to `/etc/hosts` (or the Windows equivalent) as needed:

  ```text
  127.0.0.1 local.guidogerbpublishing.com
  127.0.0.1 api.local.guidogerbpublishing.com
  127.0.0.1 app.local.guidogerbpublishing.com
  127.0.0.2 local.picklecheeze.com
  127.0.0.2 api.local.picklecheeze.com
  127.0.0.2 app.local.picklecheeze.com
  127.0.0.3 local.stream4cloud.com
  127.0.0.3 api.local.stream4cloud.com
  127.0.0.3 app.local.stream4cloud.com
  127.0.0.4 local.this-is-my-story.org
  127.0.0.4 api.local.this-is-my-story.org
  127.0.0.4 app.local.this-is-my-story.org
  127.0.0.7 local.garygerber.com
  127.0.0.7 api.local.garygerber.com
  127.0.0.7 app.local.garygerber.com
  127.0.0.8 local.ggp.llc
  127.0.0.8 api.local.ggp.llc
  127.0.0.8 app.local.ggp.llc
  ```

  > The IP spread mimics the production CIDR allocations documented in
  > `README.md`. Browsers will resolve each tenant domain to a unique loopback
  > IP, allowing `docker-compose` to keep port 8080 free for all sites.

## Usage

1. **Build the sites you want to preview**

   ```bash
   pnpm -r build
   # or build individual sites, e.g. pnpm --filter websites-guidogerbpublishing build
   ```

2. **Sync the artifacts into the simulated S3 buckets**

   ```bash
   ./infra/local-dev/scripts/sync-sites.sh
   ```

   The script copies `websites/<tenant>/dist` into
   `infra/local-dev/data/s3/tenants/local.<tenant>`. When a site has not been
   built you will see a warning and the CloudFront placeholder page will render
   instead.

3. **Launch the environment**

   ```bash
   docker compose -f infra/local-dev/docker-compose.yml up --build
   ```

   - CloudFront is exposed on `http://local.<tenant>:8080`
   - Cognito is exposed on `http://localhost:8100` for issuing tokens

4. **Fetch a Cognito JWT**

   ```bash
   curl -s http://localhost:8100/token \
     -H 'Content-Type: application/json' \
     -d '{"username":"guidogerb","audience":"guidogerb-api"}' | jq -r .access_token
   ```

   Switch `audience` to `guidogerb-app` when calling the Fargate host header
   (`app.local.<tenant>`). The JWKS lives at
   `http://localhost:8100/.well-known/jwks.json`.

5. **Call the API Gateway**

   ```bash
   TOKEN=$(curl -s http://localhost:8100/token -H 'Content-Type: application/json' \
     -d '{"username":"guidogerb","audience":"guidogerb-api"}' | jq -r .access_token)

   curl -H "Host: api.local.guidogerbpublishing.com" \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/hello | jq
   ```

   Swap the host for `app.local.guidogerbpublishing.com` and request
   `/orders` to hit the simulated ECS service:

   ```bash
   TOKEN=$(curl -s http://localhost:8100/token -H 'Content-Type: application/json' \
     -d '{"username":"guidogerb","audience":"guidogerb-app"}' | jq -r .access_token)

   curl -H "Host: app.local.guidogerbpublishing.com" \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/orders | jq
   ```

6. **Stop the stack**

   ```bash
   docker compose -f infra/local-dev/docker-compose.yml down
   ```

## Notes & Extensibility

- The FastAPI services keep tokens in memory; restart `docker compose` if you
  want to rotate the signing key.
- Override service URLs, audiences, or JWT lifetimes by passing environment
  variables in `docker-compose.yml` or `docker compose ... --env-file`.
- The API Gateway forwards arbitrary HTTP methods, so you can test mutation
  flows (`POST`, `PUT`, `DELETE`) end-to-end. Request bodies are proxied as-is.
- Extend `infra/local-dev/scripts/sync-sites.sh` with new tenants as they come
  online. The Nginx maps already include the six initial domains listed in the
  monorepo README.
- To experiment with HTTPS locally, wrap the CloudFront container with
  `mkcert` or place a TLS termination proxy (Caddy/Traefik) in front of it.

## Troubleshooting

- **401 Unauthorized** — ensure the JWT `aud` claim matches the host header
  (`guidogerb-api` for `api.local.*`, `guidogerb-app` for `app.local.*`).
- **Placeholder page** — run `pnpm --filter websites-<tenant> build` and rerun
  the sync script.
- **JWKS fetch errors** — the API Gateway waits for the Cognito mock to start.
  If you see repeated JWKS failures, restart the stack so the JWKS cache can
  refresh.
