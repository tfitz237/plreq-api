import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../auth/auth.roles';
import { TmdbController } from './tmdb.controller';
import { TmdbService } from './tmdb.service';

describe('Tmdb Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [TmdbController],
      providers: [{provide: TmdbService, useValue: {}}],
    }).overrideGuard(RolesGuard).useValue({canActivate: () => true}).compile();
  });
  it('should be defined', () => {
    const controller: TmdbController = module.get<TmdbController>(TmdbController);
    expect(controller).toBeDefined();
  });
});
