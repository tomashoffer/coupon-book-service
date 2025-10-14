import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponStatus } from '../../../constants/coupon-status';
import { CouponBookStatus } from '../../../constants/coupon-status';

export class CouponCodeResponseDto {
    @ApiProperty({ description: 'Unique coupon ID' })
    id: string;

    @ApiProperty({ description: 'Coupon code' })
    code: string;

    @ApiProperty({ description: 'Current coupon status', enum: CouponStatus })
    status: CouponStatus;

    @ApiPropertyOptional({ description: 'Assigned user ID' })
    assignedToUserId?: string;

    @ApiPropertyOptional({ description: 'Assignment date' })
    assignedAt?: Date;

    @ApiPropertyOptional({ description: 'Temporary lock date' })
    lockedAt?: Date;

    @ApiPropertyOptional({ description: 'Redemption date' })
    redeemedAt?: Date;

    @ApiPropertyOptional({ description: 'Expiration date' })
    expiresAt?: Date;

    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date' })
    updatedAt: Date;
}

export class CouponBookResponseDto {
    @ApiProperty({ description: 'Unique coupon book ID' })
    id: string;

    @ApiProperty({ description: 'Coupon book name' })
    name: string;

    @ApiPropertyOptional({ description: 'Coupon book description' })
    description?: string;

    @ApiProperty({ description: 'Business owner ID' })
    businessId: string;

    @ApiPropertyOptional({ description: 'Maximum number of codes per user' })
    maxCodesPerUser?: number;

    @ApiProperty({ description: 'Allows multiple redemptions' })
    allowMultipleRedemptions: boolean;

    @ApiProperty({ description: 'Coupon book status', enum: CouponBookStatus })
    status: CouponBookStatus;

    @ApiPropertyOptional({ description: 'Expiration date' })
    expiresAt?: Date;

    @ApiProperty({ description: 'Total codes in the book' })
    totalCodes: number;

    @ApiProperty({ description: 'Creation date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date' })
    updatedAt: Date;
}

export class CouponAssignmentResponseDto {
    @ApiProperty({ description: 'Unique assignment ID' })
    id: string;

    @ApiProperty({ description: 'Coupon code ID' })
    couponCodeId: string;

    @ApiProperty({ description: 'Coupon code' })
    couponCode: string;

    @ApiProperty({ description: 'User ID' })
    userId: string;

    @ApiProperty({ description: 'Assignment date' })
    assignedAt: Date;

    @ApiPropertyOptional({ description: 'Assignment expiration date' })
    expiresAt?: Date;

    @ApiProperty({ description: 'Coupon status', enum: CouponStatus })
    status: CouponStatus;
}

export class CouponRedemptionResponseDto {
    @ApiProperty({ description: 'Unique redemption ID' })
    id: string;

    @ApiProperty({ description: 'Coupon code ID' })
    couponCodeId: string;

    @ApiProperty({ description: 'Redeemed coupon code' })
    couponCode: string;

    @ApiProperty({ description: 'ID of user who redeemed' })
    userId: string;

    @ApiProperty({ description: 'Redemption date' })
    redeemedAt: Date;

    @ApiPropertyOptional({ description: 'Business location' })
    businessLocation?: string;

    @ApiPropertyOptional({ description: 'Additional metadata' })
    metadata?: Record<string, any>;
}
