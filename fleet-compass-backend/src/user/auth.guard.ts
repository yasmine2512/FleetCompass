import { Injectable,CanActivate,ExecutionContext ,UnauthorizedException} from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import * as cookie from 'cookie';

@Injectable()
export class AuthGuard implements CanActivate {
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
      const client = context.switchToWs().getClient();
      const cookies = cookie.parse(
        client.handshake.headers.cookie || ''
      );
      const token = cookies.access_token;
      if (!token)
        throw new UnauthorizedException();
      const { data, error } =
        await this.databaseService.supabase.auth.getUser(token);

      if (error || !data.user){
        console.log("No token found");
        throw new UnauthorizedException();}

      client.data.user = data.user;
      client.join(`user:${data.user.id}`);

      return true;
    }
    return false;
  }
}