import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

/**
 * ChatComponent — Giao diện Chat real-time.
 *
 * Layout: 2 cột
 *  - Cột trái: Danh sách conversations (sidebar)
 *  - Cột phải: Khung chat chi tiết với tin nhắn
 *
 * Luồng:
 * 1. Nếu có query params (propertyId, sellerId) → auto tạo/mở conversation
 * 2. Load danh sách conversations từ API
 * 3. Khi chọn conversation → load messages + join room WebSocket
 * 4. Gửi/nhận tin nhắn real-time qua WebSocket
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  // Danh sách cuộc hội thoại
  conversations: any[] = [];
  // Conversation đang chọn
  selectedConversation: any = null;
  // Danh sách tin nhắn của conversation đang chọn
  messages: any[] = [];
  // Nội dung tin nhắn đang soạn
  newMessage = '';
  // User hiện tại
  currentUser: any = null;
  // Trạng thái loading
  loadingConversations = true;
  loadingMessages = false;

  // Flag để tự động scroll xuống cuối
  private shouldScrollToBottom = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Reference đến container tin nhắn để scroll
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Lấy thông tin user hiện tại
    const userSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.subscriptions.push(userSub);

    // Kết nối WebSocket
    this.chatService.connect();

    // Lắng nghe tin nhắn mới real-time
    const msgSub = this.chatService.onNewMessage().subscribe((message) => {
      this.handleNewMessage(message);
    });
    this.subscriptions.push(msgSub);

    // Lắng nghe sự kiện conversation cập nhật (để refresh sidebar)
    const convSub = this.chatService
      .onConversationUpdated()
      .subscribe(() => {
        this.loadConversations();
      });
    this.subscriptions.push(convSub);

    // Load danh sách conversations
    this.loadConversations();

    // Kiểm tra query params để auto-open conversation
    const paramSub = this.route.queryParams.subscribe((params) => {
      const propertyId = params['propertyId'];
      const sellerId = params['sellerId'];

      if (propertyId && sellerId) {
        this.openConversationFromParams(+propertyId, +sellerId);
      }
    });
    this.subscriptions.push(paramSub);
  }

  ngAfterViewChecked(): void {
    // Auto-scroll xuống cuối khi có tin nhắn mới
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    // Rời room hiện tại nếu đang ở trong
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }
    // Hủy tất cả subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    // Ngắt kết nối socket
    this.chatService.disconnect();
  }

  /**
   * Load danh sách conversations từ API.
   */
  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.loadingConversations = false;
      },
      error: (err) => {
        console.error('Lỗi load conversations:', err);
        this.loadingConversations = false;
      },
    });
  }

  /**
   * Auto tạo/mở conversation khi navigate từ PropertyDetail.
   */
  openConversationFromParams(propertyId: number, sellerId: number): void {
    this.chatService.getOrCreateConversation(propertyId, sellerId).subscribe({
      next: (conversation) => {
        // Refresh danh sách conversations
        this.loadConversations();
        // Chọn conversation vừa tạo/lấy
        this.selectConversation(conversation);
        // Xóa query params sau khi đã xử lý
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      },
      error: (err) => {
        console.error('Lỗi tạo conversation:', err);
      },
    });
  }

  /**
   * Chọn một conversation → load messages + join room WebSocket.
   */
  selectConversation(conversation: any): void {
    // Rời room cũ nếu có
    if (this.selectedConversation) {
      this.chatService.leaveConversation(this.selectedConversation.id);
    }

    this.selectedConversation = conversation;
    this.loadingMessages = true;
    this.messages = [];

    // Join room mới
    this.chatService.joinConversation(conversation.id);

    // Load lịch sử tin nhắn
    this.chatService.getMessages(conversation.id).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loadingMessages = false;
        this.shouldScrollToBottom = true;
      },
      error: (err) => {
        console.error('Lỗi load messages:', err);
        this.loadingMessages = false;
      },
    });

    // Đánh dấu đã đọc + reset unread count trên sidebar
    conversation.unreadCount = 0;
  }

  /**
   * Gửi tin nhắn mới.
   */
  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.chatService.sendMessage(
      this.selectedConversation.id,
      this.newMessage.trim(),
    );

    // Clear input
    this.newMessage = '';
  }

  /**
   * Xử lý khi nhận tin nhắn mới qua WebSocket.
   */
  private handleNewMessage(message: any): void {
    // Nếu tin nhắn thuộc conversation đang mở → thêm vào danh sách
    if (
      this.selectedConversation &&
      message.conversation?.id === this.selectedConversation.id
    ) {
      // Kiểm tra tin nhắn đã tồn tại chưa (tránh duplicate)
      const exists = this.messages.some((m) => m.id === message.id);
      if (!exists) {
        this.messages.push(message);
        this.shouldScrollToBottom = true;

        // Đánh dấu đã đọc nếu không phải tin của mình
        if (message.sender?.id !== this.currentUser?.id) {
          this.chatService.markAsRead(this.selectedConversation.id);
        }
      }
    }

    // Refresh danh sách conversations để cập nhật lastMessage
    this.loadConversations();
  }

  /**
   * Cuộn xuống cuối danh sách tin nhắn.
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      // Ignore scroll errors
    }
  }

  /**
   * Lấy tên người đang chat (đối phương).
   */
  getChatPartnerName(conversation: any): string {
    if (!this.currentUser || !conversation) return '';
    return conversation.buyer?.id === this.currentUser.id
      ? conversation.seller?.fullName || 'Người bán'
      : conversation.buyer?.fullName || 'Người mua';
  }

  /**
   * Lấy avatar người đang chat (đối phương).
   */
  getChatPartnerAvatar(conversation: any): string {
    if (!this.currentUser || !conversation) return 'assets/default-avatar.png';
    const partner =
      conversation.buyer?.id === this.currentUser.id
        ? conversation.seller
        : conversation.buyer;

    if (partner?.avatar) {
      return partner.avatar.startsWith('http')
        ? partner.avatar
        : 'http://localhost:3000' + partner.avatar;
    }
    return 'assets/default-avatar.png';
  }

  /**
   * Kiểm tra tin nhắn có phải của mình gửi hay không.
   */
  isMyMessage(message: any): boolean {
    return message.sender?.id === this.currentUser?.id;
  }

  /**
   * Xử lý gửi tin nhắn khi nhấn Enter (không phải Shift+Enter).
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Lấy nội dung tin nhắn cuối cùng để hiển thị trên sidebar.
   */
  getLastMessagePreview(conversation: any): string {
    if (!conversation.lastMessage) return 'Chưa có tin nhắn';
    const prefix =
      conversation.lastMessage.sender?.id === this.currentUser?.id
        ? 'Bạn: '
        : '';
    const content = conversation.lastMessage.content;
    return prefix + (content.length > 40 ? content.substring(0, 40) + '...' : content);
  }

  /**
   * Lấy property title cho conversation.
   */
  getPropertyTitle(conversation: any): string {
    return conversation.property?.title || 'Bất động sản';
  }
}
