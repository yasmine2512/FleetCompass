import { NestFactory} from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());
  app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
