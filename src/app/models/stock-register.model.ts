export interface StockRegister {
  stockId: number;
  productId: number;
  productName: string;
  categoryName: string;
  subCategoryName: string;
  filledStock: number;
  emptyStock: number;
  damagedStock: number;
  totalStock: number;
  lastUpdated: Date;
  updatedBy: string | null;
}

export interface StockSummary {
  groupId: number;
  groupName: string;
  filledStock: number;
  emptyStock: number;
  damagedStock: number;
  totalStock: number;
  productCount: number;
}

export interface StockTransaction {
  transactionId: number;
  productId: number;
  productName: string;
  transactionType: string;
  filledChange: number;
  emptyChange: number;
  damagedChange: number;
  referenceId: number | null;
  referenceType: string | null;
  remarks: string | null;
  transactionDate: Date;
  createdBy: string | null;
}

export interface StockAdjustmentRequest {
  productId: number;
  filledChange: number;
  emptyChange: number;
  damagedChange: number;
  remarks: string | null;
  adjustedBy: string;
}
