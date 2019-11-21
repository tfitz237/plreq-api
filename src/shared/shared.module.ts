import { Module } from '@nestjs/common';
import Configuration from './configuration/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from './log/log.entry.entity';
import { Logger } from './log/log.service';

@Module({
    imports: [TypeOrmModule.forFeature([LogEntry])],
    providers: [Configuration, Logger],
    exports: [Configuration, Logger],
})
export class SharedModule {}
