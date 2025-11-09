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
        expect(res.body).toHaveProperty('cards');
        expect(res.body).toHaveProperty('monthlyGrowth');
        expect(res.body).toHaveProperty('userDistribution');
      });
  });
});
