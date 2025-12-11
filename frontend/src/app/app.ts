import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { AppointmentService, Appointment } from './services/appointment.service';
import { PropertyService, Property } from './services/property.service';
import { map } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');
  public authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  isAdmin$ = this.currentUser$.pipe(
    map(user => user && user.role === 'admin')
  );

  // Notification states
  notifications: Appointment[] = [];
  notificationCount = 0;
  showNotifications = false;
  private notificationSubscription?: Subscription;
  private pollSubscription?: Subscription;

  // Property management states
  showPropertyMenu = false;
  myProperties: Property[] = [];

  ngOnInit() {
    // Subscribe to user changes to load notifications
    this.currentUser$.subscribe(user => {
      if (user) {
        this.loadNotifications();
        this.loadMyProperties();
        // Poll for new notifications every 30 seconds
        this.pollSubscription = interval(30000).subscribe(() => {
          this.loadNotifications();
        });
      } else {
        this.notifications = [];
        this.notificationCount = 0;
        this.myProperties = [];
        this.pollSubscription?.unsubscribe();
      }
    });
  }

  ngOnDestroy() {
    this.notificationSubscription?.unsubscribe();
    this.pollSubscription?.unsubscribe();
  }

  loadNotifications() {
    this.appointmentService.getMyAppointments().subscribe({
      next: (appointments) => {
        this.notifications = appointments;
        this.notificationCount = appointments.filter(a => a.status === 'pending').length;
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showPropertyMenu = false; // Close other dropdown
  }

  closeNotifications() {
    this.showNotifications = false;
  }

  confirmAppointment(id: number) {
    this.appointmentService.confirm(id).subscribe({
      next: () => {
        // Reload notifications after confirmation
        this.loadNotifications();
      },
      error: (err) => console.error('Failed to confirm appointment:', err)
    });
  }

  // Property management methods
  loadMyProperties() {
    this.propertyService.getMyProperties().subscribe({
      next: (properties) => {
        this.myProperties = properties;
      },
      error: (err) => console.error('Failed to load properties:', err)
    });
  }

  togglePropertyMenu() {
    this.showPropertyMenu = !this.showPropertyMenu;
    this.showNotifications = false; // Close other dropdown
    if (this.showPropertyMenu) {
      this.loadMyProperties();
    }
  }

  closePropertyMenu() {
    this.showPropertyMenu = false;
  }

  deleteProperty(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa bất động sản này?')) {
      this.propertyService.delete(id).subscribe({
        next: () => {
          this.loadMyProperties();
          alert('Xóa thành công!');
        },
        error: (err) => {
          console.error('Failed to delete property:', err);
          alert('Xóa thất bại!');
        }
      });
    }
  }

  editProperty(id: number) {
    this.showPropertyMenu = false;
    this.router.navigate(['/property-create'], { queryParams: { edit: id } });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
