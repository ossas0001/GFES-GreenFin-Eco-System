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
| MERGE-10 | Public GitHub and isolated Cloudflare data deployment | PASS — original production URL deployed and verified |

MERGE-10 已通過；合併版本沿用原本的 Pages 正式網址，並由 Pages Service Binding 連到合併後端。D1 與 R2 使用新建且隔離的資源，不沿用舊 GFES 資料。正式網址：`https://gfes-green-consumption.pages.dev`。Google 登入仍需另行設定 OAuth Client ID／Secret；內建 Demo 帳號登入與 GreenFin 核心流程已線上驗證。
