import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const BASE_URL = `${environment.apiUrl}/income-expense`;

@Injectable({ providedIn: 'root' })
export class IncomeExpenseService {
  constructor(private http: HttpClient) {}

  create(entry: any) {
    return this.http.post(BASE_URL, entry);
  }

  getCategories(type: string, search: string = '') {
    return this.http.get<any[]>(`${BASE_URL}/categories?type=${type}&search=${search}`);
  }
  fetchList(type?: string, from?: string, to?: string) {
  const params: any = {};
  if (type) params.type = type;
  if (from) params.from = from;
  if (to) params.to = to;

  return this.http.get<any[]>(`${BASE_URL}/list`, { params });
}

delete(id: number) {
  return this.http.delete(`${BASE_URL}/${id}`);
}

}