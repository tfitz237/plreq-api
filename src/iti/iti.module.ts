import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ItiController],
  providers: [ItiService]
})
export class ItiModule {}
