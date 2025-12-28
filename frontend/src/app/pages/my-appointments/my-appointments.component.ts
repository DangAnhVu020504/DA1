import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService, Appointment } from '../../services/appointment.service';

@Component({
    selector: 'app-my-appointments',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './my-appointments.component.html',
    styleUrls: ['./my-appointments.component.css']
})
export class MyAppointmentsComponent implements OnInit {
    sentAppointments: Appointment[] = [];
    receivedAppointments: Appointment[] = [];
    activeTab: 'sent' | 'received' = 'received';
    loading = true;

    constructor(private appointmentService: AppointmentService) { }

    ngOnInit(): void {
        this.loadAppointments();
    }

    loadAppointments() {
        this.loading = true;

        // Load received appointments
        this.appointmentService.getMyAppointments().subscribe({
            next: (data) => this.receivedAppointments = data,
            error: () => this.receivedAppointments = []
        });

        // Load sent appointments
        this.appointmentService.getSentAppointments().subscribe({
            next: (data) => {
                this.sentAppointments = data;
                this.loading = false;
            },
            error: () => {
                this.sentAppointments = [];
                this.loading = false;
            }
        });
    }

    setTab(tab: 'sent' | 'received') {
        this.activeTab = tab;
    }

    confirmAppointment(id: number) {
        this.appointmentService.confirm(id).subscribe({
            next: () => this.loadAppointments(),
            error: (err) => console.error('Failed to confirm:', err)
        });
    }

    deleteAppointment(id: number) {
        if (confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
            this.appointmentService.delete(id).subscribe({
                next: () => this.loadAppointments(),
                error: (err) => console.error('Failed to delete:', err)
            });
        }
    }

    getStatusText(status: string): string {
        const statusMap: { [key: string]: string } = {
            'pending': 'Chờ xác nhận',
            'confirmed': 'Đã xác nhận',
            'rejected': 'Đã từ chối',
            'completed': 'Hoàn thành'
        };
        return statusMap[status] || status;
    }

    getStatusClass(status: string): string {
        return `status-${status}`;
    }
}
