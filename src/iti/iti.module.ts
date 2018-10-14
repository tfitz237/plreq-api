import { Module } from '@nestjs/common';
import { ItiController } from './iti.controller';
import { ItiService } from './iti.service';

@Module({
  controllers: [ItiController],
  providers: [ItiService]
})
export class ItiModule {}
