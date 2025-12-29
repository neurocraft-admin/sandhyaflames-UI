// customer-credit.model.ts
export interface CustomerCredit {
  creditId: number;
  customerId: number;
  customerName: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  outstandingAmount: number;
  totalPaid: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreditTransaction {
  transactionId: number;
  customerId: number;
  customerName: string;
  transactionType: string; // 'Credit', 'Debit', 'Payment'
  amount: number;
  referenceNumber: string;
  description: string;
  transactionDate: string;
  createdBy: string;
  createdAt: string;
}

export interface CreditPayment {
  paymentId: number;
  customerId: number;
  customerName: string;
  paymentAmount: number;
  paymentMode: string; // 'Cash', 'Card', 'UPI', 'Cheque', 'Bank Transfer'
  referenceNumber: string;
  paymentDate: string;
  remarks: string;
  createdAt: string;
}

export type CustomerCreditUpsertDto = {
  customerId: number;
  creditLimit: number;
  isActive: boolean;
};

export type CreditPaymentDto = {
  customerId: number;
  paymentAmount: number;
  paymentMode: string;
  referenceNumber: string;
  paymentDate: string;
  remarks: string;
};
