export interface DailyDeliverySummary {
  deliveryId: number;
  deliveryDate: string;
  vehicleId: number;
  vehicleNo: string;
  status: string;
  returnTime: string;
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  cylindersDelivered: number;
  nonCylItemsDelivered: number;
  totalCollection: number;
  totalItemsDelivered: number;
  deliveryCompletionRate: number;
}
