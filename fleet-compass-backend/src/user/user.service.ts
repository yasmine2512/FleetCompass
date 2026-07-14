import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Response } from 'express';
import { UnauthorizedException ,BadRequestException,InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CookieOptions } from 'express';
import * as nodemailer from 'nodemailer';
import * as validator from 'validator';
@Injectable()
export class UserService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly databaseService:DatabaseService){
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER!, 
        pass: process.env.GOOGLE_PASS! ,       
      },
       connectionTimeout: 10000,
       greetingTimeout: 10000,
       socketTimeout: 10000,
    });
  }
  
  async login(loginUserDto: LoginUserDto,res :Response) {

  const { data, error } =
    await this.databaseService.supabase.auth.signInWithPassword({
      email: loginUserDto.email,
      password: loginUserDto.password,
    });
    if (error) {
    throw new UnauthorizedException(error.message);
  }

  const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
};
  res.cookie('access_token',
    data.session.access_token,
    {
     ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

  res.cookie('refresh_token',
    data.session.refresh_token,
    {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

  return {
    user: data.user
  };
  }

  async signup(createUserDto: CreateUserDto,res:Response) {

    if (!validator.isEmail(createUserDto.email)) {
    throw new BadRequestException('Invalid email format.');
  }

  const domain = createUserDto.email.split('@')[1];
  const isDomainValid = await new Promise((resolve) => {
    require('dns').resolveMx(domain, (err, addresses) => {
      resolve(!err && addresses && addresses.length > 0);
    });
  });

  if (!isDomainValid) {
    throw new BadRequestException('The email domain does not exist.');
  }

const { data: userData, error: createError } = await this.databaseService.supabase.auth.admin.createUser({
    email: createUserDto.email,
    password: createUserDto.password,
    email_confirm: false,
    user_metadata: { full_name: createUserDto.fullName, fleet: createUserDto.fleet },
  });

  if (createError) throw new BadRequestException(createError.message);

  const { data: linkData, error: linkError } = await this.databaseService.supabase.auth.admin.generateLink({
    type: 'invite',
    email: createUserDto.email,
    options: { redirectTo: `${process.env.FRONTEND_URL}/confirm-processing` }
  });

  if (linkError) {
    await this.databaseService.supabase.auth.admin.deleteUser(userData.user.id);
    console.error("SMTP ERROR:", linkError);
    throw new BadRequestException(linkError.message);
  }
     try {
      await this.transporter.sendMail({
        from: '"Fleet Compass Operations" <FleetCompassDev@gmail.com>', 
        to: createUserDto.email,
        subject: '🛰️ Fleet Compass Handshake | Confirm Email',
        headers: {
        'X-Priority': '1 (Highest)',
        'X-Mailer': 'Nodemailer',
        },
        html: `
          <div style="background-color: #020617; padding: 40px; font-family: sans-serif; text-align: center; color: #94a3b8;">
            <div style="max-width: 480px; margin: 0 auto; background-color: #0f172a; border: 1px solid rgba(51, 65, 85, 0.5); border-radius: 12px; padding: 32px;">
              <h2 style="color: #e0e7ff; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase;">Security Handshake</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
                An initialization request was triggered. Verify your token below to authorize this node and establish full platform telemetry.
              </p>
              <div style="margin-bottom: 28px; display: inline-block; background: rgba(2,6,23,0.4); padding: 8px 16px; border-radius: 6px; font-size: 11px; font-family: monospace; color: #64748b;">
                <span style="display:inline-block; width:6px; height:6px; background:#34d399; border-radius:50%; margin-right:8px;"></span>
                Awaiting cryptographic verification...
              </div>
              <!-- In a pure backend flow, generate a link pointing back to your callback route -->
              <a href="${linkData.properties.action_link}" 
                 style="display: block; background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 14px 24px; border-radius: 8px; text-transform: uppercase;">
                 Confirm Connection Link
              </a>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
       console.error('Nodemailer SMTP Error:', emailError);
      await this.databaseService.supabase.auth.admin.deleteUser(userData.user.id);
      throw new BadRequestException('Delivery failed ');
    }

  return { success: true,
    message: 'Check your inbox.'};
  }

  async setSession(body:{access_token:string,refresh_token:string},res:Response){
  if (!body.access_token || !body.refresh_token) {
      return res.status(400).send({ message: 'Missing tokens' });
    }
    res.cookie('access_token', body.access_token, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    });
    res.cookie('refresh_token', body.refresh_token, { 
      httpOnly: true, 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    });
    return res.status(200).send({ success: true, message: 'Telemetry session locked.' });
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
          full_name: updateDto.fullName,
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
async resetPassword(email:string){
if (!email) throw new BadRequestException('Email is required');

     const { data, error } = await this.databaseService.supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password1`,
    },
  });
  if (error || !data?.properties?.action_link) {
    throw new BadRequestException(
      error?.message || "Failed to generate recovery link"
    );
  }
try{
  await this.transporter.sendMail({
  from: '"Fleet Compass Operations" <FleetCompassDev@gmail.com>',
  to: email,
  subject: "🔐 Fleet Compass | Password Recovery",
  headers: {
    "X-Priority": "1 (Highest)",
    "X-Mailer": "Nodemailer",
  },
  html: `
  <div style="background-color:#020617;padding:40px;font-family:sans-serif;text-align:center;color:#94a3b8;">
    <div style="max-width:480px;margin:0 auto;background:#0f172a;border:1px solid rgba(51,65,85,.5);border-radius:12px;padding:32px;">

      <h2 style="color:#e0e7ff;font-size:14px;letter-spacing:.15em;text-transform:uppercase;">
        Password Recovery
      </h2>

      <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin-bottom:24px;">
        A password reset request was received for your Fleet Compass account.
        If you initiated this request, use the secure recovery link below to choose a new password.
      </p>

      <div style="margin-bottom:28px;display:inline-block;background:rgba(2,6,23,.4);padding:8px 16px;border-radius:6px;font-size:11px;font-family:monospace;color:#64748b;">
        <span style="display:inline-block;width:6px;height:6px;background:#facc15;border-radius:50%;margin-right:8px;"></span>
        Secure recovery session initialized...
      </div>

      <a href="${data.properties.action_link}"
        style="display:block;background:linear-gradient(90deg,#6366f1 0%,#8b5cf6 100%);
        color:white;text-decoration:none;font-size:12px;font-weight:700;
        padding:14px 24px;border-radius:8px;text-transform:uppercase;">
        Reset Password
      </a>

      <p style="margin-top:24px;font-size:12px;color:#64748b;line-height:1.6;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will remain unchanged.
      </p>

    </div>
  </div>
  `,});
  return {message:"succes"}
}catch (mailError) {
    throw new BadRequestException("Failed to send recovery email");
  }
} 

async googleLogin( res: Response){
const { data, error } = 
await this.databaseService.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.BACKEND_URL}/api/user/callback`,
      },
    });
    if (error) throw new BadRequestException(error.message);
    return res.redirect(data.url);
}

async handleCallback(code:string,res:Response){
if (!code) throw new BadRequestException('Exchange code missing');
    const { data, error } = await this.databaseService.supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) throw new BadRequestException('Failed to exchange code for session');

    const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  };
  res.cookie('access_token',
    data.session.access_token,
    {
     ...cookieOptions,
    maxAge: data.session.expires_in * 1000,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/App`);
}

async testMail(){
  console.log("hello");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  try{
  console.log("GOOGLE_USER:", process.env.GOOGLE_USER);
  console.log(
  "GOOGLE_PASS exists:",
  !!process.env.GOOGLE_PASS,
  "length:",
  process.env.GOOGLE_PASS?.length
);
  await this.transporter.verify();
  console.log("SMTP OK");
  await this.transporter.sendMail({
    from: process.env.GOOGLE_USER,
    to: process.env.GOOGLE_USER,
    subject: "Test",
    text: "Hello from Render",
  });

  return "sent";}
  catch(error){
    console.log(error);
  }
}
}
