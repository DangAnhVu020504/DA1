import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('amenities')
export class Amenity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;
}
