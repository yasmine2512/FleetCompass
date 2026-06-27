import { Controller, Get, Post, Body, Patch, Param, Delete,Res } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import type { Response } from 'express'
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
}
