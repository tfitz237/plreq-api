import { Test, TestingModule } from '@nestjs/testing';
import { LogController } from './log.controller';
import { RolesGuard } from '../../auth/auth.roles';
import { LogService } from './log.service';

describe('Log Controller', () => {
  let controller: LogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogController],
      providers: [{ provide: LogService, useValue: {}}],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();

    controller = module.get<LogController>(LogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
