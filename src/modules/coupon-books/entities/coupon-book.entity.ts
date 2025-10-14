import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { IAbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { UserEntity } from '../../user/user.entity';
import { CouponCodeEntity } from './coupon-code.entity';
import { CouponBookStatus } from '../../../constants/coupon-status';
import { RoleType } from '../../../constants/role-type';

export interface ICouponBookEntity extends IAbstractEntity<any> {
  name: string;
  description?: string;
  businessId: string;
  maxCodesPerUser?: number;
  allowMultipleRedemptions: boolean;
  status: CouponBookStatus;
  expiresAt?: Date;
  totalCodes?: number;
  business: UserEntity;
  couponCodes: CouponCodeEntity[];
}

@Entity({ name: 'coupon_books' })
export class CouponBookEntity
    extends AbstractEntity<any>
    implements ICouponBookEntity {
    
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', name: 'business_id' })
    businessId: string;

    @Column({ type: 'int', nullable: true, name: 'max_codes_per_user' })
    maxCodesPerUser?: number;

    @Column({ type: 'boolean', default: false, name: 'allow_multiple_redemptions' })
    allowMultipleRedemptions: boolean;

    @Column({ 
        type: 'enum', 
        enum: CouponBookStatus, 
        default: CouponBookStatus.DRAFT 
    })
    status: CouponBookStatus;

    @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
    expiresAt?: Date;

    @Column({ type: 'int', default: 0, name: 'total_codes' })
    totalCodes: number;

    // Relaciones
    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: UserEntity;

    @OneToMany(() => CouponCodeEntity, couponCode => couponCode.couponBook, {
        cascade: true,
        eager: false
    })
    couponCodes: CouponCodeEntity[];
}
