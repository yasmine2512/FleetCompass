import { Injectable } from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Server, Socket } from 'socket.io';
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

      client.emit('locationQueued', {
        status: 'queued',
        driverId,
      });
    } catch (err) {
      client.emit('error', {
        error: 'Server error while processing location',
      });
    }

  }

  findAll() {
    return `This action returns all fleet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fleet`;
  }

  update(id: number, updateFleetDto: UpdateFleetDto) {
    return `This action updates a #${id} fleet`;
  }

  remove(id: number) {
    return `This action removes a #${id} fleet`;
  }
}
