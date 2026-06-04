import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Listing } from './listing.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    MOMO = 'momo',
    VNPAY = 'vnpay',
    BANK_TRANSFER = 'bank_transfer',
}

export enum TransactionType {
    DEPOSIT = 'deposit',
    LISTING_PAYMENT = 'listing_payment',
    SERVICE_PAYMENT = 'service_payment',
}

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Listing, { nullable: true, eager: true })
    @JoinColumn({ name: 'listing_id' })
    listing: Listing;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'customer_id' })
    customer: User;

    @Column('decimal', { precision: 15, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: TransactionStatus,
        default: TransactionStatus.PENDING,
    })
    status: TransactionStatus;

    @Column({
        name: 'payment_method',
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.MOMO,
    })
    paymentMethod: PaymentMethod;

    @Column({
        name: 'transaction_type',
        type: 'enum',
        enum: TransactionType,
        default: TransactionType.SERVICE_PAYMENT,
    })
    transactionType: TransactionType;

    @Column({ name: 'transaction_ref', nullable: true })
    transactionRef: string;

    @Column({ name: 'order_info', nullable: true })
    orderInfo: string;

    @Column({ name: 'contract_url', nullable: true })
    contractUrl: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
