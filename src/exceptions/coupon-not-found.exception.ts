import { NotFoundException } from '@nestjs/common';

export class CouponNotFoundException extends NotFoundException {
  constructor(couponCode?: string) {
    const message = couponCode 
      ? `Cupón con código '${couponCode}' no encontrado`
      : 'Cupón no encontrado';
    super(message);
  }
}
