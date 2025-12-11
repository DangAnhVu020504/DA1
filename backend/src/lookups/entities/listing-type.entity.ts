import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('listing_types')
export class ListingType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 20, unique: true })
    code: string;  // 'sale', 'rent'

    @Column({ length: 100 })
    name: string;  // 'Nhà đất bán', 'Nhà đất cho thuê'
}
