import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { IAbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { CouponBookEntity } from './coupon-book.entity';
import { UserEntity } from '../../user/user.entity';
import { CouponAssignmentEntity } from './coupon-assignment.entity';
import { CouponRedemptionEntity } from './coupon-redemption.entity';
import { CouponStatus } from '../../../constants/coupon-status';

export interface ICouponCodeEntity extends IAbstractEntity<any> {
  code: string;
  couponBookId: string;
  status: CouponStatus;
  assignedToUserId?: string;
  assignedAt?: Date;
  lockedAt?: Date;
  redeemedAt?: Date;
  expiresAt?: Date;
  couponBook: CouponBookEntity;
  assignedToUser?: UserEntity;
  assignments: CouponAssignmentEntity[];
  redemptions: CouponRedemptionEntity[];
}

@Entity({ name: 'coupon_codes' })
@Index(['code'], { unique: true })
@Index(['couponBookId', 'status'])
export class CouponCodeEntity
    extends AbstractEntity<any>
    implements ICouponCodeEntity {
    
    @Column({ type: 'varchar', length: 255, unique: true })
    code: string;

    @Column({ type: 'uuid', name: 'coupon_book_id' })
    couponBookId: string;

    @Column({ 
        type: 'enum', 
        enum: CouponStatus, 
        default: CouponStatus.AVAILABLE 
    })
    status: CouponStatus;

    @Column({ type: 'uuid', nullable: true, name: 'assigned_to_user_id' })
    assignedToUserId?: string;

    @Column({ type: 'timestamp', nullable: true, name: 'assigned_at' })
    assignedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'locked_at' })
    lockedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'redeemed_at' })
    redeemedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
    expiresAt?: Date;

    // Relaciones
    @ManyToOne(() => CouponBookEntity, couponBook => couponBook.couponCodes, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'coupon_book_id' })
    couponBook: CouponBookEntity;

    @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'assigned_to_user_id' })
    assignedToUser?: UserEntity;

    @OneToMany(() => CouponAssignmentEntity, assignment => assignment.couponCode, {
        cascade: true
    })
    assignments: CouponAssignmentEntity[];

    @OneToMany(() => CouponRedemptionEntity, redemption => redemption.couponCode, {
        cascade: true
    })
    redemptions: CouponRedemptionEntity[];
}
