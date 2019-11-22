import { Module } from '@nestjs/common';
import { TypeOrmModule} from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';
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
    ItiModule,
    SharedModule,
    WsModule,
    PlexModule,
    SubscriptionsModule,
    TmdbModule, EmailModule,
  ],
  controllers: [AppController],
  providers: [EmailService],
})
export class AppModule {}
