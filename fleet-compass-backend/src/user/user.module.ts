import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthGuard} from './auth.guard';
import { DatabaseModule } from 'src/database/database.module';
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService,AuthGuard],
  exports:[AuthGuard]
})
export class UserModule {}
