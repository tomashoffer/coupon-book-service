import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/abstract.entity';
import type { IAbstractEntity } from '../../../common/abstract.entity';
import { UseDto } from '../../../decorators/use-dto.decorator';
import { CouponCodeEntity } from './coupon-code.entity';
import { UserEntity } from '../../user/user.entity';

export interface ICouponAssignmentEntity extends IAbstractEntity<any> {
  couponCodeId: string;
  userId: string;
  assignedAt: Date;
  expiresAt?: Date;
  couponCode: CouponCodeEntity;
  user: UserEntity;
}

@Entity({ name: 'coupon_assignments' })
@Index(['userId', 'couponCodeId'], { unique: true })
@Index(['userId'])
@Index(['couponCodeId'])
export class CouponAssignmentEntity
    extends AbstractEntity<any>
    implements ICouponAssignmentEntity {
    
    @Column({ type: 'uuid', name: 'coupon_code_id' })
    couponCodeId: string;

    @Column({ type: 'uuid', name: 'user_id' })
    userId: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'assigned_at' })
    assignedAt: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
    expiresAt?: Date;

    // Relaciones
    @ManyToOne(() => CouponCodeEntity, couponCode => couponCode.assignments, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'coupon_code_id' })
    couponCode: CouponCodeEntity;

    @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
}
