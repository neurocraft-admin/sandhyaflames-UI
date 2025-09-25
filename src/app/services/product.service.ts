import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductUpsertDto } from '../models/product.model';
import { environment } from '../../environments/environment';

const PRODUCTS_URL = `${environment.apiUrl}/products`;


@Injectable({ providedIn: 'root' })
export class ProductService {
private http = inject(HttpClient);


getProducts(): Observable<Product[]> {
return this.http.get<Product[]>(PRODUCTS_URL);
}


createProduct(dto: ProductUpsertDto): Observable<any> {
return this.http.post(PRODUCTS_URL, dto);
}


updateProduct(id: number, dto: ProductUpsertDto): Observable<any> {
return this.http.put(`${PRODUCTS_URL}/${id}`, dto);
}
}