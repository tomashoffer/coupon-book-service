import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignCouponDto {
    @ApiProperty({ 
        description: 'ID of the user to assign the coupon to',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({ 
        description: 'Specific coupon code to assign (if not provided, a random one is assigned)',
        example: 'SUMMER2024-001'
    })
    @IsOptional()
    @IsString()
    couponCode?: string;
}

export class AssignRandomCouponDto {
    @ApiProperty({ 
        description: 'ID of the user to assign the coupon to',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @IsUUID()
    userId: string;
}
