// customer-credit.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CustomerCredit, CreditTransaction, CreditPayment } from '../models/customer-credit.model';
import { environment } from '../../environments/environment';

const CREDIT_URL = `${environment.apiUrl}/customer-credit`;

@Injectable({ providedIn: 'root' })
export class CustomerCreditService {
  private http = inject(HttpClient);

  // GET all customer credits
  getCustomerCredits(): Observable<CustomerCredit[]> {
    return this.http.get<any[]>(CREDIT_URL).pipe(
      map(rows => (rows || []).map(c => ({
        creditId: c.CreditId ?? c.creditId,
        customerId: c.CustomerId ?? c.customerId,
        customerName: c.CustomerName ?? c.customerName,
        creditLimit: c.CreditLimit ?? c.creditLimit ?? 0,
        creditUsed: c.CreditUsed ?? c.creditUsed ?? 0,
        creditAvailable: c.CreditAvailable ?? c.creditAvailable ?? 0,
        outstandingAmount: c.OutstandingAmount ?? c.outstandingAmount ?? 0,
        totalPaid: c.TotalPaid ?? c.totalPaid ?? 0,
        lastPaymentDate: c.LastPaymentDate ?? c.lastPaymentDate,
        lastPaymentAmount: c.LastPaymentAmount ?? c.lastPaymentAmount ?? 0,
        isActive: c.IsActive ?? c.isActive ?? true,
        createdAt: c.CreatedAt ?? c.createdAt ?? new Date().toISOString()
      } as CustomerCredit)))
    );
  }

  // GET credit by customer ID
  getCreditByCustomerId(customerId: number): Observable<CustomerCredit | null> {
    return this.http.get<any>(`${CREDIT_URL}/customer/${customerId}`).pipe(
      map(c => {
        if (!c) return null;
        return {
          creditId: c.CreditId ?? c.creditId,
          customerId: c.CustomerId ?? c.customerId,
          customerName: c.CustomerName ?? c.customerName,
          creditLimit: c.CreditLimit ?? c.creditLimit ?? 0,
          creditUsed: c.CreditUsed ?? c.creditUsed ?? 0,
          creditAvailable: c.CreditAvailable ?? c.creditAvailable ?? 0,
          outstandingAmount: c.OutstandingAmount ?? c.outstandingAmount ?? 0,
          totalPaid: c.TotalPaid ?? c.totalPaid ?? 0,
          lastPaymentDate: c.LastPaymentDate ?? c.lastPaymentDate,
          lastPaymentAmount: c.LastPaymentAmount ?? c.lastPaymentAmount ?? 0,
          isActive: c.IsActive ?? c.isActive ?? true,
          createdAt: c.CreatedAt ?? c.createdAt ?? new Date().toISOString()
        } as CustomerCredit;
      })
    );
  }

  // SAVE or UPDATE credit limit
  saveCreditLimit(dto: any): Observable<any> {
    const payload = {
      CustomerId: dto.customerId,
      CreditLimit: dto.creditLimit,
      IsActive: dto.isActive ?? true
    };
    return this.http.post(CREDIT_URL, payload);
  }

  // POST payment
  recordPayment(dto: any): Observable<any> {
    const payload = {
      CustomerId: dto.customerId,
      PaymentAmount: dto.paymentAmount,
      PaymentMode: dto.paymentMode,
      ReferenceNumber: dto.referenceNumber,
      PaymentDate: dto.paymentDate,
      Remarks: dto.remarks
    };
    return this.http.post(`${CREDIT_URL}/payment`, payload);
  }

  // GET transactions by customer
  getTransactionsByCustomer(customerId: number): Observable<CreditTransaction[]> {
    return this.http.get<any[]>(`${CREDIT_URL}/transactions/${customerId}`).pipe(
      map(rows => (rows || []).map(t => ({
        transactionId: t.TransactionId ?? t.transactionId,
        customerId: t.CustomerId ?? t.customerId,
        customerName: t.CustomerName ?? t.customerName,
        transactionType: t.TransactionType ?? t.transactionType,
        amount: t.Amount ?? t.amount ?? 0,
        referenceNumber: t.ReferenceNumber ?? t.referenceNumber,
        description: t.Description ?? t.description,
        transactionDate: t.TransactionDate ?? t.transactionDate,
        createdBy: t.CreatedBy ?? t.createdBy,
        createdAt: t.CreatedAt ?? t.createdAt
      } as CreditTransaction)))
    );
  }

  // GET payment history
  getPaymentHistory(customerId?: number): Observable<CreditPayment[]> {
    const url = customerId ? `${CREDIT_URL}/payments/${customerId}` : `${CREDIT_URL}/payments`;
    return this.http.get<any[]>(url).pipe(
      map(rows => (rows || []).map(p => ({
        paymentId: p.PaymentId ?? p.paymentId,
        customerId: p.CustomerId ?? p.customerId,
        customerName: p.CustomerName ?? p.customerName,
        paymentAmount: p.PaymentAmount ?? p.paymentAmount ?? 0,
        paymentMode: p.PaymentMode ?? p.paymentMode,
        referenceNumber: p.ReferenceNumber ?? p.referenceNumber,
        paymentDate: p.PaymentDate ?? p.paymentDate,
        remarks: p.Remarks ?? p.remarks,
        createdAt: p.CreatedAt ?? p.createdAt
      } as CreditPayment)))
    );
  }
}
