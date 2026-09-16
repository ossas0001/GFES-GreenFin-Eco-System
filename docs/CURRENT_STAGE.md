# Current Integration Stage

## Upstream baselines

- GFES baseline: `480b4b0`
- GreenFin baseline: `4eac5c1`
- History merge: `d6770a3`

## Integration gates

| Gate | Scope | Status |
|---|---|---|
| MERGE-01 | Repository foundation, naming, architecture and baseline tests | PASS |
| MERGE-02 | D1 core model and migrations | PASS |
| MERGE-03 | Document／OCR／normalization pipeline | PASS |
| MERGE-04 | Verification and anomalies | PASS |
| MERGE-05 | Versioned rule engine | PASS |
| MERGE-06 | Experience, indicators and Data Health | PASS |
| MERGE-07 | Farmer GreenFin workflow | PASS |
| MERGE-08 | Authorization and bank workflow | PASS |
| MERGE-09 | Traceability, report and full regression | PASS |
| MERGE-10 | Public GitHub and deployment handoff | PASS — production deploy awaits owner resource choice |

MERGE-09 已通過；合併版本達到本機 Demo Ready。正式部署前仍須由 repository owner 選擇建立全新 Cloudflare 資源，或明確核准沿用既有 GFES D1／R2。
