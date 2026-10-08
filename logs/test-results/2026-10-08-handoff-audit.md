# Merged GFES／GreenFin handoff audit — 2026-10-08

Base: `6388d82`; local-only patch. Source checklist: `/Users/sakabio/Downloads/HANDOFF_RECENT_20_UPDATES.md`; 20-item result: `../../outputs/GFES-20-item-audit.md` from this repository's `work/GFES-current` directory.

| Verification | Result |
| --- | --- |
| Vinext build | pass |
| TypeScript `tsc --noEmit` | pass |
| Repository Node tests | 47 pass, 0 fail |
| Local OAuth security script | pass: unauthorized roles, state/cookie forgery, no request-header secret override |
| Local upload security script | pass: WebP and MIME mismatch rejected, 10 MB limit, PDF accepted, duplicate suppressed, cross-account read rejected |
| `git diff --check` | pass |
| Responsive visual checks | 320×568, 393×852, 768×1024, 1024×768, 1440×900; no document horizontal overflow in checked farmer/institution pages |
| Browser role-session checks | authorized farmer and institution local demo accounts restore their own selected subpage after reload |
| Targeted ESLint | 0 errors; 24 warnings in the large existing UI component |

Not executed: production D1/R2 mutation, production deployment, Google consent/callback, real iPhone HEIC, full four-role transaction/admin matrix. The static PDF is explicitly a platform example, not a dynamically generated account report.

After the final OAuth request-header removal, the OAuth security script passed again. The repository build, TypeScript and 47-test suite passed after the implementation changes.

Local institution display fixture: ran `./scripts/seed-institution-demo-local.sh` twice. D1 readback: 3 DEMO procurement records, 1 DEMO verified outcome, 2,400 kg simulated carbon. The command uses `--local` and the SQL requires the built-in account to have `account_kind = test`.

At 393×852, the local institution overview visibly showed 3 DEMO procurement records and 2.4 tons SIMULATED carbon; each of five budget-chart labels appeared below its own bar. Browser readback: `innerWidth = 393`, `innerHeight = 852`, `documentElement.scrollWidth = 378`.

## Pre-push code review, 2026-10-08

- Fixed: unknown upload type could fall through to the action-proof path with non-proof formats. The route now rejects it; local API test passes.
- Fixed: PNG magic-byte check only checked the leading four bytes. It now checks all eight signature bytes; malformed PNG API test passes.
- Fixed: replacing a pending proof could race another replacement or review. The D1 update now checks the original key and pending status, resets the review marker, returns 409 if changed, and keeps the new R2 object if old-object cleanup fails. Local owner replacement and readback pass.
- Clarified: the institution PDF is a fixed platform sample and is downloadable as such regardless of account data.
- Final checks: build passed; `tsc --noEmit` passed; repository Node tests 47/47 passed; OAuth and upload local scripts passed; targeted ESLint 0 errors and 24 warnings; `git diff --check` passed.
