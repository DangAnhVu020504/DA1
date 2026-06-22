import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

/**
 * ChatService — Quản lý kết nối WebSocket và REST API cho tính năng Chat.
 *
 * Luồng hoạt động:
 * 1. connect() → tạo kết nối socket với JWT token
 * 2. getConversations() / getOrCreateConversation() → REST API
 * 3. joinConversation() → socket emit 'joinRoom'
 * 4. sendMessage() → socket emit 'sendMessage'
 * 5. onNewMessage() → lắng nghe 'newMessage' event từ server
 */
@Injectable({
  providedIn: 'root',
})
export class ChatService implements OnDestroy {
  private apiUrl = 'http://localhost:3000/chat';
  private socket: Socket | null = null;

  // Subject phát tin nhắn mới nhận được qua WebSocket
  private newMessageSubject = new Subject<any>();

  // Subject phát sự kiện conversation được cập nhật
  private conversationUpdatedSubject = new Subject<any>();

  // Trạng thái kết nối socket
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ==================== SOCKET.IO ====================

  /**
   * Khởi tạo kết nối Socket.IO với JWT token.
   * Token được truyền qua handshake auth.
   */
  connect(): void {
    if (this.socket?.connected) return; // Đã kết nối rồi

    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Lắng nghe sự kiện kết nối thành công
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.connectedSubject.next(true);
    });

    // Lắng nghe sự kiện ngắt kết nối
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connectedSubject.next(false);
    });

    // Lắng nghe tin nhắn mới từ server
    this.socket.on('newMessage', (message: any) => {
      this.newMessageSubject.next(message);
    });

    // Lắng nghe sự kiện conversation được cập nhật
    this.socket.on('conversationUpdated', (data: any) => {
      this.conversationUpdatedSubject.next(data);
    });

    // Lắng nghe lỗi
    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Ngắt kết nối Socket.IO.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  /**
   * Join vào room của một conversation để nhận tin nhắn real-time.
   */
  joinConversation(conversationId: string): void {
    this.socket?.emit('joinRoom', { conversationId });
  }

  /**
   * Rời room conversation.
   */
  leaveConversation(conversationId: string): void {
    this.socket?.emit('leaveRoom', { conversationId });
  }

  /**
   * Gửi tin nhắn qua WebSocket.
   */
  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('sendMessage', { conversationId, content });
  }

  /**
   * Đánh dấu đã đọc tin nhắn trong conversation.
   */
  markAsRead(conversationId: string): void {
    this.socket?.emit('markAsRead', { conversationId });
  }

  /**
   * Observable nhận tin nhắn mới real-time.
   */
  onNewMessage(): Observable<any> {
    return this.newMessageSubject.asObservable();
  }

  /**
   * Observable nhận sự kiện conversation cập nhật.
   */
  onConversationUpdated(): Observable<any> {
    return this.conversationUpdatedSubject.asObservable();
  }

  // ==================== REST API ====================

  /**
   * Lấy danh sách tất cả conversations của user hiện tại.
   */
  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Tạo mới hoặc lấy conversation dựa trên propertyId + sellerId.
   */
  getOrCreateConversation(
    propertyId: number,
    sellerId: number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/conversations`,
      { propertyId, sellerId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Lấy lịch sử tin nhắn của một conversation.
   */
  getMessages(conversationId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages`,
      { headers: this.getHeaders() }
    );
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
