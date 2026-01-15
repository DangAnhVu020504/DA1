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

    // Multiple images support
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];

    // Video support
    selectedVideoFile: File | null = null;

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

    onFilesSelected(event: any) {
        const files: FileList = event.target.files;
        const remainingSlots = 5 - this.selectedFiles.length;

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                this.selectedFiles.push(file);

                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
        event.target.value = '';
    }

    removeImage(index: number) {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    onVideoSelected(event: any) {
        this.selectedVideoFile = event.target.files[0];
    }

    async saveProperty() {
        this.loading = true;
        this.error = '';

        try {
            // Upload all images
            const imageUrls: string[] = [];
            for (const file of this.selectedFiles) {
                const uploadRes = await this.propertyService.uploadImage(file).toPromise();
                if (uploadRes?.url) {
                    imageUrls.push(uploadRes.url);
                }
            }

            if (imageUrls.length > 0) {
                this.property.imageUrl = imageUrls[0];
                this.property.imageUrls = imageUrls;
            }

            // Upload video if selected
            if (this.selectedVideoFile) {
                const videoRes = await this.propertyService.uploadVideo(this.selectedVideoFile).toPromise();
                this.property.videoUrl = videoRes?.url;
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
            this.error = 'Lỗi upload file';
            this.loading = false;
        }
    }

    cancel() {
        this.router.navigate(['/admin/properties']);
    }
}
