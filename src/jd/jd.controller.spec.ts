import { Test, TestingModule } from '@nestjs/testing';
import { JdController } from './jd.controller';

describe('Jd Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [JdController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: JdController = module.get<JdController>(JdController);
    expect(controller).toBeDefined();
  });
});
