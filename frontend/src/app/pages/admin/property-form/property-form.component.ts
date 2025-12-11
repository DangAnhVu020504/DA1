import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertyService } from '../../../services/property.service';

@Component({
    selector: 'app-admin-property-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.css']
})
export class AdminPropertyFormComponent implements OnInit {
    property: any = {
        title: '',
        type: 'sale',
        description: '',
        price: null,
        address: '',
        imageUrl: ''
    };
    isEditMode = false;
    propertyId: number | null = null;
    selectedFile: File | null = null;
    loading = false;
    error = '';

    constructor(
        private propertyService: PropertyService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.propertyId = +id;
            this.loadProperty();
        }
    }

    loadProperty() {
        if (this.propertyId) {
            this.propertyService.findOne(this.propertyId).subscribe({
                next: (data) => {
                    this.property = data;
                },
                error: (err) => {
                    this.error = 'Không tải được tin đăng';
                    console.error(err);
                }
            });
        }
    }

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    async saveProperty() {
        this.loading = true;
        this.error = '';

        try {
            if (this.selectedFile) {
                const uploadRes = await this.propertyService.uploadImage(this.selectedFile).toPromise();
                this.property.imageUrl = uploadRes.url;
            }

            if (this.isEditMode && this.propertyId) {
                this.propertyService.update(this.propertyId, this.property).subscribe({
                    next: () => this.router.navigate(['/admin/properties']),
                    error: (err) => {
                        this.error = 'Lỗi khi cập nhật';
                        this.loading = false;
                    }
                });
            } else {
                this.propertyService.create(this.property).subscribe({
                    next: () => this.router.navigate(['/admin/properties']),
                    error: (err) => {
                        this.error = 'Lỗi khi tạo mới';
                        this.loading = false;
                    }
                });
            }
        } catch (err) {
            this.error = 'Lỗi upload ảnh';
            this.loading = false;
        }
    }

    cancel() {
        this.router.navigate(['/admin/properties']);
    }
}
