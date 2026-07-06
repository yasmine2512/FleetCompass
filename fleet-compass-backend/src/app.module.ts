import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FleetModule } from './fleet/fleet.module';
import { BullModule } from '@nestjs/bullmq';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';
import * as dotenv from 'dotenv'
dotenv.config();
@Module({
  imports: [FleetModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT!, 10) || 6379,
      },
    }),
    UserModule,
    DatabaseModule,
     ThrottlerModule.forRoot([{     
      ttl: 1000,         
      limit: 3,
    }]),
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
