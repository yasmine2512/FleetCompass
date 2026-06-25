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
@Injectable()
export class FleetService {
  private dbClient: pg.Client;

  constructor(
    @InjectQueue('locationIngestion')
    private readonly locationQueue: Queue,
    @InjectQueue('routeIngestion')
    private readonly routeQueue: Queue,
  ) {
    this.dbClient = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });

    this.dbClient.connect();
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

  async startTrip(data: CreateFleetDto, client: Socket) {
    try {
      const coordinates = [
        [data.startLongitude, data.startLatitude],
        [data.destLongitude, data.destLatitude],
      ];

      const startedAt = data.started_at || new Date()
      const tripResult = await this.dbClient.query(
        `INSERT INTO trips
        (driver_id,order_name,start_position, destination_position,status,started_at)
        VALUES ($1,$2,ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,$7,$8)
        RETURNING id`,
        [data.driverId,data.orderName,data.startLongitude,
          data.startLatitude,data.destLongitude,data.destLatitude,
          'pending_route',startedAt,
        ],
      );
      const tripId = tripResult.rows[0].id;
      client.join(`trip:${tripId}`);

      await this.dbClient.query(
      `UPDATE drivers SET status = 'unavailable' WHERE id = $1`,
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

  async findAll() {
    const result = await this.dbClient.query(`
      SELECT *
      FROM trips
      ORDER BY started_at DESC
    `);

    return result.rows;
  }

  async findOne(id: number) {

    const tripResult = await this.dbClient.query(
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
    WHERE id = $1`,
    [id]
  );

  const locationsResult = await this.dbClient.query(
    `SELECT 
      ST_Y(position::geometry) as latitude,
      ST_X(position::geometry) as longitude,
      speed,
      created_at
    FROM driver_locations
    WHERE trip_id = $1
    ORDER BY created_at ASC`,
    [id]
  );

  return {
    trip: tripResult.rows[0] || null,
    route: locationsResult.rows
  };
  }

  async update(id: number,status: UpdateTripStatusDto) {
    await this.dbClient.query(
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
    await this.dbClient.query(
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
}