import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, Transaction, TransactionStatistics } from '../../../services/transaction.service';

@Component({
    selector: 'app-admin-transaction-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './transaction-list.component.html',
    styleUrls: ['./transaction-list.component.css']
})
export class AdminTransactionListComponent implements OnInit {
    transactions: Transaction[] = [];
    statistics: TransactionStatistics | null = null;
    filterStatus = '';
    currentPage = 1;
    totalPages = 1;
    totalItems = 0;

    constructor(private transactionService: TransactionService) { }

    ngOnInit(): void {
        this.loadTransactions();
        this.loadStatistics();
    }

    loadTransactions() {
        this.transactionService.findAll({
            status: this.filterStatus || undefined,
            page: this.currentPage,
            limit: 15,
        }).subscribe({
            next: (res) => {
                this.transactions = res.data;
                this.currentPage = res.pagination.page;
                this.totalPages = res.pagination.totalPages;
                this.totalItems = res.pagination.total;
            },
            error: (err) => console.error('Failed to load transactions:', err)
        });
    }

    loadStatistics() {
        this.transactionService.getStatistics().subscribe({
            next: (stats) => this.statistics = stats,
            error: (err) => console.error('Failed to load statistics:', err)
        });
    }

    onFilterChange() {
        this.currentPage = 1;
        this.loadTransactions();
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTransactions();
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'pending': return 'Đang chờ';
            case 'success': return 'Thành công';
            case 'failed': return 'Thất bại';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    }

    getPaymentMethodLabel(method: string): string {
        switch (method) {
            case 'momo': return 'MoMo';
            case 'vnpay': return 'VNPay';
            case 'bank_transfer': return 'Chuyển khoản';
            default: return method;
        }
    }

    formatPrice(amount: number): string {
        return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    }
}
