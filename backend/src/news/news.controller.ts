import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
    constructor(private readonly newsService: NewsService) { }

    @Get()
    async getNews(
        @Query('q') query?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string
    ) {
        return this.newsService.getNews(
            query || 'bất động sản Vietnam',
            parseInt(page || '1'),
            parseInt(pageSize || '12')
        );
    }

    @Get('real-estate')
    async getRealEstateNews() {
        return this.newsService.getRealEstateNews();
    }
}
