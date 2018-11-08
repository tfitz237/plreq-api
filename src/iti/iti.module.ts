import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TvSubscription } from './iti.tv.subscription.entity';
import { TmdbService } from './tmdb.service';

@Module({
  imports: [AuthModule, SharedModule, TypeOrmModule.forFeature([TvSubscription])],
  controllers: [ItiController],
  providers: [ItiService, TmdbService],
  exports: [ItiService]
})
export class ItiModule {}
