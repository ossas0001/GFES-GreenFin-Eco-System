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

Production version check, deployment, smoke tests and release identity will be recorded below after publishing. Google consent time depends on the provider and was not measured by local tests.
