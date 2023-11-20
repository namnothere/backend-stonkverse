import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1700398922699 implements MigrationInterface {
  name = 'Migration1700398922699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user"."historical_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" TIMESTAMP WITH TIME ZONE NOT NULL, "open_price" bigint NOT NULL, "high_price" bigint NOT NULL, "low_price" bigint NOT NULL, "close_price" bigint NOT NULL, "adj_close_price" bigint, "volume" bigint NOT NULL, "symbol" text NOT NULL, "change" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d6303a200d1d9dc8f3bcb857331" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "password" character varying NOT NULL, "username" character varying(200) NOT NULL, "email" character varying(200), "full_name" character varying, "phone" character varying, "gender" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "verification_code" character varying, "verification_time" numeric, "token" character varying, CONSTRAINT "username" UNIQUE ("username"), CONSTRAINT "user_email" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user"."transaction" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric NOT NULL, "amount_before" numeric, "amount_after" numeric, "status" character varying NOT NULL DEFAULT 'NEW REQUEST', "name" character varying, "note" character varying(4000), "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(), "updatedAt" TIMESTAMP DEFAULT now(), "checkout_url" character varying, "status_url" character varying, "address" character varying, "txn_id" character varying, "confirms_needed" character varying, "timeout" integer, "type" character varying, "mail" character varying, "statusSendMail" character varying(4000), "transaction_code" character varying, "method" character varying, "userId" uuid, CONSTRAINT "UQ_9a479da886a2af3f4dac001e1f4" UNIQUE ("transaction_code"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"."transaction" ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "user"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"."transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`,
    );
    await queryRunner.query(`DROP TABLE "user"."transaction"`);
    await queryRunner.query(`DROP TABLE "user"."users"`);
    await queryRunner.query(`DROP TABLE "user"."historical_data"`);
  }
}
