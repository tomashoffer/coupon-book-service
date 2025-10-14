import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1750376602445 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create role_type enum
        await queryRunner.query(`
            CREATE TYPE "role_type_enum" AS ENUM('BUSINESS', 'CUSTOMER', 'ADMIN')
        `);

        // Create auth_provider enum
        await queryRunner.query(`
            CREATE TYPE "auth_provider_enum" AS ENUM('LOCAL', 'GOOGLE')
        `);

        // Create users table
        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()'
                },
                {
                    name: 'first_name',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'last_name',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'role',
                    type: 'enum',
                    enum: ['BUSINESS', 'CUSTOMER', 'ADMIN'],
                    default: "'CUSTOMER'"
                },
                {
                    name: 'email',
                    type: 'varchar',
                    isUnique: true,
                    isNullable: true
                },
                {
                    name: 'password',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'temporary_password',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'phone',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'verification_token',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'reset_password_token',
                    type: 'varchar',
                    isNullable: true
                },
                {
                    name: 'reset_password_expires_at',
                    type: 'timestamp',
                    isNullable: true
                },
                {
                    name: 'password_changed_at',
                    type: 'timestamp',
                    isNullable: true
                },
                {
                    name: 'auth_provider',
                    type: 'enum',
                    enum: ['LOCAL', 'GOOGLE'],
                    default: "'LOCAL'",
                    isNullable: true
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()'
                },
                {
                    name: 'updated_at',
                    type: 'timestamp',
                    default: 'now()'
                }
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
        await queryRunner.query(`DROP TYPE "auth_provider_enum"`);
        await queryRunner.query(`DROP TYPE "role_type_enum"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }

}
