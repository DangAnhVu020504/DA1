import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

/**
 * ChatController — REST API cho tính năng Chat.
 * Tất cả endpoint đều được bảo vệ bằng JwtAuthGuard.
 */
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /chat/conversations
   * Tạo mới hoặc lấy conversation dựa trên propertyId + sellerId.
   * buyerId tự động lấy từ JWT token (user hiện tại).
   */
  @Post('conversations')
  async getOrCreateConversation(
    @Request() req,
    @Body() body: { propertyId: number; sellerId: number },
  ) {
    const buyerId = req.user.id;
    return this.chatService.getOrCreateConversation(
      body.propertyId,
      buyerId,
      body.sellerId,
    );
  }

  /**
   * GET /chat/conversations
   * Lấy danh sách tất cả conversations của user hiện tại.
   */
  @Get('conversations')
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  /**
   * GET /chat/conversations/:id/messages
   * Lấy lịch sử tin nhắn của một conversation.
   * Tự động đánh dấu tin nhắn là đã đọc.
   */
  @Get('conversations/:id/messages')
  async getMessages(@Request() req, @Param('id') id: string) {
    // Đánh dấu đã đọc khi user mở conversation
    await this.chatService.markAsRead(id, req.user.id);
    return this.chatService.getMessages(id, req.user.id);
  }
}
