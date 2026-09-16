/** @type {Record<import("../domain.ts").GreenFinDataDomain, string[]>} */
export const GREENFIN_REQUIRED_FIELDS = {
  IDENTITY: ["姓名", "身分證字號"],
  LAND_CROP: ["地段", "面積"],
  TRANSACTION: ["交易對象", "交易金額", "交易日期"],
  INPUT_EQUIPMENT: ["設備名稱", "購入日期", "金額"],
  GREEN_ACTION: ["活動名稱", "執行日期"],
  CERTIFICATION: ["認證機構", "有效期限"],
  LOAN_PURPOSE: ["申貸用途", "預估金額"],
};
