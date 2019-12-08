import { Test, TestingModule } from '@nestjs/testing';
import ConfigurationService from '../shared/configuration/configuration.service';
import { TmdbService } from './tmdb.service';

describe('TmdbService', () => {
  let service: TmdbService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TmdbService, {provide: ConfigurationService, useValue: {}}],
    }).compile();
    service = module.get<TmdbService>(TmdbService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
