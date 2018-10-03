import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JdModule } from './jd/jd.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [ JdModule, AuthModule],
  controllers: [AppController,],
})
export class AppModule {}
