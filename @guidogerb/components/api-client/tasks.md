# @guidogerb/components-api-client — Tasks

| name                              | createdDate | lastUpdatedDate | completedDate | status   | description                                                                                          |
| --------------------------------- | ----------- | --------------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| Document client factory usage     | 2025-09-19  | 2025-09-19      | 2025-09-19    | complete | Clarified expected options for `createClient` including auth token hooks and base URL configuration. |
| Implement POST/PUT retry strategy | 2025-09-19  | 2025-09-20      | 2025-09-20    | complete | Extend the transport wrapper with exponential backoff for idempotent writes and timeout handling.    |
| Publish TypeScript definitions    | 2025-09-19  | 2025-09-20      | 2025-09-20    | complete | Generate `.d.ts` files or migrate sources so consumers receive typed API responses.                  |
| Add max-items guard to pagination | 2025-09-30  | 2025-09-30      | 2025-09-30    | complete | Introduced a `maxItems` option for `collectPaginatedResults` so bulk fetches can stop once a desired record count is reached. |
| Surface request IDs in errors     | 2025-09-30  | 2025-09-30      | 2025-09-30    | complete | `normalizeApiError` now extracts request identifiers from headers and payloads to improve trace correlation in logs.          |
