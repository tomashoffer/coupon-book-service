import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CouponBooksService } from './coupon-books.service';

@Injectable()
export class CouponLockCleanupService {
    private readonly logger = new Logger(CouponLockCleanupService.name);

    constructor(private readonly couponBooksService: CouponBooksService) {}

    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredLocks() {
        try {
            this.logger.log('Starting cleanup of expired coupon locks...');
            
            const cleanedCount = await this.couponBooksService.cleanupExpiredLocks();
            
            if (cleanedCount > 0) {
                this.logger.log(`Cleaned up ${cleanedCount} expired coupon locks`);
            } else {
                this.logger.debug('No expired coupon locks found');
            }
        } catch (error) {
            this.logger.error('Error during coupon lock cleanup:', error);
        }
    }
}
