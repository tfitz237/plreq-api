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

@Module({
  imports: [
    TypeOrmModule.forRoot(),
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
