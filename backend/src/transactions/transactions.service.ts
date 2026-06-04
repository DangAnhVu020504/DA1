import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Transaction, TransactionStatus, PaymentMethod, TransactionType } from '../listings/entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import axios from 'axios';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        private configService: ConfigService,
    ) { }

    /**
     * Tạo URL thanh toán MoMo
     */
    async createMomoPayment(user: User, amount: number, orderInfo: string) {
        const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || 'MOMO';
        const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85';
        const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const apiEndpoint = this.configService.get<string>('MOMO_API_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create';
        const redirectUrl = this.configService.get<string>('MOMO_REDIRECT_URL') || 'http://localhost:3000/transactions/momo-return';
        const ipnUrl = this.configService.get<string>('MOMO_IPN_URL') || 'http://localhost:3000/transactions/momo-ipn';

        // Tạo orderId và requestId unique
        const orderId = `BDS_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const requestId = orderId;
        const requestType = 'captureWallet';
        const extraData = '';
        const lang = 'vi';

        // Tạo Transaction record với status PENDING
        const transaction = this.transactionsRepository.create({
            customer: user,
            amount,
            orderInfo,
            paymentMethod: PaymentMethod.MOMO,
            transactionType: TransactionType.SERVICE_PAYMENT,
            transactionRef: orderId,
            status: TransactionStatus.PENDING,
        });
        await this.transactionsRepository.save(transaction);

        // Tạo HMAC SHA256 signature theo tài liệu MoMo v2
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // Payload gửi tới MoMo API
        const requestBody = {
            partnerCode,
            accessKey,
            requestId,
            amount,
            orderId,
            orderInfo,
            redirectUrl,
            ipnUrl,
            extraData,
            requestType,
            signature,
            lang,
        };

        try {
            const response = await axios.post(apiEndpoint, requestBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            });

            if (response.data && response.data.payUrl) {
                return {
                    payUrl: response.data.payUrl,
                    orderId,
                    transactionId: transaction.id,
                };
            } else {
                // Cập nhật transaction thành FAILED nếu MoMo trả lỗi
                transaction.status = TransactionStatus.FAILED;
                await this.transactionsRepository.save(transaction);

                throw new BadRequestException(
                    response.data?.message || 'Không thể tạo URL thanh toán MoMo',
                );
            }
        } catch (error: unknown) {
            if (error instanceof BadRequestException) throw error;
            const err = error as { message?: string };
            console.error('MoMo API Error:', err?.message || error);

            transaction.status = TransactionStatus.FAILED;
            await this.transactionsRepository.save(transaction);

            throw new BadRequestException('Lỗi kết nối tới cổng thanh toán MoMo');
        }
    }

    /**
     * Xử lý MoMo IPN (Instant Payment Notification)
     * MoMo gọi webhook này sau khi user thanh toán
     */
    async handleMomoIPN(body: any) {
        const secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
        const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || 'F8BBA842ECF85';

        const {
            partnerCode, orderId, requestId, amount,
            orderInfo, orderType, transId,
            resultCode, message, payType,
            responseTime, extraData, signature,
        } = body;

        // Xác thực chữ ký (HMAC SHA256)
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('MoMo IPN: Invalid signature');
            throw new BadRequestException('Invalid signature');
        }

        // Tìm transaction theo orderId (transactionRef)
        const transaction = await this.transactionsRepository.findOne({
            where: { transactionRef: orderId },
        });

        if (!transaction) {
            console.error(`MoMo IPN: Transaction not found for orderId ${orderId}`);
            return { message: 'Transaction not found' };
        }

        // Cập nhật trạng thái
        if (resultCode === 0 || resultCode === '0') {
            transaction.status = TransactionStatus.SUCCESS;
        } else {
            transaction.status = TransactionStatus.FAILED;
        }

        await this.transactionsRepository.save(transaction);

        console.log(`MoMo IPN: Transaction ${orderId} => ${transaction.status}`);
        return { message: 'OK' };
    }

    /**
     * Xử lý MoMo Return URL
     * Redirect user về frontend với kết quả
     */
    handleMomoReturn(query: any): string {
        const { orderId, resultCode, message } = query;
        const status = (resultCode === '0' || resultCode === 0) ? 'success' : 'failed';
        const frontendUrl = `http://localhost:4200/payment-result?orderId=${orderId}&status=${status}&message=${encodeURIComponent(message || '')}`;
        return frontendUrl;
    }

    /**
     * Admin: Lấy tất cả giao dịch (có phân trang, lọc)
     */
    async findAll(filters?: { status?: string; page?: string; limit?: string }) {
        const query = this.transactionsRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.customer', 'customer')
            .leftJoinAndSelect('transaction.listing', 'listing')
            .orderBy('transaction.createdAt', 'DESC');

        if (filters?.status) {
            query.where('transaction.status = :status', { status: filters.status });
        }

        const page = parseInt(filters?.page || '1');
        const limit = parseInt(filters?.limit || '20');
        const skip = (page - 1) * limit;

        const total = await query.getCount();
        const data = await query.skip(skip).take(limit).getMany();

        return {
            data,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * User: Lấy lịch sử giao dịch cá nhân
     */
    async findByUser(userId: number) {
        return this.transactionsRepository.find({
            where: { customer: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Admin: Thống kê giao dịch
     */
    async getStatistics() {
        const total = await this.transactionsRepository.count();
        const success = await this.transactionsRepository.count({ where: { status: TransactionStatus.SUCCESS } });
        const pending = await this.transactionsRepository.count({ where: { status: TransactionStatus.PENDING } });
        const failed = await this.transactionsRepository.count({ where: { status: TransactionStatus.FAILED } });

        // Tổng doanh thu (chỉ tính giao dịch thành công)
        const revenueResult = await this.transactionsRepository
            .createQueryBuilder('transaction')
            .select('SUM(transaction.amount)', 'totalRevenue')
            .where('transaction.status = :status', { status: TransactionStatus.SUCCESS })
            .getRawOne();

        return {
            total,
            success,
            pending,
            failed,
            totalRevenue: parseFloat(revenueResult?.totalRevenue || '0'),
        };
    }
}
