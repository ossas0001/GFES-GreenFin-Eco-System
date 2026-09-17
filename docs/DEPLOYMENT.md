# Cloudflare Deployment Record

## Current status

- Public repository: `https://github.com/ossas0001/GFES-GreenFin-Eco-System`
- Production URL: `https://gfes-greenfin-eco-system.crypto-magician.workers.dev`
- Worker version: `3ec1f56d-1bf1-42ed-8a43-82a41f4c9f34`
- Local build, type check, lint, 37 automated tests and the local security suite pass.
- Wrangler `4.92.0` dry run and production deployment pass.
- Online smoke tests pass for the public home page, public API, four Demo account logins, farmer GreenFin and institution GreenFin authorization workspace.

The deployment uses isolated resources and does not modify the previous `gfes-green-consumption-*` environment:

- Worker: `gfes-greenfin-eco-system`
- D1: `gfes-greenfin-eco-system-db` (`b2bcfb09-43ca-4920-92c8-1590a9b60e92`)
- R2: `gfes-greenfin-eco-system-uploads`
- Google callback: `https://gfes-greenfin-eco-system.crypto-magician.workers.dev/api/auth/google/callback`

## Completed isolated deployment path

1. Wrangler OAuth authentication completed against the owner account.
2. New D1 and R2 resources were created with names reserved for the merged project.
3. `wrangler.jsonc` was updated with isolated bindings and the final callback URL.
4. `npx wrangler types` regenerated bindings. Compatibility date remains `2026-05-22`, the newest date supported by the project's locked Workers runtime.
5. All 25 D1 migrations were reviewed and applied to the new remote database.
6. `npm test`, `npm run test:security:local` and `npx wrangler deploy --dry-run` passed.
7. The Worker was deployed and its public and authenticated role surfaces were verified online.

Cloudflare references: [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [R2 CLI](https://developers.cloudflare.com/r2/get-started/cli/).

## Alternative path: reuse existing GFES resources

This path requires explicit owner approval because the configured resources already belong to the prior GFES environment:

- Worker: `gfes-green-consumption-backend`
- D1: `gfes-green-consumption-db`
- R2: `gfes-green-consumption-uploads`
- Google callback: `https://gfes-green-consumption.pages.dev/api/auth/google/callback`

Before reusing them, export or otherwise back up the existing D1 data, inspect the pending migrations and confirm that the new Worker bundle may replace the current application.

## Remaining optional authorization

- Google OAuth client ID and client secret only if Google sign-in is required in the new deployment; the final callback hostname must be known first.
- Optional custom-domain and DNS access if a custom hostname is desired.

No further GitHub or Cloudflare credential is currently needed for the deployed Demo. Do not commit OAuth secrets; add them with Wrangler secret commands only when Google sign-in is enabled.
