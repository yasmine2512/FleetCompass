import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetGateway } from './fleet.gateway';
import { locationIngestion } from './location.processor';
import { BullModule } from '@nestjs/bullmq';
import { FleetController } from './fleet.controller';
import { FleetEventsService } from './fleet-events.service';
import { RouteProcessor } from './route.processor';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from 'src/user/user.module';
@Module({
  imports: [
    BullModule.registerQueue(
      {name: 'locationIngestion'},
      { name: 'routeIngestion' }),
      DatabaseModule,UserModule
  ],
  providers: [FleetGateway, FleetService,locationIngestion,FleetEventsService,RouteProcessor],
  controllers: [FleetController],
})
export class FleetModule {}
