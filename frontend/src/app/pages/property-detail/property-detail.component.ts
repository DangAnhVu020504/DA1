import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterModule, Router } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { CommentService, Comment } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-property-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, RouterModule],
    templateUrl: './property-detail.component.html',
    styleUrls: ['./property-detail.component.css']
})
export class PropertyDetailComponent implements OnInit, AfterViewInit, OnDestroy {
    property: Property | null = null;
    comments: Comment[] = [];
    newComment = '';
    loading = true;
    error = '';
    propertyId: number | null = null;
    currentUser: any = null;

    // Image gallery
    currentImageIndex = 0;
    currentImageUrl: string | null = null;

    // Comment form states
    commentError = '';
    commentSuccess = '';
    submittingComment = false;

    // Leaflet map instance — lưu reference để destroy khi component bị hủy
    private map: L.Map | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private propertyService: PropertyService,
        private commentService: CommentService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        // Lấy thông tin user hiện tại
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.propertyId = +id;
            this.loadProperty();
            this.loadComments();
        } else {
            this.error = 'Không tìm thấy ID';
            this.loading = false;
        }
    }

    /**
     * ngAfterViewInit: DOM đã sẵn sàng, nhưng property data có thể chưa load xong.
     * Bản đồ sẽ được khởi tạo sau khi loadProperty() hoàn tất (trong initMap).
     */
    ngAfterViewInit(): void {
        // Map sẽ được init sau khi property data load xong
    }

    /**
     * Dọn dẹp map khi component bị destroy để tránh memory leak.
     */
    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    loadProperty() {
        if (this.propertyId) {
            this.propertyService.findOne(this.propertyId).subscribe({
                next: (data: any) => {
                    this.property = data;
                    // Set initial image
                    if (data.imageUrls && data.imageUrls.length > 0) {
                        this.currentImageUrl = data.imageUrls[0];
                        this.currentImageIndex = 0;
                    } else {
                        this.currentImageUrl = data.imageUrl;
                    }
                    this.loading = false;

                    // Khởi tạo bản đồ sau khi có dữ liệu property
                    // Dùng setTimeout để đảm bảo DOM đã render xong *ngIf
                    setTimeout(() => this.initMap(), 100);
                },
                error: (err) => {
                    this.error = 'Không thể tải thông tin bất động sản';
                    this.loading = false;
                    console.error(err);
                }
            });
        }
    }

    /**
     * Khởi tạo bản đồ Leaflet hiển thị vị trí property.
     * Chỉ hiển thị khi property có latitude & longitude hợp lệ.
     */
    private initMap(): void {
        if (!this.property?.latitude || !this.property?.longitude) return;

        const lat = Number(this.property.latitude);
        const lng = Number(this.property.longitude);

        // Kiểm tra tọa độ hợp lệ
        if (isNaN(lat) || isNaN(lng)) return;

        // Tìm container DOM — nếu chưa có thì bỏ qua
        const mapContainer = document.getElementById('detail-map');
        if (!mapContainer) return;

        // Fix icon mặc định của Leaflet bị lỗi path khi dùng với bundler
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

        // Khởi tạo map tại tọa độ property, zoom level 15
        this.map = L.map('detail-map').setView([lat, lng], 15);

        // Thêm tile layer từ OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        // Đặt Marker tại vị trí property
        L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(`<b>${this.property.title}</b><br>${this.property.address}`)
            .openPopup();
    }

    // Gallery navigation
    selectImage(index: number) {
        if (this.property?.imageUrls) {
            this.currentImageIndex = index;
            this.currentImageUrl = this.property.imageUrls[index];
        }
    }

    prevImage() {
        if (this.currentImageIndex > 0) {
            this.selectImage(this.currentImageIndex - 1);
        }
    }

    nextImage() {
        if (this.property?.imageUrls && this.currentImageIndex < this.property.imageUrls.length - 1) {
            this.selectImage(this.currentImageIndex + 1);
        }
    }

    loadComments() {
        if (this.propertyId) {
            this.commentService.getByProperty(this.propertyId).subscribe({
                next: (data) => this.comments = data,
                error: (err) => console.error(err)
            });
        }
    }

    isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    /**
     * Kiểm tra xem user hiện tại có phải là chủ property hay không.
     * Nếu đúng → ẩn nút "Chat với người bán".
     */
    isOwner(): boolean {
        if (!this.currentUser || !this.property) return false;
        const ownerId = this.property.owner?.id || this.property.user?.id;
        return this.currentUser.id === ownerId;
    }

    /**
     * Chuyển hướng sang trang Chat và tự động khởi tạo/mở cuộc hội thoại
     * với người bán (chủ property) về BĐS hiện tại.
     */
    chatWithSeller(): void {
        if (!this.property || !this.isLoggedIn()) return;
        const sellerId = this.property.owner?.id || this.property.user?.id;
        if (!sellerId || !this.propertyId) return;

        this.router.navigate(['/chat'], {
            queryParams: {
                propertyId: this.propertyId,
                sellerId: sellerId,
            },
        });
    }

    submitComment() {
        // Clear previous messages
        this.commentError = '';
        this.commentSuccess = '';

        // Check if user is logged in
        if (!this.isLoggedIn()) {
            this.commentError = 'Vui lòng đăng nhập để bình luận!';
            return;
        }

        if (this.newComment.trim() && this.propertyId) {
            this.submittingComment = true;
            this.commentService.create(this.propertyId, this.newComment).subscribe({
                next: () => {
                    this.newComment = '';
                    this.commentSuccess = 'Bình luận đã được gửi!';
                    this.submittingComment = false;
                    this.loadComments();
                    // Clear success message after 3 seconds
                    setTimeout(() => this.commentSuccess = '', 3000);
                },
                error: (err) => {
                    this.submittingComment = false;
                    console.error(err);
                    if (err.status === 401) {
                        this.commentError = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
                    } else if (err.status === 400) {
                        this.commentError = err.error?.message || 'Không thể gửi bình luận. Property chưa có listing tương ứng.';
                    } else {
                        this.commentError = 'Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại!';
                    }
                }
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
