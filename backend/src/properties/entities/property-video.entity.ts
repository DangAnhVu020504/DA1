import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Property } from './property.entity';

@Entity('property_videos')
export class PropertyVideo {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @Column({ name: 'video_url' })
    videoUrl: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
