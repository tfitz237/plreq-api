import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../auth/auth.roles';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';

describe('Iti Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [ItiController],
      providers: [{provide: ItiService, useValue: {}}],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();
  });
  it('should be defined', () => {
    const controller: ItiController = module.get<ItiController>(ItiController);
    expect(controller).toBeDefined();
  });
});
