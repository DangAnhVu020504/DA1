import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { PropertyImage } from '../properties/entities/property-image.entity';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite)
        private favoritesRepository: Repository<Favorite>,
        @InjectRepository(PropertyImage)
        private propertyImagesRepository: Repository<PropertyImage>,
    ) { }

    async add(userId: number, propertyId: number): Promise<Favorite> {
        // Kiểm tra đã tồn tại chưa
        const existing = await this.favoritesRepository.findOne({
            where: { userId, propertyId }
        });

        if (existing) {
            throw new ConflictException('Bạn đã yêu thích tin này rồi');
        }

        const favorite = this.favoritesRepository.create({
            userId,
            propertyId
        });

        return this.favoritesRepository.save(favorite);
    }

    async remove(userId: number, propertyId: number): Promise<void> {
        const favorite = await this.favoritesRepository.findOne({
            where: { userId, propertyId }
        });

        if (!favorite) {
            throw new NotFoundException('Không tìm thấy tin yêu thích');
        }

        await this.favoritesRepository.remove(favorite);
    }

    async findByUser(userId: number): Promise<any[]> {
        const favorites = await this.favoritesRepository.find({
            where: { userId },
            relations: [
                'property',
                'property.owner',
                'property.district',
                'property.district.city',
                'property.listingType'
            ],
            order: { createdAt: 'DESC' }
        });

        // Transform each favorite to add imageUrl to property
        const transformedFavorites = await Promise.all(
            favorites.map(async (fav) => {
                if (fav.property) {
                    // Get thumbnail image
                    const thumbnail = await this.propertyImagesRepository.findOne({
                        where: { property: { id: fav.property.id }, isThumbnail: true },
                    });

                    // If no thumbnail, get first image
                    let imageUrl = thumbnail?.imageUrl;
                    if (!imageUrl) {
                        const firstImage = await this.propertyImagesRepository.findOne({
                            where: { property: { id: fav.property.id } },
                        });
                        imageUrl = firstImage?.imageUrl;
                    }

                    return {
                        ...fav,
                        property: {
                            ...fav.property,
                            imageUrl: imageUrl || null,
                        }
                    };
                }
                return fav;
            })
        );

        return transformedFavorites;
    }

    async check(userId: number, propertyId: number): Promise<boolean> {
        const favorite = await this.favoritesRepository.findOne({
            where: { userId, propertyId }
        });
        return !!favorite;
    }

    async checkMultiple(userId: number, propertyIds: number[]): Promise<number[]> {
        if (propertyIds.length === 0) return [];

        const favorites = await this.favoritesRepository.find({
            where: propertyIds.map(id => ({ userId, propertyId: id }))
        });

        return favorites.map(f => f.propertyId);
    }
}
