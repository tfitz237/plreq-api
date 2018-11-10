import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';

describe('Subscriptions Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [SubscriptionsController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: SubscriptionsController = module.get<SubscriptionsController>(SubscriptionsController);
    expect(controller).toBeDefined();
  });
});
