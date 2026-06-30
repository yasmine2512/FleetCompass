import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket, WebSocketServer,OnGatewayConnection} from '@nestjs/websockets';
import { FleetService } from './fleet.service';
import { FleetEventsService } from './fleet-events.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { UseGuards} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/user/auth.guard';

@WebSocketGateway({
   cors: {
    origin: "http://localhost:5173",
    credentials: true,
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

  @UseGuards(AuthGuard)
  @SubscribeMessage('startTrip')
  async create(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    console.log("called");
    return this.fleetService.startTrip(data,client,client.data.user.id);
  }

 
}
