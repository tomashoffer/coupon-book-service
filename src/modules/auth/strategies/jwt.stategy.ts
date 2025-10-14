import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ApiConfigService } from '../../../shared/services/api-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private config: ApiConfigService) {
    // Get the base64 encoded public key from the config service.
    const publicKeyBase64 = config.authConfig.publicKey;

    if (!publicKeyBase64) {
      throw new Error('JWT_PUBLIC_KEY_BASE64 no esta definida en las variables de entorno.');
    }

    // Decode the base64 encoded public key back into a proper PEM string format
    // before passing it to the Passport strategy. This ensures that the key used for
    // verification matches the format used for signing.
    const publicKey = Buffer.from(publicKeyBase64, 'base64').toString('utf-8');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          // Extraer token de cookies
          return request?.cookies?.accessToken || null;
        },
      ]),
      ignoreExpiration: false,
      // Use the decoded public key for verification.
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    // This part of the logic remains the same.
    // It returns the data that will be attached to the request object.
    return { id: payload.userId, role: payload.role };
  }
}
