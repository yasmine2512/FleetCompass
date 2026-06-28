import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Socket } from 'socket.io';
import axios from 'axios';
import pg from 'pg';

import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { UpdateTripStatusDto } from './dto/update-fleet-status.dto';
import { locationIngestion } from './location.processor';
import { DatabaseService } from 'src/database/database.service';
@Injectable()
export class FleetService {

  constructor(
    private readonly databaseService:DatabaseService ,
    @InjectQueue('locationIngestion')
    private readonly locationQueue: Queue,
    @InjectQueue('routeIngestion')
    private readonly routeQueue: Queue,    
  ) {
  }

  async getRoute(coordinates: number[][]) {
    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.features[0].geometry.coordinates;
  }

  async startTrip(data: CreateFleetDto, client: Socket,id: string) {
    try {
      const coordinates = [
        [data.startLongitude, data.startLatitude],
        [data.destLongitude, data.destLatitude],
      ];

      const startedAt = data.started_at || new Date()
      const tripResult = await this.databaseService.pool.query(
        `INSERT INTO trips
        (driver_id,order_name,start_position, destination_position,status,started_at,user_id)
        VALUES ($1,$2,ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,$7,$8,$9)
        RETURNING id`,
        [data.driverId,data.orderName,data.startLongitude,
          data.startLatitude,data.destLongitude,data.destLatitude,
          'pending_route',startedAt,id,
        ],
      );
      const tripId = tripResult.rows[0].id;
      client.join(`trip:${tripId}`);

      await this.databaseService.pool.query(
      `UPDATE drivers SET status = 'unavailable' 
      WHERE id = $1 AND user_id = $2`,
      [data.driverId]
    );

      await this.routeQueue.add('generateRoute', {
        tripId,
        driverId: data.driverId,
        orderName: data.orderName,
        clientId: client.id,
        coordinates: [
          [data.startLongitude, data.startLatitude],
          [data.destLongitude, data.destLatitude],
        ]
      }, {
        removeOnComplete: true,
        removeOnFail: true,
      });

      client.emit('tripRequested', { tripId, status: 'pending_route' });
      console.log("trip Requested");
    } catch (error) {
      console.error(error);

      client.emit('error', {
        message: 'Failed to start trip',
      });
    }
  }

  async findAll(id: string) {
    const result = await this.databaseService.pool.query(`
      SELECT *
      FROM trips
      WHERE user_id = $1
      ORDER BY started_at DESC
    `,[id]);

    return result.rows;
  }

  async findOne(id: number,user_id: string) {

    const tripResult = await this.databaseService.pool.query(
    `SELECT 
      id,
      driver_id,
      order_name,
      status,
      started_at,
      ST_X(start_position::geometry) as start_longitude,
      ST_Y(start_position::geometry) as start_latitude,
      ST_X(destination_position::geometry) as destination_longitude,
      ST_Y(destination_position::geometry) as destination_latitude
    FROM trips
    WHERE id = $1 AND user_id = $2`,
    [id,user_id]
  );

  const locationsResult = await this.databaseService.pool.query(
    `SELECT 
      ST_Y(position::geometry) as latitude,
      ST_X(position::geometry) as longitude,
      speed,
      created_at
    FROM driver_locations
    WHERE trip_id = $1 AND user_id = $2
    ORDER BY created_at ASC`,
    [id,user_id]
  );

  return {
    trip: tripResult.rows[0] || null,
    route: locationsResult.rows
  };
  }

  async update(id: number,status: UpdateTripStatusDto) {
    await this.databaseService.pool.query(
      `
      UPDATE trips
      SET status = $1
      WHERE id = $2
      `,
      [status, id],
    );

    return {
      message: 'Trip updated successfully',
    };
  }

  async remove(id: number) {
    await this.databaseService.pool.query(
      `
      DELETE FROM trips
      WHERE id = $1
      `,
      [id],
    );
    return {
      message: 'Trip deleted successfully',
    };
  }

  async findAllDrivers(user_id : string){
   const result = await this.databaseService.pool.query(
      `SELECT * FROM drivers 
      WHERE user_id = $1`,
      [user_id]
    )
    return result.rows;
  }


  async findOneDriver(id: number,user_id :string){
   const result = await this.databaseService.pool.query(
      `SELECT 
        ST_X(dl.position::geometry) as longitude,
        ST_Y(dl.position::geometry) as latitude,
        dl.speed,
        dl.created_at
     FROM driver_locations dl
     INNER JOIN trips t ON dl.trip_id = t.id
     WHERE dl.driver_id = $1 
       AND t.status = 'active' AND t.user_id = $2
     ORDER BY dl.created_at DESC
     LIMIT 1`,
    [id,user_id]
    )
    return result.rows;
  }

  async findActiveFleet(user_id :string) {
  const result = await this.databaseService.pool.query(`
    SELECT DISTINCT ON (dl.driver_id)
      dl.driver_id,
      dl.trip_id,
      t.order_name,
      ST_X(dl.position::geometry) as longitude,
      ST_Y(dl.position::geometry) as latitude,
      dl.speed,
      dl.created_at
    FROM driver_locations dl
    JOIN trips t ON dl.trip_id = t.id
    WHERE t.status = 'active' AND t.user_id = $1
    ORDER BY dl.driver_id, dl.created_at DESC
  `,[user_id]);
  return result.rows;
}
}