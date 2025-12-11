import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    isActive: boolean;
    // password is optional for update/create
    password?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:3000/users';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    findAll(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    findOne(id: number): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    create(user: any): Observable<User> {
        return this.http.post<User>(this.apiUrl, user, { headers: this.getHeaders() });
    }

    update(id: number, user: any): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${id}`, user, { headers: this.getHeaders() });
    }

    remove(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    uploadAvatar(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload/avatar`, formData, { headers: this.getHeaders() });
    }
}
