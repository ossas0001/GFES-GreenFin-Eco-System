# GFES (GreenFin Eco System)

GFES 是一套以 Cloudflare D1、R2 與 Workers 為基礎的綠色生態系統，串聯消費者、合作小農，以及銀行／政府／企業。消費者可從綠色行動取得綠點並支持在地小農；小農可透過 GreenFin 建立可追溯的綠色數位履歷，管理資料品質並在明確授權下提供金融機構作為授信補充資訊。

GreenFin 的經驗值、四大分析指標與 Data Health 彼此獨立，均不是信用評分、自動核貸、違約預測、額度或利率建議。最終授信仍由金融機構依正式制度判斷。

本 repository 以原 [GFES 綠色消費循環平台](https://github.com/yue806161/GFES-green_consumption) 為主體，整合 [GreenFin 小農綠色數位融資履歷平台](https://github.com/stoy95536/GreenFin)；兩個上游專案的 Git 歷史均保留於本專案。

## 公開專案與展示入口

- 合併後公開原始碼：[ossas0001/GFES-GreenFin-Eco-System](https://github.com/ossas0001/GFES-GreenFin-Eco-System)

完整 GreenFin 合併版已使用原本的 Cloudflare Pages 網址正式部署，後端資料仍使用隔離的 D1 與 R2：

- 消費者入口：[https://gfes-green-consumption.pages.dev/](https://gfes-green-consumption.pages.dev/)
- 合作小農後台：[https://gfes-green-consumption.pages.dev/farmer](https://gfes-green-consumption.pages.dev/farmer)
- 銀行／政府／企業後台：[https://gfes-green-consumption.pages.dev/institution](https://gfes-green-consumption.pages.dev/institution)
- 平台管理員後台：[https://gfes-green-consumption.pages.dev/admin](https://gfes-green-consumption.pages.dev/admin)

部署資源、驗證結果與剩餘選用憑證請見 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)。

## 四種平台角色

- 消費者：從消費、節能家電、交通、電子帳單與激勵任務取得綠點，優先支持或兌換附近小農。
- 合作小農：上架商品、管理改善專案與 GreenFin 數位履歷；上傳證據後完成欄位擷取、標準化、來源核驗、異常檢查與規則計算，並自行控制銀行授權。
- 銀行／政府／企業：建立綠點激勵計畫並追蹤 ESG 成果；其中金融機構可在有效授權範圍內查看 GreenFin 授信補充資訊、判定理由與原始證據。
- 平台管理員：審核真實註冊帳號與消費者行動證明，管理角色資料、平台參數、範例文件、商品、專案、採購及 API 測試設定。

## 綠色消費循環：各角色重點

### 消費者

- **綠點怎麼來：** 購買綠色商品取得消費回饋；搭乘大眾運輸、改用電子帳單；購買節能家電或完成政府／企業任務；自備環保杯、餐具或購物袋等減塑行動。
- **獲得綠點的誘因：** 每次行動立即看見綠點回饋；平台優先推薦所在地附近的小農；完成支持後取得可追蹤的影響力收據。
- **綠點帶來的好處：** 兌換具有農產履歷或友善耕作證明的小農好物；直接支持產地改善專案；把日常選擇累積成可看見的地方影響力。

### 合作小農

- **綠點怎麼來：** 消費者兌換商品帶來綠點收入；改善專案接受消費者直接支持；取得企業配對及永續成果獎勵。
- **獲得綠點的誘因：** 農產履歷、無農藥資料與友善耕作成果可提升曝光；可信資料能轉成公開募資條件；持續透明回報可獲得更多合作機會。
- **綠點帶來的好處：** 向合作農會兌換農具、節水設備與高價農業資源；取得檢測、轉型輔導及農業補助；穩定訂單並持續改善生產環境。

### 銀行／政府／企業

- **綠點怎麼來：** 將 ESG、政策或員工福利預算轉為綠點；與商家及公用事業共同配對點數；依節能、交通、電子帳單與環保行動任務發放。
- **參與綠點循環的誘因：** 以明確獎勵提高綠色行動參與率；串連地方創生、農業與淨零政策；取得可追蹤的點數流向及成果資料。
- **綠點帶來的好處：** 累積 ESG 揭露與計畫成效證據；提升在地小農及永續經濟效益；提升企業形象。


## 核心循環

1. 消費者完成綠色消費、購買節能家電、搭乘低碳交通、改用電子帳單，或參與政府企業任務。
2. 商家、政府或企業依激勵規則發放綠點。
3. 平台依消費者所在地，優先推薦附近小農、改善專案與可追溯農產。
4. 消費者使用綠點支持小農或兌換商品，平台保留點數流向與影響力收據。
5. 小農使用收到的綠點，透過合作農會兌換農作器具、檢測、輔導或補助。
6. 銀行、政府與企業彙整綠色行動、地方支持與永續經濟成果；正式 ESG 評分仍依採用準則與評鑑機構認定。

## 專案狀態

目前的帳號、商品、改善專案、點數帳本、訂單、激勵計畫、農會資源兌換、證明文件與成果回報皆由 Cloudflare D1 後台保存，上傳檔案則使用 Cloudflare R2。平台已完成四種角色的主要資料流程；正式串接財政部發票、定位、支付、物流、農會及政府／企業服務前，可由平台管理員設定模擬 API 資料。

## 已完成的主要功能

### 消費者

- 使用電子信箱、使用者名稱或 Google 登入，每個真實帳戶獨立保存個人資料與綠點紀錄。
- 設定個人資料、配送地址及活動所在地，依距離排序附近小農、綠色行動與優惠。
- 在首頁、小農消息、改善專案與農產卡片查看小農目前的 GreenFin 綠色經驗等級；該等級只表示可追溯綠色行動累積，不是信用評分。
- 上傳環保杯、大眾運輸、電子帳單及節能家電等正式行動證明，等待管理員審核後取得綠點。
- 支持小農改善專案、兌換小農商品、填寫收件資料、查看訂單配送進度及申請修改訂單。
- 查看個人綠點帳本、影響力收據，以及曾支持小農發布的最新消息。

### 合作小農

- 編輯農場故事、上傳耕作與商品圖片，發布最新消息至首頁及相關消費者。
- 建立商品、調整庫存與兌換點數，管理消費者訂單、修改申請及出貨進度。
- 建立改善專案、公開募集綠點、提交成果回報。
- 從儀表板查看 GreenFin 五階段建置進度與目前綠色經驗等級，並直接進入完整 GreenFin 工作台。
- 使用 GreenFin 上傳原始文件，完成 SIMULATED OCR、欄位確認、標準化、來源核驗、異常檢查、綠色經驗值、四大獨立指標與 Data Health。
- 建立、查看及撤銷對特定機構、資料範圍與期間的 GreenFin 授權。
- 使用小農綠點兌換農會資源，查看收據、配送或預約履約進度，並可申請修改兌換內容。

### 銀行／政府／企業

- 在有效小農授權下建立 GreenFin 案件，檢視授信補充資訊並產生完整證據鏈資料包；每次存取均保留稽核紀錄。
- 建立綠點激勵計畫與永續採購需求。
- 管理所屬農業資源兌換案件的確認、配送、預約及修改申請。
- 審核分配給該單位的改善專案成果，彙整專屬 ESG 影響力資料。

### 平台管理員

- 分開管理真實註冊帳號與測試資料帳號，核准、停權或調整角色狀態。
- 審核消費者行動證明，流程包含查看文件、填寫審核意見及最終確認。
- 管理商品、改善專案、採購需求、激勵計畫、平台參數及正式 PDF 範例文件。
- 在「API 測試與系統後台」維護外部服務模擬資料及驗證紀錄。

## 帳戶與資料隔離

- Google 登入依 Google 唯一識別碼建立或連結獨立真實帳戶，不會轉成測試帳戶。
- 登入後先完成身分確認與專屬資料載入，再顯示角色頁面，避免短暫出現測試帳戶內容。
- 消費者的綠點、訂單、支持、上傳、活動報名與設定均依帳戶 ID 隔離。
- 小農只可管理自己的商品、專案、證明、訂單及農會資源兌換。
- 銀行／政府／企業只可查看自己的激勵計畫、採購需求、資源履約及成果回報。
- 綠點扣抵、庫存、重複發放及雙花情況由 D1 交易、唯一索引與資料庫限制共同防護。

## 技術架構

- React 19、Next.js 16、TypeScript
- Vinext、Vite、Cloudflare Worker
- Recharts、Lucide React
- Cloudflare D1、Drizzle ORM 與版本化 migration
- Worker API：`GET /api/platform` 取得平台資料；`POST /api/platform` 執行綠點、商品、專案、訂單、激勵、證明與成果操作

## 外部 API 測試模式

平台管理員後台的「API 測試與系統後台」可管理尚未取得正式憑證的外部服務。預設提供電子發票、所在地與距離、物流配送、農產履歷、政府／企業任務五組測試資料。管理員可調整服務啟用狀態、成功回饋點數、預計正式 API 名稱與 JSON 回傳內容；按下「模擬驗證」後，結果、時間與點數異動會保存到 D1 驗證紀錄及點數帳本。

## 帳號註冊與 Google 登入

消費者、合作小農及銀行／政府／企業可從登入視窗建立唯一的使用者名稱與電子信箱，之後可使用其中任一項登入；帳號會寫入 D1 並依所選角色進入對應介面，平台管理員不開放自行註冊。消費者註冊後可直接使用；合作小農及銀行／政府／企業需等待管理員審核，審核畫面會提示約需 1～3 個工作天。

Google 登入採 OAuth 2.0／OpenID Connect 授權碼流程、`state` 驗證與 PKCE，需設定 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_REDIRECT_URI`，並在 Google Cloud Console 登錄完全相同的 `https://gfes-green-consumption.pages.dev/api/auth/google/callback`。

## 2026-08-10 更新內容

- 修正 Google 登入後先顯示測試帳戶、再切換真實帳戶的畫面閃爍。
- 修正真實帳戶繼承測試帳戶訂單、專案、證明、激勵計畫與履約資料的問題。
- 新增消費者、小農、機構及管理員四個獨立正式入口。
- 完成真實帳號／測試帳號分類、角色註冊審核與 Google 獨立帳戶流程。
- 完成消費者設定、行動證明上傳審核、訂單修改、小農出貨及農會履約流程。
- 新增小農故事、最新消息、商品、改善專案、GreenFin 數位履歷與農業資源管理。
- 新增機構激勵計畫、採購、資源履約及帳戶專屬 ESG 成果頁。
- 新增 D1 帳戶所有權欄位、角色資料隔離與越權操作檢查。
- 更新 Cloudflare 正式網站及資料庫 migration。

## 專案參考來源

本專案依據提案文件、臺灣政府公開制度與各項開源技術文件進行需求設計。下列來源用於確認概念、流程及技術實作方向；GFES 並非環境部環保集點、財政部電子發票或農業部產銷履歷的官方服務，也尚未取得這些系統的正式 API 授權。

### 專案規劃文件

- 《附件二、2026 台北金融科技獎提案計畫書》：現行綠色消費循環、四種角色、七階段流程與預期成果的主要需求依據。
- 《GreenFin_專案一開發重點與預期成果》：早期方向構想；本版本採用其中的綠色消費循環與授信補充資訊，但明確排除信用評分及自動核貸。
- 使用者於開發過程提出的角色流程、畫面、審核、履約、資料隔離與行動證明需求，作為互動原型的功能規格。

### 綠色消費、生活與點數制度

- [環境部環保集點](https://www.greenpoint.org.tw/)：綠色消費、大眾運輸、環保行動集點，以及點數兌換概念參考。
- [環境部淨零綠生活行動指引](https://greenlifestyle.moenv.gov.tw/netZeroIndex)：自備環保杯與餐具、低碳運輸、在地消費、節能及日常減碳行動的分類依據。
- [財政部電子發票整合服務平台](https://www.einvoice.nat.gov.tw/)與[電子發票應用 API 規格](https://www.einvoice.nat.gov.tw/static/ptl/ein_upload/attachments/1510206773173_0.pdf)：電子發票證明與未來正式 API 串接方向參考。
- [經濟部能源署能源效率分級標示管理系統](https://ranking.energylabel.org.tw/product/Approval/list.aspx)：節能家電分類、產品查詢及證明資料參考。

### 農業履歷、友善耕作與在地支持

- [農業部產銷履歷農產品資訊網](https://taft.moa.gov.tw/)：產銷履歷、追溯碼、第三方驗證及履歷商品識別流程參考。
- [農業部推動友善環境農業](https://www.moa.gov.tw/ws.php?id=2505838)：友善耕作、檢驗、農機具設備、環境補貼與轉型輔導項目參考。
- [臺灣有機農業資訊網](https://epv.afa.gov.tw/)：有機農業及友善環境耕作者資料與制度參考。

### 永續成果與揭露

- [IFRS Foundation：IFRS Sustainability Disclosure Standards](https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/)：企業永續資訊揭露架構參考。平台呈現的 ESG 成果為計畫管理與展示資料，不等同第三方 ESG 評分或依法出具的永續報告。

### 技術文件與開源專案

- 前端與語言：[React](https://react.dev/)、[Next.js](https://nextjs.org/docs)、[TypeScript](https://www.typescriptlang.org/docs/)、[Vite](https://vite.dev/guide/)及[Vinext](https://github.com/cloudflare/vinext)。
- 雲端執行與部署：[Cloudflare Workers](https://developers.cloudflare.com/workers/)及[Cloudflare Pages](https://developers.cloudflare.com/pages/)。
- 資料與檔案：[Cloudflare D1](https://developers.cloudflare.com/d1/)、[Cloudflare R2](https://developers.cloudflare.com/r2/)及[Drizzle ORM](https://orm.drizzle.team/docs/overview)。
- 身分驗證：[Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)。
- 介面元件：[Recharts](https://recharts.github.io/)及[Lucide React](https://lucide.dev/guide/react)。

### 範例資料聲明

除上述制度與技術來源外，網站內的小農姓名與故事、商品、改善專案、點數、距離、訂單、活動、影響力數據、PDF 範例文件及圖片組均為平台測試與提案展示資料，不代表真實人物、交易、政府核定案件或實際環境效益。正式上線前應由合作單位提供資料，並完成來源查核、授權、個資告知、文件驗證及 API 契約確認。

## 本地啟動

需求：Node.js 22.13.0 以上。

```bash
npm install
npm run dev
```

本地網址預設為 `http://localhost:4310`。

## 驗證

```bash
npm run build
npm test
npx tsc --noEmit
npm run lint
npm run test:security:local
```
