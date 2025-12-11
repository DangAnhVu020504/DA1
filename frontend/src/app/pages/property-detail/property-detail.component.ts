import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { PropertyService, Property } from '../../services/property.service';
import { CommentService, Comment } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-property-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, RouterModule],
    templateUrl: './property-detail.component.html',
    styleUrls: ['./property-detail.component.css']
})
export class PropertyDetailComponent implements OnInit {
    property: Property | null = null;
    comments: Comment[] = [];
    newComment = '';
    loading = true;
    error = '';
    propertyId: number | null = null;

    // Comment form states
    commentError = '';
    commentSuccess = '';
    submittingComment = false;

    constructor(
        private route: ActivatedRoute,
        private propertyService: PropertyService,
        private commentService: CommentService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
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

    loadProperty() {
        if (this.propertyId) {
            this.propertyService.findOne(this.propertyId).subscribe({
                next: (data) => {
                    this.property = data;
                    this.loading = false;
                },
                error: (err) => {
                    this.error = 'Không thể tải thông tin bất động sản';
                    this.loading = false;
                    console.error(err);
                }
            });
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
}

