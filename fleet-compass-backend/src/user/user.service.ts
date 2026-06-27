import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Response } from 'express';
import { UnauthorizedException ,BadRequestException } from '@nestjs/common';
@Injectable()
export class UserService {
  private dbClient: pg.Client;
  private supabase: SupabaseClient;

  constructor(){
  this.dbClient = new pg.Client({
        connectionString: process.env.DATABASE_URL,
      });
  this.dbClient.connect(); 
  this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    }
  
      
  async login(loginUserDto: LoginUserDto,res :Response) {

  const { data, error } =
    await this.supabase.auth.signInWithPassword({
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
    await this.supabase.auth.signUp({
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
}
