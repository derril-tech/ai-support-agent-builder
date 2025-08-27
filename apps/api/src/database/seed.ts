// Created automatically by Cursor AI (2025-08-27)
import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { ConversationEntity } from '../conversations/conversation.entity';
import { MessageEntity } from '../conversations/message.entity';

async function main() {
  await AppDataSource.initialize();
  const convRepo = AppDataSource.getRepository(ConversationEntity);
  const msgRepo = AppDataSource.getRepository(MessageEntity);

  const conv = convRepo.create({ channel: 'web', status: 'active', externalThreadId: null });
  await convRepo.save(conv);
  await msgRepo.save(msgRepo.create({ conversation: conv, role: 'user', content: 'Hello', citations: [], toolCalls: [], toolResults: [], costUsd: 0.0001 }));
  await msgRepo.save(msgRepo.create({ conversation: conv, role: 'assistant', content: 'Hi! How can I help?', citations: [], toolCalls: [], toolResults: [], costUsd: 0.0002 }));
  console.log('Seeded demo conversation:', conv.id);
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
