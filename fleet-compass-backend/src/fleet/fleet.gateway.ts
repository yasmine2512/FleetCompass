import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket, WebSocketServer,OnGatewayConnection} from '@nestjs/websockets';
import { FleetService } from './fleet.service';
import { FleetEventsService } from './fleet-events.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UseGuards} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthGuard } from 'src/user/auth.guard';
import { Throttle } from '@nestjs/throttler';


@WebSocketGateway({
   cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class FleetGateway implements OnGatewayConnection{
  constructor(private readonly fleetService: FleetService,
    private readonly fleetEventsService: FleetEventsService,
  ){}
  @WebSocketServer()
  server!: Server;

@UseGuards(AuthGuard)
@SubscribeMessage('connectionInit')
handleConnectionInit(@ConnectedSocket() client: Socket) {
  const userId = client.data.user.id;
  client.join(`user:${userId}`);
  console.log(`Re-connected user ${userId} automatically rejoined room after refresh.`);
  return { status: 'synchronized' };
}

  afterInit() {
    this.fleetEventsService.setServer(this.server);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 2, ttl: 60 } })
  @SubscribeMessage('startTrip')
  async create(@MessageBody() data: CreateFleetDto, @ConnectedSocket() client: Socket) {
    const userId = client.data.user.id;
    return this.fleetService.startTrip(data,client,userId);
  }

@UseGuards(AuthGuard)
@SubscribeMessage('AddDriver')
async handleAddDriver(
  @MessageBody() data: { name: string; phone: string },
  @ConnectedSocket() client: Socket
) {
  const userId = client.data.user.id;
  return this.fleetService.createDriver(data.name, data.phone, userId);
}

 
}
