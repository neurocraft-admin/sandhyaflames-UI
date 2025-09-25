export interface Product {
productId: number;
productName: string;
categoryId: number;
subCategoryId: number;
unitPrice: number | null;
purchasePrice: number | null;
description?: string | null;
hsnCode?: string | null;
isActive: boolean;
// from API JOINs (read‑only)
categoryName?: string;
subCategoryName?: string;
}


export type ProductUpsertDto = {
productName: string;
categoryId: number;
subCategoryId: number;
unitPrice: number | null;
purchasePrice: number | null;
description?: string | null;
hsnCode?: string | null;
isActive: boolean;
};