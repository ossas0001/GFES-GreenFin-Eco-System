"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,

  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  HandCoins,
  HeartHandshake,
  Home,
  Leaf,
  LockKeyhole,
  LogOut,
  MapPin,
  Monitor,
  Newspaper,
  PackageCheck,
  Receipt,
  RefreshCcw,
  Settings,
  ScanLine,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Store,
  Truck,
  Trees,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import farmerImageLibrary from "./data/farmerImageLibrary.json";

type Role = "consumer" | "farmer" | "institution";
export type LoginRole = Role | "admin";
type ConsumerPage = "overview" | "local" | "invoice" | "receipt" | "orders" | "settings";
type FarmerPage = "overview" | "content" | "products" | "projects" | "greenfin" | "funding";
type InstitutionPage = "overview" | "greenfin" | "portfolio" | "resource" | "report";

const portalPaths: Record<LoginRole, string> = {
  consumer: "/",
  farmer: "/farmer",
  institution: "/institution",
  admin: "/admin",
};
const consumerPages: ConsumerPage[] = ["overview", "local", "invoice", "receipt", "orders", "settings"];
const farmerPages: FarmerPage[] = ["overview", "content", "products", "projects", "greenfin", "funding"];
const institutionPages: InstitutionPage[] = ["overview", "greenfin", "portfolio", "resource", "report"];

function readPortalSection(role: Role, search: string) {
  const section = new URLSearchParams(search).get("section");
  if (role === "consumer") return consumerPages.includes(section as ConsumerPage) ? section as ConsumerPage : "overview";
  if (role === "farmer") return farmerPages.includes(section as FarmerPage) ? section as FarmerPage : "overview";
  return institutionPages.includes(section as InstitutionPage) ? section as InstitutionPage : "overview";
}
type ShippingDetails = {
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  shippingCity: string;
  shippingDistrict: string;
  shippingAddress: string;
  deliveryNote: string;
};
type ResourceRedemptionDraft = {
  cooperative: string;
  contactName: string;
  contactPhone: string;
  fulfillmentType: "delivery" | "appointment";
  deliveryAddress: string;
  appointmentDate: string;
  appointmentSlot: string;
  note: string;
};
type LocalActionRegistrationDraft = {
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail: string;
  participantCount: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  note: string;
};
type ConsumerSettings = {
  displayName: string;
  contactEmail: string;
  phone: string;
  deliveryRecipientName: string;
  deliveryPhone: string;
  deliveryPostalCode: string;
  deliveryCity: string;
  deliveryDistrict: string;
  deliveryAddress: string;
  deliveryNote: string;
  residencePostalCode: string;
  residenceCity: string;
  residenceDistrict: string;
  residenceAddress: string;
  updatedAt: string;
};
type Modal =
  | null
  | "login"
  | "invoice"
  | "support"
  | "redeem"
  | "receipt"
  | "evidence"
  | "offer"
  | "portfolio"
  | "story"
  | "farmer-detail"
  | "local-story"
  | "product"
  | "program"
  | "farmer-project"
  | "outcome"
  | "resource-receipt"
  | "local-action-registration";

type IncentiveProgram = {
  id: string;
  institutionId?: string;
  name: string;
  sponsor: string;
  action: string;
  reward: string;
  budgetPoints: number;
  participants: string;
  progress: number;
  esg: string;
};
type IncentiveProgramDraft = {
  name: string;
  sponsor: string;
  activityDescription: string;
  rewardPoints: number;
  budgetPoints: number;
  participantCount: number;
  participantUnit: string;
  esg: string;
};
type InvoiceVerificationInput = {
  mode: "manual" | "scan";
  invoiceNumber: string;
  amount: number;
  transactionDate: string;
  randomCode: string;
  note?: string;
};
type FarmerProduct = {
  id: string;
  farmerId?: string;
  title: string;
  points: number;
  stock: number;
  unit: string;
  proof: string;
  delivery: string;
  description: string;
  image: string;
};

type ProjectAllocation = { label: string; percent: number };
type ProjectStory = { location: string; headline: string; quote: string; paragraphs: readonly string[] };
type LocalProject = {
  id: string;
  farmerId?: string;
  kind: "support" | "redeem";
  image: string;
  title: string;
  farmer: string;
  note: string;
  purpose: string;
  points: number;
  progress: number;
  impact: string;
  targetPoints?: number;
  raisedPoints?: number;
  supporters?: number;
  city?: string;
  district?: string;
  distance?: number;
  completionDate?: string;
  proof?: string;
  allocations?: ProjectAllocation[];
  story?: ProjectStory;
  status?: "funding" | "review" | "completed" | "hidden";
};

type ImprovementProjectDraft = {
  title: string;
  note: string;
  purpose: string;
  points: number;
  targetPoints: number;
  impact: string;
  city: string;
  district: string;
  distance: number;
  completionDate: string;
  proof: string;
  allocations: ProjectAllocation[];
  story: ProjectStory;
};

type FarmerStory = {
  farmerId: string;
  farmerName: string;
  city: string;
  district: string;
  headline: string;
  summary: string;
  body: string;
  quote: string;
  image: string;
  imageKey: string;
  status: string;
  updatedAt: string;
  publishedAt: string;
};

type FarmerNews = {
  id: string;
  farmerId: string;
  farmerName: string;
  city: string;
  district: string;
  title: string;
  content: string;
  category: string;
  image: string;
  imageKey: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

type PublicContent = { stories: FarmerStory[]; news: FarmerNews[] };

type BackendSnapshot = {
  version: number;
  consumer: { id: string; displayName: string; city: string; district: string; points: number };
  consumerSettings: ConsumerSettings;
  farmer: { id: string; displayName: string; city: string; district: string; points: number };
  institution: { id: string; displayName: string; city: string; district: string };
  products: FarmerProduct[];
  productsForConsumer: LocalProject[];
  projects: LocalProject[];
  catalog: LocalProject[];
  farmers: Array<{ id: string; name: string; area: string; district: string }>;
  farmerStory: FarmerStory | null;
  farmerNews: FarmerNews[];
  consumerNews: FarmerNews[];
  incentives: IncentiveProgram[];
  resources: Array<{ id: string; category: string; name: string; requiredScore: number; amount: string; term: string; rate: string; description: string; purpose: string }>;
  resourceRedemptions: Array<{ id: string; institutionId: string; farmerId: string; offerId: string; resourceName: string; points: number; cooperative: string; contactName: string; contactPhone: string; fulfillmentType: "delivery" | "appointment"; deliveryAddress: string; appointmentDate: string; appointmentSlot: string; note: string; stage: number; status: string; trackingNumber: string; createdAt: string; updatedAt: string }>;
  changeRequests: Array<{ id: string; requestType: "order" | "resource"; targetId: string; requesterId: string; ownerId: string; institutionId?: string; reasonCode: string; reasonDetail: string; requested: Record<string, string>; status: "pending" | "approved" | "rejected"; reviewerId: string; reviewNote: string; createdAt: string; updatedAt: string }>;
  localActions: Array<{ id: string; title: string; organizer: string; description: string; rewardPoints: number; city: string; district: string; address: string; details: string; eventStart: string; eventEnd: string; distance: number }>;
  merchantOffers: Array<{ id: string; merchant: string; title: string; description: string; requiredPoints: number; city: string; district: string; address: string; details: string; distance: number }>;
  registeredActionIds: string[];
  orders: Array<{ id: string; productId: string; farmerId?: string; title: string; image: string; farmer: string; points: number; quantity: number; stage: number; status: string; recipientName: string; recipientPhone: string; postalCode: string; shippingCity: string; shippingDistrict: string; shippingAddress: string; deliveryNote: string; carrier: string; trackingNumber: string; fulfillmentNote: string; packedAt: string; shippedAt: string; completedAt: string; createdAt: string; updatedAt: string }>;
  ledger: Array<{ id: number; deltaPoints: number; sourceType: string; sourceId: string | null; description: string; createdAt: string }>;
  supportedProjectIds: string[];
  redeemedProductIds: string[];
  evidence: Array<{ id: number; title: string; evidenceType: string; fileName: string | null; contentType: string | null; fileSize: number | null; status: string; projectId: string | null; productId: string | null; submittedAt: string }>;
  outcomeReports: Array<{ id: number; institutionId: string; projectId: string; waterLiters: number | null; carbonKg: number | null; beneficiaries: number | null; note: string; status: string; submittedAt: string }>;
  procurements: Array<{ id: string; title: string; category: string; quantity: number; budgetPoints: number; deliveryRegion: string; status: string; createdAt: string }>;
  integrationSettings: Array<{ serviceKey: string; displayName: string; mode: string; enabled: boolean; rewardPoints: number; endpointLabel: string; sampleResponse: Record<string, unknown>; updatedAt: string }>;
  verificationRuns: Array<{ id: string; serviceKey: string; input: Record<string, unknown>; response: Record<string, unknown>; status: string; rewardPoints: number; createdAt: string }>;
  actionSubmissions: ActionSubmission[];
  admin: {
    summary: { totalAccounts: number; activeAccounts: number; totalPoints: number; activeProducts: number; fundingProjects: number; pendingReviews: number };
    accounts: Array<{ id: string; role: string; displayName: string; email: string; username: string; accountKind: "real" | "test"; status: string; city: string; district: string; points: number; createdAt: string }>;
    products: Array<{ id: string; title: string; farmerId: string; farmerName: string; points: number; stock: number; status: string }>;
    projects: Array<{ id: string; title: string; points: number; targetPoints: number; raisedPoints: number; supporters: number; progress: number; status: string }>;
    incentives: Array<{ id: string; name: string; sponsor: string; budgetPoints: number; progress: number }>;
    procurements: Array<{ id: string; institutionId: string; institutionName: string; title: string; category: string; quantity: number; budgetPoints: number; deliveryRegion: string; status: string; createdAt: string }>;
    parameters: Array<{ parameterKey: string; displayName: string; value: string; unit: string; description: string; updatedAt: string }>;
    dataTemplates: Array<{ templateKey: string; displayName: string; targetRole: string; uploadArea: string; documentType: string; fileName: string; schemaVersion: string; description: string; sampleData: Record<string, unknown>; updatedAt: string }>;
    actionSubmissions: ActionSubmission[];
    auditLogs: Array<{ id: number; action: string; targetType: string; targetId: string; detail: Record<string, unknown>; createdAt: string }>;
  };
};

type ActionSubmission = {
  id: string;
  consumerId: string;
  actionType: string;
  title: string;
  note: string;
  rewardPoints: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  reviewNote: string | null;
  proofViewedAt: string | null;
  submittedAt: string;
  reviewedAt: string | null;
};

const initialFarmerProducts: FarmerProduct[] = [
  { id: "leafy-box", title: "友善葉菜箱", points: 480, stock: 24, unit: "箱", proof: "產銷履歷 TAP-26-0718", delivery: "雲林縣與鄰近 40 公里", description: "六種當季友善葉菜，以循環箱低溫配送。", image: "/farmer-library/heri-leafy/product.webp" },
  { id: "rice-pack", title: "節水栽培米 2 公斤", points: 360, stock: 38, unit: "包", proof: "無農藥檢測合格", delivery: "全台常溫配送", description: "友善稻作與節水栽培紀錄完整，採減塑包裝。", image: "/farmer-library/qinggu-rice/product.webp" },
  { id: "herb-tea", title: "減塑香草茶", points: 260, stock: 17, unit: "組", proof: "友善耕作紀錄", delivery: "全台常溫配送", description: "自然乾燥香草茶包，附採收批次與沖泡說明。", image: "/farmer-library/xipan-herb/product.webp" },
];

const workflowConfirmationMessages: Record<string, string> = {
  update_consumer_settings: "確認儲存個人資料、預設配送地址與活動所在地？",
  set_location: "確認更新所在地並重新排序附近推薦？",
  register_local_action: "確認送出綠色行動報名資料？",
  support_project: "確認扣除綠點並支持這項小農改善專案？",
  redeem_product: "確認扣除綠點、建立商品兌換訂單並送交小農處理？",
  request_order_change: "確認送出訂單修改申請，等待小農審核？",
  review_order_change: "確認送出這筆訂單修改申請的審核結果？",
  simulate_integration: "確認送出資料並執行本次 API 驗證？",
  update_farmer_story: "確認儲存這份農場故事？若選擇發布，內容會立即顯示在公開首頁。",
  create_farmer_news: "確認建立這則小農最新消息？若選擇發布，會推送到首頁與相關消費者頁面。",
  update_farmer_news: "確認更新這則小農最新消息與發布狀態？",
  create_product: "確認建立並上架這項新商品？",
  update_product: "確認儲存商品點數、庫存與上架內容？",
  create_project: "確認建立改善專案並進入公開募集流程？",
  submit_evidence: "確認送出永續證明並進入審核流程？",
  submit_outcome: "確認送出專案成果並交由承辦端審核？",
  redeem_resource: "確認扣除小農綠點並建立農業資源兌換？",
  request_resource_change: "確認送出農業資源兌換修改申請？",
  review_resource_change: "確認送出這筆農業資源修改申請的審核結果？",
  advance_order: "確認回報這筆訂單的下一個處理／出貨進度？",
  advance_resource_redemption: "確認將農業資源履約推進到下一階段？",
  create_incentive: "確認建立並發布這項綠點激勵計畫？",
  create_procurement: "確認建立永續採購需求並送出媒合？",
  update_integration_setting: "確認儲存 API 介接設定？",
  verify_outcome: "確認核准成果報告並完成影響力揭露？",
  admin_mark_action_submission_viewed: "確認已查看這份行動證明，並進入填寫審核說明步驟？",
  admin_review_action_submission: "確認送出本次行動證明審核結果？",
  admin_update_account: "確認儲存帳號資料與帳號狀態？",
  admin_send_points: "確認將指定綠點發送給這個測試資料帳號？",
  admin_update_product: "確認由管理員儲存商品調整？",
  admin_update_project: "確認由管理員儲存改善專案調整？",
  admin_update_incentive: "確認由管理員儲存激勵計畫調整？",
  admin_update_procurement: "確認由管理員儲存採購需求調整？",
  admin_update_data_template: "確認儲存正式範例資料欄位？",
  admin_generate_data_template: "確認產生新的正式範例資料版本？",
  admin_update_parameter: "確認套用這項平台營運參數？",
};

function confirmWorkflowAction(action: string, payload: Record<string, unknown>) {
  let message = workflowConfirmationMessages[action] ?? "確認執行這項流程操作？";
  const decision = String(payload.decision ?? "");
  if (decision === "approved") message = message.replace("送出這筆", "核准這筆").replace("送出本次", "核准本次");
  if (decision === "rejected") message = message.replace("送出這筆", "退回這筆").replace("送出本次", "退回本次");
  return window.confirm(`流程最終確認\n\n${message}\n\n確認後系統會立即記錄並進入下一步。`);
}

const roles = {
  consumer: {
    label: "消費者",
    account: "林子晴",
    description: "從消費、交通與電子帳單取得綠點，優先支持附近小農",
    icon: User,
  },
  farmer: {
    label: "合作小農",
    account: "禾日友善農園",
    description: "用農產履歷與友善耕作證明獲得支持，再用綠點兌換農業資源",
    icon: Sprout,
  },
  institution: {
    label: "銀行／政府／企業",
    account: "永續共好計畫辦公室",
    description: "設計綠點激勵計畫，累積可揭露的 ESG 與地方效益",
    icon: Building2,
  },
} satisfies Record<Role, { label: string; account: string; description: string; icon: typeof User }>;

const loginRoles = {
  ...roles,
  admin: {
    label: "平台管理員",
    account: "GFES 管理中心",
    description: "管理所有角色帳號、內容、綠點數量與平台參數。",
    icon: Monitor,
  },
} satisfies Record<LoginRole, { label: string; account: string; description: string; icon: typeof User }>;

const farmers = [
  { name: "禾日友善農園", area: "雲林", crop: "葉菜", score: 86, status: "執行中", amount: "12,680 點", purpose: "節水灌溉改善", completeness: 100 },
  { name: "青谷稻作", area: "嘉義", crop: "稻米", score: 91, status: "成果回報", amount: "9,420 點", purpose: "田埂棲地復育", completeness: 96 },
  { name: "山里果園", area: "花蓮", crop: "果樹", score: 79, status: "待補資料", amount: "7,860 點", purpose: "太陽能冷藏", completeness: 72 },
  { name: "暖田蔬果", area: "彰化", crop: "蔬果", score: 84, status: "已完成", amount: "8,240 點", purpose: "循環包材與冷鏈", completeness: 92 },
];
const farmerBenefits = [
  {
    id: "soil-test",
    category: "農會服務",
    name: "土壤健康檢測補助",
    amount: "450 綠點",
    term: "7 個工作天",
    rate: "合作農會採樣",
    description: "由合作農會安排土壤採樣，提供酸鹼值、有機質與肥力建議，協助精準施肥。",
    purpose: "土壤檢測與施肥建議",
    suggestedAmount: "1",
    suggestedLabel: "1 次檢測",
    paymentLabel: "扣除 450 綠點",
    planText: "申請本季土壤檢測，作為下一期施肥與友善耕作紀錄依據。",
    requiredScore: 450,
  },
  {
    id: "harvest-crates",
    category: "農具兌換",
    name: "循環收成籃 10 入組",
    amount: "600 綠點",
    term: "農會取貨",
    rate: "剩餘 24 組",
    description: "耐用、可堆疊的循環收成籃，降低一次性紙箱與塑膠袋使用。",
    purpose: "採收、分級與循環運送",
    suggestedAmount: "1",
    suggestedLabel: "1 組",
    paymentLabel: "扣除 600 綠點",
    planText: "預計用於葉菜採收與合作通路配送，並記錄循環使用次數。",
    requiredScore: 600,
  },
  {
    id: "irrigation-kit",
    category: "農具兌換",
    name: "節水滴灌器材券",
    amount: "1,200 綠點",
    term: "30 日內使用",
    rate: "合作農會器材部",
    description: "兌換滴灌管、接頭與簡易控制器，改善小面積田區的用水效率。",
    purpose: "節水灌溉器材",
    suggestedAmount: "1",
    suggestedLabel: "1 張器材券",
    paymentLabel: "扣除 1,200 綠點",
    planText: "用於更新老舊滴灌管線，完成後回報安裝照片與每月用水紀錄。",
    requiredScore: 1200,
    recommended: true,
  },
  {
    id: "organic-coaching",
    category: "轉型補助",
    name: "友善／有機轉型輔導",
    amount: "1,800 綠點",
    term: "輔導 6 個月",
    rate: "政府與農會共同支持",
    description: "包含田間訪視、無農藥檢測、紀錄表與驗證準備，協助建立可信生產資料。",
    purpose: "友善耕作與無農藥驗證",
    suggestedAmount: "1",
    suggestedLabel: "1 期輔導",
    paymentLabel: "扣除 1,800 綠點",
    planText: "申請友善耕作轉型輔導，補齊用藥、資材與田間管理紀錄。",
    requiredScore: 1800,
  },
  {
    id: "low-carbon-machine",
    category: "設備補助",
    name: "低碳農機共購補助",
    amount: "3,000 綠點",
    term: "每季審查",
    rate: "最高補助 30%",
    description: "以綠點提出低碳農機共購補助，串連農會、政府與企業永續預算。",
    purpose: "節能農機與共同使用設備",
    suggestedAmount: "1",
    suggestedLabel: "1 件補助申請",
    paymentLabel: "扣除 3,000 綠點",
    planText: "申請電動搬運設備共購補助，預計由三戶共同使用並回報節能成果。",
    requiredScore: 3000,
  },
  {
    id: "smart-greenhouse",
    category: "\u8a2d\u5099\u88dc\u52a9",
    name: "\u667a\u6167\u6eab\u5ba4\u74b0\u63a7\u8a2d\u5099\u88dc\u52a9",
    amount: "6,800 \u7da0\u9ede",
    term: "\u8fb2\u6703\u5a92\u5408\u5b89\u88dd",
    rate: "\u4f01\u696d\u914d\u5c0d\u88dc\u52a9 20%",
    description: "\u5305\u542b\u6eab\u6fd5\u5ea6\u611f\u6e2c\u5668\u3001\u5faa\u74b0\u98a8\u6247\u8207\u81ea\u52d5\u6372\u7c3e\u63a7\u5236\uff0c\u964d\u4f4e\u9ad8\u6eab\u71b1\u50b7\u8207\u4e0d\u5fc5\u8981\u7528\u96fb\u3002",
    purpose: "\u6eab\u5ba4\u74b0\u63a7\u8207\u7bc0\u80fd\u6539\u5584",
    suggestedAmount: "1",
    suggestedLabel: "1 \u4ef6\u8a2d\u5099\u88dc\u52a9",
    paymentLabel: "\u6263\u9664 6,800 \u7da0\u9ede",
    planText: "\u7533\u8acb\u667a\u6167\u6eab\u5ba4\u74b0\u63a7\u8a2d\u5099\uff0c\u5b8c\u6210\u5f8c\u56de\u5831\u7528\u96fb\u91cf\u3001\u6eab\u5ea6\u8207\u4f5c\u7269\u640d\u8017\u7d00\u9304\u3002",
    requiredScore: 6800,
  },
  {
    id: "cold-chain-upgrade",
    category: "\u8a2d\u5099\u88dc\u52a9",
    name: "\u51b7\u93c8\u9810\u51b7\u8207\u7bc0\u80fd\u51b7\u85cf\u88dc\u52a9",
    amount: "9,500 \u7da0\u9ede",
    term: "\u5c08\u6848\u5be9\u67e5\u5f8c\u65bd\u4f5c",
    rate: "\u8fb2\u6703\u8207\u4f01\u696d\u5171\u540c\u88dc\u52a9",
    description: "\u5354\u52a9\u5efa\u7f6e\u7522\u5730\u9810\u51b7\u53ca\u9ad8\u6548\u7387\u51b7\u85cf\u8a2d\u5099\uff0c\u964d\u4f4e\u63a1\u5f8c\u640d\u8017\u4e26\u5ef6\u9577\u8fb2\u7522\u54c1\u4fdd\u9bae\u671f\u3002",
    purpose: "\u7522\u5730\u9810\u51b7\u8207\u7bc0\u80fd\u51b7\u85cf",
    suggestedAmount: "1",
    suggestedLabel: "1 \u4ef6\u51b7\u93c8\u6539\u5584\u6848",
    paymentLabel: "\u6263\u9664 9,500 \u7da0\u9ede",
    planText: "\u7533\u8acb\u7522\u5730\u9810\u51b7\u53ca\u7bc0\u80fd\u51b7\u85cf\u6539\u5584\uff0c\u8a18\u9304\u8a2d\u5099\u80fd\u8017\u8207\u63a1\u5f8c\u640d\u8017\u7387\u3002",
    requiredScore: 9500,
  },
  {
    id: "electric-farm-machinery",
    category: "\u8fb2\u6a5f\u5171\u8cfc",
    name: "\u96fb\u52d5\u8fb2\u6a5f\u8207\u5171\u7528\u5145\u96fb\u8a2d\u5099",
    amount: "12,000 \u7da0\u9ede",
    term: "\u8fb2\u6703\u5171\u540c\u63a1\u8cfc",
    rate: "\u6700\u9ad8\u914d\u5c0d 35%",
    description: "\u514c\u63db\u96fb\u52d5\u642c\u904b\u8eca\u3001\u96fb\u52d5\u5272\u8349\u6a5f\u8207\u5171\u7528\u5145\u96fb\u8a2d\u5099\uff0c\u4f9b\u9130\u8fd1\u5c0f\u8fb2\u9810\u7d04\u5171\u540c\u4f7f\u7528\u3002",
    purpose: "\u4f4e\u78b3\u8fb2\u6a5f\u5171\u540c\u4f7f\u7528",
    suggestedAmount: "1",
    suggestedLabel: "1 \u4ef6\u5171\u8cfc\u7533\u8acb",
    paymentLabel: "\u6263\u9664 12,000 \u7da0\u9ede",
    planText: "\u7533\u8acb\u96fb\u52d5\u8fb2\u6a5f\u8207\u5171\u7528\u5145\u96fb\u8a2d\u5099\uff0c\u7531\u5408\u4f5c\u8fb2\u6236\u5171\u540c\u6392\u7a0b\u4e26\u56de\u5831\u4f7f\u7528\u6642\u6578\u3002",
    requiredScore: 12000,
  },
  {
    id: "solar-irrigation-pump",
    category: "\u7da0\u80fd\u8a2d\u5099",
    name: "\u592a\u967d\u80fd\u704c\u6e89\u6cf5\u6d66\u7cfb\u7d71",
    amount: "15,000 \u7da0\u9ede",
    term: "\u6bcf\u534a\u5e74\u5c08\u6848\u5be9\u67e5",
    rate: "\u653f\u5e9c\u3001\u8fb2\u6703\u8207\u4f01\u696d\u914d\u5c0d",
    description: "\u5c07\u50b3\u7d71\u67f4\u6cb9\u6216\u9ad8\u8017\u80fd\u62bd\u6c34\u8a2d\u5099\u6539\u70ba\u592a\u967d\u80fd\u6cf5\u6d66\uff0c\u964d\u4f4e\u704c\u6e89\u80fd\u6e90\u6210\u672c\u8207\u78b3\u6392\u3002",
    purpose: "\u518d\u751f\u80fd\u6e90\u704c\u6e89\u8a2d\u5099",
    suggestedAmount: "1",
    suggestedLabel: "1 \u4ef6\u7cfb\u7d71\u88dc\u52a9",
    paymentLabel: "\u6263\u9664 15,000 \u7da0\u9ede",
    planText: "\u7533\u8acb\u592a\u967d\u80fd\u704c\u6e89\u6cf5\u6d66\uff0c\u5b8c\u5de5\u5f8c\u56de\u5831\u767c\u96fb\u91cf\u3001\u62bd\u6c34\u6642\u6578\u8207\u704c\u6e89\u9762\u7a4d\u3002",
    requiredScore: 15000,
  },
] as const;
const localProjects: LocalProject[] = [
  {
    id: "water",
    kind: "support" as const,
    image: "/farmer-library/heri-leafy/cultivation-1.webp",
    title: "阿蘭・禾日友善農園｜節水灌溉改善",
    farmer: "阿蘭｜禾日友善農園",
    note: "更換滴灌管線與智慧控制器，預估降低 18% 農業用水。",
    purpose: "灌溉管線與節水控制器",
    points: 300,
    progress: 78,
    impact: "用水效率提升 18%",
  },
  {
    id: "rice",
    kind: "support" as const,
    image: "/farmer-library/qinggu-rice/cultivation-1.webp",
    title: "志明・青谷稻作｜友善稻田生態復育",
    farmer: "志明｜青谷稻作",
    note: "建立田埂棲地與減藥示範區，讓稻田兼顧生產與生物多樣性。",
    purpose: "生態田埂與減藥資材",
    points: 220,
    progress: 61,
    impact: "新增 1.2 公頃友善棲地",
  },
  {
    id: "solar-cold",
    kind: "support" as const,
    image: "/farmer-library/shanli-pomelo/cultivation-1.webp",
    title: "美珍・山里果園｜太陽能冷藏設備",
    farmer: "美珍｜山里果園",
    note: "汰換高耗能冷藏櫃並導入太陽能，降低鮮果損耗與用電成本。",
    purpose: "節能冷藏櫃與太陽能設備",
    points: 360,
    progress: 46,
    impact: "採後損耗預估降低 22%",
  },
  {
    id: "circular-pack",
    kind: "support" as const,
    image: "/farmer-library/nuantian-tomato/cultivation-1.webp",
    title: "淑芬・暖田蔬果｜循環包材導入",
    farmer: "淑芬｜暖田蔬果",
    note: "導入可重複使用的產地周轉箱，減少一次性紙箱與塑膠緩衝材。",
    purpose: "循環周轉箱與回收清洗",
    points: 180,
    progress: 69,
    impact: "每年減少約 1,800 個紙箱",
  },
  {
    id: "pollinator",
    kind: "support" as const,
    image: "/farmer-library/xipan-herb/cultivation-1.webp",
    title: "雅惠・溪畔香草園｜授粉棲地營造",
    farmer: "雅惠｜溪畔香草園",
    note: "在田區邊界種植蜜源植物，建立友善蜂類與昆蟲的微型棲地。",
    purpose: "原生蜜源植物與棲地維護",
    points: 160,
    progress: 52,
    impact: "新增 600 平方公尺授粉棲地",
  },
  {
    id: "veggie",
    kind: "redeem" as const,
    image: "/farmer-library/heri-leafy/product.webp",
    title: "淑芬・暖田蔬果｜當季友善蔬菜箱",
    farmer: "淑芬｜暖田蔬果",
    note: "六種當季蔬菜，由產地採收後以循環箱低溫直送。",
    purpose: "產地冷藏直送",
    points: 480,
    progress: 64,
    impact: "支持 3 戶在地小農",
  },
  {
    id: "rice-box",
    kind: "redeem" as const,
    image: "/farmer-library/qinggu-rice/product.webp",
    title: "志明・青谷稻作｜友善耕作米食禮盒",
    farmer: "志明｜青谷稻作",
    note: "包含友善米、米餅與產地故事卡，採減塑包裝配送。",
    purpose: "常溫宅配",
    points: 420,
    progress: 72,
    impact: "支持友善稻作 6 公斤",
  },
  {
    id: "fruit-box",
    kind: "redeem" as const,
    image: "/farmer-library/shanli-pomelo/product.webp",
    title: "美珍・山里果園｜低碳鮮果分享箱",
    farmer: "美珍｜山里果園",
    note: "依當週熟度搭配三款鮮果，以格外果加工品補足箱內內容。",
    purpose: "低溫產地直送",
    points: 560,
    progress: 58,
    impact: "提升格外果利用率 15%",
  },
  {
    id: "herbal-tea",
    kind: "redeem" as const,
    image: "/farmer-library/xipan-herb/product.webp",
    title: "雅惠・溪畔香草園｜無毒香草茶組",
    farmer: "雅惠｜溪畔香草園",
    note: "以自然乾燥的薄荷、香蜂草與迷迭香，組成三款產地茶包。",
    purpose: "常溫減塑配送",
    points: 260,
    progress: 83,
    impact: "支持 120 平方公尺友善香草田",
  },
  {
    id: "veggie-meal",
    kind: "redeem" as const,
    image: "/farmer-library/heri-leafy/product.webp",
    title: "阿蘭・禾日友善農園｜產地蔬食料理包",
    farmer: "阿蘭｜禾日友善農園",
    note: "將當季葉菜與根莖整理成兩人份料理組，附上小農家常食譜。",
    purpose: "冷藏循環箱配送",
    points: 340,
    progress: 67,
    impact: "減少產地蔬菜耗損 12%",
  },
] as const;

const initialImprovementProjects: LocalProject[] = [
  {
    id: "farmer-project-greenhouse",
    kind: "support",
    image: "/farmer-library/heri-leafy/cultivation-2.webp",
    title: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712\uff5c\u667a\u6167\u6eab\u5ba4\u901a\u98a8\u8207\u964d\u6eab",
    farmer: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712",
    note: "\u590f\u5b63\u6eab\u5ba4\u9ad8\u6eab\u5bb9\u6613\u9020\u6210\u8449\u83dc\u71b1\u50b7\uff0c\u8a08\u756b\u5c0e\u5165\u7bc0\u80fd\u5faa\u74b0\u98a8\u6247\u8207\u81ea\u52d5\u901a\u98a8\u63a7\u5236\u3002",
    purpose: "\u7bc0\u80fd\u5faa\u74b0\u98a8\u6247\u3001\u63a7\u5236\u5668\u8207\u5b89\u88dd",
    points: 240,
    progress: 42,
    impact: "\u590f\u5b63\u4f5c\u7269\u71b1\u50b7\u7387\u964d\u4f4e 20%",
    targetPoints: 96000,
    raisedPoints: 40320,
    supporters: 116,
    city: "\u96f2\u6797\u7e23",
    district: "\u6597\u516d\u5e02",
    distance: 1.8,
    allocations: [{ label: "\u8a2d\u5099\u8207\u6750\u6599", percent: 60 }, { label: "\u5b89\u88dd\u8207\u6539\u5584", percent: 25 }, { label: "\u6210\u679c\u8ffd\u8e64", percent: 15 }],
  },
  {
    id: "farmer-project-rainwater",
    kind: "support",
    image: "/farmer-library/heri-leafy/cultivation-1.webp",
    title: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712\uff5c\u96e8\u6c34\u56de\u6536\u8207\u704c\u6e89\u5132\u6c34\u69fd",
    farmer: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712",
    note: "\u589e\u8a2d\u96e8\u6c34\u96c6\u6c34\u69fd\u8207\u904e\u6ffe\u8a2d\u5099\uff0c\u5c07\u96e8\u5b63\u96e8\u6c34\u7559\u4f5c\u4e7e\u5b63\u704c\u6e89\u4f7f\u7528\u3002",
    purpose: "\u96e8\u6c34\u56de\u6536\u69fd\u3001\u904e\u6ffe\u8207\u7ba1\u7dda",
    points: 200,
    progress: 55,
    impact: "\u6bcf\u5e74\u56de\u6536\u96e8\u6c34\u7d04 420 \u5678",
    targetPoints: 82000,
    raisedPoints: 45100,
    supporters: 139,
    city: "\u96f2\u6797\u7e23",
    district: "\u6597\u516d\u5e02",
    distance: 2.4,
    allocations: [{ label: "\u8a2d\u5099\u63a1\u8cfc", percent: 55 }, { label: "\u65bd\u5de5\u8207\u904b\u9001", percent: 30 }, { label: "\u6aa2\u6e2c\u8207\u7d00\u9304", percent: 15 }],
  },
  {
    id: "farmer-project-compost",
    kind: "support",
    image: "/farmer-library/heri-leafy/cultivation-2.webp",
    title: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712\uff5c\u7530\u9593\u5806\u80a5\u8207\u571f\u58e4\u5fa9\u80b2",
    farmer: "\u79be\u65e5\u53cb\u5584\u8fb2\u5712",
    note: "\u5229\u7528\u8fb2\u5834\u679d\u8449\u8207\u683c\u5916\u54c1\u88fd\u4f5c\u5806\u80a5\uff0c\u6539\u5584\u571f\u58e4\u6709\u6a5f\u8cea\u4e26\u964d\u4f4e\u5316\u80a5\u4f9d\u8cf4\u3002",
    purpose: "\u5806\u80a5\u5340\u3001\u9632\u6ef2\u8a2d\u65bd\u8207\u571f\u58e4\u6aa2\u6e2c",
    points: 180,
    progress: 36,
    impact: "\u5316\u5b78\u80a5\u6599\u4f7f\u7528\u91cf\u964d\u4f4e 15%",
    targetPoints: 64000,
    raisedPoints: 23040,
    supporters: 82,
    city: "\u96f2\u6797\u7e23",
    district: "\u6597\u516d\u5e02",
    distance: 3.1,
    allocations: [{ label: "\u8a2d\u5099\u8207\u6750\u6599", percent: 50 }, { label: "\u5b89\u88dd\u8207\u6539\u5584", percent: 35 }, { label: "\u6210\u679c\u8ffd\u8e64", percent: 15 }],
  },
];

function getReceiptNumber(item: LocalProject) {
  const index = localProjects.findIndex((project) => project.id === item.id);
  const customNumber = item.id.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 9000;
  return `GI-20260731-${String(index >= 0 ? 186 + index : 1000 + customNumber).padStart(4, "0")}`;
}

const localProjectStories = {
  water: {
    location: "雲林・西螺",
    headline: "阿蘭想把每一滴水，用在作物真正需要的地方",
    quote: "以前只能靠經驗估算，現在我想讓灌溉更精準，也把省下來的水留下紀錄。",
    paragraphs: [
      "阿蘭每天清晨巡田，最先看的不是葉片，而是土壤濕度與舊管線的漏水位置。夏季水源吃緊時，她常得提早開泵，卻仍難確定每一區是否得到足夠灌溉。",
      "這次專案將田區分成四個灌溉區，搭配滴灌控制器與用水紀錄。綠點支持會優先投入管線、控制器與安裝，完成後再以每月用水量驗證改善成果。",
    ],
  },
  rice: {
    location: "嘉義・太保",
    headline: "志明讓稻田不只收成，也重新成為生物的家",
    quote: "田裡多一隻青蛙、多一種水鳥，對我來說都是友善耕作有回應。",
    paragraphs: [
      "志明接手家中稻田後，開始保留部分田埂植被，也減少非必要用藥。但田區缺少連續棲地，改善成果很難長期維持。",
      "專案會建立生態田埂、淺水區與減藥示範田，並以定期物種觀察留下紀錄。消費者支持的綠點，會成為苗木、友善資材與田區維護的人力。",
    ],
  },
  "solar-cold": {
    location: "花蓮・壽豐",
    headline: "美珍想讓好不容易種出的鮮果，不再敗給高溫與等待",
    quote: "果子成熟後，每多等一天都是風險；冷藏穩定，農人的努力才能完整送到消費者手上。",
    paragraphs: [
      "美珍的果園離主要集貨點較遠，採收旺季常因冷藏空間不足而增加損耗。老舊冰櫃耗電，也無法穩定維持適合鮮果的溫度。",
      "她計畫汰換節能冷藏設備，並以太陽能分擔白天用電。平台將持續記錄耗電與損耗率，讓設備改善成為可追溯的永續成果。",
    ],
  },
  "circular-pack": {
    location: "彰化・溪州",
    headline: "淑芬從一只周轉箱開始，減少產地每天堆起的包材",
    quote: "蔬菜被好好送到餐桌很重要，但包裝不該在送達後立刻變成垃圾。",
    paragraphs: [
      "淑芬每天出貨都要使用大量紙箱與塑膠緩衝材，雨季時紙箱更容易受潮報廢。她和固定通路討論後，決定建立可回收的周轉箱系統。",
      "綠點將支持第一批循環箱、清洗設備與回收標示。每次回收都會形成紀錄，讓消費者看見一只箱子被重複使用了多少次。",
    ],
  },
  pollinator: {
    location: "苗栗・卓蘭",
    headline: "雅惠在香草田邊，替蜜蜂留下一條回家的路",
    quote: "授粉昆蟲願意回來，代表這塊田不只對作物友善，也對周邊生命友善。",
    paragraphs: [
      "雅惠觀察到田邊的蜂類逐年減少，因此開始保留雜草帶並種植原生蜜源植物。單一小區的改善有限，她希望把棲地延伸成連續廊道。",
      "專案將補植不同花期的蜜源植物，設置飲水點並進行季節觀察。成果會以棲地面積、開花期與授粉昆蟲紀錄回傳平台。",
    ],
  },
  veggie: {
    location: "彰化・溪州",
    headline: "淑芬把當週最好吃的六種蔬菜，裝進一只循環箱",
    quote: "蔬菜箱不是把剩下的菜湊在一起，而是讓大家跟著土地吃當季。",
    paragraphs: [
      "每週採收前，淑芬會依成熟度安排蔬菜箱內容，讓葉菜、瓜果與根莖保持平衡。遇到天候變化，她也會附上產地說明與替代料理建議。",
      "這份蔬菜箱採循環箱配送，消費者下一次取貨時可交回。綠點兌換會直接形成在地訂單，也支持農園維持友善資材與穩定雇工。",
    ],
  },
  "rice-box": {
    location: "嘉義・太保",
    headline: "志明把一季稻作的風土，做成可以分享的米食禮盒",
    quote: "我希望大家收到的不只是一包米，還能知道這塊田怎麼被照顧。",
    paragraphs: [
      "志明挑選友善耕作批次製作白米與米餅，並把田區、收穫日期與生態觀察寫進故事卡。包材則盡量減少塑膠與不必要隔層。",
      "每次兌換都對應到清楚的生產批次。消費者能從故事卡回到平台查看耕作紀錄，讓一份禮盒同時支持生產與資訊透明。",
    ],
  },
  "fruit-box": {
    location: "花蓮・壽豐",
    headline: "美珍讓外表不完美的果實，也能找到珍惜它的人",
    quote: "格外果不是不好吃，只是它需要一條不同的路走到消費者手上。",
    paragraphs: [
      "果園每季都有部分鮮果因外觀或尺寸無法進入一般通路。美珍把適合鮮食的果實放入分享箱，其餘則製成果乾與果醬。",
      "低碳鮮果箱依成熟批次出貨，減少長時間庫存。兌換形成的訂單能提高格外果利用，也降低農園在盛產期的損耗。",
    ],
  },
  "herbal-tea": {
    location: "苗栗・卓蘭",
    headline: "雅惠用低溫慢慢乾燥，留住香草最自然的氣味",
    quote: "不急著把水分烘走，香草的味道反而更完整，也能少用一些能源。",
    paragraphs: [
      "雅惠在清晨採收薄荷、香蜂草與迷迭香，完成挑選後以自然通風搭配低溫乾燥，保留香氣並降低耗能。",
      "每組茶包都標示採收批次與沖泡方式，包裝使用減塑材料。綠點兌換讓小量、多樣的香草生產能維持合理收入。",
    ],
  },
  "veggie-meal": {
    location: "雲林・西螺",
    headline: "阿蘭把田裡剛好的份量，變成回家就能料理的一餐",
    quote: "如果處理方式更方便，大家會願意多吃一點當季蔬菜，也能減少田裡的耗損。",
    paragraphs: [
      "阿蘭將規格不同但品質良好的蔬菜整理、清洗並搭配成兩人份料理包，再附上農家常做的簡單食譜。",
      "料理包以當週收成彈性調整，不追求固定菜色。兌換所得支持採後整理與冷藏，也讓更多蔬菜在最佳狀態進入家庭餐桌。",
    ],
  },
} as const;

const roleCycleDetails = {
  consumer: {
    label: "消費者",
    short: "綠色行動者",
    icon: User,
    tone: "consumer",
    source: ["購買綠色商品取得消費回饋", "搭乘大眾運輸、改用電子帳單", "購買節能家電或完成政府企業任務", "自備環保杯、餐具或購物袋等減塑行動"],
    incentive: ["每次行動立即看見綠點回饋", "優先推薦所在地附近的小農", "支持後取得可追蹤的影響力收據"],
    benefit: ["兌換可追溯的小農好物", "直接支持產地改善專案", "把日常選擇累積成地方影響力"],
  },
  farmer: {
    label: "合作小農",
    short: "在地生產者",
    icon: Sprout,
    tone: "farmer",
    source: ["消費者兌換商品帶來綠點收入", "改善專案接受消費者直接支持", "企業配對及永續成果獎勵"],
    incentive: ["農產履歷與無農藥資料提升曝光", "友善耕作成果轉成可信募資條件", "透明回報可獲得更多合作機會"],
    benefit: ["向農會兌換農具與節水設備", "取得檢測、轉型輔導與農業補助", "穩定訂單並持續改善生產環境"],
  },
  institution: {
    label: "銀行／政府／企業",
    short: "綠點推動者",
    icon: Building2,
    tone: "institution",
    source: ["把 ESG、政策或員工福利預算轉為綠點", "與商家及公用事業共同配對點數", "依節能、交通與電子帳單任務發放"],
    incentive: ["用明確獎勵提高綠色行動參與率", "串連地方創生、農業與淨零政策", "取得可追蹤的點數流向與成果資料"],
    benefit: ["累積 ESG 揭露與計畫成效證據", "提升在地小農及永續經濟效益", "提升企業形象"],
  },
} satisfies Record<Role, { label: string; short: string; icon: typeof User; tone: string; source: string[]; incentive: string[]; benefit: string[] }>;

const stories = [
  {
    id: "daily-farming",
    label: "小農工作現場",
    title: "把友善耕作，落實在每一天的田間管理",
    cover: "https://images.pexels.com/photos/35834140/pexels-photo-35834140.jpeg?auto=compress&cs=tinysrgb&w=1400",
    detail: "/stories/friend-farming-detail.webp",
    detailAlt: "阿蘭在同一座溫室檢查滴灌管線並記錄作物狀況",
    person: "阿蘭",
    place: "禾日友善農園・雲林",
    intro: "友善耕作不是一次性的認證，而是每天巡田、調整用水、留下紀錄的累積。",
    quote: "把每次觀察寫下來，才知道土地真的往哪裡改變。",
    paragraphs: [
      "天剛亮，阿蘭先巡過每一排蔬菜。她不只看葉色與蟲害，也檢查滴灌壓力、土壤濕度和前一天的用水量。這些細小但固定的工作，慢慢形成可追溯的永續生產資料。",
      "當設備改善前後的差異被記錄，平台就能把田間行動轉成成果透明度。消費者支持的不只是眼前的一把青菜，也是在幫助農園持續採用更省水、更穩定的生產方式。",
    ],
    metrics: [["18%", "預估節水"], ["4%", "透明度提升"], ["100%", "生產可追溯"]],
    steps: [["看見問題", "灌溉用水不易精準控制"], ["採取行動", "分區滴灌並每日留下紀錄"], ["成果回寫", "驗證節水成果並更新成果透明度"]],
  },
  {
    id: "green-equipment",
    label: "綠色生產",
    title: "更好的設備，帶來更穩定的收成",
    cover: "https://images.pexels.com/photos/11678438/pexels-photo-11678438.jpeg?auto=compress&cs=tinysrgb&w=1000",
    detail: "/stories/green-equipment-detail.webp",
    detailAlt: "志明與採收班在田間檢查同一台綠色採收設備",
    person: "志明與採收班",
    place: "青禾農場・嘉義",
    intro: "設備升級的目的不是追求更大規模，而是降低耗損、改善工作負擔，讓好品質能穩定留下。",
    quote: "機器幫我們省下的，不只是時間，也讓每一批收成都更完整。",
    paragraphs: [
      "過去採收旺季全靠人力追趕，遇到天候變化時，常來不及在最佳時間完成。團隊先記錄損耗、油耗與作業時間，再選擇適合田區規模的採收設備，而不是直接購入最大機型。",
      "這份改善計畫會公開需求、執行里程碑與預估效益。消費者能看懂綠點支持的用途，小農也能用後續生產資料回報設備是否真的發揮作用。",
    ],
    metrics: [["12%", "降低採收耗損"], ["23%", "縮短作業時間"], ["80,000 點", "專案支持目標"]],
    steps: [["盤點需求", "記錄旺季工時與採收耗損"], ["上架專案", "公開設備需求與綠點目標"], ["持續驗證", "回報油耗、產量與品質變化"]],
  },
  {
    id: "impact-tracking",
    label: "綠色消費",
    title: "讓每一筆支持，都能看見後續成果",
    cover: "https://images.pexels.com/photos/18703337/pexels-photo-18703337.jpeg?auto=compress&cs=tinysrgb&w=1000",
    detail: "/stories/impact-tracking-detail.webp",
    detailAlt: "淑芬在同一條灌溉水道測量水位並記錄數據",
    person: "淑芬",
    place: "清泉農園・花蓮",
    intro: "當用水、設備與耕作成果有資料可驗證，消費者與合作夥伴就能看懂小農的行動進度與實際改變。",
    quote: "以前只能說我們很努力，現在可以把改變一筆一筆證明出來。",
    paragraphs: [
      "淑芬每週量測灌溉水位與作物狀態，累積成一份完整的用水紀錄。平台整理紀錄完整度、改善幅度與產銷透明度，讓支持者能直接追蹤專案是否持續前進。",
      "完成設備證明後，她的成果透明度由 82% 提升到 86%，也讓節水改善專案達到公開上架條件。綠點支持因此能與真實永續行動連在一起。",
    ],
    metrics: [["42 筆", "水資源紀錄"], ["82→86", "成果透明度"], ["68,000 點", "專案支持目標"]],
    steps: [["持續記錄", "量測用水與設備運作狀況"], ["資料驗證", "確認紀錄來源與改善幅度"], ["成果公開", "更新專案頁並公開下一階段"]],
  },
  {
    id: "visible-impact",
    label: "地方共好",
    title: "一點一履歷，支持成果清楚可見",
    cover: "https://images.pexels.com/photos/8232776/pexels-photo-8232776.jpeg?auto=compress&cs=tinysrgb&w=1000",
    detail: "/stories/local-impact-detail.webp",
    detailAlt: "美惠在同一座藤蔓農場用手機記錄作物成果",
    person: "美惠",
    place: "暖田蔬果・彰化",
    intro: "消費者投入的每一筆綠點，都會留下支持對象、資源用途、專案進度與預估成果。",
    quote: "有人看見我們做的改變，我們也更願意把過程完整留下來。",
    paragraphs: [
      "美惠把作物照片、資材使用和採收批次上傳平台。消費者支持後，不只收到一張感謝訊息，而是能持續看到資源用在哪裡、專案完成到哪一步。",
      "當成果被驗證，資料會同步更新小農的成果透明度，也成為平台合作夥伴的影響力報告。支持、回報與下一次綠色選擇因此形成循環。",
    ],
    metrics: [["12,680", "累積支持綠點"], ["86 張", "影響力收據"], ["15%", "資源效率提升"]],
    steps: [["綠點投入", "消費者選擇支持改善專案"], ["進度追蹤", "小農回傳採購與執行紀錄"], ["成果公開", "產生收據並回寫成果透明度"]],
  },
  {
    id: "start-cycle",
    label: "現在開始",
    title: "從一塊田開始，走進綠色循環",
    cover: "https://images.pexels.com/photos/9448904/pexels-photo-9448904.jpeg?auto=compress&cs=tinysrgb&w=1000",
    detail: "/stories/start-cycle-detail.webp",
    detailAlt: "鳳珠沿著同一片梯田行走並帶著準備種植的幼苗",
    person: "鳳珠",
    place: "山里梯田・花蓮",
    intro: "不論從消費、商品上架或地方合作開始，每一個角色都能讓地方的改變多走一步。",
    quote: "一開始只想把田顧好，後來才發現，每份紀錄都能為下一步多開一扇門。",
    paragraphs: [
      "鳳珠從三塊梯田的生產紀錄開始，把耕作方式、資材與收成一一整理。當資料逐漸完整，她能看見自己的改善方向，也更容易向平台合作夥伴說明綠點支持真正要解決的問題。",
      "綠色循環不要求一次做到完美。消費者的一次支持、小農的一筆紀錄、合作夥伴的一次協作，都能成為地方持續前進的起點。",
    ],
    metrics: [["3 塊", "示範田區"], ["6 個月", "改善週期"], ["75%", "首項方案公開度"]],
    steps: [["選擇角色", "從消費者、小農或合作夥伴端開始"], ["完成行動", "回傳證明、補充資料或共享成果"], ["形成循環", "成果回到平台並創造更多綠色選擇"]],
  },
] as const;

const heroSlides = [
  {
    image: "https://images.pexels.com/photos/35834141/pexels-photo-35834141.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "農人在友善耕作的蔬菜田中工作",
    label: "小農工作現場",
    title: "友善耕作，從每日田間管理開始",
  },
  {
    image: "https://images.pexels.com/photos/11678438/pexels-photo-11678438.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "小農檢視田間作物與生產設備",
    label: "綠色生產",
    title: "改善設備，讓收成與環境一起變好",
  },
  {
    image: "https://images.pexels.com/photos/18703337/pexels-photo-18703337.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "農業生產成果與永續行動紀錄",
    label: "綠色消費",
    title: "每一筆綠點，都留下看得見的成果",
  },
  {
    image: "https://images.pexels.com/photos/8232776/pexels-photo-8232776.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "在地農產與地方小農的生產成果",
    label: "地方共好",
    title: "每一點支持，都留下看得見的成果",
  },
] as const;

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark"><Leaf /></span>
      綠色消費平台
    </span>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  small = false,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  small?: boolean;
  wide?: boolean;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className={`modal ${small ? "modal-small" : ""} ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="關閉"><X /></button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function GreenPlatformApp({ initialPortal, initialSessionExpected = false }: { initialPortal?: LoginRole; initialSessionExpected?: boolean } = {}) {
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [adminMode, setAdminMode] = useState(false);
  const [role, setRole] = useState<Role>(initialPortal && initialPortal !== "admin" ? initialPortal : "consumer");
  const [loginRole, setLoginRole] = useState<LoginRole>(initialPortal ?? "consumer");
  const [modal, setModal] = useState<Modal>(null);
  const [points, setPoints] = useState(1280);
  const [farmerPoints, setFarmerPoints] = useState(3680);
  const [farmerProducts, setFarmerProducts] = useState<FarmerProduct[]>(initialFarmerProducts);
  const [farmerProjects, setFarmerProjects] = useState<LocalProject[]>(initialImprovementProjects);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [incentivePlans, setIncentivePlans] = useState<IncentiveProgram[]>(incentivePrograms);
  const [supportedProjectIds, setSupportedProjectIds] = useState<string[]>([]);
  const [redeemedProjectIds, setRedeemedProjectIds] = useState<string[]>([]);
  const [orderStages, setOrderStages] = useState<Record<string, number>>({});
  const [evidence, setEvidence] = useState(false);
  const [invoiceStage, setInvoiceStage] = useState<"form" | "scanning" | "success">("form");
  const [lastVerifiedInvoice, setLastVerifiedInvoice] = useState<InvoiceVerificationInput | null>(null);
  const [period, setPeriod] = useState("半年");
  const [selectedOfferId, setSelectedOfferId] = useState("soil-test");
  const [selectedResourceRedemptionId, setSelectedResourceRedemptionId] = useState("");
  const [selectedLocalActionId, setSelectedLocalActionId] = useState("");
  const [fundingStep, setFundingStep] = useState(0);
  const [selectedFarmerName, setSelectedFarmerName] = useState(farmers[0].name);
  const [selectedProjectId, setSelectedProjectId] = useState("water");
  const [lastSupportedId, setLastSupportedId] = useState("water");
  const [lastRedeemedId, setLastRedeemedId] = useState("veggie");
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [consumerPage, setConsumerPage] = useState<ConsumerPage>("overview");
  const [farmerPage, setFarmerPage] = useState<FarmerPage>("overview");
  const [institutionPage, setInstitutionPage] = useState<InstitutionPage>("overview");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedStoryId, setSelectedStoryId] = useState<string>(stories[0].id);
  const [toast, setToast] = useState("");
  const [cycleOpen, setCycleOpen] = useState(false);
  const [outcomeProjectId, setOutcomeProjectId] = useState("water");
  const [backendState, setBackendState] = useState<BackendSnapshot | null>(null);
  const [backendError, setBackendError] = useState("");
  const [backendBusy, setBackendBusy] = useState(false);
  const [accountLoading, setAccountLoading] = useState(initialSessionExpected || (Boolean(initialPortal) && initialPortal !== "consumer"));
  const [sessionRestoreError, setSessionRestoreError] = useState("");
  const [sessionRestoreAttempt, setSessionRestoreAttempt] = useState(0);
  const [loginError, setLoginError] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [publicContent, setPublicContent] = useState<PublicContent>({ stories: [], news: [] });
  const requestRole = initialPortal ?? loginRole;

  function applyBackendSnapshot(snapshot: BackendSnapshot) {
    setBackendState(snapshot);
    setPoints(snapshot.consumer.points);
    setFarmerPoints(snapshot.farmer.points);
    setFarmerProducts(snapshot.products);
    setFarmerProjects(snapshot.projects);
    setIncentivePlans(snapshot.incentives);
    setEvidence(snapshot.evidence.some((item) => item.evidenceType === "低碳作業證明"));
    setSupportedProjectIds(snapshot.supportedProjectIds);
    setRedeemedProjectIds(snapshot.redeemedProductIds);
    setOrderStages(Object.fromEntries(snapshot.orders.map((order) => [order.productId, order.stage])));
    setSelectedProjectId((current) => snapshot.catalog.some((item) => item.id === current) ? current : snapshot.catalog[0]?.id ?? current);
    setLastSupportedId((current) => snapshot.supportedProjectIds.includes(current) ? current : snapshot.projects[0]?.id ?? current);
    setLastRedeemedId((current) => snapshot.redeemedProductIds.includes(current) ? current : snapshot.productsForConsumer[0]?.id ?? current);
  }

  async function refreshBackend(roleOverride: LoginRole = requestRole) {
    setBackendBusy(true);
    try {
      const response = await fetch("/api/platform", { cache: "no-store", credentials: "same-origin", headers: { "x-gfes-role": roleOverride } });
      if (!response.ok) throw new Error("後台資料讀取失敗");
      const snapshot = await response.json() as BackendSnapshot;
      applyBackendSnapshot(snapshot);
      setBackendError("");
      return true;
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : "後台資料讀取失敗");
      return false;
    } finally {
      setBackendBusy(false);
    }
  }

  async function refreshPublicContent() {
    try {
      const response = await fetch("/api/public", { cache: "no-store" });
      if (!response.ok) return;
      setPublicContent(await response.json() as PublicContent);
    } catch {
      // 公開內容載入失敗時保留既有首頁，登入與其他功能仍可使用。
    }
  }

  async function sendAction(action: string, payload: Record<string, unknown> = {}, options: { confirmedByCheckbox?: boolean } = {}) {
    if (!options.confirmedByCheckbox && !confirmWorkflowAction(action, payload)) return null;
    setBackendBusy(true);
    try {
      const response = await fetch("/api/platform", {
        method: "POST",
        headers: { "content-type": "application/json", "x-gfes-csrf": csrfToken, "x-gfes-role": requestRole },
        body: JSON.stringify({ ...payload, action }),
      });
      const result = await response.json() as { snapshot?: BackendSnapshot; error?: string };
      if (!response.ok || !result.snapshot) throw new Error(result.error || "後台操作失敗");
      applyBackendSnapshot(result.snapshot);
      setBackendError("");
      return result.snapshot;
    } catch (error) {
      const message = error instanceof Error ? error.message : "後台操作失敗";
      setBackendError(message);
      setToast(message);
      return null;
    } finally {
      setBackendBusy(false);
    }
  }

  async function submitActionProof(actionType: string, note: string, file: File) {
    setBackendBusy(true);
    try {
      const form = new FormData();
      form.set("actionType", actionType);
      form.set("note", note);
      form.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", headers: { "x-gfes-csrf": csrfToken, "x-gfes-role": requestRole }, body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "行動證明上傳失敗");
      await refreshBackend();
      setBackendError("");
      setToast("行動證明已送出，待管理員審核後發放綠點");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "行動證明上傳失敗";
      setBackendError(message);
      setToast(message);
      return false;
    } finally {
      setBackendBusy(false);
    }
  }

  async function uploadGreenFinDocument(domain: string, uploadNote: string, file: File) {
    if (!window.confirm(`流程最終確認\n\n確認將「${file.name}」上傳至 GreenFin？\n\n送出後會執行 SIMULATED OCR，仍需您確認欄位。`)) return false;
    setBackendBusy(true);
    try {
      const form = new FormData();
      form.set("domain", domain);
      form.set("sourceLevel", "V1");
      form.set("uploadNote", uploadNote);
      form.set("file", file);
      const response = await fetch("/api/greenfin/documents", { method: "POST", headers: { "x-gfes-csrf": csrfToken, "x-gfes-role": requestRole }, body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "GreenFin 文件上傳失敗");
      setBackendError("");
      setToast(`${file.name} 已上傳，SIMULATED OCR 已完成`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "GreenFin 文件上傳失敗";
      setBackendError(message);
      setToast(message);
      return false;
    } finally {
      setBackendBusy(false);
    }
  }

  async function uploadFarmerMedia(file: File, mediaKind: "story" | "news") {
    setBackendBusy(true);
    try {
      const form = new FormData();
      form.set("submissionType", "farmer_media");
      form.set("mediaKind", mediaKind);
      form.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", headers: { "x-gfes-csrf": csrfToken, "x-gfes-role": requestRole }, body: form });
      const result = await response.json() as { error?: string; fileKey?: string; imageUrl?: string };
      if (!response.ok || !result.fileKey || !result.imageUrl) throw new Error(result.error || "圖片上傳失敗");
      return { fileKey: result.fileKey, imageUrl: result.imageUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "圖片上傳失敗";
      setBackendError(message);
      setToast(message);
      return null;
    } finally {
      setBackendBusy(false);
    }
  }

  async function saveFarmerStory(values: Record<string, unknown>) {
    const snapshot = await sendAction("update_farmer_story", values);
    if (!snapshot) return false;
    await refreshPublicContent();
    setToast(values.status === "published" ? "農場故事已發布到首頁" : "農場故事草稿已儲存");
    return true;
  }

  async function saveFarmerNews(values: Record<string, unknown>) {
    const snapshot = await sendAction(values.id ? "update_farmer_news" : "create_farmer_news", values);
    if (!snapshot) return false;
    await refreshPublicContent();
    setToast(values.status === "published" ? "最新消息已推送到首頁與相關消費者" : "最新消息草稿已儲存");
    return true;
  }

  useEffect(() => {
    void (async () => {
      setAccountLoading(true);
      setSessionRestoreError("");
      try {
        await refreshPublicContent();
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get("authError");
        const oauthRole = params.get("authRole") as LoginRole | null;
        const approvalPending = params.get("approval") === "pending";
        if (approvalPending) {
          if (oauthRole && oauthRole in loginRoles) setLoginRole(oauthRole);
          setRegistrationNotice("註冊申請已送出，需經平台管理員審核通過後才能登入，預計需要 1～3 個工作天。");
          setModal("login");
        }
        if (oauthError) {
          if (oauthRole && oauthRole in loginRoles) setLoginRole(oauthRole);
          setLoginError(oauthError);
          setModal("login");
        }
        if (oauthError || approvalPending || params.has("auth")) {
          params.delete("authError");
          params.delete("authRole");
          params.delete("approval");
          params.delete("auth");
          const query = params.toString();
          window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
        }
        const roleForPath = initialPortal ?? loginRole;
        const response = await fetch("/api/auth", { cache: "no-store", credentials: "same-origin", headers: { "x-gfes-role": roleForPath } });
        if (response.status === 401) {
          setCsrfToken("");
          setBackendState(null);
          if (initialPortal) {
            setLoginRole(initialPortal);
            setModal("login");
          }
          return;
        }
        if (!response.ok) throw new Error("登入狀態暫時無法確認");
        const session = await response.json() as { role: LoginRole; csrfToken: string };
        if (initialPortal && session.role !== initialPortal) {
          setCsrfToken("");
          setLoginRole(initialPortal);
          setLoginError(`這是${loginRoles[initialPortal].label}專用入口，請使用對應角色帳號登入。原角色仍保持登入。`);
          setModal("login");
          return;
        }
        setBackendState(null);
        setCsrfToken(session.csrfToken);
        setLoginRole(session.role);
        const loaded = await refreshBackend(session.role);
        if (!loaded) throw new Error("登入狀態已保留，但專屬資料暫時無法載入");
        openRoleWorkspace(session.role, true);
      } catch (error) {
        setSessionRestoreError(error instanceof Error ? error.message : "登入狀態暫時無法確認");
      } finally {
        setAccountLoading(false);
      }
    })();
  }, [initialPortal, sessionRestoreAttempt]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (screen !== "dashboard" || adminMode) return;
    const section = role === "consumer" ? consumerPage : role === "farmer" ? farmerPage : institutionPage;
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    url.searchParams.set("section", section);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState(window.history.state, "", nextUrl);
  }, [screen, adminMode, role, consumerPage, farmerPage, institutionPage]);

  useEffect(() => {
    if (heroPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroPaused]);

  const supported = supportedProjectIds.length > 0;
  const redeemed = redeemedProjectIds.length > 0;
  const availableLocalProjects = useMemo(() => backendState?.catalog ?? [...farmerProjects, ...localProjects], [backendState, farmerProjects]);
  const managedFarmerProjects = useMemo(() => backendState?.projects ?? [localProjects[0], ...farmerProjects], [backendState, farmerProjects]);
  const supportedProjects = availableLocalProjects.filter((item) => item.kind === "support" && supportedProjectIds.includes(item.id));
  const redeemedProjects = availableLocalProjects.filter((item) => item.kind === "redeem" && redeemedProjectIds.includes(item.id));
  const receiptItems = [...supportedProjects, ...redeemedProjects];
  const selectedProject = availableLocalProjects.find((item) => item.id === selectedProjectId) || localProjects[0];
  const receiptProject = availableLocalProjects.find((item) => item.id === lastSupportedId) || localProjects[0];
  const invoiceRewardPoints = backendState?.integrationSettings.find((item) => item.serviceKey === "invoice")?.rewardPoints ?? 120;
  const signedInDisplayName = role === "consumer"
    ? backendState?.consumer.displayName
    : role === "farmer"
      ? backendState?.farmer.displayName
      : backendState?.institution.displayName;

  function openLogin() {
    setLoginError("");
    setLoginRole(initialPortal ?? role);
    setModal("login");
  }

  async function saveConsumerSettings(values: ConsumerSettings) {
    const snapshot = await sendAction("update_consumer_settings", values);
    if (!snapshot) return false;
    setToast("個人資料與地址設定已儲存");
    return true;
  }

  function openStory(id: string) {
    setSelectedStoryId(id);
    setModal("story");
  }

  function openFunding(id = "soil-test") {
    setSelectedOfferId(id);
    setFundingStep(0);
    setModal("offer");
  }

  async function redeemResource(values: ResourceRedemptionDraft, confirmedByCheckbox = false) {
    const snapshot = await sendAction("redeem_resource", { offerId: selectedOfferId, ...values }, { confirmedByCheckbox });
    if (!snapshot) return false;
    const redemption = snapshot.resourceRedemptions.find((item) => item.offerId === selectedOfferId);
    if (redemption) setSelectedResourceRedemptionId(redemption.id);
    setToast("農會資源兌換已成立，可查看收據與履約進度");
    return true;
  }

  function openResourceReceipt(redemptionId: string) {
    setSelectedResourceRedemptionId(redemptionId);
    setModal("resource-receipt");
  }

  function advanceResourceRedemption(redemptionId: string) {
    void sendAction("advance_resource_redemption", { redemptionId }).then((snapshot) => snapshot && setToast("農會資源履約進度已更新"));
  }
  function openProduct(productId: string | null = null) {
    setSelectedProductId(productId);
    setModal("product");
  }

  async function saveFarmerProduct(values: Omit<FarmerProduct, "id" | "image">) {
    const snapshot = await sendAction(selectedProductId ? "update_product" : "create_product", {
      ...(selectedProductId ? { id: selectedProductId } : {}),
      ...values,
    });
    if (!snapshot) return;
    setModal(null);
    setToast(`${values.title} 已寫入後台商品目錄，消費者可立即看到`);
    return;
    if (selectedProductId) {
      setFarmerProducts((items) => items.map((item) => item.id === selectedProductId ? { ...item, ...values } : item));
      setToast(`${values.title} 的綠點與庫存已更新`);
    } else {
      const product: FarmerProduct = {
        ...values,
        id: `product-${Date.now()}`,
        image: localProjects.find((item) => item.id === "veggie")?.image ?? localProjects[0].image,
      };
      setFarmerProducts((items) => [product, ...items]);
      setToast(`${values.title} 已上架，附近消費者現在可以看見`);
    }
    setModal(null);
  }

  async function saveFarmerProject(values: ImprovementProjectDraft) {
    const snapshot = await sendAction("create_project", values);
    if (!snapshot) return;
    setFarmerPage("projects");
    setModal(null);
    setToast(`${values.title} 已建立並發佈到小農改善專案`);
    return;
    const project: LocalProject = {
      ...values,
      id: `farmer-project-${Date.now()}`,
      kind: "support",
      image: localProjects[0].image,
      title: `阿蘭・禾日友善農園｜${values.title}`,
      farmer: "阿蘭｜禾日友善農園",
      progress: 0,
      raisedPoints: 0,
      supporters: 0,
    };
    setFarmerProjects((items) => [project, ...items]);
    setFarmerPage("projects");
    setModal(null);
    setToast(`${values.title} 已公開，消費者現在可以投入綠點支持`);
  }

  async function saveIncentivePlan(values: IncentiveProgramDraft) {
    const snapshot = await sendAction("create_incentive", {
      name: values.name,
      sponsor: values.sponsor,
      activityDescription: values.activityDescription,
      rewardPoints: values.rewardPoints,
      reward: `每次 ${values.rewardPoints.toLocaleString()} 點`,
      budgetPoints: values.budgetPoints,
      participantCount: values.participantCount,
      participantUnit: values.participantUnit,
      esg: values.esg,
    });
    if (!snapshot) return;
    setModal(null);
    setToast(`${values.name} 已寫入後台激勵計畫`);
  }
  function openPortfolio(name = farmers[0].name) {
    setSelectedFarmerName(name);
    setModal("portfolio");
  }

  function openLocalProject(id: string) {
    const project = availableLocalProjects.find((item) => item.id === id) || localProjects[0];
    setSelectedProjectId(project.id);
    if (project.kind === "support" && supportedProjectIds.includes(project.id)) {
      setLastSupportedId(project.id);
      setModal("receipt");
      return;
    }
    if (project.kind === "redeem" && redeemedProjectIds.includes(project.id)) {
      setLastRedeemedId(project.id);
      setConsumerPage("orders");
      setModal(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setModal(project.kind === "support" ? "support" : "redeem");
  }

  function goToLocalSupport() {
    setConsumerPage("local");
    setModal(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLocalProjectStory(id: string) {
    const project = availableLocalProjects.find((item) => item.id === id) || localProjects[0];
    setSelectedProjectId(project.id);
    setModal("local-story");
  }

  async function enterDashboard(email: string, password: string) {
    setBackendBusy(true);
    setLoginError("");
    setRegistrationNotice("");
    setSessionRestoreError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-gfes-role": loginRole },
        body: JSON.stringify({ role: loginRole, email, password }),
      });
      const result = await response.json() as { error?: string; csrfToken?: string };
      if (!response.ok || !result.csrfToken) throw new Error(result.error || "登入失敗");
      setCsrfToken(result.csrfToken);
      setBackendState(null);
      const loaded = await refreshBackend(loginRole);
      if (!loaded) throw new Error("無法載入這個帳戶的專屬資料，請重新登入。");
      openRoleWorkspace(loginRole);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "登入失敗，請重新確認帳號與密碼。");
    } finally {
      setBackendBusy(false);
    }
  }

  function openRoleWorkspace(nextRole: LoginRole, preserveSection = false) {
    if (window.location.pathname !== portalPaths[nextRole]) {
      window.history.replaceState({}, "", portalPaths[nextRole]);
    }
    if (nextRole === "admin") {
      setAdminMode(true);
      setModal(null);
      window.scrollTo({ top: 0 });
      return;
    }
    setAdminMode(false);
    setRole(nextRole);
    setModal(null);
    setScreen("dashboard");
    if (preserveSection) {
      const section = readPortalSection(nextRole, window.location.search);
      if (nextRole === "consumer") setConsumerPage(section as ConsumerPage);
      if (nextRole === "farmer") setFarmerPage(section as FarmerPage);
      if (nextRole === "institution") setInstitutionPage(section as InstitutionPage);
    } else {
      setConsumerPage("overview");
      setFarmerPage("overview");
      setInstitutionPage("overview");
    }
    window.scrollTo({ top: 0 });
  }

  async function registerAccount(displayName: string, username: string, email: string, password: string) {
    if (loginRole === "admin") {
      setLoginError("平台管理員帳號不開放自行註冊。");
      return;
    }
    setBackendBusy(true);
    setLoginError("");
    setRegistrationNotice("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: loginRole, displayName, username, email, password }),
      });
      const result = await response.json() as { error?: string; csrfToken?: string; role?: LoginRole; pendingApproval?: boolean; message?: string; estimatedReviewTime?: string };
      if (!response.ok || !result.role) throw new Error(result.error || "註冊失敗");
      if (result.pendingApproval) {
        const message = result.message || `註冊申請已送出，管理員審核約需 ${result.estimatedReviewTime || "1～3 個工作天"}。`;
        setLoginRole(result.role);
        setRegistrationNotice(message);
        setToast("註冊申請已送出，請等待管理員審核");
        return;
      }
      if (!result.csrfToken) throw new Error(result.error || "註冊失敗");
      setCsrfToken(result.csrfToken);
      setLoginRole(result.role);
      setBackendState(null);
      const loaded = await refreshBackend(result.role);
      if (!loaded) throw new Error("帳號已建立，但專屬資料載入失敗，請重新登入。");
      openRoleWorkspace(result.role);
      setToast("帳號已建立並完成登入");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "註冊失敗，請稍後再試。");
    } finally {
      setBackendBusy(false);
    }
  }

  async function backHome() {
    await fetch("/api/auth", { method: "DELETE", credentials: "same-origin", headers: { "x-gfes-role": requestRole } }).catch(() => undefined);
    setCsrfToken("");
    setBackendState(null);
    setBackendError("");
    setSessionRestoreError("");
    setAdminMode(false);
    setScreen("home");
    if (initialPortal) {
      setLoginRole(initialPortal);
      setModal("login");
    } else {
      setModal(null);
    }
    window.scrollTo({ top: 0 });
  }

  function refreshData() {
    if (backendState) {
      void refreshBackend();
      setToast("已重新整理後台資料");
      return;
    }
    setPoints(1280);
    setFarmerPoints(3680);
    setFarmerProducts(initialFarmerProducts);
    setFarmerProjects([]);
    setSelectedProductId(null);
    setIncentivePlans(incentivePrograms);
    setSupportedProjectIds([]);
    setRedeemedProjectIds([]);
    setOrderStages({});
    setEvidence(false);
    setInvoiceStage("form");
    setFundingStep(0);
    setSelectedOfferId("soil-test");
    setSelectedProjectId("water");
    setLastSupportedId("water");
    setLastRedeemedId("veggie");
    setToast("資料已重新整理");
  }

  function verifyInvoice(input: InvoiceVerificationInput) {
    const normalizedInput: InvoiceVerificationInput = {
      mode: input.mode,
      invoiceNumber: input.invoiceNumber.trim().toUpperCase(),
      amount: Number(input.amount),
      transactionDate: input.transactionDate,
      randomCode: input.randomCode.trim(),
      note: input.note?.trim() || undefined,
    };
    const verificationPayload = { serviceKey: "invoice", input: { ...normalizedInput, submittedFrom: "consumer" } };
    if (backendState && !confirmWorkflowAction("simulate_integration", verificationPayload)) return;
    setLastVerifiedInvoice(normalizedInput);
    setInvoiceStage("scanning");
    window.setTimeout(() => {
      if (backendState) {
        void sendAction("simulate_integration", verificationPayload, { confirmedByCheckbox: true }).then((snapshot) => setInvoiceStage(snapshot ? "success" : "form"));
        return;
      }
      setPoints((value) => value + 120);
      setInvoiceStage("success");
    }, 950);
  }

  function updateConsumerLocation(city: string, district: string) {
    void sendAction("set_location", { city, district }).then((snapshot) => snapshot && setToast(`推薦地區已更新為 ${city}${district}`));
  }

  function openLocalActionRegistration(actionId: string) {
    setSelectedLocalActionId(actionId);
    setModal("local-action-registration");
  }

  async function registerLocalAction(values: LocalActionRegistrationDraft) {
    const action = backendState?.localActions.find((item) => item.id === selectedLocalActionId);
    const snapshot = await sendAction("register_local_action", { actionId: selectedLocalActionId, ...values }, { confirmedByCheckbox: true });
    if (!snapshot) return;
    setModal(null);
    setToast(`已完成「${action?.title ?? "綠色行動"}」報名，參加資料已保存`);
  }

  function visitNearbyPlace(address: string, title: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank", "noopener,noreferrer");
    setToast(`已開啟「${title}」地點資訊`);
  }

  function openOutcomeReport(projectId: string) {
    setOutcomeProjectId(projectId);
    setModal("outcome");
  }

  async function submitOutcomeReport(values: { waterLiters: number; carbonKg: number; beneficiaries: number; note: string }) {
    const snapshot = await sendAction("submit_outcome", { projectId: outcomeProjectId, ...values });
    if (!snapshot) return;
    setModal(null);
    setToast("成果回報已送出，等待銀行／政府／企業後台審核");
  }

  function submitEvidenceRecord() {
    void sendAction("submit_evidence", {
      title: "低碳設備使用紀錄",
      evidenceType: "低碳作業證明",
    }).then((snapshot) => {
      if (!snapshot) return;
      setEvidence(true);
      setModal(null);
      setToast("證明已送出並寫入後台紀錄");
    });
  }

  async function supportFarm() {
    if (selectedProject.kind === "support" && selectedProject.status && selectedProject.status !== "funding") {
      const statusLabel = selectedProject.status === "review" ? "專案審核中" : selectedProject.status === "completed" ? "專案已完成" : "專案已下架";
      setToast(`${statusLabel}，目前無法接受支持`);
      return;
    }
    if (backendState) {
      if (supportedProjectIds.includes(selectedProject.id)) {
        setLastSupportedId(selectedProject.id);
        setModal("receipt");
        return;
      }
      const snapshot = await sendAction("support_project", { projectId: selectedProject.id });
      if (!snapshot) return;
      setLastSupportedId(selectedProject.id);
      setModal("receipt");
      setToast(`已支持 ${selectedProject.points} 點，後台已建立一點一履歷紀錄`);
      return;
    }
    const alreadySupported = supportedProjectIds.includes(selectedProject.id);
    if (!alreadySupported && points < selectedProject.points) {
      setToast(`綠點不足，還差 ${selectedProject.points - points} 點`);
      return;
    }
    if (!alreadySupported) {
      setPoints((value) => Math.max(0, value - selectedProject.points));
      setSupportedProjectIds((ids) => [...ids, selectedProject.id]);
      setFarmerProjects((items) => items.map((item) => {
        if (item.id !== selectedProject.id) return item;
        const raisedPoints = Math.min(item.targetPoints ?? 0, (item.raisedPoints ?? 0) + item.points);
        const progress = item.targetPoints ? Math.min(100, Math.round((raisedPoints / item.targetPoints) * 100)) : item.progress;
        return { ...item, raisedPoints, progress, supporters: (item.supporters ?? 0) + 1 };
      }));
    }
    setLastSupportedId(selectedProject.id);
    setModal("receipt");
    setToast(`已完成 ${selectedProject.points} 綠點支持，影響力收據已新增`);
  }

  async function redeemProduct(shippingDetails?: ShippingDetails) {
    if (backendState && selectedProject.kind === "redeem") {
      if (redeemedProjectIds.includes(selectedProject.id)) {
        setLastRedeemedId(selectedProject.id);
        setConsumerPage("orders");
        setModal(null);
        return;
      }
      if (!shippingDetails) return;
      const snapshot = await sendAction("redeem_product", { productId: selectedProject.id, quantity: 1, ...shippingDetails });
      if (!snapshot) return;
      setLastRedeemedId(selectedProject.id);
      setConsumerPage("orders");
      setModal(null);
      setToast("兌換成功，已建立小農訂單");
      return;
    }
    const alreadyRedeemed = redeemedProjectIds.includes(selectedProject.id);
    if (!alreadyRedeemed && points < selectedProject.points) {
      setToast(`綠點不足，還差 ${selectedProject.points - points} 點`);
      return;
    }
    if (!alreadyRedeemed) {
      setPoints((value) => Math.max(0, value - selectedProject.points));
      setRedeemedProjectIds((ids) => [...ids, selectedProject.id]);
      setOrderStages((stages) => ({ ...stages, [selectedProject.id]: 0 }));
    }
    setLastRedeemedId(selectedProject.id);
    setConsumerPage("orders");
    setModal(null);
    setToast(alreadyRedeemed ? "已開啟兌換訂單進度" : "兌換成功，影響力收據與訂單已同步新增");
  }

  function downloadReport() {
    const link = document.createElement("a");
    link.href = "/reports/GFES_green_consumption_impact_summary_2026H1.pdf";
    link.download = "GFES_綠色消費與在地小農影響力摘要_2026上半年.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setToast("四頁正式版 PDF 影響力摘要已下載");
  }

  function downloadReceipt(item: LocalProject = receiptProject) {
    const receiptNumber = getReceiptNumber(item);
    const lines = [
      "GFES 綠色消費平台｜影響力收據",
      `收據類型：${item.kind === "redeem" ? "小農好物兌換" : "小農改善支持"}`,
      `${item.kind === "redeem" ? "兌換來源" : "支持對象"}：${item.farmer}`,
      `${item.kind === "redeem" ? "兌換商品" : "支持專案"}：${item.title}`,
      `使用綠點：${item.points} 點`,
      `預估成果：${item.impact}`,
      `收據編號：${receiptNumber}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `GFES-${item.farmer.split("｜")[0]}-影響力收據.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setToast(`${item.farmer} 的影響力收據已下載`);
  }

  const modals = (
    <>
      {modal === "login" && (
        <LoginModal
          role={loginRole}
          lockedRole={initialPortal}
          setRole={(nextRole) => { setLoginRole(initialPortal ?? nextRole); setLoginError(""); setRegistrationNotice(""); }}
          error={loginError}
          registrationNotice={registrationNotice}
          busy={backendBusy}
          onClose={() => { setModal(null); setLoginError(""); setRegistrationNotice(""); }}
          onDismissRegistrationNotice={() => setRegistrationNotice("")}
          onEnter={enterDashboard}
          onRegister={registerAccount}
          onGoogleLogin={(selectedRole) => {
            const isLocalPreview = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
            const authOrigin = isLocalPreview ? "https://gfes-green-consumption.pages.dev" : "";
            window.location.assign(`${authOrigin}/api/auth/google?role=${encodeURIComponent(selectedRole)}`);
          }}
        />
      )}
      {modal === "local-story" && (
        <LocalProjectStoryModal
          item={selectedProject}
          onAction={() => setModal(selectedProject.kind === "support" ? "support" : "redeem")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "story" && (
        <StoryModal
          storyId={selectedStoryId}
          onNext={(id) => setSelectedStoryId(id)}
          onExperience={openLogin}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "invoice" && (
        <InvoiceModal
          stage={invoiceStage}
          rewardPoints={invoiceRewardPoints}
          invoice={lastVerifiedInvoice}
          onClose={() => setModal(null)}
          onVerify={verifyInvoice}
        />
      )}
      {modal === "support" && (
        <ActionModal item={selectedProject} done={supportedProjectIds.includes(selectedProject.id)} balance={points} onClose={() => setModal(null)} onConfirm={supportFarm} />
      )}
      {modal === "redeem" && (
        <ActionModal item={selectedProject} done={redeemedProjectIds.includes(selectedProject.id)} balance={points} defaultShipping={{ recipientName: backendState?.consumerSettings.deliveryRecipientName ?? backendState?.consumer.displayName ?? "", recipientPhone: backendState?.consumerSettings.deliveryPhone ?? "", postalCode: backendState?.consumerSettings.deliveryPostalCode ?? "", shippingCity: backendState?.consumerSettings.deliveryCity ?? backendState?.consumer.city ?? "", shippingDistrict: backendState?.consumerSettings.deliveryDistrict ?? backendState?.consumer.district ?? "", shippingAddress: backendState?.consumerSettings.deliveryAddress ?? "", deliveryNote: backendState?.consumerSettings.deliveryNote ?? "" }} onClose={() => setModal(null)} onConfirm={redeemProduct} />
      )}
      {modal === "receipt" && <ReceiptModal supported={supported} item={receiptProject} onDownload={() => downloadReceipt(receiptProject)} onExplore={goToLocalSupport} onClose={() => setModal(null)} />}
      {modal === "evidence" && (
        <EvidenceModal
          added={evidence}
          onClose={() => setModal(null)}
          onSubmit={submitEvidenceRecord}
        />
      )}
      {modal === "offer" && (
        <OfferModal
          balance={farmerPoints}
          offerId={selectedOfferId}
          step={fundingStep}
          setStep={setFundingStep}
          onRedeem={redeemResource}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "resource-receipt" && <ResourceReceiptModal redemption={backendState?.resourceRedemptions.find((item) => item.id === selectedResourceRedemptionId)} onClose={() => setModal(null)} />}
      {modal === "local-action-registration" && (
        <LocalActionRegistrationModal
          action={backendState?.localActions.find((item) => item.id === selectedLocalActionId)}
          defaultName={backendState?.consumerSettings.displayName ?? backendState?.consumer.displayName ?? "林子晴"}
          defaultPhone={backendState?.consumerSettings.phone ?? ""}
          defaultEmail={backendState?.consumerSettings.contactEmail ?? ""}
          busy={backendBusy}
          onClose={() => setModal(null)}
          onSubmit={registerLocalAction}
        />
      )}
      {modal === "farmer-project" && (
        <ImprovementProjectModal
          onClose={() => setModal(null)}
          onSubmit={saveFarmerProject}
        />
      )}
      {modal === "outcome" && (
        <OutcomeReportModal
          project={managedFarmerProjects.find((item) => item.id === outcomeProjectId) ?? managedFarmerProjects[0]}
          onClose={() => setModal(null)}
          onSubmit={submitOutcomeReport}
        />
      )}
      {modal === "product" && (
        <ProductModal
          key={selectedProductId ?? "new-product"}
          product={farmerProducts.find((item) => item.id === selectedProductId) ?? null}
          onClose={() => setModal(null)}
          onSubmit={saveFarmerProduct}
        />
      )}
      {modal === "program" && (
        <ProgramModal
          onClose={() => setModal(null)}
          onSubmit={saveIncentivePlan}
        />
      )}      {modal === "portfolio" && (
        <InstitutionPortfolioModal
          selectedName={selectedFarmerName}
          setSelectedName={setSelectedFarmerName}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "farmer-detail" && <FarmerDetailModal onClose={() => setModal(null)} />}
      {toast && <div className="toast" role="status"><CheckCircle2 />{toast}</div>}
    </>
  );

  if (accountLoading) {
    return <div className="admin-loading" role="status" aria-live="polite"><Brand /><h1>正在載入您的專屬帳戶</h1><p>確認身分與個人資料後才會顯示功能頁面</p></div>;
  }

  if (sessionRestoreError) {
    return <div className="admin-loading" role="alert"><Brand /><h1>帳戶連線暫時中斷</h1><p>{sessionRestoreError}，系統不會因此將您登出。</p><button type="button" className="button button-primary" onClick={() => setSessionRestoreAttempt((attempt) => attempt + 1)}><RefreshCcw />重新連線</button></div>;
  }

  if (adminMode) {
    return <AdminDashboard
      key={backendState ? JSON.stringify(backendState.admin) : "admin-loading"}
      snapshot={backendState}
      busy={backendBusy}
      error={backendError}
      onRefresh={() => void refreshBackend()}
      onAction={sendAction}
      onExit={backHome}
    />;
  }

  if (screen === "dashboard") {
    return (
      <div className={`site-shell dashboard-shell ${previewMode === "mobile" ? "device-preview-mobile dashboard-device-preview" : ""}`}>
        <div className="dashboard">
          <aside className="sidebar">
            <button className="brand brand-button" onClick={backHome}><Brand /></button>
            <div className="side-role"><span>目前登入角色</span><strong>{roles[role].label}</strong></div>
            <nav className="side-nav">
              <button
                className={(role === "consumer" ? consumerPage : role === "farmer" ? farmerPage : institutionPage) === "overview" ? "active" : ""}
                onClick={() => role === "consumer" ? setConsumerPage("overview") : role === "farmer" ? setFarmerPage("overview") : setInstitutionPage("overview")}
              ><Home />總覽</button>
              {role === "consumer" && (
                <>
                  <button className={consumerPage === "local" ? "active" : ""} onClick={() => setConsumerPage("local")}><HeartHandshake />用綠點支持在地</button>
                  <button className={consumerPage === "orders" ? "active" : ""} onClick={() => setConsumerPage("orders")}><ShoppingBasket />兌換訂單</button>
                  <button className={consumerPage === "invoice" ? "active" : ""} onClick={() => { setInvoiceStage("form"); setConsumerPage("invoice"); }}><Receipt />回傳消費證明</button>
                  <button className={consumerPage === "receipt" ? "active" : ""} onClick={() => setConsumerPage("receipt")}><FileCheck2 />影響力收據</button>
                  <button className={consumerPage === "settings" ? "active" : ""} onClick={() => setConsumerPage("settings")}><Settings />設定</button>
                </>
              )}
              {role === "farmer" && (
                <>
                  <button className={farmerPage === "content" ? "active" : ""} onClick={() => setFarmerPage("content")}><Newspaper />故事與消息</button>
                  <button className={farmerPage === "products" ? "active" : ""} onClick={() => setFarmerPage("products")}><ShoppingBasket />商品數量與點數</button>
                  <button className={farmerPage === "projects" ? "active" : ""} onClick={() => setFarmerPage("projects")}><HeartHandshake />小農改善專案</button>
                  <button className={farmerPage === "greenfin" ? "active" : ""} onClick={() => setFarmerPage("greenfin")}><FileCheck2 />GreenFin 數位履歷</button>
                  <button className={farmerPage === "funding" ? "active" : ""} onClick={() => setFarmerPage("funding")}><PackageCheck />農業資源兌換</button>
                </>
              )}
              {role === "institution" && (
                <>
                  <button className={institutionPage === "greenfin" ? "active" : ""} onClick={() => setInstitutionPage("greenfin")}><FileCheck2 />GreenFin 授權案件</button>
                  <button className={institutionPage === "portfolio" ? "active" : ""} onClick={() => setInstitutionPage("portfolio")}><PackageCheck />綠點激勵計畫</button>
                  <button className={institutionPage === "resource" ? "active" : ""} onClick={() => setInstitutionPage("resource")}><Truck />農業資源履約</button>
                  <button className={institutionPage === "report" ? "active" : ""} onClick={() => setInstitutionPage("report")}><Download />影響力報告</button>
                </>
              )}
            </nav>
            <button className="button button-ghost side-reset" onClick={refreshData} disabled={backendBusy}><RefreshCcw />重新整理資料</button>
          </aside>

          <main className="dashboard-main">
            {backendError && <div className="backend-status" role="alert">{backendError} <button type="button" onClick={() => void refreshBackend()}>重新連線</button></div>}
            <header className="dashboard-top">
              <div>
                <h1>{role === "consumer"
                  ? ({ overview: "消費者中心", local: `用綠點支持在地｜您的所在地：${backendState ? `${backendState.consumer.city}${backendState.consumer.district}` : "台北市大安區"}`, invoice: "回傳消費證明", receipt: "影響力收據", orders: "兌換訂單", settings: "帳戶設定" } as const)[consumerPage]
                  : role === "farmer"
                    ? ({ overview: "小農中心", content: "農場故事與最新消息", products: "商品數量與點數", projects: "小農改善專案", greenfin: "GreenFin 綠色數位履歷", funding: "農業資源兌換" } as const)[farmerPage]
                    : ({ overview: "銀行／政府／企業中心", greenfin: "GreenFin 授權案件", portfolio: "綠點激勵計畫", resource: "農業資源履約管理", report: "ESG 影響力報告" } as const)[institutionPage]}</h1>
                <p>{role === "consumer" && consumerPage === "local"
                  ? "選擇支持改善專案或兌換小農好物，讓綠點回到土地"
                  : role === "consumer" && consumerPage === "invoice"
                    ? "手動輸入發票資料，或掃描電子／傳統發票取得綠點"
                    : role === "consumer" && consumerPage === "orders"
                      ? "查看小農好物從訂單成立、備貨、配送到完成的進度"
                    : role === "consumer" && consumerPage === "receipt"
                      ? "查看綠點流向、小農行動與地方成果"
                    : role === "consumer" && consumerPage === "settings"
                      ? "管理個人聯絡資料、預設配送地址，以及附近推薦所使用的活動所在地"
                    : role === "farmer" && farmerPage === "content"
                        ? "編輯農場故事、上傳圖片並發布消息給支持你的消費者"
                      : role === "farmer" && farmerPage === "products"
                        ? "管理商品、庫存、配送區域，以及綁定農產履歷與無農藥證明"
                      : role === "farmer" && farmerPage === "projects"
                        ? "填寫產地改善計畫、綠點用途與募資目標，公開給消費者支持"
                      : role === "farmer" && farmerPage === "greenfin"
                        ? "從原始文件、OCR、核驗與異常，建立可追溯的經驗值、四大指標及 Data Health"
                        : role === "farmer" && farmerPage === "funding"
                          ? "使用收到的綠點向合作農會兌換農具、檢測、輔導與補助"
                          : role === "institution" && institutionPage === "greenfin"
                            ? "僅在小農有效授權的機構、範圍與期間內檢視授信補充資訊"
                          : role === "institution" && institutionPage === "portfolio"
                            ? "建立綠點激勵任務，追蹤參與、點數流向與地方效益"
                            : role === "institution" && institutionPage === "resource"
                              ? "管理小農農業資源兌換的確認、備貨、配送或預約履約進度"
                            : role === "institution" && institutionPage === "report"
                              ? "彙整綠色消費投入、環境成果與地方影響"
                              : "以下資料由平台後台統一管理"}</p>
              </div>
              <div className="dashboard-top-actions">
                <div className={`device-toggle dashboard-device-toggle ${previewMode}`} role="group" aria-label="切換功能頁裝置預覽">
                  <span className="device-toggle-thumb" aria-hidden="true" />
                  <button type="button" className={previewMode === "desktop" ? "active" : ""} aria-pressed={previewMode === "desktop"} onClick={() => setPreviewMode("desktop")}><Monitor />網頁</button>
                  <button type="button" className={previewMode === "mobile" ? "active" : ""} aria-pressed={previewMode === "mobile"} onClick={() => setPreviewMode("mobile")}><Smartphone />手機</button>
                </div>
                <button className="profile-button" onClick={openLogin}>
                  <span className="avatar"><User /></span>
                  <span>{signedInDisplayName ?? roles[role].account}</span>
                  <ChevronRight />
                </button>
              </div>
            </header>

            {role === "consumer" && consumerPage === "overview" && (
              <ConsumerDashboard
                points={points}
                supportedItems={supportedProjects}
                redeemed={redeemed}
                period={period}
                setPeriod={setPeriod}
                onInvoice={() => { setInvoiceStage("form"); setConsumerPage("invoice"); }}
                lastRedeemedId={lastRedeemedId}
                onReceipt={() => setConsumerPage("receipt")}
                ledger={backendState?.ledger ?? []}
                actionSubmissions={backendState?.actionSubmissions ?? []}
                onSubmitActionProof={submitActionProof}
                busy={backendBusy}
                news={backendState?.consumerNews ?? []}
              />
            )}
            {role === "consumer" && consumerPage === "local" && (
              <LocalSupportDashboard
                key={backendState ? `${backendState.consumer.city}-${backendState.consumer.district}` : "consumer-location"}
                points={points}
                projects={availableLocalProjects}
                supportedIds={supportedProjectIds}
                redeemedIds={redeemedProjectIds}
                onProject={openLocalProject}
                onLearnMore={openLocalProjectStory}
                location={backendState ? `${backendState.consumer.city}${backendState.consumer.district}` : "台北市大安區"}
                onLocation={updateConsumerLocation}
                localActions={backendState?.localActions ?? []}
                merchantOffers={backendState?.merchantOffers ?? []}
                registeredActionIds={backendState?.registeredActionIds ?? []}
                onRegister={openLocalActionRegistration}
                onVisit={visitNearbyPlace}
              />
            )}
            {role === "consumer" && consumerPage === "invoice" && (
              <ConsumerInvoicePage stage={invoiceStage} rewardPoints={invoiceRewardPoints} invoice={lastVerifiedInvoice} onVerify={verifyInvoice} onReset={() => { setInvoiceStage("form"); setLastVerifiedInvoice(null); }} />
            )}
            {role === "consumer" && consumerPage === "receipt" && (
              <ConsumerReceiptPage
                items={receiptItems}
                onDownload={downloadReceipt}
                onExplore={() => setConsumerPage("local")}
                onLearnMore={openLocalProjectStory}
              />
            )}
            {role === "consumer" && consumerPage === "orders" && (
              <ConsumerOrdersPage
                items={redeemedProjects}
                orders={backendState?.orders ?? []}
                stages={orderStages}
                initialId={lastRedeemedId}
                onReceipt={() => setConsumerPage("receipt")}
                onExplore={() => setConsumerPage("local")}
                changeRequests={backendState?.changeRequests ?? []}
                onRequestChange={async (values) => {
                  const snapshot = await sendAction("request_order_change", values);
                  if (!snapshot) return false;
                  setToast("訂單修改申請已送出，請等待小農確認");
                  return true;
                }}
              />
            )}
            {role === "consumer" && consumerPage === "settings" && backendState && (
              <ConsumerSettingsPage key={backendState.consumerSettings.updatedAt || "consumer-settings"} settings={backendState.consumerSettings} busy={backendBusy} onSave={saveConsumerSettings} />
            )}
            {role === "farmer" && farmerPage === "overview" && (
              <FarmerDashboard
                farmerPoints={farmerPoints}
                products={farmerProducts}
                orders={backendState?.orders ?? []}
                records={backendState?.evidence ?? []}
                projects={managedFarmerProjects}
                onEvidence={() => setFarmerPage("greenfin")}
                onProducts={() => setFarmerPage("products")}
                onProjects={() => setFarmerPage("projects")}
                onBenefits={() => setFarmerPage("funding")}
              />
            )}
            {role === "farmer" && farmerPage === "content" && (
              <FarmerContentCenter
                key={backendState?.farmerStory?.updatedAt ?? "new-farmer-content"}
                story={backendState?.farmerStory ?? null}
                news={backendState?.farmerNews ?? []}
                busy={backendBusy}
                onUpload={uploadFarmerMedia}
                onSaveStory={saveFarmerStory}
                onSaveNews={saveFarmerNews}
              />
            )}
            {role === "farmer" && farmerPage === "products" && (
              <FarmerProductsPage
                products={farmerProducts}
                orders={backendState?.orders ?? []}
                changeRequests={backendState?.changeRequests ?? []}
                onAdd={() => openProduct(null)}
                onEdit={(id) => openProduct(id)}
                onAdvanceOrder={async (values) => {
                  const snapshot = await sendAction("advance_order", values);
                  if (!snapshot) return false;
                  setToast("訂單出貨進度與時間已更新");
                  return true;
                }}
                onReviewChange={(requestId, decision) => void sendAction("review_order_change", { requestId, decision, reviewNote: decision === "approved" ? "已確認修改內容，可依新資料備貨" : "訂單已進入處理流程，請聯絡小農確認" }).then((snapshot) => snapshot && setToast(decision === "approved" ? "已核准並套用訂單修改" : "已退回訂單修改申請"))}
              />
            )}
            {role === "farmer" && farmerPage === "projects" && (
              <FarmerProjectsPage
                projects={managedFarmerProjects}
                onCreate={() => setModal("farmer-project")}
                onPreview={openLocalProjectStory}
                onOutcome={openOutcomeReport}
              />
            )}
            {role === "farmer" && farmerPage === "greenfin" && (
              <FarmerGreenFinPage
                busy={backendBusy}
                csrfToken={csrfToken}
                role={requestRole}
                onUpload={uploadGreenFinDocument}
                onToast={setToast}
              />
            )}
            {role === "farmer" && farmerPage === "funding" && (
              <FarmerFundingPage
                farmerPoints={farmerPoints}
                onOffer={openFunding}
                redemptions={backendState?.resourceRedemptions ?? []}
                changeRequests={backendState?.changeRequests ?? []}
                onReceipt={openResourceReceipt}
                onRequestChange={async (values) => {
                  const snapshot = await sendAction("request_resource_change", values);
                  if (!snapshot) return false;
                  setToast("農會資源兌換修改申請已送出");
                  return true;
                }}
              />
            )}
            {role === "institution" && institutionPage === "overview" && (
              <InstitutionDashboard
                programs={incentivePlans}
                procurements={backendState?.procurements ?? []}
                resourceRedemptions={backendState?.resourceRedemptions ?? []}
                outcomes={backendState?.outcomeReports ?? []}
                onDetail={(name) => { if (name) setSelectedFarmerName(name); setInstitutionPage("portfolio"); }}
                onDownload={() => setInstitutionPage("report")}
              />
            )}
            {role === "institution" && institutionPage === "greenfin" && (
              <InstitutionGreenFinPage csrfToken={csrfToken} role={requestRole} onToast={setToast} />
            )}
            {role === "institution" && institutionPage === "portfolio" && (
              <InstitutionPortfolioPage
                programs={incentivePlans}
                onCreate={() => setModal("program")}
                procurements={backendState?.procurements ?? []}
                resourceRedemptions={backendState?.resourceRedemptions ?? []}
                outcomes={backendState?.outcomeReports ?? []}
                onProcurement={(values) => void sendAction("create_procurement", values).then((snapshot) => snapshot && setToast("永續採購需求已建立並送往小農媒合"))}
              />
            )}
            {role === "institution" && institutionPage === "report" && (
              <InstitutionReportPage
                onDownload={downloadReport}
                outcomes={backendState?.outcomeReports ?? []}
                projects={managedFarmerProjects}
                programs={incentivePlans}
                resourceRedemptions={backendState?.resourceRedemptions ?? []}
                onVerify={(reportId) => void sendAction("verify_outcome", { reportId }).then((snapshot) => snapshot && setToast("成果報告已通過審核並完成揭露"))}
              />
            )}
            {role === "institution" && institutionPage === "resource" && (
              <InstitutionResourceFulfillmentPage
                resourceRedemptions={backendState?.resourceRedemptions ?? []}
                changeRequests={backendState?.changeRequests ?? []}
                onAdvance={advanceResourceRedemption}
                onReviewResourceChange={(requestId, decision) => void sendAction("review_resource_change", { requestId, decision, reviewNote: decision === "approved" ? "承辦端已確認並套用新資料" : "承辦端退回，請確認履約狀態後重新申請" }).then((snapshot) => snapshot && setToast(decision === "approved" ? "已核准並套用農會兌換修改" : "已退回農會兌換修改申請"))}
              />
            )}
          </main>
        </div>

        <nav className={`mobile-nav ${role === "consumer" ? "mobile-nav-consumer" : role === "farmer" ? "mobile-nav-farmer" : "mobile-nav-institution"}`}>
          <button
            className={(role === "consumer" ? consumerPage : role === "farmer" ? farmerPage : institutionPage) === "overview" ? "active" : ""}
            onClick={() => role === "consumer" ? setConsumerPage("overview") : role === "farmer" ? setFarmerPage("overview") : setInstitutionPage("overview")}
          ><Home />總覽</button>
          {role === "consumer" && (
            <>
              <button className={consumerPage === "invoice" ? "active" : ""} onClick={() => { setInvoiceStage("form"); setConsumerPage("invoice"); }}><Receipt />發票</button>
              <button className={consumerPage === "local" ? "active" : ""} onClick={() => setConsumerPage("local")}><HeartHandshake />支持在地</button>
              <button className={consumerPage === "orders" ? "active" : ""} onClick={() => setConsumerPage("orders")}><ShoppingBasket />訂單</button>
              <button className={consumerPage === "receipt" ? "active" : ""} onClick={() => setConsumerPage("receipt")}><FileCheck2 />收據</button>
              <button className={consumerPage === "settings" ? "active" : ""} onClick={() => setConsumerPage("settings")}><Settings />設定</button>
            </>
          )}
          {role === "farmer" && (
            <>
              <button className={farmerPage === "content" ? "active" : ""} onClick={() => setFarmerPage("content")}><Newspaper />內容</button>
              <button className={farmerPage === "products" ? "active" : ""} onClick={() => setFarmerPage("products")}><ShoppingBasket />商品</button>
              <button className={farmerPage === "projects" ? "active" : ""} onClick={() => setFarmerPage("projects")}><HeartHandshake />改善</button>
              <button className={farmerPage === "greenfin" ? "active" : ""} onClick={() => setFarmerPage("greenfin")}><FileCheck2 />GreenFin</button>
              <button className={farmerPage === "funding" ? "active" : ""} onClick={() => setFarmerPage("funding")}><PackageCheck />資源</button>
            </>
          )}
          {role === "institution" && (
            <>
              <button className={institutionPage === "greenfin" ? "active" : ""} onClick={() => setInstitutionPage("greenfin")}><FileCheck2 />GreenFin</button>
              <button className={institutionPage === "portfolio" ? "active" : ""} onClick={() => setInstitutionPage("portfolio")}><PackageCheck />計畫</button>
              <button className={institutionPage === "resource" ? "active" : ""} onClick={() => setInstitutionPage("resource")}><Truck />履約</button>
              <button className={institutionPage === "report" ? "active" : ""} onClick={() => setInstitutionPage("report")}><Download />報告</button>
            </>
          )}
          <button onClick={backHome}><LogOut />首頁</button>
        </nav>
        {modals}
      </div>
    );
  }

  return (
    <div className={`site-shell home-site ${previewMode === "mobile" ? "device-preview-mobile" : ""}`}>
      <header className="topbar">
        <nav className="container nav">
          <div className="nav-brand-group">
            <button className="brand brand-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Brand /></button>
            <div className={`device-toggle ${previewMode}`} role="group" aria-label="切換首頁裝置預覽">
              <span className="device-toggle-thumb" aria-hidden="true" />
              <button type="button" className={previewMode === "desktop" ? "active" : ""} aria-pressed={previewMode === "desktop"} onClick={() => setPreviewMode("desktop")}><Monitor />網頁</button>
              <button type="button" className={previewMode === "mobile" ? "active" : ""} aria-pressed={previewMode === "mobile"} onClick={() => setPreviewMode("mobile")}><Smartphone />手機</button>
            </div>
          </div>
          <div className="nav-links">
            <a href="#stories">在地行動</a>
            <a href="#cycle">運作方式</a>
            <a href="#impact">社會影響</a>
          </div>
          <button className="button button-primary" onClick={openLogin}><User />登入平台</button>
        </nav>
      </header>

      <main>
        <section
          className="hero hero-full"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocusCapture={() => setHeroPaused(true)}
          onBlurCapture={() => setHeroPaused(false)}
        >
          <div className="hero-background" aria-roledescription="輪播" aria-label="綠色農業行動照片">
            {heroSlides.map((slide, index) => (
              <figure
                className={`hero-bg-slide ${heroSlide === index ? "active" : ""}`}
                aria-hidden={heroSlide !== index}
                key={slide.image}
              >
                <img src={slide.image} alt={heroSlide === index ? slide.alt : ""} loading={index === 0 ? "eager" : "lazy"} />
              </figure>
            ))}
          </div>

          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Green Points, Local Impact</span>
              <h1><span>讓每一次綠色行動</span><span>都成為在地小農的力量</span></h1>
              <div className="hero-actions">
                <button className="button button-primary" onClick={openLogin}>開始體驗<ArrowRight /></button>
                <button className="button button-secondary" onClick={() => document.querySelector("#cycle")?.scrollIntoView()}>
                  了解運作方式<ArrowDown />
                </button>
              </div>
              <div className="trust-row">
                <span><BadgeCheck />多元綠點來源</span>
                <span><Leaf />附近小農優先</span>
                <span><HeartHandshake />成果可追溯</span>
              </div>
            </div>

            <div className="hero-side">
              <div className="hero-active-caption" aria-live="polite">
                <span>{heroSlides[heroSlide].label}</span>
                <strong>{heroSlides[heroSlide].title}</strong>
              </div>
            </div>
          </div>

          <div className="hero-carousel-controls">
            <button
              type="button"
              onClick={() => setHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
              aria-label="上一張照片"
            ><ArrowLeft /></button>
            <div className="hero-dots" aria-label="選擇照片">
              {heroSlides.map((slide, index) => (
                <button
                  type="button"
                  className={heroSlide === index ? "active" : ""}
                  onClick={() => setHeroSlide(index)}
                  aria-label={`顯示第 ${index + 1} 張：${slide.label}`}
                  aria-current={heroSlide === index ? "true" : undefined}
                  key={slide.label}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHeroSlide((current) => (current + 1) % heroSlides.length)}
              aria-label="下一張照片"
            ><ArrowRight /></button>
          </div>
        </section>

        <section className="section section-soft" id="stories">
          <div className="container">
            <header className="section-heading">
              <span className="eyebrow">從土地開始</span>
              <h2>看見每一份綠色選擇背後的行動</h2>
              <p>從綠色消費、低碳交通、電子帳單到企業與政府激勵，讓每一點支持都有清楚去向，也讓地方農業持續成長。</p>
            </header>
            <div className="story-grid">
              <StoryCard story={stories[0]} large onClick={() => openStory(stories[0].id)} />
              <div className="story-stack">
                <StoryCard story={stories[1]} onClick={() => openStory(stories[1].id)} />
                <StoryCard story={stories[2]} onClick={() => openStory(stories[2].id)} />
              </div>
              <div className="story-stack">
                <StoryCard story={stories[3]} onClick={() => openStory(stories[3].id)} />
                <StoryCard story={stories[4]} onClick={() => openStory(stories[4].id)} />
              </div>
            </div>
          </div>
        </section>

        <FarmerUpdatesSection stories={publicContent.stories} news={publicContent.news} />

        <section className="section cycle-section" id="cycle">
          <div className="container">
            <header className="section-heading center cycle-section-heading">
              <span className="eyebrow">綠色消費循環</span>
              <h2>從一個綠色行動，到一座農村的改變</h2>
              <p>消費者、合作小農與銀行／政府／企業共享同一套綠點循環，讓獎勵、支持與成果持續回到地方。</p>
              <button className="button button-primary cycle-reveal-button" onClick={() => setCycleOpen((open) => !open)} aria-expanded={cycleOpen} aria-controls="role-cycle-explorer">
                {cycleOpen ? "收合綠點循環" : "查看三方綠點循環"}<ChevronRight className={cycleOpen ? "open" : ""} />
              </button>
            </header>
            {cycleOpen && <RoleCycleExplorer />}
          </div>
        </section>

        <section className="section section-dark" id="impact">
          <div className="container">
            <header className="section-heading">
              <span className="eyebrow">共同影響力</span>
              <h2>讓支持不只是一個數字</h2>
              <p>平台記錄綠點如何從多元行動回到小農，並形成可揭露的環境、地方與永續經濟成果。</p>
            </header>
            <div className="impact-grid">
              <Impact icon={Users} value="128" label="受支持在地農戶" />
              <Impact icon={HandCoins} value="478,000 點" label="發放與配對綠點" />
              <Impact icon={Trees} value="62.4 噸" label="估算年度減碳成果" />
              <Impact icon={ShoppingBasket} value="20,160" label="次綠色行動參與" />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-row">
          <Brand />
          <span>平台資料由後台保存；外部支付、物流及政府資料交換仍依正式合作介接。</span>
          <a href="https://www.pexels.com/" target="_blank" rel="noreferrer">封面來源：Pexels・故事圖為 AI 生成示意</a>
        </div>
      </footer>
      {modals}
    </div>
  );
}

function RoleCycleExplorer() {
  const [hoveredRole, setHoveredRole] = useState<Role | null>(null);
  const [pinnedRole, setPinnedRole] = useState<Role | null>(null);
  const activeRole = hoveredRole ?? pinnedRole;
  const activeInfo = activeRole ? roleCycleDetails[activeRole] : null;
  const roleOrder: Role[] = ["institution", "consumer", "farmer"];

  return (
    <div id="role-cycle-explorer" className={`role-cycle-explorer ${activeRole ? "has-focus" : ""}`}>
      <div className="role-cycle-stage" aria-label="消費者、合作小農與銀行政府企業的綠點循環">
        <div className="role-cycle-orbit" aria-hidden="true">
          <span className="cycle-direction-arrow cycle-direction-arrow-top-right">↖</span>
          <span className="cycle-direction-arrow cycle-direction-arrow-top-left">↙</span>
          <span className="cycle-direction-arrow cycle-direction-arrow-bottom-left">↘</span>
          <span className="cycle-direction-arrow cycle-direction-arrow-bottom-right">↗</span>
        </div>
        <div className="cycle-core"><HandCoins /><strong>綠點循環</strong><small>獎勵・支持・成果</small></div>
        <span className="cycle-link cycle-link-grant">發放與配對綠點</span>
        <span className="cycle-link cycle-link-support">支持專案與兌換</span>
        <span className="cycle-link cycle-link-impact">回傳成果與效益</span>
        {roleOrder.map((key) => {
          const info = roleCycleDetails[key];
          const Icon = info.icon;
          const active = activeRole === key;
          return (
            <button
              type="button"
              key={key}
              className={`role-cycle-node role-cycle-node-${key} ${active ? "active" : ""} ${activeRole && !active ? "dimmed" : ""}`}
              onMouseEnter={() => setHoveredRole(key)}
              onMouseLeave={() => setHoveredRole(null)}
              onFocus={() => setHoveredRole(key)}
              onBlur={() => setHoveredRole(null)}
              onClick={() => setPinnedRole((current) => current === key ? null : key)}
              aria-pressed={pinnedRole === key}
            >
              <span className="role-cycle-icon"><Icon /></span>
              <span><small>{info.short}</small><strong>{info.label}</strong><em>{active ? "正在聚焦・下方查看完整內容" : "滑鼠移入或點擊查看"}</em></span>
            </button>
          );
        })}
      </div>
      <div className={`role-cycle-detail ${activeInfo ? "visible" : ""}`} aria-live="polite">
        {activeInfo && activeRole ? (
          <>
            <header><span className={`role-cycle-detail-icon ${activeInfo.tone}`}><activeInfo.icon /></span><div><small>{activeInfo.short}</small><h3>{activeInfo.label}如何參與綠點循環</h3></div><b>角色 {roleOrder.indexOf(activeRole) + 1}／3</b></header>
            <div className="role-cycle-detail-grid">
              <RoleCycleList title="綠點怎麼來" items={activeInfo.source} icon={HandCoins} />
              <RoleCycleList title="獲得綠點的誘因" items={activeInfo.incentive} icon={TrendingUp} />
              <RoleCycleList title="綠點帶來的好處" items={activeInfo.benefit} icon={BadgeCheck} />
            </div>
          </>
        ) : (
          <div className="role-cycle-prompt"><span><RefreshCcw /></span><div><b>把滑鼠移到任一角色上</b><p>其他角色會自動變暗，並顯示這個角色的綠點來源、參與誘因與實際好處；手機可直接點擊角色。</p></div></div>
        )}
      </div>
    </div>
  );
}

function RoleCycleList({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof HandCoins }) {
  return (
    <section><h4><Icon />{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>
  );
}

function StoryCard({
  story,
  onClick,
  large = false,
}: {
  story: (typeof stories)[number];
  onClick: () => void;
  large?: boolean;
}) {
  return (
    <button className={`story-card ${large ? "large" : ""}`} onClick={onClick} aria-label={`閱讀故事：${story.title}`}>
      <img src={story.cover} alt={story.title} />
      <span className="story-overlay">
        <span>{story.label}</span>
        <strong>{story.title}</strong>
        <em>閱讀故事 <ArrowRight /></em>
      </span>
    </button>
  );
}

function formatPublishedAt(value: string) {
  if (!value) return "尚未發布";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}+08:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function FarmerNewsFeed({ news, emptyText = "目前尚無小農最新消息。" }: { news: FarmerNews[]; emptyText?: string }) {
  if (news.length === 0) return <div className="farmer-news-empty"><Newspaper /><p>{emptyText}</p></div>;
  return <div className="farmer-news-grid">{news.map((item) => <article className={`farmer-news-card ${item.image ? "" : "no-image"}`} key={item.id}>
    {item.image && <img src={item.image} alt={`${item.farmerName}・${item.title}`} />}
    <div><span className="farmer-news-category">{item.category}</span><small>{item.city}{item.district}・{formatPublishedAt(item.publishedAt)}</small><h3>{item.title}</h3><p>{item.content}</p><footer><Sprout /><b>{item.farmerName}</b></footer></div>
  </article>)}</div>;
}

function FarmerUpdatesSection({ stories: farmerStories, news }: PublicContent) {
  if (farmerStories.length === 0 && news.length === 0) return null;
  return <section className="section farmer-updates-section" id="farmer-updates"><div className="container">
    <header className="section-heading"><span className="eyebrow">產地即時連線</span><h2>小農故事與最新消息</h2><p>由合作小農親自更新耕作故事、採收近況與改善專案進度。</p></header>
    {farmerStories.length > 0 && <div className="farmer-story-grid">{farmerStories.slice(0, 4).map((story) => <article className="farmer-story-card" key={story.farmerId}>
      <img src={story.image} alt={`${story.farmerName}農場故事`} /><div><small>{story.city}{story.district}</small><h3>{story.headline}</h3><p>{story.summary}</p>{story.quote && <blockquote>「{story.quote}」</blockquote>}<footer><Sprout /><b>{story.farmerName}</b></footer></div>
    </article>)}</div>}
    <div className="farmer-updates-news-heading"><div><span className="eyebrow">最新發布</span><h3>小農最新消息</h3></div><span>共 {news.length} 則</span></div>
    <FarmerNewsFeed news={news.slice(0, 6)} />
  </div></section>;
}

function LocalProjectStoryModal({
  item,
  onAction,
  onClose,
}: {
  item: LocalProject;
  onAction: () => void;
  onClose: () => void;
}) {
  const savedStory = localProjectStories[item.id as keyof typeof localProjectStories] as ProjectStory | undefined;
  const story: ProjectStory = savedStory ?? item.story ?? {
    location: `${item.city ?? "合作產地"}・${item.district ?? "友善農區"}`,
    headline: `${item.farmer}希望透過這項計畫，讓產地改善能被看見與支持`,
    quote: "把需要改善的問題說清楚，也把每一筆綠點真正用在哪裡留下紀錄。",
    paragraphs: [item.note, `本計畫預計將綠點投入${item.purpose}，並以${item.impact}作為後續成果追蹤方向。`],
  };
  const isSupport = item.kind === "support";
  const supportUnavailable = isSupport && Boolean(item.status) && item.status !== "funding";
  const supportStatusLabel = item.status === "review" ? "專案審核中" : item.status === "completed" ? "專案已完成" : "專案已下架";
  return (
    <ModalShell title={isSupport ? "小農改善專案故事" : "小農好物故事"} onClose={onClose} wide>
      <article className="local-story-detail">
        <div className="local-story-hero">
          <img src={item.image} alt={item.title} />
          <div><span>{isSupport ? "GREEN ACTION" : "LOCAL PRODUCT"}・{story.location}</span><h3>{story.headline}</h3><p>{item.farmer}</p></div>
        </div>
        <div className="local-story-content">
          <section><span className="eyebrow">來自產地的故事</span><blockquote>「{story.quote}」</blockquote>{story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>
          <aside><h4>{isSupport ? "這份支持會帶來什麼" : "這次兌換支持了什麼"}</h4><div className="local-story-facts"><div><small>{isSupport ? "所需綠點" : "兌換綠點"}</small><strong>{item.points} 點</strong></div><div><small>{isSupport && item.targetPoints ? "募集進度" : "目前進度"}</small><strong>{isSupport && item.targetPoints ? `${(item.raisedPoints ?? 0).toLocaleString()}／${item.targetPoints.toLocaleString()} 點` : `${item.progress}%`}</strong></div><div><small>{isSupport ? "資源用途" : "配送方式"}</small><strong>{item.purpose}</strong></div><div><small>預期成果</small><strong>{item.impact}</strong></div></div><div className="progress"><span style={{ width: item.progress + "%" }} /></div><p>{isSupport ? "完成支持後，專案進度與成果將同步到你的影響力收據。" : "完成兌換後，這筆綠點會形成在地訂單並支持小農持續生產。"}</p></aside>
        </div>
      </article>
      <div className="modal-actions local-story-actions"><button className="button button-secondary" onClick={onClose}>返回專案列表</button><button className="button button-primary" onClick={onAction} disabled={supportUnavailable}>{supportUnavailable ? supportStatusLabel : isSupport ? `支持 ${item.points} 點` : `兌換 ${item.points} 點`}{!supportUnavailable && <ArrowRight />}</button></div>
    </ModalShell>
  );
}

function StoryModal({
  storyId,
  onNext,
  onExperience,
  onClose,
}: {
  storyId: string;
  onNext: (id: string) => void;
  onExperience: () => void;
  onClose: () => void;
}) {
  const index = Math.max(stories.findIndex((item) => item.id === storyId), 0);
  const story = stories[index];
  const nextStory = stories[(index + 1) % stories.length];
  return (
    <ModalShell title={story.label} onClose={onClose} wide>
      <article className="story-detail">
        <div className="story-detail-hero">
          <img src={story.detail} alt={story.detailAlt} />
          <div>
            <span>IMPACT STORY ・ {String(index + 1).padStart(2, "0")}</span>
            <h3>{story.title}</h3>
            <p>{story.person}｜{story.place}</p>
          </div>
        </div>
        <div className="story-intro">
          <div><small>故事人物</small><strong>{story.person}</strong><span>{story.place}</span></div>
          <p>{story.intro}</p>
        </div>
        <div className="story-metrics">
          {story.metrics.map(([value, label]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
        </div>
        <div className="story-content-grid">
          <section>
            <span className="eyebrow">從現場到成果</span>
            {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <blockquote>「{story.quote}」<cite>— {story.person}</cite></blockquote>
          </section>
          <aside>
            <h4>這個行動如何形成循環</h4>
            <div className="story-steps">
              {story.steps.map(([title, note], stepIndex) => (
                <div key={title}><span>{stepIndex + 1}</span><p><b>{title}</b><small>{note}</small></p></div>
              ))}
            </div>
            <div className="story-disclosure"><FileCheck2 /><span><b>影響力故事</b><small>專案成果會由小農回報並經機構端審核後揭露。</small></span></div>
          </aside>
        </div>
      </article>
      <div className="story-modal-actions">
        <button className="button button-secondary" onClick={() => onNext(nextStory.id)}>下一個故事：{nextStory.label}<ArrowRight /></button>
        <button className="button button-primary" onClick={onExperience}>進入角色後台<User /></button>
      </div>
    </ModalShell>
  );
}

function Impact({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return <article className="impact-card"><Icon /><strong>{value}</strong><span>{label}</span></article>;
}

type AdminSection = "overview" | "accounts" | "content" | "reviews" | "generator" | "system" | "parameters" | "audit";

const adminSections: AdminSection[] = ["overview", "accounts", "content", "reviews", "generator", "system", "parameters", "audit"];

function readAdminSection(search: string): AdminSection {
  const requestedSection = new URLSearchParams(search).get("section") as AdminSection | null;
  return requestedSection && adminSections.includes(requestedSection) ? requestedSection : "overview";
}

const templatePdfFiles: Record<string, string> = {
  consumer_action_proof: "GFES_消費者綠色行動證明_正式範例.pdf",
  consumer_invoice: "GFES_綠色消費證明_完整範例.pdf",
  farm_trace: "GFES_農產履歷批次資料_完整範例.pdf",
  pesticide_test: "GFES_無農藥檢測報告_完整範例.pdf",
  cultivation_log: "GFES_友善耕作紀錄_完整範例.pdf",
  equipment_evidence: "GFES_低碳設備使用證明_完整範例.pdf",
  improvement_plan: "GFES_小農改善專案計畫書_完整範例.pdf",
  outcome_report: "GFES_改善專案成果回報_完整範例.pdf",
  institution_program: "GFES_綠點激勵計畫_完整範例.pdf",
  procurement_request: "GFES_永續採購需求_完整範例.pdf",
};

function AdminDashboard({
  snapshot,
  busy,
  error,
  onRefresh,
  onAction,
  onExit,
}: {
  snapshot: BackendSnapshot | null;
  busy: boolean;
  error: string;
  onRefresh: () => void;
  onAction: (action: string, payload?: Record<string, unknown>, options?: { confirmedByCheckbox?: boolean }) => Promise<BackendSnapshot | null>;
  onExit: () => void;
}) {
  const [section, setSectionState] = useState<AdminSection>(() =>
    typeof window === "undefined" ? "overview" : readAdminSection(window.location.search),
  );
  const [notice, setNotice] = useState("");
  const [accountDrafts, setAccountDrafts] = useState<Record<string, { displayName: string; email: string; username: string; status: string; city: string; district: string; pointsToSend: number }>>(() => Object.fromEntries((snapshot?.admin.accounts ?? []).map((item) => [item.id, { displayName: item.displayName, email: item.email, username: item.username, status: item.status, city: item.city, district: item.district, pointsToSend: 0 }])));
  const [productDrafts, setProductDrafts] = useState<Record<string, { points: number; stock: number; status: string }>>(() => Object.fromEntries((snapshot?.admin.products ?? []).map((item) => [item.id, { points: item.points, stock: item.stock, status: item.status }])));
  const [projectDrafts, setProjectDrafts] = useState<Record<string, { points: number; targetPoints: number; status: string }>>(() => Object.fromEntries((snapshot?.admin.projects ?? []).map((item) => [item.id, { points: item.points, targetPoints: item.targetPoints, status: item.status }])));
  const [incentiveDrafts, setIncentiveDrafts] = useState<Record<string, { budgetPoints: number; progress: number }>>(() => Object.fromEntries((snapshot?.admin.incentives ?? []).map((item) => [item.id, { budgetPoints: item.budgetPoints, progress: item.progress }])));
  const [procurementDrafts, setProcurementDrafts] = useState<Record<string, { quantity: number; budgetPoints: number; deliveryRegion: string; status: string }>>(() => Object.fromEntries((snapshot?.admin.procurements ?? []).map((item) => [item.id, { quantity: item.quantity, budgetPoints: item.budgetPoints, deliveryRegion: item.deliveryRegion, status: item.status }])));
  const [parameterDrafts, setParameterDrafts] = useState<Record<string, string>>(() => Object.fromEntries((snapshot?.admin.parameters ?? []).map((item) => [item.parameterKey, item.value])));
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, string>>(() => Object.fromEntries((snapshot?.admin.dataTemplates ?? []).map((item) => [item.templateKey, JSON.stringify(item.sampleData, null, 2)])));
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>(() => Object.fromEntries((snapshot?.admin.actionSubmissions ?? []).map((item) => [item.id, item.reviewNote ?? ""])));
  const [templateRole, setTemplateRole] = useState<"all" | "consumer" | "farmer" | "institution">("all");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(() => snapshot?.admin.dataTemplates[0]?.templateKey ?? "");

  function setSection(nextSection: AdminSection) {
    setSectionState(nextSection);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "admin");
    url.searchParams.set("section", nextSection);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    const restoreSection = () => setSectionState(readAdminSection(window.location.search));
    restoreSection();
    window.addEventListener("popstate", restoreSection);
    return () => window.removeEventListener("popstate", restoreSection);
  }, []);

  async function save(action: string, payload: Record<string, unknown>, success: string, options?: { confirmedByCheckbox?: boolean }) {
    const result = await onAction(action, payload, options);
    if (result) setNotice(success);
    return result;
  }

  const roleName = (role: string) => role === "consumer" ? "消費者" : role === "farmer" ? "合作小農" : role === "admin" ? "平台管理員" : "銀行／政府／企業";
  const statusName = (status: string) => ({ active: "啟用", pending: "待審核", suspended: "停權", hidden: "隱藏", sold_out: "售罄", funding: "募集中", review: "審核中", completed: "已完成" } as Record<string, string>)[status] ?? status;
  const actionName = (action: string) => ({ update_account: "更新帳號", send_points: "發送綠點", update_product: "調整商品", update_project: "調整專案", update_incentive: "調整激勵計畫", update_procurement: "調整採購需求", update_parameter: "修改系統參數", update_data_template: "更新範例資料", generate_data_template: "產生正式範例", view_action_submission: "查看行動證明", review_action_submission: "審核行動證明" } as Record<string, string>)[action] ?? action;

  function downloadDataTemplate(template: BackendSnapshot["admin"]["dataTemplates"][number]) {
    const pdfFile = templatePdfFiles[template.templateKey];
    if (!pdfFile) {
      setNotice("此範例尚未建立完整 PDF 文件");
      return;
    }
    const link = document.createElement("a");
    link.href = `/documents/${pdfFile}`;
    link.download = pdfFile;
    link.click();
  }

  function actionProofUrl(submission: ActionSubmission) {
    return submission.id.startsWith("SAMPLE-ACTION-")
      ? `/documents/${encodeURIComponent(submission.fileName)}`
      : `/api/uploads?submissionId=${encodeURIComponent(submission.id)}&role=admin`;
  }

  async function viewActionProof(submission: ActionSubmission) {
    const needsViewRecord = submission.status === "pending" && !submission.proofViewedAt;
    if (needsViewRecord && !window.confirm(`流程步驟確認\n\n即將開啟「${submission.title}」的證明文件，並記錄本次查看時間。\n\n確認查看後即可填寫審核說明。`)) return;
    window.open(actionProofUrl(submission), "_blank", "noopener,noreferrer");
    if (needsViewRecord) {
      await save(
        "admin_mark_action_submission_viewed",
        { submissionId: submission.id },
        `${submission.title}的證明已查看，可以填寫審核說明`,
        { confirmedByCheckbox: true },
      );
    }
  }

  if (!snapshot) {
    return <div className="admin-loading"><Brand /><h1>平台管理員後台</h1><p>{error || "正在載入管理資料…"}</p><button className="button button-primary" onClick={onRefresh}>重新載入</button></div>;
  }

  const data = snapshot.admin;
  const realAccounts = data.accounts.filter((account) => account.accountKind === "real").sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  const testAccounts = data.accounts.filter((account) => account.accountKind === "test");
  const pendingRoleAccounts = realAccounts.filter((account) => account.status === "pending" && (account.role === "farmer" || account.role === "institution"));
  const filteredTemplates = data.dataTemplates.filter((item) => templateRole === "all" || item.targetRole === templateRole);
  const selectedTemplate = data.dataTemplates.find((item) => item.templateKey === selectedTemplateKey) ?? filteredTemplates[0] ?? data.dataTemplates[0];
  const selectedMeta = selectedTemplate?.sampleData.meta && typeof selectedTemplate.sampleData.meta === "object" ? selectedTemplate.sampleData.meta as Record<string, unknown> : {};
  const sortedActionSubmissions = [...data.actionSubmissions].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button className="brand brand-button admin-brand" onClick={onExit}><Brand /></button>
        <div className="admin-identity"><span><Monitor /></span><div><small>已登入</small><strong>平台管理員</strong></div></div>
        <nav>
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><Home />營運總覽</button>
          <button className={section === "accounts" ? "active" : ""} onClick={() => setSection("accounts")}><Users />帳號與角色</button>
          <button className={section === "content" ? "active" : ""} onClick={() => setSection("content")}><ShoppingBasket />內容與計畫</button>
          <button className={section === "reviews" ? "active" : ""} onClick={() => setSection("reviews")}><BadgeCheck />行動審核</button>
          <button className={section === "generator" ? "active" : ""} onClick={() => setSection("generator")}><FileCheck2 />資料生成區</button>
          <button className={section === "system" ? "active" : ""} onClick={() => setSection("system")}><ScanLine />API 測試與系統後台</button>
          <button className={section === "parameters" ? "active" : ""} onClick={() => setSection("parameters")}><Monitor />系統參數</button>
          <button className={section === "audit" ? "active" : ""} onClick={() => setSection("audit")}><FileCheck2 />操作紀錄</button>
        </nav>
        <button className="button button-ghost admin-exit" onClick={onExit}><LogOut />登出管理後台</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><span>GFES 綠色消費循環平台</span><h1>{({ overview: "營運儀表板", accounts: "帳號與角色管理", content: "平台內容與計畫管理", reviews: "消費者行動證明審核", generator: "正式範例資料生成區", system: "API 測試與系統後台", parameters: "系統參數設定", audit: "管理員操作紀錄" } as Record<AdminSection, string>)[section]}</h1></div>
          <button className="button button-secondary" disabled={busy} onClick={onRefresh}><RefreshCcw />重新整理</button>
        </header>
        {error && <div className="admin-alert">{error}</div>}
        {notice && <div className="admin-notice"><CheckCircle2 />{notice}<button onClick={() => setNotice("")} aria-label="關閉"><X /></button></div>}

        {section === "overview" && <>
          <div className="admin-metrics">
            <article><span><Users /></span><small>平台帳號</small><strong>{data.summary.totalAccounts}</strong><em>{data.summary.activeAccounts} 個啟用中</em></article>
            <article><span><HandCoins /></span><small>角色綠點餘額</small><strong>{data.summary.totalPoints.toLocaleString()}</strong><em>全平台帳本即時計算</em></article>
            <article><span><ShoppingBasket /></span><small>上架商品</small><strong>{data.summary.activeProducts}</strong><em>由小農後台管理</em></article>
            <article><span><HeartHandshake /></span><small>募集中專案</small><strong>{data.summary.fundingProjects}</strong><em>小農維護・管理員監看</em></article>
          </div>
          <div className="admin-overview-grid">
            <section className="admin-card"><header><div><h2>角色分布</h2><p>目前已建立的正式平台帳號</p></div><button onClick={() => setSection("accounts")}>管理帳號<ChevronRight /></button></header><div className="role-summary">
              {["consumer", "farmer", "institution"].map((item) => <article key={item}><b>{roleName(item)}</b><strong>{data.accounts.filter((account) => account.role === item).length}</strong><span>{data.accounts.filter((account) => account.role === item && account.status === "active").length} 個啟用</span></article>)}
            </div></section>
            <section className="admin-card"><header><div><h2>最近管理操作</h2><p>所有數值與參數修改皆留下紀錄</p></div><button onClick={() => setSection("audit")}>完整紀錄<ChevronRight /></button></header><div className="audit-list compact">{data.auditLogs.slice(0, 5).map((log) => <article key={log.id}><span><FileCheck2 /></span><div><b>{actionName(log.action)}</b><small>{log.targetId}・{new Date(log.createdAt).toLocaleString("zh-TW")}</small></div></article>)}{data.auditLogs.length === 0 && <p className="admin-empty">尚無管理操作紀錄</p>}</div></section>
          </div>
        </>}

        {section === "accounts" && <div className="admin-account-sections">
          <section className="admin-card admin-table-card real-account-card">
            <header><div><h2>真實註冊帳號</h2><p>合作小農與銀行／政府／企業的新申請會排在最前方；確認資料後將狀態改為「啟用」，使用者才可登入。</p></div><span>{pendingRoleAccounts.length > 0 ? `${pendingRoleAccounts.length} 筆待審・` : ""}{realAccounts.length} 筆</span></header>
            {realAccounts.length > 0 ? <div className="real-account-table-wrap"><table className="real-account-table">
              <thead><tr><th>ID</th><th>Email</th><th>顯示名稱</th><th>角色</th><th>帳號狀態</th></tr></thead>
              <tbody>{realAccounts.map((account) => { const draft = accountDrafts[account.id]; if (!draft) return null; return <tr key={account.id}>
                <td data-label="ID"><code>{account.id}</code></td>
                <td data-label="Email">{account.email}</td>
                <td data-label="顯示名稱"><strong>{account.displayName}</strong></td>
                <td data-label="角色"><span className={`admin-role role-${account.role}`}>{roleName(account.role)}</span></td>
                <td data-label="帳號狀態"><div className="real-account-status"><select aria-label={`${account.displayName}帳號狀態`} value={draft.status} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, status: event.target.value } }))}><option value="active">啟用</option><option value="pending">待審核</option><option value="suspended">停權</option></select><button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_account", { profileId: account.id, displayName: draft.displayName, email: draft.email, username: draft.username, status: draft.status, city: draft.city, district: draft.district }, `${draft.displayName}的帳號狀態已儲存`)}>儲存</button></div></td>
              </tr>; })}</tbody>
            </table></div> : <p className="admin-empty">目前尚無真實註冊帳號；使用者完成一般註冊或第一次使用 Google 登入後會顯示在這裡。</p>}
          </section>

          <section className="admin-card admin-table-card"><header><div><h2>測試資料帳號</h2><p>系統預設的角色測試資料，可調整基本資料與帳號狀態，也能直接發送綠點；不列入真實客戶清單。</p></div><span>{testAccounts.length} 筆</span></header><div className="admin-record-list">
            {testAccounts.map((account) => { const draft = accountDrafts[account.id]; if (!draft) return null; return <article className="admin-account-row" key={account.id}>
              <div className="admin-record-title"><span className={`admin-role role-${account.role}`}>{roleName(account.role)}</span><h3>{account.displayName}</h3><small>{account.id}・目前 {account.points.toLocaleString()} 綠點</small></div>
              <div className="admin-form-grid account-grid">
                <label>顯示名稱<input value={draft.displayName} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, displayName: event.target.value } }))} /></label>
                <label>使用者名稱<input value={draft.username} pattern="[a-z0-9_]{4,24}" onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, username: event.target.value.toLowerCase() } }))} /></label>
                <label>登入信箱<input type="text" value={draft.email} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, email: event.target.value } }))} /></label>
                <label>縣市<input value={draft.city} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, city: event.target.value } }))} /></label>
                <label>地區<input value={draft.district} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, district: event.target.value } }))} /></label>
                <label>帳號狀態<select value={draft.status} onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, status: event.target.value } }))}><option value="active">啟用</option><option value="pending">待審核</option><option value="suspended">停權</option></select></label>
                <label>發送綠點<input type="number" min="1" max="100000" step="1" value={draft.pointsToSend || ""} placeholder="例如 1000" onChange={(event) => setAccountDrafts((current) => ({ ...current, [account.id]: { ...draft, pointsToSend: Number(event.target.value) } }))} /></label>
              </div><div className="admin-account-actions"><button className="button button-secondary" disabled={busy} onClick={() => void save("admin_update_account", { profileId: account.id, displayName: draft.displayName, email: draft.email, username: draft.username, status: draft.status, city: draft.city, district: draft.district }, `${draft.displayName}的測試帳號資料已儲存`)}>儲存帳號資料</button><button className="button button-primary" disabled={busy || !Number.isInteger(draft.pointsToSend) || draft.pointsToSend < 1 || draft.pointsToSend > 100000} onClick={() => void save("admin_send_points", { profileId: account.id, points: draft.pointsToSend }, `已發送 ${draft.pointsToSend.toLocaleString()} 綠點給 ${draft.displayName}`)}>確認發送{draft.pointsToSend > 0 ? ` ${draft.pointsToSend.toLocaleString()} 點` : "綠點"}</button></div>
            </article>; })}
          </div></section>
        </div>}

        {section === "content" && <div className="admin-content-stack">
          <section className="admin-card admin-content-summary">
            <header><div><h2>統一管理入口</h2><p>商品、改善專案、永續採購需求與綠點激勵計畫均在此查閱及調整，儲存後同步回各角色頁面。</p></div></header>
            <div className="admin-content-metrics">
              <article><ShoppingBasket /><span>小農商品</span><strong>{data.products.length}</strong></article>
              <article><HeartHandshake /><span>改善專案</span><strong>{data.projects.length}</strong></article>
              <article><PackageCheck /><span>採購需求</span><strong>{data.procurements.length}</strong></article>
              <article><HandCoins /><span>激勵計畫</span><strong>{data.incentives.length}</strong></article>
            </div>
          </section>

          <section className="admin-card admin-table-card"><header><div><h2>小農商品</h2><p>調整兌換點數、可用庫存與前台顯示狀態。</p></div><span>{data.products.length} 筆</span></header><div className="admin-record-list">
            {data.products.map((product) => { const draft = productDrafts[product.id]; if (!draft) return null; return <article className="admin-content-row" key={product.id}>
              <div className="admin-record-title"><span className="admin-role role-farmer">{product.farmerName}</span><h3>{product.title}</h3><small>{product.id}</small></div>
              <div className="admin-form-grid inline-grid">
                <label>兌換點數<input type="number" min="1" value={draft.points} onChange={(event) => setProductDrafts((current) => ({ ...current, [product.id]: { ...draft, points: Number(event.target.value) } }))} /></label>
                <label>庫存<input type="number" min="0" value={draft.stock} onChange={(event) => setProductDrafts((current) => ({ ...current, [product.id]: { ...draft, stock: Number(event.target.value) } }))} /></label>
                <label>狀態<select value={draft.status} onChange={(event) => setProductDrafts((current) => ({ ...current, [product.id]: { ...draft, status: event.target.value } }))}><option value="active">上架</option><option value="hidden">隱藏</option><option value="sold_out">售罄</option></select></label>
              </div>
              <button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_product", { productId: product.id, ...draft }, `${product.title}已更新`)}>儲存商品</button>
            </article>; })}
          </div></section>

          <section className="admin-card admin-table-card"><header><div><h2>小農改善專案</h2><p>調整每次支持點數、募集目標與案件狀態。</p></div><span>{data.projects.length} 筆</span></header><div className="admin-record-list">
            {data.projects.map((project) => { const draft = projectDrafts[project.id]; if (!draft) return null; return <article className="admin-content-row" key={project.id}>
              <div className="admin-record-title"><span className="admin-role role-farmer">改善專案</span><h3>{project.title}</h3><small>已募集 {project.raisedPoints.toLocaleString()} 點・{project.supporters} 人支持</small></div>
              <div className="admin-form-grid inline-grid">
                <label>單次支持<input type="number" min="1" value={draft.points} onChange={(event) => setProjectDrafts((current) => ({ ...current, [project.id]: { ...draft, points: Number(event.target.value) } }))} /></label>
                <label>目標點數<input type="number" min={draft.points} value={draft.targetPoints} onChange={(event) => setProjectDrafts((current) => ({ ...current, [project.id]: { ...draft, targetPoints: Number(event.target.value) } }))} /></label>
                <label>狀態<select value={draft.status} onChange={(event) => setProjectDrafts((current) => ({ ...current, [project.id]: { ...draft, status: event.target.value } }))}><option value="funding">募集中</option><option value="review">審核中</option><option value="completed">已完成</option><option value="hidden">隱藏</option></select></label>
              </div>
              <button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_project", { projectId: project.id, ...draft }, `${project.title}已更新`)}>儲存專案</button>
            </article>; })}
          </div></section>

          <section className="admin-card admin-table-card"><header><div><h2>永續採購需求</h2><p>管理銀行、政府與企業提出的數量、預算、配送範圍及媒合狀態。</p></div><span>{data.procurements.length} 筆</span></header><div className="admin-record-list">
            {data.procurements.map((procurement) => { const draft = procurementDrafts[procurement.id]; if (!draft) return null; return <article className="admin-content-row" key={procurement.id}>
              <div className="admin-record-title"><span className="admin-role role-institution">{procurement.institutionName}</span><h3>{procurement.title}</h3><small>{procurement.category}・{procurement.id}</small></div>
              <div className="admin-form-grid procurement-grid-admin">
                <label>需求數量<input type="number" min="1" value={draft.quantity} onChange={(event) => setProcurementDrafts((current) => ({ ...current, [procurement.id]: { ...draft, quantity: Number(event.target.value) } }))} /></label>
                <label>綠點預算<input type="number" min="1" value={draft.budgetPoints} onChange={(event) => setProcurementDrafts((current) => ({ ...current, [procurement.id]: { ...draft, budgetPoints: Number(event.target.value) } }))} /></label>
                <label>配送範圍<input value={draft.deliveryRegion} onChange={(event) => setProcurementDrafts((current) => ({ ...current, [procurement.id]: { ...draft, deliveryRegion: event.target.value } }))} /></label>
                <label>狀態<select value={draft.status} onChange={(event) => setProcurementDrafts((current) => ({ ...current, [procurement.id]: { ...draft, status: event.target.value } }))}><option value="open">媒合中</option><option value="matched">已媒合</option><option value="completed">已完成</option><option value="paused">暫停</option></select></label>
              </div>
              <button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_procurement", { procurementId: procurement.id, ...draft }, `${procurement.title}已更新`)}>儲存需求</button>
            </article>; })}
            {data.procurements.length === 0 && <p className="admin-empty">目前尚無永續採購需求。</p>}
          </div></section>

          <section className="admin-card admin-table-card"><header><div><h2>綠點激勵計畫</h2><p>調整整體點數預算與執行進度；新計畫由企業後台建立。</p></div><span>{data.incentives.length} 筆</span></header><div className="admin-record-list">
            {data.incentives.map((program) => { const draft = incentiveDrafts[program.id]; if (!draft) return null; return <article className="admin-content-row" key={program.id}>
              <div className="admin-record-title"><span className="admin-role role-institution">{program.sponsor}</span><h3>{program.name}</h3><small>{program.id}</small></div>
              <div className="admin-form-grid incentive-grid-admin">
                <label>計畫預算<input type="number" min="1" value={draft.budgetPoints} onChange={(event) => setIncentiveDrafts((current) => ({ ...current, [program.id]: { ...draft, budgetPoints: Number(event.target.value) } }))} /></label>
                <label>執行進度（%）<input type="number" min="0" max="100" value={draft.progress} onChange={(event) => setIncentiveDrafts((current) => ({ ...current, [program.id]: { ...draft, progress: Number(event.target.value) } }))} /></label>
              </div>
              <button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_incentive", { programId: program.id, ...draft }, `${program.name}已更新`)}>儲存計畫</button>
            </article>; })}
          </div></section>
        </div>}

        {section === "reviews" && <section className="admin-card admin-table-card action-review-section">
          <header><div><h2>消費者行動證明</h2><p>依序完成「查看證明 → 填寫審核說明 → 核准或退回」，流程不可省略；只有核准後才會發放綠點。</p></div><span className="review-pending-count">{data.actionSubmissions.filter((item) => item.status === "pending").length} 件待審</span></header>
          <div className="action-review-list">
            {sortedActionSubmissions.map((submission) => {
              const consumer = data.accounts.find((account) => account.id === submission.consumerId);
              const viewed = Boolean(submission.proofViewedAt);
              const noteReady = Boolean((reviewDrafts[submission.id] ?? "").trim());
              return <article className={`action-review-card ${submission.status}`} key={submission.id}>
                <div className="action-review-summary">
                  <span className={`submission-status ${submission.status}`}>{submission.status === "approved" ? "已核准" : submission.status === "rejected" ? "已退回" : "待審核"}</span>
                  <div><small>{consumer?.displayName ?? submission.consumerId}・{new Date(submission.submittedAt).toLocaleString("zh-TW")}</small><h3>{submission.title}</h3><p>{submission.note}</p></div>
                  <strong>+{submission.rewardPoints} 點</strong>
                </div>
                <div className="action-review-workflow" aria-label="審核流程">
                  <span className={viewed || submission.status !== "pending" ? "done" : "active"}><b>{viewed || submission.status !== "pending" ? <Check /> : "1"}</b>查看證明</span>
                  <span className={noteReady || submission.status !== "pending" ? "done" : viewed ? "active" : ""}><b>{noteReady || submission.status !== "pending" ? <Check /> : "2"}</b>填寫說明</span>
                  <span className={submission.status !== "pending" ? "done" : noteReady ? "active" : ""}><b>{submission.status !== "pending" ? <Check /> : "3"}</b>完成審核</span>
                </div>
                <div className="action-review-file"><FileCheck2 /><div><b>{submission.fileName}</b><small>{submission.contentType}・{Math.max(1, Math.round(submission.fileSize / 1024)).toLocaleString()} KB{viewed && submission.proofViewedAt ? `・已查看 ${new Date(submission.proofViewedAt).toLocaleString("zh-TW")}` : "・尚未查看"}</small></div><button type="button" className="button button-secondary" onClick={() => viewActionProof(submission)}>{viewed ? "再次查看" : "查看並記錄"}<ArrowRight /></button></div>
                {submission.status === "pending" ? <div className="action-review-controls">
                  <label>審核說明（必填）<textarea rows={2} disabled={!viewed} value={reviewDrafts[submission.id] ?? ""} onChange={(event) => setReviewDrafts((current) => ({ ...current, [submission.id]: event.target.value }))} placeholder={viewed ? "請填寫核准依據或退回補件原因" : "請先查看證明文件"} /></label>
                  <div><button className="button button-secondary review-reject" disabled={busy || !viewed || !noteReady} onClick={() => void save("admin_review_action_submission", { submissionId: submission.id, decision: "rejected", reviewNote: reviewDrafts[submission.id] }, `${submission.title}已退回，未發放綠點`)}><X />退回補件</button><button className="button button-primary" disabled={busy || !viewed || !noteReady} onClick={() => void save("admin_review_action_submission", { submissionId: submission.id, decision: "approved", reviewNote: reviewDrafts[submission.id] }, `${submission.title}已核准並發放 ${submission.rewardPoints} 綠點`)}><Check />核准並發點</button></div>
                </div> : <div className="action-review-result"><BadgeCheck /><span><b>{submission.status === "approved" ? "已完成核准與發點" : "已退回消費者補件"}</b><small>{submission.reviewNote || "未填寫審核說明"}{submission.reviewedAt ? `・${new Date(submission.reviewedAt).toLocaleString("zh-TW")}` : ""}</small></span></div>}
              </article>;
            })}
            {sortedActionSubmissions.length === 0 && <div className="admin-empty-state"><Upload /><h3>目前沒有送審資料</h3><p>消費者從「綠點來源」上傳證明後，會顯示在此處。</p></div>}
          </div>
        </section>}

        {section === "generator" && <div className="data-generator-section">
          <section className="admin-card farmer-media-library">
            <header>
              <div>
                <span className="admin-role role-farmer">原創影像資料庫</span>
                <h2>小農耕作與小農好物</h2>
                <p>每組固定同一位小農與同一農場環境，包含 2 張耕作照與 1 張對應農產好物照，可直接用於商品、專案與產地故事。</p>
              </div>
              <div className="farmer-media-summary" aria-label="影像資料庫統計">
                <span><b>{farmerImageLibrary.length}</b> 組小農</span>
                <span><b>{farmerImageLibrary.length * 2}</b> 張耕作</span>
                <span><b>{farmerImageLibrary.length}</b> 張好物</span>
              </div>
            </header>
            <div className="farmer-media-grid">
              {farmerImageLibrary.map((group, index) => (
                <article className="farmer-media-card" key={group.id}>
                  <div className="farmer-media-images">
                    {group.cultivationImages.map((image, imageIndex) => (
                      <figure key={image}>
                        <img loading="lazy" src={image} alt={`${group.farmerName}於${group.city}${group.district}${group.crop}農場的耕作紀錄 ${imageIndex + 1}`} />
                        <figcaption>耕作 {imageIndex + 1}</figcaption>
                      </figure>
                    ))}
                    <figure>
                      <img loading="lazy" src={group.productImage} alt={`${group.farmName}的${group.productName}`} />
                      <figcaption>小農好物</figcaption>
                    </figure>
                  </div>
                  <div className="farmer-media-content">
                    <span>{String(index + 1).padStart(2, "0")}・{group.city}{group.district}</span>
                    <h3>{group.farmName}</h3>
                    <p>{group.farmerName}・{group.crop}</p>
                    <b>{group.productName}</b>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="data-generator-layout">
          <section className="admin-card data-template-sidebar">
            <header><div><h2>前台提交資料對照</h2><p>依角色篩選需要上傳或填寫的正式範例。</p></div></header>
            <div className="template-role-tabs">
              {(["all", "consumer", "farmer", "institution"] as const).map((item) => <button key={item} className={templateRole === item ? "active" : ""} onClick={() => { setTemplateRole(item); const first = data.dataTemplates.find((template) => item === "all" || template.targetRole === item); if (first) setSelectedTemplateKey(first.templateKey); }}>{item === "all" ? "全部" : roleName(item)}</button>)}
            </div>
            <div className="template-list">{filteredTemplates.map((template) => <button key={template.templateKey} className={selectedTemplate?.templateKey === template.templateKey ? "active" : ""} onClick={() => setSelectedTemplateKey(template.templateKey)}><span><FileCheck2 /></span><div><b>{template.displayName}</b><small>{template.uploadArea}</small></div><ChevronRight /></button>)}</div>
          </section>

          {selectedTemplate && <div className="data-template-main">
            <section className="admin-card template-summary-card">
              <div className="template-summary-head"><div><span className={`admin-role role-${selectedTemplate.targetRole}`}>{roleName(selectedTemplate.targetRole)}</span><h2>{selectedTemplate.displayName}</h2><p>{selectedTemplate.description}</p></div><div className="template-actions"><button className="button button-secondary" disabled={busy} onClick={() => void save("admin_generate_data_template", { templateKey: selectedTemplate.templateKey }, "已產生新的正式範例編號與時間")}><RefreshCcw />產生新範例</button><button className="button button-primary" onClick={() => downloadDataTemplate(selectedTemplate)}><Download />下載完整 PDF</button></div></div>
              <div className="template-meta-grid"><div><small>提交位置</small><b>{selectedTemplate.uploadArea}</b></div><div><small>文件類別</small><b>{selectedTemplate.documentType}</b></div><div><small>格式版本</small><b>Schema {selectedTemplate.schemaVersion}</b></div><div><small>下載檔名</small><b>{templatePdfFiles[selectedTemplate.templateKey] ?? "PDF 建置中"}</b></div></div>
            </section>

            <section className="official-document-preview">
              <header><div className="official-seal"><Leaf /></div><div><small>GFES GREEN CONSUMPTION PLATFORM</small><h2>{selectedTemplate.displayName}</h2><p>正式文件格式範例・僅供系統測試與欄位對照</p></div></header>
              <div className="official-doc-meta"><span>文件編號：<b>{String(selectedMeta.documentNumber ?? "GFES-SAMPLE")}</b></span><span>格式版本：<b>{selectedTemplate.schemaVersion}</b></span><span>產製時間：<b>{String(selectedMeta.generatedAt ?? selectedTemplate.updatedAt).slice(0, 19).replace("T", " ")}</b></span></div>
              <div className="official-doc-body">{Object.entries(selectedTemplate.sampleData).filter(([key]) => key !== "meta").map(([key, value], index) => <section key={key}><h3>{String(index + 1).padStart(2, "0")}．{key}</h3>{value && typeof value === "object" && !Array.isArray(value) ? <div className="official-field-grid">{Object.entries(value as Record<string, unknown>).map(([field, fieldValue]) => <div key={field}><small>{field}</small><b>{typeof fieldValue === "object" ? JSON.stringify(fieldValue) : String(fieldValue)}</b></div>)}</div> : <pre>{JSON.stringify(value, null, 2)}</pre>}</section>)}</div>
              <footer><span>系統範例文件，不代表政府機關核發證明</span><b>GFES 資料生成區</b></footer>
            </section>

            <section className="admin-card template-editor-card">
              <header><div><h2>範例資料欄位</h2><p>可依正式介接規格調整內容；必須維持有效 JSON 格式。</p></div><button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_data_template", { templateKey: selectedTemplate.templateKey, schemaVersion: selectedTemplate.schemaVersion, sampleData: templateDrafts[selectedTemplate.templateKey] }, `${selectedTemplate.displayName}已儲存`)}>儲存範例</button></header>
              <textarea aria-label={`${selectedTemplate.displayName} JSON 範例`} rows={18} value={templateDrafts[selectedTemplate.templateKey] ?? JSON.stringify(selectedTemplate.sampleData, null, 2)} onChange={(event) => setTemplateDrafts((current) => ({ ...current, [selectedTemplate.templateKey]: event.target.value }))} />
            </section>
          </div>}
          </div>
        </div>}

        {section === "system" && <AdminApiSystemPage
          key={JSON.stringify(snapshot.integrationSettings)}
          settings={snapshot.integrationSettings}
          runs={snapshot.verificationRuns}
          points={snapshot.consumer.points}
          busy={busy}
          onUpdate={(values) => void save("update_integration_setting", values, "API 測試設定已儲存")}
          onSimulate={(serviceKey) => void save("simulate_integration", { serviceKey, input: { requestedBy: "platform-admin", requestedAt: new Date().toISOString(), nonce: crypto.randomUUID() } }, "模擬驗證已完成")}
        />}

        {section === "parameters" && <section className="admin-card admin-table-card"><header><div><h2>平台營運參數</h2><p>以下設定由管理員控制，儲存後寫入後端資料庫。</p></div></header><div className="parameter-grid">{data.parameters.map((parameter) => <article key={parameter.parameterKey}><span><Monitor /></span><div><h3>{parameter.displayName}</h3><p>{parameter.description}</p><small>{parameter.parameterKey}</small></div><label>設定值<div><input value={parameterDrafts[parameter.parameterKey] ?? parameter.value} onChange={(event) => setParameterDrafts((current) => ({ ...current, [parameter.parameterKey]: event.target.value }))} /><em>{parameter.unit}</em></div></label><button className="button button-primary" disabled={busy} onClick={() => void save("admin_update_parameter", { parameterKey: parameter.parameterKey, value: parameterDrafts[parameter.parameterKey] ?? parameter.value }, `${parameter.displayName}已儲存`)}>儲存參數</button></article>)}</div></section>}

        {section === "audit" && <section className="admin-card admin-table-card"><header><div><h2>管理員操作紀錄</h2><p>保留帳號、內容、數量與參數的修改軌跡。</p></div></header><div className="audit-list">{data.auditLogs.map((log) => <article key={log.id}><span><FileCheck2 /></span><div><b>{actionName(log.action)}</b><p>{log.targetType}・{log.targetId}</p><small>{new Date(log.createdAt).toLocaleString("zh-TW")}</small></div><code>{JSON.stringify(log.detail)}</code></article>)}{data.auditLogs.length === 0 && <p className="admin-empty">儲存第一筆設定後，紀錄會顯示在這裡。</p>}</div></section>}
      </main>

      <nav className="admin-mobile-nav">
        <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><Home />總覽</button>
        <button className={section === "accounts" ? "active" : ""} onClick={() => setSection("accounts")}><Users />帳號</button>
        <button className={section === "content" ? "active" : ""} onClick={() => setSection("content")}><ShoppingBasket />內容</button>
        <button className={section === "reviews" ? "active" : ""} onClick={() => setSection("reviews")}><BadgeCheck />審核</button>
        <button className={section === "generator" ? "active" : ""} onClick={() => setSection("generator")}><FileCheck2 />資料</button>
        <button className={section === "system" ? "active" : ""} onClick={() => setSection("system")}><ScanLine />API</button>
        <button className={section === "parameters" ? "active" : ""} onClick={() => setSection("parameters")}><Monitor />參數</button>
        <button className={section === "audit" ? "active" : ""} onClick={() => setSection("audit")}><FileCheck2 />紀錄</button>
      </nav>
    </div>
  );
}

function LoginModal({
  role,
  lockedRole,
  setRole,
  error,
  registrationNotice,
  busy,
  onClose,
  onDismissRegistrationNotice,
  onEnter,
  onRegister,
  onGoogleLogin,
}: {
  role: LoginRole;
  lockedRole?: LoginRole;
  setRole: (role: LoginRole) => void;
  error: string;
  registrationNotice: string;
  busy: boolean;
  onClose: () => void;
  onDismissRegistrationNotice: () => void;
  onEnter: (email: string, password: string) => void;
  onRegister: (displayName: string, username: string, email: string, password: string) => void;
  onGoogleLogin: (role: Role) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  function changeRole(nextRole: LoginRole) {
    setRole(nextRole);
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
    setLocalError("");
    if (nextRole === "admin") setMode("login");
  }

  function switchMode(nextMode: "login" | "register") {
    if (nextMode === "register" && role === "admin") return;
    setMode(nextMode);
    setLocalError("");
    if (nextMode === "login") {
      setEmail("");
      setPassword("");
    } else {
      setEmail("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
    }
  }

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setLocalError("兩次輸入的密碼不一致。");
      return;
    }
    setLocalError("");
    onRegister(role === "consumer" ? username : displayName, username, email, password);
  }

  return (
    <ModalShell title={mode === "login" ? "登入平台" : "註冊平台帳號"} onClose={onClose}>
      <div className="login-layout">
        <div className="login-photo">
          <strong>選擇你的角色，走進同一個綠色循環。</strong>
          <span>{mode === "login" ? "登入後會依角色進入對應的前台或管理後台。" : role === "consumer" ? "消費者建立帳號後即可開始使用平台。" : "送出註冊後，平台管理員會先確認角色與申請資料。"}</span>
        </div>
        <div>
          <span className="eyebrow">{lockedRole ? "專屬角色入口" : "選擇角色"}</span>
          {lockedRole ? (() => {
            const item = loginRoles[lockedRole];
            const Icon = item.icon;
            return <div className="portal-role-lock"><span className="role-icon"><Icon /></span><span><strong>{item.label}</strong><small>{item.description}</small></span><CheckCircle2 /></div>;
          })() : <div className="role-options login-role-options">
            {(Object.keys(loginRoles) as LoginRole[]).map((key) => {
              const item = loginRoles[key];
              const Icon = item.icon;
              return (
                <button type="button" className={`role-option ${role === key ? "active" : ""}`} key={key} onClick={() => changeRole(key)}>
                  <span className="role-icon"><Icon /></span>
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  {role === key && <CheckCircle2 className="role-check" />}
                </button>
              );
            })}
          </div>}
          {registrationNotice ? <div className="registration-approval-notice" role="status">
            <header><span><BadgeCheck /></span><div><small>REGISTRATION RECEIVED</small><h3>申請已送出，等待管理員審核</h3></div></header>
            <p>{registrationNotice}</p>
            <ol><li><b>1</b><span>平台管理員確認角色與申請資料</span></li><li><b>2</b><span>審核結果更新為「啟用」</span></li><li><b>3</b><span>核准後即可使用原帳號登入後台</span></li></ol>
            <button type="button" className="button button-secondary button-block" onClick={() => { onDismissRegistrationNotice(); setMode("login"); }}>返回登入畫面</button>
          </div> : <><div className="auth-mode-switch" role="tablist" aria-label="登入或註冊">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>登入</button>
            <button type="button" className={mode === "register" ? "active" : ""} disabled={role === "admin"} onClick={() => switchMode("register")}>註冊帳號</button>
          </div>
          {mode === "login" ? (
            <form className="login-credentials" onSubmit={(event) => { event.preventDefault(); onEnter(email, password); }}>
              <label>電子信箱或使用者名稱<input type="text" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com 或 username" required /></label>
              <label>密碼<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="請輸入密碼" required /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "隱藏" : "顯示"}</button></div></label>
              {(localError || error) && <div className="login-error" role="alert">{localError || error}</div>}
              <button className="button button-primary button-block" type="submit" disabled={busy}>
                {role === "consumer" ? "登入消費者前台" : `登入${loginRoles[role].label}後台`}<ArrowRight />
              </button>
              {role !== "admin" && (
                <>
                  <div className="auth-divider"><span>或</span></div>
                  <button className="google-register-button" type="button" disabled={busy} onClick={() => onGoogleLogin(role)}><span aria-hidden="true">G</span>使用 Google 登入</button>
                </>
              )}
            </form>
          ) : (
            <form className="login-credentials registration-form" onSubmit={submitRegistration}>
              {role !== "consumer" && <label>{role === "farmer" ? "農場／小農名稱" : "單位名稱"}<input type="text" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={60} required /></label>}
              <label>使用者名稱<input type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} pattern="[a-z0-9_]{4,24}" minLength={4} maxLength={24} placeholder="4–24 個英文字母、數字或底線" title="請輸入 4 至 24 個英文字母、數字或底線" required /></label>
              <label>電子信箱<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required /></label>
              <label>密碼<div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={72} placeholder="至少 8 個字元" required /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? "隱藏" : "顯示"}</button></div></label>
              <label>再次輸入密碼<input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={72} required /></label>
              {(localError || error) && <div className="login-error" role="alert">{localError || error}</div>}
              <button className="button button-primary button-block" type="submit" disabled={busy}>建立{loginRoles[role].label}帳號<ArrowRight /></button>
            </form>
          )}</>}
          <p className="system-note">消費者註冊後可直接使用；合作小農與銀行／政府／企業需經管理員審核通過後才能登入。</p>
        </div>
      </div>
    </ModalShell>
  );
}

function ConsumerSettingsPage({ settings, busy, onSave }: { settings: ConsumerSettings; busy: boolean; onSave: (settings: ConsumerSettings) => Promise<boolean> }) {
  const [draft, setDraft] = useState(settings);

  function update<K extends keyof ConsumerSettings>(key: K, value: ConsumerSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="consumer-settings-page">
      <form onSubmit={(event) => { event.preventDefault(); void onSave(draft); }}>
        <header className="settings-page-header">
          <div><span><Settings /></span><div><small>ACCOUNT SETTINGS</small><h2>設定</h2><p>以下資料只屬於目前登入帳戶，可隨時更新。</p></div></div>
          {settings.updatedAt && <small>上次更新：{new Date(settings.updatedAt).toLocaleString("zh-TW")}</small>}
        </header>

        <article className="settings-section">
          <div className="settings-section-title"><span><User /></span><div><h3>個人資料</h3><p>用於帳戶顯示、活動通知與聯絡。</p></div></div>
          <div className="settings-grid">
            <label>顯示名稱<input required minLength={2} maxLength={60} autoComplete="name" value={draft.displayName} onChange={(event) => update("displayName", event.target.value)} /></label>
            <label>聯絡信箱<input required type="email" autoComplete="email" value={draft.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} /><small>不會改變原本的登入方式</small></label>
            <label>聯絡電話<input required type="tel" autoComplete="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
          </div>
        </article>

        <article className="settings-section">
          <div className="settings-section-title"><span><Truck /></span><div><h3>預設配送地址</h3><p>兌換小農商品時會自動帶入，仍可在送出訂單前修改。</p></div></div>
          <div className="settings-grid">
            <label>收件人<input required autoComplete="shipping name" value={draft.deliveryRecipientName} onChange={(event) => update("deliveryRecipientName", event.target.value)} /></label>
            <label>收件電話<input required type="tel" autoComplete="shipping tel" value={draft.deliveryPhone} onChange={(event) => update("deliveryPhone", event.target.value)} /></label>
            <label>郵遞區號<input required inputMode="numeric" autoComplete="shipping postal-code" value={draft.deliveryPostalCode} onChange={(event) => update("deliveryPostalCode", event.target.value)} /></label>
            <label>縣市<input required autoComplete="shipping address-level1" value={draft.deliveryCity} onChange={(event) => update("deliveryCity", event.target.value)} /></label>
            <label>行政區<input required autoComplete="shipping address-level2" value={draft.deliveryDistrict} onChange={(event) => update("deliveryDistrict", event.target.value)} /></label>
            <label className="settings-span-two">詳細地址<input required autoComplete="shipping street-address" value={draft.deliveryAddress} onChange={(event) => update("deliveryAddress", event.target.value)} /></label>
            <label className="settings-span-two">配送備註<textarea rows={3} maxLength={300} value={draft.deliveryNote} onChange={(event) => update("deliveryNote", event.target.value)} placeholder="例如：送達前請先電話聯絡" /></label>
          </div>
        </article>

        <article className="settings-section settings-location-section">
          <div className="settings-section-title"><span><MapPin /></span><div><h3>活動所在地（居住地址）</h3><p>用於計算附近小農、綠色行動與優惠的距離，不會公開顯示完整門牌。</p></div></div>
          <div className="settings-grid">
            <label>郵遞區號<input required inputMode="numeric" autoComplete="home postal-code" value={draft.residencePostalCode} onChange={(event) => update("residencePostalCode", event.target.value)} /></label>
            <label>居住縣市<input required autoComplete="home address-level1" value={draft.residenceCity} onChange={(event) => update("residenceCity", event.target.value)} /></label>
            <label>居住行政區<input required autoComplete="home address-level2" value={draft.residenceDistrict} onChange={(event) => update("residenceDistrict", event.target.value)} /></label>
            <label className="settings-span-two">居住地址<input required autoComplete="home street-address" value={draft.residenceAddress} onChange={(event) => update("residenceAddress", event.target.value)} /></label>
          </div>
          <div className="settings-privacy-note"><LockKeyhole /><span><b>隱私保護</b>附近推薦只使用縣市、行政區與距離計算；其他消費者與小農不會看到完整居住地址。</span></div>
        </article>

        <div className="settings-actions"><button className="button button-primary" type="submit" disabled={busy}><Check />{busy ? "儲存中…" : "儲存全部設定"}</button></div>
      </form>
    </section>
  );
}

function ConsumerDashboard({
  points,
  supportedItems,
  redeemed,
  period,
  setPeriod,
  lastRedeemedId,
  onInvoice,
  onReceipt,
  ledger,
  actionSubmissions,
  onSubmitActionProof,
  busy,
  news,
}: {
  points: number;
  supportedItems: LocalProject[];
  redeemed: boolean;
  period: string;
  setPeriod: (value: string) => void;
  lastRedeemedId: string;
  onInvoice: () => void;
  onReceipt: () => void;
  ledger: BackendSnapshot["ledger"];
  actionSubmissions: ActionSubmission[];
  onSubmitActionProof: (actionType: string, note: string, file: File) => Promise<boolean>;
  busy: boolean;
  news: FarmerNews[];
}) {
  const supportTotal = supportedItems.reduce((sum, item) => sum + item.points, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyEarned = ledger.filter((entry) => entry.deltaPoints > 0 && entry.createdAt.slice(0, 7) === currentMonth).reduce((sum, entry) => sum + entry.deltaPoints, 0);
  const pointHistory = Object.entries(ledger.filter((entry) => entry.deltaPoints > 0).reduce<Record<string, number>>((groups, entry) => {
    const key = entry.createdAt.slice(0, 7);
    groups[key] = (groups[key] ?? 0) + entry.deltaPoints;
    return groups;
  }, {})).sort(([left], [right]) => left.localeCompare(right)).map(([month, value]) => ({ month, points: value }));
  const visiblePointHistory = (pointHistory.length > 0 ? pointHistory : [{ month: "尚無紀錄", points: 0 }]).slice(period === "近三月" ? -3 : period === "半年" ? -6 : -12);
  const greenActions = [
    { type: "reusable_cup", title: "使用環保杯", shortTitle: "環保杯", points: 10, icon: Leaf, help: "請檢附店家交易明細、發票或合作店家核發的行動確認紀錄", sampleFile: "GFES_環保杯行動證明_正式範例.pdf" },
    { type: "public_transport", title: "搭乘大眾運輸", shortTitle: "大眾運輸", points: 80, icon: Truck, help: "請檢附運輸業者或電子票證平台核發的乘車紀錄或正式票券", sampleFile: "GFES_大眾運輸行動證明_正式範例.pdf" },
    { type: "ebill", title: "改用電子帳單", shortTitle: "電子帳單", points: 50, icon: Receipt, help: "請檢附服務單位核發的電子帳單啟用通知與帳戶查驗資料", sampleFile: "GFES_電子帳單行動證明_正式範例.pdf" },
    { type: "energy_appliance", title: "購買節能家電", shortTitle: "節能家電", points: 600, icon: Building2, help: "請檢附統一發票、產品型號及能源效率分級標示等正式資料", sampleFile: "GFES_節能家電行動證明_正式範例.pdf" },
  ];
  const [selectedActionType, setSelectedActionType] = useState(greenActions[0].type);
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [proofConfirmOpen, setProofConfirmOpen] = useState(false);
  const selectedAction = greenActions.find((item) => item.type === selectedActionType) ?? greenActions[0];

  function handleProofSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proofFile) return;
    setProofConfirmOpen(true);
  }

  async function confirmProofSubmit() {
    if (!proofFile) return;
    const submitted = await onSubmitActionProof(selectedAction.type, proofNote, proofFile);
    if (!submitted) return;
    setProofConfirmOpen(false);
    setProofNote("");
    setProofFile(null);
    setFileInputKey((current) => current + 1);
  }

  return (
    <div className="dashboard-grid">
      <section className="span-4">
        <div className="wallet">
          <span>可用綠點</span>
          <strong>{points.toLocaleString()} <small>點</small></strong>
          <div><span>本月取得<b>{monthlyEarned.toLocaleString()} 點</b></span><span>累計支持<b>{supportTotal.toLocaleString()} 點</b></span></div>
        </div>
        <div className="quick-actions">
          <button onClick={onInvoice}><span><ScanLine /></span><b>回傳消費證明<small>消費回饋取得綠點</small></b></button>
          <button onClick={onReceipt}><span><FileCheck2 /></span><b>影響力收據<small>查看支持流向與成果</small></b></button>
        </div>
        <div className="green-action-list">
          <div className="section-heading"><div><span className="eyebrow">綠點來源</span><h3>完成行動即可累積</h3></div></div>
          {greenActions.map((action) => { const Icon = action.icon; return <button type="button" className={selectedActionType === action.type ? "selected" : ""} aria-pressed={selectedActionType === action.type} onClick={() => setSelectedActionType(action.type)} key={action.type}><Icon />{action.shortTitle} <strong>+{action.points}</strong></button>; })}
        </div>
        <form className="action-proof-uploader" onSubmit={handleProofSubmit}>
          <header><span><Upload /></span><div><h3>上傳行動證明</h3><p>送出後由管理員審核，核准才會發放綠點。</p></div></header>
          <div className="action-proof-selection"><span>已選擇</span><b>{selectedAction.title}</b><strong>核准後 +{selectedAction.points} 點</strong></div>
          <p className="action-proof-help">{selectedAction.help}</p>
          <a className="action-proof-sample" href={`/documents/${selectedAction.sampleFile}`} target="_blank" rel="noreferrer"><FileCheck2 /><span><b>查看正式繳交文件範例</b><small>{selectedAction.sampleFile}・PDF</small></span><Download /></a>
          <p className="action-proof-guidance"><BadgeCheck />範例均為正式文件版型；實際送件請上傳原始票證、帳單、發票或核發紀錄，不接受無關的一般照片。</p>
          <label className="action-proof-file">
            <Upload />
            <span><b>{proofFile ? proofFile.name : "選擇正式證明檔案"}</b><small>優先使用 PDF；圖片僅限原始票證、帳單或核發證明，最大 10 MB</small></span>
            <input key={fileInputKey} type="file" accept="image/*,application/pdf" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} required />
          </label>
          <label className="action-proof-note">補充說明（選填）<textarea rows={3} value={proofNote} onChange={(event) => setProofNote(event.target.value)} placeholder="例如：8 月 10 日於大安區合作店家使用環保杯" /></label>
          <button className="button button-primary action-proof-submit" type="submit" disabled={busy || !proofFile}>{busy ? "正在送出…" : "送出證明，等待審核"}<ArrowRight /></button>
          {actionSubmissions.length > 0 && <div className="action-submission-history">
            <div className="section-heading"><div><span className="eyebrow">送審紀錄</span><h3>行動證明進度</h3></div></div>
            {actionSubmissions.slice(0, 4).map((submission) => <article key={submission.id}>
              <span className={`submission-status ${submission.status}`}>{submission.status === "approved" ? "已核准" : submission.status === "rejected" ? "已退回" : "待審核"}</span>
              <div><b>{submission.title}</b><small>{submission.fileName}・{new Date(submission.submittedAt).toLocaleString("zh-TW")}</small>{submission.reviewNote && <p>{submission.reviewNote}</p>}</div>
              <strong>+{submission.rewardPoints} 點</strong>
            </article>)}
          </div>}
        </form>
        {proofConfirmOpen && proofFile && <ModalShell title="最終確認｜送出行動證明" onClose={() => !busy && setProofConfirmOpen(false)} small>
          <div className="action-proof-confirm">
            <div className="action-proof-confirm-alert"><BadgeCheck /><div><b>請確認送審資料</b><p>送出後將進入管理員審核流程，在審核完成前無法自行修改或重複送出。</p></div></div>
            <div className="receipt-box">
              <Row label="綠色行動" value={selectedAction.title} />
              <Row label="核准後綠點" value={`+${selectedAction.points} 點`} />
              <Row label="證明文件" value={proofFile.name} />
              <Row label="檔案大小" value={`${Math.max(1, Math.round(proofFile.size / 1024)).toLocaleString()} KB`} />
              <Row label="補充說明" value={proofNote.trim() || "未填寫"} />
            </div>
            <label className="action-proof-confirm-check"><input type="checkbox" required form="action-proof-final-confirm" /><span>我已確認上述資料及附件正確，並同意送交管理員審核。</span></label>
            <form id="action-proof-final-confirm" className="modal-actions" onSubmit={(event) => { event.preventDefault(); void confirmProofSubmit(); }}>
              <button type="button" className="button button-secondary" onClick={() => setProofConfirmOpen(false)} disabled={busy}>返回修改</button>
              <button type="submit" className="button button-primary" disabled={busy}>{busy ? "正在送出…" : "確認送出並進入審核"}<ArrowRight /></button>
            </form>
          </div>
        </ModalShell>}
      </section>

      <Panel className="span-8" title="綠點趨勢" note="消費、交通、電子帳單與政府企業方案取得的綠點" action={
        <div className="chips">
          {["近三月", "半年", "一年"].map((item) => (
            <button className={period === item ? "active" : ""} onClick={() => setPeriod(item)} key={item}>{item}</button>
          ))}
        </div>
      }>
        <Chart>
          <AreaChart data={visiblePointHistory}>
            <defs><linearGradient id="pointFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d7250" stopOpacity=".32" /><stop offset="95%" stopColor="#2d7250" stopOpacity="0" /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe4" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="points" name="取得綠點" stroke="#2d7250" strokeWidth={3} fill="url(#pointFill)" />
          </AreaChart>
        </Chart>
      </Panel>

      <Panel className="span-12" title="你支持的小農最新消息" note="依你曾購買商品或支持改善專案的小農自動推播">
        <FarmerNewsFeed news={news} emptyText="完成小農商品兌換或支持改善專案後，相關小農發布的消息會顯示在這裡。" />
      </Panel>

      <Panel className="span-12" title="近期紀錄" note="多元綠點來源與使用去向">
        <div className="activity-list">
          {ledger.length > 0 ? ledger.map((entry) => <Activity
            key={entry.id}
            icon={entry.sourceType.includes("transport") ? Truck : entry.sourceType.includes("invoice") || entry.sourceType.includes("ebill") ? Receipt : entry.sourceType.includes("support") ? HeartHandshake : entry.sourceType.includes("redeem") || entry.sourceType.includes("order") ? ShoppingBasket : entry.sourceType.includes("cup") ? Leaf : Store}
            title={entry.description}
            note={`${entry.sourceType}・${entry.createdAt}`}
            value={`${entry.deltaPoints > 0 ? "+" : ""}${entry.deltaPoints.toLocaleString()} 點`}
          />) : <Activity icon={Leaf} title="尚無點數紀錄" note="完成綠色行動後會建立一點一履歷" value="0 點" />}
        </div>
      </Panel>
    </div>
  );
}

const taiwanLocationOptions: Record<string, string[]> = {
  "台北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
  "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "土城區", "蘆洲區", "汐止區", "淡水區", "三峽區", "林口區"],
  "桃園市": ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "龜山區", "大溪區", "龍潭區"],
  "台中市": ["中區", "東區", "西區", "北區", "西屯區", "南屯區", "北屯區", "豐原區", "大里區", "太平區", "清水區"],
  "台南市": ["中西區", "東區", "南區", "北區", "安平區", "永康區", "新營區", "善化區", "麻豆區", "玉井區"],
  "高雄市": ["新興區", "前金區", "苓雅區", "三民區", "左營區", "鼓山區", "前鎮區", "鳳山區", "岡山區", "旗山區"],
  "基隆市": ["仁愛區", "信義區", "中正區", "中山區", "安樂區", "暖暖區", "七堵區"],
  "新竹市": ["東區", "北區", "香山區"],
  "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "峨眉鄉"],
  "苗栗縣": ["苗栗市", "頭份市", "竹南鎮", "苑裡鎮", "三義鄉", "公館鄉", "南庄鄉"],
  "彰化縣": ["彰化市", "員林市", "鹿港鎮", "溪湖鎮", "田中鎮", "二林鎮", "溪州鄉"],
  "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "魚池鄉", "仁愛鄉", "信義鄉"],
  "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "古坑鄉", "土庫鎮", "北港鎮"],
  "嘉義市": ["東區", "西區"],
  "嘉義縣": ["太保市", "朴子市", "民雄鄉", "大林鎮", "新港鄉", "中埔鄉", "阿里山鄉"],
  "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "內埔鄉", "萬丹鄉", "三地門鄉"],
  "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "冬山鄉", "三星鄉"],
  "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "瑞穗鄉"],
  "台東縣": ["台東市", "成功鎮", "關山鎮", "池上鄉", "東河鄉", "鹿野鄉", "太麻里鄉"],
  "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
  "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉"],
  "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"],
};

const locationReference: Array<{ city: string; district: string; latitude: number; longitude: number }> = [
  { city: "台北市", district: "大安區", latitude: 25.0268, longitude: 121.5434 },
  { city: "新北市", district: "板橋區", latitude: 25.0114, longitude: 121.4618 },
  { city: "桃園市", district: "桃園區", latitude: 24.9937, longitude: 121.301 },
  { city: "台中市", district: "西屯區", latitude: 24.1813, longitude: 120.6466 },
  { city: "台南市", district: "中西區", latitude: 22.9948, longitude: 120.1965 },
  { city: "高雄市", district: "苓雅區", latitude: 22.6265, longitude: 120.312 },
  { city: "雲林縣", district: "斗六市", latitude: 23.7077, longitude: 120.5409 },
  { city: "彰化縣", district: "彰化市", latitude: 24.0756, longitude: 120.544 },
  { city: "嘉義縣", district: "民雄鄉", latitude: 23.551, longitude: 120.43 },
  { city: "花蓮縣", district: "花蓮市", latitude: 23.9911, longitude: 121.6112 },
  { city: "台東縣", district: "台東市", latitude: 22.7554, longitude: 121.150 },
];

function formatActivitySchedule(eventStart: string, eventEnd: string) {
  if (!eventStart) return "活動時間待主辦單位公告";
  const start = new Date(eventStart);
  const end = eventEnd ? new Date(eventEnd) : null;
  if (Number.isNaN(start.getTime())) return eventStart;
  const dateFormat = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "short" });
  const timeFormat = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });
  const startDate = dateFormat.format(start);
  if (!end || Number.isNaN(end.getTime())) return `${startDate} ${timeFormat.format(start)}`;
  const sameDay = start.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }) === end.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  return sameDay
    ? `${startDate} ${timeFormat.format(start)}–${timeFormat.format(end)}`
    : `${startDate} ${timeFormat.format(start)} 至 ${dateFormat.format(end)} ${timeFormat.format(end)}`;
}

function LocalSupportDashboard({
  points,
  projects,
  supportedIds,
  redeemedIds,
  onProject,
  onLearnMore,
  location,
  onLocation,
  localActions,
  merchantOffers,
  registeredActionIds,
  onRegister,
  onVisit,
}: {
  points: number;
  projects: LocalProject[];
  supportedIds: string[];
  redeemedIds: string[];
  onProject: (id: string) => void;
  onLearnMore: (id: string) => void;
  location: string;
  onLocation: (city: string, district: string) => void;
  localActions: BackendSnapshot["localActions"];
  merchantOffers: BackendSnapshot["merchantOffers"];
  registeredActionIds: string[];
  onRegister: (actionId: string) => void;
  onVisit: (address: string, title: string) => void;
}) {
  const activeLocationCity = Object.keys(taiwanLocationOptions).find((city) => location.startsWith(city)) ?? "台北市";
  const activeLocationDistrict = location.slice(activeLocationCity.length) || taiwanLocationOptions[activeLocationCity][0];
  const [draftCity, setDraftCity] = useState(activeLocationCity);
  const [draftDistrict, setDraftDistrict] = useState(activeLocationDistrict);
  const [locationStatus, setLocationStatus] = useState("");
  const [locating, setLocating] = useState(false);

  function detectCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("此裝置不支援定位，請手動選擇縣市與行政區。");
      return;
    }
    setLocating(true);
    setLocationStatus("正在取得目前位置…");
    navigator.geolocation.getCurrentPosition((position) => {
      const nearest = locationReference.reduce((best, item) => {
        const itemDistance = Math.hypot(position.coords.latitude - item.latitude, position.coords.longitude - item.longitude);
        const bestDistance = Math.hypot(position.coords.latitude - best.latitude, position.coords.longitude - best.longitude);
        return itemDistance < bestDistance ? item : best;
      }, locationReference[0]);
      setDraftCity(nearest.city);
      setDraftDistrict(nearest.district);
      setLocationStatus(`已定位至${nearest.city}${nearest.district}附近，請確認後套用。`);
      setLocating(false);
    }, () => {
      setLocationStatus("無法取得定位權限，仍可手動選擇所在地。");
      setLocating(false);
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
  }

  const locationById: Record<string, { city: string; district: string; distance: number }> = {
    water: { city: "雲林縣", district: "古坑鄉", distance: 205 },
    rice: { city: "嘉義縣", district: "民雄鄉", distance: 244 },
    "solar-cold": { city: "花蓮縣", district: "壽豐鄉", distance: 172 },
    "circular-pack": { city: "彰化縣", district: "溪州鄉", distance: 184 },
    pollinator: { city: "苗栗縣", district: "卓蘭鎮", distance: 137 },
    veggie: { city: "雲林縣", district: "西螺鎮", distance: 194 },
    "rice-box": { city: "嘉義縣", district: "民雄鄉", distance: 244 },
    "fruit-box": { city: "花蓮縣", district: "壽豐鄉", distance: 172 },
    "herbal-tea": { city: "苗栗縣", district: "卓蘭鎮", distance: 137 },
    "veggie-meal": { city: "雲林縣", district: "西螺鎮", distance: 194 },
  };
  const selectedCity = activeLocationCity;
  const distanceFromLocation = (city: string, district: string, fallback: number) => {
    if (city === activeLocationCity) return district === activeLocationDistrict ? Math.min(1.2, fallback) : Math.min(18, fallback);
    const from = locationReference.find((item) => item.city === activeLocationCity);
    const to = locationReference.find((item) => item.city === city);
    if (!from || !to) return fallback;
    const latitudeKm = (from.latitude - to.latitude) * 111;
    const longitudeKm = (from.longitude - to.longitude) * 101;
    return Math.max(1, Math.round(Math.hypot(latitudeKm, longitudeKm)));
  };
  const recommendationScore = (item: LocalProject) => {
    const itemCity = item.city ?? locationById[item.id]?.city ?? "";
    const itemDistrict = item.district ?? locationById[item.id]?.district ?? "";
    const distance = distanceFromLocation(itemCity, itemDistrict, item.distance ?? locationById[item.id]?.distance ?? 300);
    const cityScore = item.city?.startsWith(selectedCity) ? 35 : 0;
    const distanceScore = Math.max(0, 25 - Math.round(distance / 12));
    const affordabilityScore = points >= item.points ? 20 : 0;
    const proofScore = item.proof ? 12 : 0;
    const impactScore = item.impact ? 8 : 0;
    return cityScore + distanceScore + affordabilityScore + proofScore + impactScore;
  };
  const nearbyProjects = [...projects].sort((a, b) => recommendationScore(b) - recommendationScore(a) || (a.distance ?? 300) - (b.distance ?? 300));
  const nearbyOpportunities = [
    ...localActions.map((item) => ({ ...item, kind: "action" as const, provider: item.organizer, actualDistance: distanceFromLocation(item.city, item.district, item.distance) })),
    ...merchantOffers.map((item) => ({ ...item, kind: "offer" as const, provider: item.merchant, actualDistance: distanceFromLocation(item.city, item.district, item.distance) })),
  ].sort((a, b) => a.actualDistance - b.actualDistance || a.title.localeCompare(b.title, "zh-Hant"));
  const renderProject = (item: LocalProject) => {
    const done = item.kind === "support" ? supportedIds.includes(item.id) : redeemedIds.includes(item.id);
    const supportUnavailable = item.kind === "support" && Boolean(item.status) && item.status !== "funding" && !done;
    const supportStatusLabel = item.status === "review" ? "專案審核中" : item.status === "completed" ? "專案已完成" : "專案已下架";
    const projectCity = item.city ?? locationById[item.id]?.city ?? "其他縣市";
    const projectDistrict = item.district ?? locationById[item.id]?.district ?? "合作地區";
    const location = { city: projectCity, district: projectDistrict, distance: distanceFromLocation(projectCity, projectDistrict, item.distance ?? locationById[item.id]?.distance ?? 300) };
    return (
      <Project
        key={item.id}
        image={item.image}
        title={item.title}
        note={`${location.city}｜${location.district}｜距離你約 ${location.distance} 公里｜推薦分數 ${recommendationScore(item)}｜${item.proof ? `驗證：${item.proof}｜` : ""}${done ? (item.kind === "support" ? `已支持 ${item.points} 點，可查看影響力收據` : "兌換完成，可查看訂單進度") : supportUnavailable ? `${supportStatusLabel}｜${item.note}` : item.note}`}
        progress={item.progress}
        button={done ? (item.kind === "support" ? "查看成果" : "查看狀態") : supportUnavailable ? supportStatusLabel : item.kind === "support" ? `支持 ${item.points} 點` : `兌換 ${item.points} 點`}
        onClick={() => onProject(item.id)}
        onLearnMore={() => onLearnMore(item.id)}
        gold={item.kind === "redeem"}
      />
    );
  };

  return (
    <div className="dashboard-grid">
      <section className="local-support-banner span-12">
        <div className="location-control">
          <div className="location-picker-head"><div><span><Home /></span><div><small>您的所在地</small><strong>{activeLocationCity}{activeLocationDistrict}</strong></div></div><em>用於附近小農與距離排序</em></div>
          <div className="location-picker-fields">
            <label>縣市<select value={draftCity} onChange={(event) => { const city = event.target.value; setDraftCity(city); setDraftDistrict(taiwanLocationOptions[city][0]); setLocationStatus(""); }}>{Object.keys(taiwanLocationOptions).map((city) => <option value={city} key={city}>{city}</option>)}</select></label>
            <label>行政區<select value={draftDistrict} onChange={(event) => { setDraftDistrict(event.target.value); setLocationStatus(""); }}>{taiwanLocationOptions[draftCity].map((district) => <option value={district} key={district}>{district}</option>)}</select></label>
            <button type="button" className="location-detect-button" onClick={detectCurrentLocation} disabled={locating}><RefreshCcw />{locating ? "定位中…" : "使用目前定位"}</button>
            <button type="button" className="location-confirm-button" onClick={() => { onLocation(draftCity, draftDistrict); setLocationStatus(`已套用${draftCity}${draftDistrict}，推薦排序正在更新。`); }} disabled={draftCity === activeLocationCity && draftDistrict === activeLocationDistrict}><Check />確認套用</button>
          </div>
          {locationStatus && <p className="location-status" role="status">{locationStatus}</p>}
        </div>
        <div className="local-points"><span>目前可用綠點</span><strong>{points.toLocaleString()} <small>點</small></strong></div>
        <div className="local-support-path"><span><Home /></span><div><b>您的所在地：{activeLocationCity}{activeLocationDistrict}</b><small>已依距離優先排列附近小農，可隨時切換地區</small></div></div>
        <div className="local-support-path"><span><HeartHandshake /></span><div><b>先在地、再擴散</b><small>支持改善專案或兌換農產，綠點直接回到地方</small></div></div>
      </section>

      {(localActions.length > 0 || merchantOffers.length > 0) && (
        <Panel className="span-12 local-actions-panel" title="所在地附近的綠色行動與優惠" note="依距離由近到遠排列；活動可直接報名，店家優惠可開啟詳細地點">
          <div className="local-action-grid">
            {nearbyOpportunities.map((item) => {
              const registered = item.kind === "action" && registeredActionIds.includes(item.id);
              return <article key={`${item.kind}-${item.id}`} className="local-action-card"><div><span className="eyebrow">{item.kind === "action" ? "綠色行動" : "合作優惠"}・{item.city}{item.district}・距離你約 {item.actualDistance} 公里</span><h3>{item.title}</h3>{item.kind === "action" && <span className="local-action-time"><CalendarDays />活動時間：{formatActivitySchedule(item.eventStart, item.eventEnd)}</span>}<p>{item.description}</p><div className="local-action-detail"><b>{item.provider}</b><span><MapPin />{item.address}</span><small>{item.details}</small>{item.kind === "action" && <em>完成活動後可申請 +{item.rewardPoints} 綠點</em>}</div></div><button className={`button ${item.kind === "action" ? "button-primary" : "button-secondary"}`} disabled={registered} onClick={() => item.kind === "action" ? onRegister(item.id) : onVisit(item.address, item.title)}>{item.kind === "action" ? registered ? "已完成報名" : "填寫資料並報名" : "前往優惠地點"}</button></article>;
            })}
          </div>
        </Panel>
      )}

      <Panel className="span-12 local-project-panel" title="你附近的小農改善專案" note="依所在地距離優先排序，並揭露農產履歷、用途與預期成果">
        <div className="project-list project-list-expanded">{nearbyProjects.filter((item) => item.kind === "support").map(renderProject)}</div>
      </Panel>

      <Panel className="span-12 local-project-panel" title="你附近的小農好物" note="使用綠點兌換可追溯農產，直接形成在地訂單">
        <div className="project-list project-list-expanded">{nearbyProjects.filter((item) => item.kind === "redeem").map(renderProject)}</div>
      </Panel>
    </div>
  );
}

function formatShipmentTime(value: string) {
  if (!value) return "尚未完成";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-TW", { hour12: false });
}

function FarmerContentCenter({ story, news, busy, onUpload, onSaveStory, onSaveNews }: {
  story: FarmerStory | null;
  news: FarmerNews[];
  busy: boolean;
  onUpload: (file: File, mediaKind: "story" | "news") => Promise<{ fileKey: string; imageUrl: string } | null>;
  onSaveStory: (values: Record<string, unknown>) => Promise<boolean>;
  onSaveNews: (values: Record<string, unknown>) => Promise<boolean>;
}) {
  const [storyDraft, setStoryDraft] = useState({ headline: story?.headline ?? "", summary: story?.summary ?? "", body: story?.body ?? "", quote: story?.quote ?? "", imageKey: story?.imageKey ?? "", image: story?.image ?? "" });
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [newsDraft, setNewsDraft] = useState({ id: "", title: "", content: "", category: "農場近況", imageKey: "", image: "" });
  const [newsFile, setNewsFile] = useState<File | null>(null);

  async function uploadSelected(kind: "story" | "news") {
    const file = kind === "story" ? storyFile : newsFile;
    if (!file) return;
    const uploaded = await onUpload(file, kind);
    if (!uploaded) return;
    if (kind === "story") {
      setStoryDraft((current) => ({ ...current, imageKey: uploaded.fileKey, image: uploaded.imageUrl }));
      setStoryFile(null);
    } else {
      setNewsDraft((current) => ({ ...current, imageKey: uploaded.fileKey, image: uploaded.imageUrl }));
      setNewsFile(null);
    }
  }

  function editNews(item: FarmerNews) {
    setNewsDraft({ id: item.id, title: item.title, content: item.content, category: item.category, imageKey: item.imageKey, image: item.image });
    document.querySelector("#farmer-news-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetNews() {
    setNewsDraft({ id: "", title: "", content: "", category: "農場近況", imageKey: "", image: "" });
    setNewsFile(null);
  }

  return <div className="farmer-content-center">
    <section className="content-editor-card">
      <header><div><span className="eyebrow">農場主頁</span><h2>編輯我的農場故事</h2><p>發布後會顯示在公開首頁，讓消費者認識你的耕作理念與產地。</p></div><span className={`content-status ${story?.status ?? "draft"}`}>{story?.status === "published" ? "已發布" : "草稿"}</span></header>
      <form onSubmit={(event) => { event.preventDefault(); const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "draft"; void onSaveStory({ ...storyDraft, status }); }}>
        <div className="content-editor-layout">
          <div className="content-editor-fields">
            <label>故事標題<input value={storyDraft.headline} maxLength={100} onChange={(event) => setStoryDraft({ ...storyDraft, headline: event.target.value })} placeholder="例如：從一塊田開始的友善改變" required /></label>
            <label>首頁摘要<textarea rows={3} value={storyDraft.summary} maxLength={240} onChange={(event) => setStoryDraft({ ...storyDraft, summary: event.target.value })} placeholder="用兩到三句話介紹農場與耕作特色" required /></label>
            <label>完整故事<textarea rows={8} value={storyDraft.body} maxLength={5000} onChange={(event) => setStoryDraft({ ...storyDraft, body: event.target.value })} placeholder="分享開始耕作的原因、友善方法、遇到的挑戰與想帶來的改變" required /></label>
            <label>小農的一句話<input value={storyDraft.quote} maxLength={300} onChange={(event) => setStoryDraft({ ...storyDraft, quote: event.target.value })} placeholder="可選填一段最想對消費者說的話" /></label>
          </div>
          <div className="content-image-editor">
            <div className="content-image-preview">{storyDraft.image ? <img src={storyDraft.image} alt="農場故事封面預覽" /> : <span><Upload /><b>尚未設定封面</b></span>}</div>
            <label className="content-file-picker"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setStoryFile(event.target.files?.[0] ?? null)} /><span>{storyFile ? storyFile.name : "選擇 JPG、PNG 或 WebP 圖片"}</span></label>
            <button type="button" className="button button-secondary" disabled={!storyFile || busy} onClick={() => void uploadSelected("story")}>{busy ? "上傳中…" : "上傳故事封面"}<Upload /></button>
          </div>
        </div>
        <div className="content-editor-actions"><button type="submit" name="status" value="draft" className="button button-secondary" disabled={busy}>儲存草稿</button><button type="submit" name="status" value="published" className="button button-primary" disabled={busy}>發布到首頁<ArrowRight /></button></div>
      </form>
    </section>

    <section className="content-editor-card" id="farmer-news-editor">
      <header><div><span className="eyebrow">消息推播</span><h2>{newsDraft.id ? "編輯最新消息" : "發布最新消息"}</h2><p>已發布內容會顯示在首頁，也會推播給曾購買商品或支持專案的消費者。</p></div>{newsDraft.id && <button type="button" className="button button-ghost" onClick={resetNews}>新增另一則</button>}</header>
      <form onSubmit={(event) => { event.preventDefault(); const status = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value ?? "draft"; void onSaveNews({ ...newsDraft, status }).then((saved) => saved && resetNews()); }}>
        <div className="content-editor-layout">
          <div className="content-editor-fields">
            <label>消息分類<select value={newsDraft.category} onChange={(event) => setNewsDraft({ ...newsDraft, category: event.target.value })}><option>農場近況</option><option>採收與出貨</option><option>改善專案進度</option><option>產地公告</option><option>活動邀請</option></select></label>
            <label>消息標題<input value={newsDraft.title} maxLength={120} onChange={(event) => setNewsDraft({ ...newsDraft, title: event.target.value })} placeholder="例如：本週葉菜箱開始採收" required /></label>
            <label>消息內容<textarea rows={6} value={newsDraft.content} maxLength={2000} onChange={(event) => setNewsDraft({ ...newsDraft, content: event.target.value })} placeholder="說明採收、出貨、計畫成果或農場活動的最新進度" required /></label>
          </div>
          <div className="content-image-editor">
            <div className="content-image-preview compact">{newsDraft.image ? <img src={newsDraft.image} alt="最新消息圖片預覽" /> : <span><Newspaper /><b>圖片可選填</b></span>}</div>
            <label className="content-file-picker"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewsFile(event.target.files?.[0] ?? null)} /><span>{newsFile ? newsFile.name : "選擇消息圖片"}</span></label>
            <button type="button" className="button button-secondary" disabled={!newsFile || busy} onClick={() => void uploadSelected("news")}>{busy ? "上傳中…" : "上傳消息圖片"}<Upload /></button>
          </div>
        </div>
        <div className="content-editor-actions"><button type="submit" value="draft" className="button button-secondary" disabled={busy}>儲存草稿</button><button type="submit" value="published" className="button button-primary" disabled={busy}>{newsDraft.id ? "更新並發布" : "發布最新消息"}<ArrowRight /></button></div>
      </form>
    </section>

    <section className="content-editor-card farmer-news-manager"><header><div><span className="eyebrow">發布紀錄</span><h2>我的最新消息</h2><p>草稿不會出現在首頁或消費者頁面；可隨時編輯後再發布。</p></div><b>{news.length} 則</b></header>
      {news.length === 0 ? <div className="farmer-news-empty"><Newspaper /><p>尚未建立消息，請從上方新增第一則產地近況。</p></div> : <div className="farmer-news-manage-list">{news.map((item) => <article className={item.image ? "" : "no-image"} key={item.id}>{item.image && <img src={item.image} alt="" />}<div><span className={`content-status ${item.status}`}>{item.status === "published" ? "已發布" : "草稿"}</span><small>{item.category}・{formatPublishedAt(item.publishedAt || item.updatedAt)}</small><h3>{item.title}</h3><p>{item.content}</p></div><div className="farmer-news-manage-actions"><button type="button" className="button button-secondary" onClick={() => editNews(item)}>編輯</button><button type="button" className="button button-ghost" disabled={busy} onClick={() => void onSaveNews({ ...item, status: item.status === "published" ? "draft" : "published" })}>{item.status === "published" ? "下架" : "發布"}</button></div></article>)}</div>}
    </section>
  </div>;
}

function FarmerProductsPage({ products, orders, changeRequests, onAdd, onEdit, onAdvanceOrder, onReviewChange }: { products: FarmerProduct[]; orders: BackendSnapshot["orders"]; changeRequests: BackendSnapshot["changeRequests"]; onAdd: () => void; onEdit: (id: string) => void; onAdvanceOrder: (values: { orderId: string; carrier?: string; trackingNumber?: string; fulfillmentNote?: string }) => Promise<boolean>; onReviewChange: (requestId: string, decision: "approved" | "rejected") => void }) {
  const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
  const orderChangeRequests = changeRequests.filter((request) => request.requestType === "order");
  const [shipmentDrafts, setShipmentDrafts] = useState<Record<string, { carrier: string; trackingNumber: string; fulfillmentNote: string }>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [selectedShipmentOrderId, setSelectedShipmentOrderId] = useState("");
  const selectedShipmentOrder = orders.find((order) => order.id === selectedShipmentOrderId) ?? orders.find((order) => order.stage < 3) ?? orders[0];

  function getShipmentDraft(order: BackendSnapshot["orders"][number]) {
    return shipmentDrafts[order.id] ?? {
      carrier: order.carrier || "黑貓宅急便",
      trackingNumber: order.trackingNumber || "",
      fulfillmentNote: order.fulfillmentNote || "",
    };
  }

  function updateShipmentDraft(order: BackendSnapshot["orders"][number], field: "carrier" | "trackingNumber" | "fulfillmentNote", value: string) {
    const draft = getShipmentDraft(order);
    setShipmentDrafts((current) => ({ ...current, [order.id]: { ...draft, [field]: value } }));
  }

  async function advanceShipment(order: BackendSnapshot["orders"][number]) {
    const draft = getShipmentDraft(order);
    setUpdatingOrderId(order.id);
    try {
      await onAdvanceOrder({ orderId: order.id, ...draft });
    } finally {
      setUpdatingOrderId("");
    }
  }

  function openShipmentWorkspace(orderId: string) {
    setSelectedShipmentOrderId(orderId);
    window.setTimeout(() => {
      const workspace = document.getElementById("shipment-progress-editor");
      workspace?.scrollIntoView({ behavior: "smooth", block: "start" });
      workspace?.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <div className="dashboard-grid">
      <div className="metrics span-12"><Metric icon={ShoppingBasket} value={`${products.length} 款`} label="已上架商品" delta="可立即編輯" /><Metric icon={PackageCheck} value={`${totalStock} 件`} label="可售庫存" delta="即時更新" /><Metric icon={HandCoins} value="3,680 點" label="本月收到支持" delta="+18%" /><Metric icon={FileCheck2} value="92%" label="履歷完整度" delta="待補 1 項" /></div>
      <Panel className="span-12 subpage-primary" title="商品數量與點數" note="由小農自行管理商品兌換綠點、庫存數量與上架內容" action={<button className="button button-primary" onClick={onAdd}><ShoppingBasket />上架新商品</button>}>
        <div className="project-list project-list-expanded">{products.map((item) => <Project key={item.id} image={item.image} title={item.title} note={`${item.points.toLocaleString()} 綠點・${item.proof}・庫存 ${item.stock} ${item.unit}`} progress={100} button="編輯點數與庫存" onClick={() => onEdit(item.id)} onLearnMore={() => onEdit(item.id)} gold />)}</div>
      </Panel>
      <Panel className="span-12 shipment-management-panel" title="待處理訂單與出貨回報" note="選擇訂單後，可直接回報備貨、交寄與配送完成進度；每一步都會留下時間紀錄">
        <div className="table-wrap"><table className="mobile-card-table orders-table"><thead><tr><th>訂單</th><th>商品</th><th>兌換數量</th><th>配送地區</th><th>狀態</th><th>修改申請</th><th>進度回報</th></tr></thead><tbody>{orders.length > 0 ? orders.map((order) => { const request = orderChangeRequests.find((item) => item.targetId === order.id); const selected = order.id === selectedShipmentOrder?.id; return <tr className={selected ? "selected-order-row" : ""} key={order.id}><td><b>{order.id}</b></td><td>{order.title}</td><td>{order.quantity} 件</td><td>{order.shippingCity}{order.shippingDistrict}</td><td><span className={`status-pill ${order.stage === 0 ? "waiting" : ""}`}>{["訂單成立", "備貨中", "配送中", "已完成"][order.stage] ?? order.status}</span></td><td>{request ? <span className={`status-pill ${request.status === "pending" ? "waiting" : ""}`}>{request.status === "pending" ? "待確認" : request.status === "approved" ? "已核准" : "已退回"}</span> : "—"}</td><td><button type="button" className={`button ${selected ? "button-primary" : "button-secondary"} order-progress-button`} aria-label={`開啟 ${order.id} 的出貨進度回報`} onClick={() => openShipmentWorkspace(order.id)}>{order.stage === 0 ? "填寫處理進度" : order.stage === 1 ? "填寫出貨資料" : order.stage === 2 ? "回報配送完成" : "查看完整紀錄"}</button></td></tr>; }) : <tr><td colSpan={7}>目前沒有待處理訂單；消費者完成商品兌換後會即時出現在這裡。</td></tr>}</tbody></table></div>
        {!selectedShipmentOrder ? <div className="empty-receipt"><span><Truck /></span><h3>目前沒有需要出貨的訂單</h3><p>消費者完成商品兌換後，訂單會自動進入這個工作區。</p></div> : (() => {
          const order = selectedShipmentOrder;
          const stage = Math.min(3, order.stage);
          const draft = getShipmentDraft(order);
          const pendingChange = orderChangeRequests.find((request) => request.targetId === order.id && request.status === "pending");
          const timestamps = [order.createdAt, order.packedAt, order.shippedAt, order.completedAt];
          const actionLabel = stage === 0 ? "回報：開始備貨" : stage === 1 ? "回報：已交寄並開始配送" : stage === 2 ? "回報：配送已完成" : "訂單已完成";
          const missingShipmentFields = stage === 1 && (!draft.carrier.trim() || !draft.trackingNumber.trim());
          return <div className="selected-shipment-workspace" id="shipment-progress-editor" tabIndex={-1}><div className="shipment-workspace-label"><Truck /><span><b>目前處理中的訂單</b><small>請確認資料後回報最新進度</small></span></div><article className="shipment-order-card" key={order.id}>
            <header><div><small>{order.id}</small><h3>{order.title} × {order.quantity}</h3><p>{order.recipientName}・{order.shippingCity}{order.shippingDistrict}{order.shippingAddress}</p></div><span className={`status-pill ${stage < 2 ? "waiting" : ""}`}>{orderSteps[stage].title}</span></header>
            <div className="shipment-timeline">{orderSteps.map((step, index) => <div key={step.title} className={index < stage ? "done" : index === stage ? "active" : ""}><span>{index < stage ? <Check /> : index + 1}</span><p><b>{step.title}</b><time>{formatShipmentTime(timestamps[index])}</time></p></div>)}</div>
            <div className="shipment-fields">
              <label>物流商<input disabled={stage !== 1} value={draft.carrier} onChange={(event) => updateShipmentDraft(order, "carrier", event.target.value)} placeholder="例如：黑貓宅急便" /></label>
              <label>物流追蹤單號<input disabled={stage !== 1} value={draft.trackingNumber} onChange={(event) => updateShipmentDraft(order, "trackingNumber", event.target.value)} placeholder={stage < 1 ? "開始備貨後填寫" : "交寄前必填"} /></label>
              <label className="shipment-note">處理／出貨備註<textarea rows={2} disabled={stage >= 3} value={draft.fulfillmentNote} onChange={(event) => updateShipmentDraft(order, "fulfillmentNote", event.target.value)} placeholder="例如：完成採收與低溫包裝，預計今日交寄" /></label>
            </div>
            {(order.carrier || order.trackingNumber) && <div className="shipment-tracking-summary"><Truck /><span><small>目前物流資訊</small><b>{order.carrier || "物流商待確認"}・{order.trackingNumber || "單號待確認"}</b></span></div>}
            {pendingChange && <div className="change-request-status pending"><b>消費者修改申請待處理</b><span>請先核准或退回申請，再更新出貨進度。</span></div>}
            <div className="shipment-actions"><small>{missingShipmentFields ? "回報出貨前，請完整填寫物流商與追蹤單號" : stage < 3 ? `送出後會記錄「${orderSteps[stage + 1].title}」的回報時間` : `完成時間：${formatShipmentTime(order.completedAt)}`}</small><button className="button button-primary" disabled={stage >= 3 || Boolean(pendingChange) || missingShipmentFields || updatingOrderId === order.id} onClick={() => void advanceShipment(order)}>{updatingOrderId === order.id ? "正在回報…" : actionLabel}<ArrowRight /></button></div>
          </article></div>;
        })()}
      </Panel>
      {orderChangeRequests.some((request) => request.status === "pending") && <Panel className="span-12" title="消費者訂單修改申請" note="核准後才會套用新收件資料；退回時保留原訂單內容"><div className="change-review-list">{orderChangeRequests.filter((request) => request.status === "pending").map((request) => { const order = orders.find((item) => item.id === request.targetId); return <article key={request.id}><header><div><small>{request.id}</small><h3>{order?.title ?? request.targetId}</h3><p>{request.reasonDetail}</p></div><span className="status-pill waiting">待確認</span></header><div className="receipt-box"><Row label="新收件人" value={`${request.requested.recipientName ?? ""}・${request.requested.recipientPhone ?? ""}`} /><Row label="新配送地址" value={`${request.requested.postalCode ?? ""} ${request.requested.shippingCity ?? ""}${request.requested.shippingDistrict ?? ""}${request.requested.shippingAddress ?? ""}`} /><Row label="新配送備註" value={request.requested.deliveryNote || "無"} /></div><div className="resource-redemption-actions"><button className="button button-secondary" onClick={() => onReviewChange(request.id, "rejected")}>退回申請</button><button className="button button-primary" onClick={() => onReviewChange(request.id, "approved")}><Check />核准並套用</button></div></article>; })}</div></Panel>}
    </div>
  );
}

function FarmerProjectsPage({
  projects,
  onCreate,
  onPreview,
  onOutcome,
}: {
  projects: LocalProject[];
  onCreate: () => void;
  onPreview: (id: string) => void;
  onOutcome: (id: string) => void;
}) {
  const projectStats = projects.map((project) => {
    const target = project.targetPoints ?? 68000;
    const raised = project.raisedPoints ?? Math.round(target * project.progress / 100);
    return { project, target, raised, supporters: project.supporters ?? 86 };
  });
  const totalTarget = projectStats.reduce((sum, item) => sum + item.target, 0);
  const totalRaised = projectStats.reduce((sum, item) => sum + item.raised, 0);
  const totalSupporters = projectStats.reduce((sum, item) => sum + item.supporters, 0);

  return (
    <div className="dashboard-grid">
      <div className="metrics span-12"><Metric icon={HeartHandshake} value={`${projects.length} 項`} label="公開改善專案" delta={projects.length ? "消費者可支持" : "尚未建立"} /><Metric icon={HandCoins} value={`${totalRaised.toLocaleString()} 點`} label="目前募集綠點" delta={`目標 ${totalTarget.toLocaleString()} 點`} /><Metric icon={Users} value={`${totalSupporters} 人`} label="支持人數" delta="每筆皆可追溯" /><Metric icon={FileCheck2} value={projects.length ? "100%" : "0%"} label="專案資料完整度" delta={projects.length ? "可公開募資" : "建立專案後計算"} /></div>
      <Panel className="span-12 subpage-primary" title="小農改善專案" note="由小農說明田間問題、預期成果與綠點用途，公開向消費者募集改善資源" action={<button className="button button-primary" onClick={onCreate}><HeartHandshake />建立改善專案</button>}>
        {projectStats.length === 0 ? <div className="empty-receipt"><span><HeartHandshake /></span><h3>尚未建立改善專案</h3><p>按下「建立改善專案」，填寫田間問題、綠點用途與預期成果。</p></div> : <div className="farmer-project-grid">
          {projectStats.map(({ project, target, raised, supporters }) => (
            <article className="farmer-project-card" key={project.id}>
              <button className="button button-primary outcome-button" onClick={() => onOutcome(project.id)}><FileCheck2 />提交成果回報</button>
              <header><span>{project.id.startsWith("farmer-project-") ? "剛建立・公開募集中" : "公開募集中"}</span><h3>{project.title.split("｜").at(-1)}</h3><p>{project.note}</p></header>
              <div className="farmer-project-progress"><div><span>已募集</span><strong>{raised.toLocaleString()} <small>／ {target.toLocaleString()} 點</small></strong></div><b>{project.progress}%</b></div>
              <div className="progress"><span style={{ width: `${project.progress}%` }} /></div>
              <div className="farmer-project-facts"><span><small>每次支持</small><b>{project.points.toLocaleString()} 點</b></span><span><small>支持人數</small><b>{supporters} 人</b></span><span><small>預期成果</small><b>{project.impact}</b></span></div>
              <div className="farmer-project-allocation"><small>綠點如何支持產地</small><p>{(project.allocations ?? [{ label: "設備與材料", percent: 55 }, { label: "施工與改善", percent: 30 }, { label: "成果追蹤", percent: 15 }]).map((item) => `${item.label} ${item.percent}%`).join("・")}</p></div>
              <button className="button button-secondary button-block" onClick={() => onPreview(project.id)}>預覽消費者募資頁<ArrowRight /></button>
            </article>
          ))}
        </div>}
      </Panel>
      <Panel className="span-12" title="公開前檢查" note="資料越完整，越容易讓消費者理解支持目的">
        <div className="project-publish-checks"><Evidence title="田間問題與改善方式" note="清楚說明現在遇到的問題" done={projects.length > 0} /><Evidence title="綠點使用比例" note="揭露設備、執行與成果追蹤用途" done={projects.length > 0} /><Evidence title="預期成果與完成時間" note="讓支持者可以追蹤後續進度" done={projects.length > 0} /><Evidence title="產銷履歷或無農藥資料" note="建立可信的專案基礎" done={false} /></div>
      </Panel>
    </div>
  );
}

function FarmerDashboard({
  farmerPoints,
  products,
  orders,
  records,
  projects,
  onEvidence,
  onProducts,
  onProjects,
  onBenefits,
}: {
  farmerPoints: number;
  products: FarmerProduct[];
  orders: BackendSnapshot["orders"];
  records: BackendSnapshot["evidence"];
  projects: LocalProject[];
  onEvidence: () => void;
  onProducts: () => void;
  onProjects: () => void;
  onBenefits: () => void;
}) {
  const availableBenefits = farmerBenefits.filter((benefit) => farmerPoints >= benefit.requiredScore);
  const pendingOrders = orders.filter((order) => order.stage < 3);
  const evidenceCount = new Set(records.map((record) => record.evidenceType)).size;
  const evidencePercent = Math.min(100, Math.round((evidenceCount / 7) * 100));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyOrders = orders.filter((order) => order.createdAt.slice(0, 7) === currentMonth).length;
  return (
    <>
      <div className="metrics">
        <Metric icon={HandCoins} value={`${farmerPoints.toLocaleString()} 點`} label="小農綠點餘額" delta="可於農會運用" />
        <Metric icon={ShoppingBasket} value={`${products.length} 款`} label="商品數量" delta={`${pendingOrders.length} 筆待處理訂單`} />
        <Metric icon={FileCheck2} value={`${evidencePercent}%`} label="GreenFin 資料準備度" delta="進入數位履歷查看正式 Data Health" />
        <Metric icon={PackageCheck} value={`${availableBenefits.length} 項`} label="可兌換農業資源" delta="依綠點餘額" />
      </div>
      <div className="dashboard-grid">
        <Panel className="span-7" title="商品與消費者支持" note="附近消費者可透過綠點兌換，支持直接累積到小農帳戶">
          <div className="score-panel"><div className="score-ring" style={{ "--score": `${Math.min(100, monthlyOrders * 10)}%` } as React.CSSProperties}><span><strong>{monthlyOrders}</strong><small>本月訂單</small></span></div><div><h3>{products.length ? "商品已進入在地推薦" : "先建立第一項小農商品"}</h3><p>{projects.length ? `目前另有 ${projects.length} 項改善專案。` : "商品綁定產銷履歷與無農藥檢測後，會優先顯示可信標章與配送距離。"}</p><div className="farmer-dashboard-actions"><button className="button button-primary" onClick={onProjects}><HeartHandshake />管理改善專案</button><button className="button button-secondary" onClick={onProducts}><ShoppingBasket />商品管理</button></div></div></div>
        </Panel>
        <Panel className="span-5" title="GreenFin 數位履歷" note="用可追溯證據建立授信補充資訊">
          <div className="evidence-list"><Evidence title="文件與 SIMULATED OCR" note="上傳後先人工確認欄位" done={evidenceCount > 0} /><Evidence title="來源核驗與異常" note="V0–V3 並保留覆核佇列" done={false} /><Evidence title="三類獨立結果" note="經驗值、四大指標、Data Health" done={false} /></div>
          <button className="button button-secondary button-block" onClick={onEvidence}><FileCheck2 />開啟 GreenFin</button>
        </Panel>
        <Panel className="span-12" title="農會農業資源兌換" note="把消費者支持轉成土壤檢測、農具、輔導與補助資源" action={<button className="button button-primary" onClick={onBenefits}>查看全部資源<ArrowRight /></button>}>
          <div className="funding-unlock-summary"><div className="funding-current"><span><HandCoins /></span><div><small>目前可用</small><strong>{farmerPoints.toLocaleString()} 點</strong><p>可兌換 {availableBenefits.length}／{farmerBenefits.length} 項資源</p></div></div><div className="funding-next complete"><b>綠點來源透明</b><small>消費者兌換、直接支持與企業配對均可追溯。</small></div></div>
        </Panel>
      </div>
    </>
  );
}

function InstitutionDashboard({
  programs,
  procurements,
  resourceRedemptions,
  outcomes,
  onDetail,
  onDownload,
}: {
  programs: IncentiveProgram[];
  procurements: BackendSnapshot["procurements"];
  resourceRedemptions: BackendSnapshot["resourceRedemptions"];
  outcomes: BackendSnapshot["outcomeReports"];
  onDetail: (name?: string) => void;
  onDownload: () => void;
}) {
  const totalBudget = programs.reduce((sum, program) => sum + program.budgetPoints, 0);
  const participants = programs.reduce((sum, program) => sum + Number(program.participants.replace(/[^0-9]/g, "") || 0), 0);
  const verifiedOutcomes = outcomes.filter((outcome) => outcome.status === "verified");
  const carbonKg = verifiedOutcomes.reduce((sum, outcome) => sum + Number(outcome.carbonKg ?? 0), 0);
  const chartData = programs.length ? programs.map((program) => ({ name: program.name, funds: program.budgetPoints })) : [{ name: "尚無計畫", funds: 0 }];
  return (
    <>
      <div className="metrics">
        <Metric icon={HandCoins} value={`${totalBudget.toLocaleString()} 點`} label="計畫綠點預算" delta={`${programs.length} 項計畫`} />
        <Metric icon={Users} value={participants.toLocaleString()} label="計畫參與人次" delta="依帳戶計畫累計" />
        <Metric icon={ShoppingBasket} value={`${procurements.length} 筆`} label="永續採購需求" delta="本帳戶建立" />
        <Metric icon={Trees} value={`${(carbonKg / 1000).toLocaleString()} 噸`} label="已驗證減碳成果" delta={`${verifiedOutcomes.length} 筆成果`} />
      </div>
      <div className="dashboard-grid">
        <Panel className="span-8" title="本帳戶綠點激勵計畫" note="只顯示目前登入單位建立的計畫與預算">
          <Chart><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="funds" name="計畫預算" fill="#2d7250" radius={[8, 8, 0, 0]} /></BarChart></Chart>
        </Panel>
        <Panel className="span-4" title="帳戶履約概況" note="農業資源兌換與成果審核">
          <div className="report-highlights"><div><span><Truck /></span><p><b>{resourceRedemptions.length} 筆資源兌換</b><small>{resourceRedemptions.filter((item) => item.stage < 3).length} 筆處理中</small></p></div><div><span><FileCheck2 /></span><p><b>{outcomes.length} 筆成果回報</b><small>{outcomes.filter((item) => item.status === "submitted").length} 筆待審核</small></p></div></div>
        </Panel>
        <Panel className="span-12" title="帳戶資料摘要" note="所有數量均依目前登入單位的 D1 資料計算" action={<div className="panel-actions"><button className="button button-secondary" onClick={() => onDetail()}><PackageCheck />管理激勵計畫</button><button className="button button-secondary" onClick={onDownload}><Download />查看成果報告</button></div>}>
          {programs.length === 0 && procurements.length === 0 ? <div className="empty-receipt"><span><Building2 /></span><h3>這個帳戶尚未建立計畫或採購需求</h3><p>前往「綠點激勵計畫」建立第一筆專屬資料。</p></div> : <div className="table-wrap"><table className="mobile-card-table farmers-table"><thead><tr><th>類型</th><th>名稱</th><th>預算／數量</th><th>狀態</th></tr></thead><tbody>{programs.map((program) => <tr key={program.id}><td>激勵計畫</td><td><b>{program.name}</b></td><td>{program.budgetPoints.toLocaleString()} 點</td><td>{program.progress}%</td></tr>)}{procurements.map((item) => <tr key={item.id}><td>採購需求</td><td><b>{item.title}</b></td><td>{item.quantity.toLocaleString()} 份</td><td>{item.status}</td></tr>)}</tbody></table></div>}
        </Panel>
      </div>
    </>
  );
}

type InvoiceEntryMethod = "manual" | "scan";
type InvoiceScanType = "electronic" | "traditional";

function InvoiceEntryContent({ onVerify }: { onVerify: (input: InvoiceVerificationInput) => void }) {
  const [method, setMethod] = useState<InvoiceEntryMethod>("manual");
  const [scanType, setScanType] = useState<InvoiceScanType>("electronic");
  const [scanReady, setScanReady] = useState(false);

  function selectScanType(type: InvoiceScanType) {
    setScanType(type);
    setScanReady(false);
  }

  return (
    <>
      <div className="invoice-entry-tabs" role="tablist" aria-label="發票登錄方式">
        <button type="button" className={method === "manual" ? "active" : ""} onClick={() => setMethod("manual")}><Receipt />手動新增</button>
        <button type="button" className={method === "scan" ? "active" : ""} onClick={() => setMethod("scan")}><ScanLine />掃描發票</button>
      </div>

      {method === "manual" ? (
        <form onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const track = String(data.get("track") ?? "").trim().toUpperCase();
          const digits = String(data.get("number") ?? "").trim();
          if (!/^[A-Z]{2}$/.test(track) || !/^\d{8}$/.test(digits)) return;
          onVerify({
            mode: "manual",
            invoiceNumber: `${track}${digits}`,
            amount: Number(data.get("amount")),
            transactionDate: String(data.get("transactionDate") ?? ""),
            randomCode: String(data.get("randomCode") ?? ""),
            note: String(data.get("note") ?? ""),
          });
        }}>
          <div className="invoice-helper"><span><Receipt /></span><div><b>手動新增發票</b><small>依發票內容填寫日期、號碼及消費金額；隨機碼與備註可選填</small></div></div>
          <div className="form-grid invoice-manual-form">
            <label className="full">消費日期<input name="transactionDate" type="date" defaultValue="2026-07-31" required /></label>
            <label className="full">發票號碼
              <span className="invoice-number-fields">
                <input name="track" aria-label="發票英文字軌" defaultValue="AB" maxLength={2} autoCapitalize="characters" pattern="[A-Za-z]{2}" required />
                <b>－</b>
                <input name="number" aria-label="發票八碼號碼" defaultValue="12345678" inputMode="numeric" maxLength={8} pattern="[0-9]{8}" required />
              </span>
            </label>
            <label className="full">消費金額<input name="amount" type="number" defaultValue="680" min="1" max="1000000" inputMode="numeric" required /></label>
            <label className="full">4 碼隨機碼 <small>選填，電子發票可提高查詢完整度</small><input name="randomCode" defaultValue="4827" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} /></label>
            <label className="full">備註 <small>選填，尚無店家名稱時會顯示於紀錄標題</small><textarea name="note" defaultValue="友善蔬菜箱與在地農產" maxLength={50} /></label>
          </div>
          <p className="fine-print">發票資料會先進入平台驗證流程；財政部介接需依正式環境授權設定。</p>
          <div className="subpage-actions"><button className="button button-primary" type="submit"><CheckCircle2 />儲存並驗證</button></div>
        </form>
      ) : (
        <>
          <div className="invoice-helper"><span><ScanLine /></span><div><b>掃描新增發票</b><small>選擇發票類型，再將鏡頭對準發票號碼或 QR Code</small></div></div>
          <div className="scan-type-tabs" role="tablist" aria-label="掃描發票類型">
            <button type="button" className={scanType === "electronic" ? "active" : ""} onClick={() => selectScanType("electronic")}>電子發票</button>
            <button type="button" className={scanType === "traditional" ? "active" : ""} onClick={() => selectScanType("traditional")}>傳統發票</button>
          </div>

          {!scanReady ? (
            <div className="invoice-scanner">
              <div className={`scanner-viewport ${scanType}`}>
                <div className="scanner-beam" />
                <div className="scanner-receipt" aria-hidden="true">
                  <span />
                  <span />
                  {scanType === "electronic" ? <div className="scanner-qr"><i /><i /><i /><i /></div> : <strong>AB12345678</strong>}
                  <span />
                </div>
              </div>
              <div className="scanner-instruction">
                <b>{scanType === "electronic" ? "請將鏡頭對準發票 QR Code" : "請將鏡頭對準發票號碼"}</b>
                <small>{scanType === "electronic" ? "適度調整掃描距離以便相機對焦" : "支援 114–115 年度傳統發票辨識"}</small>
              </div>
              <div className="scan-upload-actions">
                <label className="button button-secondary"><Upload />開啟相機／上傳照片<input type="file" accept="image/*" capture="environment" onChange={() => setScanReady(true)} /></label>
                <button type="button" className="button button-primary" onClick={() => setScanReady(true)}><ScanLine />啟動掃描</button>
              </div>
            </div>
          ) : (
            <div className="scan-result">
              <div className="scan-result-status"><CheckCircle2 /><div><b>掃描完成</b><small>已辨識發票內容，請確認資料後送出</small></div></div>
              <div className="form-grid">
                <label>消費日期<input type="date" defaultValue="2026-07-31" /></label>
                <label>消費金額<input type="number" defaultValue="680" /></label>
                <label className="full">發票號碼<input defaultValue="AB12345678" /></label>
                <label className="full">4 碼隨機碼<input defaultValue="4827" inputMode="numeric" maxLength={4} /></label>
              </div>
              <div className="subpage-actions"><button type="button" className="button button-secondary" onClick={() => setScanReady(false)}>重新掃描</button><button type="button" className="button button-primary" onClick={() => onVerify({ mode: "scan", invoiceNumber: "AB12345678", amount: 680, transactionDate: "2026-07-31", randomCode: "4827" })}><CheckCircle2 />確認並驗證</button></div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function ConsumerInvoicePage({
  stage,
  rewardPoints,
  invoice,
  onVerify,
  onReset,
}: {
  stage: "form" | "scanning" | "success";
  rewardPoints: number;
  invoice: InvoiceVerificationInput | null;
  onVerify: (input: InvoiceVerificationInput) => void;
  onReset: () => void;
}) {
  return (
    <div className="dashboard-grid">
      <Panel className="span-8 subpage-primary" title="新增消費證明" note="可手動填寫完整資料，或使用相機掃描電子／傳統發票">
        {stage === "success" ? (
          <Success title={`驗證完成，獲得 ${rewardPoints} 綠點`} text="這筆友善農產消費已通過平台驗證，綠點已加入你的錢包。">
            {invoice && <div className="receipt-box invoice-verification-summary"><Row label="已送出發票" value={invoice.invoiceNumber} /><Row label="消費日期" value={invoice.transactionDate} /><Row label="消費金額" value={`NT$ ${invoice.amount.toLocaleString()}`} /><Row label="登錄方式" value={invoice.mode === "manual" ? "手動新增" : "掃描發票"} /></div>}
            <button className="button button-primary" onClick={onReset}>再新增一張發票</button>
          </Success>
        ) : stage === "scanning" ? (
          <Success title="正在驗證發票" text="平台正在核對發票日期、號碼、消費金額與綠色消費資格。">
            <div className="progress"><span style={{ width: "76%" }} /></div>
          </Success>
        ) : <InvoiceEntryContent onVerify={onVerify} />}
      </Panel>
      <Panel className="span-4" title="取得綠點流程" note="資料確認後自動加入錢包">
        <div className="subpage-steps"><div><span>1</span><p><b>選擇登錄方式</b><small>手動新增或掃描發票</small></p></div><div><span>2</span><p><b>確認發票資料</b><small>核對日期、號碼與消費金額</small></p></div><div><span>3</span><p><b>資格驗證</b><small>確認符合綠色消費條件</small></p></div><div><span>4</span><p><b>綠點入帳</b><small>支持小農或兌換商品</small></p></div></div>
      </Panel>
    </div>
  );
}

function ImpactReceiptDetail({ item }: { item: LocalProject }) {
  const isRedeem = item.kind === "redeem";
  const impactValue = item.impact.match(/\d+(?:\.\d+)?%?/)?.[0] || "追蹤中";

  return (
    <div className={`impact-receipt ${isRedeem ? "receipt-redeem" : ""}`}>
      <div className="receipt-hero">
        <div><small>{isRedeem ? "GFES PRODUCT IMPACT RECEIPT" : "GFES IMPACT RECEIPT"}</small><h3>{item.points} 綠點，正在地方產生改變</h3><p>{item.title}</p></div>
        <span>{isRedeem ? <ShoppingBasket /> : <Leaf />}</span>
      </div>
      <div className="impact-flow">
        <div><User /><b>你的綠色消費</b></div><ArrowRight /><div><HandCoins /><b>{item.points} 綠點</b></div><ArrowRight /><div>{isRedeem ? <ShoppingBasket /> : <Sprout />}<b>{item.farmer}</b></div>
      </div>
      <div className="receipt-metrics">
        <article><strong>{item.points}</strong><span>使用綠點</span></article>
        <article><strong>100%</strong><span>{isRedeem ? "形成在地訂單" : "投入專案用途"}</span></article>
        <article><strong>{impactValue}</strong><span>{isRedeem ? "產地支持成果" : "預估環境成果"}</span></article>
      </div>
      <div className="receipt-story-grid">
        <section>
          <h4>{isRedeem ? "兌換如何支持產地" : "資源如何被使用"}</h4>
          {(isRedeem
            ? [{ label: "小農商品收入", percent: 60 }, { label: "產地理貨與冷藏", percent: 25 }, { label: "循環包裝與配送", percent: 15 }]
            : item.allocations ?? [{ label: "設備與材料", percent: 55 }, { label: "施工與改善", percent: 30 }, { label: "成果追蹤", percent: 15 }]
          ).map(({ label, percent }) => (
            <div className="allocation" key={label}><span><b>{label}</b><em>{percent}%</em></span><div className="progress"><i style={{ width: `${percent}%` }} /></div></div>
          ))}
        </section>
        <section>
          <h4>{isRedeem ? "訂單與影響里程碑" : "專案里程碑"}</h4>
          <div className="receipt-timeline">
            <div className="done"><span><Check /></span><p><b>{isRedeem ? "商品兌換完成" : "綠點支持完成"}</b><small>2026/07/31</small></p></div>
            <div className="active"><span>2</span><p><b>{isRedeem ? "小農備貨與產地配送" : "採購與改善進行中"}</b><small>{isRedeem ? "可至兌換訂單查看最新進度" : "預計 2026/08 完成"}</small></p></div>
            <div><span>3</span><p><b>{isRedeem ? "地方成果持續累積" : "成果驗證與回報"}</b><small>{isRedeem ? "訂單收入支持下一批友善生產" : "完成後更新成果透明度"}</small></p></div>
          </div>
        </section>
      </div>
      <footer className="receipt-footer"><span>收據編號 {getReceiptNumber(item)}</span><b>每一次消費，都是地方改變的起點。</b></footer>
    </div>
  );
}

function ConsumerReceiptPage({
  items,
  onDownload,
  onExplore,
  onLearnMore,
}: {
  items: LocalProject[];
  onDownload: (item: LocalProject) => void;
  onExplore: () => void;
  onLearnMore: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState(items[items.length - 1]?.id || "");

  if (!items.length) {
    return (
      <div className="dashboard-grid"><Panel className="span-12 subpage-empty" title="尚未產生影響力收據" note="支持改善專案或兌換小農好物後，收據會自動出現在這裡">
        <div className="empty-receipt"><span><FileCheck2 /></span><h3>第一張影響力收據等你完成</h3><p>支持小農改善或兌換任一項小農好物，就能追蹤綠點流向、產地故事與地方成果。</p></div>
        <button className="button button-primary" onClick={onExplore}>前往「用綠點支持在地」</button>
      </Panel></div>
    );
  }

  const activeItem = items.find((item) => item.id === activeId) || items[items.length - 1];
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
  const redeemedCount = items.filter((item) => item.kind === "redeem").length;

  return (
    <div className="dashboard-grid"><Panel className="span-12 receipt-page-panel" title="影響力收據" note={`共 ${items.length} 張・含 ${redeemedCount} 張商品兌換收據・累計使用 ${totalPoints} 綠點`}>
      <div className="receipt-library">
        <div className="receipt-selector" aria-label="小農影響力收據列表">
          {items.map((item) => (
            <article key={item.id} className={`receipt-selector-card ${item.id === activeItem.id ? "active" : ""}`}>
              <button className="receipt-select-main" onClick={() => setActiveId(item.id)}>
                <img src={item.image} alt={item.farmer + (item.kind === "redeem" ? "商品照片" : "專案照片")} />
                <span><small>{item.kind === "redeem" ? "商品兌換" : "改善支持"}・{getReceiptNumber(item)}</small><b>{item.farmer}</b><em>{item.purpose}</em></span>
                <strong>{item.points}<small>綠點</small></strong>
                <ChevronRight />
              </button>
              <button className="receipt-more-button" onClick={() => onLearnMore(item.id)}>了解更多<ArrowRight /></button>
            </article>
          ))}
        </div>
        <section className="receipt-selected">
          <header><div><small>目前查看・{activeItem.kind === "redeem" ? "商品兌換" : "改善支持"}</small><h3>{activeItem.farmer}的影響力收據</h3></div><span>{items.findIndex((item) => item.id === activeItem.id) + 1}／{items.length}</span></header>
          <ImpactReceiptDetail item={activeItem} />
          <button className="button button-secondary receipt-story-button" onClick={() => onLearnMore(activeItem.id)}>了解更多完整故事<ArrowRight /></button>
        </section>
      </div>
      <div className="subpage-actions"><button className="button button-secondary" onClick={onExplore}><HeartHandshake />繼續支持在地</button><button className="button button-primary" onClick={() => onDownload(activeItem)}><Download />下載這張收據</button></div>
    </Panel></div>
  );
}

const orderSteps = [
  { title: "訂單成立", note: "綠點完成扣除，訂單與影響力收據同步建立", icon: PackageCheck },
  { title: "小農備貨", note: "小農依採收批次理貨、品管並完成低溫包裝", icon: Store },
  { title: "產地配送", note: "物流完成收件，可在平台查看配送追蹤資訊", icon: Truck },
  { title: "配送完成", note: "商品送達，這筆在地訂單持續支持友善生產", icon: CheckCircle2 },
] as const;

function ConsumerOrdersPage({
  items,
  orders,
  stages,
  initialId,
  onReceipt,
  onExplore,
  changeRequests,
  onRequestChange,
}: {
  items: LocalProject[];
  orders: BackendSnapshot["orders"];
  stages: Record<string, number>;
  initialId: string;
  onReceipt: () => void;
  onExplore: () => void;
  changeRequests: BackendSnapshot["changeRequests"];
  onRequestChange: (values: Record<string, unknown>) => Promise<boolean>;
}) {
  const [activeId, setActiveId] = useState(initialId);
  const [changeOrder, setChangeOrder] = useState<BackendSnapshot["orders"][number] | null>(null);

  if (!items.length) {
    return (
      <div className="dashboard-grid"><Panel className="span-12 subpage-empty" title="尚未建立兌換訂單" note="兌換任一項小農生產好物後，即可體驗完整配送路徑">
        <div className="empty-receipt"><span><ShoppingBasket /></span><h3>從一份小農好物開始</h3><p>完成兌換後，系統會建立訂單、影響力收據與物流進度。</p></div>
        <button className="button button-primary" onClick={onExplore}>前往兌換小農好物</button>
      </Panel></div>
    );
  }

  const activeItem = items.find((item) => item.id === activeId) || items[items.length - 1];
  const activeOrder = orders.find((order) => order.productId === activeItem.id);
  const stage = Math.min(3, stages[activeItem.id] ?? 0);
  const orderNumber = activeOrder?.id ?? `GFES-ORD-${getReceiptNumber(activeItem).split("-").at(-1)}`;
  const latestChangeRequest = activeOrder ? changeRequests.find((request) => request.requestType === "order" && request.targetId === activeOrder.id) : undefined;

  return (
    <div className="dashboard-grid">
      <Panel className="span-12 order-page-panel" title="兌換小農生產好物訂單" note={`共 ${items.length} 筆訂單・從成立、備貨到配送完成`}>
        <div className="order-layout">
          <div className="order-list" aria-label="兌換訂單列表">
            {items.map((item) => {
              const itemStage = Math.min(3, stages[item.id] ?? 0);
              return (
                <button key={item.id} className={item.id === activeItem.id ? "active" : ""} onClick={() => setActiveId(item.id)}>
                  <img src={item.image} alt={item.title} />
                  <span><small>{itemStage === 3 ? "已送達" : orderSteps[itemStage].title}</small><b>{item.title}</b><em>{item.farmer}</em></span>
                  <ChevronRight />
                </button>
              );
            })}
          </div>
          <section className="order-detail">
            <header>
              <div><small>訂單編號 {orderNumber}</small><h3>{activeItem.title}</h3><p>{activeItem.farmer}</p></div>
              <span className={`status-pill ${stage < 2 ? "waiting" : ""}`}>{stage === 3 ? "配送完成" : orderSteps[stage].title}</span>
            </header>
            <div className="order-product"><img src={activeItem.image} alt={activeItem.title} /><div><small>兌換內容</small><h4>{activeItem.title}</h4><p>{activeItem.note}</p><strong>{activeItem.points} 綠點</strong></div></div>
            <div className="order-meta"><article><small>配送方式</small><b>{activeOrder?.carrier || "產地直送（物流待確認）"}</b></article><article><small>收件資訊</small><b>{activeOrder?.recipientName ?? "林子晴"}・{activeOrder?.shippingCity ?? "台北市"}{activeOrder?.shippingDistrict ?? "大安區"}</b></article><article><small>物流單號</small><b>{activeOrder?.trackingNumber || "待小農交寄"}</b></article></div>
            <section className="package-information"><header><span><MapPin /></span><div><small>包裹配送資料</small><h4>{activeOrder?.recipientName ?? "林子晴"}・{activeOrder?.recipientPhone ?? "0912-345-678"}</h4></div></header><div><p><small>完整地址</small><b>{activeOrder?.postalCode ? `${activeOrder.postalCode} ` : ""}{activeOrder?.shippingCity ?? "台北市"}{activeOrder?.shippingDistrict ?? "大安區"}{activeOrder?.shippingAddress ?? "仁愛路四段示範地址"}</b></p><p><small>配送備註</small><b>{activeOrder?.deliveryNote || "無特別備註"}</b></p><p><small>包裹件數</small><b>{activeOrder?.quantity ?? 1} 件</b></p></div></section>
            <div className="order-timeline">
              {orderSteps.map((step, index) => {
                const Icon = step.icon;
                const timestamp = activeOrder ? [activeOrder.createdAt, activeOrder.packedAt, activeOrder.shippedAt, activeOrder.completedAt][index] : "";
                return <div key={step.title} className={index < stage ? "done" : index === stage ? "active" : ""}><span>{index < stage ? <Check /> : <Icon />}</span><p><b>{step.title}</b><small>{step.note}</small><time>{formatShipmentTime(timestamp)}</time></p></div>;
              })}
            </div>
            <div className="order-actions">
              <button className="button button-secondary" onClick={onReceipt}><FileCheck2 />查看影響力收據</button>
              <button className="button button-secondary" disabled={!activeOrder || stage >= 2 || latestChangeRequest?.status === "pending"} onClick={() => activeOrder && setChangeOrder(activeOrder)}><FileCheck2 />{latestChangeRequest?.status === "pending" ? "修改申請待確認" : stage >= 2 ? "配送後不可修改" : "申請修改訂單"}</button>
              <button className="button button-primary" disabled>{stage >= 3 ? "配送已完成" : "等待小農更新配送進度"}<ArrowRight /></button>
            </div>
            {latestChangeRequest && <div className={`change-request-status ${latestChangeRequest.status}`}><b>{latestChangeRequest.status === "pending" ? "修改申請待小農確認" : latestChangeRequest.status === "approved" ? "修改申請已核准" : "修改申請已退回"}</b><span>{latestChangeRequest.reasonDetail || "已保留原訂單與申請紀錄"}</span>{latestChangeRequest.reviewNote && <small>回覆：{latestChangeRequest.reviewNote}</small>}</div>}
          </section>
        </div>
      </Panel>
      {changeOrder && <OrderChangeRequestModal order={changeOrder} onClose={() => setChangeOrder(null)} onSubmit={async (values) => { const success = await onRequestChange(values); if (success) setChangeOrder(null); return success; }} />}
    </div>
  );
}

function OrderChangeRequestModal({ order, onClose, onSubmit }: { order: BackendSnapshot["orders"][number]; onClose: () => void; onSubmit: (values: Record<string, unknown>) => Promise<boolean> }) {
  const [form, setForm] = useState({ recipientName: order.recipientName, recipientPhone: order.recipientPhone, postalCode: order.postalCode, shippingCity: order.shippingCity, shippingDistrict: order.shippingDistrict, shippingAddress: order.shippingAddress, deliveryNote: order.deliveryNote, reasonCode: "input_error", reasonDetail: "收件資料輸入錯誤，申請更正。" });
  const [busy, setBusy] = useState(false);
  const complete = Boolean(form.recipientName.trim() && form.recipientPhone.trim() && form.shippingCity.trim() && form.shippingDistrict.trim() && form.shippingAddress.trim() && form.reasonDetail.trim());
  return <ModalShell title="申請修改兌換訂單" onClose={onClose} wide><div className="change-request-banner"><span><FileCheck2 /></span><div><b>送出申請不會直接覆寫原訂單</b><p>小農核准後才會套用新資料；進入配送階段後將無法修改。</p></div></div><div className="form-grid shipping-form-grid">
    <label>修改原因<select value={form.reasonCode} onChange={(event) => setForm((current) => ({ ...current, reasonCode: event.target.value }))}><option value="input_error">資料輸入錯誤</option><option value="accidental_order">誤按兌換</option><option value="delivery_change">收件安排變更</option><option value="other">其他原因</option></select></label>
    <label>收件人<input value={form.recipientName} onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))} /></label><label>聯絡電話<input value={form.recipientPhone} onChange={(event) => setForm((current) => ({ ...current, recipientPhone: event.target.value }))} /></label><label>郵遞區號<input value={form.postalCode} onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))} /></label><label>縣市<input value={form.shippingCity} onChange={(event) => setForm((current) => ({ ...current, shippingCity: event.target.value }))} /></label><label>行政區<input value={form.shippingDistrict} onChange={(event) => setForm((current) => ({ ...current, shippingDistrict: event.target.value }))} /></label><label className="full">詳細地址<input value={form.shippingAddress} onChange={(event) => setForm((current) => ({ ...current, shippingAddress: event.target.value }))} /></label><label className="full">配送備註<textarea rows={2} value={form.deliveryNote} onChange={(event) => setForm((current) => ({ ...current, deliveryNote: event.target.value }))} /></label><label className="full">申請說明<textarea rows={3} value={form.reasonDetail} onChange={(event) => setForm((current) => ({ ...current, reasonDetail: event.target.value }))} maxLength={500} /></label>
  </div><div className="modal-actions"><button className="button button-secondary" onClick={onClose} disabled={busy}>取消</button><button className="button button-primary" disabled={busy || !complete} onClick={() => { setBusy(true); void onSubmit({ orderId: order.id, ...form }).finally(() => setBusy(false)); }}>{busy ? "正在送出…" : "送出訂單修改申請"}</button></div></ModalShell>;
}
type GreenFinDocumentRow = { id: string; original_name: string; domain: string; source_level: string; status: string; created_at: string };
type GreenFinActionRow = { id: string; dimension: string; action_level: string; description: string; action_date: string; is_active: number };
type GreenFinResultPayload = { experience: Array<Record<string, unknown>>; indicators: Array<Record<string, unknown>>; dataHealth: Array<Record<string, unknown>>; notice?: string };
type GreenFinAuthorizationRow = { id: string; institution_id: string; institution_name: string; purpose: string; data_scope_json: string; start_at: string; expire_at: string; status: string; revoked_at?: string | null };
type GreenFinInstitution = { id: string; display_name: string };
type GreenFinBankCaseRow = { authorization_id: string; farmer_id: string; farmer_name: string; purpose: string; data_scope_json: string; start_at: string; expire_at: string; status: string; revoked_at?: string | null; case_id?: string | null; case_number?: string | null; case_status?: string | null; notes?: string | null };
type GreenFinBankDetail = GreenFinResultPayload & { authorization: { id: string; farmer_id: string; purpose: string; start_at: string; expire_at: string; scopes: string[] }; farmer?: { id: string; display_name: string; city: string; district: string }; bankCase?: { id: string; case_number: string; status: string; notes: string } | null };
const greenFinDomains = [
  ["IDENTITY", "身分與資格"], ["LAND_CROP", "土地與作物"], ["TRANSACTION", "經營與交易"],
  ["INPUT_EQUIPMENT", "投入與設備"], ["GREEN_ACTION", "綠色行動"], ["CERTIFICATION", "認證與治理"], ["LOAN_PURPOSE", "申貸用途"],
] as const;

function FarmerGreenFinPage({ busy, csrfToken, role, onUpload, onToast }: {
  busy: boolean; csrfToken: string; role: LoginRole;
  onUpload: (domain: string, uploadNote: string, file: File) => Promise<boolean>;
  onToast: (message: string) => void;
}) {
  const [section, setSection] = useState<"dashboard" | "documents" | "actions" | "experience" | "indicators" | "health" | "authorizations">("dashboard");
  const [documents, setDocuments] = useState<GreenFinDocumentRow[]>([]);
  const [actions, setActions] = useState<GreenFinActionRow[]>([]);
  const [results, setResults] = useState<GreenFinResultPayload>({ experience: [], indicators: [], dataHealth: [] });
  const [authorizations, setAuthorizations] = useState<GreenFinAuthorizationRow[]>([]);
  const [institutions, setInstitutions] = useState<GreenFinInstitution[]>([]);
  const [domain, setDomain] = useState("GREEN_ACTION");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [actionDraft, setActionDraft] = useState({ dimension: "減量", actionLevel: "BASIC", description: "", actionDate: new Date().toISOString().slice(0, 10) });
  const [authorizationDraft, setAuthorizationDraft] = useState(() => ({ institutionId: "", purpose: "申請授信時提供 GreenFin 永續資料作為補充資訊", dataScope: ["EXPERIENCE", "INDICATORS", "DATA_HEALTH"], startAt: new Date().toISOString().slice(0, 10), expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) }));
  const [working, setWorking] = useState(false);
  const [currentTime] = useState(() => Date.now());

  const headers = { "x-gfes-role": role };
  async function loadGreenFin() {
    const [documentsResponse, resultsResponse, actionsResponse, authorizationsResponse] = await Promise.all([
      fetch("/api/greenfin/documents", { headers }), fetch("/api/greenfin/results", { headers }), fetch("/api/greenfin/actions", { headers }), fetch("/api/greenfin/authorizations", { headers }),
    ]);
    if (documentsResponse.ok) setDocuments(((await documentsResponse.json()) as { documents: GreenFinDocumentRow[] }).documents);
    if (resultsResponse.ok) setResults(await resultsResponse.json() as GreenFinResultPayload);
    if (actionsResponse.ok) setActions(((await actionsResponse.json()) as { actions: GreenFinActionRow[] }).actions);
    if (authorizationsResponse.ok) {
      const payload = await authorizationsResponse.json() as { authorizations: GreenFinAuthorizationRow[]; institutions: GreenFinInstitution[] };
      setAuthorizations(payload.authorizations); setInstitutions(payload.institutions);
      setAuthorizationDraft((current) => current.institutionId || !payload.institutions[0] ? current : { ...current, institutionId: payload.institutions[0].id });
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void loadGreenFin(); }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function mutate(url: string, method: "PUT" | "PATCH" | "POST" | "DELETE", payload: Record<string, unknown>, success: string) {
    setWorking(true);
    try {
      const response = await fetch(url, { method, headers: { ...headers, "x-gfes-csrf": csrfToken, "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "GreenFin 操作失敗");
      onToast(success); await loadGreenFin();
    } catch (error) { onToast(error instanceof Error ? error.message : "GreenFin 操作失敗"); }
    finally { setWorking(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!file) return;
    const uploaded = await onUpload(domain, note, file);
    if (uploaded) { setFile(null); setNote(""); await loadGreenFin(); }
  }

  const latestBy = (rows: Array<Record<string, unknown>>, key: string) => [...new Map(rows.map((row) => [String(row[key]), row])).values()];
  const indicators = latestBy(results.indicators, "indicator_type");
  const health = latestBy(results.dataHealth, "domain");
  const experienceTotal = results.experience.reduce((sum, row) => sum + Number(row.effective_value ?? 0), 0);
  return <div className="dashboard-grid">
    <Panel className="span-12 subpage-primary" title="GreenFin 綠色數位履歷" note="Evidence First・Rule Driven・Explainable；不等同信用評分或自動核貸">
      <div className="filter-row">{(["dashboard", "documents", "actions", "experience", "indicators", "health", "authorizations"] as const).map((item) => <button key={item} className={`filter-pill ${section === item ? "active" : ""}`} onClick={() => setSection(item)}>{{ dashboard: "總覽", documents: "文件與 OCR", actions: "綠色行動", experience: "綠色經驗值", indicators: "四大指標", health: "Data Health", authorizations: "銀行授權" }[item]}</button>)}</div>
    </Panel>
    {(section === "dashboard" || section === "experience") && <Panel className="span-4" title="綠色經驗值" note="四構面年度各 250，上限合計 1,000"><div className="metric-number">{experienceTotal.toLocaleString()}</div><small>規則版本：GREENFIN_DEMO_V1</small></Panel>}
    {(section === "dashboard" || section === "indicators") && <Panel className="span-4" title="四大分析指標" note="彼此獨立，不合成總分"><div className="evidence-list">{indicators.length ? indicators.map((item) => <Evidence key={String(item.indicator_type)} title={String(item.indicator_type)} note={`${Number(item.score).toFixed(1)}／100・${String(item.level)}`} done />) : <p className="empty-copy">尚未計算指標。</p>}</div></Panel>}
    {(section === "dashboard" || section === "health") && <Panel className="span-4" title="Data Health" note="GRAY／RED／YELLOW／GREEN"><div className="evidence-list">{health.length ? health.map((item) => <Evidence key={String(item.domain)} title={greenFinDomains.find(([key]) => key === item.domain)?.[1] ?? String(item.domain)} note={String(item.status)} done={item.status === "GREEN"} />) : <p className="empty-copy">尚未計算資料健康度。</p>}</div></Panel>}
    {section === "documents" && <><Panel className="span-5" title="上傳原始文件" note="原檔存 R2；OCR 為明確標示的 SIMULATED 模式"><form className="farmer-evidence-upload" onSubmit={submit}><label>資料領域<select value={domain} onChange={(event) => setDomain(event.target.value)}>{greenFinDomains.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>文件說明<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} /></label><div className="upload-box"><Upload /><b>{file?.name ?? "選擇 PDF、圖片或 XLSX"}</b><small>檔案上限 10 MB；上傳後須人工確認 OCR 欄位</small><input type="file" accept="application/pdf,image/*,.xlsx" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div><button className="button button-primary button-block" disabled={busy || working || !file}>上傳並執行 SIMULATED OCR</button></form></Panel><Panel className="span-7" title="文件處理佇列" note={`${documents.length} 份 GreenFin 文件`}>{documents.length ? <div className="evidence-list">{documents.map((document) => <article className="evidence-item" key={document.id}><div><strong>{document.original_name}</strong><small>{document.domain}・{document.source_level}・{document.status}</small></div><div className="inline-actions">{document.status === "OCR_COMPLETED" && <button className="text-button" onClick={() => void mutate("/api/greenfin/documents", "PUT", { documentId: document.id, corrections: {} }, "OCR 欄位已確認")}>確認欄位</button>}{document.status === "FIELDS_CONFIRMED" && <button className="text-button" onClick={() => void mutate("/api/greenfin/documents", "PATCH", { documentId: document.id }, "文件已正規化")}>正規化</button>}{document.status === "NORMALIZED" && <button className="text-button" onClick={() => void mutate("/api/greenfin/verification", "POST", { documentId: document.id }, "來源核驗與異常檢查完成")}>核驗</button>}</div></article>)}</div> : <p className="empty-copy">尚未上傳 GreenFin 文件。</p>}</Panel></>}
    {section === "actions" && <><Panel className="span-5" title="新增綠色行動" note="行動等級基礎值為 20／50／100；實際認列仍依來源等級"><form className="farmer-evidence-upload" onSubmit={(event) => { event.preventDefault(); void mutate("/api/greenfin/actions", "POST", actionDraft, "綠色行動已建立").then(() => setActionDraft((current) => ({ ...current, description: "" }))); }}><label>構面<select value={actionDraft.dimension} onChange={(event) => setActionDraft((current) => ({ ...current, dimension: event.target.value }))}>{["減量", "增匯", "循環", "綠色治理"].map((value) => <option key={value}>{value}</option>)}</select></label><label>行動等級<select value={actionDraft.actionLevel} onChange={(event) => setActionDraft((current) => ({ ...current, actionLevel: event.target.value }))}><option value="BASIC">單次基礎行為・20</option><option value="SUSTAINED">持續性措施・50</option><option value="CERTIFIED">正式驗證／重大投入・100</option></select></label><label>執行日期<input type="date" value={actionDraft.actionDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setActionDraft((current) => ({ ...current, actionDate: event.target.value }))} /></label><label>說明<textarea required maxLength={500} value={actionDraft.description} onChange={(event) => setActionDraft((current) => ({ ...current, description: event.target.value }))} /></label><button className="button button-primary button-block" disabled={working || !actionDraft.description.trim()}>建立綠色行動</button></form></Panel><Panel className="span-7" title="行動紀錄" note={`${actions.filter((item) => item.is_active).length} 筆有效行動`}><div className="evidence-list">{actions.length ? actions.map((item) => <Evidence key={item.id} title={`${item.dimension}・${item.description}`} note={`${item.action_level}・${item.action_date}`} done={Boolean(item.is_active)} />) : <p className="empty-copy">尚未建立綠色行動。</p>}</div></Panel></>}
    {section === "authorizations" && <><Panel className="span-5" title="建立機構授權" note="授權可隨時撤銷；單次期間最長 366 天"><form className="farmer-evidence-upload" onSubmit={(event) => { event.preventDefault(); void mutate("/api/greenfin/authorizations", "POST", authorizationDraft, "GreenFin 機構授權已建立"); }}><label>授權機構<select required value={authorizationDraft.institutionId} onChange={(event) => setAuthorizationDraft((current) => ({ ...current, institutionId: event.target.value }))}><option value="">請選擇機構</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select></label><label>授權目的<textarea required maxLength={500} value={authorizationDraft.purpose} onChange={(event) => setAuthorizationDraft((current) => ({ ...current, purpose: event.target.value }))} /></label><div className="form-grid"><label>開始日期<input type="date" value={authorizationDraft.startAt} onChange={(event) => setAuthorizationDraft((current) => ({ ...current, startAt: event.target.value }))} /></label><label>到期日期<input type="date" min={authorizationDraft.startAt} value={authorizationDraft.expireAt} onChange={(event) => setAuthorizationDraft((current) => ({ ...current, expireAt: event.target.value }))} /></label></div><fieldset><legend>資料範圍</legend>{[["EXPERIENCE", "綠色經驗值"], ["INDICATORS", "四大指標"], ["DATA_HEALTH", "Data Health"]].map(([value, label]) => <label key={value}><input type="checkbox" checked={authorizationDraft.dataScope.includes(value)} onChange={(event) => setAuthorizationDraft((current) => ({ ...current, dataScope: event.target.checked ? [...current.dataScope, value] : current.dataScope.filter((scope) => scope !== value) }))} />{label}</label>)}</fieldset><button className="button button-primary button-block" disabled={working || !authorizationDraft.institutionId || !authorizationDraft.dataScope.length}>建立限期授權</button></form></Panel><Panel className="span-7" title="授權紀錄" note="機構、資料範圍、期間與撤銷狀態均由後端檢核"><div className="evidence-list">{authorizations.length ? authorizations.map((item) => { const scopes = JSON.parse(item.data_scope_json) as string[]; const active = item.status === "ACTIVE" && !item.revoked_at && new Date(item.expire_at).valueOf() > currentTime; return <article className="evidence-item" key={item.id}><div><strong>{item.institution_name}</strong><small>{item.purpose}</small><small>{scopes.join("・")}・{item.start_at.slice(0, 10)} 至 {item.expire_at.slice(0, 10)}</small></div><div className="inline-actions"><span className={`status-pill ${active ? "" : "waiting"}`}>{active ? "有效" : item.status === "REVOKED" ? "已撤銷" : "已到期"}</span>{active && <button type="button" className="text-button" onClick={() => { if (window.confirm(`確認撤銷對 ${item.institution_name} 的 GreenFin 授權？`)) void mutate(`/api/greenfin/authorizations?authorizationId=${encodeURIComponent(item.id)}`, "DELETE", {}, "GreenFin 授權已撤銷"); }}>撤銷</button>}</div></article>; }) : <p className="empty-copy">尚未建立任何機構授權。</p>}</div></Panel></>}
    {section !== "documents" && section !== "actions" && section !== "authorizations" && <Panel className="span-12" title="重新計算" note="只使用後端規則與已核驗資料；結果保留規則版本與證據追溯"><button className="button button-primary" disabled={working} onClick={() => void mutate("/api/greenfin/results", "POST", {}, "GreenFin 三類結果已重新計算")}>{working ? "計算中…" : "依 GREENFIN_DEMO_V1 重新計算"}</button></Panel>}
  </div>;
}

function InstitutionGreenFinPage({ csrfToken, role, onToast }: { csrfToken: string; role: LoginRole; onToast: (message: string) => void }) {
  const [cases, setCases] = useState<GreenFinBankCaseRow[]>([]);
  const [detail, setDetail] = useState<GreenFinBankDetail | null>(null);
  const [selectedAuthorizationId, setSelectedAuthorizationId] = useState("");
  const [working, setWorking] = useState(false);
  const [currentTime] = useState(() => Date.now());
  const headers = { "x-gfes-role": role };

  async function loadCases() {
    const response = await fetch("/api/greenfin/bank-cases", { headers, cache: "no-store" });
    const payload = await response.json() as { cases?: GreenFinBankCaseRow[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "讀取 GreenFin 授權案件失敗");
    setCases(payload.cases ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCases().catch((error) => onToast(error instanceof Error ? error.message : "讀取 GreenFin 授權案件失敗")); }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function openAuthorizedData(item: GreenFinBankCaseRow) {
    setWorking(true); setSelectedAuthorizationId(item.authorization_id);
    try {
      if (!item.case_id) {
        const createResponse = await fetch("/api/greenfin/bank-cases", { method: "POST", headers: { ...headers, "x-gfes-csrf": csrfToken, "content-type": "application/json" }, body: JSON.stringify({ authorizationId: item.authorization_id, caseNumber: `GF-${item.authorization_id.slice(-8).toUpperCase()}`, notes: "由有效 GreenFin 授權建立" }) });
        const created = await createResponse.json() as { error?: string };
        if (!createResponse.ok) throw new Error(created.error || "建立案件失敗");
      }
      const response = await fetch(`/api/greenfin/bank-cases?authorizationId=${encodeURIComponent(item.authorization_id)}`, { headers, cache: "no-store" });
      const payload = await response.json() as GreenFinBankDetail & { error?: string };
      if (!response.ok) throw new Error(payload.error || "讀取授權資料失敗");
      setDetail(payload); await loadCases(); onToast("已依有效授權讀取 GreenFin 補充資訊並留下稽核紀錄");
    } catch (error) { setDetail(null); onToast(error instanceof Error ? error.message : "讀取授權資料失敗"); }
    finally { setWorking(false); }
  }

  async function downloadTraceableReport() {
    if (!detail) return;
    setWorking(true);
    try {
      const response = await fetch("/api/greenfin/reports", { method: "POST", headers: { ...headers, "x-gfes-csrf": csrfToken, "content-type": "application/json" }, body: JSON.stringify({ authorizationId: detail.authorization.id }) });
      const payload = await response.json() as { reportId?: string; error?: string } & Record<string, unknown>;
      if (!response.ok || !payload.reportId) throw new Error(payload.error || "產生可追溯資料包失敗");
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${payload.reportId}.json`; anchor.click(); URL.revokeObjectURL(url);
      onToast("可追溯資料包已產生，報告事件已寫入稽核紀錄");
    } catch (error) { onToast(error instanceof Error ? error.message : "產生可追溯資料包失敗"); }
    finally { setWorking(false); }
  }

  const latestBy = (rows: Array<Record<string, unknown>>, key: string) => [...new Map(rows.map((row) => [String(row[key]), row])).values()];
  const indicators = latestBy(detail?.indicators ?? [], "indicator_type");
  const health = latestBy(detail?.dataHealth ?? [], "domain");
  const experience = detail?.experience ?? [];
  const experienceTotal = experience.reduce((sum, row) => sum + Number(row.effective_value ?? 0), 0);
  return <div className="dashboard-grid">
    <Panel className="span-12 subpage-primary" title="GreenFin 已授權案件" note="後端同步檢核 institution、data scope、有效期間及撤銷狀態；每次資料讀取均留下稽核紀錄">
      <div className="system-mode-banner"><span><LockKeyhole /></span><div><b>僅作為授信補充資訊</b><p>不提供任何授信決策、風險機率、融資條件或單一綜合分數。</p></div></div>
    </Panel>
    <Panel className="span-12" title="小農授權清單" note={`${cases.length} 筆與目前機構相關的授權`}>
      {cases.length ? <div className="evidence-list">{cases.map((item) => { const active = item.status === "ACTIVE" && !item.revoked_at && new Date(item.start_at).valueOf() <= currentTime && new Date(item.expire_at).valueOf() > currentTime; const scopes = JSON.parse(item.data_scope_json) as string[]; return <article className="evidence-item" key={item.authorization_id}><div><strong>{item.farmer_name}</strong><small>{item.purpose}</small><small>{scopes.join("・")}・有效至 {item.expire_at.slice(0, 10)}{item.case_number ? `・案件 ${item.case_number}` : ""}</small></div><div className="inline-actions"><span className={`status-pill ${active ? "" : "waiting"}`}>{active ? "有效授權" : item.status === "REVOKED" ? "已撤銷" : "未生效／已到期"}</span><button className="text-button" disabled={!active || working} onClick={() => void openAuthorizedData(item)}>{working && selectedAuthorizationId === item.authorization_id ? "讀取中…" : item.case_id ? "檢視授權資料" : "建立並開啟案件"}</button></div></article>; })}</div> : <p className="empty-copy">目前沒有小農授權給此機構。</p>}
    </Panel>
    {detail && <><Panel className="span-12" title={detail.farmer?.display_name ?? detail.authorization.farmer_id} note={`${detail.farmer?.city ?? ""}${detail.farmer?.district ?? ""}・授權目的：${detail.authorization.purpose}`} action={<button className="button button-primary" disabled={working} onClick={() => void downloadTraceableReport()}><Download />產生可追溯資料包</button>}><div className="portfolio-summary"><article><strong>{experienceTotal.toLocaleString()}</strong><span>綠色經驗值</span></article><article><strong>{indicators.length} 項</strong><span>已授權指標</span></article><article><strong>{health.length} 項</strong><span>Data Health 領域</span></article><article><strong>{detail.authorization.scopes.length} 類</strong><span>授權資料範圍</span></article></div></Panel><Panel className="span-6" title="四大分析指標" note="各指標獨立呈現，不合成總分"><div className="evidence-list">{indicators.length ? indicators.map((item) => <Evidence key={String(item.indicator_type)} title={String(item.indicator_type)} note={`${Number(item.score).toFixed(1)}／100・${String(item.level)}・${String(item.rule_version)}`} done />) : <p className="empty-copy">此授權未包含指標，或尚未計算。</p>}</div></Panel><Panel className="span-6" title="Data Health" note="顯示資料品質狀態與規則版本"><div className="evidence-list">{health.length ? health.map((item) => <Evidence key={String(item.domain)} title={greenFinDomains.find(([key]) => key === item.domain)?.[1] ?? String(item.domain)} note={`${String(item.status)}・${String(item.rule_version)}`} done={item.status === "GREEN"} />) : <p className="empty-copy">此授權未包含 Data Health，或尚未計算。</p>}</div></Panel></>}
  </div>;
}

function FarmerFundingPage({
  farmerPoints,
  onOffer,
  redemptions,
  changeRequests,
  onReceipt,
  onRequestChange,
}: {
  farmerPoints: number;
  onOffer: (id: string) => void;
  redemptions: BackendSnapshot["resourceRedemptions"];
  changeRequests: BackendSnapshot["changeRequests"];
  onReceipt: (redemptionId: string) => void;
  onRequestChange: (values: Record<string, unknown>) => Promise<boolean>;
}) {
  const [changeRedemption, setChangeRedemption] = useState<BackendSnapshot["resourceRedemptions"][number] | null>(null);
  const availableBenefits = farmerBenefits.filter((benefit) => farmerPoints >= benefit.requiredScore);
  const nextBenefit = farmerBenefits.find((benefit) => farmerPoints < benefit.requiredScore);
  const fulfillmentSteps = (type: "delivery" | "appointment") => type === "delivery"
    ? ["兌換成立", "農會備貨", "配送中", "完成簽收"]
    : ["兌換成立", "農會確認", "預約已排程", "服務完成"];
  return (
    <div className="dashboard-grid"><Panel className="span-12 subpage-primary" title="農會農業資源兌換" note="把消費者與企業支持轉成檢測、農具、輔導和農業補助">
      <div className="funding-unlock-summary"><div className="funding-current"><span><HandCoins /></span><div><small>小農綠點餘額</small><strong>{farmerPoints.toLocaleString()} 點</strong><p>目前可兌換 {availableBenefits.length}／{farmerBenefits.length} 項</p></div></div>{nextBenefit ? <div className="funding-next"><div><span>下一項資源</span><b>{nextBenefit.requiredScore.toLocaleString()} 點・{nextBenefit.name}</b></div><div className="progress"><span style={{ width: Math.min((farmerPoints / nextBenefit.requiredScore) * 100, 100) + "%" }} /></div><small>再獲得 <b>{(nextBenefit.requiredScore - farmerPoints).toLocaleString()} 點</b>即可兌換</small></div> : <div className="funding-next complete"><b>目前所有示範資源皆可兌換</b><small>兌換後由農會協助領取或銜接輔導。</small></div>}</div>
      <div className="funding-legend"><span><i className="support" />農會合作資源</span><span><i className="loan" />器具／檢測／輔導</span><span><LockKeyhole />餘額不足時顯示差額</span></div>
      <div className="offer-list funding-offer-grid">{farmerBenefits.map((offer) => <Offer key={offer.id} category={offer.category} name={offer.name} amount={offer.amount} term={offer.term} rate={offer.rate} description={offer.description} purpose={offer.purpose} requiredScore={offer.requiredScore} currentScore={farmerPoints} recommended={"recommended" in offer && offer.recommended} onClick={() => onOffer(offer.id)} />)}</div>
    </Panel>
    <Panel className="span-12 resource-redemption-panel" title="兌換紀錄、收據與履約進度" note="配送型資源顯示物流進度；檢測、輔導及補助顯示預約排程">
      {redemptions.length === 0 ? <div className="empty-receipt"><span><PackageCheck /></span><h3>尚無農會資源兌換紀錄</h3><p>完成第一筆兌換後，這裡會顯示收據、配送或預約時間與後續進度。</p></div> : <div className="resource-redemption-list">{redemptions.map((redemption) => {
        const steps = fulfillmentSteps(redemption.fulfillmentType);
        const stage = Math.min(3, redemption.stage);
        const changeRequest = changeRequests.find((request) => request.requestType === "resource" && request.targetId === redemption.id);
        return <article key={redemption.id}><header><div><small>{redemption.id}</small><h3>{redemption.resourceName}</h3><p>{redemption.cooperative}・{new Date(redemption.createdAt).toLocaleDateString("zh-TW")}</p></div><span className={`status-pill ${stage < 2 ? "waiting" : ""}`}>{steps[stage]}</span></header><div className="resource-redemption-summary"><p><small>扣抵綠點</small><b>{redemption.points.toLocaleString()} 點</b></p><p><small>{redemption.fulfillmentType === "delivery" ? "配送地址" : "預約時間"}</small><b>{redemption.fulfillmentType === "delivery" ? redemption.deliveryAddress : `${redemption.appointmentDate} ${redemption.appointmentSlot}`}</b></p><p><small>{redemption.fulfillmentType === "delivery" ? "物流單號" : "聯絡窗口"}</small><b>{redemption.fulfillmentType === "delivery" ? redemption.trackingNumber || "農會確認後提供" : `${redemption.contactName}・${redemption.contactPhone}`}</b></p></div><div className="resource-progress">{steps.map((label, index) => <div key={label} className={index < stage ? "done" : index === stage ? "active" : ""}><span>{index < stage ? <Check /> : index + 1}</span><b>{label}</b></div>)}</div>{changeRequest && <div className={`change-request-status ${changeRequest.status}`}><b>{changeRequest.status === "pending" ? "修改申請待承辦端確認" : changeRequest.status === "approved" ? "修改申請已核准" : "修改申請已退回"}</b><span>{changeRequest.reasonDetail}</span>{changeRequest.reviewNote && <small>回覆：{changeRequest.reviewNote}</small>}</div>}<div className="resource-redemption-actions"><button className="button button-secondary" onClick={() => onReceipt(redemption.id)}><Receipt />查看兌換收據</button><button className="button button-secondary" disabled={stage >= 2 || changeRequest?.status === "pending"} onClick={() => setChangeRedemption(redemption)}>{changeRequest?.status === "pending" ? "修改申請待確認" : stage >= 2 ? "履約後不可修改" : "申請修改兌換"}</button><span className="read-only-progress"><LockKeyhole />履約進度由銀行／政府／企業承辦端更新</span></div></article>;
      })}</div>}
    </Panel>{changeRedemption && <ResourceChangeRequestModal redemption={changeRedemption} onClose={() => setChangeRedemption(null)} onSubmit={async (values) => { const success = await onRequestChange(values); if (success) setChangeRedemption(null); return success; }} />}</div>
  );
}

function ResourceChangeRequestModal({ redemption, onClose, onSubmit }: { redemption: BackendSnapshot["resourceRedemptions"][number]; onClose: () => void; onSubmit: (values: Record<string, unknown>) => Promise<boolean> }) {
  const [form, setForm] = useState({ cooperative: redemption.cooperative, contactName: redemption.contactName, contactPhone: redemption.contactPhone, fulfillmentType: redemption.fulfillmentType, deliveryAddress: redemption.deliveryAddress, appointmentDate: redemption.appointmentDate, appointmentSlot: redemption.appointmentSlot, note: redemption.note, reasonCode: "input_error", reasonDetail: "兌換資料輸入錯誤，申請更正。" });
  const [busy, setBusy] = useState(false);
  const complete = Boolean(form.cooperative.trim() && form.contactName.trim() && form.contactPhone.trim() && form.reasonDetail.trim() && (form.fulfillmentType === "delivery" ? form.deliveryAddress.trim() : form.appointmentDate && form.appointmentSlot));
  return <ModalShell title="申請修改農會資源兌換" onClose={onClose} wide><div className="change-request-banner"><span><FileCheck2 /></span><div><b>承辦端核准後才會套用新資料</b><p>若已進入配送或預約排程，請直接聯絡承辦農會處理。</p></div></div><div className="form-grid application-form"><label>修改原因<select value={form.reasonCode} onChange={(event) => setForm((current) => ({ ...current, reasonCode: event.target.value }))}><option value="input_error">資料輸入錯誤</option><option value="accidental_redemption">誤按兌換</option><option value="delivery_change">配送資料變更</option><option value="schedule_change">預約時間變更</option><option value="other">其他原因</option></select></label><label>承辦農會<input value={form.cooperative} onChange={(event) => setForm((current) => ({ ...current, cooperative: event.target.value }))} /></label><label>聯絡人<input value={form.contactName} onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))} /></label><label>聯絡電話<input value={form.contactPhone} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} /></label><label>履約方式<select value={form.fulfillmentType} onChange={(event) => setForm((current) => ({ ...current, fulfillmentType: event.target.value as "delivery" | "appointment" }))}><option value="delivery">配送至農場</option><option value="appointment">預約農會服務</option></select></label>{form.fulfillmentType === "delivery" ? <label className="full">配送地址<input value={form.deliveryAddress} onChange={(event) => setForm((current) => ({ ...current, deliveryAddress: event.target.value }))} /></label> : <><label>預約日期<input type="date" value={form.appointmentDate} onChange={(event) => setForm((current) => ({ ...current, appointmentDate: event.target.value }))} /></label><label>預約時段<input value={form.appointmentSlot} onChange={(event) => setForm((current) => ({ ...current, appointmentSlot: event.target.value }))} /></label></>}<label className="full">用途與備註<textarea rows={2} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label><label className="full">申請說明<textarea rows={3} value={form.reasonDetail} onChange={(event) => setForm((current) => ({ ...current, reasonDetail: event.target.value }))} /></label></div><div className="modal-actions"><button className="button button-secondary" disabled={busy} onClick={onClose}>取消</button><button className="button button-primary" disabled={busy || !complete} onClick={() => { setBusy(true); void onSubmit({ redemptionId: redemption.id, ...form }).finally(() => setBusy(false)); }}>{busy ? "正在送出…" : "送出兌換修改申請"}</button></div></ModalShell>;
}

const incentivePrograms: IncentiveProgram[] = [
  { id: "commute", name: "低碳通勤綠點", sponsor: "企業員工方案", action: "搭乘大眾運輸或共享單車", reward: "每次 20 點", budgetPoints: 96400, participants: "4,820 人", progress: 78, esg: "氣候行動" },
  { id: "ebill", name: "電子帳單轉換獎勵", sponsor: "政府／公用事業", action: "改用電子帳單", reward: "一次 80 點", budgetPoints: 74800, participants: "9,350 人", progress: 64, esg: "責任消費" },
  { id: "appliance", name: "節能家電汰舊換新", sponsor: "政府／銀行／家電通路", action: "購買一級能效冷氣、冰箱或除濕機", reward: "每件 600 點", budgetPoints: 92000, participants: "1,540 戶", progress: 69, esg: "能源效率" },
  { id: "local-shopping", name: "在地綠色消費加碼", sponsor: "銀行卡友／企業會員", action: "指定在地小農通路消費", reward: "消費 5% 點數", budgetPoints: 128600, participants: "6,240 人", progress: 83, esg: "地方共好" },
  { id: "farmer-match", name: "偏鄉小農支持配對", sponsor: "企業 ESG 專案", action: "企業 1：1 配對消費者綠點", reward: "等額配對", budgetPoints: 86200, participants: "128 戶", progress: 71, esg: "永續經濟" },
];

function InstitutionPortfolioPage({
  programs,
  onCreate,
  procurements,
  resourceRedemptions,
  outcomes,
  onProcurement,
}: {
  programs: IncentiveProgram[];
  onCreate: () => void;
  procurements: BackendSnapshot["procurements"];
  resourceRedemptions: BackendSnapshot["resourceRedemptions"];
  outcomes: BackendSnapshot["outcomeReports"];
  onProcurement: (values: { title: string; category: string; quantity: number; budgetPoints: number; deliveryRegion: string }) => void;
}) {
  const totalBudget = programs.reduce((sum, program) => sum + program.budgetPoints, 0);
  const participantTotal = programs.reduce((sum, program) => sum + Number(program.participants.replace(/[^0-9]/g, "") || 0), 0);
  const supportedFarmers = new Set(resourceRedemptions.map((item) => item.farmerId)).size;
  const verifiedOutcomes = outcomes.filter((item) => item.status === "verified");
  const carbonKg = verifiedOutcomes.reduce((sum, item) => sum + Number(item.carbonKg ?? 0), 0);
  const [procurementTitle, setProcurementTitle] = useState("員工永續福利小農箱");
  const [procurementCategory, setProcurementCategory] = useState("友善農產箱");
  const [procurementQuantity, setProcurementQuantity] = useState(200);
  const [procurementBudget, setProcurementBudget] = useState(120000);
  const [deliveryRegion, setDeliveryRegion] = useState("台北市");
  return (
    <div className="dashboard-grid">
      <Panel className="span-12 procurement-panel" title="永續採購與團體採購" note="銀行、政府與企業可直接建立採購需求，媒合具有履歷或友善耕作證明的小農商品">
        <div className="form-grid procurement-form">
          <label>採購名稱<input value={procurementTitle} onChange={(event) => setProcurementTitle(event.target.value)} /></label>
          <label>品項類別<input value={procurementCategory} onChange={(event) => setProcurementCategory(event.target.value)} /></label>
          <label>採購數量<input type="number" min="1" value={procurementQuantity} onChange={(event) => setProcurementQuantity(Number(event.target.value))} /></label>
          <label>預算綠點<input type="number" min="1" value={procurementBudget} onChange={(event) => setProcurementBudget(Number(event.target.value))} /></label>
          <label>配送地區<input value={deliveryRegion} onChange={(event) => setDeliveryRegion(event.target.value)} /></label>
          <button className="button button-primary" onClick={() => onProcurement({ title: procurementTitle, category: procurementCategory, quantity: procurementQuantity, budgetPoints: procurementBudget, deliveryRegion })}><ShoppingBasket />建立採購需求</button>
        </div>
        {procurements.length > 0 && <div className="procurement-list">{procurements.map((item) => <article key={item.id}><div><span className="status-pill">{item.status === "open" ? "媒合中" : item.status}</span><h3>{item.title}</h3><p>{item.category}・{item.quantity.toLocaleString()} 份・配送 {item.deliveryRegion}</p></div><strong>{item.budgetPoints.toLocaleString()} 綠點</strong></article>)}</div>}
      </Panel>
      <Panel className="span-12 subpage-primary institution-incentive-panel" title="綠點激勵計畫" note="企業後台專屬管理：建立綠點任務，追蹤預算、參與進度與在地支持成果" action={<button className="button button-primary" onClick={onCreate}><PackageCheck />建立新計畫</button>}>
        <div className="portfolio-summary"><article><strong>{programs.length} 項</strong><span>計畫總數</span></article><article><strong>{totalBudget.toLocaleString()} 點</strong><span>計畫綠點預算</span></article><article><strong>{participantTotal.toLocaleString()}</strong><span>計畫參與人次</span></article><article><strong>{supportedFarmers} 戶</strong><span>履約涉及小農</span></article></div>
        {programs.length === 0 ? <div className="empty-receipt"><span><PackageCheck /></span><h3>尚未建立綠點激勵計畫</h3><p>建立後只會顯示在目前登入單位的後台。</p></div> : <div className="incentive-grid">{programs.map((program) => <article className="incentive-card" key={program.id}><header><span>{program.esg}</span><b>{program.name}</b><small>{program.sponsor}</small></header><p>{program.action}</p><div className="incentive-data"><span>回饋方式<b>{program.reward}</b></span><span>計畫預算<b>{program.budgetPoints.toLocaleString()} 點</b></span><span>參與對象<b>{program.participants}</b></span></div><div className="progress"><span style={{ width: `${program.progress}%` }} /></div><small>{program.progress === 0 ? "新建立・尚未開始" : `年度目標達成 ${program.progress}%`}</small></article>)}</div>}
      </Panel>
      <Panel className="span-12" title="ESG 可揭露成果" note="平台協助累積行動、點數流向與地方效益證據；正式評等仍依各揭露準則與評鑑機構認定">
        <div className="table-wrap"><table className="mobile-card-table esg-table"><thead><tr><th>成果面向</th><th>可揭露指標</th><th>目前成果</th><th>佐證方式</th></tr></thead><tbody><tr><td>氣候行動</td><td>已驗證成果估算減碳</td><td>{(carbonKg / 1000).toLocaleString()} 噸 CO₂e</td><td>成果審核紀錄</td></tr><tr><td>責任消費</td><td>激勵計畫參與</td><td>{participantTotal.toLocaleString()} 人次</td><td>本帳戶計畫資料</td></tr><tr><td>地方共好</td><td>農業資源履約涉及小農</td><td>{supportedFarmers} 戶</td><td>資源兌換紀錄</td></tr><tr><td>永續經濟</td><td>農業資源回流</td><td>{resourceRedemptions.reduce((sum, item) => sum + item.points, 0).toLocaleString()} 點</td><td>農會兌換紀錄</td></tr></tbody></table></div>
      </Panel>
    </div>
  );
}

function InstitutionResourceFulfillmentPage({ resourceRedemptions, changeRequests, onAdvance, onReviewResourceChange }: { resourceRedemptions: BackendSnapshot["resourceRedemptions"]; changeRequests: BackendSnapshot["changeRequests"]; onAdvance: (redemptionId: string) => void; onReviewResourceChange: (requestId: string, decision: "approved" | "rejected") => void }) {
  const pendingChanges = changeRequests.filter((request) => request.requestType === "resource" && request.status === "pending");
  const fulfillmentSteps = (type: "delivery" | "appointment") => type === "delivery" ? ["兌換成立", "農會備貨", "配送中", "完成簽收"] : ["兌換成立", "農會確認", "預約已排程", "服務完成"];
  return <div className="dashboard-grid">
    <div className="metrics span-12"><Metric icon={PackageCheck} value={`${resourceRedemptions.length} 筆`} label="資源兌換案件" delta="承辦端統一管理" /><Metric icon={Truck} value={`${resourceRedemptions.filter((item) => item.stage > 0 && item.stage < 3).length} 筆`} label="履約處理中" delta="配送與預約" /><Metric icon={FileCheck2} value={`${pendingChanges.length} 筆`} label="修改待確認" delta="保留原始紀錄" /><Metric icon={CheckCircle2} value={`${resourceRedemptions.filter((item) => item.stage >= 3).length} 筆`} label="履約完成" delta="可供成果揭露" /></div>
    <Panel className="span-12" title="農業資源兌換履約進度" note="由銀行／政府／企業承辦端更新農會確認、配送、預約與完成時間"><div className="resource-redemption-list">{resourceRedemptions.length === 0 ? <div className="empty-receipt"><span><PackageCheck /></span><h3>目前沒有待履約案件</h3><p>小農完成農業資源兌換後會顯示在這裡。</p></div> : resourceRedemptions.map((redemption) => { const steps = fulfillmentSteps(redemption.fulfillmentType); const stage = Math.min(3, redemption.stage); const pending = pendingChanges.find((request) => request.targetId === redemption.id); return <article key={redemption.id}><header><div><small>{redemption.id}</small><h3>{redemption.resourceName}</h3><p>{redemption.cooperative}・{redemption.fulfillmentType === "delivery" ? "配送型資源" : "預約型服務"}</p></div><span className={`status-pill ${stage < 2 ? "waiting" : ""}`}>{steps[stage]}</span></header><div className="resource-redemption-summary"><p><small>申請小農</small><b>{redemption.farmerId}</b></p><p><small>{redemption.fulfillmentType === "delivery" ? "配送地址" : "預約時間"}</small><b>{redemption.fulfillmentType === "delivery" ? redemption.deliveryAddress : `${redemption.appointmentDate} ${redemption.appointmentSlot}`}</b></p><p><small>聯絡窗口</small><b>{redemption.contactName}・{redemption.contactPhone}</b></p></div><div className="resource-progress">{steps.map((label, index) => <div key={label} className={index < stage ? "done" : index === stage ? "active" : ""}><span>{index < stage ? <Check /> : index + 1}</span><b>{label}</b></div>)}</div>{pending && <div className="change-request-status"><b>小農已申請修改資料</b><span>{pending.reasonDetail}</span></div>}<div className="resource-redemption-actions"><button className="button button-primary" disabled={stage >= 3 || Boolean(pending)} onClick={() => onAdvance(redemption.id)}>{pending ? "請先處理修改申請" : stage >= 3 ? "履約已完成" : `更新為「${steps[stage + 1]}」`}<ArrowRight /></button></div></article>; })}</div></Panel>
    <Panel className="span-12" title="農會資源兌換修改申請" note="核准後才會更新配送、預約或聯絡資料；原始申請與審核紀錄皆會保留">{pendingChanges.length === 0 ? <div className="empty-receipt"><span><FileCheck2 /></span><h3>目前沒有待處理修改申請</h3><p>小農送出修改後會顯示在這裡。</p></div> : <div className="change-review-list">{pendingChanges.map((request) => { const redemption = resourceRedemptions.find((item) => item.id === request.targetId); return <article key={request.id}><header><div><small>{request.id}</small><h3>{redemption?.resourceName ?? request.targetId}</h3><p>{request.reasonDetail}</p></div><span className="status-pill waiting">待承辦確認</span></header><div className="receipt-box"><Row label="承辦農會" value={request.requested.cooperative ?? ""} /><Row label="聯絡窗口" value={`${request.requested.contactName ?? ""}・${request.requested.contactPhone ?? ""}`} /><Row label={request.requested.fulfillmentType === "delivery" ? "新配送地址" : "新預約時間"} value={request.requested.fulfillmentType === "delivery" ? request.requested.deliveryAddress ?? "" : `${request.requested.appointmentDate ?? ""} ${request.requested.appointmentSlot ?? ""}`} /></div><div className="resource-redemption-actions"><button className="button button-secondary" onClick={() => onReviewResourceChange(request.id, "rejected")}>退回申請</button><button className="button button-primary" onClick={() => onReviewResourceChange(request.id, "approved")}><Check />核准並套用</button></div></article>; })}</div>}</Panel>
  </div>;
}

function AdminApiSystemPage({
  settings,
  runs,
  points,
  busy,
  onUpdate,
  onSimulate,
}: {
  settings: BackendSnapshot["integrationSettings"];
  runs: BackendSnapshot["verificationRuns"];
  points: number;
  busy: boolean;
  onUpdate: (values: { serviceKey: string; enabled: boolean; rewardPoints: number; endpointLabel: string; sampleResponse: string }) => void;
  onSimulate: (serviceKey: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, { enabled: boolean; rewardPoints: number; endpointLabel: string; sampleResponse: string }>>(() => Object.fromEntries(settings.map((setting) => [setting.serviceKey, {
      enabled: setting.enabled,
      rewardPoints: setting.rewardPoints,
      endpointLabel: setting.endpointLabel,
      sampleResponse: JSON.stringify(setting.sampleResponse, null, 2),
    }])));

  const successfulRuns = runs.filter((run) => run.status === "success").length;
  const enabledServices = settings.filter((setting) => setting.enabled).length;

  return (
    <div className="dashboard-grid system-dashboard">
      <div className="metrics span-12">
        <Metric icon={Monitor} value={`${enabledServices}／${settings.length}`} label="啟用的測試服務" delta="測試模式" />
        <Metric icon={BadgeCheck} value={successfulRuns.toLocaleString()} label="成功驗證次數" delta={runs.length ? "100% 成功" : "等待測試"} />
        <Metric icon={HandCoins} value={`${points.toLocaleString()} 點`} label="消費者測試餘額" delta="即時同步" />
        <Metric icon={FileCheck2} value={`${runs.length} 筆`} label="後台驗證紀錄" delta="D1 保存" />
      </div>

      <Panel className="span-12 system-mode-panel" title="外部 API 測試模式" note="正式憑證尚未設定前，按下模擬驗證會使用下方可編輯的預設回應，並把結果與綠點回饋寫入後台">
        <div className="system-mode-banner"><span><LockKeyhole /></span><div><b>目前使用安全測試模式</b><p>不會把資料送往財政部、物流商、定位或農業外部系統。取得正式憑證後，可將同一組服務設定切換為正式端點。</p></div></div>
      </Panel>

      <Panel className="span-12" title="API 驗證設定與預設資料" note="可調整服務名稱、啟用狀態、驗證成功回饋點數及模擬回傳內容">
        <div className="integration-setting-grid">
          {settings.map((setting) => {
            const draft = drafts[setting.serviceKey] ?? { enabled: setting.enabled, rewardPoints: setting.rewardPoints, endpointLabel: setting.endpointLabel, sampleResponse: JSON.stringify(setting.sampleResponse, null, 2) };
            return <article className="integration-setting-card" key={setting.serviceKey}>
              <header><div><span className="status-pill waiting">測試模式</span><h3>{setting.displayName}</h3><small>{setting.serviceKey}</small></div><label className="integration-switch"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDrafts((current) => ({ ...current, [setting.serviceKey]: { ...draft, enabled: event.target.checked } }))} /><span>{draft.enabled ? "啟用" : "停用"}</span></label></header>
              <div className="form-stack compact">
                <label>預計正式 API 來源<input value={draft.endpointLabel} onChange={(event) => setDrafts((current) => ({ ...current, [setting.serviceKey]: { ...draft, endpointLabel: event.target.value } }))} /></label>
                <label>驗證成功回饋點數<input type="number" min="0" value={draft.rewardPoints} onChange={(event) => setDrafts((current) => ({ ...current, [setting.serviceKey]: { ...draft, rewardPoints: Number(event.target.value) } }))} /></label>
                <label>模擬回傳資料（JSON）<textarea rows={7} value={draft.sampleResponse} onChange={(event) => setDrafts((current) => ({ ...current, [setting.serviceKey]: { ...draft, sampleResponse: event.target.value } }))} /></label>
              </div>
              <div className="integration-actions"><button className="button button-secondary" disabled={busy} onClick={() => onUpdate({ serviceKey: setting.serviceKey, ...draft })}>儲存設定</button><button className="button button-primary" disabled={busy || !draft.enabled} onClick={() => onSimulate(setting.serviceKey)}><ScanLine />模擬驗證</button></div>
            </article>;
          })}
        </div>
      </Panel>

      <Panel className="span-12" title="最近驗證紀錄" note="每次模擬驗證都會留下服務、回傳結果、回饋點數及時間">
        {runs.length === 0 ? <div className="empty-receipt"><span><ScanLine /></span><h3>尚未執行模擬驗證</h3><p>從上方任一服務按下「模擬驗證」即可建立第一筆紀錄。</p></div> : <div className="verification-run-list">{runs.map((run) => {
          const setting = settings.find((item) => item.serviceKey === run.serviceKey);
          const message = typeof run.response.message === "string" ? run.response.message : "驗證完成";
          const invoiceNumber = typeof run.input.invoiceNumber === "string" ? run.input.invoiceNumber : "";
          const inputSummary = run.serviceKey === "invoice" && invoiceNumber
            ? `送出資料：${invoiceNumber}・NT$ ${Number(run.input.amount ?? 0).toLocaleString()}・${String(run.input.transactionDate ?? "未填日期")}`
            : `送出資料：${JSON.stringify(run.input)}`;
          return <article key={run.id}><div><span className="status-pill">成功</span><h3>{setting?.displayName ?? run.serviceKey}</h3><p>{message}</p><p className="verification-input">{inputSummary}</p><small>{run.id}・{run.createdAt}</small></div><strong>{run.rewardPoints > 0 ? `+${run.rewardPoints} 綠點` : "無點數異動"}</strong></article>;
        })}</div>}
      </Panel>
    </div>
  );
}

function InstitutionReportPage({
  onDownload,
  outcomes,
  projects,
  programs,
  resourceRedemptions,
  onVerify,
}: {
  onDownload: () => void;
  outcomes: BackendSnapshot["outcomeReports"];
  projects: LocalProject[];
  programs: IncentiveProgram[];
  resourceRedemptions: BackendSnapshot["resourceRedemptions"];
  onVerify: (reportId: number) => void;
}) {
  const totalBudget = programs.reduce((sum, program) => sum + program.budgetPoints, 0);
  const participants = programs.reduce((sum, program) => sum + Number(program.participants.replace(/[^0-9]/g, "") || 0), 0);
  const verified = outcomes.filter((report) => report.status === "verified");
  const carbonKg = verified.reduce((sum, report) => sum + Number(report.carbonKg ?? 0), 0);
  const farmerCount = new Set(resourceRedemptions.map((item) => item.farmerId)).size;
  const reportData = programs.length ? programs.map((program) => ({ month: program.name, funds: program.budgetPoints })) : [{ month: "尚無計畫", funds: 0 }];
  const hasReportData = programs.length > 0 || outcomes.length > 0 || resourceRedemptions.length > 0;
  return (
    <>
      <div className="metrics"><Metric icon={HandCoins} value={`${totalBudget.toLocaleString()} 點`} label="計畫綠點預算" delta={`${programs.length} 項計畫`} /><Metric icon={Users} value={participants.toLocaleString()} label="計畫參與人次" delta="依帳戶資料" /><Metric icon={Sprout} value={`${farmerCount} 戶`} label="履約涉及小農" delta={`${resourceRedemptions.length} 筆兌換`} /><Metric icon={Trees} value={`${(carbonKg / 1000).toLocaleString()} 噸`} label="已驗證減碳成果" delta={`${verified.length} 筆成果`} /></div>
      <div className="dashboard-grid">
        <Panel className="span-12 outcome-review-panel" title="小農成果回報審核" note="核對節水、減碳與受益資料後，通過的成果會更新至資訊揭露與 ESG 報告">
          {outcomes.length === 0 ? <div className="empty-receipt"><span><FileCheck2 /></span><h3>目前沒有待審成果</h3><p>小農送出改善專案成果後會顯示在這裡。</p></div> : <div className="outcome-review-list">{outcomes.map((report) => {
            const project = projects.find((item) => item.id === report.projectId);
            return <article key={report.id}><div><span className={`status-pill ${report.status === "verified" ? "" : "waiting"}`}>{report.status === "verified" ? "已通過" : "待審核"}</span><h3>{project?.title ?? report.projectId}</h3><p>{report.note}</p><small>節水 {report.waterLiters?.toLocaleString() ?? 0} 公升・減碳 {report.carbonKg?.toLocaleString() ?? 0} kg CO₂e・受益 {report.beneficiaries ?? 0} 人／戶</small></div>{report.status !== "verified" && <button className="button button-primary" onClick={() => onVerify(report.id)}><BadgeCheck />審核通過</button>}</article>;
          })}</div>}
        </Panel>
        <Panel className="span-8 subpage-primary" title="綠點激勵投入" note="目前登入單位各項計畫預算"><Chart><BarChart data={reportData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="funds" name="計畫預算" fill="#2d7250" radius={[8, 8, 0, 0]} /></BarChart></Chart></Panel>
        <Panel className="span-4" title="ESG 成果摘要" note="供銀行、政府與企業揭露及持續追蹤"><div className="report-highlights"><div><span><Trees /></span><p><b>環境面</b><small>節能家電、低碳交通、節水與減藥行動持續累積</small></p></div><div><span><Users /></span><p><b>社會面</b><small>在地小農收入、農業資源與地方供應鏈受益</small></p></div><div><span><PackageCheck /></span><p><b>治理面</b><small>點數來源、流向、履歷與成果保留可追溯紀錄</small></p></div></div></Panel>
        <Panel className="span-12" title="可揭露成果範圍" note="平台提供績效證據；正式 ESG 評分仍依採用準則及評鑑機構認定" action={<button className="button button-primary" disabled={!hasReportData} onClick={onDownload}><Download />{hasReportData ? "下載正式版 PDF" : "尚無資料可下載"}</button>}><div className="pdf-report-preview"><span>PDF</span><div><b>目前登入單位的綠色消費與在地小農影響力摘要</b><small>{hasReportData ? "依本帳戶計畫、履約與成果紀錄彙整" : "建立計畫或完成成果審核後即可產生報告"}</small></div><em>GFES ACCOUNT REPORT</em></div><div className="table-wrap"><table className="mobile-card-table report-table"><thead><tr><th>成果面向</th><th>本期成果</th><th>資料來源</th><th>更新頻率</th></tr></thead><tbody><tr><td>綠點激勵參與</td><td>{participants.toLocaleString()} 人次</td><td>本帳戶激勵計畫</td><td>即時</td></tr><tr><td>計畫綠點預算</td><td>{totalBudget.toLocaleString()} 點</td><td>本帳戶計畫紀錄</td><td>即時</td></tr><tr><td>履約涉及小農</td><td>{farmerCount} 戶</td><td>農業資源兌換紀錄</td><td>即時</td></tr><tr><td>已驗證減碳成果</td><td>{(carbonKg / 1000).toLocaleString()} 噸 CO₂e</td><td>通過審核的成果回報</td><td>每次審核</td></tr></tbody></table></div></Panel>
      </div>
    </>
  );
}

function Panel({
  title,
  note,
  action,
  className = "",
  children,
}: {
  title: string;
  note: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head"><div><h2>{title}</h2><p>{note}</p></div>{action}</header>
      {children}
    </section>
  );
}

function Chart({ children }: { children: React.ReactElement }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function Metric({ icon: Icon, value, label, delta }: { icon: typeof Users; value: string; label: string; delta: string }) {
  return (
    <article className="metric">
      <div><span><Icon /></span><small>{delta}</small></div>
      <strong>{value}</strong><p>{label}</p>
    </article>
  );
}

function ActionModal({
  item,
  done,
  balance,
  defaultShipping,
  onClose,
  onConfirm,
}: {
  item: LocalProject;
  done: boolean;
  balance: number;
  defaultShipping?: ShippingDetails;
  onClose: () => void;
  onConfirm: (shippingDetails?: ShippingDetails) => void;
}) {
  const insufficient = !done && balance < item.points;
  const isSupport = item.kind === "support";
  const supportUnavailable = isSupport && Boolean(item.status) && item.status !== "funding" && !done;
  const supportStatusLabel = item.status === "review" ? "專案審核中" : item.status === "completed" ? "專案已完成" : "專案已下架";
  const [shipping, setShipping] = useState<ShippingDetails>(defaultShipping ?? { recipientName: "", recipientPhone: "", postalCode: "", shippingCity: "", shippingDistrict: "", shippingAddress: "", deliveryNote: "" });
  const shippingComplete = Boolean(shipping.recipientName.trim() && shipping.recipientPhone.trim() && shipping.shippingCity.trim() && shipping.shippingDistrict.trim() && shipping.shippingAddress.trim());
  return (
    <ModalShell title={isSupport ? "支持小農改善專案" : "兌換小農好物與填寫包裹資料"} onClose={onClose} small={isSupport} wide={!isSupport}>
      <div className="action-project">
        <img src={item.image} alt={item.title} />
        <div><small>{item.farmer}</small><h3>{item.title}</h3><p>{item.note}</p></div>
      </div>
      <div className="receipt-box"><Row label={isSupport ? "支持綠點" : "兌換綠點"} value={`${item.points} 點`} /><Row label="目前可用" value={`${balance.toLocaleString()} 點`} />{isSupport && item.targetPoints && <Row label="專案募資" value={`${(item.raisedPoints ?? 0).toLocaleString()}／${item.targetPoints.toLocaleString()} 點`} />}<Row label={isSupport ? "資源用途" : "配送方式"} value={item.purpose} /><Row label="預期成果" value={item.impact} /></div>
      {!isSupport && !done && <section className="shipping-form-section"><header><span><Truck /></span><div><h3>包裹收件資料</h3><p>完成填寫後才會扣除綠點並建立訂單。</p></div></header><div className="form-grid shipping-form-grid">
        <label>收件人<input value={shipping.recipientName} onChange={(event) => setShipping((current) => ({ ...current, recipientName: event.target.value }))} /></label>
        <label>聯絡電話<input inputMode="tel" value={shipping.recipientPhone} onChange={(event) => setShipping((current) => ({ ...current, recipientPhone: event.target.value }))} /></label>
        <label>郵遞區號<input inputMode="numeric" value={shipping.postalCode} onChange={(event) => setShipping((current) => ({ ...current, postalCode: event.target.value }))} /></label>
        <label>縣市<input value={shipping.shippingCity} onChange={(event) => setShipping((current) => ({ ...current, shippingCity: event.target.value }))} /></label>
        <label>行政區<input value={shipping.shippingDistrict} onChange={(event) => setShipping((current) => ({ ...current, shippingDistrict: event.target.value }))} /></label>
        <label className="full">詳細地址<input value={shipping.shippingAddress} onChange={(event) => setShipping((current) => ({ ...current, shippingAddress: event.target.value }))} /></label>
        <label className="full">配送備註<textarea rows={3} value={shipping.deliveryNote} onChange={(event) => setShipping((current) => ({ ...current, deliveryNote: event.target.value }))} placeholder="例如：送達前請先電話聯絡、管理室代收" /></label>
      </div></section>}
      {insufficient && <div className="points-insufficient"><span>綠點不足</span><b>還差 {(item.points - balance).toLocaleString()} 點</b><small>可先回傳綠色消費證明取得更多綠點。</small></div>}
      {supportUnavailable && <div className="points-insufficient"><span>{supportStatusLabel}</span><b>目前不開放新的綠點支持</b><small>待專案恢復募集中後，系統才會重新開放支持。</small></div>}
      <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={() => onConfirm(isSupport || done ? undefined : shipping)} disabled={supportUnavailable || insufficient || (!isSupport && !done && !shippingComplete)}>{done ? (isSupport ? "查看影響力收據" : "查看兌換狀態") : supportUnavailable ? supportStatusLabel : insufficient ? "綠點不足" : isSupport ? `確認支持 ${item.points} 點` : !shippingComplete ? "請完成包裹資料" : `確認兌換 ${item.points} 點`}</button></div>
    </ModalShell>
  );
}

function Project({
  image,
  title,
  note,
  progress,
  button,
  onClick,
  onLearnMore,
  gold,
}: {
  image: string;
  title: string;
  note: string;
  progress: number;
  button: string;
  onClick: () => void;
  onLearnMore: () => void;
  gold?: boolean;
}) {
  return (
    <article className="project">
      <img src={image} alt={title} />
      <div><h3>{title}</h3><p>{note}</p><div className="progress"><span style={{ width: `${progress}%` }} /></div></div>
      <div className="project-actions">
        <button className="button button-secondary" onClick={onLearnMore}>了解更多</button>
        <button className={`button ${gold ? "button-gold" : "button-primary"}`} onClick={onClick}>{button}</button>
      </div>
    </article>
  );
}

function Activity({ icon: Icon, title, note, value }: { icon: typeof Store; title: string; note: string; value: string }) {
  return (
    <div className="activity"><span><Icon /></span><div><b>{title}</b><small>{note}</small></div><time>{value}</time></div>
  );
}

function Evidence({ title, note, done }: { title: string; note: string; done: boolean }) {
  return (
    <div className="evidence"><span className={done ? "done" : ""} /><div><b>{title}</b><small>{note}</small></div><em>{done ? "已完成" : "待補件"}</em></div>
  );
}

function Offer({
  category,
  name,
  amount,
  term,
  rate,
  description,
  purpose,
  requiredScore,
  currentScore,
  onClick,
  recommended = false,
}: {
  category: string;
  name: string;
  amount: string;
  term: string;
  rate: string;
  description: string;
  purpose: string;
  requiredScore: number;
  currentScore: number;
  onClick: () => void;
  recommended?: boolean;
}) {
  const locked = currentScore < requiredScore;
  const gap = Math.max(requiredScore - currentScore, 0);
  return (
    <article className={`offer ${locked ? "locked" : ""}`}>
      <div className="offer-kicker"><span className="support">{category}</span><span className={`offer-status ${locked ? "locked" : ""}`}>{locked ? <LockKeyhole /> : <CheckCircle2 />}{locked ? "餘額不足" : recommended ? "推薦兌換" : "可兌換"}</span></div>
      <header className="offer-header"><b>{name}</b><small>{requiredScore.toLocaleString()} 綠點</small></header>
      <p className="offer-description">{description}</p>
      <div className="offer-data"><small>兌換點數<b>{amount}</b></small><small>領取方式<b>{term}</b></small></div>
      <div className="offer-rate">{rate}</div>
      {locked ? <><div className="locked-benefit"><LockKeyhole /><span><b>還差 {gap.toLocaleString()} 點</b><small>{purpose}</small></span></div><div className="unlock-progress"><div><span>目前 {currentScore.toLocaleString()} 點</span><b>需要 {requiredScore.toLocaleString()} 點</b></div><div className="progress"><span style={{ width: `${Math.min((currentScore / requiredScore) * 100, 100)}%` }} /></div></div></> : <div className="offer-threshold"><BadgeCheck />目前餘額足夠，由合作農會提供</div>}
      <button className={`button button-block ${locked ? "button-locked" : "button-secondary"}`} onClick={onClick}>{locked ? <LockKeyhole /> : <ChevronRight />}{locked ? "查看所需點數" : "查看並兌換"}</button>
    </article>
  );
}

function InvoiceModal({
  stage,
  rewardPoints,
  invoice,
  onVerify,
  onClose,
}: {
  stage: "form" | "scanning" | "success";
  rewardPoints: number;
  invoice: InvoiceVerificationInput | null;
  onVerify: (input: InvoiceVerificationInput) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="回傳消費證明" onClose={onClose} wide>
      {stage === "success" ? (
        <Success title={`驗證完成，獲得 ${rewardPoints} 綠點`} text="這筆友善農產消費已通過平台驗證，綠點已加入你的錢包。">
          {invoice && <div className="receipt-box invoice-verification-summary"><Row label="已送出發票" value={invoice.invoiceNumber} /><Row label="消費日期" value={invoice.transactionDate} /><Row label="消費金額" value={`NT$ ${invoice.amount.toLocaleString()}`} /></div>}
          <button className="button button-primary button-block" onClick={onClose}>回到綠點錢包</button>
        </Success>
      ) : stage === "scanning" ? (
        <Success title="正在驗證發票" text="平台正在核對發票日期、號碼、消費金額與綠色消費資格。">
          <div className="progress"><span style={{ width: "76%" }} /></div>
        </Success>
      ) : <InvoiceEntryContent onVerify={onVerify} />}
    </ModalShell>
  );
}

function ReceiptModal({
  supported,
  item,
  onDownload,
  onExplore,
  onClose,
}: {
  supported: boolean;
  item: LocalProject;
  onDownload: () => void;
  onExplore: () => void;
  onClose: () => void;
}) {
  if (!supported) {
    return (
      <ModalShell title="影響力收據" onClose={onClose} small>
        <div className="empty-receipt"><span><FileCheck2 /></span><h3>第一張影響力收據等你完成</h3><p>支持任一小農改善專案後，就能在這裡追蹤綠點流向、專案進度與地方成果。</p></div>
        <button className="button button-primary button-block" onClick={onExplore}>前往「用綠點支持在地」</button>
      </ModalShell>
    );
  }
  return (
    <ModalShell title="你的影響力收據" onClose={onClose}>
      <div className="impact-receipt">
        <div className="receipt-hero">
          <div><small>GFES IMPACT RECEIPT</small><h3>{item.points} 綠點，正在地方產生改變</h3><p>{item.title}</p></div>
          <span><Leaf /></span>
        </div>
        <div className="impact-flow">
          <div><User /><b>你的綠色消費</b></div><ArrowRight /><div><HandCoins /><b>{item.points} 綠點</b></div><ArrowRight /><div><Sprout /><b>{item.farmer}</b></div>
        </div>
        <div className="receipt-metrics">
          <article><strong>{item.points}</strong><span>投入綠點</span></article>
          <article><strong>100%</strong><span>投入專案用途</span></article>
          <article><strong>{item.impact.match(/\d+(?:\.\d+)?%?/)?.[0] || "追蹤中"}</strong><span>預估環境成果</span></article>
        </div>
        <div className="receipt-story-grid">
          <section>
            <h4>資源如何被使用</h4>
            {(item.allocations ?? [{ label: "設備與材料", percent: 55 }, { label: "施工與改善", percent: 30 }, { label: "成果追蹤", percent: 15 }]).map(({ label, percent }) => <div className="allocation" key={label}><span><b>{label}</b><em>{percent}%</em></span><div className="progress"><i style={{ width: `${percent}%` }} /></div></div>)}
          </section>
          <section>
            <h4>專案里程碑</h4>
            <div className="receipt-timeline">
              <div className="done"><span><Check /></span><p><b>綠點支持完成</b><small>2026/07/31</small></p></div>
              <div className="active"><span>2</span><p><b>採購與改善進行中</b><small>預計 2026/08 完成</small></p></div>
              <div><span>3</span><p><b>成果驗證與回報</b><small>完成後更新成果透明度</small></p></div>
            </div>
          </section>
        </div>
        <footer className="receipt-footer"><span>收據編號 {getReceiptNumber(item)}</span><b>每一次消費，都是地方改變的起點。</b></footer>
      </div>
      <div className="modal-actions"><button className="button button-secondary" onClick={onDownload}><Download />下載收據</button><button className="button button-secondary" onClick={onExplore}><HeartHandshake />回到支持在地</button><button className="button button-primary" onClick={onClose}>完成</button></div>
    </ModalShell>
  );
}

function EvidenceModal({ added, onClose, onSubmit }: { added: boolean; onClose: () => void; onSubmit: () => void }) {
  return (
    <ModalShell title="補充低碳作業證明" onClose={onClose} small>
      {added ? (
        <Success title="證明已完成平台驗證" text="成果透明度已由 82% 提升至 86%，地方合作條件同步更新。">
          <button className="button button-primary button-block" onClick={onClose}>返回成果總覽</button>
        </Success>
      ) : (
        <>
          <div className="upload-box"><Upload /><b>低碳設備使用紀錄.pdf</b><small>請確認文件內容後送出</small></div>
          <div className="receipt-box"><Row label="設備" value="節水灌溉控制器" /><Row label="使用期間" value="2026/04–2026/07" /><Row label="預估透明度" value="82 → 86" /></div>
          <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={onSubmit}>送出並驗證</button></div>
        </>
      )}
    </ModalShell>
  );
}

function ImprovementProjectModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: ImprovementProjectDraft) => void }) {
  const [title, setTitle] = useState("節能溫室通風改善");
  const [note, setNote] = useState("夏季溫室溫度過高，作物容易熱傷；計畫導入節能循環風扇與自動通風控制，降低耗損與用電。");
  const [purpose, setPurpose] = useState("節能循環風扇、控制器與安裝");
  const [pointsValue, setPointsValue] = useState(200);
  const [targetPoints, setTargetPoints] = useState(24000);
  const [impact, setImpact] = useState("預估降低溫室用電 15%");
  const [city, setCity] = useState("雲林縣");
  const [district, setDistrict] = useState("斗六市");
  const [distance, setDistance] = useState(205);
  const [completionDate, setCompletionDate] = useState("2026-12-31");
  const [proof, setProof] = useState("產銷履歷與友善耕作紀錄");
  const [materialPercent, setMaterialPercent] = useState(60);
  const [executionPercent, setExecutionPercent] = useState(25);
  const [trackingPercent, setTrackingPercent] = useState(15);
  const [quote, setQuote] = useState("希望把溫室降溫做得更省電，也讓每一筆改善都有資料可以追蹤。");
  const allocationTotal = materialPercent + executionPercent + trackingPercent;

  function submit() {
    if (!title.trim() || !note.trim() || !purpose.trim() || !impact.trim() || allocationTotal !== 100) return;
    onSubmit({
      title: title.trim(),
      note: note.trim(),
      purpose: purpose.trim(),
      points: Math.max(1, pointsValue),
      targetPoints: Math.max(1, targetPoints),
      impact: impact.trim(),
      city: city.trim(),
      district: district.trim(),
      distance: Math.max(1, distance),
      completionDate,
      proof,
      allocations: [
        { label: "設備與材料", percent: Math.max(0, materialPercent) },
        { label: "施工與執行", percent: Math.max(0, executionPercent) },
        { label: "成果追蹤", percent: Math.max(0, trackingPercent) },
      ],
      story: {
        location: `${city.trim()}・${district.trim()}`,
        headline: `阿蘭希望透過「${title.trim()}」，讓產地改善有清楚目標與公開進度`,
        quote: quote.trim(),
        paragraphs: [note.trim(), `募集的綠點將投入${purpose.trim()}，預計於 ${completionDate} 前完成，並以「${impact.trim()}」持續回報成果。`],
      },
    });
  }

  return (
    <ModalShell title="建立小農改善專案" onClose={onClose} wide>
      <div className="invoice-helper"><span><HeartHandshake /></span><div><b>把田間改善計畫公開給消費者支持</b><small>送出後會立即出現在小農專案管理與消費者「支持在地」募資區</small></div></div>
      <div className="form-grid application-form improvement-project-form">
        <label className="full">專案名稱<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="full">目前問題與改善方式<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label className="full">綠點主要用途<input value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
        <label>消費者每次支持點數<input type="number" min="1" value={pointsValue} onChange={(event) => setPointsValue(Number(event.target.value))} /></label>
        <label>專案募集目標<input type="number" min="1" value={targetPoints} onChange={(event) => setTargetPoints(Number(event.target.value))} /></label>
        <label className="full">預期成果<input value={impact} onChange={(event) => setImpact(event.target.value)} /></label>
        <label>縣市<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label>鄉鎮市區<input value={district} onChange={(event) => setDistrict(event.target.value)} /></label>
        <label>距離台北大安區約幾公里<input type="number" min="1" value={distance} onChange={(event) => setDistance(Number(event.target.value))} /></label>
        <label>預計完成日期<input type="date" value={completionDate} onChange={(event) => setCompletionDate(event.target.value)} /></label>
        <label className="full">可信資料<select value={proof} onChange={(event) => setProof(event.target.value)}><option>產銷履歷與友善耕作紀錄</option><option>無農藥檢測報告</option><option>農會輔導與設備估價單</option><option>有機驗證資料</option></select></label>
      </div>
      <section className="project-allocation-editor">
        <div><h4>綠點如何支持產地</h4><p>三項用途比例合計需為 100%，消費者與影響力收據都會看到。</p></div>
        <div className="allocation-input-grid">
          <label>設備與材料<input type="number" min="0" max="100" value={materialPercent} onChange={(event) => setMaterialPercent(Number(event.target.value))} /><span>%</span></label>
          <label>施工與執行<input type="number" min="0" max="100" value={executionPercent} onChange={(event) => setExecutionPercent(Number(event.target.value))} /><span>%</span></label>
          <label>成果追蹤<input type="number" min="0" max="100" value={trackingPercent} onChange={(event) => setTrackingPercent(Number(event.target.value))} /><span>%</span></label>
        </div>
        <b className={allocationTotal === 100 ? "allocation-total valid" : "allocation-total"}>目前合計 {allocationTotal}% {allocationTotal === 100 ? "・可公開" : "・請調整為 100%"}</b>
      </section>
      <label className="project-quote-field">想對支持者說的話<textarea value={quote} onChange={(event) => setQuote(event.target.value)} /></label>
      <div className="project-plan-preview"><span>公開後的募資摘要</span><strong>{title || "未命名專案"}</strong><p>每次支持 {Math.max(1, pointsValue).toLocaleString()} 點・目標 {Math.max(1, targetPoints).toLocaleString()} 點・{city}{district}・預計 {completionDate} 完成</p></div>
      <p className="fine-print">建立後會保存到後台，並立即出現在消費者的小農改善專案頁。</p>
      <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={submit} disabled={!title.trim() || !note.trim() || !purpose.trim() || !impact.trim() || allocationTotal !== 100}><HeartHandshake />確認公開募資</button></div>
    </ModalShell>
  );
}

function OutcomeReportModal({
  project,
  onClose,
  onSubmit,
}: {
  project: LocalProject | undefined;
  onClose: () => void;
  onSubmit: (values: { waterLiters: number; carbonKg: number; beneficiaries: number; note: string }) => void;
}) {
  const [waterLiters, setWaterLiters] = useState(12000);
  const [carbonKg, setCarbonKg] = useState(860);
  const [beneficiaries, setBeneficiaries] = useState(24);
  const [note, setNote] = useState("改善設備已完成安裝，並附上本期用水、用電及受益農戶紀錄。");
  return (
    <ModalShell title="提交改善專案成果回報" onClose={onClose} wide>
      <div className="form-stack">
        <div className="receipt-box"><Row label="專案" value={project?.title ?? "小農改善專案"} /><Row label="目前進度" value={`${project?.progress ?? 0}%`} /></div>
        <div className="form-grid">
          <label>節水量（公升）<input type="number" min="0" value={waterLiters} onChange={(event) => setWaterLiters(Number(event.target.value))} /></label>
          <label>減碳量（kg CO₂e）<input type="number" min="0" value={carbonKg} onChange={(event) => setCarbonKg(Number(event.target.value))} /></label>
          <label>受益人數／農戶<input type="number" min="0" value={beneficiaries} onChange={(event) => setBeneficiaries(Number(event.target.value))} /></label>
        </div>
        <label>成果說明<textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <p className="fine-print">送出後會進入機構後台審核；通過後專案狀態與影響力資料會同步更新。</p>
        <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={() => onSubmit({ waterLiters, carbonKg, beneficiaries, note })}>送出成果回報</button></div>
      </div>
    </ModalShell>
  );
}

function LocalActionRegistrationModal({
  action,
  defaultName,
  defaultPhone,
  defaultEmail,
  busy,
  onClose,
  onSubmit,
}: {
  action?: BackendSnapshot["localActions"][number];
  defaultName: string;
  defaultPhone: string;
  defaultEmail: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: LocalActionRegistrationDraft) => Promise<void>;
}) {
  const [attendeeName, setAttendeeName] = useState(defaultName);
  const [attendeePhone, setAttendeePhone] = useState(defaultPhone);
  const [attendeeEmail, setAttendeeEmail] = useState(defaultEmail);
  const [participantCount, setParticipantCount] = useState(1);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || !consent) return;
    void onSubmit({
      attendeeName: attendeeName.trim(),
      attendeePhone: attendeePhone.trim(),
      attendeeEmail: attendeeEmail.trim(),
      participantCount,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      note: note.trim(),
    });
  }

  return (
    <ModalShell title="填寫綠色行動報名資料" onClose={onClose} wide>
      {!action ? <p className="admin-alert">找不到活動資料，請關閉後重新選擇。</p> : <form className="local-action-registration-form" onSubmit={submit}>
        <section className="registration-event-summary">
          <span><CalendarDays /></span>
          <div><small>{action.organizer}</small><h3>{action.title}</h3><p>{formatActivitySchedule(action.eventStart, action.eventEnd)}</p><b><MapPin />{action.address}</b></div>
          <strong>完成後 +{action.rewardPoints} 點</strong>
        </section>
        <div className="form-grid application-form">
          <label>參加人姓名<input value={attendeeName} onChange={(event) => setAttendeeName(event.target.value)} maxLength={80} required /></label>
          <label>參加人數<input type="number" min="1" max="10" value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value))} required /></label>
          <label>聯絡電話<input type="tel" value={attendeePhone} onChange={(event) => setAttendeePhone(event.target.value)} placeholder="例：0912-345-678" pattern="[0-9+()\-\s]{8,30}" required /></label>
          <label>電子信箱<input type="email" value={attendeeEmail} onChange={(event) => setAttendeeEmail(event.target.value)} required /></label>
          <label>緊急聯絡人<input value={emergencyContactName} onChange={(event) => setEmergencyContactName(event.target.value)} maxLength={80} required /></label>
          <label>緊急聯絡電話<input type="tel" value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} placeholder="例：02-2345-6789" pattern="[0-9+()\-\s]{8,30}" required /></label>
          <label className="full">備註與參加需求 <small>選填，可填飲食、接駁或無障礙需求</small><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} /></label>
        </div>
        <label className="registration-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>我已確認活動時間、集合地點及報名資料，並同意主辦單位僅為本次活動聯絡使用。</span></label>
        <p className="fine-print">送出後資料會保存於您的報名紀錄；完成活動仍需依主辦單位規定提交證明，經審核後才發放綠點。</p>
        <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>取消</button><button type="submit" className="button button-primary" disabled={busy || !consent}>{busy ? "正在送出…" : "確認資料並完成報名"}</button></div>
      </form>}
    </ModalShell>
  );
}

function ProgramModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: IncentiveProgramDraft) => void }) {
  const [name, setName] = useState("社區節能行動加碼");
  const [sponsor, setSponsor] = useState("企業 ESG 計畫");
  const [action, setAction] = useState("完成指定節能行動並上傳證明");
  const [rewardPoints, setRewardPoints] = useState(300);
  const [budgetPoints, setBudgetPoints] = useState(50000);
  const [participantCount, setParticipantCount] = useState(1000);
  const [participantUnit, setParticipantUnit] = useState("人");
  const [esg, setEsg] = useState("能源效率");

  function submit() {
    if (!name.trim() || !sponsor.trim() || !action.trim()) return;
    onSubmit({
      name: name.trim(),
      sponsor: sponsor.trim(),
      activityDescription: action.trim(),
      rewardPoints: Math.max(1, rewardPoints),
      budgetPoints: Math.max(1, budgetPoints),
      participantCount: Math.max(1, participantCount),
      participantUnit,
      esg,
    });
  }

  return (
    <ModalShell title="建立綠點激勵計畫" onClose={onClose}>
      <div className="invoice-helper"><span><PackageCheck /></span><div><b>手動建立新的激勵任務</b><small>送出後會立即加入計畫列表，並同步更新計畫數與綠點預算</small></div></div>
      <div className="form-grid application-form">
        <label className="full">計畫名稱<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="full">主辦／合作單位<input value={sponsor} onChange={(event) => setSponsor(event.target.value)} /></label>
        <label className="full">參與行動<textarea value={action} onChange={(event) => setAction(event.target.value)} /></label>
        <label>每次回饋綠點<input type="number" min="1" value={rewardPoints} onChange={(event) => setRewardPoints(Number(event.target.value))} /></label>
        <label>計畫綠點預算<input type="number" min="1" value={budgetPoints} onChange={(event) => setBudgetPoints(Number(event.target.value))} /></label>
        <label>預計參與數<input type="number" min="1" value={participantCount} onChange={(event) => setParticipantCount(Number(event.target.value))} /></label>
        <label>參與對象單位<select value={participantUnit} onChange={(event) => setParticipantUnit(event.target.value)}><option>人</option><option>戶</option><option>家企業</option><option>間門市</option></select></label>
        <label className="full">ESG 成果面向<select value={esg} onChange={(event) => setEsg(event.target.value)}><option>能源效率</option><option>氣候行動</option><option>責任消費</option><option>地方共好</option><option>永續經濟</option></select></label>
      </div>
      <div className="receipt-box"><Row label="回饋規則" value={`每次 ${Math.max(1, rewardPoints).toLocaleString()} 點`} /><Row label="計畫預算" value={`${Math.max(1, budgetPoints).toLocaleString()} 點`} /><Row label="預計參與" value={`${Math.max(1, participantCount).toLocaleString()} ${participantUnit}`} /></div>
      <p className="fine-print">新計畫會保存到後台，供銀行／政府／企業持續管理。</p>
      <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={submit} disabled={!name.trim() || !sponsor.trim() || !action.trim()}><CheckCircle2 />確認建立計畫</button></div>
    </ModalShell>
  );
}
function ProductModal({ product, onClose, onSubmit }: { product: FarmerProduct | null; onClose: () => void; onSubmit: (values: Omit<FarmerProduct, "id" | "image">) => void }) {
  const [title, setTitle] = useState(product?.title ?? "當季友善蔬果箱");
  const [pointsValue, setPointsValue] = useState(product?.points ?? 420);
  const [stock, setStock] = useState(product?.stock ?? 20);
  const [unit, setUnit] = useState(product?.unit ?? "箱");
  const [proof, setProof] = useState(product?.proof ?? "產銷履歷 TAP-26-0718");
  const [delivery, setDelivery] = useState(product?.delivery ?? "雲林縣與鄰近 40 公里");
  const [description, setDescription] = useState(product?.description ?? "依本週收成搭配 5–7 種友善耕作蔬果，減塑包裝並附產地批次資訊。");

  function submit() {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), points: Math.max(1, pointsValue), stock: Math.max(0, stock), unit, proof, delivery, description });
  }

  return (
    <ModalShell title={product ? "編輯商品" : "上架新商品"} onClose={onClose}>
      <div className="invoice-helper"><span>{product ? <PackageCheck /> : <ShoppingBasket />}</span><div><b>{product ? `正在管理：${product.title}` : "建立新的小農商品"}</b><small>儲存後，商品列表、兌換綠點與庫存會立即更新</small></div></div>
      <div className="form-grid application-form">
        <label className="full">商品名稱<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>兌換綠點<input type="number" value={pointsValue} min="1" onChange={(event) => setPointsValue(Number(event.target.value))} /></label>
        <label>可售庫存<input type="number" value={stock} min="0" onChange={(event) => setStock(Number(event.target.value))} /></label>
        <label>庫存單位<select value={unit} onChange={(event) => setUnit(event.target.value)}><option>箱</option><option>包</option><option>組</option><option>份</option></select></label>
        <label>永續證明<select value={proof} onChange={(event) => setProof(event.target.value)}><option>產銷履歷 TAP-26-0718</option><option>無農藥檢測合格</option><option>友善耕作紀錄</option><option>有機驗證資料</option></select></label>
        <label className="full">配送區域<select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option>雲林縣與鄰近 40 公里</option><option>全台冷藏配送</option><option>全台常溫配送</option><option>農場自取</option></select></label>
        <label className="full">商品說明<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      </div>
      <div className="receipt-box"><Row label="消費者兌換價格" value={`${Math.max(1, pointsValue).toLocaleString()} 綠點`} /><Row label="目前可售數量" value={`${Math.max(0, stock)} ${unit}`} /><Row label="配送方式" value={delivery} /></div>
      <p className="fine-print">商品資料會保存到後台，庫存與兌換點數會同步到消費者目錄。</p>
      <div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={submit} disabled={!title.trim()}><CheckCircle2 />{product ? "儲存商品變更" : "確認上架新品"}</button></div>
    </ModalShell>
  );
}

function OfferModal({ balance, offerId, step, setStep, onRedeem, onClose }: { balance: number; offerId: string; step: number; setStep: (step: number) => void; onRedeem: (values: ResourceRedemptionDraft, confirmedByCheckbox?: boolean) => Promise<boolean>; onClose: () => void }) {
  const offer = farmerBenefits.find((item) => item.id === offerId) || farmerBenefits[0];
  const locked = balance < offer.requiredScore;
  const gap = Math.max(offer.requiredScore - balance, 0);
  const steps = ["資源確認", "領取資料", "兌換確認"];
  const defaultFulfillmentType: ResourceRedemptionDraft["fulfillmentType"] = offer.category === "農具兌換" ? "delivery" : "appointment";
  const [request, setRequest] = useState<ResourceRedemptionDraft>({ cooperative: "雲林縣斗六市農會", contactName: "林禾日", contactPhone: "0912-345-678", fulfillmentType: defaultFulfillmentType, deliveryAddress: "雲林縣斗六市禾日友善農園（產地收貨區）", appointmentDate: "2026-08-18", appointmentSlot: "上午 09:00–12:00", note: offer.planText });
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const requestComplete = Boolean(request.cooperative.trim() && request.contactName.trim() && request.contactPhone.trim() && (request.fulfillmentType === "delivery" ? request.deliveryAddress.trim() : request.appointmentDate && request.appointmentSlot));

  function goToNextStep() {
    const nextLabel = steps[step + 1];
    if (!window.confirm(`流程步驟確認\n\n確認目前資料正確，並進入「${nextLabel}」？`)) return;
    setStep(step + 1);
  }

  if (locked) return <ModalShell title="農會農業資源兌換" onClose={onClose} small><div className="unlock-hero"><span className="unlock-orb"><LockKeyhole /></span><div><small>目前小農綠點</small><strong>{balance.toLocaleString()} 點</strong><p>還差 {gap.toLocaleString()} 點，即可兌換「{offer.name}」。</p></div></div><div className="receipt-box"><Row label="所需綠點" value={`${offer.requiredScore.toLocaleString()} 點`} /><Row label="合作單位" value={offer.rate} /><Row label="適用用途" value={offer.purpose} /></div><button className="button button-primary button-block" onClick={onClose}>返回累積綠點</button></ModalShell>;

  if (step === 3) return <ModalShell title="農會農業資源兌換" onClose={onClose} small><Success title="兌換申請與收據已建立" text={request.fulfillmentType === "delivery" ? "合作農會將確認配送資料，可在兌換紀錄查看物流進度。" : `已預約 ${request.appointmentDate} ${request.appointmentSlot}，可在兌換紀錄查看排程。`} /><div className="application-timeline"><div className="done"><span><Check /></span><p><b>綠點扣抵與收據建立</b><small>今天</small></p></div><div className="active"><span>2</span><p><b>農會確認</b><small>預估 1–2 個工作天</small></p></div><div><span>3</span><p><b>{request.fulfillmentType === "delivery" ? "備貨與配送" : "預約服務"}</b><small>依兌換紀錄持續更新</small></p></div></div><button className="button button-primary button-block" onClick={onClose}>查看兌換紀錄</button></ModalShell>;

  return <ModalShell title="農會農業資源兌換" onClose={onClose}>
    <div className="application-stepper">{steps.map((label, index) => <div className={index <= step ? "active" : ""} key={label}><span>{index < step ? <Check /> : index + 1}</span><b>{label}</b></div>)}</div>
    {step === 0 && <div className="application-layout"><div className="application-offer"><span className="offer-status"><CheckCircle2 />餘額足夠・{offer.category}</span><h3>{offer.name}</h3><p>{offer.description}</p><div><span>所需綠點<b>{offer.requiredScore.toLocaleString()} 點</b></span><span>提供單位<b>{offer.rate}</b></span><span>領取方式<b>{offer.term}</b></span></div></div><div className="receipt-box"><Row label="目前餘額" value={`${balance.toLocaleString()} 點`} /><Row label="兌換後餘額" value={`${(balance - offer.requiredScore).toLocaleString()} 點`} /><Row label="適用用途" value={offer.purpose} /></div></div>}
    {step === 1 && <div className="form-grid application-form"><label className="full">承辦農會<select value={request.cooperative} onChange={(event) => setRequest((current) => ({ ...current, cooperative: event.target.value }))}><option>雲林縣斗六市農會</option><option>雲林縣古坑鄉農會</option></select></label><label>聯絡人<input value={request.contactName} onChange={(event) => setRequest((current) => ({ ...current, contactName: event.target.value }))} /></label><label>聯絡電話<input value={request.contactPhone} onChange={(event) => setRequest((current) => ({ ...current, contactPhone: event.target.value }))} /></label><label className="full">履約方式<select value={request.fulfillmentType} onChange={(event) => setRequest((current) => ({ ...current, fulfillmentType: event.target.value as ResourceRedemptionDraft["fulfillmentType"] }))}><option value="appointment">預約農會服務／審查</option><option value="delivery">配送至農場</option></select></label>{request.fulfillmentType === "delivery" ? <label className="full">配送地址<input value={request.deliveryAddress} onChange={(event) => setRequest((current) => ({ ...current, deliveryAddress: event.target.value }))} /></label> : <><label>預約日期<input type="date" min="2026-08-11" value={request.appointmentDate} onChange={(event) => setRequest((current) => ({ ...current, appointmentDate: event.target.value }))} /></label><label>預約時段<select value={request.appointmentSlot} onChange={(event) => setRequest((current) => ({ ...current, appointmentSlot: event.target.value }))}><option>上午 09:00–12:00</option><option>下午 13:30–16:30</option><option>傍晚 16:30–18:00</option></select></label></>}<label className="full">用途與備註<textarea value={request.note} onChange={(event) => setRequest((current) => ({ ...current, note: event.target.value }))} /></label></div>}
    {step === 2 && <div className="review-card"><div className="review-head"><span><FileCheck2 /></span><div><small>扣點前最後確認</small><h3>{offer.name}</h3></div></div><div className="receipt-box"><Row label="申請小農" value="禾日友善農園" /><Row label="合作農會" value={request.cooperative} /><Row label={request.fulfillmentType === "delivery" ? "配送地址" : "預約時間"} value={request.fulfillmentType === "delivery" ? request.deliveryAddress : `${request.appointmentDate} ${request.appointmentSlot}`} /><Row label="扣抵綠點" value={`${offer.requiredScore.toLocaleString()} 點`} /><Row label="兌換後餘額" value={`${(balance - offer.requiredScore).toLocaleString()} 點`} /></div><label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />我已核對上述資料，確認使用綠點兌換此農業資源，並同意由合作農會聯繫。</label></div>}
    <p className="fine-print">確認兌換後會建立正式兌換收據，並依履約方式顯示配送或預約進度。</p>
    <div className="modal-actions"><button className="button button-secondary" disabled={submitting} onClick={() => step === 0 ? onClose() : setStep(step - 1)}>{step === 0 ? "取消" : "上一步"}</button><button className="button button-primary" disabled={submitting || (step === 1 && !requestComplete) || (step === 2 && !consent)} onClick={() => { if (step === 2) { setSubmitting(true); void onRedeem(request, true).then((success) => { setSubmitting(false); if (success) setStep(3); }); } else goToNextStep(); }}>{submitting ? "正在建立兌換紀錄…" : step === 2 ? consent ? "確認兌換並建立收據" : "請先勾選確認" : "確認並進入下一步"}</button></div>
  </ModalShell>;
}

function ResourceReceiptModal({ redemption, onClose }: { redemption: BackendSnapshot["resourceRedemptions"][number] | undefined; onClose: () => void }) {
  if (!redemption) return <ModalShell title="農會資源兌換收據" onClose={onClose} small><div className="empty-receipt"><span><Receipt /></span><h3>找不到兌換紀錄</h3><p>請重新整理後再開啟收據。</p></div></ModalShell>;
  return <ModalShell title="農會資源兌換收據" onClose={onClose} wide><article className="resource-receipt-document"><header><div><small>GFES 綠色消費循環平台</small><h2>農會農業資源兌換收據</h2><p>收據編號：{redemption.id}</p></div><span><Leaf /></span></header><div className="resource-receipt-status"><b>{redemption.status === "completed" ? "履約完成" : "履約處理中"}</b><small>建立時間 {new Date(redemption.createdAt).toLocaleString("zh-TW")}</small></div><section><h3>兌換明細</h3><div className="receipt-box"><Row label="兌換資源" value={redemption.resourceName} /><Row label="扣抵綠點" value={`${redemption.points.toLocaleString()} 點`} /><Row label="申請小農" value="禾日友善農園" /><Row label="承辦農會" value={redemption.cooperative} /></div></section><section><h3>{redemption.fulfillmentType === "delivery" ? "配送資料" : "預約資料"}</h3><div className="receipt-box"><Row label="聯絡窗口" value={`${redemption.contactName}・${redemption.contactPhone}`} /><Row label={redemption.fulfillmentType === "delivery" ? "配送地址" : "預約時間"} value={redemption.fulfillmentType === "delivery" ? redemption.deliveryAddress : `${redemption.appointmentDate} ${redemption.appointmentSlot}`} />{redemption.trackingNumber && <Row label="物流單號" value={redemption.trackingNumber} />}<Row label="用途備註" value={redemption.note || "無"} /></div></section><footer><p>本收據用於證明綠點扣抵及農會資源申請紀錄；實際配送、服務與補助資格依承辦農會通知為準。</p><strong>GFES・地方支持可追溯</strong></footer></article><div className="modal-actions"><button className="button button-secondary" onClick={onClose}>關閉</button><button className="button button-primary" onClick={() => window.print()}><Download />列印或另存 PDF</button></div></ModalShell>;
}

function InstitutionPortfolioModal({
  selectedName,
  setSelectedName,
  onClose,
}: {
  selectedName: string;
  setSelectedName: (name: string) => void;
  onClose: () => void;
}) {
  const selected = farmers.find((item) => item.name === selectedName) || farmers[0];
  return (
    <ModalShell title="小農專案與綠點成果" onClose={onClose}>
      <div className="portfolio-summary">
        <article><strong>4 戶</strong><span>示範農戶</span></article><article><strong>38,200 點</strong><span>累積支持</span></article><article><strong>85%</strong><span>平均成果透明度</span></article><article><strong>75%</strong><span>專案正常推進</span></article>
      </div>
      <div className="portfolio-layout">
        <div className="portfolio-list">
          {farmers.map((item) => (
            <button className={item.name === selected.name ? "active" : ""} onClick={() => setSelectedName(item.name)} key={item.name}>
              <span className="portfolio-avatar"><Sprout /></span>
              <span><b>{item.name}</b><small>{item.area}・{item.crop}・{item.purpose}</small></span>
              <em>{item.score}%</em>
            </button>
          ))}
        </div>
        <section className="portfolio-detail">
          <header><div><small>目前查看</small><h3>{selected.name}</h3><p>{selected.area}地區・{selected.crop}農戶</p></div><span className={`status-pill ${selected.status === "待補資料" ? "waiting" : ""}`}>{selected.status}</span></header>
          <div className="portfolio-credit"><div className="mini-score">{selected.score}<small>成果透明度</small></div><div><b>資料完整度 {selected.completeness}%</b><div className="progress"><span style={{ width: `${selected.completeness}%` }} /></div><small>{selected.completeness < 80 ? "需補充設備估價與減碳資料" : "資料足以公開專案進度"}</small></div></div>
          <div className="receipt-box"><Row label="累積支持" value={selected.amount} /><Row label="主要用途" value={selected.purpose} /><Row label="本月綠點支持" value={selected.name === "禾日友善農園" ? "12,680 點" : "8,240 點"} /><Row label="預估環境效益" value={selected.crop === "稻米" ? "減碳 8.6 噸／年" : "資源效率提升 15%"} /></div>
          <div className="portfolio-actions"><button className="button button-secondary">查看永續資料</button><button className="button button-primary">查看專案檢核</button></div>
        </section>
      </div>
      <p className="fine-print">小農、綠點與成果資料由後台保存，供專案追蹤與地方影響揭露。</p>
    </ModalShell>
  );
}

function FarmerDetailModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="禾日友善農園" onClose={onClose} small>
      <div className="farmer-summary"><div className="mini-score">86<small>成果透明度</small></div><div><h3>資料完整、穩健成長</h3><p>雲林地區葉菜農戶，目前公開節水灌溉改善專案。</p></div></div>
      <div className="receipt-box"><Row label="支持綠點" value="12,680 點" /><Row label="專案目標" value="68,000 點" /><Row label="資料完整度" value="100%" /><Row label="專案狀態" value="執行中" /></div>
      <button className="button button-primary button-block" onClick={onClose}>返回農戶清單</button>
    </ModalShell>
  );
}

function Success({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="success"><span><Check /></span><h3>{title}</h3><p>{text}</p>{children}</div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="receipt-row"><span>{label}</span><b>{value}</b></div>;
}
