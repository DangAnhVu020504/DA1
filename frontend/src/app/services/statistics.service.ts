import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Statistics {
    totals: {
        users: number;
        properties: number;
        comments: number;
        appointments: number;
    };
    appointmentsByStatus: {
        pending: number;
        confirmed: number;
        completed: number;
    };
    propertiesByStatus: {
        available: number;
        sold: number;
        rented: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class StatisticsService {
    private apiUrl = 'http://localhost:3000/statistics';

    constructor(private http: HttpClient) { }

    getStatistics(): Observable<Statistics> {
        return this.http.get<Statistics>(this.apiUrl);
    }
}
