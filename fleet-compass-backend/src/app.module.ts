import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FleetModule } from './fleet/fleet.module';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { redisConfig } from './config/redis.config';
import * as dotenv from 'dotenv'
dotenv.config();
@Module({
  imports: [
    RedisModule,
    FleetModule,
    BullModule.forRoot({
      connection:redisConfig,
    }),
    UserModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{     
      ttl: 1000,         
      limit: 3,
    }])],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
