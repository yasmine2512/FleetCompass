import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Response } from 'express';
import { UnauthorizedException ,BadRequestException,InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
@Injectable()
export class UserService {


  constructor(private readonly databaseService:DatabaseService){}
  
      
  async login(loginUserDto: LoginUserDto,res :Response) {

  const { data, error } =
    await this.databaseService.supabase.auth.signInWithPassword({
      email: loginUserDto.email,
      password: loginUserDto.password,
    });
    if (error) {
    throw new UnauthorizedException(error.message);
  }

  res.cookie('access_token',
    data.session.access_token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

  res.cookie('refresh_token',
    data.session.refresh_token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

  return {
    user: data.user
  };
  }

  async signup(createUserDto: CreateUserDto,res:Response) {

   const { data, error } =
    await this.databaseService.supabase.auth.signUp({
      email: createUserDto.email,
      password: createUserDto.password,
      options: {
        data: {
          fullName: createUserDto.fullName,
          fleet: createUserDto.fleet,
        }
      }
    });

  if (error) {
    throw new BadRequestException(error.message);
  }

  if (data.session) {

    res.cookie(
      'access_token',
      data.session.access_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      }
    );

    res.cookie(
      'refresh_token',
      data.session.refresh_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      }
    );
  }

  return {
    user: data.user
  };
  }

  
  async remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async logout(res:Response){
res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  return {
    message: 'Logged out'
  };
}

async updateMetadata(userId:string,updateDto:UpdateUserDto){
  if (!userId) {
      throw new BadRequestException('Target User ID is invalid.');
    }
    const { data, error } = await this.databaseService.supabase.auth.admin.updateUserById(
      userId,
      {user_metadata: {
          fullName: updateDto.fullName,
          fleet: updateDto.fleet,
        }}
    );
    if (error) {
      throw new BadRequestException(error.message);
    }
    return {
      message: 'Profile metadata updated successfully',
      user: data.user,
    };
}

async deleteProfile(userId: string){
  const { data, error } = await 
  this.databaseService.supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Supabase profile deletion error:", error.message);
    throw new InternalServerErrorException(error.message); 
  }
 console.log("Purged User:", data.user.id);
  return {
    success: true,
    user: data.user
  };
}


}
