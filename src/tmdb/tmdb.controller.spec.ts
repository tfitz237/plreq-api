import { Test, TestingModule } from '@nestjs/testing';
import { TmdbController } from './tmdb.controller';

describe('Tmdb Controller', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [TmdbController],
    }).compile();
  });
  it('should be defined', () => {
    const controller: TmdbController = module.get<TmdbController>(TmdbController);
    expect(controller).toBeDefined();
  });
});
