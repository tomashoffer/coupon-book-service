import { IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RedeemCouponDto {
    @ApiPropertyOptional({ 
        description: 'User ID to redeem for (BUSINESS/ADMIN only). If not provided, uses authenticated user.',
        example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
    })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ 
        description: 'Additional redemption metadata (location, transaction details, notes, etc.)',
        example: { 
            location: 'Downtown Store',
            transactionId: 'TXN-123456',
            discount: '20%',
            orderId: 'ORD-789',
            notes: 'Customer showed physical coupon'
        }
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
