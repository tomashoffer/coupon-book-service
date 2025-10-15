import { IsString, IsArray, IsOptional, IsNumber, Min, Max, ArrayMinSize, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadCodesDto {
    @ApiProperty({ 
        description: 'Coupon book ID',
        example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
    })
    @IsUUID()
    couponBookId: string;

    @ApiProperty({ 
        description: 'List of coupon codes to upload to the book',
        example: ['SUMMER2024-001', 'SUMMER2024-002', 'SUMMER2024-003'],
        type: [String]
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    codes: string[];
}

export class GenerateCodesDto {
    @ApiProperty({ 
        description: 'Coupon book ID',
        example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
    })
    @IsUUID()
    couponBookId: string;

    @ApiProperty({ 
        description: 'Pattern for generating codes with placeholders: {RANDOM}, {NUM}, {ALPHA}',
        example: 'SUMMER-{RANDOM}-{NUM}'
    })
    @IsString()
    pattern: string;

    @ApiProperty({ 
        description: 'Total number of codes to generate',
        example: 100,
        minimum: 1,
        maximum: 10000
    })
    @IsNumber()
    @Min(1)
    @Max(10000)
    totalCodes: number;

    @ApiPropertyOptional({ 
        description: 'Length of random parts in the pattern',
        example: 6,
        minimum: 4,
        maximum: 12
    })
    @IsOptional()
    @IsNumber()
    @Min(4)
    @Max(12)
    randomLength?: number;
}
