import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../services/property.service';
import { LookupService, City, District, PropertyType, ListingType } from '../../services/lookup.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-property-create',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-create.component.html',
    styleUrls: ['./property-create.component.css']
})
export class PropertyCreateComponent implements OnInit, AfterViewInit, OnDestroy {
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
        bathrooms: 0,
        latitude: null,
        longitude: null
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

    // Leaflet map
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;

    // Geocoding state
    geocoding = false;
    geocodeError = '';
    private geocodeTimeout: any = null;

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private router: Router,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadLookups();
    }

    /**
     * ngAfterViewInit: DOM sẵn sàng → khởi tạo bản đồ chọn vị trí.
     */
    ngAfterViewInit(): void {
        setTimeout(() => this.initMap(), 200);
    }

    ngOnDestroy(): void {
        // Hủy timer geocode nếu đang chờ
        if (this.geocodeTimeout) {
            clearTimeout(this.geocodeTimeout);
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    /**
     * Khởi tạo bản đồ Leaflet cho phép click chọn vị trí BĐS.
     * Center mặc định: TP. Hồ Chí Minh.
     */
    private initMap(): void {
        const mapContainer = document.getElementById('create-map');
        if (!mapContainer) return;

        // Fix icon path cho Leaflet
        // Sử dụng CDN để không cần copy file icon thủ công
        const iconDefault = L.icon({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            tooltipAnchor: [16, -28],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;

        // Mặc định center tại TP.HCM, zoom 12
        this.map = L.map('create-map').setView([10.7769, 106.7009], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Click trên bản đồ → đặt marker + cập nhật tọa độ (điều chỉnh thủ công)
        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            this.placeMarker(lat, lng);
        });
    }

    /**
     * Đặt hoặc di chuyển marker trên bản đồ + cập nhật tọa độ vào model.
     */
    private placeMarker(lat: number, lng: number): void {
        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        } else if (this.map) {
            this.marker = L.marker([lat, lng]).addTo(this.map);
        }
        this.property.latitude = parseFloat(lat.toFixed(7));
        this.property.longitude = parseFloat(lng.toFixed(7));
    }

    /**
     * Xử lý khi người dùng thay đổi ô "Địa chỉ cụ thể".
     * Debounce 800ms để tránh gọi API quá nhiều khi đang gõ.
     */
    onAddressChange(): void {
        // Xóa timer cũ nếu user vẫn đang gõ
        if (this.geocodeTimeout) {
            clearTimeout(this.geocodeTimeout);
        }

        const address = this.property.address?.trim();
        if (!address || address.length < 5) return; // Quá ngắn, chưa đủ để geocode

        // Debounce 800ms — chỉ geocode khi user ngừng gõ
        this.geocodeTimeout = setTimeout(() => {
            this.geocodeAddress(address);
        }, 800);
    }

    /**
     * Nút "Tìm vị trí" — geocode ngay lập tức (không debounce).
     */
    searchLocation(): void {
        if (this.geocodeTimeout) {
            clearTimeout(this.geocodeTimeout);
        }
        const address = this.property.address?.trim();
        if (!address) {
            this.geocodeError = 'Vui lòng nhập địa chỉ trước';
            return;
        }
        this.geocodeAddress(address);
    }

    /**
     * Gọi backend proxy API để geocode địa chỉ → tọa độ.
     * Backend sẽ forward request đến Nominatim với User-Agent header bắt buộc.
     */
    private geocodeAddress(address: string): void {
        this.geocoding = true;
        this.geocodeError = '';

        // Gọi qua backend proxy — tránh CORS + thêm User-Agent
        const url = `http://localhost:3000/properties/geocode?address=${encodeURIComponent(address)}`;

        this.http.get<any[]>(url).subscribe({
            next: (results) => {
                this.geocoding = false;

                if (results && results.length > 0) {
                    const result = results[0];
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);

                    // Đặt marker và di chuyển bản đồ đến vị trí tìm được
                    this.placeMarker(lat, lng);
                    if (this.map) {
                        this.map.setView([lat, lng], 16, { animate: true });
                    }

                    this.geocodeError = '';
                } else {
                    this.geocodeError = 'Không tìm thấy vị trí. Hãy thử nhập cụ thể hơn hoặc click trực tiếp trên bản đồ.';
                }
            },
            error: (err) => {
                this.geocoding = false;
                this.geocodeError = 'Lỗi khi tìm vị trí. Vui lòng thử lại.';
                console.error('Geocoding error:', err);
            }
        });
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
