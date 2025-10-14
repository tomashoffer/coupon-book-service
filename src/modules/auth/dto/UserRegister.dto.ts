import { ApiProperty, OmitType } from "@nestjs/swagger";
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from "class-validator";


import { Trim } from "../../../decorators/transform.decorators";
import { AuthProviders } from "../../../constants/auth.enums";

export class UserRegisterDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Trim()
    readonly id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Trim()
    readonly first_name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @Trim()
    readonly last_name: string;

    @ApiProperty()
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @Trim()
    email: string;

    @ApiProperty({ minLength: 6 })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly temporaryPassword?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly phone?: string;

    authProvider?: AuthProviders;
    
    passwordChangedAt?: Date;
}

export class OauthDto extends OmitType(UserRegisterDto, ["phone"] as const) {}
