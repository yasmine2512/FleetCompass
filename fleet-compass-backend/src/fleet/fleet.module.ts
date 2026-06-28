import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { locationIngestion } from './location.processor';
import { BullModule } from '@nestjs/bullmq';
import { FleetController } from './fleet.controller';
import { FleetEventsService } from './fleet-events.service';
import { RouteProcessor } from './route.processor';
import { DatabaseModule } from 'src/database/database.module';
import { AuthService } from 'src/user/auth.service';
@Module({
  imports: [
    BullModule.registerQueue(
      {name: 'locationIngestion'},
      { name: 'routeIngestion' }),
      DatabaseModule,
  ],
  providers: [FleetGateway, FleetService,locationIngestion,FleetEventsService,RouteProcessor],
  controllers: [FleetController],
})
export class FleetModule {}
