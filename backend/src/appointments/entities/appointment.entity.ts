import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Listing } from '../../listings/entities/listing.entity';

export enum AppointmentStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    REJECTED = 'rejected',
    COMPLETED = 'completed',
}

@Entity('appointments')
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Listing)
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column({ name: 'full_name' })
    fullName: string;

    @Column()
    phone: string;

    @Column({ name: 'scheduled_at', type: 'date' })
    scheduledAt: Date;

    @Column('text', { nullable: true })
    message: string;

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
