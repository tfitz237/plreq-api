import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronService } from '../cron/cron.service';
import { ItiService } from '../iti/iti.service';
import { JdService } from '../jd/jd.service';
import PlexDb from '../plex/plex.db';
import { LogService } from '../shared/log/log.service';
import { TmdbService } from '../tmdb/tmdb.service';
import { MovieSubscription } from './movie-subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { TvSubscription } from './tv-subscription.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {provide: getRepositoryToken(TvSubscription), useClass: Repository},
        {provide: getRepositoryToken(MovieSubscription), useClass: Repository},
        {provide: LogService, useValue: {}},
        {provide: ItiService, useValue: {}},
        {provide: JdService, useValue: {}},
        {provide: TmdbService, useValue: {}},
        {provide: PlexDb, useValue: {}},
        {provide: CronService, useValue: { setup: () => 12345 }},
      ],
    }).compile();
    service = module.get<SubscriptionsService>(SubscriptionsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
