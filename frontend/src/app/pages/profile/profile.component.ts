import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import { FavoriteService } from '../../services/favorite.service';
import { AppointmentService } from '../../services/appointment.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
    user: any;
    isEditing = false;
    editData: any = {};
    isSaving = false;
    saveMessage = '';

    // Stats
    propertiesCount = 0;
    favoritesCount = 0;
    appointmentsCount = 0;

    // Avatar Upload
    isUploadingAvatar = false;

    // Password Change
    showPasswordForm = false;
    isChangingPassword = false;
    passwordMessage = '';
    passwordData = {
        email: '',
        phone: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    constructor(
        private authService: AuthService,
        private propertyService: PropertyService,
        private favoriteService: FavoriteService,
        private appointmentService: AppointmentService,
        private userService: UserService,
        private router: Router,
        private http: HttpClient
    ) { }

    ngOnInit() {
        this.authService.getProfile().subscribe({
            next: (data) => {
                this.user = data;
                this.editData = { ...data };
                this.loadStats();
            },
            error: () => this.router.navigate(['/login'])
        });
    }

    loadStats() {
        // Load user's properties count
        this.propertyService.getMyProperties().subscribe({
            next: (props) => this.propertiesCount = props.length,
            error: () => this.propertiesCount = 0
        });

        // Load user's favorites count
        this.favoriteService.getAll().subscribe({
            next: (favs) => this.favoritesCount = favs.length,
            error: () => this.favoritesCount = 0
        });

        // Load user's appointments count
        this.appointmentService.getMyAppointments().subscribe({
            next: (apps) => this.appointmentsCount = apps.length,
            error: () => this.appointmentsCount = 0
        });
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        this.saveMessage = '';
        if (!this.isEditing) {
            this.editData = { ...this.user };
        }
    }

    saveProfile() {
        this.isSaving = true;
        this.saveMessage = '';

        const updateData = {
            fullName: this.editData.fullName,
            phone: this.editData.phone,
            address: this.editData.address
        };

        this.userService.update(this.user.id, updateData).subscribe({
            next: (updatedUser) => {
                this.user = { ...this.user, ...updateData };
                this.authService.updateCurrentUser(this.user);
                this.isEditing = false;
                this.isSaving = false;
                this.saveMessage = '✅ Cập nhật thành công!';
                setTimeout(() => this.saveMessage = '', 3000);
            },
            error: (err) => {
                console.error('Failed to save profile:', err);
                this.isSaving = false;
                this.saveMessage = '❌ Lỗi khi lưu thông tin!';
            }
        });
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    // Password Change Methods
    togglePasswordForm() {
        this.showPasswordForm = !this.showPasswordForm;
        this.passwordMessage = '';
        if (!this.showPasswordForm) {
            this.resetPasswordForm();
        }
    }

    resetPasswordForm() {
        this.passwordData = {
            email: '',
            phone: '',
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        };
        this.passwordMessage = '';
    }

    changePassword() {
        this.passwordMessage = '';

        // Validate email matches
        if (this.passwordData.email !== this.user.email) {
            this.passwordMessage = '❌ Email không khớp với tài khoản!';
            return;
        }

        // Validate phone matches
        if (this.passwordData.phone !== this.user.phone) {
            this.passwordMessage = '❌ Số điện thoại không khớp với tài khoản!';
            return;
        }

        // Validate new password
        if (!this.passwordData.newPassword || this.passwordData.newPassword.length < 6) {
            this.passwordMessage = '❌ Mật khẩu mới phải có ít nhất 6 ký tự!';
            return;
        }

        // Validate confirm password
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            this.passwordMessage = '❌ Xác nhận mật khẩu không khớp!';
            return;
        }

        this.isChangingPassword = true;

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post('http://localhost:3000/auth/change-password', {
            oldPassword: this.passwordData.oldPassword,
            newPassword: this.passwordData.newPassword
        }, { headers }).subscribe({
            next: () => {
                this.passwordMessage = '✅ Đổi mật khẩu thành công!';
                this.isChangingPassword = false;
                setTimeout(() => {
                    this.togglePasswordForm();
                }, 2000);
            },
            error: (err) => {
                this.isChangingPassword = false;
                if (err.status === 401) {
                    this.passwordMessage = '❌ Mật khẩu cũ không đúng!';
                } else {
                    this.passwordMessage = '❌ Lỗi khi đổi mật khẩu!';
                }
            }
        });
    }

    // Avatar Upload Method
    onAvatarSelected(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh!');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước ảnh tối đa là 5MB!');
            return;
        }

        this.isUploadingAvatar = true;

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post<{ avatar: string }>('http://localhost:3000/users/upload/avatar', formData, { headers }).subscribe({
            next: (response) => {
                this.user.avatar = response.avatar;
                this.authService.updateCurrentUser(this.user);
                this.isUploadingAvatar = false;
                alert('✅ Cập nhật ảnh đại diện thành công!');
            },
            error: (err) => {
                console.error('Avatar upload failed:', err);
                this.isUploadingAvatar = false;
                alert('❌ Lỗi khi tải ảnh lên!');
            }
        });

        // Reset input to allow selecting same file again
        event.target.value = '';
    }
}



