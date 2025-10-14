import { ConflictException } from '@nestjs/common';

export class CouponLockedException extends ConflictException {
  constructor(couponCode?: string) {
    const message = couponCode 
      ? `El cupón '${couponCode}' está bloqueado temporalmente`
      : 'Este cupón está bloqueado temporalmente';
    super(message);
  }
}
