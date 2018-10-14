import { Test, TestingModule } from '@nestjs/testing';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';

describe('Iti Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ItiController],
      providers: [ItiService]
    }).compile();
  });
  it('should be defined', () => {
    const controller: ItiController = module.get<ItiController>(ItiController);
    expect(controller).toBeDefined();
  });
});
