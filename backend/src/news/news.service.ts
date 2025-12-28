import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

interface RssItem {
    title: string[];
    link: string[];
    description: string[];
    pubDate: string[];
}

interface RssChannel {
    title: string[];
    item: RssItem[];
}

interface RssResponse {
    rss: {
        channel: RssChannel[];
    };
}

@Injectable()
export class NewsService {
    private cache: { data: any; timestamp: number } | null = null;
    private readonly cacheDuration = 15 * 60 * 1000; // 15 minutes

    // VnExpress RSS feeds for real estate
    private readonly rssSources = [
        {
            name: 'VnExpress',
            url: 'https://vnexpress.net/rss/bat-dong-san.rss',
            icon: '📰'
        },
        {
            name: 'CafeF',
            url: 'https://cafef.vn/rss/bat-dong-san.rss',
            icon: '💰'
        }
    ];

    async getNews(query: string, page: number = 1, pageSize: number = 12) {
        return this.getRealEstateNews();
    }

    async getRealEstateNews() {
        // Check cache
        if (this.cache && Date.now() - this.cache.timestamp < this.cacheDuration) {
            return this.cache.data;
        }

        try {
            const allArticles: any[] = [];

            // Fetch from VnExpress (primary source)
            const vnexpressArticles = await this.fetchRss(this.rssSources[0]);
            allArticles.push(...vnexpressArticles);

            // Try to fetch from CafeF (secondary source)
            try {
                const cafefArticles = await this.fetchRss(this.rssSources[1]);
                allArticles.push(...cafefArticles);
            } catch (e) {
                console.log('CafeF RSS failed, continuing with VnExpress only');
            }

            // Sort by date (newest first)
            allArticles.sort((a, b) =>
                new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

            const result = {
                status: 'success',
                totalResults: allArticles.length,
                articles: allArticles.slice(0, 50) // Limit to 50 articles
            };

            // Update cache
            this.cache = { data: result, timestamp: Date.now() };

            return result;
        } catch (error) {
            console.error('RSS Error:', error.message);
            return {
                status: 'error',
                totalResults: 0,
                articles: [],
                message: 'Không thể tải tin tức lúc này'
            };
        }
    }

    private async fetchRss(source: { name: string; url: string; icon: string }) {
        const response = await axios.get(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const parsed: RssResponse = await parseStringPromise(response.data);
        const items = parsed.rss.channel[0].item || [];

        return items.map(item => {
            const description = item.description?.[0] || '';
            const image = this.extractImage(description);
            const cleanDescription = this.cleanHtml(description);

            return {
                source: `${source.icon} ${source.name}`,
                author: source.name,
                title: item.title?.[0] || 'Không có tiêu đề',
                description: cleanDescription || 'Xem chi tiết bài viết...',
                url: item.link?.[0] || '#',
                image: image || 'https://via.placeholder.com/400x200?text=Tin+BDS',
                publishedAt: item.pubDate?.[0] || new Date().toISOString()
            };
        });
    }

    private extractImage(html: string): string | null {
        // Extract image from description CDATA
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) {
            return imgMatch[1];
        }

        // Try to find image URL directly
        const urlMatch = html.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|gif|webp)/i);
        return urlMatch ? urlMatch[0] : null;
    }

    private cleanHtml(html: string): string {
        // Remove HTML tags and get text content
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim()
            .substring(0, 200);
    }
}


