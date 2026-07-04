import { Injectable ,UnauthorizedException ,NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Socket } from 'socket.io';
import axios from 'axios';
import { CreateFleetDto } from './dto/create-fleet.dto';
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
    try {
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
    }catch (error: any) {
  if (error.response) {
   if (error.response) {
      const orsStatus = error.response.status;
      const orsData = error.response.data;
      
      if (orsStatus === 404 || (orsData.error && orsData.error.code === 2010)) {
        throw new Error('INVALID_ROUTING_POINTS');
      }
    }
    throw new Error('ROUTING_SERVICE_FAILED');
  }
}
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
      const coordinates = [
        [data.startLongitude, data.startLatitude],
        [data.destLongitude, data.destLatitude],
      ];

      await this.routeQueue.add('generateRoute', {
        id: id,
        driverId: data.driverId,
        orderName: data.orderName,
        clientId: client.id,
        coordinates: coordinates,
      }, {
        removeOnComplete: true,
        removeOnFail: true,
      });
    } catch (error) {
      console.error(error);

      this.fleetEventsService.emitToRoom(`user:${id}`,'error', {
        message: 'Failed to start trip',
      });
    }
  }

async findAll(userId: string, page: number = 1, limit: number = 8, 
  status?: string,search?: string) {
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.max(1, limit);
  const offset = (validatedPage - 1) * validatedLimit;
  
  const queryParams: any[] = [userId];
  let filterSql = `WHERE t.user_id = $1`;
  
  if (status && status.trim() !== "") {
    queryParams.push(status);
    filterSql += ` AND t.status = $${queryParams.length}`;
  }
  if (search && search.trim() !== "") {
    queryParams.push(`%${search.trim()}%`);
    filterSql += ` AND (t.order_name ILIKE $${queryParams.length} OR d.name ILIKE $${queryParams.length})`;
  }
  const countQuery = `
    SELECT COUNT(*) as total
    FROM trips t
    LEFT JOIN drivers d ON d.id = t.driver_id
    ${filterSql};
  `;
  const countResult = await this.databaseService.pool.query(countQuery, queryParams);
  
  const totalRecords = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(totalRecords / validatedLimit);
  queryParams.push(validatedLimit);
  const limitIndex = queryParams.length;
  
  queryParams.push(offset);
  const offsetIndex = queryParams.length;
  
  const mainQuery = `
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
    ${filterSql}
    ORDER BY t.started_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;
  const result = await this.databaseService.pool.query(mainQuery, queryParams);
  return {
    data: result.rows,
    pagination: {
      totalRecords,
      totalPages,
      currentPage: validatedPage,
      limit: validatedLimit
    }
  };
}


  async remove(id: number,userId:string) {
    const result = await this.databaseService.pool.query(
    `
    DELETE FROM trips
    WHERE id = $1
      AND user_id = $2
    RETURNING *;
    `,
    [id, userId],
  );
  if (result.rowCount === 0) {
    throw new NotFoundException(
      "Trip not found or you don't have permission to delete it",
    );
  }
  return {
    message: "Trip deleted successfully",
  };
  }
  async removeDriver(id: number,userId:string) {
    const result = await this.databaseService.pool.query(
    `
    DELETE FROM drivers
    WHERE id = $1
      AND user_id = $2
    RETURNING *;
    `,
    [id, userId],
  );

  if (result.rowCount === 0) {
    throw new NotFoundException(
      "Driver not found or you don't have permission to delete it",
    );
  }

  return {
    message: "Driver deleted successfully",
  };
  }

  async createDriver(name : string,phone:string ,user_id :string ){
     const client = await this.databaseService.pool.connect();
  try {
    await client.query("BEGIN");
    const driverRes = await client.query(
      `
      INSERT INTO drivers (name,phone_number, status, user_id)
      VALUES ($1,$2,'Idle', $3)
      RETURNING id, name, status
      `,
      [name,phone, user_id]
    );
    const driver = driverRes.rows[0];
    const lat = 40.7128 + (Math.random() - 0.5) * 0.05;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.05;
    await client.query(
      `
      INSERT INTO driver_locations (driver_id, position, speed)
      VALUES (
        $1,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        0
      )`,
      [driver.id, lng, lat]
    );

    await client.query("COMMIT");
    this.fleetEventsService.emitToRoom(`user:${user_id}`,'driverCreated', {driver,lng,lat});
    return { success: true, driver:driver };
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
    d.phone_number,
    d.status,

    ST_Y(dl.position::geometry) AS lat,
    ST_X(dl.position::geometry) AS lng,
    COALESCE(dl.speed, 0) AS speed,

    t.trip_id,
    t.order_name,
    t.trip_status

    FROM drivers d

    LEFT JOIN LATERAL (
        SELECT
            position,
            speed
        FROM driver_locations
        WHERE driver_id = d.id
        ORDER BY created_at DESC
        LIMIT 1
    ) dl ON TRUE

    LEFT JOIN LATERAL (
        SELECT
            id AS trip_id,
            order_name,
            status AS trip_status
        FROM trips
        WHERE driver_id = d.id
          AND status = 'Ongoing'
        ORDER BY started_at DESC
        LIMIT 1
    ) t
    ON d.status = 'En Route'
    WHERE d.user_id = $1
    ORDER BY d.id;`,
      [user_id]
    )
    return result.rows;
  }

async findOne(tripId: number, userId: string) {
  const result = await this.databaseService.pool.query(
    `SELECT 
      json_agg(
        json_build_array(
          ST_Y(dp.geom), 
          ST_X(dp.geom)
        )
        ORDER BY dp.path[1]
      ) AS coordinates
    FROM (
      SELECT 
        (ST_DumpPoints(t.route)).path AS path,
        (ST_DumpPoints(t.route)).geom AS geom
      FROM trips t
      WHERE t.id = $1 
        AND t.user_id = $2
    ) dp;`,
    [tripId, userId],
  );
  const coordinates = result.rows[0]?.coordinates;
  if (!coordinates) {
    throw new NotFoundException('Trip or route data not found');
  }
  return coordinates;
}
}