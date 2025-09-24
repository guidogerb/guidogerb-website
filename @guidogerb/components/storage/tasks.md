# @guidogerb/components-storage — Tasks

| name                                                | createdDate | lastUpdatedDate | completedDate | status   | description                                                                                                       |
| --------------------------------------------------- | ----------- | --------------- | ------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| Clarify storage responsibilities in README          | 2025-09-19  | 2025-09-19      | 2025-09-19    | complete | Documented the persistence scope, planned APIs, and coordination with the service worker helpers.                 |
| Draft storage controller API shape                  | 2025-09-19  | 2025-09-21      | 2025-09-21    | complete | Finalize method signatures for `createStorageController`, cookie helpers, and SSR fallbacks before coding.        |
| Coordinate cache preference channel with SW package | 2025-09-19  | 2025-09-22      | 2025-09-22    | complete | Ship the shared cache preference channel that persists toggles and broadcasts them to `@guidogerb/components-sw`. |
| Ship browser cookie utilities                       | 2025-10-05  | 2025-10-05      | 2025-10-05    | complete | Added cookie parsing, serialization, and mutation helpers with attribute-aware APIs and tests.                     |
| Add storage diagnostics hooks                       | 2025-10-05  | 2025-10-05      | 2025-10-05    | complete | Exposed optional diagnostics callbacks to trace set/remove/clear events and fallback handling in controllers.      |
