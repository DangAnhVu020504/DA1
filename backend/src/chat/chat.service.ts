import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,

    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  /**
   * Tạo mới hoặc lấy Conversation đã tồn tại dựa trên (propertyId, buyerId, sellerId).
   * Đảm bảo mỗi cặp buyer-seller trên 1 property chỉ có 1 cuộc hội thoại duy nhất.
   */
  async getOrCreateConversation(
    propertyId: number,
    buyerId: number,
    sellerId: number,
  ): Promise<Conversation> {
    // Kiểm tra conversation đã tồn tại chưa
    let conversation = await this.conversationRepo.findOne({
      where: {
        property: { id: propertyId },
        buyer: { id: buyerId },
        seller: { id: sellerId },
      },
      relations: ['property', 'buyer', 'seller'],
    });

    if (!conversation) {
      // Tạo mới conversation
      conversation = this.conversationRepo.create({
        property: { id: propertyId } as any,
        buyer: { id: buyerId } as any,
        seller: { id: sellerId } as any,
      });
      conversation = await this.conversationRepo.save(conversation);

      // Load lại với đầy đủ relations (eager)
      conversation = await this.conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ['property', 'buyer', 'seller'],
      });
    }

    return conversation!;
  }

  /**
   * Lấy danh sách Conversation của một User (cả khi user là buyer hoặc seller).
   * Kèm theo tin nhắn mới nhất và số tin chưa đọc.
   */
  async getUserConversations(userId: number): Promise<any[]> {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conv')
      .leftJoinAndSelect('conv.property', 'property')
      .leftJoinAndSelect('conv.buyer', 'buyer')
      .leftJoinAndSelect('conv.seller', 'seller')
      .where('buyer.id = :userId OR seller.id = :userId', { userId })
      .orderBy('conv.updatedAt', 'DESC')
      .getMany();

    // Với mỗi conversation, lấy tin nhắn cuối cùng + số tin chưa đọc
    const result = await Promise.all(
      conversations.map(async (conv) => {
        // Tin nhắn mới nhất
        const lastMessage = await this.messageRepo.findOne({
          where: { conversation: { id: conv.id } },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        // Số tin nhắn chưa đọc (của người khác gửi mà user chưa đọc)
        const unreadCount = await this.messageRepo.count({
          where: {
            conversation: { id: conv.id },
            isRead: false,
            sender: { id: userId === conv.buyer.id ? conv.seller.id : conv.buyer.id },
          },
        });

        return {
          ...conv,
          lastMessage: lastMessage || null,
          unreadCount,
        };
      }),
    );

    return result;
  }

  /**
   * Lấy lịch sử tin nhắn của một Conversation.
   * Kiểm tra quyền truy cập: chỉ buyer hoặc seller mới được xem.
   */
  async getMessages(
    conversationId: string,
    userId: number,
  ): Promise<Message[]> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['buyer', 'seller'],
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc hội thoại không tồn tại');
    }

    // Kiểm tra quyền: chỉ buyer hoặc seller mới được xem tin nhắn
    if (conversation.buyer.id !== userId && conversation.seller.id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem cuộc hội thoại này');
    }

    return this.messageRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Lưu một Message mới vào DB và cập nhật updatedAt của Conversation.
   */
  async createMessage(
    conversationId: string,
    senderId: number,
    content: string,
  ): Promise<Message> {
    // Verify conversation tồn tại và sender có quyền gửi
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['buyer', 'seller'],
    });

    if (!conversation) {
      throw new NotFoundException('Cuộc hội thoại không tồn tại');
    }

    if (conversation.buyer.id !== senderId && conversation.seller.id !== senderId) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này');
    }

    // Tạo và lưu message
    const message = this.messageRepo.create({
      conversation: { id: conversationId } as any,
      sender: { id: senderId } as any,
      content,
      isRead: false,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Cập nhật updatedAt của conversation (để sort theo tin nhắn mới nhất)
    await this.conversationRepo.update(conversationId, { updatedAt: new Date() });

    // Load lại message với đầy đủ relations
    const fullMessage = await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });
    return fullMessage!;
  }

  /**
   * Đánh dấu tất cả tin nhắn chưa đọc trong conversation là đã đọc
   * (chỉ đánh dấu tin nhắn của người khác gửi cho mình).
   */
  async markAsRead(conversationId: string, userId: number): Promise<void> {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['buyer', 'seller'],
    });

    if (!conversation) return;

    // Tìm id người kia (sender của các tin nhắn chưa đọc)
    const otherUserId =
      conversation.buyer.id === userId
        ? conversation.seller.id
        : conversation.buyer.id;

    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id = :otherUserId', { otherUserId })
      .andWhere('is_read = false')
      .execute();
  }
}
