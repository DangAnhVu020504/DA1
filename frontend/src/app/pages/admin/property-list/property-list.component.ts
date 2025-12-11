import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../../services/property.service';

@Component({
    selector: 'app-admin-property-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './property-list.component.html',
    styleUrls: ['./property-list.component.css']
})
export class AdminPropertyListComponent implements OnInit {
    properties: Property[] = [];

    constructor(private propertyService: PropertyService, private router: Router) { }

    ngOnInit(): void {
        this.loadProperties();
    }

    loadProperties() {
        this.propertyService.findAll().subscribe({
            next: (data) => this.properties = data,
            error: (err) => console.error(err)
        });
    }

    goToCreate() {
        this.router.navigate(['/admin/properties/new']);
    }

    editProperty(id: number) {
        this.router.navigate(['/admin/properties/edit', id]);
    }

    deleteProperty(id: number) {
        if (confirm('Bạn có chắc muốn xóa tin đăng này?')) {
            this.propertyService.delete(id).subscribe({
                next: () => this.loadProperties(),
                error: (err) => console.error(err)
            });
        }
    }
}
