import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingStatus } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { Property } from '../properties/entities/property.entity';

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(Listing)
        private listingsRepository: Repository<Listing>,
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
    ) { }

    async create(propertyId: number, user: User, title?: string) {
        const listing = this.listingsRepository.create({
            property: { id: propertyId } as any,
            user,
            title,
            status: ListingStatus.PUBLISHED,
            publishedAt: new Date(),
        });
        return this.listingsRepository.save(listing);
    }

    findAll() {
        return this.listingsRepository.find({
            relations: ['property', 'property.owner', 'property.propertyType', 'property.listingType', 'property.district', 'user'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number) {
        const listing = await this.listingsRepository.findOne({
            where: { id },
            relations: ['property', 'property.owner', 'property.propertyType', 'property.listingType', 'property.district', 'user'],
        });
        if (!listing) {
            throw new NotFoundException(`Listing with ID ${id} not found`);
        }
        return listing;
    }

    async incrementViews(id: number) {
        await this.listingsRepository.increment({ id }, 'views', 1);
    }

    // Migrate: Create listings for all properties that don't have one
    async migrateListingsForProperties() {
        // Get all properties
        const properties = await this.propertiesRepository.find({
            relations: ['owner'],
        });

        let created = 0;
        for (const property of properties) {
            // Check if listing exists for this property
            const existingListing = await this.listingsRepository.findOne({
                where: { property: { id: property.id } },
            });

            if (!existingListing) {
                const listing = this.listingsRepository.create({
                    property: { id: property.id } as any,
                    user: property.owner,
                    title: property.title,
                    status: ListingStatus.PUBLISHED,
                    publishedAt: new Date(),
                });
                await this.listingsRepository.save(listing);
                created++;
            }
        }

        return {
            message: `Migration completed. Created ${created} listings for existing properties.`,
            createdCount: created,
            totalProperties: properties.length,
        };
    }
}
