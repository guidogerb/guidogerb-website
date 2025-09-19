# @guidogerb/components/sw Task Tracker

The service worker helpers currently expose minimal registration and unregistration utilities. Upcoming work focuses on real
caching strategies, runtime coordination with the storage package, and higher-fidelity developer ergonomics.

| Task Name | Created Date | In Progress | Complete Date | Task Details |
| --- | --- | --- | --- | --- |
| Provide baseline register/unregister helpers | 2025-09-19 | No | 2025-09-19 | Lightweight helpers already register a worker on window load and expose an `unregisterSW` convenience. |
| Design caching strategy contract with storage | 2025-09-19 | No | - | Define how `@guidogerb/components/storage` communicates cache preferences (e.g., via broadcast channel or shared config). |
| Implement runtime cache toggles driven by storage | 2025-09-19 | No | - | Allow the worker to enable/disable caching buckets (static assets, API responses) based on the shared storage controller. |
| Surface update lifecycle hooks | 2025-09-19 | No | - | Emit events/promises so apps can prompt users about new versions once the worker installs an updated bundle. |
| Document integration & failure modes | 2025-09-19 | No | - | Author guides covering registration prerequisites, cache versioning, and how storage-driven toggles affect runtime behaviour. |
| Expand automated tests beyond registration | 2025-09-19 | No | - | Add Vitest suites or worker harness tests covering cache toggles, update notifications, and unregister fallbacks. |
