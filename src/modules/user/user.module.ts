import { TypeOrmExModule } from './../../database/typeorm-ex.module';
import { AuthModule } from '../auth/auth.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
// Repositorios eliminados - proyecto anterior

@Module({
    imports: [
        forwardRef(() => AuthModule), TypeOrmExModule.forCustomRepository([UserRepository])],
    controllers: [UserController],
    exports: [UserService],
    providers: [UserService],
})
export class UserModule { }
