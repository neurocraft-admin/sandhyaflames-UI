import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConnectionTransaction {
  connectionId: number;
  transactionNo: string;
  transactionDate: string;
  transactionType: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  productId: number;
  productName: string;
  quantity: number;
  depositAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  collectedAmount: number;
  creditAmount: number;
  paymentMode: string;
  remarks?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  paymentSplit?: PaymentSplitBreakdown;
}

export interface PaymentSplitBreakdown {
  cash: number;
  upi: number;
  card: number;
  bank: number;
  credit: number;
}

export interface SaveNewConnectionRequest {
  transactionDate: string;
  customerId: number;
  productId: number;
  quantity: number;
  depositAmount: number;
  serviceChargeAmount: number;
  paymentMode: string;
  remarks?: string;
  createdBy?: string;
  paymentSplit?: PaymentSplitBreakdown;
}

export interface SaveTransferRequest {
  transactionDate: string;
  customerId: number;
  productId: number;
  quantity: number;
  depositAmount: number;
  serviceChargeAmount: number;
  paymentMode: string;
  remarks?: string;
  createdBy?: string;
  paymentSplit?: PaymentSplitBreakdown;
}

export interface SaveSurrenderRequest {
  transactionDate: string;
  customerId: number;
  productId: number;
  quantity: number;
  depositAmount: number;
  serviceChargeAmount: number;
  paymentMode: string;
  remarks?: string;
  paymentSplit?: PaymentSplitBreakdown;
  createdBy?: string;
}

export interface DailyConnectionSummary {
  transactionType: string;
  totalCount: number;
  totalDeposit: number;
  totalServiceCharge: number;
  totalAmount: number;
}

export interface SaveConnectionResponse {
  connectionId: number;
  transactionNo: string;
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private apiUrl = `${environment.apiUrl}/connections`;

  constructor(private http: HttpClient) { }

  /**
   * Save New Connection
   */
  saveNewConnection(request: SaveNewConnectionRequest): Observable<SaveConnectionResponse> {
    return this.http.post<SaveConnectionResponse>(`${this.apiUrl}/new-connection`, request);
  }

  /**
   * Save Transfer
   */
  saveTransfer(request: SaveTransferRequest): Observable<SaveConnectionResponse> {
    return this.http.post<SaveConnectionResponse>(`${this.apiUrl}/transfer`, request);
  }

  /**
   * Save Surrender
   */
  saveSurrender(request: SaveSurrenderRequest): Observable<SaveConnectionResponse> {
    return this.http.post<SaveConnectionResponse>(`${this.apiUrl}/surrender`, request);
  }

  /**
   * List Connection Transactions
   */
  listConnectionTransactions(
    transactionType?: string,
    fromDate?: string,
    toDate?: string,
    customerId?: number
  ): Observable<ConnectionTransaction[]> {
    let params = new HttpParams();
    if (transactionType) params = params.set('transactionType', transactionType);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (customerId) params = params.set('customerId', customerId.toString());

    return this.http.get<ConnectionTransaction[]>(`${this.apiUrl}/list`, { params });
  }

  /**
   * Get Connection By Id
   */
  getConnectionById(id: number): Observable<ConnectionTransaction> {
    return this.http.get<ConnectionTransaction>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get Daily Connection Summary
   */
  getDailyConnectionSummary(fromDate?: string, toDate?: string): Observable<DailyConnectionSummary[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.http.get<DailyConnectionSummary[]>(`${this.apiUrl}/daily-summary`, { params });
  }
}
