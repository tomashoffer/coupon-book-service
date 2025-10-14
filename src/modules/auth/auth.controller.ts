import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Req,
    Res
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from 'express';
import { RoleType } from "../../constants/role-type";
import { AuthUser } from "../../decorators/auth-user.decorator";
import { Auth } from "../../decorators/http.decorators";
import { UserDto } from "../user/dto/user.dto";
import { UserEntity } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";
import { AuthActions } from "./auth.types";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { EmailExistsDto } from "./dto/EmailExistsDto";
import { LoginPayloadDto } from "./dto/LoginPayload.dto";
import { TokenPayloadDto } from "./dto/TokenPayloadDto";
import { UserLoginDto } from "./dto/UserLogin.dto";
import { UserRegisterDto } from "./dto/UserRegister.dto";
import {
    ResetPasswordDto,
    ResetPasswordEmailDto,
} from "./dto/reset-password.dto";
import { plainToInstance } from 'class-transformer';
@Controller("auth")
@ApiTags("auth")
export class AuthController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}

    @Post("login")
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: "User info with access token",
    })
    async userLogin(
        @Body() userLoginDto: UserLoginDto,
        @Headers() headers
    ): Promise<LoginPayloadDto> {
        const { user: userEntity, isPasswordExpired } = await this.authService.validateUser(userLoginDto, headers.host);

        const token: TokenPayloadDto = await this.authService.createAccessToken(
            {
                userId: userEntity.id,
                role: userEntity.role,
            }
        );

        return new LoginPayloadDto(
            userEntity.toDto(),
            token,
            AuthActions.LOGIN,
            isPasswordExpired
        );
    }

    @Post("register")
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ type: UserDto, description: "Successfully Registered" })
    async userRegister(
        @Body() userRegisterDto: UserRegisterDto
    ): Promise<{ email: string }> 
    {
        const existingUser = await this.userService.findByEmail(userRegisterDto.email);
        if (existingUser) {
            throw new HttpException('User already exists', HttpStatus.CONFLICT);
        }

        const { email } = await this.userService.createUser(userRegisterDto);
        return { email };
    }

    @Post("token/refresh")
    @HttpCode(HttpStatus.OK)
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @ApiOkResponse({
        type: LoginPayloadDto,
        description: "User info with access token",
    })
    async refreshAccessToken(): Promise<LoginPayloadDto> {
        throw "Not implemented";
    }

    
    @Get("login-from-token")
    @HttpCode(HttpStatus.OK)
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @ApiOkResponse({ type: LoginPayloadDto, description: "User info with access token" })
    async getUserLoginData(@AuthUser() user: UserEntity): Promise<LoginPayloadDto | null> {
        const entity = plainToInstance(UserEntity, user);
        const userData = await this.userService.findOne({
            id: entity.id
        });
    
        if (userData) {
            const token: TokenPayloadDto = await this.authService.createAccessToken({
                userId: userData.id,
                role: userData.role,
            });
    
            return new LoginPayloadDto(
                userData.toDto(),
                token,
                AuthActions.LOGIN,
                false
            );
        }
        return null;
    }

    @Get("me")
    @HttpCode(HttpStatus.OK)
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @ApiOkResponse({ type: UserDto, description: "current user info" })
    async getCurrentUser(@AuthUser() user: UserEntity): Promise<UserDto> {
      const entity = plainToInstance(UserEntity, user);
      const userData = await this.userService.findOne({
        id: entity.id
      });
      
      return userData.toDto();
    }

    @Get("send-verification-email")
    async sendVerificationEmail(@Body("email") email: string) {
        await this.userService.sendVerificationEmail(email.toLocaleLowerCase());
        return {
            message:
                "Verification sent, please check your email for further instructions",
        };
    }

    @Post("change-password")
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    changePassword(@Body() body: ChangePasswordDto, @AuthUser() user: UserDto) {
        return this.authService.changePassword(user.id, body);
    }

    @Post("change-password/:id")
    @Auth([RoleType.CUSTOMER, RoleType.ADMIN])
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Change password by user id",
        description: "Change password by user id",
    })
    changePasswordByUserID(
        @Body() body: ChangePasswordDto,
        @Param("id") userId: string
    ) {
        return this.authService.changePassword(userId, body);
    }

    @Post("forgot")
    async forgotPassword(@Body() body: ResetPasswordEmailDto) {
        return this.authService.createResetPasswordToken(
            body.email.toLocaleLowerCase()
        );
    }

    @Get("verify-password-token/:token")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Verify Reset password unique token",
        description:
            "This process will verify the token after password is changed",
    })
    async verifyToken(@Param("token") token: string) {
        return this.authService.verifyPasswordToken(token);
    }

    @Post("reset-password/:token")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Reset password (token required)",
        description:
            "Reset password (token required), because token can expire in that moment",
    })
    resetPassword(
        @Param("token") token: string,
        @Body() resetPasswordDto: ResetPasswordDto
    ) {
        return this.authService.resetPassword(token, resetPasswordDto);
    }

    @Post("email_exists")
    @HttpCode(HttpStatus.OK)
    emailExists(@Body() body: EmailExistsDto) {
        return this.authService.emailExists(body);
    }
}
