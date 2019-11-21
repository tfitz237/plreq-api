import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Configurations from './configuration/configuration.entity';
import ConfigurationService from './configuration/configuration.service';
import { LogEntry } from './log/log.entry.entity';
import { Logger } from './log/log.service';

@Module({
    imports: [TypeOrmModule.forFeature([LogEntry, Configurations])],
    providers: [ConfigurationService, Logger],
    exports: [ConfigurationService, Logger],
})
export class SharedModule {}
