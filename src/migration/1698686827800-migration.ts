import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698686827800 implements MigrationInterface {
  name = 'Migration1698686827800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"."historical_data" ALTER COLUMN "Symbol" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"."historical_data" ALTER COLUMN "Symbol" DROP NOT NULL`,
    );
  }
}
