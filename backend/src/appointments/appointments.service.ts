import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { Listing } from '../listings/entities/listing.entity';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentsRepository: Repository<Appointment>,
        @InjectRepository(Listing)
        private listingsRepository: Repository<Listing>,
    ) { }

    // Helper: Find listing by propertyId
    private async findListingByPropertyId(propertyId: number): Promise<Listing | null> {
        return this.listingsRepository.findOne({
            where: { property: { id: propertyId } },
        });
    }

    async create(data: any) {
        let listingId = data.listingId;

        // If propertyId is provided (from frontend), find the listing
        if (data.propertyId && !listingId) {
            const listing = await this.findListingByPropertyId(data.propertyId);
            if (!listing) {
                throw new BadRequestException(`No listing found for property ID ${data.propertyId}. Please ensure the property has an associated listing.`);
            }
            listingId = listing.id;
        }

        if (!listingId) {
            throw new BadRequestException('Either propertyId or listingId must be provided.');
        }

        const appointment = this.appointmentsRepository.create({
            fullName: data.fullName,
            phone: data.phone,
            scheduledAt: data.scheduledAt || data.appointmentDate,
            message: data.message,
            listing: { id: listingId } as any,
            customer: data.customerId ? { id: data.customerId } as any : null,
        });
        return this.appointmentsRepository.save(appointment);
    }

    findAll() {
        return this.appointmentsRepository.find({
            relations: ['listing', 'listing.property', 'customer'],
            order: { createdAt: 'DESC' },
        });
    }

    findByListing(listingId: number) {
        return this.appointmentsRepository.find({
            where: { listing: { id: listingId } },
            order: { scheduledAt: 'ASC' },
        });
    }

    // Find all appointments for properties owned by a specific user
    async findByOwner(ownerId: number) {
        // Get all appointments where the listing's property owner is this user
        const appointments = await this.appointmentsRepository.find({
            relations: ['listing', 'listing.property', 'listing.property.owner'],
            order: { createdAt: 'DESC' },
        });

        // Filter appointments where the property owner matches
        return appointments.filter(
            apt => apt.listing?.property?.owner?.id === ownerId
        );
    }

    // Count pending appointments for a specific owner
    async countPendingByOwner(ownerId: number) {
        const appointments = await this.findByOwner(ownerId);
        return {
            total: appointments.length,
            pending: appointments.filter(apt => apt.status === 'pending').length,
        };
    }

    // Update appointment status
    async updateStatus(id: number, status: string) {
        const appointment = await this.appointmentsRepository.findOne({ where: { id } });
        if (!appointment) {
            throw new BadRequestException(`Appointment with ID ${id} not found`);
        }
        appointment.status = status as any;
        return this.appointmentsRepository.save(appointment);
    }

    // Confirm an appointment
    async confirm(id: number) {
        return this.updateStatus(id, 'confirmed');
    }

    // Delete an appointment
    async remove(id: number) {
        const result = await this.appointmentsRepository.delete(id);
        if (result.affected === 0) {
            throw new BadRequestException(`Appointment with ID ${id} not found`);
        }
    }
}


