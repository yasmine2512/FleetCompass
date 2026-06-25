import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket, WebSocketServer,OnGatewayConnection} from '@nestjs/websockets';
import { FleetService } from './fleet.service';
import { FleetEventsService } from './fleet-events.service';
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
  constructor(private readonly fleetService: FleetService,
    private readonly fleetEventsService: FleetEventsService,
  ){}
  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.fleetEventsService.setServer(this.server);
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('startTrip')
  async create(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    return this.fleetService.startTrip(data,client);
  }

 
}
