import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1698245995958 implements MigrationInterface {
  name = 'Migration1698245995958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" character varying NOT NULL, "username" character varying(200) NOT NULL, "full_name" character varying, "phone" character varying, "gender" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "verification_code" character varying, "verification_time" numeric, "token" character varying, CONSTRAINT "username" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric NOT NULL, "amount_before" numeric, "amount_after" numeric, "status" character varying NOT NULL DEFAULT 'NEW REQUEST', "name" character varying, "note" character varying(4000), "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "checkout_url" character varying, "status_url" character varying, "address" character varying, "txn_id" character varying, "confirms_needed" character varying, "timeout" integer, "type" character varying, "mail" character varying, "statusSendMail" character varying(4000), "transaction_code" character varying, "method" character varying, "userId" uuid, CONSTRAINT "UQ_9a479da886a2af3f4dac001e1f4" UNIQUE ("transaction_code"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`,
    );
    await queryRunner.query(`DROP TABLE "transaction"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
