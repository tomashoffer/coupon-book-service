import { ConflictException } from '@nestjs/common';

export class CouponAlreadyRedeemedException extends ConflictException {
  constructor(couponCode?: string) {
    const message = couponCode 
      ? `El cupón '${couponCode}' ya fue redimido`
      : 'Este cupón ya fue redimido';
    super(message);
  }
}
