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
            next: (response) => this.properties = response.data,
            error: (err) => console.error(err)
        });
    }

    goToCreate() {
        this.router.navigate(['/admin/properties/new']);
    }

    editProperty(id: number) {
        this.router.navigate(['/admin/properties/edit', id]);
    }

    viewPropertyDetail(id: number) {
        this.router.navigate(['/properties', id]);
    }

    deleteProperty(id: number) {
        if (confirm('Bạn có chắc muốn xóa tin đăng này?')) {
            this.propertyService.delete(id).subscribe({
                next: () => this.loadProperties(),
                error: (err) => console.error(err)
            });
        }
    }

    // Helper function to get proper image URL (handles both local and external URLs)
    getImageUrl(url: string | null | undefined): string {
        if (!url) return 'assets/house-placeholder.jpg';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return 'http://localhost:3000' + url;
    }
}
