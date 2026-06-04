import { Controller, Get, Post, Body, Query, Res, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { TransactionsService } from './transactions.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    /**
     * POST /transactions/create-payment-url
     * Tạo URL thanh toán MoMo - cần đăng nhập
     */
    @Post('create-payment-url')
    @UseGuards(JwtAuthGuard)
    async createPaymentUrl(@Body() dto: CreatePaymentDto, @Request() req) {
        return this.transactionsService.createMomoPayment(
            req.user,
            dto.amount,
            dto.orderInfo || 'Thanh toán dịch vụ BatDongSanVIP',
        );
    }

    /**
     * POST /transactions/momo-ipn
     * MoMo IPN callback - KHÔNG cần auth (MoMo gọi trực tiếp)
     */
    @Post('momo-ipn')
    async momoIPN(@Body() body: any) {
        return this.transactionsService.handleMomoIPN(body);
    }

    /**
     * GET /transactions/momo-return
     * MoMo redirect user về đây sau khi thanh toán - redirect tới frontend
     */
    @Get('momo-return')
    async momoReturn(@Query() query: any, @Res() res: Response) {
        const frontendUrl = this.transactionsService.handleMomoReturn(query);
        return res.redirect(frontendUrl);
    }

    /**
     * GET /transactions/statistics
     * Admin: Thống kê doanh thu
     */
    @Get('statistics')
    @UseGuards(JwtAuthGuard)
    async getStatistics() {
        return this.transactionsService.getStatistics();
    }

    /**
     * GET /transactions/my
     * User: Lịch sử giao dịch cá nhân
     */
    @Get('my')
    @UseGuards(JwtAuthGuard)
    async findMy(@Request() req) {
        return this.transactionsService.findByUser(req.user.id);
    }

    /**
     * GET /transactions
     * Admin: Tất cả giao dịch (phân trang + lọc)
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() query: any) {
        return this.transactionsService.findAll({
            status: query.status,
            page: query.page,
            limit: query.limit,
        });
    }
}
