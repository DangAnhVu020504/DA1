import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';

export enum ListingStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    EXPIRED = 'expired',
    HIDDEN = 'hidden',
}

@Entity('listings')
export class Listing {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Property, { eager: true })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ nullable: true })
    title: string;

    @Column({
        type: 'enum',
        enum: ListingStatus,
        default: ListingStatus.DRAFT,
    })
    status: ListingStatus;

    @Column({ default: 0 })
    views: number;

    @Column({ name: 'published_at', nullable: true })
    publishedAt: Date;

    @Column({ name: 'expired_at', nullable: true })
    expiredAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
