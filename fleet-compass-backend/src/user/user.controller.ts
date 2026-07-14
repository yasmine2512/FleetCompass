import { Controller, Get, Post, Body, Put, Param, Delete,Res,Req ,UseGuards,Query,BadRequestException} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Response ,Request} from 'express'
import { AuthGuard } from './auth.guard';
import { Throttle } from '@nestjs/throttler';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}


  @Get("test-email")
  testEmail() {
  console.log("Controller reached");
  // return this.userService.testMail();
  return "I AM RUNNING";
}
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto,
@Res({ passthrough: true }) res: Response) {
    return this.userService.login(loginUserDto,res);
  }

  @Post('signup')
  signup(@Body() createUserDto:CreateUserDto,
@Res({ passthrough: true }) res: Response) {
    return this.userService.signup(createUserDto,res);
  }
  @Throttle({ default: { limit: 1, ttl: 60 } })
  @Post('set-session')
  async confirmEmail(@Body() body: { access_token: string; refresh_token: string }, 
    @Res() res: Response) {
    return this.userService.setSession(body,res)
  }


@Get('oauth')
googleLogin(@Res() res: Response) {
  return this.userService.googleLogin(res);
}

@Get('callback')
callback(@Query('code') code: string,@Res() res: Response){
  return this.userService.handleCallback(code,res);
}


@Post('reset-password')
@Throttle({ default: { limit: 1, ttl: 120 } })
resetPassword(@Body('email') email: string) {
  return this.userService.resetPassword(email);
}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
  @Post('logout')
  logout(@Res({ passthrough: true }) res:Response){
    return this.userService.logout(res);
  }

 @Throttle({ default: { limit: 2, ttl: 60 } })
  @Put('update-profile')
  @UseGuards(AuthGuard)
  updateUser(@Req() req: Request,@Body() updateDto : UpdateUserDto) {
    return this.userService.updateMetadata(req.user!.id,updateDto)
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: Request) {return req.user;}

 @Delete()
 @UseGuards(AuthGuard)
 async deleteUser(@Req() req: Request,@Res({ passthrough: true }) res: Response){
  await this.userService.deleteProfile(req.user!.id);
  res.clearCookie('access_token',{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
 });
  res.clearCookie('refresh_token',{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
 });
    return { success: true };
 }
}
