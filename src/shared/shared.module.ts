import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Configurations from './configuration/configuration.entity';
import ConfigurationService from './configuration/configuration.service';
import { LogEntry } from './log/log.entry.entity';
import { Logger } from './log/log.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([LogEntry, Configurations])],
    providers: [ConfigurationService, Logger],
    exports: [ConfigurationService, Logger],
})
export class SharedModule {}
