import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket, WebSocketServer,OnGatewayConnection} from '@nestjs/websockets';
import { FleetService } from './fleet.service';
import { FleetEventsService } from './fleet-events.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { UseGuards} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/user/auth.service';

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

  @UseGuards(AuthService)
  @SubscribeMessage('startTrip')
  async create(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    console.log("called");
    return this.fleetService.startTrip(data,client,client.data.user.id);
  }

 
}
