import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import { RoleType } from '../../../constants/role-type';
import type { UserEntity } from '../user.entity';
import { AuthProviders } from '../../../constants/auth.enums';

export type UserDtoOptions = Partial<{ isActive: boolean }>;

export class UserDto extends AbstractDto {

    @IsString()
    @ApiProperty()
    first_name: string;

    @IsString()
    @ApiProperty()
    last_name: string;

    @IsEnum(RoleType)
    @ApiProperty({ enum: RoleType })
    role: RoleType;

    @IsEmail()
    @ApiProperty()
    email: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    phone?: string;

    @ApiProperty({ type: [String], default: [] })
    // cars_id eliminado - proyecto anterior

    @Exclude()
    password?: string;

    @ApiProperty()
    passwordChangedAt: Date;

    @ApiProperty()
    authProvider: AuthProviders;

    constructor(user: UserEntity, options?: UserDtoOptions) {
        super(user);
        this.first_name = user.first_name || '';
        this.last_name = user.last_name || '';
        this.role = user.role;
        this.email = user.email;
        this.phone = user.phone;
        this.password = user.password;
        this.authProvider = user.authProvider;
    }
}

export class DeleteUserDto {
    @ApiProperty()
    @IsEmail()
    email: string;
}
