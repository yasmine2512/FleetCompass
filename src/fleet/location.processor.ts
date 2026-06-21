import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OnModuleDestroy,OnModuleInit } from '@nestjs/common';
import pg from 'pg';

@Processor('locationIngestion')
export class locationIngestion extends WorkerHost implements OnModuleInit, OnModuleDestroy {
    private dbClient!: pg.Client;
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
    const { driverId, latitude, longitude, timestamp } = job.data;
    console.log(job.name);
    console.log(job.data);
    const query = `
      INSERT INTO driver_locations (driver_id, latitude, longitude, created_at)
      VALUES ($1, $2, $3, $4);
    `;
    
    try {
      await this.dbClient.query(query, [driverId, latitude, longitude, timestamp]);
      console.log(`NestJS Processed: Driver ${driverId} saved to database.`);
    } catch (error) {
        if(error instanceof Error){
      console.error(`Database insert failed:`, error.message);
        } else {
      console.error(`Database insert failed:`, error);
        }
      throw error; // Triggers BullMQ auto-retry strategy
    }
  }
}
