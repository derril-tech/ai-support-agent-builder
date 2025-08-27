import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitConversations1693142400000 implements MigrationInterface {
  name = 'InitConversations1693142400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "conversations" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "channel" varchar(50) NOT NULL, "externalThreadId" varchar(255), "status" varchar(50) NOT NULL DEFAULT 'active', "createdAt" TIMESTAMPTZ DEFAULT now(), "updatedAt" TIMESTAMPTZ DEFAULT now())`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "messages" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "conversationId" uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE, "role" varchar(20) NOT NULL, "content" text NOT NULL, "citations" jsonb DEFAULT '[]', "toolCalls" jsonb DEFAULT '[]', "toolResults" jsonb DEFAULT '[]', "costUsd" numeric(10,6) DEFAULT 0, "latencyMs" integer, "createdAt" TIMESTAMPTZ DEFAULT now())`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "messages"');
    await queryRunner.query('DROP TABLE IF EXISTS "conversations"');
  }
}
