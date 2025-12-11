import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, Appointment } from '../../../services/appointment.service';

@Component({
    selector: 'app-admin-appointment-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './appointment-list.component.html',
    styleUrls: ['./appointment-list.component.css']
})
export class AdminAppointmentListComponent implements OnInit {
    appointments: Appointment[] = [];

    constructor(private appointmentService: AppointmentService) { }

    ngOnInit(): void {
        this.loadAppointments();
    }

    loadAppointments() {
        this.appointmentService.findAll().subscribe({
            next: (data) => this.appointments = data,
            error: (err) => console.error(err)
        });
    }

    confirmAppointment(id: number) {
        this.appointmentService.confirm(id).subscribe({
            next: () => this.loadAppointments(),
            error: (err) => alert('Không thể xác nhận lịch hẹn')
        });
    }

    deleteAppointment(id: number) {
        if (confirm('Bạn có chắc muốn xóa lịch hẹn này?')) {
            this.appointmentService.delete(id).subscribe({
                next: () => this.loadAppointments(),
                error: (err) => alert('Không thể xóa lịch hẹn')
            });
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'rejected': return 'Đã từ chối';
            case 'completed': return 'Hoàn thành';
            default: return status;
        }
    }
}
