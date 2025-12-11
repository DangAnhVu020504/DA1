import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../services/user.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
    user: Partial<User> = {
        role: 'customer' // default role
    };
    isEditMode = false;
    errorMessage = '';

    constructor(
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.userService.findOne(+id).subscribe({
                next: (data) => this.user = data,
                error: (err) => this.errorMessage = 'Could not load user'
            });
        }
    }

    saveUser() {
        if (this.isEditMode && this.user.id) {
            this.userService.update(this.user.id, this.user).subscribe({
                next: () => this.router.navigate(['/admin/users']),
                error: (err) => this.errorMessage = 'Failed to update user'
            });
        } else {
            this.userService.create(this.user).subscribe({
                next: () => this.router.navigate(['/admin/users']),
                error: (err) => {
                    this.errorMessage = err.error?.message || 'Failed to create user';
                }
            });
        }
    }

    cancel() {
        this.router.navigate(['/admin/users']);
    }
}
