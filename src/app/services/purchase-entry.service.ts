// purchase-entry.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PurchaseEntry, PurchaseEntryItem } from '../models/purchase-entry.model';

const URL = `${environment.apiUrl}/purchases`;

@Injectable({ providedIn: 'root' })
export class PurchaseEntryService {
  private http = inject(HttpClient);

  // ✅ GET all purchase entries
  getAll(): Observable<PurchaseEntry[]> {
    return this.http.get<any[]>(URL).pipe(
      map(rows =>
        (rows || []).map(r => {
          const items: PurchaseEntryItem[] = (r.Items || []).map((it: any) => ({
            productId: it.ProductId,
            productName: it.ProductName,
            qty: it.Qty,
            unitPrice: it.UnitPrice,
            lineTotal: (it.Qty ?? 0) * (it.UnitPrice ?? 0)
          }));

          return {
            purchaseId: r.PurchaseId,
            vendorId: r.VendorId,
            vendorName: r.VendorName,
            invoiceNo: r.InvoiceNo,
            purchaseDate: r.PurchaseDate,
            remarks: r.Remarks,
            isActive: r.IsActive ?? true,
            items,
            totalAmount: items.reduce(
              (s: number, it: PurchaseEntryItem) => s + it.lineTotal,
              0
            ),
            createdAt: r.CreatedAt
          } as PurchaseEntry;
        })
      )
    );
  }

  // ✅ GET by Id
  getById(id: number): Observable<PurchaseEntry | null> {
    return this.http.get<any[]>(`${URL}/${id}`).pipe(
      map(rows => {
        if (!rows || rows.length === 0) return null;

        const r = rows[0];
        const items: PurchaseEntryItem[] = (r.Items || []).map((it: any) => ({
          productId: it.ProductId,
          productName: it.ProductName,
          qty: it.Qty,
          unitPrice: it.UnitPrice,
          lineTotal: (it.Qty ?? 0) * (it.UnitPrice ?? 0)
        }));

        return {
          purchaseId: r.PurchaseId,
          vendorId: r.VendorId,
          vendorName: r.VendorName,
          invoiceNo: r.InvoiceNo,
          purchaseDate: r.PurchaseDate,
          remarks: r.Remarks,
          isActive: r.IsActive ?? true,
          items,
          totalAmount: items.reduce(
            (s: number, it: PurchaseEntryItem) => s + it.lineTotal,
            0
          ),
          createdAt: r.CreatedAt
        } as PurchaseEntry;
      })
    );
  }

  // ✅ SAVE (create or update)
  save(
    editId: number | null,
    payload: any
  ): Observable<{ success: number; message: string }> {
    const body = { ...payload, purchaseId: editId ?? 0 };
    return this.http.post<{ success: number; message: string }>(URL, body);
  }

  // ✅ TOGGLE active/inactive
  toggleActive(
    id: number,
    isActive: boolean
  ): Observable<{ success: number; message: string }> {
    return this.http.put<{ success: number; message: string }>(`${URL}/${id}`, {
      isActive
    });
  }
}
