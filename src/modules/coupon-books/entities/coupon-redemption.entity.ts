import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { IAbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { CouponCodeEntity } from './coupon-code.entity';
import { UserEntity } from '../../user/user.entity';

export interface ICouponRedemptionEntity extends IAbstractEntity<any> {
  couponCodeId: string;
  userId: string;
  redeemedAt: Date;
  metadata?: Record<string, any>;
  couponCode: CouponCodeEntity;
  user: UserEntity;
}

@Entity({ name: 'coupon_redemptions' })
@Index(['couponCodeId', 'userId'])
@Index(['userId'])
@Index(['redeemedAt'])
export class CouponRedemptionEntity
    extends AbstractEntity<any>
    implements ICouponRedemptionEntity {
    
    @Column({ type: 'uuid', name: 'coupon_code_id' })
    couponCodeId: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'redeemed_at' })
    redeemedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    // Relaciones
    @ManyToOne(() => CouponCodeEntity, couponCode => couponCode.redemptions, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'coupon_code_id' })
    couponCode: CouponCodeEntity;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
}
