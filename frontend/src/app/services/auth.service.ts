import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export interface User {
    id: number;
    email: string;
    role: string;
    fullName?: string;
    avatar?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000'; // Default NestJS port
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    // Thêm trạng thái loading để Auth Guard biết khi nào đã load xong
    private isLoadingSubject = new BehaviorSubject<boolean>(true);
    public isLoading$ = this.isLoadingSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUserFromToken();
    }

    private loadUserFromToken() {
        const token = localStorage.getItem('token');
        if (token) {
            this.getProfile().subscribe({
                next: (user) => {
                    this.currentUserSubject.next(user);
                    this.isLoadingSubject.next(false);
                },
                error: () => {
                    this.logout();
                    this.isLoadingSubject.next(false);
                }
            });
        } else {
            // Không có token, đánh dấu loading xong ngay
            this.isLoadingSubject.next(false);
        }
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
            tap((response: any) => {
                if (response.access_token) {
                    localStorage.setItem('token', response.access_token);
                    // Không cần set isLoading = true vì sẽ load ngay
                    this.isLoadingSubject.next(true);
                    this.loadUserFromToken();
                }
            })
        );
    }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/register`, data);
    }

    getProfile(): Observable<any> {
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get(`${this.apiUrl}/auth/profile`, { headers });
    }

    logout() {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    updateCurrentUser(user: User) {
        this.currentUserSubject.next(user);
    }
}
