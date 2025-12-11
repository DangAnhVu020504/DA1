import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('listings')
export class ListingsController {
    constructor(private readonly listingsService: ListingsService) { }

    // Migration endpoint: Create listings for all properties that don't have one
    @Post('migrate')
    @UseGuards(JwtAuthGuard)
    migrate() {
        return this.listingsService.migrateListingsForProperties();
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() body: { propertyId: number; title?: string }, @Request() req) {
        return this.listingsService.create(body.propertyId, req.user, body.title);
    }

    @Get()
    findAll() {
        return this.listingsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.listingsService.findOne(+id);
    }
}
