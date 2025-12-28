import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsArticle {
    source: string;
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    image: string | null;
    publishedAt: string;
}

export interface NewsResponse {
    status: string;
    totalResults: number;
    articles: NewsArticle[];
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NewsService {
    private apiUrl = 'http://localhost:3000/news';

    constructor(private http: HttpClient) { }

    getRealEstateNews(): Observable<NewsResponse> {
        return this.http.get<NewsResponse>(`${this.apiUrl}/real-estate`);
    }

    searchNews(query: string, page: number = 1): Observable<NewsResponse> {
        return this.http.get<NewsResponse>(this.apiUrl, {
            params: { q: query, page: page.toString(), pageSize: '12' }
        });
    }
}
