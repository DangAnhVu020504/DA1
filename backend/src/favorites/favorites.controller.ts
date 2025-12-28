import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Post(':propertyId')
    add(@Request() req, @Param('propertyId') propertyId: string) {
        return this.favoritesService.add(req.user.id, +propertyId);
    }

    @Delete(':propertyId')
    remove(@Request() req, @Param('propertyId') propertyId: string) {
        return this.favoritesService.remove(req.user.id, +propertyId);
    }

    @Get()
    findAll(@Request() req) {
        return this.favoritesService.findByUser(req.user.id);
    }

    @Get('check/:propertyId')
    check(@Request() req, @Param('propertyId') propertyId: string) {
        return this.favoritesService.check(req.user.id, +propertyId);
    }
}
