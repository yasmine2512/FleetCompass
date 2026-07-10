import { Global, Module } from '@nestjs/common';
import { redisConfig } from 'src/config/redis.config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis(redisConfig);
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}