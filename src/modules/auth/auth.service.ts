import { EmailExistsDto } from './dto/EmailExistsDto';
import {
    HttpException,
    HttpStatus,
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateHash, validateHash } from '../../common/utils';
import { RoleType } from '../../constants/role-type';
import { TokenType } from '../../constants/token-type';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TokenPayloadDto } from './dto/TokenPayloadDto';
import type { UserLoginDto } from './dto/UserLogin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthProviders } from '../../constants/auth.enums';

const MONTH_IN_DAYS = 30;
@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private readonly apiConfigService: ApiConfigService,
    ) {}

    async createAccessToken(userParams: {
        role: RoleType;
        userId: string;
    }): Promise<TokenPayloadDto> {

        return new TokenPayloadDto({
            expiresIn: this.apiConfigService.authConfig.jwtExpirationTime,
            accessToken: await this.jwtService.signAsync({
                userId: userParams.userId,
                type: TokenType.ACCESS_TOKEN,
                role: userParams.role,
            }),
            refreshToken: await this.jwtService.signAsync(
                { ...userParams, ...{ type: TokenType.REFRESH_TOKEN } },
                { expiresIn: this.apiConfigService.authConfig.refreshTokenExpirationTime })
        });
    }

    async validateUser(userLoginDto: UserLoginDto, host: string): Promise<{ user: UserEntity, isPasswordExpired: boolean }> {
        const user = await this.userService.findOne({
            email: userLoginDto.email.toLocaleLowerCase(),
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await validateHash(userLoginDto.password, user.password);

        if (!isPasswordValid) {
            throw new ForbiddenException('Invalid credentials');
        }

        const differenceInDays = moment().diff(moment(user?.passwordChangedAt), 'days');

        return {
            user: user!,
            isPasswordExpired: differenceInDays > MONTH_IN_DAYS * 3
        };
    }

    /**
     * Change password for user
     * @param userId
     * @param changePasswordDto
     * @returns
     */
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.userService.getById(userId);

        if (changePasswordDto.currentPassword) { // support change password from admin panel manage users also
            const isPasswordValid = await validateHash(
                changePasswordDto.currentPassword,
                user?.password,
            );

            if (!isPasswordValid && user) {
                throw new UserNotFoundException();
            }
        }
        try {
            await this.userService.update(userId, { 
                password: generateHash(changePasswordDto.newPassword),
            });
            return { success: true };
        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }


    /**
     *
     * @param token Verify password token
     * @returns
     */
    async verifyPasswordToken(token: string): Promise<{ isValid: boolean }> {
        try {
            if (!token) throw 'Token not provided';

            const user = await this.userService.userRepository.findOne({ where: { reset_password_token: token } });

            if (!user) {
                throw 'Invalid Token';
            }

            else {
                if (moment(user.reset_password_expires_at) < moment()) {
                    throw 'Token Expired';
                } else {
                    return { isValid: true };
                }
            }

        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    /**
     *
     * @param email Create reset password token (1 time), using email as parameter
     * @returns
     */
    async createResetPasswordToken(email: string) {
        try {
            const user = await this.userService.userRepository.findOne({ where: { email } });
            if (!user) {
                throw `User doesn't exists`;
            }
            const resetPasswordToken = uuidv4();
            const resetPasswordExpiresAt = new Date((new Date()).getTime() + 24 * 60 * 60 * 1000);
            this.userService.userRepository.merge(user, { reset_password_token: resetPasswordToken, reset_password_expires_at: resetPasswordExpiresAt });
            await this.userService.userRepository.save(user);
            // TODO: Implement email sending functionality
            // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetPasswordToken}`;
            // Email sending functionality removed - mailing module deleted
            return { success: true, message: 'If this user exist, they will recive an email' };
        } catch (ex) {
            throw new HttpException({ message: ex }, HttpStatus.NOT_FOUND);
        }
    }

    /**
     *
     * @param token RESET PASSWORD
     * @param resetPasswordDto
     * @returns
     */
    async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
        try {
            await this.verifyPasswordToken(token);

            if (resetPasswordDto.newPassword !== resetPasswordDto.repeatPassword) {
                throw new HttpException('New passwords does not match', HttpStatus.UNPROCESSABLE_ENTITY);
            }

            const user: UserEntity | null = await this.userService.userRepository.findOne({ where: { reset_password_token: token } });

            if (user) {
                const updatedProperties = { reset_password_token: undefined, reset_password_expires_at: undefined, password: generateHash(resetPasswordDto.newPassword) };
                this.userService.userRepository.merge(user, updatedProperties);
                await this.userService.userRepository.save(user);
                return { success: true };
            }
        } catch (ex) {
            throw new HttpException(ex, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }



    async emailExists(emailExistsDto: EmailExistsDto) {
        const user = await this.userService.userRepository.findOne({ where: { email: emailExistsDto.email } });
        if (!user) {
            return { result: false };
        }
        return { result: true };
    }

}
