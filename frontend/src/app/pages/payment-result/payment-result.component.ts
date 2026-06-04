import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
    selector: 'app-payment-result',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './payment-result.component.html',
    styleUrls: ['./payment-result.component.css']
})
export class PaymentResultComponent implements OnInit {
    status: string = '';
    orderId: string = '';
    message: string = '';

    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            this.status = params['status'] || 'failed';
            this.orderId = params['orderId'] || '';
            this.message = params['message'] || '';
        });
    }

    get isSuccess(): boolean {
        return this.status === 'success';
    }
}
