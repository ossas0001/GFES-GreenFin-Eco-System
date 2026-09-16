import type { GreenFinDataDomain } from "../../domain";

export type OcrField = {
  fieldName: string;
  rawValue: string;
  confidence: number;
};

export type OcrResult = {
  success: boolean;
  fields: OcrField[];
  rawText: string;
  provider: string;
  error?: string;
};

export interface OcrProvider {
  extract(input: { bytes: Uint8Array; filename: string; mimeType: string; domain: GreenFinDataDomain }): Promise<OcrResult>;
}

const MOCK_FIELDS: Record<GreenFinDataDomain, OcrField[]> = {
  CERTIFICATION: [
    { fieldName: "認證機構", rawValue: "慈心有機農業發展基金會（SIMULATED）", confidence: 0.95 },
    { fieldName: "認證類型", rawValue: "有機農產品認證（SIMULATED）", confidence: 0.92 },
    { fieldName: "有效期限", rawValue: "2027/06/30", confidence: 0.88 },
    { fieldName: "證書編號", rawValue: "DEMO-ORG-2026-00123", confidence: 0.97 },
  ],
  TRANSACTION: [
    { fieldName: "交易對象", rawValue: "後壁區農會（SIMULATED）", confidence: 0.93 },
    { fieldName: "交易金額", rawValue: "NT$85,000", confidence: 0.9 },
    { fieldName: "交易日期", rawValue: "2026/03/15", confidence: 0.87 },
    { fieldName: "單據編號", rawValue: "DEMO-INV-2026-0315", confidence: 0.96 },
  ],
  GREEN_ACTION: [
    { fieldName: "活動名稱", rawValue: "有機堆肥施用紀錄（SIMULATED）", confidence: 0.88 },
    { fieldName: "執行日期", rawValue: "2026/04/01", confidence: 0.85 },
    { fieldName: "施用面積", rawValue: "0.8 公頃", confidence: 0.75 },
    { fieldName: "堆肥來源", rawValue: "自製廚餘堆肥（SIMULATED）", confidence: 0.7 },
  ],
  IDENTITY: [
    { fieldName: "姓名", rawValue: "陳○○（SIMULATED）", confidence: 0.98 },
    { fieldName: "身分證字號", rawValue: "A1234***89（SIMULATED）", confidence: 0.95 },
    { fieldName: "戶籍地址", rawValue: "台南市後壁區○○里（SIMULATED）", confidence: 0.8 },
  ],
  LAND_CROP: [
    { fieldName: "地段", rawValue: "後壁段 DEMO-1234 地號", confidence: 0.9 },
    { fieldName: "面積", rawValue: "2.5 公頃", confidence: 0.88 },
    { fieldName: "使用分區", rawValue: "特定農業區（SIMULATED）", confidence: 0.85 },
    { fieldName: "登記日期", rawValue: "2020/05/12", confidence: 0.92 },
  ],
  INPUT_EQUIPMENT: [
    { fieldName: "設備名稱", rawValue: "太陽能抽水機（SIMULATED）", confidence: 0.92 },
    { fieldName: "購入日期", rawValue: "2025/08/01", confidence: 0.88 },
    { fieldName: "金額", rawValue: "NT$120,000", confidence: 0.9 },
    { fieldName: "供應商", rawValue: "綠能設備有限公司（SIMULATED）", confidence: 0.85 },
  ],
  LOAN_PURPOSE: [
    { fieldName: "申貸用途", rawValue: "購置農業設備（SIMULATED）", confidence: 0.95 },
    { fieldName: "預估金額", rawValue: "NT$500,000", confidence: 0.9 },
    { fieldName: "還款來源", rawValue: "農產品銷售收入（SIMULATED）", confidence: 0.85 },
  ],
};

export class MockOcrProvider implements OcrProvider {
  async extract(input: { bytes: Uint8Array; filename: string; mimeType: string; domain: GreenFinDataDomain }): Promise<OcrResult> {
    return {
      success: true,
      fields: MOCK_FIELDS[input.domain].map((field) => ({ ...field })),
      rawText: `[DEMO SIMULATED OCR] Domain: ${input.domain}, File: ${input.filename}`,
      provider: "MockOcrProvider",
    };
  }
}

export function getOcrProvider(): OcrProvider {
  return new MockOcrProvider();
}
