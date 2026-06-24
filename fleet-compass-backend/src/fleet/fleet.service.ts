import { Injectable } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Server, Socket } from 'socket.io';
import axios from 'axios';
import * as dotenv from 'dotenv' 
dotenv.config();
@Injectable()
export class FleetService{
  constructor(
    @InjectQueue('locationIngestion') private readonly locationQueue: Queue,
  ) {}

  async create(data: CreateFleetDto,client: Socket, server: Server) {
    try {
      const { driverId, latitude, longitude, timestamp } = data;

      if (!driverId || !latitude || !longitude) {
        return client.emit(JSON.stringify({ error: 'Invalid payload structure' }));
      }

      await this.locationQueue.add('processLocation', {
        driverId,
        latitude,
        longitude,
        timestamp: timestamp || new Date().toISOString(),
        removeOnComplete: true,
        removeOnFail: true,
      });

      client.emit('locationQueued', {   //send  data when ready
        status: 'queued',
        driverId,
      });
    } catch (err) {
      client.emit('error', {
        error: 'Server error while processing location',
      });
    }

  }

  async getRoute(coordinates: number[][]) {

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/json',
      {
        coordinates
      },
      {headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async startTrip(data: CreateFleetDto, client: Socket) {
   try {
    const coordinates = [[data.startLongitude,data.startLatitude],
    [data.destLongitude,data.destLatitude]]
    const response = await axios.post(
            'https://api.openrouteservice.org/v2/directions/driving-car/json',
            {coordinates: coordinates},
            {headers: {
                    Authorization: process.env.ORS_API_KEY,
                    'Content-Type': 'application/json'
                }});
    const geometry = response.data.routes[0].geometry;            
    
    await this.locationQueue.add('simulateTrip',
        {
            driverId: data.driverId,
            geometry,
        }
    );
    client.emit('tripStarted', {
      driverId: data.driverId,
      status: 'started',
    });

    }catch(error){
       client.emit('error', {message: 'Failed to start trip'});
    }
  }

    async findAll() {
        return `This action returns all fleet`;
      }
    
    async findOne(id: number) {
        return `This action returns a #${id} fleet`;
      }
    
    async  update(id: number, updateFleetDto: UpdateFleetDto) {
        return `This action updates a #${id} fleet`;
      }
    
    async  remove(id: number) {
        return `This action removes a #${id} fleet`;
      }

}
