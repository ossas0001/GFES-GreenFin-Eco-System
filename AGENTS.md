# GFES (GreenFin Eco System) Development Guide

本專案整合 GFES 綠色消費循環平台與 GreenFin 小農綠色數位融資履歷平台。任何非瑣碎修改前，依序閱讀：

1. `AGENTS.md`
2. `docs/PRODUCT_SPEC.md`
3. `docs/RULES.md`
4. `docs/ARCHITECTURE.md`
5. `docs/CURRENT_STAGE.md`

依任務再閱讀 `docs/DECISIONS.md` 與相關測試。業務規則以文件定義為準，不得因實作方便而改變。

## 產品邊界

GreenFin 只提供授信補充資訊，不是信用評分、自動核貸、違約預測、貸款媒合、額度或利率建議。經驗值、四大分析指標與 Data Health 必須獨立呈現，不得合成總分。

所有 Demo 或虛構資料必須標示 `DEMO`、`SIMULATED` 或 `MOCK`，不得宣稱已被銀行、政府或真實小農正式採用。

## 架構原則

核心依賴方向：

```text
Evidence → Structured Data → Verification → Rules → Calculation → Result
```

- GFES 的帳號、角色與 session 是唯一身分來源。
- 原始文件存 R2；結構化資料、規則版本、計算結果、授權與稽核存 D1。
- 前端不得計算經驗值、四大指標或 Data Health。
- 業務規則集中於 `worker/greenfin/rules/` 與 `worker/greenfin/services/`。
- 所有重要結果保存 `rule_version`、`calculated_at`、`input_evidence_ids` 與 `calculation_trace`。
- 銀行端 API 必須在後端驗證 institution、data scope、有效期間及撤銷狀態，不能只靠前端隱藏。

## 開發流程

強制採用：

```text
Inspect → Plan → Implement → Test → Functional Verify → Record → Gate
```

每個整合 Gate 必須：

- 完成範圍內實作與測試。
- 執行並記錄實際測試結果。
- 更新 `logs/ai-changes/YYYY-MM-DD.log`。
- 更新 `logs/test-results/` 與必要文件。
- Critical Test 失敗時停止擴張功能，修復並重測後才進下一 Gate。

不得宣稱未執行的測試已通過。

## GreenFin 不可變規則

- Rule Set 初始版本為 `GREENFIN_DEMO_V1`。
- 經驗值四構面：減量、增匯、循環、綠色治理。
- 每構面年度上限 250，總上限 1000。
- 行為基礎值 20／50／100，來源認列比例由規則設定取得。
- Data Health 狀態為 GREEN／YELLOW／RED／GRAY，且每筆都要有原因與建議行動。
- 至少支援 DUPLICATE、EXPIRED、FUTURE_DATE、CONFLICT、INVALID_FORMAT、OCR_LOW_CONFIDENCE、MISSING_REQUIRED_FIELD、VERIFICATION_FAILED。
- 異常資料不得直接刪除，應保留人工覆核流程。

## 稽核事件

至少記錄：文件上傳、OCR 完成、欄位修正、核驗更新、異常偵測、三類重新計算、授權建立／撤銷、銀行存取及報告產生。

## 上游來源

- GFES: `https://github.com/yue806161/GFES-green_consumption`
- GreenFin: `https://github.com/stoy95536/GreenFin`

合併後的規格與架構決策優先於上游個別專案，但不得降低 GreenFin 的產品、授權、可解釋性與追溯要求。
