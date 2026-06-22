import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';
import { Logger } from '@nestjs/common';

/**
 * ChatGateway — WebSocket Gateway xử lý giao tiếp real-time.
 * 
 * Luồng hoạt động:
 * 1. Client kết nối với JWT token → handleConnection xác thực
 * 2. Client join vào room (conversationId) → joinRoom
 * 3. Client gửi tin nhắn → sendMessage → lưu DB → emit tới room
 * 4. Client disconnect → handleDisconnect
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Cho phép frontend connect (dev environment)
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');

  // Map lưu userId → socketId để tracking user online
  private userSocketMap = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  /**
   * Xử lý khi client kết nối.
   * Xác thực JWT token từ handshake auth. Nếu invalid → disconnect.
   */
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id}: Không có token → disconnect`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        this.logger.warn(`Client ${client.id}: User không tồn tại → disconnect`);
        client.disconnect();
        return;
      }

      // Lưu userId vào socket data để dùng ở các handler khác
      (client as any).userId = user.id;
      (client as any).user = user;

      // Lưu mapping userId → socketId
      this.userSocketMap.set(user.id, client.id);

      this.logger.log(`✅ User ${user.fullName} (ID: ${user.id}) đã kết nối - Socket: ${client.id}`);
    } catch (error) {
      this.logger.error(`Client ${client.id}: JWT không hợp lệ → disconnect`, error.message);
      client.disconnect();
    }
  }

  /**
   * Xử lý khi client ngắt kết nối.
   */
  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.userSocketMap.delete(userId);
      this.logger.log(`❌ User ID: ${userId} đã ngắt kết nối - Socket: ${client.id}`);
    }
  }

  /**
   * Client join vào room tương ứng với conversationId.
   * Mỗi conversation là 1 room riêng để broadcast tin nhắn.
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    // Join vào room
    client.join(data.conversationId);

    // Đánh dấu tin nhắn đã đọc khi user join room
    await this.chatService.markAsRead(data.conversationId, userId);

    this.logger.log(`User ${userId} joined room: ${data.conversationId}`);

    return { event: 'joinedRoom', data: { conversationId: data.conversationId } };
  }

  /**
   * Client rời room conversation.
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(data.conversationId);
    this.logger.log(`User ${(client as any).userId} left room: ${data.conversationId}`);
  }

  /**
   * Nhận tin nhắn từ client → lưu vào DB → emit tới tất cả user trong room.
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      // Lưu tin nhắn vào database
      const message = await this.chatService.createMessage(
        data.conversationId,
        userId,
        data.content,
      );

      // Emit tin nhắn mới tới tất cả user trong room (bao gồm cả sender)
      this.server.to(data.conversationId).emit('newMessage', message);

      // Emit event cập nhật danh sách conversation (cho sidebar)
      this.server.emit('conversationUpdated', {
        conversationId: data.conversationId,
        lastMessage: message,
      });

      this.logger.log(
        `💬 User ${userId} → Room ${data.conversationId}: "${data.content.substring(0, 50)}..."`,
      );
    } catch (error) {
      this.logger.error(`Lỗi gửi tin nhắn: ${error.message}`);
      client.emit('error', { message: 'Không thể gửi tin nhắn' });
    }
  }

  /**
   * Client yêu cầu đánh dấu đã đọc tin nhắn.
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    await this.chatService.markAsRead(data.conversationId, userId);

    // Notify người còn lại trong conversation rằng tin nhắn đã được đọc
    client.to(data.conversationId).emit('messagesRead', {
      conversationId: data.conversationId,
      readByUserId: userId,
    });
  }
}
