import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
    id?: number;
    amount: number;
    status: string;
    paymentMethod: string;
    transactionType: string;
    transactionRef: string;
    orderInfo: string;
    customer?: {
        id: number;
        fullName: string;
        email: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface TransactionPaginatedResponse {
    data: Transaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface TransactionStatistics {
    total: number;
    success: number;
    pending: number;
    failed: number;
    totalRevenue: number;
}

@Injectable({
    providedIn: 'root'
})
export class TransactionService {
    private apiUrl = 'http://localhost:3000/transactions';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    createPaymentUrl(amount: number, orderInfo: string): Observable<{ payUrl: string; orderId: string; transactionId: number }> {
        return this.http.post<any>(`${this.apiUrl}/create-payment-url`, { amount, orderInfo }, { headers: this.getHeaders() });
    }

    findAll(filters?: { status?: string; page?: number; limit?: number }): Observable<TransactionPaginatedResponse> {
        let params = new HttpParams();
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());
        return this.http.get<TransactionPaginatedResponse>(this.apiUrl, { params, headers: this.getHeaders() });
    }

    findMy(): Observable<Transaction[]> {
        return this.http.get<Transaction[]>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
    }

    getStatistics(): Observable<TransactionStatistics> {
        return this.http.get<TransactionStatistics>(`${this.apiUrl}/statistics`, { headers: this.getHeaders() });
    }
}
