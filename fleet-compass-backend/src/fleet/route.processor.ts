import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FleetService } from './fleet.service';
import { InjectQueue } from '@nestjs/bullmq';
import { FleetEventsService } from './fleet-events.service';
import { Queue } from 'bullmq';
import pg from 'pg';


@Processor('routeIngestion', {
  limiter: {
    max: 1,
    duration: 1500,
  },
})
export class RouteProcessor extends WorkerHost {
  private dbClient: pg.Client;

  constructor(
    private readonly fleetService: FleetService,
    private readonly fleetEventsService: FleetEventsService,
    @InjectQueue('locationIngestion') private readonly locationQueue: Queue,
  ) {
    super();
    this.dbClient = new pg.Client({ connectionString: process.env.DATABASE_URL });
    this.dbClient.connect();
  }

  async process(job: Job<any>): Promise<any> {
    const { tripId, driverId, orderName, coordinates } = job.data;

    try {
      const route = await this.fleetService.getRoute(coordinates);

      await this.dbClient.query(
        `UPDATE trips SET status = 'active' WHERE id = $1`,
        [tripId]
      );

      await this.locationQueue.add('simulateTrip', {
        tripId,
        driverId,
        route,
      }, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      console.log(`Successfully throttled and activated route for trip: ${tripId}`);

      this.fleetEventsService.emitToRoom(`trip:${tripId}`, 'tripStarted', {
        tripId,
        driverId,
        orderName,
        status: 'active',
      });

    } catch (err) {
      console.error(`Failed to process throttled route for trip ${tripId}:`, err);
      await this.dbClient.query(`UPDATE trips SET status = 'failed' WHERE id = $1`, [tripId]);
      this.fleetEventsService.emitToRoom(`trip:${tripId}`, 'error', {
        message: 'Failed to start trip due to routing error',
      });
    }
  }
}