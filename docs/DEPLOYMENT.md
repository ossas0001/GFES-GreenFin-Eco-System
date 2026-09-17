# Cloudflare Deployment Record

## Current status

- Public repository: `https://github.com/ossas0001/GFES-GreenFin-Eco-System`
- Canonical production URL: `https://gfes-green-consumption.pages.dev`
- Pages project: `gfes-green-consumption`
- Pages deployment: `8920b8fc-6a56-4791-8834-58a749a39a41`
- Backend Worker: `gfes-green-consumption-backend`
- Backend Worker version: `df0c2140-1fc6-42f4-b1b8-838038580f04`
- Local build, type check, lint, 37 automated tests and the local security suite pass.
- Wrangler `4.92.0` dry run and both production deployments pass.
- Online smoke tests pass for the public home page, public API, four Demo account logins, farmer GreenFin and institution GreenFin authorization workspace.

The original Pages hostname is retained as the public entry point. Its advanced-mode `_worker.js` forwards requests through the existing `BACKEND` Service Binding. The merged backend uses isolated data resources:

- D1: `gfes-greenfin-eco-system-db` (`b2bcfb09-43ca-4920-92c8-1590a9b60e92`)
- R2: `gfes-greenfin-eco-system-uploads`
- Google callback: `https://gfes-green-consumption.pages.dev/api/auth/google/callback`

The prior `gfes-green-consumption-db` database and `gfes-green-consumption-uploads` bucket were not reused or migrated. The existing Pages project and backend Worker names were deliberately retained only so the public URLs remain unchanged.

## Completed deployment path

1. Wrangler OAuth authentication completed against the owner account.
2. New isolated D1 and R2 resources were created for the merged project.
3. All 25 D1 migrations were reviewed and applied to the new remote database.
4. The merged Worker was deployed as `gfes-green-consumption-backend` with the isolated D1 and R2 bindings.
5. `pages/_worker.js` was deployed to the existing `gfes-green-consumption` Pages project and forwards all requests through its `BACKEND` Service Binding.
6. `npm test`, `npm run test:security:local` and `npx wrangler deploy --dry-run` passed.
7. Root, public API, all role routes, all four Demo logins and both GreenFin role workspaces were verified on the original Pages hostname.

Cloudflare references: [Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/), [Service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/), [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

## Remaining optional authorization

- Google OAuth client ID and client secret only if Google sign-in is required. Register the exact callback `https://gfes-green-consumption.pages.dev/api/auth/google/callback`.
- Optional custom-domain and DNS access only if a hostname other than the original Pages URL is desired.

No further GitHub or Cloudflare credential is needed for the deployed Demo. Do not commit OAuth secrets; add them with Wrangler secret commands only when Google sign-in is enabled.
