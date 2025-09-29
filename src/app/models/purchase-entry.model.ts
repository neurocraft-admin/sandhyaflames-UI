export interface PurchaseEntryItem {
productId: number;
productName?: string;
qty: number;
unitPrice: number;
lineTotal: number; // qty * unitPrice (client-side)
}


export interface PurchaseEntry {
purchaseId: number;
vendorId: number;
vendorName?: string;
invoiceNo: string;
purchaseDate: string; // yyyy-MM-dd
remarks?: string;
isActive: boolean;
items: PurchaseEntryItem[];
totalAmount: number; // sum of lineTotal (client-side)
createdAt?: string;
}


export type PurchaseEntryUpsertDto = {
vendorId: number;
invoiceNo: string;
purchaseDate: string;
remarks?: string;
isActive: boolean;
items: { productId: number; qty: number; unitPrice: number }[];
};