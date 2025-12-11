import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { LookupService, City, District, PropertyType, ListingType } from '../../services/lookup.service';

@Component({
    selector: 'app-my-properties',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-properties.component.html',
    styleUrl: './my-properties.component.css'
})
export class MyPropertiesComponent implements OnInit {
    properties: Property[] = [];
    loading = true;

    // Form state
    showForm = false;
    isEditing = false;
    editingId: number | null = null;
    formLoading = false;
    formError = '';

    // Form data
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

    // Lookups
    cities: City[] = [];
    districts: District[] = [];
    propertyTypes: PropertyType[] = [];
    listingTypes: ListingType[] = [];
    selectedCityId: number | null = null;
    selectedFile: File | null = null;

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadProperties();
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

    loadProperties() {
        this.loading = true;
        this.propertyService.getMyProperties().subscribe({
            next: (data) => {
                this.properties = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load properties:', err);
                this.loading = false;
            }
        });
    }

    // Form methods
    openCreateForm() {
        this.showForm = true;
        this.isEditing = false;
        this.editingId = null;
        this.resetForm();
    }

    openEditForm(prop: Property) {
        this.showForm = true;
        this.isEditing = true;
        this.editingId = prop.id!;

        // Populate form with property data
        this.property = {
            title: prop.title,
            listingTypeId: prop.listingType?.id || null,
            typeId: prop.propertyType?.id || null,
            districtId: prop.district?.id || null,
            description: prop.description,
            price: prop.price,
            area: prop.area,
            address: prop.address,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms
        };

        // Set city if district exists
        if (prop.district?.city) {
            this.selectedCityId = prop.district.city.id;
            this.onCityChange();
        }
    }

    closeForm() {
        this.showForm = false;
        this.resetForm();
    }

    resetForm() {
        this.property = {
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
        this.selectedCityId = null;
        this.selectedFile = null;
        this.formError = '';
    }

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    async onSubmit() {
        this.formLoading = true;
        this.formError = '';

        try {
            // Upload image first if selected
            if (this.selectedFile) {
                const uploadRes = await this.propertyService.uploadImage(this.selectedFile).toPromise();
                this.property.imageUrl = uploadRes.url;
            }

            if (this.isEditing && this.editingId) {
                // Update existing property
                this.propertyService.update(this.editingId, this.property).subscribe({
                    next: () => {
                        this.closeForm();
                        this.loadProperties();
                        alert('Cập nhật thành công!');
                    },
                    error: (err) => {
                        this.formError = 'Không thể cập nhật. Vui lòng kiểm tra lại.';
                        this.formLoading = false;
                        console.error(err);
                    }
                });
            } else {
                // Create new property
                this.propertyService.create(this.property).subscribe({
                    next: () => {
                        this.closeForm();
                        this.loadProperties();
                        alert('Tạo BĐS thành công!');
                    },
                    error: (err) => {
                        this.formError = 'Không thể đăng tin. Vui lòng kiểm tra lại.';
                        this.formLoading = false;
                        console.error(err);
                    }
                });
            }
        } catch (err) {
            this.formError = 'Không thể upload ảnh';
            this.formLoading = false;
        }
    }

    deleteProperty(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa bất động sản này?')) {
            this.propertyService.delete(id).subscribe({
                next: () => {
                    this.loadProperties();
                    alert('Xóa thành công!');
                },
                error: (err) => {
                    console.error('Failed to delete:', err);
                    alert('Xóa thất bại!');
                }
            });
        }
    }

    publishProperty(id: number) {
        this.propertyService.update(id, { status: 'available' }).subscribe({
            next: () => {
                this.loadProperties();
                alert('Đăng tin thành công!');
            },
            error: (err) => {
                console.error('Failed to publish:', err);
                alert('Đăng tin thất bại!');
            }
        });
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'draft': 'Bản nháp',
            'available': 'Đang hiển thị',
            'pending': 'Chờ duyệt',
            'sold': 'Đã bán',
            'rented': 'Đã cho thuê'
        };
        return labels[status] || status;
    }
}
