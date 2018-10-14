import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [AuthModule, SharedModule],
  controllers: [ItiController],
  providers: [ItiService]
})
export class ItiModule {}
