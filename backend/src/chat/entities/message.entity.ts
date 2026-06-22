import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

/**
 * MessageEntity — Lưu chi tiết từng tin nhắn trong một cuộc hội thoại.
 * Mỗi message thuộc về 1 conversation và được gửi bởi 1 user (sender).
 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Cuộc hội thoại chứa tin nhắn này
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  // Người gửi tin nhắn (có thể là buyer hoặc seller)
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  // Nội dung tin nhắn
  @Column('text')
  content: string;

  // Trạng thái đã đọc (người nhận đã đọc chưa)
  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
