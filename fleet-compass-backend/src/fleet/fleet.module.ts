import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { locationIngestion } from './location.processor';
import { BullModule } from '@nestjs/bullmq';
import { FleetController } from './fleet.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'locationIngestion',
    }),
  ],
  providers: [FleetGateway, FleetService,locationIngestion],
  controllers: [FleetController],
})
export class FleetModule {}
