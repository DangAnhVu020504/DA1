import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { City } from './city.entity';

@Entity('districts')
export class District {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @ManyToOne(() => City, city => city.districts)
    @JoinColumn({ name: 'city_id' })
    city: City;
}
