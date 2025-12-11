import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Property {
    id?: number;
    title: string;
    description: string;
    price: number;
    area?: number;
    address: string;
    bedrooms?: number;
    bathrooms?: number;
    direction?: string;
    legalStatus?: string;
    status?: string;
    createdAt?: Date;
    imageUrl?: string; // Thumbnail image URL
    // Relations
    owner?: any;
    user?: any; // Alias for owner (for backward compatibility)
    propertyType?: { id: number; name: string };
    listingType?: { id: number; code: string; name: string };
    district?: { id: number; name: string; city?: { id: number; name: string } };
    amenities?: { id: number; name: string }[];
    liked?: boolean;
    type?: string; // Derived from listingType.code ('sale' or 'rent')
}

@Injectable({
    providedIn: 'root'
})
export class PropertyService {
    private apiUrl = 'http://localhost:3000/properties';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    findAll(filters?: { search?: string; listingTypeId?: number; minPrice?: number; maxPrice?: number }): Observable<Property[]> {
        let params = new HttpParams();
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.listingTypeId) params = params.set('listingTypeId', filters.listingTypeId.toString());
        if (filters?.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        return this.http.get<Property[]>(this.apiUrl, { params });
    }

    create(property: any): Observable<Property> {
        return this.http.post<Property>(this.apiUrl, property, { headers: this.getHeaders() });
    }

    findOne(id: number): Observable<Property> {
        return this.http.get<Property>(`${this.apiUrl}/${id}`);
    }

    uploadImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload`, formData, { headers: this.getHeaders() });
    }

    update(id: number, property: any): Observable<Property> {
        return this.http.patch<Property>(`${this.apiUrl}/${id}`, property, { headers: this.getHeaders() });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    getMyProperties(): Observable<Property[]> {
        return this.http.get<Property[]>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
    }
}
