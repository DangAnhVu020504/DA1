import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { District } from '../../locations/entities/district.entity';
import { PropertyType } from '../../lookups/entities/property-type.entity';
import { ListingType } from '../../lookups/entities/listing-type.entity';
import { Amenity } from '../../lookups/entities/amenity.entity';

export enum PropertyDirection {
    DONG = 'Dong',
    TAY = 'Tay',
    NAM = 'Nam',
    BAC = 'Bac',
    DONG_NAM = 'Dong Nam',
    DONG_BAC = 'Dong Bac',
    TAY_NAM = 'Tay Nam',
    TAY_BAC = 'Tay Bac',
}

export enum PropertyStatus {
    AVAILABLE = 'available',
    PENDING = 'pending',
    SOLD = 'sold',
    RENTED = 'rented',
    DRAFT = 'draft',
}

@Entity('properties')
export class Property {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @ManyToOne(() => PropertyType, { eager: true })
    @JoinColumn({ name: 'type_id' })
    propertyType: PropertyType;

    @ManyToOne(() => District, { eager: true })
    @JoinColumn({ name: 'district_id' })
    district: District;

    @ManyToOne(() => ListingType, { eager: true })
    @JoinColumn({ name: 'listing_type_id' })
    listingType: ListingType;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('decimal', { precision: 15, scale: 2 })
    price: number;

    @Column('decimal', { precision: 10, scale: 2 })
    area: number;

    @Column()
    address: string;

    @Column({ default: 0 })
    bedrooms: number;

    @Column({ default: 0 })
    bathrooms: number;

    @Column({
        type: 'enum',
        enum: PropertyDirection,
        nullable: true,
    })
    direction: PropertyDirection;

    @Column({ name: 'legal_status', length: 100, nullable: true })
    legalStatus: string;

    @Column({
        type: 'enum',
        enum: PropertyStatus,
        default: PropertyStatus.DRAFT,
    })
    status: PropertyStatus;

    @Column({ default: 0 })
    views: number;

    @ManyToMany(() => Amenity)
    @JoinTable({
        name: 'property_amenities',
        joinColumn: { name: 'property_id' },
        inverseJoinColumn: { name: 'amenity_id' },
    })
    amenities: Amenity[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
