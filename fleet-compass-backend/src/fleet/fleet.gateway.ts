import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket, WebSocketServer,OnGatewayConnection} from '@nestjs/websockets';
import { FleetService } from './fleet.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';



@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class FleetGateway implements OnGatewayConnection{
  constructor(private readonly fleetService: FleetService){}
  @WebSocketServer()
  server!: Server;
  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('createFleet')
  async create(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    return this.fleetService.create(data,client,this.server);
  }

  @SubscribeMessage('updateFleet')
    async finich(@MessageBody() data: UpdateFleetDto, @ConnectedSocket() client: Socket) {
      return
  }

  @SubscribeMessage('startTrip')
  async startTrip(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    return this.fleetService.startTrip(data,client);
  }

// @SubscribeMessage('driverLocation')
// @SubscribeMessage('driverStatusChanged')
}
