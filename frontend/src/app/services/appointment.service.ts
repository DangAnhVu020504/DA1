import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Appointment {
    id?: number;
    fullName: string;
    phone: string;
    appointmentDate?: string;
    scheduledAt?: string;
    message?: string;
    propertyId?: number;
    status?: string;
    createdAt?: Date;
    listing?: {
        id: number;
        title: string;
        property?: {
            id: number;
            title: string;
        };
    };
}

export interface AppointmentCount {
    total: number;
    pending: number;
}

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = 'http://localhost:3000/appointments';

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    create(appointment: Appointment): Observable<any> {
        return this.http.post(this.apiUrl, appointment);
    }

    // Get appointments for current user's properties (for notifications)
    getMyAppointments(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.apiUrl}/my`, { headers: this.getHeaders() });
    }

    // Get count of pending appointments (for badge)
    getMyCount(): Observable<AppointmentCount> {
        return this.http.get<AppointmentCount>(`${this.apiUrl}/my/count`, { headers: this.getHeaders() });
    }

    // Confirm an appointment
    confirm(id: number): Observable<Appointment> {
        return this.http.post<Appointment>(`${this.apiUrl}/${id}/confirm`, {}, { headers: this.getHeaders() });
    }

    // Get all appointments (for admin)
    findAll(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(this.apiUrl);
    }

    // Delete an appointment
    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }
}



