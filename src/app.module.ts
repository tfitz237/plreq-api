import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JdModule } from './jd/jd.module';
import { AuthModule } from './auth/auth.module';
import { ItiModule } from './iti/iti.module';
import { SharedModule } from './shared/shared.module';
import { WsModule } from './ws/ws.module';
import { TypeOrmModule} from '@nestjs/typeorm';
import { PlexModule } from './plex/plex.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { EmailService } from './email/email.service';
import { EmailModule } from './email/email.module';
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
    TmdbModule, EmailModule
  ],
  controllers: [AppController],
  providers: [EmailService],
})
export class AppModule {}
