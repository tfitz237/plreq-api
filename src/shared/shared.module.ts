import { Module } from '@nestjs/common';
import Configuration from './configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from './log.entry.entity';
import { Logger } from './log.service';

@Module({
    imports: [TypeOrmModule.forFeature([LogEntry])],
    providers: [Configuration, Logger],
    exports: [Configuration, Logger]
})
export class SharedModule {}
