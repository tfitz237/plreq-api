import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/auth.roles';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('Subscriptions Controller', () => {
  let module: TestingModule;
  let controller: SubscriptionsController;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [{provide: SubscriptionsService, useValue: {} }],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true})
    .compile();
    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });
  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });
});
