import { Injectable ,UnauthorizedException  } from '@nestjs/common';
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
import { FleetEventsService } from './fleet-events.service';
@Injectable()
export class FleetService {

  constructor(
    private readonly databaseService:DatabaseService ,
    private readonly fleetEventsService: FleetEventsService,
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
      const driverCheck = await this.databaseService.pool.query(
      `SELECT id FROM drivers WHERE id = $1 AND user_id = $2`,
      [data.driverId, id],
    );

    if (driverCheck.rowCount === 0) {
      throw new UnauthorizedException("Driver does not belong to this user");
    }
      console.log("started");
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
          'Pending',startedAt,id,
        ],
      );
      const tripId = tripResult.rows[0].id;
      client.join(`trip:${tripId}`);

      await this.databaseService.pool.query(
      `UPDATE drivers SET status = 'En Route' 
      WHERE id = $1 AND user_id = $2`,
      [data.driverId,id]
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

      client.emit('tripRequested', { tripId, status: 'Pending' });
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
      SELECT 
      t.id,
      t.driver_id,
      d.name AS driver_name,
      t.order_name,
      t.status,
      t.started_at,
      t.ended_at,
      t.duration_seconds
    FROM trips t
    LEFT JOIN drivers d ON d.id = t.driver_id
    WHERE t.user_id = $1
    ORDER BY t.started_at DESC;
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


  async createDriver(name : string ,user_id :string ){
     const client = await this.databaseService.pool.connect();
  try {
    await client.query("BEGIN");

    // 1. create driver
    const driverRes = await client.query(
      `
      INSERT INTO drivers (name, status, user_id)
      VALUES ($1, 'Idle', $2)
      RETURNING id, name, status
      `,
      [name, user_id]
    );

    const driver = driverRes.rows[0];

    // 2. random position (NYC example or your map area)
    const lat = 40.7128 + (Math.random() - 0.5) * 0.05;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.05;

    await client.query(
      `
      INSERT INTO driver_locations (driver_id, position, speed)
      VALUES (
        $1,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        0
      )
      `,
      [driver.id, lng, lat]
    );

    await client.query("COMMIT");
    this.fleetEventsService.emit('driverCreated', driver);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  }


  async findAllDrivers(user_id : string){
   const result = await this.databaseService.pool.query(
      ` SELECT 
      d.id,
      d.name,
      d.status,
      ST_Y(dl.position::geometry) AS lat,
      ST_X(dl.position::geometry) AS lng,
      dl.speed,

      CASE 
        WHEN d.status = 'EN ROUTE' THEN t.trip_id 
        ELSE NULL 
      END AS trip_id,

      CASE 
        WHEN d.status = 'EN ROUTE' THEN t.order_name 
        ELSE NULL 
      END AS order_name,

      CASE 
        WHEN d.status = 'EN ROUTE' THEN t.trip_status 
        ELSE NULL 
      END AS trip_status

    FROM drivers d

    LEFT JOIN LATERAL (
      SELECT position, speed
      FROM driver_locations dl
      WHERE dl.driver_id = d.id
      ORDER BY dl.created_at DESC
      LIMIT 1
    ) dl ON true

    LEFT JOIN LATERAL (
      SELECT 
        id AS trip_id,
        order_name,
        status AS trip_status
      FROM trips
      WHERE driver_id = d.id
        AND status = 'ONGOING'
      ORDER BY started_at DESC
      LIMIT 1
    ) t ON d.status = 'EN_ROUTE'

    WHERE d.user_id = $1`,
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
       AND t.status = 'Ongoing' AND t.user_id = $2
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
    WHERE t.status = 'Ongoing' AND t.user_id = $1
    ORDER BY dl.driver_id, dl.created_at DESC
  `,[user_id]);
  return result.rows;
}
}