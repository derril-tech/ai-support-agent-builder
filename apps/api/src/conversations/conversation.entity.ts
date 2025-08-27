import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 50 }) channel!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) externalThreadId!: string | null;
  @Column({ type: 'varchar', length: 50, default: 'active' }) status!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
