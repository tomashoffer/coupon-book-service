import { NotFoundException } from '@nestjs/common';

export class CouponBookNotFoundException extends NotFoundException {
  constructor(couponBookId?: string) {
    const message = couponBookId 
      ? `Libro de cupones con ID '${couponBookId}' no encontrado`
      : 'Libro de cupones no encontrado';
    super(message);
  }
}
