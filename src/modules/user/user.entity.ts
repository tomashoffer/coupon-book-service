import { Entity, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { AbstractEntity } from '../../common/abstract.entity';
import type { IAbstractEntity } from '../../common/abstract.entity';
import { UseDto } from '../../decorators/use-dto.decorator';
import { UserDto } from './dto/user.dto';
import { RoleType } from '../../constants/role-type';
import { AuthProviders } from '../../constants/auth.enums';

export interface IUserEntity extends IAbstractEntity<UserDto> {
  first_name?: string;

  last_name?: string;

  role: RoleType;

  email?: string;

  password?: string;

  phone?: string;

  username?: string;

  verificationToken?: string;

}

@Entity({ name: 'users' })
@UseDto(UserDto)
export class UserEntity
    extends AbstractEntity<UserDto>
    implements IUserEntity {
    @Column({ nullable: true })
    first_name?: string;

    @Column({ nullable: true })
    last_name?: string;

    @Column({ type: 'enum', enum: RoleType, default: RoleType.CUSTOMER })
    role: RoleType;

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    password?: string;

    @Column({ nullable: true })
    temporaryPassword?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    verification_token?: string;

    @Column({ nullable: true })
    reset_password_token: string;

    @Column({ nullable: true, type: 'timestamp' })
    reset_password_expires_at: Date;

    @Column({ nullable: true })
    passwordChangedAt: Date;

    // Relaciones eliminadas - proyecto anterior

    @Column({
        type: 'enum',
        enum: AuthProviders,
        default: AuthProviders.LOCAL,
        nullable: true
    })
    authProvider: AuthProviders;
}
