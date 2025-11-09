import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';

describe('DashboardController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/dashboard (GET)', () => {
    return request(app.getHttpServer())
      .get('/dashboard')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('statusCode');
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('data');

        const data = res.body.data;
        expect(data).toHaveProperty('cards');
        expect(data).toHaveProperty('monthlyGrowth');
        expect(data).toHaveProperty('userDistribution');
      });
  });
});
