# Merged Architecture

## 技術基線

- Web：Next.js 16、React 19、TypeScript、vinext。
- Runtime：Cloudflare Workers。
- Database：Cloudflare D1。
- File storage：Cloudflare R2。
- ORM／migration：Drizzle。
- Authentication：GFES session、CSRF 與角色權限。

GreenFin 原 FastAPI／JSON Repository 的業務規則與測試情境會移植到 TypeScript／D1，不在最終產品保留第二套登入、JSON 正式資料或獨立 Vite UI。

## 模組邊界

```text
app/
  farmer/GreenFin UI（由現有 portal section 掛載）
  institution/GreenFin bank UI
  api/greenfin/（已驗證的 Route Handler）
worker/greenfin/
  models/
  repositories/
  rules/
  services/
  seed/
db/
  schema.ts（GFES 與 GreenFin D1 schema）
```

## 身分映射

- GreenFin farmer 使用 GFES `farmer` profile。
- GreenFin bank 使用 GFES `institution` profile，銀行功能另以機構能力標記控制。
- GreenFin admin 使用 GFES `admin`。
- GreenFin 不建立獨立帳號或 session。

## 證據追溯

```text
Result → Calculation → Rule Version → Standardized Record
→ Document Field → Original Document in R2
```

## 部署

最終目標為一個 GitHub repository、一套 Web 應用與一套 Cloudflare 部署。若移植期間需要對照 Python 原始實作，只能作為上游參考，不得成為第二套產品資料來源。
