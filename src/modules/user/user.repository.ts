import { CustomRepository } from '../../database/typeorm-ex.decorator';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';

@CustomRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {}
