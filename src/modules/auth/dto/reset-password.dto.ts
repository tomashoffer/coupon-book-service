import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, isNotEmpty, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordEmailDto {
    @ApiProperty()
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
	@IsString()
	@IsNotEmpty()
	newPassword: string;

	@ApiProperty()
	@IsNotEmpty()
	repeatPassword: string;
}