Private workspaces and deferred publishing

We are not publishing any packages until the project reaches a mature state. All @guidogerb workspace packages are configured with "private": true. This prevents accidental publishing and keeps development fully local via npm workspaces.

How the website consumes packages
- The website workspace declares dependencies on the internal packages using the "workspace:*" protocol.
- When you run npm install at the repo root (with Node/npm installed), npm will link the internal workspaces into the website node_modules without publishing anything.

Current setup
- Root package.json uses npm workspaces.
- All workspace package.json files have "private": true.
- The website/package.json lists all internal @guidogerb packages as dependencies with version "workspace:*".

Notes
- If/when you decide to publish later, flip selected packages to "private": false, add a proper entry point (exports/main), and restore publishing scripts. Until then, keep everything private.
- Any previous publishing helpers/scripts are disabled from package.json to avoid accidental publishes.
