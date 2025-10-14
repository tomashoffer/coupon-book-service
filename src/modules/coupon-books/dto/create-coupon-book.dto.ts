import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, Min, Max, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AutoGenerateCodesDto {
    @ApiProperty({ 
        description: 'Pattern for code generation. Use {RANDOM} for unique random string',
        example: 'SUMMER-{RANDOM}'
    })
    @IsString()
    pattern: string;

    @ApiProperty({ 
        description: 'Number of codes to generate',
        example: 100,
        minimum: 1,
        maximum: 10000
    })
    @IsNumber()
    @Min(1)
    @Max(10000)
    count: number;

    @ApiPropertyOptional({ 
        description: 'Length of the random part (only used if pattern contains {RANDOM})',
        example: 8,
        default: 8,
        minimum: 4,
        maximum: 32
    })
    @IsOptional()
    @IsNumber()
    @Min(4)
    @Max(32)
    length?: number;
}

export class CreateCouponBookDto {
    @ApiProperty({ 
        description: 'Coupon book name',
        example: 'Summer Discounts 2024'
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({ 
        description: 'Coupon book description',
        example: 'Discount coupons for summer products'
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ 
        description: 'Maximum number of codes a user can receive from this book',
        example: 3,
        minimum: 1,
        maximum: 100
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    maxCodesPerUser?: number;

    @ApiProperty({ 
        description: 'Allow multiple redemptions of the same coupon per user',
        example: false,
        default: false
    })
    @IsBoolean()
    allowMultipleRedemptions: boolean;

    @ApiPropertyOptional({ 
        description: 'Coupon book expiration date',
        example: '2024-12-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiPropertyOptional({ 
        description: 'Auto-generate codes when creating the coupon book',
        type: AutoGenerateCodesDto,
        example: {
            pattern: 'SUMMER-{RANDOM}',
            count: 100,
            length: 8
        }
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => AutoGenerateCodesDto)
    autoGenerateCodes?: AutoGenerateCodesDto;
}
