import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.css']
})
export class PaymentComponent {
    selectedPlan: string | null = null;
    customAmount: number | null = null;
    orderInfo = '';
    isLoading = false;
    errorMessage = '';

    plans = [
        {
            id: 'basic',
            name: 'Gói Cơ Bản',
            price: 50000,
            icon: '🏠',
            color: '#3498db',
            features: ['Đăng 5 tin/tháng', 'Hiển thị chuẩn', 'Hỗ trợ cơ bản']
        },
        {
            id: 'pro',
            name: 'Gói Nâng Cao',
            price: 200000,
            icon: '⭐',
            color: '#f39c12',
            features: ['Đăng 20 tin/tháng', 'Ưu tiên hiển thị', 'Hỗ trợ ưu tiên', 'Báo cáo thống kê']
        },
        {
            id: 'vip',
            name: 'Gói VIP',
            price: 500000,
            icon: '👑',
            color: '#e74c3c',
            features: ['Đăng không giới hạn', 'Top hiển thị', 'Hỗ trợ 24/7', 'Báo cáo chi tiết', 'Badge VIP']
        }
    ];

    constructor(private transactionService: TransactionService) { }

    selectPlan(planId: string) {
        this.selectedPlan = planId;
        const plan = this.plans.find(p => p.id === planId);
        if (plan) {
            this.customAmount = plan.price;
            this.orderInfo = `Thanh toán ${plan.name} - BatDongSanVIP`;
        }
        this.errorMessage = '';
    }

    getSelectedPlan() {
        return this.plans.find(p => p.id === this.selectedPlan);
    }

    pay() {
        if (!this.customAmount || this.customAmount < 1000) {
            this.errorMessage = 'Số tiền tối thiểu là 1.000đ';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const info = this.orderInfo || 'Thanh toán dịch vụ BatDongSanVIP';

        this.transactionService.createPaymentUrl(this.customAmount, info).subscribe({
            next: (res) => {
                // Redirect tới trang thanh toán MoMo
                window.location.href = res.payUrl;
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Không thể tạo thanh toán. Vui lòng thử lại.';
            }
        });
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    }
}
