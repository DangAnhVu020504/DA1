import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AppointmentService, Appointment } from './services/appointment.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'BDS Manager';
  currentUser$: Observable<any>;
  isAdmin$: Observable<boolean>;
  showNotifications = false;
  notifications: Appointment[] = [];
  notificationCount = 0;

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAdmin$ = this.currentUser$.pipe(
      map(user => user?.role === 'admin')
    );
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications() {
    this.appointmentService.getMyAppointments().pipe(
      catchError(() => of([]))
    ).subscribe(appointments => {
      this.notifications = appointments;
      this.notificationCount = appointments.filter(a => a.status === 'pending').length;
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  confirmAppointment(id: number) {
    this.appointmentService.confirm(id).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => console.error('Failed to confirm appointment:', err)
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
