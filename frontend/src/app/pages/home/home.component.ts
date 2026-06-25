import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { LookupService, ListingType, City, District } from '../../services/lookup.service';
import { FavoriteService } from '../../services/favorite.service';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
    properties: Property[] = [];
    listingTypes: ListingType[] = [];
    cities: City[] = [];
    districts: District[] = [];

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalItems = 0;
    itemsPerPage = 12;

    // Sorting
    sortBy = 'createdAt';
    sortOrder = 'DESC';

    // Advanced filters toggle
    showAdvancedFilters = false;

    filters = {
        search: '',
        listingTypeId: null as number | null,
        minPrice: null as number | null,
        maxPrice: null as number | null,
        cityId: null as number | null,
        districtId: null as number | null,
        minArea: null as number | null,
        maxArea: null as number | null,
        bedrooms: null as number | null,
        bathrooms: null as number | null
    };

    // Leaflet overview map
    private map: L.Map | null = null;
    private markersLayer: L.LayerGroup | null = null;
    // Toggle hiển thị bản đồ
    showMap = true;

    constructor(
        private propertyService: PropertyService,
        private lookupService: LookupService,
        private favoriteService: FavoriteService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadListingTypes();
        this.loadCities();
        this.loadProperties();
    }

    /**
     * ngAfterViewInit: DOM sẵn sàng → khởi tạo bản đồ tổng hợp.
     * Markers sẽ được cập nhật sau khi loadProperties() hoàn tất.
     */
    ngAfterViewInit(): void {
        setTimeout(() => this.initMap(), 300);
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    /**
     * Khởi tạo bản đồ tổng hợp hiển thị tất cả BĐS.
     * Center mặc định: TP. Hồ Chí Minh, zoom 12.
     */
    private initMap(): void {
        const mapContainer = document.getElementById('overview-map');
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

        this.map = L.map('overview-map').setView([10.7769, 106.7009], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Layer group để quản lý markers — dễ dàng xóa/thêm khi data thay đổi
        this.markersLayer = L.layerGroup().addTo(this.map);

        // Nếu đã có properties data, render markers ngay
        if (this.properties.length > 0) {
            this.updateMapMarkers();
        }
    }

    /**
     * Cập nhật markers trên bản đồ tổng hợp.
     * Được gọi mỗi khi danh sách properties thay đổi (load, filter, pagination).
     */
    private updateMapMarkers(): void {
        if (!this.map || !this.markersLayer) return;

        // Xóa tất cả markers cũ
        this.markersLayer.clearLayers();

        const validProperties = this.properties.filter(p => p.latitude && p.longitude);

        validProperties.forEach(prop => {
            const lat = Number(prop.latitude);
            const lng = Number(prop.longitude);

            if (isNaN(lat) || isNaN(lng)) return;

            // Tạo nội dung Popup: Tên, Giá, Nút xem chi tiết
            const priceFormatted = prop.price ? prop.price.toLocaleString('vi-VN') : '0';
            const popupContent = `
                <div style="min-width: 200px; font-family: 'Inter', sans-serif;">
                    <h4 style="margin: 0 0 6px; font-size: 14px; color: #1f2937; font-weight: 700;">
                        ${prop.title}
                    </h4>
                    <p style="margin: 0 0 4px; color: #dc2626; font-weight: 700; font-size: 13px;">
                        💰 ${priceFormatted} VND
                    </p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                        📍 ${prop.address || ''}
                    </p>
                    <a href="/properties/${prop.id}"
                       style="display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                              color: white; text-decoration: none; border-radius: 8px; font-size: 12px; font-weight: 600;">
                        👁️ Xem chi tiết
                    </a>
                </div>
            `;

            const marker = L.marker([lat, lng]).bindPopup(popupContent);
            this.markersLayer!.addLayer(marker);
        });

        // Auto-fit bounds nếu có markers
        if (validProperties.length > 0) {
            const bounds = L.latLngBounds(
                validProperties.map(p => [Number(p.latitude), Number(p.longitude)] as [number, number])
            );
            this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }

    loadListingTypes() {
        this.lookupService.getListingTypes().subscribe(data => this.listingTypes = data);
    }

    loadCities() {
        this.lookupService.getCities().subscribe(data => this.cities = data);
    }

    onCityChange() {
        this.filters.districtId = null;
        this.districts = [];
        if (this.filters.cityId) {
            this.lookupService.getDistrictsByCity(this.filters.cityId).subscribe(data => {
                this.districts = data;
            });
        }
    }

    loadProperties() {
        const params: any = {
            page: this.currentPage,
            limit: this.itemsPerPage,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
        if (this.filters.search) params.search = this.filters.search;
        if (this.filters.listingTypeId) params.listingTypeId = this.filters.listingTypeId;
        if (this.filters.minPrice) params.minPrice = this.filters.minPrice;
        if (this.filters.maxPrice) params.maxPrice = this.filters.maxPrice;
        if (this.filters.cityId) params.cityId = this.filters.cityId;
        if (this.filters.districtId) params.districtId = this.filters.districtId;
        if (this.filters.minArea) params.minArea = this.filters.minArea;
        if (this.filters.maxArea) params.maxArea = this.filters.maxArea;
        if (this.filters.bedrooms) params.bedrooms = this.filters.bedrooms;
        if (this.filters.bathrooms) params.bathrooms = this.filters.bathrooms;

        this.propertyService.findAll(params).subscribe({
            next: (response) => {
                this.properties = response.data;
                this.currentPage = response.pagination.page;
                this.totalPages = response.pagination.totalPages;
                this.totalItems = response.pagination.total;
                // Kiểm tra trạng thái yêu thích cho từng property
                this.loadFavoriteStatus();
                // Cập nhật markers trên bản đồ mỗi khi data thay đổi
                this.updateMapMarkers();
            },
            error: (err) => console.error(err)
        });
    }

    loadFavoriteStatus() {
        if (this.properties.length === 0) return;

        // Gọi API check cho từng property
        this.properties.forEach(prop => {
            if (prop.id === undefined) return;
            this.favoriteService.check(prop.id).subscribe({
                next: (isLiked) => {
                    (prop as any).liked = isLiked;
                },
                error: () => {
                    (prop as any).liked = false;
                }
            });
        });
    }

    onSortChange() {
        this.currentPage = 1;
        this.loadProperties();
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProperties();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadProperties();
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadProperties();
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, this.currentPage + 2);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    goToCreate() {
        this.router.navigate(['/properties/create']);
    }

    toggleLike(prop: any, event: Event) {
        event.stopPropagation();
        const currentStatus = prop.liked || false;

        this.favoriteService.toggle(prop.id, currentStatus).subscribe({
            next: () => {
                prop.liked = !currentStatus;
            },
            error: (err) => console.error('Toggle favorite failed:', err)
        });
    }

    /**
     * Toggle hiển thị/ẩn bản đồ tổng hợp.
     * Khi mở lại, cần invalidateSize() vì container bị ẩn có thể gây lỗi render.
     */
    toggleMap() {
        this.showMap = !this.showMap;
        if (this.showMap && this.map) {
            // Delay để DOM render xong rồi mới resize map
            setTimeout(() => {
                this.map?.invalidateSize();
                this.updateMapMarkers();
            }, 200);
        }
    }

    resetFilters() {
        this.filters = {
            search: '',
            listingTypeId: null,
            minPrice: null,
            maxPrice: null,
            cityId: null,
            districtId: null,
            minArea: null,
            maxArea: null,
            bedrooms: null,
            bathrooms: null
        };
        this.districts = [];
        this.currentPage = 1;
        this.sortBy = 'createdAt';
        this.sortOrder = 'DESC';
        this.loadProperties();
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
