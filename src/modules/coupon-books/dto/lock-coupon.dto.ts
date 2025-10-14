import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LockCouponDto {
    @ApiPropertyOptional({ 
        description: 'User ID to lock for (BUSINESS/ADMIN only). If not provided, uses authenticated user.',
        example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
    })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

