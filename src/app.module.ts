import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JdModule } from './jd/jd.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ JdModule, AuthModule],
  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule {}
