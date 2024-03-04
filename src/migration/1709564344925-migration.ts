import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1709564344925 implements MigrationInterface {
  name = 'Migration1709564344925';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "system"."course" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "image" text, "price" double precision NOT NULL DEFAULT '0', "likes" integer NOT NULL DEFAULT '0', "dislikes" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid, CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."course" ADD CONSTRAINT "FK_2481291d5c97aaff5cf3ce5359c" FOREIGN KEY ("createdById") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system"."course" DROP CONSTRAINT "FK_2481291d5c97aaff5cf3ce5359c"`,
    );
    await queryRunner.query(`DROP TABLE "system"."course"`);
  }
}
