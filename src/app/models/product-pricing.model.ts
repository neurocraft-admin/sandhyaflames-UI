export interface ProductPricing {
  productId: number;
  purchasePrice: number;
  sellingPrice: number;
  effectiveDate: string; // yyyy-MM-dd
  isActive?: boolean;
}
