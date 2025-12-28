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

    selectedFile: File | null = null;
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

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    onVideoSelected(event: any) {
        this.selectedVideoFile = event.target.files[0];
    }

    async onSubmit() {
        this.loading = true;
        this.error = '';

        try {
            // Upload image first if selected
            if (this.selectedFile) {
                const uploadRes = await this.propertyService.uploadImage(this.selectedFile).toPromise();
                this.property.imageUrl = uploadRes.url;
            }

            // Upload video if selected
            if (this.selectedVideoFile) {
                const videoRes = await this.propertyService.uploadVideo(this.selectedVideoFile).toPromise();
                this.property.videoUrl = videoRes.url;
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

