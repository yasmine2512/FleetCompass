import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {Injectable, OnModuleDestroy,OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { FleetEventsService } from './fleet-events.service';
import { DatabaseService } from 'src/database/database.service';
@Processor('locationIngestion')
@Injectable()
export class locationIngestion extends WorkerHost{


  constructor(
    private readonly fleetEventsService: FleetEventsService,
    private readonly databaseService:DatabaseService
  ) {
    super();
  }


  async process(job: Job<any>): Promise<any> {
    console.log('PROCESSOR CALLED');
    if (job.name !== 'simulateTrip') return;

    const {tripId,driverId,route} = job.data;
    console.log('tripId:', tripId);
    console.log('driverId:', driverId);
    console.log('route length:', route?.length);

    let previousPoint: number[] | null = null;
    let previousTimestamp = Date.now();
    let pointIndex = 0;
    try {
    for (const point of route) {
      try{
        console.log('Processing point:', point);
      const longitude = point[0];
      const latitude = point[1];
      let speed = 0;

      if (previousPoint) {
        const now = Date.now();

        const timeElapsed = (now - previousTimestamp) / 1000;
        const distanceResult = await this.databaseService.pool.query(
            `SELECT ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ) as distance`,
            [previousPoint[0], previousPoint[1], longitude, latitude]
          );

        const distance = parseFloat(distanceResult.rows[0].distance);
        speed = (distance / timeElapsed) * 3.6;
        previousTimestamp = now;
      }
       if (pointIndex % 5 === 0 || pointIndex === route.length - 1) {
      await this.databaseService.pool.query(
        `INSERT INTO driver_locations
        (driver_id, trip_id, position, speed, updated_at)
        VALUES ($1,$2,
          ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,$5,
          NOW())
        ON CONFLICT (driver_id)
        DO UPDATE SET
          trip_id = EXCLUDED.trip_id,
          position = EXCLUDED.position,
          speed = EXCLUDED.speed,
          updated_at = NOW()
        `,
        [driverId, tripId, longitude, latitude, speed],
      );
    }
      this.fleetEventsService.emit('locationUpdate', {
        tripId,
        driverId,
        latitude,
        longitude,
        speed,
      });

      previousPoint = point;
      } catch (innerError) {
    console.error('Failed to log intermediate route point, skipping to next tick:', innerError);
  }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

      console.log('Trip finished');

      const endedAt = new Date();
      await this.databaseService.pool.query(
        `
        UPDATE trips
        SET
          status = 'Completed',
          ended_at = $2,
          duration_seconds = EXTRACT(EPOCH FROM ($2 - started_at))
        WHERE id = $1
        `,
        [tripId, endedAt]
      );
      await this.databaseService.pool.query(
        `UPDATE drivers SET status='Idle' WHERE id=$1`,
        [driverId]
      );
      
      await this.databaseService.pool.query(
        `
        UPDATE driver_locations
        SET
          trip_id = NULL,
          speed = 0
        WHERE driver_id = $1
        `,
        [driverId]
      );
      

    this.fleetEventsService.emit('tripCompleted', {
      tripId,
      driverId,
      status: 'Completed',
      speed: 0
    });
 } catch (error) {
      console.error('PROCESSOR ERROR:', error);
    }
  }

}
