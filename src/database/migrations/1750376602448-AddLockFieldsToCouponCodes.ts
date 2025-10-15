import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLockFieldsToCouponCodes1750376602448 implements MigrationInterface {
    name = 'AddLockFieldsToCouponCodes1750376602448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new lock-related columns
        await queryRunner.query(`
            ALTER TABLE "coupon_codes" 
            ADD COLUMN "locked_by_user_id" uuid,
            ADD COLUMN "lock_expires_at" timestamp
        `);

        // Add foreign key constraint for locked_by_user_id
        await queryRunner.query(`
            ALTER TABLE "coupon_codes" 
            ADD CONSTRAINT "FK_coupon_codes_locked_by_user" 
            FOREIGN KEY ("locked_by_user_id") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL
        `);

        // Add index for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_coupon_codes_lock_expires_at" 
            ON "coupon_codes" ("lock_expires_at") 
            WHERE "lock_expires_at" IS NOT NULL
        `);

        // Clean up any existing locks without proper ownership
        await queryRunner.query(`
            UPDATE "coupon_codes" 
            SET "status" = 'ASSIGNED', 
                "locked_at" = NULL 
            WHERE "status" = 'LOCKED' 
            AND "locked_by_user_id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "IDX_coupon_codes_lock_expires_at"`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "coupon_codes" DROP CONSTRAINT "FK_coupon_codes_locked_by_user"`);
        
        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "coupon_codes" 
            DROP COLUMN "locked_by_user_id",
            DROP COLUMN "lock_expires_at"
        `);
    }
}
