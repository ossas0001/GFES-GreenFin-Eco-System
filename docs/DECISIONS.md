# Architecture Decision Log

## ADR-M001 — GFES is the merged runtime

**Status:** Accepted
**Date:** 2026-09-16

以 GFES 的 Next.js／Cloudflare／D1／R2 架構、角色與登入為合併後唯一 runtime。GreenFin 的 React 畫面及 Python domain logic 依 Gate 移植，不保留第二套登入與正式 JSON store。

## ADR-M002 — Preserve both Git histories

**Status:** Accepted  
**Date:** 2026-09-16

新專案以 GFES 為主線，透過雙親合併提交連接 GreenFin 歷史。兩個原始 GitHub repository 保持不變並設定為 upstream remote。

## ADR-M003 — GreenFin replaces the farmer evidence experience

**Status:** Accepted  
**Date:** 2026-09-16

小農端原「永續證明」（使用者稱「履歷健檢」）改為 GreenFin 主功能；既有證明上傳能力併入 GreenFin 文件管線。銀行端功能整合至 GFES 機構後台。

## ADR-M004 — One identity and one evidence source

**Status:** Accepted  
**Date:** 2026-09-16

GFES profiles、accounts 與 sessions 是唯一身分來源；既有 `evidence` 與 R2 上傳能力延伸為 GreenFin Document，不建立互相不同步的第二份小農或文件資料。

## ADR-M005 — Public GreenFin level is experience-only

**Status:** Accepted
**Date:** 2026-09-17

對消費者公開的小農 GreenFin 等級只由目前規則版本的綠色經驗值後端換算，並與四大分析指標及 Data Health 保持獨立。公開畫面同時聲明該等級代表可追溯綠色行動經驗，不是信用評分、核貸判斷或額度／利率建議。

公開卡片使用易讀的四階徽章，對應規則為 `L0／L1 → LV1`、`L2 → LV2`、`L3 → LV3`、`L4／L5 → LV4`。此映射由後端提供，僅縮短消費者端視覺標示；小農工作台仍保留完整 L0–L5 等級與經驗值明細。

## ADR-M006 — Demo verification fixtures are explicit and idempotent

**Status:** Accepted
**Date:** 2026-09-17

GreenFin 工作台可由已登入小農建立一組固定識別碼的 `DEMO／SIMULATED` 流程資料，包含一份待補件文件、一份已核驗文件與一筆示範綠色行動。此功能需通過 CSRF 與小農角色檢查、以 `INSERT OR IGNORE` 保持重複執行安全，並寫入必要稽核事件；不得將其標示或解讀為真實第三方驗證。
