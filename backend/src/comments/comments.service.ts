import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Listing } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private commentsRepository: Repository<Comment>,
        @InjectRepository(Listing)
        private listingsRepository: Repository<Listing>,
    ) { }

    // Helper: Find listing by propertyId
    private async findListingByPropertyId(propertyId: number): Promise<Listing | null> {
        return this.listingsRepository.findOne({
            where: { property: { id: propertyId } },
        });
    }

    async create(propertyId: number, content: string, user: User) {
        // Find listing for this property
        let listing = await this.findListingByPropertyId(propertyId);

        // If no listing exists, we cannot create a comment
        if (!listing) {
            throw new BadRequestException(`No listing found for property ID ${propertyId}. Comments require an associated listing.`);
        }

        const comment = this.commentsRepository.create({
            content,
            user,
            listing: { id: listing.id } as any,
        });
        const saved = await this.commentsRepository.save(comment);

        // Return with user data
        return this.commentsRepository.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });
    }

    async findByProperty(propertyId: number) {
        // Find listing for this property
        const listing = await this.findListingByPropertyId(propertyId);

        if (!listing) {
            // Return empty array if no listing
            return [];
        }

        return this.commentsRepository.find({
            where: { listing: { id: listing.id } },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    // Keep the old method for backward compatibility
    findByListing(listingId: number) {
        return this.commentsRepository.find({
            where: { listing: { id: listingId } },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });
    }

    // Get all comments (for admin)
    findAll() {
        return this.commentsRepository.find({
            relations: ['user', 'listing', 'listing.property'],
            order: { createdAt: 'DESC' },
        });
    }

    async remove(id: number) {
        const result = await this.commentsRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }
    }
}

