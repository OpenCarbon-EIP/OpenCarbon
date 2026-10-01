import { Controller, Get, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { Server } from 'http';
import {
  AUTH_THROTTLE_LIMIT,
  AUTH_THROTTLE_TTL,
  GLOBAL_THROTTLE_LIMIT,
  GLOBAL_THROTTLE_TTL,
} from 'src/utils/macros';

@Controller('test')
class ThrottleTestController {
  @Get('default')
  getDefault() {
    return { ok: true };
  }

  @Post('strict')
  @Throttle({
    default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL },
  })
  postStrict() {
    return { ok: true };
  }
}

describe('Rate limiting', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: GLOBAL_THROTTLE_TTL,
            limit: GLOBAL_THROTTLE_LIMIT,
          },
        ]),
      ],
      controllers: [ThrottleTestController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows requests up to the global limit and blocks the next one with 429', async () => {
    const server = app.getHttpServer() as Server;

    for (let i = 0; i < GLOBAL_THROTTLE_LIMIT; i++) {
      const res = await request(server).get('/test/default');
      expect(res.status).toBe(200);
    }

    const blocked = await request(server).get('/test/default');
    expect(blocked.status).toBe(429);
  }, 30000);

  it('applies a stricter per-route limit that overrides the global default', async () => {
    expect(AUTH_THROTTLE_LIMIT).toBeLessThan(GLOBAL_THROTTLE_LIMIT);

    const server = app.getHttpServer() as Server;

    for (let i = 0; i < AUTH_THROTTLE_LIMIT; i++) {
      const res = await request(server).post('/test/strict');
      expect(res.status).toBe(201);
    }

    const blocked = await request(server).post('/test/strict');
    expect(blocked.status).toBe(429);
  }, 30000);
});
