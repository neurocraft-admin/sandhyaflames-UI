export interface DeliveryItem {
  productId: number;
  categoryId: number;
  subCategoryId?: number | null;
  noOfCylinders?: number | null;
  noOfInvoices?: number | null;
  noOfDeliveries?: number | null;
  noOfItems?: number | null;
}

export interface DailyDelivery {
  deliveryDate: string;      // yyyy-MM-dd
  vehicleId: number;
  startTime: string;         // HH:mm:ss
  returnTime?: string | null;
  remarks?: string | null;
  driverIds: number[];
  items: DeliveryItem[];
}

export interface DeliveryCloseRequest {
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  postIncome: boolean;
}