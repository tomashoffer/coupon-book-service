// src/data-source.ts
import "dotenv/config";
import { DataSource } from "typeorm";
import * as path from "path";
import { SnakeNamingStrategy } from "./snake-naming.strategy";
import { UserEntity } from "./modules/user/user.entity";
import { CouponBookEntity } from "./modules/coupon-books/entities/coupon-book.entity";
import { CouponCodeEntity } from "./modules/coupon-books/entities/coupon-code.entity";
import { CouponAssignmentEntity } from "./modules/coupon-books/entities/coupon-assignment.entity";
import { CouponRedemptionEntity } from "./modules/coupon-books/entities/coupon-redemption.entity";

const isCompiled = path.extname(__filename).endsWith(".js");

const options = {
  type: "postgres",
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  username: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  database: process.env.POSTGRES_DB!,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    UserEntity,
    CouponBookEntity,
    CouponCodeEntity,
    CouponAssignmentEntity,
    CouponRedemptionEntity
  ],
  migrations: [
    isCompiled
      ? path.join(__dirname, "database/migrations/*.js")
      : path.join(__dirname, "database/migrations/*.ts"),
  ],
  synchronize: false,
  logging: false,
};

// **Sólo un export default** de la instancia
const AppDataSource = new DataSource(options as any);
export default AppDataSource;
