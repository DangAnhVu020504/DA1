import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../services/property.service';
import { LookupService, City, District, PropertyType, ListingType } from '../../services/lookup.service';

@Component({
    selector: 'app-property-create',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-create.component.html',
    styleUrls: ['./property-create.component.css']
})
export class PropertyCreateComponent implements OnInit {
    property: any = {
        title: '',
        listingTypeId: null,
        typeId: null,
        districtId: null,
        description: '',
        price: null,
        area: null,
        address: '',
        bedrooms: 0,
        bathrooms: 0
    };

    cities: City[] = [];
    districts: District[] = [];
    propertyTypes: PropertyType[] = [];
    listingTypes: ListingType[] = [];
    selectedCityId: number | null = null;

    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    selectedVideoFile: File | null = null;
    loading = false;
    error = '';

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadLookups();
    }

    loadLookups() {
        this.lookupService.getCities().subscribe(data => this.cities = data);
        this.lookupService.getPropertyTypes().subscribe(data => this.propertyTypes = data);
        this.lookupService.getListingTypes().subscribe(data => this.listingTypes = data);
    }

    onCityChange() {
        if (this.selectedCityId) {
            this.lookupService.getDistrictsByCity(this.selectedCityId).subscribe(data => {
                this.districts = data;
                this.property.districtId = null;
            });
        } else {
            this.districts = [];
        }
    }

    onFilesSelected(event: any) {
        const files: FileList = event.target.files;
        const remainingSlots = 5 - this.selectedFiles.length;

        for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                this.selectedFiles.push(file);

                // Generate preview
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }

        // Reset input to allow re-selecting
        event.target.value = '';
    }

    removeImage(index: number) {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }

    onVideoSelected(event: any) {
        this.selectedVideoFile = event.target.files[0];
    }

    async onSubmit() {
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

            // Set first image as main thumbnail
            if (imageUrls.length > 0) {
                this.property.imageUrl = imageUrls[0];
                this.property.imageUrls = imageUrls; // All images for backend
            }

            // Upload video if selected
            if (this.selectedVideoFile) {
                const videoRes = await this.propertyService.uploadVideo(this.selectedVideoFile).toPromise();
                this.property.videoUrl = videoRes?.url;
            }

            // Create property
            this.propertyService.create(this.property).subscribe({
                next: () => {
                    this.router.navigate(['/home']);
                },
                error: (err) => {
                    this.error = 'Không thể đăng tin. Vui lòng kiểm tra lại thông tin.';
                    this.loading = false;
                    console.error(err);
                }
            });
        } catch (err) {
            this.error = 'Không thể upload file';
            this.loading = false;
        }
    }

    cancel() {
        this.router.navigate(['/home']);
    }
}

