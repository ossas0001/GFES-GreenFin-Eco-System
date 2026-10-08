# MERGE-18 live reconciliation — 2026-10-08

## Scope

The active production Worker version `3d9e744b-222b-4e1e-a650-85a43485390d` contained government GreenFin document review and an admin PDF demo library absent from GitHub main. The local patch restores both, including two three-page A4 sample PDFs, before release. It also retains public role previews, the upload policy, and the new-consumer welcome reward notice. The Pages proxy was unchanged.

New OCR drafts require explicit farmer submission before the government account can list, read, download or review them. Legacy `SUBMITTED` / `APPROVED` / `REJECTED` rows remain visible and count in the farmer progress statistics.

## Local verification

| Check | Result |
| --- | --- |
| `pnpm run build` | Pass; both PDFs included in the client assets |
| `pnpm exec tsc --noEmit` | Pass |
| Repository Node tests | 47 / 47 pass |
| Local farmer and institution review integration | Pass: draft hidden, explicit submission, reject, resubmit, approve, farmer feedback and original PDF download |
| Local OAuth and account isolation checks | Pass |
| Responsive browser checks | No page overflow at widths 320, 393, 768, 1024 and 1440 px; institution chart labels aligned to bar widths on mobile |
| Wrangler `deploy --dry-run` | Pass; 124 static assets, isolated D1/R2 bindings |
| `git diff --check` | Pass |

## Production release verification

- Confirmed the active version immediately before deployment was the expected MERGE-18 version `3d9e744b-222b-4e1e-a650-85a43485390d`.
- Deployed Worker version `fb5136ee-d22d-46da-b8e6-0d6c02da3ae4`; no remote D1 migration or demo seed was needed.
- Public root, farmer, institution and admin routes returned HTTP 200.
- Both DEMO PDF URLs returned HTTP 200, `application/pdf`, and 142,721 / 147,604 bytes respectively.
- `farmer001` and `institution001` sign-in returned HTTP 200; both could load their role-scoped platform and GreenFin document APIs.
- In the production browser, the institution overview displayed three DEMO procurement rows and 2.4 tonnes of `SIMULATED` carbon. The GreenFin government review panel displayed one existing approved document. At 393 × 852 CSS pixels its `scrollWidth` was 378 px, within the 393 px viewport.

The Google provider consent flow and a fresh production email registration were not rerun. They remain covered by local security and registration tests; provider latency was not measured.

## GitHub synchronization

The available GitHub connector had read-only repository access. GitHub CLI's existing broad account scopes included deleting repositories and full control of private repositories, so automatic approval review rejected an assistant click. The owner completed device authorization and email verification directly. The review branch was then pushed to PR #1, and its description was updated to match the published Worker and production checks. GitHub reported no CI checks on this branch at push time.
