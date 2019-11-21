import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { TmdbModule } from '../tmdb/tmdb.module';

@Module({
  imports: [AuthModule, SharedModule, TmdbModule],
  controllers: [ItiController],
  providers: [ItiService],
  exports: [ItiService],
})
export class ItiModule {}
