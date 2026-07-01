import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Thông tin một bên tham gia hợp đồng */
export interface ContractParty {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

/** Thông tin bất động sản trong hợp đồng */
export interface ContractProperty {
  title: string;
  address: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  direction: string | null;
  legalStatus: string | null;
  propertyType: string;
  listingType: string;
}

/** Payload đầy đủ dữ liệu hợp đồng từ API */
export interface ContractData {
  appointmentId: number;
  seller: ContractParty;
  buyer: ContractParty;
  property: ContractProperty;
  contractDate: string;
  appointmentDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private readonly apiUrl = 'http://localhost:3000/contracts';

  constructor(private readonly http: HttpClient) {}

  /**
   * Lấy header xác thực JWT từ localStorage
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Gọi API lấy dữ liệu hợp đồng theo appointmentId.
   * API: GET /contracts/generate-data/:appointmentId
   */
  getContractData(appointmentId: number): Observable<ContractData> {
    return this.http.get<ContractData>(
      `${this.apiUrl}/generate-data/${appointmentId}`,
      { headers: this.getHeaders() },
    );
  }
}
