// src/app/models/daily-delivery.model.ts
export interface DeliveryItem {
  productId: number;
  noOfCylinders?: number | null;
  noOfInvoices?: number | null;
  noOfDeliveries?: number | null;
  noOfItems?: number | null;
}

export interface DailyDelivery {
  deliveryDate: string;   // yyyy-MM-dd
  driverId: number;       // driver-first design
  startTime: string;      // HH:mm:ss
  returnTime?: string | null;
  remarks?: string | null;
  items: DeliveryItem[];
}

/* Request payload used while closing a delivery */
export interface DeliveryCloseRequest {
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  postIncome: boolean;
  paymentMode: string;
}

/* Read model for metrics responses and list view */
export interface DailyDeliveryMetrics {
  deliveryId: number;
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  otherItemsDelivered: number;
  cylindersDelivered: number;
  nonCylItemsDelivered: number;
  invoiceCount: number;
  deliveryCount: number;
  plannedInvoices: number;
}
