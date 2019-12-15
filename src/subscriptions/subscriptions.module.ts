import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItiModule } from '../iti/iti.module';
import { JdModule } from '../jd/jd.module';
import { PlexModule } from '../plex/plex.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MovieSubscription } from './movie-subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { TvSubscription } from './tv-subscription.entity';
import { CronModule } from '../cron/cron.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TvSubscription, MovieSubscription]), 
        CronModule,
        ItiModule,
        JdModule,
        PlexModule,
        TmdbModule,
    ],
    providers: [SubscriptionsService],
    controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
