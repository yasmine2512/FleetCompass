import { Injectable,CanActivate,ExecutionContext ,UnauthorizedException} from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import * as cookie from 'cookie';

@Injectable()
export class AuthService implements CanActivate {
    constructor(private readonly databaseService:DatabaseService) {}
  async canActivate(context: ExecutionContext) {

    if (context.getType() === 'http') {

    const req = context.switchToHttp().getRequest();

    const token = req.cookies.access_token;

    if (!token)
      throw new UnauthorizedException();

    const { data, error } =
      await this.databaseService.supabase.auth.getUser(token);

    if (error)
      throw new UnauthorizedException();

    req.user = data.user;

    return true;
  }
    if (context.getType() === 'ws') {
        console.log("WS guard executed");
      const client = context.switchToWs().getClient();
        console.log("Handshake headers:", client.handshake.headers);
      const cookies = cookie.parse(
        client.handshake.headers.cookie || ''
      );
      console.log("Cookies:", cookies);
      const token = cookies.access_token;

      if (!token)
        throw new UnauthorizedException();
      console.log("Token:", token);
      const { data, error } =
        await this.databaseService.supabase.auth.getUser(token);

      if (error || !data.user){
        console.log("No token found");
        throw new UnauthorizedException();}

      client.data.user = data.user;

      return true;
    }
    return false;
  }
}