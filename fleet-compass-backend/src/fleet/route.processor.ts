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
    const {id, driverId, orderName, coordinates } = job.data;
      console.log('NEW TRIP Requested');
    let tripId: number | null = null;
    try {
      const route = await this.fleetService.getRoute(coordinates);

      const startedAt = new Date()
      const tripResult = await this.databaseService.pool.query(
        `INSERT INTO trips
        (driver_id,order_name,status,started_at,user_id)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id`,
        [driverId,orderName,'Pending',startedAt,id],
      );
      const tripId = tripResult.rows[0].id;
      console.log("trip Requested");
      this.fleetEventsService.emitToRoom(`user:${id}`,'tripRequested', { tripId, status: 'Pending' });

    //   await this.databaseService.pool.query(
    //   `UPDATE drivers SET status = 'En Route' 
    //   WHERE id = $1 AND user_id = $2`,
    //   [driverId,id]
    // );

    //   await this.databaseService.pool.query(
    //     `UPDATE trips SET status = 'Ongoing' WHERE id = $1`,
    //     [tripId]
    //   );

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
        userId:id
      }, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      console.log(`Successfully throttled and activated route for trip: ${tripId}`);

    } catch (err : any) {
      console.error("Error starting trip:", err.message || err);
    
      if (tripId) {
        await this.databaseService.pool.query(
          `UPDATE trips SET status = 'Failed' WHERE id = $1`, 
          [tripId]
        );
      }
      const isRouteError = err.message === 'INVALID_ROUTING_POINTS';
      const userMessage = isRouteError 
        ? 'Could not calculate a driving route. Please ensure locations are on land and accessible by vehicles.'
        : 'Failed to start trip due to routing infrastructure error';

      this.fleetEventsService.emitToRoom(`user:${id}`, 'error', {
        message: userMessage,
        code: isRouteError ? 'INVALID_ROUTING_POINTS' : 'ROUTING_ERROR',
        tripId,
        driverId,
      });

      throw err;
    }}
  }
