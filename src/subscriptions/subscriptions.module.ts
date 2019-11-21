import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ItiModule } from '../iti/iti.module';
import { JdModule } from '../jd/jd.module';
import { PlexModule } from '../plex/plex.module';
import { SharedModule } from '../shared/shared.module';
import { TmdbModule } from '../tmdb/tmdb.module';
import { MovieSubscription } from './movie-subscription.entity';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { TvSubscription } from './tv-subscription.entity';

@Module({
    imports: [ TypeOrmModule.forFeature([TvSubscription, MovieSubscription]), ItiModule, JdModule, AuthModule, SharedModule, PlexModule, TmdbModule],
    providers: [SubscriptionsService],
    controllers: [SubscriptionsController],
})
export class SubscriptionsModule {}
