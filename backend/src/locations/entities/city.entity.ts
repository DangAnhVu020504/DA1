import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { District } from './district.entity';

@Entity('cities')
export class City {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @OneToMany(() => District, district => district.city)
    districts: District[];
}
