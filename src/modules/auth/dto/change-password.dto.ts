import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

/**
 * Change password Dto for class validation usage
 */
export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    newPassword: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    currentPassword?: string;
}
