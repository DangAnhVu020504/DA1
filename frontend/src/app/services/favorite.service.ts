import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Favorite {
    id: number;
    userId: number;
    propertyId: number;
    createdAt: string;
    property?: any;
}

@Injectable({
    providedIn: 'root'
})
export class FavoriteService {
    private apiUrl = 'http://localhost:3000/favorites';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    add(propertyId: number): Observable<Favorite> {
        return this.http.post<Favorite>(`${this.apiUrl}/${propertyId}`, {}, { headers: this.getHeaders() });
    }

    remove(propertyId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${propertyId}`, { headers: this.getHeaders() });
    }

    getAll(): Observable<Favorite[]> {
        return this.http.get<Favorite[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    check(propertyId: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/check/${propertyId}`, { headers: this.getHeaders() });
    }

    toggle(propertyId: number, isLiked: boolean): Observable<any> {
        if (isLiked) {
            return this.remove(propertyId);
        } else {
            return this.add(propertyId);
        }
    }
}
