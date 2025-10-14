import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { isNil } from "lodash";
import { SnakeNamingStrategy } from "../../snake-naming.strategy";

@Injectable()
export class ApiConfigService {
    constructor(private configService: ConfigService) {}

    get isDevelopment(): boolean {
        return this.nodeEnv === "development";
    }

    get isProduction(): boolean {
        return this.getString("NAMESPACE") === "default";
    }

    get isTest(): boolean {
        return this.nodeEnv === "test";
    }

    private getNumber(key: string): number {
        const value = this.get(key);

        try {
            return Number(value);
        } catch {
            throw new Error(key + " environment variable is not a number");
        }
    }

    private getBoolean(key: string): boolean {
        const value = this.get(key);

        try {
            return Boolean(JSON.parse(value));
        } catch {
            throw new Error(key + " env var is not a boolean");
        }
    }

    public getString(key: string): string {
        const value = this.get(key);
        // It will not affect the single-line base64 strings.
        return value.replace(/\\n/g, "\n");
    }

    get nodeEnv(): string {
        return this.getString("NODE_ENV");
    }

    get postgresConfig(): TypeOrmModuleOptions {
        const entities = [
            __dirname + "/../../modules/**/*.entity{.ts,.js}",
            __dirname + "/../../modules/**/*.view-entity{.ts,.js}",
        ];

        const migrations = [__dirname + "/../../database/migrations/*{.ts,.js}"];

        return {
            entities,
            migrations,
            synchronize: false,
            type: "postgres",
            name: "default",
            host: this.getString("DB_HOST"),
            port: this.getNumber("DB_PORT"),
            username: this.getString("POSTGRES_USER"),
            password: this.getString("POSTGRES_PASSWORD"),
            database: this.getString("POSTGRES_DB"),
            ssl: false,
            // subscribers: [],
            migrationsRun: true,
            logging: this.getBoolean("ENABLE_ORM_LOGS"),
            namingStrategy: new SnakeNamingStrategy(),
        };
    }

    get authConfig() {
        return {
            privateKey: this.getString("JWT_PRIVATE_KEY_BASE64"),
            publicKey: this.getString("JWT_PUBLIC_KEY_BASE64"),
            jwtExpirationTime: this.getNumber("JWT_EXPIRATION_TIME") * 24,
            refreshTokenExpirationTime: this.getNumber("JWT_EXPIRATION_TIME") * 168,
        };
    }

    get oauthConfig() {
        return {
            GOOGLE: {
                APP_KEY: this.getString("GOOGLE_CLIENT_ID"),
                APP_SECRET: this.getString("GOOGLE_CLIENT_SECRET"),
                CALLBACK_URL: this.getString("GOOGLE_REDIRECT_URI"),
            },
        };
    }

    get mercadoPagoConfig() {
        return {
            accessToken: this.getString("MERCADOPAGO_ACCESS_TOKEN"),
            baseUrl: this.getString("MERCADOPAGO_BASE_URL"),
            webhookUrl: this.getString("MERCADOPAGO_WEBHOOK_URL"),
        };
    }

    get frontendUrl() {
        return this.getString("NEXT_PUBLIC_APP_URL");
    }


    private get(key: string): string {
        const value = this.configService.get<string>(key);

        if (isNil(value)) {
            throw new Error(key + " environment variable is not set"); // probably we should call process.exit() too to avoid locking the service
        }

        return value;
    }
}
