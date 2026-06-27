import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FleetModule } from './fleet/fleet.module';
import { BullModule } from '@nestjs/bullmq';
import { UserModule } from './user/user.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
