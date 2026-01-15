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
    views?: number;
    createdAt?: Date;
    imageUrl?: string; // Thumbnail image URL
    imageUrls?: string[]; // All image URLs for gallery
    videoUrl?: string; // Video URL
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

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
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

    findAll(filters?: {
        search?: string;
        listingTypeId?: number;
        minPrice?: number;
        maxPrice?: number;
        cityId?: number;
        districtId?: number;
        minArea?: number;
        maxArea?: number;
        bedrooms?: number;
        bathrooms?: number;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Observable<PaginatedResponse<Property>> {
        let params = new HttpParams();
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.listingTypeId) params = params.set('listingTypeId', filters.listingTypeId.toString());
        if (filters?.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        if (filters?.cityId) params = params.set('cityId', filters.cityId.toString());
        if (filters?.districtId) params = params.set('districtId', filters.districtId.toString());
        if (filters?.minArea) params = params.set('minArea', filters.minArea.toString());
        if (filters?.maxArea) params = params.set('maxArea', filters.maxArea.toString());
        if (filters?.bedrooms) params = params.set('bedrooms', filters.bedrooms.toString());
        if (filters?.bathrooms) params = params.set('bathrooms', filters.bathrooms.toString());
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());
        if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
        if (filters?.sortOrder) params = params.set('sortOrder', filters.sortOrder);
        return this.http.get<PaginatedResponse<Property>>(this.apiUrl, { params });
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

    uploadVideo(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload-video`, formData, { headers: this.getHeaders() });
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
