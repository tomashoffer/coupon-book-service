import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RoleType } from '../../../constants/role-type';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name: string;

  @IsEnum(RoleType)
  role: RoleType;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  temporaryPassword?: string;

  @IsString()
  @IsOptional()
  phone?: string;
} 