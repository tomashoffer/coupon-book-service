import { TokenType } from '../../../constants/token-type';
import { IsString, IsNotEmpty } from 'class-validator';

export class AuthResponseDto {
  tokenType: TokenType;
  @IsString()
  @IsNotEmpty()
  accessToken: string;
} 