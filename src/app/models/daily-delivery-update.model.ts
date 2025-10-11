export interface DailyDeliveryActuals {
  deliveryId: number;
  returnTime: string | null;
  completedInvoices: number;
  pendingInvoices: number;
  cashCollected: number;
  emptyCylindersReturned: number;
  remarks: string;
}