import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService, NewsArticle } from '../../services/news.service';

@Component({
    selector: 'app-news',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './news.component.html',
    styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
    articles: NewsArticle[] = [];
    loading = true;
    loadingMore = false;
    error = '';

    // Pagination
    currentPage = 1;
    totalResults = 0;
    itemsPerPage = 20;

    constructor(private newsService: NewsService) { }

    ngOnInit(): void {
        this.loadNews();
    }

    loadNews() {
        this.loading = true;
        this.error = '';
        this.currentPage = 1;

        this.newsService.getRealEstateNews().subscribe({
            next: (response) => {
                this.articles = response.articles;
                this.totalResults = response.totalResults;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load news:', err);
                this.error = 'Không thể tải tin tức. Vui lòng thử lại sau.';
                this.loading = false;
            }
        });
    }

    loadMoreNews() {
        if (this.loadingMore) return;

        this.loadingMore = true;
        this.currentPage++;

        this.newsService.searchNews('bất động sản nhà đất Việt Nam', this.currentPage).subscribe({
            next: (response) => {
                this.articles = [...this.articles, ...response.articles];
                this.loadingMore = false;
            },
            error: (err) => {
                console.error('Failed to load more news:', err);
                this.loadingMore = false;
                this.currentPage--;
            }
        });
    }

    get hasMoreArticles(): boolean {
        return this.articles.length < this.totalResults;
    }

    openArticle(url: string) {
        window.open(url, '_blank');
    }

    getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    }

    getDefaultImage(): string {
        return 'assets/news-placeholder.jpg';
    }

    onImageError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.src = 'https://via.placeholder.com/400x200?text=Tin+Tức+BĐS';
    }
}

