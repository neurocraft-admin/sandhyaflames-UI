import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';


export interface VendorOption { vendorId: number; vendorName: string; }


@Injectable({ providedIn: 'root' })
export class VendorDropdownService {
private http = inject(HttpClient);
private url = `${environment.apiUrl}/vendors`;


getAll(): Observable<VendorOption[]> {
return this.http.get<any[]>(this.url).pipe(
map(rows => (rows || []).map(r => ({ vendorId: r.VendorId, vendorName: r.VendorName }) as VendorOption))
);
}
}