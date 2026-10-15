# Cloudflare Deployment Record

## Current status

The 2026-10-08 release reconciles the GitHub review branch with the active MERGE-18 Worker, then deploys the merged Worker to the existing Pages service binding. The details below record the original integration deployment for historical reference; the current Worker version is listed in the release update at the end.

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

## 2026-10-08 release update

- Previous live Worker: MERGE-18 version `3d9e744b-222b-4e1e-a650-85a43485390d`. Its government GreenFin review and admin PDF sample library were restored in the local source before replacement.
- Current Worker: `fb5136ee-d22d-46da-b8e6-0d6c02da3ae4`, deployed from local commit `2428fd8a87049281840eff9bf9f2e49ac3fa71d4` plus prior branch commit `14c23b0`.
- Pages proxy, D1 binding and R2 binding were unchanged. No remote D1 seed or migration was run for this release.
- Production HTTP smoke checks: public root and all three role pages returned 200; both DEMO PDFs returned 200 with `application/pdf` and expected byte lengths; `farmer001` and `institution001` signed in and received their role-scoped platform and document lists.
- Production browser check: institution overview showed 3 DEMO procurement rows and 2.4 tonnes of clearly labelled simulated carbon. GreenFin page displayed the government review panel with the existing approved document, and at 393 × 852 CSS pixels the page had no horizontal overflow.
- Full Google consent timing and production email registration were not rerun in this release. Local OAuth, account isolation and registration checks are recorded under `logs/test-results/`.

## 2026-10-15 release update

- Previous live Worker: `fb5136ee-d22d-46da-b8e6-0d6c02da3ae4` (rollback target).
- Current Worker: `59f8380b-0a36-47a8-956c-446e9af9d9cd`, deployed from branch `fix/qa-review-greenfin-mobile` (PR #2) before merge.
- Pages proxy, D1 binding and R2 binding were unchanged. No remote D1 migration or seed was run.
- Production HTTP smoke checks: root and all three role pages returned 200 with non-duplicated titles; `/api/public` 200; unauthenticated `/api/platform` 401; sample PDF 200; new stylesheet contains the GreenFin sub-navigation and scroll-hint rules; `X-Frame-Options`, `frame-ancestors 'self'`, `nosniff` and HSTS headers present.
- Production browser check: public home page at 375 × 812 CSS pixels had no horizontal overflow or broken images.
- Signed-in production flows were not exercised by the automated agent; the four demo accounts should be checked by the owner.

## 2026-10-15 follow-up release

- Previous live Worker: `59f8380b-0a36-47a8-956c-446e9af9d9cd`.
- Current Worker: `86fca159-9d96-4ea6-afe7-2e4e5116d2ff`, deployed from `fix/greenfin-progress-approved-docs` (PR #3): GreenFin workspace progress now counts submitted/approved documents the same way as the farmer dashboard.
- Production check: demo farmer GreenFin progress 5/5 (100%), 650 XP, L4.
- Production demo data (owner-approved, via application APIs): a complete DEMO irrigation resubmission was verified as V1 evidence for the 11 demo actions, and the superseded missing-date anomaly was resolved by human review with a traceable note.

## 2026-10-15 Google OAuth configuration

- New OAuth client `GFES GreenFin Production Web Client` (project gfes-green-consumption) with origins/callbacks for https://gfes-green-consumption.pages.dev and http://localhost:4310. The older `GFES Web Client` was left unchanged because gfes.pages.dev still uses it.
- Backend Worker secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (secret entered by the owner).
- Current Worker: `ff8a5bc4-1db4-4501-b24d-d817dcf3d688` (PR #4) logs Google token-exchange error codes without secrets. First live attempt failed at the token exchange; retest after Google propagation.

## 2026-10-15 mobile navigation release

- Current Worker: `f15aed22-e6a8-4500-93ae-f9ae86f57d23` (PR #5): removed the mobile 首頁 item that logged users out; admin mobile logout moved to the top bar. Previous: `ff8a5bc4-1db4-4501-b24d-d817dcf3d688`.

## 2026-10-15 incident: Google secret overwritten and API hang

- 02:09:07.229Z the owner re-entered `GOOGLE_CLIENT_SECRET` (version `cd1ea192`). A concurrent `wrangler deploy` (`f15aed22`, 83 ms later) was based on the prior version and carried the old, invalid secret, so Google login kept failing with `invalid_client`.
- Recovery attempt redeployed `e6871777` from a build produced while the local dev server was running; the build was incomplete and every API request hung (requests ended as Canceled). Mitigated by rolling back to `f15aed22`, then to `cd1ea192` (owner secret, code from PR #4).
- Owner confirmed Google login works on `cd1ea192`. Redeployed the mobile navigation change from a clean build (`dist` removed, dev server stopped) as `ad182251-51d5-4271-a240-85148f4e0778`; APIs respond in about 0.3 s and the new stylesheet is served.
- Lessons: never deploy while a secret is being changed; always confirm `Build complete` from a clean `dist` with the dev server stopped before `wrangler deploy`.

## 2026-10-15 final release: mobile navigation + Google secret

- Root cause of the repeated secret loss: a new Worker version inherits secrets from the most recently uploaded version, not from the active one. Rollbacks do not create versions, so deploys after a rollback re-applied the old secret.
- Fix: uploaded the clean mobile-navigation build without deploying (`7d2567b1`), the owner added the secret with `wrangler versions secret put` (`967d5a8c`), then deployed it with `wrangler versions deploy 967d5a8c@100%`.
- Current Worker: `967d5a8c-1b13-4028-8f41-1d4f50df5031`. APIs respond normally, new stylesheet served, owner confirmed Google login succeeds.
- Rule going forward: after any rollback, do not `wrangler deploy` directly if secrets changed; upload the version, add secrets with `wrangler versions secret put`, then deploy that version.
