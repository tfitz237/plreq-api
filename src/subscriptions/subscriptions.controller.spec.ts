import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../auth/auth.roles';
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
