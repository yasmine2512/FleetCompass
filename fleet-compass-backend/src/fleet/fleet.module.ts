import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { locationIngestion } from './location.processor';
import { BullModule } from '@nestjs/bullmq';
import { FleetController } from './fleet.controller';
import { FleetEventsService } from './fleet-events.service';
import { RouteProcessor } from './route.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      {name: 'locationIngestion'},
      { name: 'routeIngestion' }),

  ],
  providers: [FleetGateway, FleetService,locationIngestion,FleetEventsService,RouteProcessor],
  controllers: [FleetController],
})
export class FleetModule {}
