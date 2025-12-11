import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
    user: any;
    loading: boolean = true;
    error: string = '';

    // Edit mode state
    isEditing: boolean = false;
    showRoleDropdown: boolean = false;
    editForm = {
        fullName: '',
        email: '',
        phone: '',
        role: ''
    };

    // Available roles for selection (excluding admin)
    availableRoles = [
        { value: 'customer', label: '👥 Người dùng' },
        { value: 'agent', label: '🤝 Người môi giới' },
        { value: 'owner', label: '🏠 Chủ bất động sản' }
    ];

    constructor(
        private authService: AuthService,
        private router: Router,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.loadProfile();
    }

    loadProfile() {
        this.loading = true;
        this.authService.getProfile().subscribe({
            next: (data) => {
                this.user = data;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Không thể tải hồ sơ. Vui lòng đăng nhập lại.';
                this.loading = false;
                setTimeout(() => {
                    this.router.navigate(['/login']);
                }, 2000);
            }
        });
    }

    // Edit mode methods
    toggleEdit() {
        if (!this.isEditing) {
            // Enter edit mode - copy current values
            this.editForm.fullName = this.user.fullName;
            this.editForm.email = this.user.email;
            this.editForm.phone = this.user.phone || '';
            this.editForm.role = this.user.role;
        }
        this.isEditing = !this.isEditing;
        this.showRoleDropdown = false;
    }

    cancelEdit() {
        this.isEditing = false;
        this.showRoleDropdown = false;
    }

    saveProfile() {
        const updateData = {
            fullName: this.editForm.fullName,
            email: this.editForm.email,
            phone: this.editForm.phone,
            role: this.editForm.role
        };

        const userId = this.user.userId || this.user.id;
        this.userService.update(userId, updateData).subscribe({
            next: (updatedUser) => {
                this.user.fullName = this.editForm.fullName;
                this.user.email = this.editForm.email;
                this.user.phone = this.editForm.phone;
                this.user.role = this.editForm.role;
                this.isEditing = false;
                this.showRoleDropdown = false;
                alert('Cập nhật hồ sơ thành công!');
            },
            error: (err) => {
                console.error('Update failed:', err);
                alert('Cập nhật thất bại: ' + (err.error?.message || err.statusText || 'Lỗi không xác định'));
            }
        });
    }

    toggleRoleDropdown() {
        this.showRoleDropdown = !this.showRoleDropdown;
    }

    selectRole(role: string) {
        this.editForm.role = role;
        this.showRoleDropdown = false;
    }

    getSelectedRoleLabel(): string {
        const found = this.availableRoles.find(r => r.value === this.editForm.role);
        return found ? found.label : this.editForm.role;
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.userService.uploadAvatar(file).subscribe({
                next: (res) => {
                    this.user.avatar = res.avatar;
                },
                error: (err) => {
                    console.error('Upload failed:', err);
                    alert('Failed to upload avatar: ' + (err.error?.message || err.statusText || 'Unknown error'));
                }
            });
        }
    }

    getAvatarUrl(): string {
        if (this.user && this.user.avatar) {
            return `http://localhost:3000${this.user.avatar}`;
        }
        return 'assets/default-avatar.png';
    }

    triggerFileInput(fileInput: HTMLInputElement) {
        fileInput.click();
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    getRoleLabel(role: string): string {
        const roleLabels: { [key: string]: string } = {
            admin: '👨‍💼 Quản Trị Viên',
            owner: '🏠 Chủ bất động sản',
            agent: '🤝 Người môi giới',
            customer: '👥 Người dùng'
        };
        return roleLabels[role] || role;
    }

    getRoleBadgeClass(role: string): string {
        const classes: { [key: string]: string } = {
            admin: 'badge-primary',
            owner: 'badge-success',
            agent: 'badge-info',
            customer: 'badge-secondary'
        };
        return classes[role] || 'badge-secondary';
    }
}
