import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../../services/user.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
    users: User[] = [];

    constructor(private userService: UserService, private router: Router) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.findAll().subscribe({
            next: (data) => this.users = data,
            error: (err) => console.error(err)
        });
    }

    deleteUser(id: number) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.userService.remove(id).subscribe({
                next: () => this.loadUsers(),
                error: (err) => alert('Failed to delete user')
            });
        }
    }

    editUser(id: number) {
        this.router.navigate(['/admin/users/edit', id]);
    }

    createUser() {
        this.router.navigate(['/admin/users/new']);
    }
}
