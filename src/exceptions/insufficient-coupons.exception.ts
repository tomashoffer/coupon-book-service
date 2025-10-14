import { BadRequestException } from '@nestjs/common';

export class InsufficientCouponsException extends BadRequestException {
  constructor(available?: number, requested?: number) {
    const message = available !== undefined && requested !== undefined
      ? `Solo hay ${available} cupones disponibles, se solicitaron ${requested}`
      : 'No hay suficientes cupones disponibles';
    super(message);
  }
}
