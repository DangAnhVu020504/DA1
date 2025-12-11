import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comment {
    id?: number;
    content: string;
    createdAt?: Date;
    user?: any;
    listing?: {
        id: number;
        property?: {
            id: number;
            title: string;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private apiUrl = 'http://localhost:3000/comments';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    // Get all comments (for admin)
    findAll(): Observable<Comment[]> {
        return this.http.get<Comment[]>(this.apiUrl);
    }

    getByProperty(propertyId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/${propertyId}`);
    }

    create(propertyId: number, content: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.apiUrl}/${propertyId}`, { content }, { headers: this.getHeaders() });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}

