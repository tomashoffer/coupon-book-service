import { UserLoginDto } from '../auth/dto/UserLogin.dto';
import { AuthService } from '../auth/auth.service';
import { LoginPayloadDto } from './../auth/dto/LoginPayload.dto';
import { UserRegisterDto } from './../auth/dto/UserRegister.dto';
import {
    Body,
    Controller,
    Headers,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from '../../constants/role-type';
import { Auth } from '../../decorators/http.decorators';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { DeleteUserDto, UserDto } from './dto/user.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { AuthActions } from '../auth/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { CarId } from './dto/add-data-to-user.dto';


@Controller('users')
@ApiTags('users')
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) { }


    @Get('emails')
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get emails',
        description: 'Get emails'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Get emails',
        type: [String],
    })
    getUserEmailsByRegexp(@Query('q') q: string): Promise<string[]> {
        return this.userService.getEmailsByRegexp(q);
    }

    @Get('filter-by-dates')
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user by dates',
        description: 'Get user by dates'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Get user by dates',
        type: [UserDto],
    })
    async filterByDates(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
        return await this.userService.filterUsersByDates(dateFrom, dateTo);
    }

    @Get('find')
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Find User',
        description: 'Find User'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Find User',
        type: [UserDto],
    })
    async findUser(@Query('q') q?: string)  {
        return await this.userService.filterUsers(q);
    }

    @Get('sort')
    @ApiOperation({
        summary: 'Sort User',
        description: 'Sort User'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Sort User',
        type: [UserDto],
    })
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    async getUsersWithSorting(@Query() q: any)  {
        return this.userService.getUsersWithSorting(q.ascending, q.variable, q.rows);
    }

    @Get(':id')
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get user by id',
        description: 'Get user by id'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Get user by id',
        type: UserDto,
    })
    getUser(@Param('id') userId: string) {
        return this.userService.findOne({ id: userId });
    }

    @Get()
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get all users',
        description: 'Get all users'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Get users'
    })
    async getUsers(@Query() query: any) {
        let takeValue = 0;
        let skipValue = 0;
        if (query && query.take) {
            takeValue = query.take
        }
        if(query && query.skip) {
            skipValue = query.skip
        }

        const users = await this.userService.findAllWithPagination(takeValue, skipValue);
        const totalCount = await this.userService.getTotalUserCount(); 
    
        if (users) {
            return {
                count: totalCount,
                next: null,
                previous: null,
                results: users,
            };
        }
    }

    /**
     * Update current user (No userId required)
     * @param user 
     * @param updateUserDto 
     * @returns 
     */
    @Put()
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update user data',
        description: 'Update user data'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Update user data',
        type: UserDto
    })
    updateCurrentUser(@AuthUser() user: UserDto, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(user.id, updateUserDto);
    }
    /**
     * Update user 
     * @param id
     * @param updateUserDto 
     * @returns 
     */
    @Put(':id')
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update user data',
        description: 'Update user data'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Update user data',
        type: UserDto
    })
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserDto);
    }

    /**
     * Update user from admin panel
     * @param id
     * @param UpdateUserFromAdminDto 
     * @returns 
     */
    @Put('admin-panel/:id')
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Update user data from admin panel',
        description: 'Update user data from admin panel',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Update user data from admin panel',
        type: UserDto
    })
    async updateUserFromAdmin(@Param('id') id: string, @Body() updateUserFromAdminDto: UpdateUserDto) {
        return this.userService.updateUser(id, updateUserFromAdminDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: UserDto, description: 'Successfully Registered' })
    async userRegister(
        @Body() userRegisterDto: UserRegisterDto,
    ): Promise<UserDto> {
        const createdUser: UserEntity = await this.userService.createUser(
            userRegisterDto,
        );

        return createdUser.toDto();
    }

    @Post('token')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: 'User info with access token',
    })
    async userLogin(
        @Body() userLoginDto: UserLoginDto,
        @Headers() headers
    ): Promise<LoginPayloadDto> {
        const { user: userEntity, isPasswordExpired } = await this.authService.validateUser(userLoginDto, headers.host);

        const token = await this.authService.createAccessToken({
            userId: userEntity.id,
            role: userEntity.role,
        });

        return new LoginPayloadDto(userEntity.toDto(), token, AuthActions.LOGIN, isPasswordExpired);
    }

    @Delete()
    @Auth([RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Delete user and details',
        description: 'Delete specific user all details, (European GDPR requirement)'
    })
    async delete(@Body() deleteUserDto: DeleteUserDto) {
        return this.userService.deleteUser({ email: deleteUserDto.email });
    }

    @Delete('delete-user')
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    deleteUser(@AuthUser() user: UserEntity) {
        return this.userService.deleteUser({ id: user.id });
    }

}
