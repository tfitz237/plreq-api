import { Module, HttpModule } from '@nestjs/common';
import { TmdbModule } from '../tmdb/tmdb.module';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';

@Module({
  imports: [TmdbModule, HttpModule],
  controllers: [ItiController],
  providers: [ItiService],
  exports: [ItiService],
})
export class ItiModule {}
