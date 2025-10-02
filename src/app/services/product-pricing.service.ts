import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProductPricing } from '../models/product-pricing.model';

const URL = `${environment.apiUrl}/productpricing`;

@Injectable({ providedIn: 'root' })
export class ProductPricingService {
  private http = inject(HttpClient);

  setPrice(payload: ProductPricing): Observable<any> {
    return this.http.post(URL, payload);
  }

  getActive(): Observable<any[]> {
    return this.http.get<any[]>(`${URL}/active`);
  }

  getHistory(productId: number): Observable<any[]> {
    return this.http.get<any[]>(`${URL}/history/${productId}`);
  }
}
