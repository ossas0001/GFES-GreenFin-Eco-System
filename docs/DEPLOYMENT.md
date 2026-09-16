# Cloudflare Deployment Handoff

## Current status

- Public repository: `https://github.com/ossas0001/GFES-GreenFin-Eco-System`
- Local build, type check, lint, 37 automated tests and the local security suite pass.
- Wrangler `4.92.0` dry run passes and produces a deployable Worker bundle.
- No production deployment was performed during the merge.

The current `wrangler.jsonc` still points to the existing GFES Worker name, D1 database, R2 bucket and Google callback URL. Deploying it unchanged could update the existing GFES environment. The owner must first choose one of the two paths below.

## Recommended path: isolated GFES GreenFin environment

1. Authenticate the local Wrangler CLI with the intended Cloudflare account using `npx wrangler login`, or provide a short-lived `CLOUDFLARE_API_TOKEN` through the local environment. Do not commit a token.
2. Create a new D1 database and R2 bucket with names reserved for this merged project.
3. Update `wrangler.jsonc` with the new Worker name, D1 database name／ID, R2 bucket name and the final `GOOGLE_REDIRECT_URI`.
4. Update the compatibility date during the deployment change and regenerate bindings with `npx wrangler types`.
5. Review pending D1 migrations with `npx wrangler d1 migrations list <database-name> --remote`, then apply them with `npx wrangler d1 migrations apply <database-name> --remote`. Cloudflare records applied migrations and creates a backup before applying them.
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as Worker secrets if Google sign-in is enabled, and register the exact callback URL in Google Cloud Console.
7. Run `npm test`, `npm run test:security:local` and `npx wrangler deploy --dry-run` again.
8. Deploy with `npx wrangler deploy`, then verify all four role entrances and the GreenFin authorization flow on the deployed hostname.

Cloudflare references: [Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [R2 CLI](https://developers.cloudflare.com/r2/get-started/cli/).

## Alternative path: reuse existing GFES resources

This path requires explicit owner approval because the configured resources already belong to the prior GFES environment:

- Worker: `gfes-green-consumption-backend`
- D1: `gfes-green-consumption-db`
- R2: `gfes-green-consumption-uploads`
- Google callback: `https://gfes-green-consumption.pages.dev/api/auth/google/callback`

Before reusing them, export or otherwise back up the existing D1 data, inspect the pending migrations and confirm that the new Worker bundle may replace the current application.

## Credentials or authorization needed from the owner

- Cloudflare account authorization via interactive `wrangler login`, or a short-lived API token permitted to deploy Workers and manage the selected D1 and R2 resources.
- A decision to create isolated Cloudflare resources (recommended) or explicit approval to reuse the existing GFES resources.
- Google OAuth client ID and client secret only if Google sign-in is required in the new deployment; the final callback hostname must be known first.
- Optional custom-domain and DNS access if a custom hostname is desired.

No GitHub credential is currently needed: the repository has already been created and pushed successfully.
