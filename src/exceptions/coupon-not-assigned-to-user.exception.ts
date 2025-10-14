import { ForbiddenException } from '@nestjs/common';

export class CouponNotAssignedToUserException extends ForbiddenException {
  constructor(couponCode?: string, userId?: string) {
    const message = couponCode && userId
      ? `El cupón '${couponCode}' no está asignado al usuario '${userId}'`
      : 'Este cupón no está asignado al usuario';
    super(message);
  }
}
