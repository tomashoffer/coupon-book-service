import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponBooksController } from './coupon-books.controller';
import { CouponBooksService } from './coupon-books.service';
import { CouponBookEntity } from './entities/coupon-book.entity';
import { CouponCodeEntity } from './entities/coupon-code.entity';
import { CouponAssignmentEntity } from './entities/coupon-assignment.entity';
import { CouponRedemptionEntity } from './entities/coupon-redemption.entity';
import { UserEntity } from '../user/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CouponBookEntity,
            CouponCodeEntity,
            CouponAssignmentEntity,
            CouponRedemptionEntity,
            UserEntity,
        ]),
    ],
    controllers: [CouponBooksController],
    providers: [CouponBooksService],
    exports: [CouponBooksService],
})
export class CouponBooksModule {}
