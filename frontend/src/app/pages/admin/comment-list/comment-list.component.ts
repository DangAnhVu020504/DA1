import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentService, Comment } from '../../../services/comment.service';

@Component({
    selector: 'app-admin-comment-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './comment-list.component.html',
    styleUrls: ['./comment-list.component.css']
})
export class AdminCommentListComponent implements OnInit {
    comments: Comment[] = [];

    constructor(private commentService: CommentService) { }

    ngOnInit(): void {
        this.loadComments();
    }

    loadComments() {
        this.commentService.findAll().subscribe({
            next: (data) => this.comments = data,
            error: (err) => console.error(err)
        });
    }

    deleteComment(id: number) {
        if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
            this.commentService.delete(id).subscribe({
                next: () => this.loadComments(),
                error: (err) => alert('Không thể xóa bình luận')
            });
        }
    }
}
