import { Controller, Get, Post, Body, Put, Param, Delete,Res,Req ,UseGuards} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Response ,Request} from 'express'
import { AuthGuard } from './auth.guard';
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
  @Post('logout')
  logout(@Res({ passthrough: true }) res:Response){
    return this.userService.logout(res);
  }
 
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
  res.clearCookie('sb-access-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return { success: true };
 }
}
