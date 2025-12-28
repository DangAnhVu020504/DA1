import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { PropertyService, Property } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-booking',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './booking.component.html',
    styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
    propertyId: number | null = null;
    property: Property | null = null;
    currentUserId: number | null = null;

    booking = {
        fullName: '',
        phone: '',
        appointmentDate: '',
        message: ''
    };

    loading = false;
    success = false;
    error = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private appointmentService: AppointmentService,
        private propertyService: PropertyService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('propertyId');
        if (id) {
            this.propertyId = +id;
            this.loadProperty();
        }

        // Get current user ID
        this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.currentUserId = user.id;
                // Pre-fill form with user info
                this.booking.fullName = user.fullName || '';
            }
        });
    }

    loadProperty() {
        if (this.propertyId) {
            this.propertyService.findOne(this.propertyId).subscribe({
                next: (data) => this.property = data,
                error: (err) => console.error(err)
            });
        }
    }

    submitBooking() {
        if (!this.propertyId) return;

        this.loading = true;
        this.error = '';

        this.appointmentService.create({
            ...this.booking,
            propertyId: this.propertyId,
            customerId: this.currentUserId
        }).subscribe({
            next: () => {
                this.success = true;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
                this.loading = false;
                console.error(err);
            }
        });
    }

    goBack() {
        if (this.propertyId) {
            this.router.navigate(['/properties', this.propertyId]);
        } else {
            this.router.navigate(['/home']);
        }
    }
}

