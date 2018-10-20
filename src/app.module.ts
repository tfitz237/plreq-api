import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JdModule } from './jd/jd.module';
import { AuthModule } from './auth/auth.module';
import { ItiModule } from './iti/iti.module';
import { SharedModule } from './shared/shared.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [ JdModule, AuthModule, ItiModule, SharedModule, WsModule],
  controllers: [AppController],
})
export class AppModule {}
