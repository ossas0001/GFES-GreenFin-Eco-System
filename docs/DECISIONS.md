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
