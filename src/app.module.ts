import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JdController } from './jd/jd.controller';
import { JdService } from './jd/jd.service';

@Module({
  imports: [],
  controllers: [AppController, JdController],
  providers: [AppService, JdService],
})
export class AppModule {}
