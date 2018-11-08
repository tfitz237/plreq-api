import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [AuthModule, SharedModule,],
  controllers: [ItiController],
  providers: [ItiService, TmdbService],
  exports: [ItiService, TmdbService]
})
export class ItiModule {}
