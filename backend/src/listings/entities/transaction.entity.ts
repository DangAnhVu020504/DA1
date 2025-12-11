import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Listing } from './listing.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionStatus {
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Listing)
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column('decimal', { precision: 15, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.IN_PROGRESS,
    })
    status: TransactionStatus;

    @Column({ name: 'contract_url', nullable: true })
    contractUrl: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
