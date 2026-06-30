import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FleetService } from './fleet.service';
import { InjectQueue } from '@nestjs/bullmq';
import { FleetEventsService } from './fleet-events.service';
import { Queue } from 'bullmq';
import { DatabaseService } from 'src/database/database.service';


@Processor('routeIngestion', {
  limiter: {
    max: 1,
    duration: 1500,
  },
})
export class RouteProcessor extends WorkerHost {


  constructor(
    private readonly fleetService: FleetService,
    private readonly fleetEventsService: FleetEventsService,
    @InjectQueue('locationIngestion') private readonly locationQueue: Queue,
    private readonly databaseService:DatabaseService
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { tripId, driverId, orderName, coordinates } = job.data;

    try {
      const route = await this.fleetService.getRoute(coordinates);

      await this.databaseService.pool.query(
        `UPDATE trips SET status = 'Ongoing' WHERE id = $1`,
        [tripId]
      );

      const lineString = route
      .map((p: number[]) => `${p[0]} ${p[1]}`)
      .join(',');

      await this.databaseService.pool.query(
      `
      INSERT INTO trip_routes (trip_id, route)
      VALUES ($1,ST_GeomFromText($2, 4326))
      ON CONFLICT (trip_id)
      DO NOTHING
      `,
      [tripId, `LINESTRING(${lineString})`]
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
        status: 'Ongoing',
      });

    } catch (err) {
      console.error(`Failed to process throttled route for trip ${tripId}:`, err);
      await this.databaseService.pool.query(`UPDATE trips SET status = 'failed' WHERE id = $1`, [tripId]);
      this.fleetEventsService.emitToRoom(`trip:${tripId}`, 'error', {
        message: 'Failed to start trip due to routing error',
      });
    }
  }
}