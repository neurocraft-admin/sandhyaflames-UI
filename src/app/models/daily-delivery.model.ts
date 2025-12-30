// src/app/models/daily-delivery.model.ts
export interface DeliveryItem {
  productId: number;
  noOfCylinders?: number | null;  // For cylinder products
  noOfInvoices?: number | null;   // Number of customer invoices
  noOfItems?: number | null;      // For accessory products
  // noOfDeliveries - DEPRECATED: Not used in business logic
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
