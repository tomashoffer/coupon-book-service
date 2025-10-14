import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCouponTables1750376602447 implements MigrationInterface {
    name = 'CreateCouponTables1750376602447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create coupon_book_status enum
        await queryRunner.query(`
            CREATE TYPE "coupon_book_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'EXPIRED', 'DRAFT')
        `);

        // Create coupon_status enum
        await queryRunner.query(`
            CREATE TYPE "coupon_status_enum" AS ENUM('AVAILABLE', 'ASSIGNED', 'LOCKED', 'REDEEMED', 'EXPIRED')
        `);

        // Create coupon_books table
        await queryRunner.query(`
            CREATE TABLE "coupon_books" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "name" character varying(255) NOT NULL,
                "description" text,
                "business_id" uuid NOT NULL,
                "max_codes_per_user" integer,
                "allow_multiple_redemptions" boolean NOT NULL DEFAULT false,
                "status" "coupon_book_status_enum" NOT NULL DEFAULT 'DRAFT',
                "expires_at" TIMESTAMP,
                "total_codes" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_coupon_books" PRIMARY KEY ("id")
            )
        `);

        // Create coupon_codes table
        await queryRunner.query(`
            CREATE TABLE "coupon_codes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "code" character varying(255) NOT NULL,
                "coupon_book_id" uuid NOT NULL,
                "status" "coupon_status_enum" NOT NULL DEFAULT 'AVAILABLE',
                "assigned_to_user_id" uuid,
                "assigned_at" TIMESTAMP,
                "locked_at" TIMESTAMP,
                "redeemed_at" TIMESTAMP,
                "expires_at" TIMESTAMP,
                CONSTRAINT "PK_coupon_codes" PRIMARY KEY ("id")
            )
        `);

        // Create coupon_assignments table
        await queryRunner.query(`
            CREATE TABLE "coupon_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "coupon_code_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP,
                CONSTRAINT "PK_coupon_assignments" PRIMARY KEY ("id")
            )
        `);

        // Create coupon_redemptions table
        await queryRunner.query(`
            CREATE TABLE "coupon_redemptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "coupon_code_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "redeemed_at" TIMESTAMP NOT NULL DEFAULT now(),
                "business_location" character varying(255),
                "metadata" jsonb,
                CONSTRAINT "PK_coupon_redemptions" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for coupon_codes
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_coupon_codes_code" ON "coupon_codes" ("code")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_codes_coupon_book_status" ON "coupon_codes" ("coupon_book_id", "status")
        `);

        // Create indexes for coupon_assignments
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_coupon_assignments_user_coupon" ON "coupon_assignments" ("user_id", "coupon_code_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_assignments_user_id" ON "coupon_assignments" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_assignments_coupon_code_id" ON "coupon_assignments" ("coupon_code_id")
        `);

        // Create indexes for coupon_redemptions
        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_redemptions_coupon_user" ON "coupon_redemptions" ("coupon_code_id", "user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_redemptions_user_id" ON "coupon_redemptions" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_redemptions_redeemed_at" ON "coupon_redemptions" ("redeemed_at")
        `);

        // Create foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "coupon_books" 
            ADD CONSTRAINT "FK_coupon_books_business_id" 
            FOREIGN KEY ("business_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_codes" 
            ADD CONSTRAINT "FK_coupon_codes_coupon_book_id" 
            FOREIGN KEY ("coupon_book_id") REFERENCES "coupon_books"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_codes" 
            ADD CONSTRAINT "FK_coupon_codes_assigned_to_user_id" 
            FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_assignments" 
            ADD CONSTRAINT "FK_coupon_assignments_coupon_code_id" 
            FOREIGN KEY ("coupon_code_id") REFERENCES "coupon_codes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_assignments" 
            ADD CONSTRAINT "FK_coupon_assignments_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_redemptions" 
            ADD CONSTRAINT "FK_coupon_redemptions_coupon_code_id" 
            FOREIGN KEY ("coupon_code_id") REFERENCES "coupon_codes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "coupon_redemptions" 
            ADD CONSTRAINT "FK_coupon_redemptions_user_id" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_user_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_coupon_redemptions_coupon_code_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_assignments" DROP CONSTRAINT "FK_coupon_assignments_user_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_assignments" DROP CONSTRAINT "FK_coupon_assignments_coupon_code_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_codes" DROP CONSTRAINT "FK_coupon_codes_assigned_to_user_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_codes" DROP CONSTRAINT "FK_coupon_codes_coupon_book_id"`);
        await queryRunner.query(`ALTER TABLE "coupon_books" DROP CONSTRAINT "FK_coupon_books_business_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_coupon_redemptions_redeemed_at"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_redemptions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_redemptions_coupon_user"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_assignments_coupon_code_id"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_assignments_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_assignments_user_coupon"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_codes_coupon_book_status"`);
        await queryRunner.query(`DROP INDEX "IDX_coupon_codes_code"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
        await queryRunner.query(`DROP TABLE "coupon_assignments"`);
        await queryRunner.query(`DROP TABLE "coupon_codes"`);
        await queryRunner.query(`DROP TABLE "coupon_books"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE "coupon_status_enum"`);
        await queryRunner.query(`DROP TYPE "coupon_book_status_enum"`);
    }
}
