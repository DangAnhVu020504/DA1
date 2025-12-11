import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AdminComponent } from './pages/admin/admin.component';
import { UserListComponent } from './pages/admin/user-list/user-list.component';
import { UserFormComponent } from './pages/admin/user-form/user-form.component';
import { AdminPropertyListComponent } from './pages/admin/property-list/property-list.component';
import { AdminPropertyFormComponent } from './pages/admin/property-form/property-form.component';
import { AdminCommentListComponent } from './pages/admin/comment-list/comment-list.component';
import { AdminAppointmentListComponent } from './pages/admin/appointment-list/appointment-list.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { PropertyCreateComponent } from './pages/property-create/property-create.component';
import { PropertyDetailComponent } from './pages/property-detail/property-detail.component';
import { BookingComponent } from './pages/booking/booking.component';
import { MyPropertiesComponent } from './pages/my-properties/my-properties.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'my-properties', component: MyPropertiesComponent, canActivate: [authGuard] },
    { path: 'properties/create', component: PropertyCreateComponent, canActivate: [authGuard] },
    { path: 'properties/:id', component: PropertyDetailComponent, canActivate: [authGuard] },
    { path: 'booking/:propertyId', component: BookingComponent, canActivate: [authGuard] },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/users',
        component: UserListComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/users/new',
        component: UserFormComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/users/edit/:id',
        component: UserFormComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/properties',
        component: AdminPropertyListComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/properties/new',
        component: AdminPropertyFormComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/properties/edit/:id',
        component: AdminPropertyFormComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/comments',
        component: AdminCommentListComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
    {
        path: 'admin/appointments',
        component: AdminAppointmentListComponent,
        canActivate: [authGuard],
        data: { role: 'admin' }
    },
];


