import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableRls1693146000000 implements MigrationInterface {
  name = 'EnableRls1693146000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE conversations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`);
    // Permissive placeholder RLS policies (to be replaced with tenant-aware policies)
    await queryRunner.query(`CREATE POLICY conversations_select_all ON conversations FOR SELECT USING (true)`);
    await queryRunner.query(`CREATE POLICY messages_select_all ON messages FOR SELECT USING (true)`);
    await queryRunner.query(`CREATE POLICY conversations_insert_all ON conversations FOR INSERT WITH CHECK (true)`);
    await queryRunner.query(`CREATE POLICY messages_insert_all ON messages FOR INSERT WITH CHECK (true)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS messages_insert_all ON messages`);
    await queryRunner.query(`DROP POLICY IF EXISTS conversations_insert_all ON conversations`);
    await queryRunner.query(`DROP POLICY IF EXISTS messages_select_all ON messages`);
    await queryRunner.query(`DROP POLICY IF EXISTS conversations_select_all ON conversations`);
    await queryRunner.query(`ALTER TABLE messages DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE conversations DISABLE ROW LEVEL SECURITY`);
  }
}
