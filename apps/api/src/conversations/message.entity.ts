import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ConversationEntity } from './conversation.entity';

@Entity({ name: 'messages' })
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => ConversationEntity)
  conversation!: ConversationEntity;
  @Column({ type: 'varchar', length: 20 }) role!: 'user' | 'assistant' | 'system';
  @Column({ type: 'text' }) content!: string;
  @Column({ type: 'jsonb', default: '[]' }) citations!: unknown[];
  @Column({ type: 'jsonb', default: '[]' }) toolCalls!: unknown[];
  @Column({ type: 'jsonb', default: '[]' }) toolResults!: unknown[];
  @Column({ type: 'numeric', precision: 10, scale: 6, default: 0 }) costUsd!: number;
  @Column({ type: 'int', nullable: true }) latencyMs!: number | null;
  @CreateDateColumn() createdAt!: Date;
}

