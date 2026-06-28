import { Injectable,CanActivate,ExecutionContext ,UnauthorizedException} from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";

@Injectable()
export class AuthService implements CanActivate {
    constructor(private readonly databaseService:DatabaseService) {}
  async canActivate(context: ExecutionContext) {

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
}