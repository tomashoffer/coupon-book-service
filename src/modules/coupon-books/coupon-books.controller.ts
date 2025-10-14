import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    Param, 
    UseGuards, 
    Request,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    Query
} from '@nestjs/common';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { UserDto } from '../user/dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CouponBooksService } from './coupon-books.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { RoleType } from '../../constants/role-type';
import { 
    CreateCouponBookDto, 
    UploadCodesDto, 
    GenerateCodesDto, 
    AssignCouponDto, 
    AssignRandomCouponDto,
    RedeemCouponDto,
    LockCouponDto,
    CouponBookResponseDto,
    CouponCodeResponseDto,
    CouponAssignmentResponseDto,
    CouponRedemptionResponseDto
} from './dto';

@ApiTags('Coupon Books')
@ApiBearerAuth()
@UseGuards(AuthGuard(), RolesGuard)
@Controller('coupon-books')
export class CouponBooksController {
    constructor(private readonly couponBooksService: CouponBooksService) {}

    @Post()
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Create a new coupon book' })
    @ApiResponse({ status: 201, description: 'Coupon book created successfully', type: CouponBookResponseDto })
    async createCouponBook(
        @Request() req: any,
        @Body() createDto: CreateCouponBookDto
    ): Promise<CouponBookResponseDto> {
        const businessId = req.user.id;
        return await this.couponBooksService.createCouponBook(businessId, createDto);
    }

    @Post(':id/codes/upload')
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Upload coupon codes to an existing book' })
    @ApiParam({ name: 'id', description: 'Coupon book ID' })
    @ApiResponse({ status: 201, description: 'Codes uploaded successfully', type: [CouponCodeResponseDto] })
    async uploadCodes(
        @Param('id', ParseUUIDPipe) couponBookId: string,
        @Body() uploadDto: UploadCodesDto
    ): Promise<CouponCodeResponseDto[]> {
        return await this.couponBooksService.uploadCodes(couponBookId, uploadDto);
    }

    @Post(':id/codes/generate')
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Generate coupon codes automatically' })
    @ApiParam({ name: 'id', description: 'Coupon book ID' })
    @ApiResponse({ status: 201, description: 'Codes generated successfully', type: [CouponCodeResponseDto] })
    async generateCodes(
        @Param('id', ParseUUIDPipe) couponBookId: string,
        @Body() generateDto: GenerateCodesDto
    ): Promise<CouponCodeResponseDto[]> {
        return await this.couponBooksService.generateCodes(couponBookId, generateDto);
    }

    @Post(':id/assign/random')
    @Roles(RoleType.CUSTOMER, RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Assign a random coupon to a user' })
    @ApiParam({ name: 'id', description: 'Coupon book ID' })
    @ApiResponse({ status: 201, description: 'Coupon assigned successfully', type: CouponAssignmentResponseDto })
    async assignRandomCoupon(
        @AuthUser() user: UserDto,
        @Param('id', ParseUUIDPipe) couponBookId: string,
        @Body() assignDto: AssignRandomCouponDto
    ): Promise<any> {
        const targetUserId = assignDto?.userId || user.id;
        return await this.couponBooksService.assignRandomCoupon(couponBookId, targetUserId);
    }

    @Post('assign/:code')
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Assign a specific coupon to a user' })
    @ApiParam({ name: 'code', description: 'Coupon code' })
    @ApiResponse({ status: 201, description: 'Coupon assigned successfully', type: CouponAssignmentResponseDto })
    async assignSpecificCoupon(
        @Param('code') couponCode: string,
        @Body() assignDto: AssignCouponDto
    ): Promise<any> {
        return await this.couponBooksService.assignSpecificCoupon(couponCode, assignDto);
    }

    @Post('lock/:code')
    @Roles(RoleType.CUSTOMER, RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ 
        summary: 'Lock a coupon temporarily',
        description: 'Locks a coupon. CUSTOMER locks their own coupon. BUSINESS/ADMIN can specify userId in body to lock for another user.'
    })
    @ApiParam({ name: 'code', description: 'Coupon code' })
    @ApiResponse({ status: 200, description: 'Coupon locked successfully', type: CouponCodeResponseDto })
    async lockCoupon(
        @AuthUser() user: UserDto,
        @Param('code') couponCode: string,
        @Body() lockDto?: LockCouponDto
    ): Promise<CouponCodeResponseDto> {
        const targetUserId = lockDto?.userId || user.id;
        return await this.couponBooksService.lockCoupon(couponCode, targetUserId);
    }

    @Post('redeem/:code')
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
        summary: 'Redeem a coupon',
        description: 'Redeems a coupon permanently. BUSINESS/ADMIN can specify userId in body to redeem for another user.'
    })
    @ApiParam({ name: 'code', description: 'Coupon code' })
    @ApiResponse({ status: 200, description: 'Coupon redeemed successfully', type: CouponRedemptionResponseDto })
    async redeemCoupon(
        @AuthUser() user: UserDto,
        @Param('code') couponCode: string,
        @Body() redeemDto: RedeemCouponDto
    ): Promise<any> {
        const targetUserId = redeemDto?.userId || user.id;
        
        return await this.couponBooksService.redeemCoupon(
            couponCode, 
            targetUserId, 
            redeemDto.metadata
        );
    }

    @Get('my-assigned-coupons')
    @Roles(RoleType.CUSTOMER, RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Get coupons assigned to the current user' })
    @ApiResponse({ status: 200, description: 'List of assigned coupons', type: [CouponAssignmentResponseDto] })
    async getMyCoupons(
        @Request() req: any
    ): Promise<any[]> {
        const userId = req.userId;
        return await this.couponBooksService.getUserCoupons(userId);
    }

    @Get(':id')
    @Roles(RoleType.BUSINESS, RoleType.ADMIN)
    @ApiOperation({ summary: 'Get coupon book by ID' })
    @ApiParam({ name: 'id', description: 'Coupon book ID' })
    @ApiResponse({ status: 200, description: 'Coupon book found', type: CouponBookResponseDto })
    async getCouponBook(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<CouponBookResponseDto> {
        return await this.couponBooksService.getCouponBookById(id);
    }

}
