import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../../services/property.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-admin-property-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.css']
})
export class AdminPropertyFormComponent implements OnInit, AfterViewInit, OnDestroy {
    property: any = {
        title: '',
        type: 'sale',
        description: '',
        price: null,
        address: '',
        imageUrl: '',
        latitude: null,
        longitude: null
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

    // Leaflet map
    private map: L.Map | null = null;
    private marker: L.Marker | null = null;

    // Geocoding state
    geocoding = false;
    geocodeError = '';
    private geocodeTimeout: any = null;

    constructor(
        private propertyService: PropertyService,
        private router: Router,
        private route: ActivatedRoute,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode = true;
            this.propertyId = +id;
            this.loadProperty();
        }
    }

    /**
     * ngAfterViewInit: DOM sẵn sàng → khởi tạo bản đồ.
     * Nếu đang ở edit mode, marker sẽ được đặt lại sau khi loadProperty() xong.
     */
    ngAfterViewInit(): void {
        // Delay nhỏ để DOM render xong (sau *ngIf)
        setTimeout(() => this.initMap(), 200);
    }

    ngOnDestroy(): void {
        if (this.geocodeTimeout) {
            clearTimeout(this.geocodeTimeout);
        }
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    /**
     * Khởi tạo bản đồ Leaflet cho phép click chọn vị trí.
     * Mặc định center tại TP. Hồ Chí Minh.
     */
    private initMap(): void {
        const mapContainer = document.getElementById('form-map');
        if (!mapContainer) return;

        // Fix icon path cho Leaflet khi dùng với bundler
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

        // Vị trí mặc định: TP.HCM
        const defaultLat = this.property.latitude || 10.7769;
        const defaultLng = this.property.longitude || 106.7009;
        const defaultZoom = this.property.latitude ? 15 : 12;

        this.map = L.map('form-map').setView([defaultLat, defaultLng], defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Nếu có tọa độ sẵn (edit mode), đặt marker
        if (this.property.latitude && this.property.longitude) {
            this.marker = L.marker([defaultLat, defaultLng]).addTo(this.map);
        }

        // Xử lý click trên bản đồ → đặt/di chuyển marker + cập nhật tọa độ
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
     * Xử lý khi người dùng thay đổi ô "Địa chỉ".
     * Debounce 800ms để tránh gọi API quá nhiều khi đang gõ.
     */
    onAddressChange(): void {
        if (this.geocodeTimeout) {
            clearTimeout(this.geocodeTimeout);
        }
        const address = this.property.address?.trim();
        if (!address || address.length < 5) return;

        this.geocodeTimeout = setTimeout(() => {
            this.geocodeAddress(address);
        }, 800);
    }

    /**
     * Nút "Tìm vị trí" — geocode ngay lập tức.
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

    loadProperty() {
        if (this.propertyId) {
            this.propertyService.findOne(this.propertyId).subscribe({
                next: (data) => {
                    this.property = data;
                    // Sau khi load data, cập nhật marker trên map (nếu map đã init)
                    setTimeout(() => this.updateMapMarker(), 300);
                },
                error: (err) => {
                    this.error = 'Không tải được tin đăng';
                    console.error(err);
                }
            });
        }
    }

    /**
     * Cập nhật vị trí marker trên map khi data được load (edit mode).
     */
    private updateMapMarker(): void {
        if (!this.map || !this.property.latitude || !this.property.longitude) return;

        const lat = Number(this.property.latitude);
        const lng = Number(this.property.longitude);

        this.map.setView([lat, lng], 15);

        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        } else {
            this.marker = L.marker([lat, lng]).addTo(this.map);
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

    // Helper function to get proper image URL (handles both local and external URLs)
    getImageUrl(url: string | null | undefined): string {
        if (!url) return 'assets/house-placeholder.jpg';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        return 'http://localhost:3000' + url;
    }
}
