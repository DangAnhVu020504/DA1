import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.css'
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMsg: string = '';

    // Forgot Password
    showForgotPassword = false;
    isResetting = false;
    resetMessage = '';
    forgotData = {
        email: '',
        phone: '',
        newPassword: '',
        confirmPassword: ''
    };

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private http: HttpClient
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.authService.login(this.loginForm.value).subscribe({
                next: () => {
                    this.router.navigate(['/home']);
                },
                error: (err) => {
                    console.error(err);
                    this.errorMsg = 'Invalid credentials';
                }
            });
        }
    }

    toggleForgotPassword() {
        this.showForgotPassword = !this.showForgotPassword;
        this.resetMessage = '';
        if (!this.showForgotPassword) {
            this.forgotData = {
                email: '',
                phone: '',
                newPassword: '',
                confirmPassword: ''
            };
        }
    }

    resetPassword() {
        this.resetMessage = '';

        // Validate email
        if (!this.forgotData.email || !this.forgotData.email.includes('@')) {
            this.resetMessage = '❌ Vui lòng nhập email hợp lệ!';
            return;
        }

        // Validate phone
        if (!this.forgotData.phone) {
            this.resetMessage = '❌ Vui lòng nhập số điện thoại!';
            return;
        }

        // Validate new password
        if (!this.forgotData.newPassword || this.forgotData.newPassword.length < 6) {
            this.resetMessage = '❌ Mật khẩu mới phải có ít nhất 6 ký tự!';
            return;
        }

        // Validate confirm password
        if (this.forgotData.newPassword !== this.forgotData.confirmPassword) {
            this.resetMessage = '❌ Xác nhận mật khẩu không khớp!';
            return;
        }

        this.isResetting = true;

        this.http.post('http://localhost:3000/auth/reset-password', {
            email: this.forgotData.email,
            phone: this.forgotData.phone,
            newPassword: this.forgotData.newPassword
        }).subscribe({
            next: () => {
                this.resetMessage = '✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập.';
                this.isResetting = false;
                setTimeout(() => {
                    this.toggleForgotPassword();
                }, 2000);
            },
            error: (err) => {
                this.isResetting = false;
                if (err.status === 404) {
                    this.resetMessage = '❌ Email hoặc số điện thoại không đúng!';
                } else {
                    this.resetMessage = '❌ Lỗi khi đặt lại mật khẩu!';
                }
            }
        });
    }
}

