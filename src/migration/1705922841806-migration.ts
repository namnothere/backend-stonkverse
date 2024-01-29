import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1705922841806 implements MigrationInterface {
  name = 'Migration1705922841806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"."users" ADD "role" text NOT NULL DEFAULT 'USER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user"."users" DROP COLUMN "role"`);
  }
}
