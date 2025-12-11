import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('property_images')
export class PropertyImage {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ name: 'image_url' })
    imageUrl: string;

    @Column({ name: 'is_thumbnail', default: false })
    isThumbnail: boolean;
}
