import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {Injectable, OnModuleDestroy,OnModuleInit } from '@nestjs/common';
import pg from 'pg';
import { FleetEventsService } from './fleet-events.service';
@Processor('locationIngestion')
@Injectable()
export class locationIngestion extends WorkerHost implements OnModuleInit, OnModuleDestroy {

  private dbClient!: pg.Client;

  constructor(
    private readonly fleetEventsService: FleetEventsService,
  ) {
    super();
  }

  async onModuleInit() {
    this.dbClient = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    await this.dbClient.connect();
    console.log('NestJS Worker connected successfully to Supabase PostgreSQL');
  }

  async onModuleDestroy() {
    await this.dbClient.end();
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
    try {
    for (const point of route) {
      try{
        console.log('Processing point:', point);
      const longitude = point[0];
      const latitude = point[1];
      let speed = 0;

      if (previousPoint) {
        const now = Date.now();

        const distance = this.calculateDistance(previousPoint[1],previousPoint[0],latitude,longitude,);

        const timeElapsed = (now - previousTimestamp) / 1000;

        speed = (distance / timeElapsed) * 3.6;

        previousTimestamp = now;
      }

      await this.dbClient.query(
        `INSERT INTO driver_locations(trip_id, driver_id, position, speed)
        VALUES ($1,$2,ST_SetSRID(ST_MakePoint($3,$4),4326)::geography,
          $5)`,
        [tripId, driverId, longitude, latitude, speed],
      );

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

      await this.dbClient.query(
      `UPDATE trips
      SET status='completed'
      WHERE id=$1`,
      [tripId]);

      await this.dbClient.query(
        `UPDATE drivers SET status='available' WHERE id=$1`,
        [driverId]
      );

    this.fleetEventsService.emit('tripCompleted', {
      tripId,
      driverId,
      status: 'completed'
    });
 } catch (error) {
      console.error('PROCESSOR ERROR:', error);
    }
  }

  private calculateDistance(lat1: number,lon1: number,lat2: number,lon2: number,): number {
    const R = 6371000; // Earth radius in meters

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  }
}
