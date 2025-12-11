import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('property_types')
export class PropertyType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, unique: true })
    name: string;
}
