import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { JwtStrategy } from './strategies/jwt.stategy';
import { GoogleAuthController } from './google-auth/google-auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UserModule,
    // The PassportModule only needs to be registered once.
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ApiConfigService) => {
        //Get the base64 encoded keys from the environment configuration.
        //JWT_PRIVATE_KEY_BASE64 and JWT_PUBLIC_KEY_BASE64
        const privateKeyBase64 = configService.authConfig.privateKey;
        const publicKeyBase64 = configService.authConfig.publicKey;

        if (!privateKeyBase64) {
          throw new Error('JWT_PRIVATE_KEY_BASE64 no está definido en las variables de entorno.');
        }
        if (!publicKeyBase64) {
          throw new Error('JWT_PUBLIC_KEY_BASE64 no está definido en las variables de entorno.');
        }

        //Decode the base64 strings back into proper UTF-8 PEM keys.
        const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');
        const publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');

        return {
          //Use the decoded keys for signing and verification.
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256',
            // It's a good practice to set an expiration time.
            // expiresIn: configService.getNumber('JWT_EXPIRATION_TIME'),
          },
          verifyOptions: {
            algorithms: ['RS256'],
          },
        };
      },
      inject: [ApiConfigService],
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}