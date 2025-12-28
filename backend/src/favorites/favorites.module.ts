import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { PropertyImage } from '../properties/entities/property-image.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
    imports: [TypeOrmModule.forFeature([Favorite, PropertyImage])],
    controllers: [FavoritesController],
    providers: [FavoritesService],
    exports: [FavoritesService],
})
export class FavoritesModule { }
