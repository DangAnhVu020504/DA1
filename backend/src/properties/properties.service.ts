import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyImage } from './entities/property-image.entity';
import { PropertyVideo } from './entities/property-video.entity';
import { User } from '../users/entities/user.entity';
import { Listing, ListingStatus } from '../listings/entities/listing.entity';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
        @InjectRepository(PropertyImage)
        private propertyImagesRepository: Repository<PropertyImage>,
        @InjectRepository(PropertyVideo)
        private propertyVideosRepository: Repository<PropertyVideo>,
        @InjectRepository(Listing)
        private listingsRepository: Repository<Listing>,
    ) { }

    // Helper function to transform property and add virtual fields
    private async transformProperty(property: Property): Promise<any> {
        // Get thumbnail image
        const thumbnail = await this.propertyImagesRepository.findOne({
            where: { property: { id: property.id }, isThumbnail: true },
        });

        // If no thumbnail, get first image
        let imageUrl = thumbnail?.imageUrl;
        if (!imageUrl) {
            const firstImage = await this.propertyImagesRepository.findOne({
                where: { property: { id: property.id } },
            });
            imageUrl = firstImage?.imageUrl;
        }

        // Get video
        const video = await this.propertyVideosRepository.findOne({
            where: { property: { id: property.id } },
            order: { createdAt: 'DESC' },
        });

        return {
            ...property,
            user: property.owner, // Alias for backwards compatibility
            type: property.listingType?.code || 'sale', // Derived from listingType
            imageUrl: imageUrl || null, // Thumbnail URL
            videoUrl: video?.videoUrl || null, // Video URL
        };
    }

    async create(createPropertyDto: any, user: User) {
        const property = this.propertiesRepository.create({
            title: createPropertyDto.title,
            description: createPropertyDto.description,
            price: createPropertyDto.price,
            area: createPropertyDto.area || 0,
            address: createPropertyDto.address,
            bedrooms: createPropertyDto.bedrooms || 0,
            bathrooms: createPropertyDto.bathrooms || 0,
            direction: createPropertyDto.direction,
            legalStatus: createPropertyDto.legalStatus,
            status: createPropertyDto.status || 'draft',
            owner: user,
            propertyType: { id: createPropertyDto.typeId } as any,
            district: { id: createPropertyDto.districtId } as any,
            listingType: { id: createPropertyDto.listingTypeId } as any,
        });
        const saved = await this.propertiesRepository.save(property);

        // Save images if provided
        if (createPropertyDto.imageUrl) {
            const image = this.propertyImagesRepository.create({
                property: saved,
                imageUrl: createPropertyDto.imageUrl,
                isThumbnail: true,
            });
            await this.propertyImagesRepository.save(image);
        }

        // Save video if provided
        if (createPropertyDto.videoUrl) {
            const video = this.propertyVideosRepository.create({
                property: saved,
                videoUrl: createPropertyDto.videoUrl,
            });
            await this.propertyVideosRepository.save(video);
        }

        // Auto-create listing for this property (required for comments functionality)
        const listing = this.listingsRepository.create({
            property: { id: saved.id } as any,
            user,
            title: createPropertyDto.title,
            status: ListingStatus.PUBLISHED,
            publishedAt: new Date(),
        });
        await this.listingsRepository.save(listing);

        return this.findOne(saved.id);
    }

    async findAll(filters?: {
        search?: string;
        listingTypeId?: string;
        minPrice?: string;
        maxPrice?: string;
        cityId?: string;
        districtId?: string;
        minArea?: string;
        maxArea?: string;
        bedrooms?: string;
        bathrooms?: string;
    }) {
        const query = this.propertiesRepository.createQueryBuilder('property')
            .leftJoinAndSelect('property.owner', 'owner')
            .leftJoinAndSelect('property.propertyType', 'propertyType')
            .leftJoinAndSelect('property.listingType', 'listingType')
            .leftJoinAndSelect('property.district', 'district')
            .leftJoinAndSelect('district.city', 'city')
            .where('property.status = :status', { status: 'available' })
            .orderBy('property.createdAt', 'DESC');

        if (filters?.search) {
            query.andWhere(
                '(property.title LIKE :search OR property.address LIKE :search OR owner.fullName LIKE :search)',
                { search: `%${filters.search}%` }
            );
        }

        if (filters?.listingTypeId) {
            query.andWhere('listingType.id = :listingTypeId', { listingTypeId: parseInt(filters.listingTypeId) });
        }

        if (filters?.minPrice) {
            query.andWhere('property.price >= :minPrice', { minPrice: parseFloat(filters.minPrice) });
        }

        if (filters?.maxPrice) {
            query.andWhere('property.price <= :maxPrice', { maxPrice: parseFloat(filters.maxPrice) });
        }

        // Advanced filters
        if (filters?.cityId) {
            query.andWhere('city.id = :cityId', { cityId: parseInt(filters.cityId) });
        }

        if (filters?.districtId) {
            query.andWhere('district.id = :districtId', { districtId: parseInt(filters.districtId) });
        }

        if (filters?.minArea) {
            query.andWhere('property.area >= :minArea', { minArea: parseFloat(filters.minArea) });
        }

        if (filters?.maxArea) {
            query.andWhere('property.area <= :maxArea', { maxArea: parseFloat(filters.maxArea) });
        }

        if (filters?.bedrooms) {
            query.andWhere('property.bedrooms >= :bedrooms', { bedrooms: parseInt(filters.bedrooms) });
        }

        if (filters?.bathrooms) {
            query.andWhere('property.bathrooms >= :bathrooms', { bathrooms: parseInt(filters.bathrooms) });
        }

        const properties = await query.getMany();

        // Transform all properties to add virtual fields
        return Promise.all(properties.map(p => this.transformProperty(p)));
    }

    async findByOwner(userId: number) {
        const properties = await this.propertiesRepository.find({
            where: { owner: { id: userId } },
            relations: ['owner', 'propertyType', 'listingType', 'district', 'district.city'],
            order: { createdAt: 'DESC' },
        });
        return Promise.all(properties.map(p => this.transformProperty(p)));
    }

    async findOne(id: number) {
        const property = await this.propertiesRepository.findOne({
            where: { id },
            relations: ['owner', 'propertyType', 'listingType', 'district', 'district.city', 'amenities'],
        });
        if (!property) {
            throw new NotFoundException(`Property with ID ${id} not found`);
        }
        return this.transformProperty(property);
    }

    async update(id: number, updatePropertyDto: any) {
        const updateData: any = { ...updatePropertyDto };
        if (updatePropertyDto.typeId) {
            updateData.propertyType = { id: updatePropertyDto.typeId };
            delete updateData.typeId;
        }
        if (updatePropertyDto.districtId) {
            updateData.district = { id: updatePropertyDto.districtId };
            delete updateData.districtId;
        }
        if (updatePropertyDto.listingTypeId) {
            updateData.listingType = { id: updatePropertyDto.listingTypeId };
            delete updateData.listingTypeId;
        }

        // Handle image update
        if (updatePropertyDto.imageUrl) {
            const property = await this.propertiesRepository.findOne({ where: { id } });
            if (property) {
                // Remove old thumbnail
                await this.propertyImagesRepository.delete({
                    property: { id },
                    isThumbnail: true
                });
                // Add new thumbnail
                const image = this.propertyImagesRepository.create({
                    property: { id } as any,
                    imageUrl: updatePropertyDto.imageUrl,
                    isThumbnail: true,
                });
                await this.propertyImagesRepository.save(image);
            }
            delete updateData.imageUrl;
        }

        await this.propertiesRepository.update(id, updateData);
        return this.findOne(id);
    }

    async remove(id: number) {
        const result = await this.propertiesRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Property with ID ${id} not found`);
        }
    }
}

