import { Processor, WorkerHost ,InjectQueue} from '@nestjs/bullmq';
import { Job ,Queue} from 'bullmq';
import {Injectable,Inject } from '@nestjs/common';
import { FleetEventsService } from './fleet-events.service';
import Redis from 'ioredis';
import { DatabaseService } from 'src/database/database.service';
@Processor('locationIngestion',{concurrency: 50})
@Injectable()
export class locationIngestion extends WorkerHost{


  constructor(
    private readonly fleetEventsService: FleetEventsService,
    private readonly databaseService:DatabaseService,
    @InjectQueue('locationIngestion') 
    private readonly locationQueue: Queue,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis, 
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name !== 'simulateTrip') return;

    const {tripId,driverId,route,orderName, userId, pointIndex = 0, previousPoint = null, previousTimestamp = Date.now()} = job.data;
    if (!route || pointIndex >= route.length) return;
    console.log(`Processing tripId: ${tripId}, pointIndex: ${pointIndex}`);
    const point = route[pointIndex];
    const longitude = point[0];
    const latitude = point[1];
    let speed = 0;
    const isCancelled = await this.redisClient.get(`trip_cancel:${tripId}`);
    
    if (isCancelled) {
        console.log(`Job for trip ${tripId} aborted.`);
          await this.databaseService.pool.query(
    `UPDATE trips SET status = 'Cancelled' WHERE id = $1`, [tripId]
  );
  await this.databaseService.pool.query(
    `UPDATE drivers SET status = 'Idle' WHERE id = $1`, [driverId]
  );
  await this.databaseService.pool.query(
        `INSERT INTO driver_locations
        (driver_id, position, updated_at)
        VALUES ($1,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          NOW())
        ON CONFLICT (driver_id)
        DO UPDATE SET
          position = EXCLUDED.position,
          updated_at = NOW()
        `,
        [driverId,longitude, latitude],
       );

       this.fleetEventsService.emitToRoom(`user:${userId}`, 'tripCancelled', {
        tripId,
        driverId,
        orderName,
        message: 'The trip has been cancelled by the operator.'
        });
        return; 
    }
    try {
      if (pointIndex === 0) {
        console.log(`[Lifecycle] Activating Trip ${tripId} state to Ongoing...`);
        await this.databaseService.pool.query(
          `UPDATE trips SET status = 'Ongoing' WHERE id = $1`,
          [tripId]
        );
        this.fleetEventsService.emitToRoom(`user:${userId}`, 'tripStarted', {
          tripId,
          driverId,
          orderName:orderName,
        });
      }

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
      }

      this.fleetEventsService.emitToRoom(`user:${userId}`,'locationUpdate', {
        tripId,
        driverId,
        latitude,
        longitude,
        speed,
      });

if (pointIndex < route.length - 1) {
        await this.locationQueue.add('simulateTrip', {
          tripId,
          driverId,
          route,
          orderName,
          userId,
          pointIndex: pointIndex + 1,
          previousPoint: point,
          previousTimestamp: Date.now()
        }, {
          delay: 1000, 
          removeOnComplete: true,
          removeOnFail: true,
        });

      } else {
        console.log(`Trip ${tripId} has reached its final destination!`);
        const endedAt = new Date();
        
        await this.databaseService.pool.query(
          `UPDATE trips SET status = 'Completed', ended_at = $2, duration_seconds = EXTRACT(EPOCH FROM ($2 - started_at)) WHERE id = $1`,
          [tripId, endedAt]
        );
         await this.databaseService.pool.query(
        `INSERT INTO driver_locations
        (driver_id, position, updated_at)
        VALUES ($1,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          NOW())
        ON CONFLICT (driver_id)
        DO UPDATE SET
          position = EXCLUDED.position,
          updated_at = NOW()
        `,
        [driverId,longitude, latitude],
       );
    
        await this.databaseService.pool.query(`UPDATE drivers SET status='Idle' WHERE id=$1`, [driverId]);

        this.fleetEventsService.emitToRoom(`user:${userId}`,'tripCompleted', {
          tripId,
          driverId,
          status: 'Completed',
          speed: 0
        });
      }

 } catch (error) {
      try {
     await this.databaseService.pool.query(
        `INSERT INTO driver_locations
        (driver_id, position, updated_at)
        VALUES ($1,
          ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
          NOW())
        ON CONFLICT (driver_id)
        DO UPDATE SET
          position = EXCLUDED.position,
          updated_at = NOW()
        `,
        [driverId,longitude, latitude],
       );
    await this.databaseService.pool.query(`UPDATE trips SET status = 'Failed' WHERE id = $1`, [tripId]);
    await this.databaseService.pool.query(`UPDATE drivers SET status = 'Idle' WHERE id = $1`, [driverId]);
    
  } catch (dbError) {
    console.error('Failed to save fallback location during processor exception:', dbError);
  }
   this.fleetEventsService.emitToRoom(`user:${userId}`,'error', {
          message:'SIMULATION TICK ERROR',
          tripId,
          driverId,
        });
      
      console.error('SIMULATION TICK ERROR:', error);
    }
  }

}
