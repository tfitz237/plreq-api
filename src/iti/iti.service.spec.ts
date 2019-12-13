import { Test, TestingModule } from '@nestjs/testing';
import ConfigurationService from '../shared/configuration/configuration.service';
import { Logger } from '../shared/log/log.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { ItiService } from './iti.service';

describe('ItiService', () => {
  let service: ItiService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {provide: 'CONFIG', useValue: {}},
        {provide: Logger, useValue: {}},
        {provide: ItiService, useValue: {}},
        {provide: TmdbService, useValue: {}},
      ],
    }).compile();
    service = module.get<ItiService>(ItiService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
