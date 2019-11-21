import { Module } from '@nestjs/common';
import Configurations from './configuration/configuration.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from './log/log.entry.entity';
import { Logger } from './log/log.service';
import ConfigurationService from './configuration/configuration.service';

@Module({
    imports: [TypeOrmModule.forFeature([LogEntry, Configurations])],
    providers: [ConfigurationService, Logger],
    exports: [ConfigurationService, Logger],
})
export class SharedModule {}
