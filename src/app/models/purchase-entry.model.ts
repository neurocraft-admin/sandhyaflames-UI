export interface PurchaseEntryItem {
  productId: number;
  categoryId: number;       // ✅ required for DB
  subCategoryId: number;    // ✅ required for DB
  productName?: string;
  categoryName?: string;
  subCategoryName?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;        // client-side
}

export interface PurchaseEntry {
  purchaseId: number;
  vendorId: number;
  vendorName?: string;
  invoiceNo: string;
  purchaseDate: string;     // yyyy-MM-dd
  remarks?: string;
  isActive: boolean;
  items: PurchaseEntryItem[];
  totalAmount: number;
  createdAt?: string;
}

export type PurchaseEntryUpsertDto = {
  vendorId: number;
  invoiceNo: string;
  purchaseDate: string;
  remarks?: string;
  isActive: boolean;
  items: {
    productId: number;
    categoryId: number;       // ✅ will be sent to API
    subCategoryId: number;    // ✅ will be sent to API
    qty: number;
    unitPrice: number;
  }[];
};
