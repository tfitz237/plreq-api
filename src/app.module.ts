import { Module } from '@nestjs/common';
import { TypeOrmModule} from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CronModule } from './cron/cron.module';
import { ItiModule } from './iti/iti.module';
import { JdModule } from './jd/jd.module';
import { PlexModule } from './plex/plex.module';
import { SharedModule } from './shared/shared.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { WsModule } from './ws/ws.module';
import { User } from './auth/auth.user.entity';
import { MovieSubscription } from './subscriptions/movie-subscription.entity';
import { TvEpisode } from './subscriptions/suscription.episode.entity';
import { TvSubscription } from './subscriptions/tv-subscription.entity';
import Configurations from './shared/configuration/configuration.entity';
import { LogEntry } from './shared/log/log.entry.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite3',
      entities: [
        User,
        MovieSubscription,
        TvEpisode,
        TvSubscription,
        Configurations,
        LogEntry,
      ],
      synchronize: true,
    }),
    JdModule,
    AuthModule,
    CronModule,
    ItiModule,
    SharedModule,
    WsModule,
    PlexModule,
    SubscriptionsModule,
    TmdbModule,

  ],
  controllers: [AppController],
})
export class AppModule {}
